import { randomBytes, scrypt as deriveKey, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { getPool } from '../db.js'
import { emptyProgress } from '../../src/aws-practice/learning.mjs'

const scrypt = promisify(deriveKey)
export const sessionLifetimeMs = 14 * 24 * 60 * 60 * 1000
const saltBytes = 16
const digestBytes = 64
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }
const dummyHash = '0'.repeat(saltBytes * 2) + ':' + '0'.repeat(digestBytes * 2)
const passwordHashPattern = /^[0-9a-f]{32}:[0-9a-f]{128}$/

export async function hashPassword(password) {
  const salt = randomBytes(saltBytes)
  const digest = await scrypt(password, salt, digestBytes, scryptOptions)
  return salt.toString('hex') + ':' + digest.toString('hex')
}

export async function verifyPassword(password, hash) {
  const stored = passwordHashPattern.test(hash ?? '') ? hash : dummyHash
  const [salt, digest] = stored.split(':').map(hex => Buffer.from(hex, 'hex'))
  const actual = await scrypt(password, salt, digestBytes, scryptOptions)
  return timingSafeEqual(actual, digest) && stored !== dummyHash
}

export function makeToken() {
  return randomBytes(32).toString('hex')
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export class PracticeError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function pool() {
  const database = getPool()
  if (!database) throw new PracticeError(503, 'Account storage is unavailable. Guest practice is available.')
  return database
}

async function atomic(callback) {
  const connection = await pool().getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback().catch(() => {})
    throw error
  } finally {
    connection.release()
  }
}

function insertSession(connection, id, tokenHash) {
  return connection.execute(
    'INSERT INTO aws_practice_sessions(token_hash, account_id, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 14 DAY))',
    [tokenHash, id],
  )
}

export const accountRepository = {
  async create(username, hash, tokenHash) {
    try {
      return await atomic(async connection => {
        const [row] = await connection.execute(
          'INSERT INTO aws_practice_accounts(username, password_hash) VALUES (?, ?)', [username, hash],
        )
        await insertSession(connection, row.insertId, tokenHash)
        return { username }
      })
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') throw new PracticeError(409, 'That username is already in use.')
      throw error
    }
  },

  async find(username) {
    const [[row]] = await pool().execute(
      'SELECT id, username, password_hash AS passwordHash FROM aws_practice_accounts WHERE username = ?', [username],
    )
    return row
  },

  async login(id, tokenHash, previousTokenHash) {
    return atomic(async connection => {
      if (previousTokenHash) await connection.execute('DELETE FROM aws_practice_sessions WHERE token_hash = ?', [previousTokenHash])
      await connection.execute('DELETE FROM aws_practice_sessions WHERE expires_at <= UTC_TIMESTAMP(3) LIMIT 500')
      await insertSession(connection, id, tokenHash)
    })
  },

  async logout(tokenHash) {
    await pool().execute('DELETE FROM aws_practice_sessions WHERE token_hash = ?', [tokenHash])
  },

  async authorize(tokenHash, username) {
    const [[row]] = await pool().execute(
      'SELECT a.id FROM aws_practice_accounts a JOIN aws_practice_sessions s ON s.account_id = a.id '
      + 'WHERE s.token_hash = ? AND a.username = ? AND s.expires_at > UTC_TIMESTAMP(3)',
      [tokenHash, username],
    )
    if (!row) throw new PracticeError(401, 'Sign in to save account progress.')
  },

  async update(tokenHash, expectedUsername, change) {
    return atomic(async connection => {
      const [[row]] = await connection.execute(
        'SELECT id, username, progress FROM aws_practice_accounts WHERE id = ('
        + 'SELECT account_id FROM aws_practice_sessions WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP(3)) FOR UPDATE',
        [tokenHash],
      )
      if (!row || (expectedUsername && row.username !== expectedUsername)) {
        throw new PracticeError(401, 'Your account session changed. Sign in again to continue saving progress.')
      }
      const current = typeof row.progress === 'string' ? JSON.parse(row.progress) : row.progress ?? emptyProgress()
      const progress = change(current)
      if (progress !== current) await connection.execute(
        'UPDATE aws_practice_accounts SET progress = ?, progress_updated_at = UTC_TIMESTAMP(3) WHERE id = ?',
        [JSON.stringify(progress), row.id],
      )
      return { account: { username: row.username }, progress }
    })
  },
}
