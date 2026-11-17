import jwt from 'jsonwebtoken'
import { randomBytes } from 'node:crypto'

const developmentSecret = randomBytes(32).toString('hex')
function signingSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'your-secret-key-change-in-production') return process.env.JWT_SECRET
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be configured in production')
  return developmentSecret
}

export const generateToken = (userId, email, context = {}) => {
  return jwt.sign({ userId, email, ...context }, signingSecret(), { algorithm: 'HS256', expiresIn: '7d' })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, signingSecret(), { algorithms: ['HS256'] })
  } catch (err) {
    return null
  }
}

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.user = decoded
  next()
}
