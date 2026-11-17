import { transaction, row, insert, update, settings, history } from './repository.js'
import { audit } from './audit.js'
import { nextWarningLevel } from './screening.js'
import { CommunityError, text, id, choice, integer, boolean, CATEGORIES, LEVELS } from './validation.js'

export function groupInput(body, partial = false) {
  const result = {}, validators = {
    name: value => text(value, 'Name', 160), slug: value => {
      const slug = text(value, 'Slug', 160)
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new CommunityError(400, 'Use a lowercase hyphenated slug')
      return slug
    }, city: value => text(value, 'City', 120), description: value => text(value, 'Description', 4000),
    status: value => choice(value, ['ACTIVE', 'INACTIVE', 'ARCHIVED'], 'status'),
    is_public: value => boolean(value, 'Public visibility'), accepting_applications: value => boolean(value, 'Applications'),
    approximate_capacity: value => value === null ? null : integer(value, 'Capacity', 1, 100000),
    current_member_count: value => value === null ? null : integer(value, 'Member count', 0, 100000),
    instructions: value => text(value, 'Instructions', 4000, { optional: true }),
    invite_delivery_mode: value => choice(value, ['MANUAL'], 'invite delivery mode')
  }
  for (const [field, validate] of Object.entries(validators)) if (Object.hasOwn(body, field)) result[field] = validate(body[field])
  if (!partial) for (const field of ['name', 'slug', 'city', 'description']) if (!(field in result)) throw new CommunityError(400, `${field} is required`)
  if (Object.keys(body).some(field => !Object.hasOwn(validators, field))) throw new CommunityError(400, 'Unsupported group field')
  return result
}
export async function changeGroup(recordId, body, actor) {
  const data = groupInput(body, Boolean(recordId))
  return transaction(async connection => {
    if (recordId) { await row(connection, 'groups', recordId, true); await update(connection, 'groups', recordId, data) }
    else recordId = await insert(connection, 'groups', data)
    await audit(connection, actor, data.status === 'ARCHIVED' ? 'GROUP_ARCHIVED' : 'GROUP_SAVED', 'GROUP', recordId, { fields: Object.keys(data) })
    return { id: recordId }
  })
}
export async function createReport(body, actor = null, publicSubmission = false, pool) {
  const data = { group_id: id(body.groupId), category: choice(body.category, CATEGORIES, 'category'),
    description: text(body.description, 'Description', 4000, { min: 15 }), quoted_text: text(body.quotedText, 'Quoted text', 4000, { optional: true }),
    reported_member_id: publicSubmission ? null : body.memberId ? id(body.memberId) : null,
    reporter_contact: text(body.reporterContact, 'Reporter contact', 200, { optional: true }),
    severity: publicSubmission ? 'NORMAL' : choice(body.severity || 'NORMAL', ['NORMAL', 'HIGH', 'URGENT'], 'severity') }
  return transaction(async connection => {
    const config = await settings(connection)
    const group = await row(connection, 'groups', data.group_id)
    if (publicSubmission && (!config.feature_enabled || !config.public_reporting_enabled || !group.is_public || group.status !== 'ACTIVE')) throw new CommunityError(403, 'Public reporting is unavailable')
    if (publicSubmission && (body.privacyAccepted !== true || body.privacyVersion !== config.privacy_version)) throw new CommunityError(400, 'Acknowledge the current privacy notice')
    if (publicSubmission) { data.privacy_version = config.privacy_version; data.privacy_accepted_at = new Date() }
    if (data.reported_member_id) await row(connection, 'members', data.reported_member_id, true)
    const reportId = await insert(connection, 'reports', data)
    await audit(connection, actor, 'REPORT_CREATED', 'REPORT', reportId, { groupId: data.group_id })
    return publicSubmission ? { message: 'Your report has been received and will be reviewed.' } : { id: reportId }
  }, pool)
}
export async function changeReport(reportId, body, actor) {
  return transaction(async connection => {
    const report = await row(connection, 'reports', reportId, true), data = {}
    if ('status' in body) data.status = choice(body.status, ['OPEN', 'REVIEW', 'RESOLVED', 'DISMISSED'], 'status')
    if ('severity' in body) data.severity = choice(body.severity, ['NORMAL', 'HIGH', 'URGENT'], 'severity')
    if ('assignedUserId' in body) data.assigned_user_id = body.assignedUserId === null ? null : id(body.assignedUserId)
    if ('memberId' in body) {
      data.reported_member_id = body.memberId === null ? null : id(body.memberId)
      if (data.reported_member_id) await row(connection, 'members', data.reported_member_id, true)
    }
    if ('resolution' in body) data.resolution = text(body.resolution, 'Resolution', 2000, { optional: true })
    if (data.status) {
      if (['RESOLVED', 'DISMISSED'].includes(data.status) && !data.resolution) throw new CommunityError(400, 'Resolution is required')
      data.resolved_at = ['RESOLVED', 'DISMISSED'].includes(data.status) ? new Date() : null
    }
    await update(connection, 'reports', reportId, data)
    await audit(connection, actor, 'REPORT_UPDATED', 'REPORT', reportId, { status: data.status || report.status, fields: Object.keys(data) })
    return { id: reportId }
  })
}
export async function issueWarning(body, actor, pool) {
  const memberId = id(body.memberId), groupId = body.groupId ? id(body.groupId) : null, reportId = body.reportId ? id(body.reportId) : null
  const reason = text(body.reason, 'Warning reason', 2000)
  return transaction(async connection => {
    const member = await row(connection, 'members', memberId, true)
    if (member.anonymized_at) throw new CommunityError(409, 'Member has been anonymized')
    if (groupId) await row(connection, 'groups', groupId)
    if (reportId) {
      const report = await row(connection, 'reports', reportId)
      if (report.reported_member_id !== memberId || (groupId && report.group_id !== groupId)) throw new CommunityError(400, 'Report does not match this member/group')
    }
    const [[count]] = await connection.execute("SELECT COUNT(*) AS total FROM community_warnings WHERE member_id = ? AND group_id <=> ? AND status = 'ACTIVE'", [memberId, groupId])
    const config = await settings(connection)
    const level = body.level ? choice(body.level, LEVELS, 'warning level') : nextWarningLevel(Number(count.total), config.warning_policy)
    const warningId = await insert(connection, 'warnings', { member_id: memberId, group_id: groupId, report_id: reportId, level, reason,
      issued_by_user_id: actor.userId, actor_kind: actor.kind, issued_at: new Date() })
    if (level === 'BLOCKED') await createBlockRecord(connection, memberId, groupId, reportId, reason, actor)
    else if (!(await history(connection, memberId)).blocked) await update(connection, 'members', memberId, { status: 'WARNED' })
    await audit(connection, actor, 'WARNING_ISSUED', 'WARNING', warningId, { memberId, level })
    return { id: warningId, level }
  }, pool)
}
export async function revokeWarning(warningId, actor) {
  return transaction(async connection => {
    const warning = await row(connection, 'warnings', warningId, true)
    await row(connection, 'members', warning.member_id, true)
    await update(connection, 'warnings', warningId, { status: 'REVOKED' })
    await refreshMemberStatus(connection, warning.member_id)
    await audit(connection, actor, 'WARNING_REVOKED', 'WARNING', warningId, { memberId: warning.member_id })
    // Block records remain separate explicit decisions; revoking a warning never unblocks automatically.
    return { id: warningId, status: 'REVOKED' }
  })
}
async function createBlockRecord(connection, memberId, groupId, reportId, reason, actor) {
  if ((await history(connection, memberId)).blocked) throw new CommunityError(409, 'Member already has an active block')
  const blockId = await insert(connection, 'blocks', { member_id: memberId, originating_group_id: groupId, report_id: reportId,
    reason, blocked_by_user_id: actor.userId, actor_kind: actor.kind, blocked_at: new Date() })
  await update(connection, 'members', memberId, { status: 'BLOCKED' })
  await audit(connection, actor, 'MEMBER_BLOCKED', 'MEMBER', memberId, { status: 'BLOCKED', groupId })
  return blockId
}
export async function blockMember(body, actor) {
  const memberId = id(body.memberId), groupId = body.groupId ? id(body.groupId) : null, reportId = body.reportId ? id(body.reportId) : null
  const reason = text(body.reason, 'Block reason', 2000)
  return transaction(async connection => {
    const member = await row(connection, 'members', memberId, true)
    if (member.anonymized_at) throw new CommunityError(409, 'Member has been anonymized')
    if (groupId) await row(connection, 'groups', groupId)
    if (reportId) {
      const report = await row(connection, 'reports', reportId)
      if (report.reported_member_id !== memberId || (groupId && report.group_id !== groupId)) throw new CommunityError(400, 'Report does not match this member/group')
    }
    return { id: await createBlockRecord(connection, memberId, groupId, reportId, reason, actor) }
  })
}
export async function unblock(blockId, actor) {
  return transaction(async connection => {
    const block = await row(connection, 'blocks', blockId, true)
    const member = await row(connection, 'members', block.member_id, true)
    if (block.unblocked_at) throw new CommunityError(409, 'Block already resolved')
    await update(connection, 'blocks', blockId, { unblocked_at: new Date(), unblocked_by_user_id: actor.userId })
    if (!member.anonymized_at) await refreshMemberStatus(connection, member.id)
    await audit(connection, actor, 'MEMBER_UNBLOCKED', 'MEMBER', member.id)
    return { id: blockId }
  })
}
export async function changeMembership(membershipId, body, actor) {
  const status = choice(body.status, ['PENDING', 'ACTIVE', 'WARNED', 'BLOCKED', 'LEFT', 'REMOVED'], 'membership status')
  return transaction(async connection => {
    const membership = await row(connection, 'memberships', membershipId, true), member = await row(connection, 'members', membership.member_id, true)
    if (member.anonymized_at) throw new CommunityError(409, 'Member has been anonymized')
    if (status === 'ACTIVE' && (await history(connection, member.id)).blocked) throw new CommunityError(409, 'Resolve the active block first')
    const now = new Date()
    await update(connection, 'memberships', membership.id, { status, verified_by_user_id: actor.userId, verified_at: now,
      joined_at: status === 'ACTIVE' ? membership.joined_at || now : membership.joined_at,
      ended_at: ['LEFT', 'REMOVED'].includes(status) ? now : null })
    await refreshMemberStatus(connection, member.id)
    await audit(connection, actor, 'MEMBERSHIP_STATUS_CHANGED', 'MEMBERSHIP', membership.id, { status, previousStatus: membership.status, memberId: member.id })
    return { id: membership.id, status }
  })
}
export async function refreshMemberStatus(connection, memberId) {
  const prior = await history(connection, memberId)
  const [[counts]] = await connection.execute("SELECT SUM(status = 'ACTIVE') AS active, SUM(status = 'WARNED') AS warned, SUM(status = 'PENDING') AS pending FROM community_memberships WHERE member_id = ?", [memberId])
  const [[warnings]] = await connection.execute("SELECT COUNT(*) AS total FROM community_warnings WHERE member_id = ? AND status = 'ACTIVE'", [memberId])
  const status = prior.blocked ? 'BLOCKED' : Number(warnings.total) || Number(counts.warned) ? 'WARNED' : Number(counts.active) ? 'ACTIVE' : Number(counts.pending) ? 'PENDING' : 'LEFT'
  await connection.execute("UPDATE community_members SET status = ?, first_joined_at = IF(? > 0, COALESCE(first_joined_at, NOW()), first_joined_at) WHERE id = ?", [status, Number(counts.active), memberId])
}
export async function addNote(body, actor) {
  const targets = [['memberId', 'member_id', 'members'], ['requestId', 'join_request_id', 'join-requests'], ['reportId', 'report_id', 'reports'], ['groupId', 'group_id', 'groups']].filter(([key]) => body[key] !== undefined)
  if (targets.length !== 1) throw new CommunityError(400, 'A note must reference exactly one target')
  const [key, column, resource] = targets[0], targetId = id(body[key]), note = text(body.body, 'Note', 4000)
  return transaction(async connection => {
    await row(connection, resource, targetId, true)
    const noteId = await insert(connection, 'notes', { [column]: targetId, body: note, author_user_id: actor.userId, actor_kind: actor.kind })
    await audit(connection, actor, 'NOTE_CREATED', 'NOTE', noteId)
    return { id: noteId }
  })
}
