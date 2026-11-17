import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import { once } from 'node:events'
import { createPracticeRouter } from '../server/aws-practice/router.js'
import { PracticeError } from '../server/aws-practice/accounts.js'
import { byId, practiceBank } from '../src/aws-practice/bank.mjs'
import { emptyProgress, newSession } from '../src/aws-practice/learning.mjs'

export function memoryAccountRepository() {
  const accounts = new Map()
  const sessions = new Map()
  function authenticate(token, username) {
    const row = sessions.get(token)
    if (!row || (username && username !== row.username)) throw new PracticeError(401, 'Sign in again.')
    return row
  }
  return {
    create: async (username, passwordHash, tokenHash) => {
      if (accounts.has(username)) throw new PracticeError(409, 'That username is already in use.')
      const row = { username, passwordHash, id: accounts.size + 1, progress: emptyProgress() }
      accounts.set(username, row)
      sessions.set(tokenHash, row)
      return { username }
    },
    find: async username => accounts.get(username),
    login: async (id, token, previous) => {
      sessions.delete(previous)
      sessions.set(token, [...accounts.values()].find(account => account.id === id))
    },
    logout: async token => sessions.delete(token),
    authorize: async (token, username) => authenticate(token, username),
    update: async (token, username, callback) => {
      const row = authenticate(token, username)
      row.progress = callback(row.progress)
      return { account: { username: row.username }, progress: row.progress }
    },
  }
}

test('public accounts authenticate independently and persist full learning progress across sessions', async () => {
  const app = express()
  const repository = memoryAccountRepository()
  app.use('/api/aws-practice', createPracticeRouter(repository))
  const listener = app.listen(0, '127.0.0.1')
  await once(listener, 'listening')
  const base = 'http://127.0.0.1:' + listener.address().port
  async function request(route, data, { cookie, username, origin = base, check = true } = {}) {
    const headers = { Accept: 'application/json' }
    if (data !== undefined) {
      headers['Content-Type'] = 'application/json'
      headers.Origin = origin
      if (check) headers['X-AWS-Practice'] = '1'
      if (data.type === 'import') headers['X-AWS-Practice-Import'] = '1'
    }
    if (cookie) headers.Cookie = cookie
    if (username) headers['X-AWS-Practice-Account'] = username
    const response = await fetch(base + '/api/aws-practice/' + route, {
      method: data === undefined ? 'GET' : 'POST', headers,
      body: data === undefined ? undefined : JSON.stringify(data),
    })
    return { status: response.status, json: await response.json(), cookie: response.headers.get('set-cookie'),
      cache: response.headers.get('cache-control') }
  }
  const password = 'test suite passphrase!'
  try {
    assert.equal((await request('session')).json.account, null)
    assert.equal((await request('progress', { type: 'reset' })).status, 401)
    assert.equal((await request('register', { username: 'alice', password }, { origin: 'https://external.invalid' })).status, 403)
    assert.equal((await request('register', { username: 'alice', password }, { check: false })).status, 403)
    assert.equal((await request('register', { username: 'alice', password: 'short' })).status, 400)
    const first = await request('register', { username: 'Alice', password })
    assert.equal(first.status, 201)
    assert.deepEqual(first.json.account, { username: 'alice' })
    assert.equal(first.cache, 'private, no-store')
    assert.match(first.cookie, /^aws_practice_session=[0-9a-f]{64};/)
    assert.match(first.cookie, /HttpOnly/)
    assert.match(first.cookie, /SameSite=Strict/)
    assert.notEqual((await repository.find('alice')).passwordHash, password)
    assert.equal((await request('register', { username: 'alice', password })).status, 409)
    const alice = { cookie: first.cookie.split(';')[0], username: 'alice' }
    const id = practiceBank[0].id
    const second = await request('register', { username: 'bob', password })
    const bob = { cookie: second.cookie.split(';')[0], username: 'bob' }
    assert.equal((await request('progress', { type: 'bookmark', questionId: id, saved: true }, { ...bob, username: 'alice' })).status, 401)
    assert.equal((await request('progress', { type: 'anything' }, alice)).status, 400)
    assert.equal((await request('progress', { type: 'import', progress: {} }, alice)).status, 400)

    const session = newSession('practice', [id], 'Test', Date.now(), 'test-practice')
    async function save(action) {
      const result = await request('progress', action, alice)
      assert.equal(result.status, 200)
      return result.json.progress
    }
    await save({ type: 'start', session, replaceId: null })
    await save({ type: 'select', kind: 'practice', sessionId: session.id, questionId: id, answers: byId.get(id).correctAnswers })
    await save({ type: 'grade', kind: 'practice', sessionId: session.id, questionId: id })
    await save({ type: 'finish', kind: 'practice', sessionId: session.id })
    await save({ type: 'bookmark', questionId: id, saved: true })
    await save({ type: 'bookmark', questionId: id, saved: true })
    await save({ type: 'rate', cardId: 'question:' + id, rating: 'again' })
    await save({ type: 'report', id: 'test-report', note: 'Local issue test', questionId: id })
    const current = await save({ type: 'target', value: 75 })
    assert.equal(current.attempts.length, 1)
    assert.equal(current.results.length, 1)
    assert.deepEqual(current.bookmarks, [id])
    assert.equal(current.cards['question:' + id].history.length, 1)
    assert.equal(current.reports.length, 1)
    assert.equal(current.preferences.passTarget, 75)
    assert.deepEqual((await request('session', undefined, bob)).json.progress, emptyProgress())

    assert.equal((await request('logout', {}, alice)).status, 200)
    assert.equal((await request('session', undefined, alice)).json.account, null)
    assert.equal((await request('login', { username: 'alice', password: 'wrong' })).status, 401)
    const returned = await request('login', { username: 'alice', password })
    assert.equal(returned.status, 200)
    assert.deepEqual(returned.json.progress, current)
    const imported = emptyProgress()
    imported.bookmarks = [practiceBank[1].id]
    const resumed = { username: 'alice', cookie: returned.cookie.split(';')[0] }
    assert.deepEqual((await request('progress', { type: 'import', progress: imported }, resumed)).json.progress, imported)
    assert.deepEqual((await request('progress', { type: 'reset' }, resumed)).json.progress, emptyProgress())
  } finally {
    await new Promise(resolve => listener.close(resolve))
  }
})
