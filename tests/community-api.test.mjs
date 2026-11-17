import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { once } from 'node:events'
import { createPublicRouter } from '../server/community/public-router.js'
import { createAdminRouter } from '../server/community/admin-router.js'
import { rateLimit, sameOrigin, requireCommunityAdmin } from '../server/community/security.js'
import { generateToken } from '../server/jwt.js'

async function serve(t, app) {
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening')
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections() }))
  return `http://127.0.0.1:${server.address().port}`
}
const config = { feature_enabled: 1, applications_enabled: 1, rules_text: 'Rules', rules_version: '1', privacy_text: 'Privacy', privacy_version: '1', public_reporting_enabled: 0, screening_patterns: ['private rule'], notification_preferences: {} }
test('HTTP public responses never expose internal configuration, links or moderation results', async t => {
  const app = express()
  app.use('/api/community', createPublicRouter({ getSettings: async () => config,
    getDatabase: () => ({ execute: async () => [[{ id: 1, name: 'Group', status: 'ACTIVE', invite_link_encrypted: 'private', instructions: 'private' }]] }),
    submit: async () => ({ message: 'Your request has been received and will be reviewed.' }) }))
  const base = await serve(t, app)
  for (const endpoint of ['groups', 'config']) {
    const response = await fetch(`${base}/api/community/${endpoint}`)
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.doesNotMatch(await response.text(), /invite|screening_patterns|private|notification_preferences/i)
  }
  const body = { fullName: 'Example Applicant', phone: '+4917612345678', city: 'City', groupId: 1, reason: 'I want to help neighbours in this city.', rulesAccepted: true, privacyAccepted: true, rulesVersion: '1', privacyVersion: '1' }
  const response = await fetch(`${base}/api/community/join-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal(response.status, 201); assert.doesNotMatch(await response.text(), /block|risk|memberId|invite/i)
  assert.equal((await fetch(`${base}/api/community/join-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, rulesAccepted: false }) })).status, 400)
  assert.equal((await fetch(`${base}/api/community/join-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, reason: 'x'.repeat(17000) }) })).status, 413)
})
test('all community admin operation families reject unauthenticated HTTP requests before accessing DB', async t => {
  const app = express(); app.use('/api/admin/community', createAdminRouter())
  const base = await serve(t, app)
  for (const [method, endpoint] of [['GET','overview'], ['GET','administrators'], ['GET','groups'], ['POST','groups'], ['PATCH','groups/1'], ['PUT','groups/1/invite-link'],
    ['GET','join-requests/1'], ['POST','join-requests/1/decision'], ['POST','join-requests/1/rescreen'], ['GET','join-requests/1/handoff'], ['POST','join-requests/1/handoff-complete'],
    ['GET','members'], ['PATCH','members/1'], ['PATCH','memberships/1'], ['POST','reports'], ['PATCH','reports/1'], ['POST','warnings'], ['PATCH','warnings/1'],
    ['POST','blocks'], ['POST','blocks/1/unblock'], ['POST','notes'], ['GET','audit-logs'], ['PATCH','settings'], ['GET','members/1/export'], ['POST','members/1/anonymize']]) {
    const response = await fetch(`${base}/api/admin/community/${endpoint}`, { method, ...(method === 'GET' ? {} : { headers: { 'Content-Type': 'application/json' }, body: '{}' }) })
    assert.equal(response.status, 401, `${method} ${endpoint}`)
  }
})
test('origin protection and rate protection reject abusive requests', async t => {
  const app = express(); app.use(sameOrigin, rateLimit({ limit: 2 })); app.get('/', (_req, res) => res.json({ ok: true }))
  const base = await serve(t, app)
  assert.equal((await fetch(base, { headers: { Origin: 'https://attacker.invalid' } })).status, 403)
  assert.equal((await fetch(base, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403)
  assert.equal((await fetch(base)).status, 200); assert.equal((await fetch(base)).status, 200)
  const limited = await fetch(base); assert.equal(limited.status, 429); assert.ok(limited.headers.get('retry-after'))
})
test('shared-admin JWT bridge requires the original active session and never impersonates user 1', async () => {
  const previous = Object.fromEntries(['JWT_SECRET','SESSION_SECRET','ADMIN_PASSWORD'].map(key => [key, process.env[key]]))
  Object.assign(process.env, { JWT_SECRET: 'j'.repeat(40), SESSION_SECRET: 's'.repeat(40), ADMIN_PASSWORD: 'synthetic-test-password' })
  try {
    const token = generateToken(null, 'admin@portfolio.local', { actorKind: 'SHARED_ADMIN', sessionId: 'session-a' })
    const authenticate = async sessionID => {
      const req = { get: key => key === 'authorization' ? `Bearer ${token}` : undefined, sessionID, session: { admin: true } }
      let failure; await requireCommunityAdmin(req, {}, error => { failure = error }); return { req, failure }
    }
    assert.equal((await authenticate('session-b')).failure.status, 401)
    const accepted = await authenticate('session-a'); assert.equal(accepted.failure, undefined)
    assert.deepEqual(accepted.req.communityActor, { userId: null, kind: 'SHARED_ADMIN' })
  } finally { for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value }
})
