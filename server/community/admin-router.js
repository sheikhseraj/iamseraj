import express from 'express'
import { database, settings, row, list, transaction, safeGroup, update, TABLES } from './repository.js'
import { sameOrigin, privateResponses, requireCommunityAdmin, rateLimit, communityErrors } from './security.js'
import { id, text, CommunityError } from './validation.js'
import { decide, rescreen, requestDetails } from './applications.js'
import { changeGroup, createReport, changeReport, issueWarning, revokeWarning, blockMember, unblock, changeMembership, addNote } from './moderation.js'
import { setInvite, handoff, completeHandoff } from './manual-handoff.js'
import { changeSettings } from './settings.js'
import { exportMember, anonymizeMember } from './privacy.js'
import { audit } from './audit.js'

export function createAdminRouter({ authenticate = requireCommunityAdmin, getDatabase = database, getSettings = settings } = {}) {
  const router = express.Router()
  router.use(privateResponses, sameOrigin, rateLimit({ limit: 240, windowMs: 60000 }), authenticate, express.json({ limit: '24kb' }))
  router.use((req, _res, next) => {
    if (['POST', 'PATCH', 'PUT'].includes(req.method) && (!req.is('application/json') || !req.body || Array.isArray(req.body))) throw new CommunityError(400, 'A JSON object is required')
    next()
  })
  router.get('/settings', async (_req, res) => res.json(await getSettings()))
  router.get('/administrators', async (_req, res) => {
    const [users] = await getDatabase().execute('SELECT id, name, email FROM users ORDER BY name, email')
    res.json(users)
  })
  router.patch('/settings', async (req, res) => res.json(await changeSettings(req.body, req.communityActor)))
  router.get('/overview', async (_req, res) => {
    const connection = getDatabase(), config = await getSettings(), counts = {}
    const queries = {
      groups: 'SELECT COUNT(*) AS total FROM community_groups',
      activeMembers: "SELECT COUNT(DISTINCT member_id) AS total FROM community_memberships WHERE status = 'ACTIVE'",
      pendingRequests: "SELECT COUNT(*) AS total FROM community_join_requests WHERE status IN ('PENDING','REVIEW')",
      needsReview: "SELECT COUNT(*) AS total FROM community_join_requests r LEFT JOIN community_screening_results s ON s.id = (SELECT MAX(x.id) FROM community_screening_results x WHERE x.join_request_id = r.id) WHERE r.status IN ('PENDING','REVIEW') AND (r.status = 'REVIEW' OR s.recommendation = 'REVIEW')",
      openReports: "SELECT COUNT(*) AS total FROM community_reports WHERE status IN ('OPEN','REVIEW')",
      warnedMembers: "SELECT COUNT(DISTINCT member_id) AS total FROM community_warnings WHERE status = 'ACTIVE'",
      blockedMembers: 'SELECT COUNT(DISTINCT member_id) AS total FROM community_blocks WHERE unblocked_at IS NULL'
    }
    for (const [key, sql] of Object.entries(queries)) { const [[count]] = await connection.execute(sql); counts[key] = Number(count.total) }
    const [capacity] = await connection.execute("SELECT id, name, approximate_capacity, current_member_count FROM community_groups WHERE status = 'ACTIVE' AND approximate_capacity IS NOT NULL AND current_member_count >= approximate_capacity * 0.9")
    res.json({ counts, recentRequests: await list('join-requests', { limit: 5 }, connection), recentActivity: await list('audit-logs', { limit: 10 }, connection),
      unresolvedReports: await list('reports', { status: 'OPEN', limit: 5 }, connection), groupsNearCapacity: capacity,
      dashboardNotificationsEnabled: config.notification_preferences.dashboard, applicantDelivery: 'MANUAL', aiEnabled: false })
  })
  router.post('/groups', async (req, res) => res.status(201).json(await changeGroup(null, req.body, req.communityActor)))
  router.patch('/groups/:id', async (req, res) => res.json(await changeGroup(id(req.params.id), req.body, req.communityActor)))
  router.put('/groups/:id/invite-link', async (req, res) => res.json(await setInvite(id(req.params.id), req.body, req.communityActor)))
  router.get('/join-requests/:id', async (req, res) => res.json(await requestDetails(id(req.params.id))))
  router.post('/join-requests/:id/decision', async (req, res) => res.json(await decide(id(req.params.id), req.body, req.communityActor)))
  router.post('/join-requests/:id/rescreen', async (req, res) => res.json(await rescreen(id(req.params.id), req.communityActor)))
  router.get('/join-requests/:id/handoff', async (req, res) => res.json(await handoff(id(req.params.id), req.communityActor)))
  router.post('/join-requests/:id/handoff-complete', async (req, res) => {
    if (req.body.admissionConfirmed !== true) throw new CommunityError(400, 'Confirm actual WhatsApp admission first')
    res.json(await completeHandoff(id(req.params.id), req.communityActor))
  })
  router.post('/reports', async (req, res) => res.status(201).json(await createReport(req.body, req.communityActor)))
  router.patch('/reports/:id', async (req, res) => res.json(await changeReport(id(req.params.id), req.body, req.communityActor)))
  router.post('/warnings', async (req, res) => res.status(201).json(await issueWarning(req.body, req.communityActor)))
  router.patch('/warnings/:id', async (req, res) => {
    if (req.body.status !== 'REVOKED') throw new CommunityError(400, 'Only warning revocation is supported')
    res.json(await revokeWarning(id(req.params.id), req.communityActor))
  })
  router.post('/blocks', async (req, res) => res.status(201).json(await blockMember(req.body, req.communityActor)))
  router.post('/blocks/:id/unblock', async (req, res) => res.json(await unblock(id(req.params.id), req.communityActor)))
  router.patch('/memberships/:id', async (req, res) => res.json(await changeMembership(id(req.params.id), req.body, req.communityActor)))
  router.post('/notes', async (req, res) => res.status(201).json(await addNote(req.body, req.communityActor)))
  router.patch('/members/:id', async (req, res) => {
    const memberId = id(req.params.id), data = {}
    for (const key of Object.keys(req.body)) {
      if (!['full_name', 'city'].includes(key)) throw new CommunityError(400, 'Only member name and city can be edited; moderation uses explicit actions')
      data[key] = text(req.body[key], key, key === 'city' ? 120 : 160)
    }
    res.json(await transaction(async connection => {
      const member = await row(connection, 'members', memberId, true)
      if (member.anonymized_at) throw new CommunityError(409, 'Member has been anonymized')
      await update(connection, 'members', memberId, data)
      await audit(connection, req.communityActor, 'MEMBER_UPDATED', 'MEMBER', memberId, { fields: Object.keys(data) })
      return { id: memberId }
    }))
  })
  router.get('/members/:id/export', async (req, res) => res.json(await exportMember(id(req.params.id), req.communityActor)))
  router.post('/members/:id/anonymize', async (req, res) => {
    if (req.body.confirm !== true) throw new CommunityError(400, 'Confirm anonymization explicitly')
    res.json(await anonymizeMember(id(req.params.id), req.communityActor))
  })
  router.get('/:resource', async (req, res) => {
    if (!Object.hasOwn(TABLES, req.params.resource)) throw new CommunityError(404, 'Unknown resource')
    res.json(await list(req.params.resource, req.query, getDatabase()))
  })
  router.get('/:resource/:id', async (req, res) => {
    const resource = req.params.resource
    if (!Object.hasOwn(TABLES, resource) || resource === 'audit-logs') throw new CommunityError(404, 'Unknown resource')
    const record = await row(getDatabase(), resource, id(req.params.id))
    res.json(resource === 'groups' ? safeGroup(record) : record)
  })
  router.use(communityErrors)
  return router
}
export default createAdminRouter()
