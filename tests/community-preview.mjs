// Local synthetic preview only; never starts the real backend or loads .env.
import express from 'express'
import { fileURLToPath } from 'node:url'
import { createFixtureApi } from './community-fixtures.mjs'

const app = express(), fixture = createFixtureApi({ publicEnabled: true })
app.use(express.json())
app.use(['/api/community','/api/admin/community','/admin/api'], async (req, res) => {
  const response = await fixture.fetch(req.originalUrl, { method: req.method, ...(req.method !== 'GET' ? { body: JSON.stringify(req.body || {}) } : {}) })
  res.status(response.status).json(await response.json())
})
app.use(express.static(fileURLToPath(new URL('../dist', import.meta.url))))
app.use((_req, res) => res.sendFile(fileURLToPath(new URL('../dist/index.html', import.meta.url))))
const server = app.listen(Number(process.env.COMMUNITY_PREVIEW_PORT || 4319), '127.0.0.1', () => console.log(`Synthetic community preview: http://127.0.0.1:${server.address().port}/community`))
process.on('SIGTERM', () => server.close())
