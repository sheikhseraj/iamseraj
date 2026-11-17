import test from 'node:test'
import assert from 'node:assert/strict'
import { createPublicCommunityApi, normalizePublicPhone, meaningfulReason } from '../src/community/api.js'
import { normalizePhone } from '../server/community/validation.js'

test('public API requests omit admin/session credentials and do not cache application data', async () => {
  const calls = [], api = createPublicCommunityApi(async (url, options) => { calls.push({ url, options }); return Response.json({ message: 'Received' }, { status: 201 }) })
  await api.join({ fullName: 'Example Applicant', groupId: 1 })
  assert.equal(calls[0].url, '/api/community/join-requests'); assert.equal(calls[0].options.credentials, 'omit'); assert.equal(calls[0].options.cache, 'no-store')
  assert.equal(calls[0].options.headers.Authorization, undefined); assert.equal(calls[0].options.method, 'POST')
  assert.deepEqual(JSON.parse(calls[0].options.body), { fullName: 'Example Applicant', groupId: 1 })
})
test('public client reports stale-policy/rate/network failures without displaying internal server content', async () => {
  for (const status of [409,429,503]) {
    const api = createPublicCommunityApi(async () => Response.json({ error: 'Private block history must not appear' }, { status }))
    await assert.rejects(api.join({}), error => error.status === status && !error.message.includes('Private'))
  }
})
test('public phone normalization agrees with backend duplicate identifiers for international formatting', () => {
  for (const phone of ['+49 (176) 1234-5678', '0049 176 12345678', '+91 98765 43210']) assert.equal(normalizePublicPhone(phone), normalizePhone(phone))
  for (const phone of ['017612345678','+11111111111','+00 00000000','not a phone']) assert.equal(normalizePublicPhone(phone), null)
  assert.equal(meaningfulReason('aaaaaaaaaaaaaaaaaaa'), false); assert.equal(meaningfulReason('I would like to help neighbours locally.'), true)
})
