import express from 'express'
import { generateToken } from '../server/jwt.js'

const router = express.Router()

// Middleware to check admin session
const requireAdmin = (req, res, next) => {
  if (req.session?.admin) {
    return next()
  }
  res.status(401).json({ error: 'Not authenticated' })
}

// Login API
router.post('/api/login', (req, res) => {
  const { password } = req.body
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123'

  if (password === correctPassword) {
    req.session.admin = true
    res.json({ success: true })
  } else {
    res.status(401).json({ error: 'Invalid password' })
  }
})

// Check auth API
router.get('/api/check-auth', (req, res) => {
  if (req.session?.admin) {
    res.json({ authenticated: true })
  } else {
    res.status(401).json({ authenticated: false })
  }
})

// Logout API
router.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true })
  })
})

// Generate JWT token for authenticated session
router.post('/api/get-token', requireAdmin, (req, res) => {
  try {
    const token = generateToken(1, 'admin@portfolio.local')
    res.json({ token, success: true })
  } catch (err) {
    console.error('Token generation error:', err)
    res.status(500).json({ error: 'Failed to generate token' })
  }
})

// Generate content API (calls Anthropic backend)
router.post('/api/generate', requireAdmin, async (req, res) => {
  const { mode, topics, tone } = req.body

  if (!topics || topics.length === 0) {
    return res.status(400).json({ error: 'No topics provided' })
  }

  try {
    // Call backend route to generate content
    const port = process.env.PORT || 3000
    const url = `http://127.0.0.1:${port}/api/generate-content`

    console.log(`Fetching from: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, topics, tone })
    })

    console.log(`Response status: ${response.status}`)

    const data = await response.json()

    console.log(`Response data:`, data)

    if (!response.ok) {
      console.error('API returned error:', data)
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (err) {
    console.error('Generate content error:', err.message)
    console.error('Full error:', err)
    res.status(500).json({
      error: 'Failed to generate content',
      details: err.message
    })
  }
})

// Serve admin pages
router.get('/login.html', (req, res) => {
  res.sendFile('admin/login.html', { root: '.' })
})

router.get('/dashboard.html', requireAdmin, (req, res) => {
  res.sendFile('admin/dashboard.html', { root: '.' })
})

router.get('/agent.html', requireAdmin, (req, res) => {
  res.sendFile('admin/agent.html', { root: '.' })
})

export default router
