import mysql from 'mysql2/promise'

// ---- Question normalization (shared by lookup + seed) ----
// lowercase, strip punctuation, collapse whitespace — so "What's your
// experience?" and "tell me your experience" normalize consistently.
export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// FULLTEXT relevance score a fuzzy match must beat to be served from cache.
// Higher = stricter (fewer but safer cache hits). Tune to taste.
const FULLTEXT_THRESHOLD = Number(process.env.MATCH_THRESHOLD || 4)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS qa_pairs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(512) NOT NULL,
  question_norm VARCHAR(512) NOT NULL,
  answer MEDIUMTEXT NOT NULL,
  source VARCHAR(16) NOT NULL DEFAULT 'ai',
  hits INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_norm (question_norm),
  FULLTEXT KEY ft_norm (question_norm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`

let pool = null
let ready = false

export function isReady() {
  return ready
}

export function getPool() {
  return pool
}

// Connect (if DB env vars are present) and ensure the table exists.
// If anything fails, the app keeps working in AI-only mode.
export async function initDb() {
  if (!process.env.DB_HOST || !process.env.DB_NAME) {
    console.warn('ℹ️  No DB_* env vars set — running AI-only (no question cache).')
    return false
  }
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
    })
    await pool.query(SCHEMA)
    ready = true
    console.log('✅ MySQL connected — question cache active.')
    return true
  } catch (err) {
    console.error('⚠️  MySQL init failed — running AI-only:', err.message)
    pool = null
    ready = false
    return false
  }
}

// Look for a cached answer. Returns { answer, matchType } or null.
export async function findAnswer(question) {
  if (!ready) return null
  const norm = normalize(question)
  if (!norm) return null

  // 1) Exact normalized match — safest.
  const [exact] = await pool.query(
    'SELECT id, answer FROM qa_pairs WHERE question_norm = ? LIMIT 1',
    [norm],
  )
  if (exact.length) {
    await pool.query('UPDATE qa_pairs SET hits = hits + 1 WHERE id = ?', [exact[0].id])
    return { answer: exact[0].answer, matchType: 'exact' }
  }

  // 2) Fuzzy keyword match via FULLTEXT — only serve if score clears the bar.
  try {
    const [rows] = await pool.query(
      `SELECT id, answer, MATCH(question_norm) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
       FROM qa_pairs
       WHERE MATCH(question_norm) AGAINST (? IN NATURAL LANGUAGE MODE)
       ORDER BY score DESC LIMIT 1`,
      [norm, norm],
    )
    if (rows.length && rows[0].score >= FULLTEXT_THRESHOLD) {
      await pool.query('UPDATE qa_pairs SET hits = hits + 1 WHERE id = ?', [rows[0].id])
      return { answer: rows[0].answer, matchType: 'fuzzy' }
    }
  } catch {
    // FULLTEXT unavailable on some configs — fall through to a miss.
  }

  return null
}

// Save (or update) a Q&A pair. `source` is 'ai' or 'seed'.
export async function saveAnswer(question, answer, source = 'ai') {
  if (!ready) return
  const norm = normalize(question)
  if (!norm || !answer) return
  await pool.query(
    `INSERT INTO qa_pairs (question, question_norm, answer, source)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE answer = VALUES(answer), source = VALUES(source)`,
    [question.slice(0, 512), norm.slice(0, 512), answer, source],
  )
}
