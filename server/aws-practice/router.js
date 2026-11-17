import express from 'express'
import { accountRepository, hashPassword, hashToken, makeToken, PracticeError, sessionLifetimeMs, verifyPassword } from './accounts.js'
import { applyAction, emptyProgress, newSession, validCardId, validSession, validateProgress } from '../../src/aws-practice/learning.mjs'
import { byId, validAnswers } from '../../src/aws-practice/bank.mjs'

const cookieName = 'aws_practice_session'
const cookiePath = '/api/aws-practice'
const idPattern = /^[a-zA-Z0-9-]{1,64}$/
const userPattern = /^[a-z0-9][a-z0-9_.-]{2,31}$/
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])
const kinds = new Set(['practice', 'exam'])

function credentials(body, registering) {
  const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const password = body?.password
  if (!userPattern.test(username) || typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > 512
      || password.length < (registering ? 12 : 1)) {
    throw new PracticeError(400, registering
      ? 'Use a 3–32 character username and a password of at least 12 characters (up to 512 bytes).'
      : 'Enter a valid username and password.')
  }
  return { username, password }
}

function tokenHash(req) {
  const cookie = (req.get('cookie') ?? '').split(';').map(value => value.trim())
    .find(value => value.startsWith(cookieName + '='))?.slice(cookieName.length + 1)
  return /^[0-9a-f]{64}$/.test(cookie ?? '') ? hashToken(cookie) : null
}

function cookieOptions(req) {
  return { path: cookiePath, httpOnly: true, sameSite: 'strict', secure: req.secure || process.env.NODE_ENV === 'production' }
}

function sameOrigin(req, res, next) {
  res.set('Cache-Control', 'private, no-store')
  res.vary('Cookie')
  const origin = req.get('origin')
  const expected = process.env.AWS_PRACTICE_ORIGIN || req.protocol + '://' + req.get('host')
  if (req.get('sec-fetch-site') === 'cross-site' || (origin && origin !== expected)
      || (!safeMethods.has(req.method) && req.get('x-aws-practice') !== '1')) {
    return res.status(403).json({ error: 'Cross-site requests are not allowed.' })
  }
  next()
}

function limit({ max, key, minutes }) {
  const entries = new Map()
  const windowMs = minutes * 60_000
  return (req, res, next) => {
    const now = Date.now()
    const value = key(req)
    let entry = entries.get(value)
    if (!entry || now >= entry.until) {
      if (entries.size >= 5000) {
        for (const [id, item] of entries) if (now >= item.until) entries.delete(id)
        if (entries.size >= 5000 && !entries.has(value)) {
          res.set('Retry-After', '60')
          return res.status(429).json({ error: 'Too many account requests. Try again in a minute.' })
        }
      }
      entry = { count: 0, until: now + windowMs }
      entries.set(value, entry)
    }
    if (entry.count >= max) {
      res.set('Retry-After', String(Math.ceil((entry.until - now) / 1000)))
      return res.status(429).json({ error: 'Too many account attempts. Try again later.' })
    }
    entry.count++
    next()
  }
}

function normalizeAction(input, now) {
  function bad() { throw new PracticeError(400, 'Invalid progress update.') }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return bad()
  const q = byId.get(input.questionId)
  const type = input.type
  if (type === 'expire' || type === 'reset') return { type }
  if (type === 'import') {
    try { return { type, progress: validateProgress(input.progress) } }
    catch { return bad() }
  }
  if (type === 'bookmark' && q && typeof input.saved === 'boolean') return { type, questionId: q.id, saved: input.saved }
  if (type === 'report' && q && typeof input.note === 'string' && input.note.trim() && input.note.length <= 500
      && typeof input.id === 'string' && idPattern.test(input.id)) return { type, questionId: q.id, note: input.note, id: input.id }
  if (type === 'rate' && validCardId(input.cardId) && ['know', 'again'].includes(input.rating)) {
    return { type, cardId: input.cardId, rating: input.rating }
  }
  if (type === 'target' && Number.isInteger(input.value) && input.value >= 1 && input.value <= 100) {
    return { type, value: input.value }
  }
  if (type === 'start') {
    const candidate = input.session
    if (!candidate || !kinds.has(candidate.kind) || !validSession(candidate, candidate.kind)
        || (input.replaceId !== null && (typeof input.replaceId !== 'string' || !idPattern.test(input.replaceId)))) return bad()
    return { type, replaceId: input.replaceId,
      session: newSession(candidate.kind, candidate.ids, candidate.title, now, candidate.id) }
  }
  if (!kinds.has(input.kind) || typeof input.sessionId !== 'string' || !idPattern.test(input.sessionId)) return bad()
  const session = { type, kind: input.kind, sessionId: input.sessionId }
  if (type === 'finish') return session
  if (type === 'move' && Number.isInteger(input.index) && input.index >= 0) return { ...session, index: input.index }
  if (q && (type === 'grade' || type === 'mark')) return { ...session, questionId: q.id }
  if (type === 'select' && q && validAnswers(q, input.answers)) return { ...session, questionId: q.id, answers: input.answers }
  return bad()
}

export function createPracticeRouter(repository = accountRepository) {
  const router = express.Router()
  const ipLimit = limit({ max: 16, minutes: 15, key: req => req.ip })
  const usernameLimit = limit({ max: 12, minutes: 15, key: req => req.credentials.username })
  const authJson = express.json({ limit: '4kb' })
  const progressJson = express.json({ limit: '16kb' })
  const importJson = express.json({ limit: '26mb' })
  const progressLimit = limit({ max: 300, minutes: 1, key: req => req.ip })
  const importLimit = limit({ max: 8, minutes: 5, key: req => req.ip })
  const readCredentials = registering => (req, _res, next) => {
    req.credentials = credentials(req.body, registering)
    next()
  }

  router.use(sameOrigin)
  router.get('/session', async (req, res) => {
    const token = tokenHash(req)
    if (token) {
      try {
        const result = await repository.update(token, null, progress => applyAction(progress, { type: 'expire' }))
        return res.json(result)
      } catch (error) {
        if (error.status !== 401) throw error
        res.clearCookie(cookieName, cookieOptions(req))
      }
    }
    res.json({ account: null })
  })

  router.post('/register', ipLimit, authJson, readCredentials(true), usernameLimit, async (req, res) => {
    const { username, password } = req.credentials
    const token = makeToken()
    const account = await repository.create(username, await hashPassword(password), hashToken(token))
    res.cookie(cookieName, token, { ...cookieOptions(req), maxAge: sessionLifetimeMs })
    res.status(201).json({ account, progress: emptyProgress() })
  })

  router.post('/login', ipLimit, authJson, readCredentials(false), usernameLimit, async (req, res) => {
    const { username, password } = req.credentials
    const identity = await repository.find(username)
    if (!(await verifyPassword(password, identity?.passwordHash)) || !identity) {
      throw new PracticeError(401, 'The username or password is incorrect.')
    }
    const token = makeToken()
    const uniqueHash = hashToken(token)
    await repository.login(identity.id, uniqueHash, tokenHash(req))
    const result = await repository.update(uniqueHash, username, progress => applyAction(progress, { type: 'expire' }))
    res.cookie(cookieName, token, { ...cookieOptions(req), maxAge: sessionLifetimeMs })
    res.json(result)
  })

  router.post('/logout', async (req, res) => {
    const token = tokenHash(req)
    if (token) await repository.logout(token)
    res.clearCookie(cookieName, cookieOptions(req))
    res.json({ account: null })
  })

  router.post('/progress', progressLimit, (req, _res, next) => {
    const token = tokenHash(req)
    const username = req.get('x-aws-practice-account')
    if (!token || !userPattern.test(username ?? '')) throw new PracticeError(401, 'Sign in to save account progress.')
    req.practiceIdentity = { token, username }
    next()
  }, (req, res, next) => {
    if (req.get('x-aws-practice-import') !== '1') return progressJson(req, res, next)
    return importLimit(req, res, async error => {
      if (error) { next(error); return }
      try {
        const { token, username } = req.practiceIdentity
        await repository.authorize(token, username)
        importJson(req, res, next)
      } catch (failure) { next(failure) }
    })
  }, async (req, res) => {
    const { token, username } = req.practiceIdentity
    const now = Date.now()
    const action = normalizeAction(req.body, now)
    const result = await repository.update(token, username, progress => applyAction(progress, action, now))
    res.json({ progress: result.progress })
  })

  router.use((error, _req, res, _next) => {
    if (error instanceof PracticeError) return res.status(error.status).json({ error: error.message })
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'This progress file is too large.' })
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request contains invalid JSON.' })
    console.error('Practice account storage error:', error.code || error.name)
    return res.status(503).json({ error: 'Account storage is unavailable. Guest practice is available.' })
  })
  return router
}

export default createPracticeRouter()
