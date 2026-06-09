import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { initDb, isReady, findAnswer, saveAnswer } from './db.js'
import { streamAnswer, hasKey } from './ai.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3001

await initDb()

if (!hasKey()) {
  console.warn(
    '\n⚠️  ANTHROPIC_API_KEY is not set — the AI fallback will error.\n' +
      '   Add it to a ".env" file: ANTHROPIC_API_KEY=sk-ant-...\n',
  )
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: isReady(), ai: hasKey() })
})

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body || {}
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
    })
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

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
