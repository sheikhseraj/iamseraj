import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { initDb, isReady, findAnswer, saveAnswer } from './db.js'
import { streamAnswer, hasKey } from './ai.js'
import adminRouter from './admin.js'
import contentAdminRouter from '../routes/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3001

if (!hasKey()) {
  console.warn(
    '\n⚠️  ANTHROPIC_API_KEY is not set — the AI fallback will error.\n' +
      '   Add it to a ".env" file: ANTHROPIC_API_KEY=sk-ant-...\n',
  )
}

const app = express()
app.use(cors())
app.use(express.json())

// Session middleware for content admin portal
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: isReady(), ai: hasKey() })
})

// AI Content Generation API
app.post('/api/generate-content', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const { mode, topics, tone } = req.body

  try {
    const { Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    const prompt = buildContentPrompt(mode, topics, tone)

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the generated content into sections
    const outputs = parseContentSections(content, mode)

    res.json(outputs)
  } catch (err) {
    console.error('Content generation error:', err)
    res.status(500).json({ error: 'Failed to generate content' })
  }
})

// Helper: Build prompt based on mode and topics
function buildContentPrompt(mode, topics, tone) {
  const topicString = topics.join(', ')

  if (mode === 'linkedin') {
    return `Generate professional content for LinkedIn about: ${topicString}. Tone: ${tone}.

Please provide:
1. A compelling LinkedIn post (3-4 paragraphs)
2. A personal connection message to send when connecting

Format each section with a header like "===LINKEDIN POST===" and "===CONNECTION MESSAGE==="`
  }

  if (mode === 'github') {
    return `Generate GitHub-related content ideas about: ${topicString}. Tone: ${tone}.

Please provide:
1. 5 GitHub project ideas or improvements
2. 10 commit message ideas for good practices

Format each section with a header like "===GITHUB IDEAS===" and "===COMMIT MESSAGES==="`
  }

  // Full Daily Pack
  return `Generate a complete content pack about: ${topicString}. Tone: ${tone}.

Please provide:
1. LinkedIn Post - A professional post (2-3 paragraphs)
2. Article - A detailed technical article (500+ words)
3. Xing German Post - The same post in German for Xing (2-3 paragraphs)
4. GitHub Ideas - 3-5 project or improvement ideas
5. Connection Message - A message to send when connecting with someone
6. Checklist - Action items or checklist related to the topic

Format each section with headers like "===LINKEDIN POST===", "===ARTICLE===", "===XING GERMAN POST===", "===GITHUB IDEAS===", "===CONNECTION MESSAGE===", "===CHECKLIST==="`
}

// Helper: Parse content sections from Claude response
function parseContentSections(content, mode) {
  const sections = {}

  if (mode === 'linkedin') {
    sections.linkedin_post = extractSection(content, 'LINKEDIN POST')
    sections.connection_message = extractSection(content, 'CONNECTION MESSAGE')
  } else if (mode === 'github') {
    sections.github_ideas = extractSection(content, 'GITHUB IDEAS')
    sections.commit_messages = extractSection(content, 'COMMIT MESSAGES')
  } else {
    // Full pack
    sections.linkedin_post = extractSection(content, 'LINKEDIN POST')
    sections.article = extractSection(content, 'ARTICLE')
    sections.xing_german_post = extractSection(content, 'XING GERMAN POST')
    sections.github_ideas = extractSection(content, 'GITHUB IDEAS')
    sections.connection_message = extractSection(content, 'CONNECTION MESSAGE')
    sections.checklist = extractSection(content, 'CHECKLIST')
  }

  return sections
}

// Helper: Extract a section from the content
function extractSection(content, sectionName) {
  const regex = new RegExp(`===${sectionName}===([\\s\\S]*?)(?=====[A-Z\\s]+===|$)`)
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}

app.post('/api/chat', async (req, res) => {
  const { messages, lang } = req.body || {}
  const language = lang === 'de' ? 'de' : 'en'
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Expected a non-empty "messages" array.' })
  }

  const clean = messages
    .slice(-20)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content }))

  const lastUser = [...clean].reverse().find((m) => m.role === 'user')
  if (!lastUser) {
    return res.status(400).json({ error: 'No user question found.' })
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')

  try {
    // 1) Try the MySQL cache first (only for standalone questions, i.e. the
    //    first turn — follow-ups depend on conversation context, so skip cache).
    const isFollowUp = clean.filter((m) => m.role === 'user').length > 1
    if (!isFollowUp) {
      const cached = await findAnswer(lastUser.content)
      if (cached) {
        res.setHeader('X-Answer-Source', cached.matchType) // exact | fuzzy
        return res.end(cached.answer)
      }
    }

    // 2) Cache miss → ask Claude, streaming the reply to the browser.
    if (!hasKey()) {
      return res.end("Sorry — the AI isn't configured yet. Please email me instead.")
    }
    res.setHeader('X-Answer-Source', 'ai')

    let full = ''
    await streamAnswer(clean, (delta) => {
      full += delta
      res.write(delta)
    }, language)
    res.end()

    // 3) Save the new Q&A for next time (fire-and-forget).
    if (!isFollowUp && full.trim()) {
      saveAnswer(lastUser.content, full.trim(), 'ai').catch((e) =>
        console.error('saveAnswer failed:', e.message),
      )
    }
  } catch (err) {
    console.error('Chat error:', err)
    if (!res.headersSent) res.status(500).json({ error: 'Something went wrong.' })
    else res.end()
  }
})

// Serve admin portal static files
app.use(express.static(path.join(__dirname, '..', 'admin')))

// Mount content admin routes (session-based)
app.use('/admin', contentAdminRouter)

// Mount database admin routes (JWT-based)
app.use('/api/admin', adminRouter)

// Serve the built React site (production). In dev, Vite serves it on :5173.
app.use(express.static(distPath))
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next()
    })
  }
  next()
})

// Start listening immediately; connect to MySQL in the background so a DB
// problem can never stop the site from serving.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`)
})

initDb().catch((e) => console.error('DB init error:', e.message))
