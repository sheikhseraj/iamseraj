import { transaction, row, safeGroup, history, update } from './repository.js'
import { decryptInvite, encryptInvite } from './security.js'
import { audit } from './audit.js'
import { CommunityError, text } from './validation.js'
import { refreshMemberStatus } from './moderation.js'

export async function setInvite(groupId, body, actor) {
  const value = text(body.inviteLink, 'Invite link', 512, { optional: true })
  if (value && !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/.test(value)) throw new CommunityError(400, 'Use a WhatsApp HTTPS group invite link')
  const encrypted = value ? encryptInvite(value) : null
  return transaction(async connection => {
    await row(connection, 'groups', groupId, true)
    await update(connection, 'groups', groupId, { invite_link_encrypted: encrypted })
    await audit(connection, actor, 'GROUP_INVITE_CHANGED', 'GROUP', groupId)
    return { id: groupId, hasInviteLink: Boolean(value) }
  })
}
export async function handoff(requestId, actor) {
  return transaction(async connection => {
    const request = await row(connection, 'join-requests', requestId, true)
    if (request.status !== 'APPROVED') throw new CommunityError(409, 'Request must be approved before handoff')
    const member = await row(connection, 'members', request.member_id, true)
    if (member.anonymized_at || (await history(connection, member.id)).blocked) throw new CommunityError(409, 'Applicant cannot receive a handoff')
    const group = await row(connection, 'groups', request.group_id)
    if (group.status !== 'ACTIVE') throw new CommunityError(409, 'Group is inactive')
    await audit(connection, actor, 'HANDOFF_VIEWED', 'JOIN_REQUEST', request.id)
    return { mode: 'MANUAL', group: safeGroup(group), phone: request.normalized_phone, fullName: request.full_name,
      inviteLink: decryptInvite(group.invite_link_encrypted), instructions: group.instructions || 'Contact the applicant manually and record admission after adding them in WhatsApp.',
      whatsappMembershipVerified: request.handoff_status === 'COMPLETED' }
  })
}
export async function completeHandoff(requestId, actor, pool) {
  return transaction(async connection => {
    const request = await row(connection, 'join-requests', requestId, true)
    if (request.status !== 'APPROVED' || request.handoff_status !== 'PENDING') throw new CommunityError(409, 'No pending approved handoff')
    const member = await row(connection, 'members', request.member_id, true)
    if (member.anonymized_at || (await history(connection, member.id)).blocked) throw new CommunityError(409, 'Applicant cannot be admitted')
    const group = await row(connection, 'groups', request.group_id)
    if (group.status !== 'ACTIVE') throw new CommunityError(409, 'Group is inactive')
    const [membershipUpdate] = await connection.execute("UPDATE community_memberships SET status = 'ACTIVE', joined_at = COALESCE(joined_at, NOW()), ended_at = NULL, verified_by_user_id = ?, verified_at = NOW() WHERE member_id = ? AND group_id = ?", [actor.userId, member.id, group.id])
    if (membershipUpdate.affectedRows !== 1) throw new CommunityError(409, 'Approved membership record is missing')
    await update(connection, 'join-requests', request.id, { handoff_status: 'COMPLETED', handoff_completed_at: new Date() })
    await refreshMemberStatus(connection, member.id)
    await audit(connection, actor, 'HANDOFF_COMPLETED', 'JOIN_REQUEST', request.id, { memberId: member.id, groupId: group.id })
    await audit(connection, actor, 'MEMBERSHIP_STATUS_CHANGED', 'MEMBER', member.id, { status: 'ACTIVE', groupId: group.id })
    return { id: request.id, handoffStatus: 'COMPLETED' }
  }, pool)
}
