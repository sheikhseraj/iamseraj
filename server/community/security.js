import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'node:crypto'
import { getPool, isReady } from '../db.js'
import { verifyToken } from '../jwt.js'
import { CommunityError } from './validation.js'

export function sameOrigin(req, res, next) {
  const origin = req.get('origin'), expected = process.env.COMMUNITY_ORIGIN || `${req.protocol}://${req.get('host')}`
  if ((origin && origin !== expected) || req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ error: 'Cross-site requests are not allowed' })
  next()
}
export function privateResponses(_req, res, next) {
  res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff'); res.removeHeader('Access-Control-Allow-Origin'); next()
}
export function rateLimit({ limit = 10, windowMs = 3600000, key = req => req.ip, maxEntries = 10000 } = {}) {
  const buckets = new Map(), salt = randomBytes(32)
  return (req, res, next) => {
    const now = Date.now(), fingerprint = createHmac('sha256', salt).update(String(key(req))).digest('hex')
    let bucket = buckets.get(fingerprint)
    if (!bucket || bucket.reset <= now) {
      for (const [stored, value] of buckets) if (value.reset <= now) buckets.delete(stored)
      if (buckets.size >= maxEntries) return res.status(429).json({ error: 'Please try again later' })
      bucket = { count: 0, reset: now + windowMs }; buckets.set(fingerprint, bucket)
    }
    if (++bucket.count > limit) { res.set('Retry-After', String(Math.ceil((bucket.reset - now) / 1000))); return res.status(429).json({ error: 'Please try again later' }) }
    next()
  }
}
export async function requireCommunityAdmin(req, res, next) {
  try {
    const authorization = req.get('authorization')
    const token = authorization?.match(/^Bearer (\S+)$/)?.[1]
    if (authorization && !token) throw new CommunityError(401, 'Invalid administrator token')
    if (token) {
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') throw new CommunityError(503, 'Administrator security configuration is required')
      const claims = verifyToken(token)
      if (!claims) throw new CommunityError(401, 'Invalid administrator token')
      if (claims.actorKind === 'SHARED_ADMIN') {
        if (!req.session?.admin || claims.sessionId !== req.sessionID) throw new CommunityError(401, 'Administrator session expired')
        req.communityActor = { userId: null, kind: 'SHARED_ADMIN' }
      } else {
        if (!Number.isInteger(claims.userId) || claims.userId < 1 || typeof claims.email !== 'string') throw new CommunityError(401, 'Invalid administrator identity')
        if (!isReady()) throw new CommunityError(503, 'Community database unavailable')
        const [users] = await getPool().execute('SELECT id FROM users WHERE id = ? AND email = ? LIMIT 1', [claims.userId, claims.email])
        if (!users.length) throw new CommunityError(401, 'Administrator account unavailable')
        req.communityActor = { userId: users[0].id, kind: 'USER_ADMIN' }
      }
    } else if (req.session?.admin) req.communityActor = { userId: null, kind: 'SHARED_ADMIN' }
    else throw new CommunityError(401, 'Administrator authentication required')
    if (req.communityActor.kind === 'SHARED_ADMIN' && (!(process.env.SESSION_SECRET?.length >= 32) || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'admin123')) throw new CommunityError(503, 'Administrator security configuration is required')
    next()
  } catch (error) { next(error) }
}
function encryptionKey() {
  const value = process.env.COMMUNITY_ENCRYPTION_KEY || ''
  if (!/^[a-f\d]{64}$/i.test(value)) throw new CommunityError(503, 'Community invite encryption is not configured')
  return Buffer.from(value, 'hex')
}
export function encryptInvite(link) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const data = Buffer.concat([cipher.update(link, 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join('.')
}
export function decryptInvite(value) {
  if (!value) return null
  const [version, iv, tag, data] = value.split('.')
  if (version !== 'v1') throw new CommunityError(503, 'Unsupported invite encryption version')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8')
}
export function communityErrors(error, _req, res, _next) {
  if (error instanceof CommunityError) return res.status(error.status).json({ error: error.message })
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' })
  if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'Invalid JSON' })
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A conflicting record already exists' })
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Referenced record does not exist' })
  if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ECONNREFUSED') return res.status(503).json({ error: 'Community database unavailable; verify migration and configuration' })
  console.error('Community operation failed:', error.code || error.name)
  res.status(500).json({ error: 'Community operation failed' })
}
