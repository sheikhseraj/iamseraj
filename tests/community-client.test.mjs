import test from 'node:test'
import assert from 'node:assert/strict'
import { createCommunityApi, bootstrapAdmin, queryString, tokenExpired } from '../src/admin/community/api.js'
import { list } from '../server/community/repository.js'

test('community client includes existing bearer/session credentials and never caches private records', async () => {
  const requests = [], api = createCommunityApi('synthetic-token', null, async (url, options) => { requests.push({ url, options }); return Response.json({ id: 12 }) })
  await api.post('join-requests/12/decision', { status: 'APPROVED' })
  assert.equal(requests[0].url, '/api/admin/community/join-requests/12/decision')
  assert.equal(requests[0].options.headers.Authorization, 'Bearer synthetic-token')
  assert.equal(requests[0].options.credentials, 'same-origin'); assert.equal(requests[0].options.cache, 'no-store')
  assert.deepEqual(JSON.parse(requests[0].options.body), { status: 'APPROVED' })
})
test('expired authorization logs out; configuration errors keep a recoverable error rather than impersonating success', async () => {
  let expired = 0
  const unauthorized = createCommunityApi('test', () => expired++, async () => Response.json({ error: 'Session expired' }, { status: 401 }))
  await assert.rejects(unauthorized.get('settings'), error => error.status === 401); assert.equal(expired, 1)
  const unavailable = createCommunityApi('test', () => expired++, async () => Response.json({ error: 'Community database unavailable' }, { status: 503 }))
  await assert.rejects(unavailable.get('groups'), /Community database unavailable/); assert.equal(expired, 1)
})
test('session bootstrap reuses existing login endpoints and requires successful token issuance', async () => {
  const calls = []
  assert.equal(await bootstrapAdmin(async url => { calls.push(url); return Response.json(url.endsWith('check-auth') ? { authenticated: true } : { token: 'existing-session-token' }) }), 'existing-session-token')
  assert.deepEqual(calls, ['/admin/api/check-auth','/admin/api/get-token'])
  assert.equal(await bootstrapAdmin(async () => Response.json({}, { status: 401 })), null)
  await assert.rejects(bootstrapAdmin(async url => Response.json({}, { status: url.endsWith('check-auth') ? 200 : 500 })), /Could not open/)
})
test('client-side expiry checks and query encoding handle malformed tokens and user-supplied filters', () => {
  const token = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`
  assert.equal(tokenExpired(token(Math.floor(Date.now()/1000) + 600)), false)
  assert.equal(tokenExpired(token(1)), true); assert.equal(tokenExpired('broken'), true)
  const params = new URLSearchParams(queryString({ city: 'Berlin & Magdeburg', status: '', groupId: 2 }))
  assert.equal(params.get('city'), 'Berlin & Magdeburg'); assert.equal(params.get('groupId'), '2'); assert.equal(params.has('status'), false)
})
test('moderation lists mask joined member phones before exposing them to the admin list UI', async () => {
  const connection = { execute: async sql => sql.startsWith('SELECT COUNT') ? [[{ total: 1 }]] : [[{ id: 1, member_id: 7, member_name: 'Example Member', member_phone: '+4917612345678' }]] }
  const result = await list('blocks', {}, connection)
  assert.ok(result.items[0].member_phone.includes('*')); assert.ok(!JSON.stringify(result).includes('+4917612345678'))
})
