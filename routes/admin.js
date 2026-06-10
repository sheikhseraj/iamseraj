import express from 'express'

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

// Generate content API (calls Anthropic backend)
router.post('/api/generate', requireAdmin, async (req, res) => {
  const { mode, topics, tone } = req.body

  if (!topics || topics.length === 0) {
    return res.status(400).json({ error: 'No topics provided' })
  }

  try {
    // Call backend route to generate content
    const response = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, topics, tone })
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (err) {
    console.error('Generate content error:', err)
    res.status(500).json({ error: 'Failed to generate content' })
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
