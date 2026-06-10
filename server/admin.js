import express from 'express'
import bcrypt from 'bcrypt'
import { generateToken, verifyToken, authMiddleware } from './jwt.js'
import { getPool } from './db.js'

const router = express.Router()

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const pool = getPool()
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email])

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = users[0]
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken(user.id, user.email)
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()
    const [profiles] = await pool.query('SELECT * FROM profile LIMIT 1')
    res.json(profiles[0] || {})
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, email, phone, role_en, role_de, tagline_en, tagline_de, location_en, location_de } = req.body

  try {
    const pool = getPool()
    await pool.query(
      `UPDATE profile SET name = ?, email = ?, phone = ?, role_en = ?, role_de = ?,
       tagline_en = ?, tagline_de = ?, location_en = ?, location_de = ? WHERE id = 1`,
      [name, email, phone, role_en, role_de, tagline_en, tagline_de, location_en, location_de]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Get skills
router.get('/skills', authMiddleware, async (req, res) => {
  try {
    const pool = getPool()
    const [skills] = await pool.query('SELECT * FROM skills ORDER BY sort_order')
    res.json(skills)
  } catch (err) {
    console.error('Get skills error:', err)
    res.status(500).json({ error: 'Failed to fetch skills' })
  }
})

// Add skill
router.post('/skills', authMiddleware, async (req, res) => {
  const { group_en, group_de, items } = req.body

  try {
    const pool = getPool()
    const [result] = await pool.query(
      'INSERT INTO skills (group_en, group_de, items, sort_order) VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM skills s))',
      [group_en, group_de, JSON.stringify(items)]
    )
    res.json({ id: result.insertId, group_en, group_de, items })
  } catch (err) {
    console.error('Add skill error:', err)
    res.status(500).json({ error: 'Failed to add skill' })
  }
})

// Update skill
router.put('/skills/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { group_en, group_de, items } = req.body

  try {
    const pool = getPool()
    await pool.query(
      'UPDATE skills SET group_en = ?, group_de = ?, items = ? WHERE id = ?',
      [group_en, group_de, JSON.stringify(items), id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Update skill error:', err)
    res.status(500).json({ error: 'Failed to update skill' })
  }
})

// Delete skill
router.delete('/skills/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const pool = getPool()
    await pool.query('DELETE FROM skills WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete skill error:', err)
    res.status(500).json({ error: 'Failed to delete skill' })
  }
})

// Get blogs
router.get('/blogs', authMiddleware, async (req, res) => {
  const { lang } = req.query

  try {
    const pool = getPool()
    const query = lang ? 'SELECT * FROM blogs WHERE lang = ? ORDER BY date DESC' : 'SELECT * FROM blogs ORDER BY date DESC'
    const params = lang ? [lang] : []
    const [blogs] = await pool.query(query, params)
    res.json(blogs)
  } catch (err) {
    console.error('Get blogs error:', err)
    res.status(500).json({ error: 'Failed to fetch blogs' })
  }
})

// Add blog
router.post('/blogs', authMiddleware, async (req, res) => {
  const { lang, title, excerpt, content, category, date, published } = req.body

  try {
    const pool = getPool()
    const [result] = await pool.query(
      'INSERT INTO blogs (lang, title, excerpt, content, category, date, published) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lang, title, excerpt, content, category, date, published !== false]
    )
    res.json({ id: result.insertId, lang, title, excerpt, content, category, date, published })
  } catch (err) {
    console.error('Add blog error:', err)
    res.status(500).json({ error: 'Failed to add blog' })
  }
})

// Update blog
router.put('/blogs/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { title, excerpt, content, category, date, published } = req.body

  try {
    const pool = getPool()
    await pool.query(
      'UPDATE blogs SET title = ?, excerpt = ?, content = ?, category = ?, date = ?, published = ? WHERE id = ?',
      [title, excerpt, content, category, date, published !== false, id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Update blog error:', err)
    res.status(500).json({ error: 'Failed to update blog' })
  }
})

// Delete blog
router.delete('/blogs/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const pool = getPool()
    await pool.query('DELETE FROM blogs WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete blog error:', err)
    res.status(500).json({ error: 'Failed to delete blog' })
  }
})

// Get experience
router.get('/experience', authMiddleware, async (req, res) => {
  const { lang } = req.query

  try {
    const pool = getPool()
    const query = lang ? 'SELECT * FROM experience WHERE lang = ? ORDER BY sort_order' : 'SELECT * FROM experience ORDER BY sort_order'
    const params = lang ? [lang] : []
    const [data] = await pool.query(query, params)
    res.json(data)
  } catch (err) {
    console.error('Get experience error:', err)
    res.status(500).json({ error: 'Failed to fetch experience' })
  }
})

// Add experience
router.post('/experience', authMiddleware, async (req, res) => {
  const { lang, role, company, location, period, points } = req.body

  try {
    const pool = getPool()
    const [result] = await pool.query(
      'INSERT INTO experience (lang, role, company, location, period, points, sort_order) VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM experience))',
      [lang, role, company, location, period, JSON.stringify(points)]
    )
    res.json({ id: result.insertId, lang, role, company, location, period, points })
  } catch (err) {
    console.error('Add experience error:', err)
    res.status(500).json({ error: 'Failed to add experience' })
  }
})

// Update experience
router.put('/experience/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { role, company, location, period, points } = req.body

  try {
    const pool = getPool()
    await pool.query(
      'UPDATE experience SET role = ?, company = ?, location = ?, period = ?, points = ? WHERE id = ?',
      [role, company, location, period, JSON.stringify(points), id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Update experience error:', err)
    res.status(500).json({ error: 'Failed to update experience' })
  }
})

// Delete experience
router.delete('/experience/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const pool = getPool()
    await pool.query('DELETE FROM experience WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete experience error:', err)
    res.status(500).json({ error: 'Failed to delete experience' })
  }
})

// Get education
router.get('/education', authMiddleware, async (req, res) => {
  const { lang } = req.query

  try {
    const pool = getPool()
    const query = lang ? 'SELECT * FROM education WHERE lang = ? ORDER BY sort_order' : 'SELECT * FROM education ORDER BY sort_order'
    const params = lang ? [lang] : []
    const [data] = await pool.query(query, params)
    res.json(data)
  } catch (err) {
    console.error('Get education error:', err)
    res.status(500).json({ error: 'Failed to fetch education' })
  }
})

// Add education
router.post('/education', authMiddleware, async (req, res) => {
  const { lang, degree, school, period } = req.body

  try {
    const pool = getPool()
    const [result] = await pool.query(
      'INSERT INTO education (lang, degree, school, period, sort_order) VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM education))',
      [lang, degree, school, period]
    )
    res.json({ id: result.insertId, lang, degree, school, period })
  } catch (err) {
    console.error('Add education error:', err)
    res.status(500).json({ error: 'Failed to add education' })
  }
})

// Update education
router.put('/education/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { degree, school, period } = req.body

  try {
    const pool = getPool()
    await pool.query(
      'UPDATE education SET degree = ?, school = ?, period = ? WHERE id = ?',
      [degree, school, period, id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Update education error:', err)
    res.status(500).json({ error: 'Failed to update education' })
  }
})

// Delete education
router.delete('/education/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const pool = getPool()
    await pool.query('DELETE FROM education WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete education error:', err)
    res.status(500).json({ error: 'Failed to delete education' })
  }
})

// Get certifications
router.get('/certifications', authMiddleware, async (req, res) => {
  const { lang } = req.query

  try {
    const pool = getPool()
    const query = lang ? 'SELECT * FROM certifications WHERE lang = ? ORDER BY sort_order' : 'SELECT * FROM certifications ORDER BY sort_order'
    const params = lang ? [lang] : []
    const [data] = await pool.query(query, params)
    res.json(data)
  } catch (err) {
    console.error('Get certifications error:', err)
    res.status(500).json({ error: 'Failed to fetch certifications' })
  }
})

// Add certification
router.post('/certifications', authMiddleware, async (req, res) => {
  const { lang, name, year } = req.body

  try {
    const pool = getPool()
    const [result] = await pool.query(
      'INSERT INTO certifications (lang, name, year, sort_order) VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM certifications))',
      [lang, name, year]
    )
    res.json({ id: result.insertId, lang, name, year })
  } catch (err) {
    console.error('Add certification error:', err)
    res.status(500).json({ error: 'Failed to add certification' })
  }
})

// Update certification
router.put('/certifications/:id', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { name, year } = req.body

  try {
    const pool = getPool()
    await pool.query(
      'UPDATE certifications SET name = ?, year = ? WHERE id = ?',
      [name, year, id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Update certification error:', err)
    res.status(500).json({ error: 'Failed to update certification' })
  }
})

// Delete certification
router.delete('/certifications/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const pool = getPool()
    await pool.query('DELETE FROM certifications WHERE id = ?', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete certification error:', err)
    res.status(500).json({ error: 'Failed to delete certification' })
  }
})

export default router
