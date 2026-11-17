import express from 'express'
import { database, settings, publicGroup } from './repository.js'
import { joinRequest } from './validation.js'
import { submitApplication } from './applications.js'
import { createReport } from './moderation.js'
import { sameOrigin, privateResponses, rateLimit, communityErrors } from './security.js'

export function createPublicRouter({ getDatabase = database, getSettings = settings, submit = submitApplication } = {}) {
  const router = express.Router()
  router.use(privateResponses, sameOrigin, rateLimit({ limit: 120, windowMs: 60000 }), express.json({ limit: '16kb' }))
  router.get('/config', async (_req, res) => {
    const config = await getSettings()
    res.json({ enabled: Boolean(config.feature_enabled), applicationsEnabled: Boolean(config.feature_enabled && config.applications_enabled),
      rules: config.feature_enabled ? config.rules_text : '', rulesVersion: config.rules_version,
      privacyNotice: config.feature_enabled ? config.privacy_text : '', privacyVersion: config.privacy_version,
      publicReportingEnabled: Boolean(config.feature_enabled && config.public_reporting_enabled) })
  })
  router.get('/groups', async (_req, res) => {
    const config = await getSettings()
    if (!config.feature_enabled) return res.json([])
    const [groups] = await getDatabase().execute("SELECT id, name, slug, city, description, status, accepting_applications FROM community_groups WHERE status = 'ACTIVE' AND is_public = TRUE ORDER BY city, name")
    res.json(groups.map(publicGroup))
  })
  const phoneLimit = rateLimit({ limit: 5, key: req => req.application.normalized_phone })
  router.post('/join-requests', rateLimit(), (req, _res, next) => { req.application = joinRequest(req.body); next() }, phoneLimit, async (req, res) => {
    res.status(201).json(await submit(req.application))
  })
  router.post('/reports', rateLimit({ limit: 5 }), async (req, res) => res.status(201).json(await createReport(req.body, null, true)))
  router.use(communityErrors)
  return router
}
export default createPublicRouter()
