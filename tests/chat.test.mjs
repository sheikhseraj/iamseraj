import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

test('chat validates requests and reports missing AI configuration', { timeout: 90000 }, async (t) => {
  const child = spawn(process.execPath, ['server/index.js'], {
    env: { ...process.env, PORT: '4317', ANTHROPIC_API_KEY: '', OPENAI_API_KEY: '', DB_HOST: '', DB_NAME: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  t.after(() => child.kill())
  const exited = once(child, 'exit')
  child.stderr.resume()
  try {
    await new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('exit', code => reject(new Error(`Server exited: ${code}`)))
      child.stdout.on('data', chunk => { if (chunk.toString().includes('Listening on 4317')) resolve() })
    })
    const base = 'http://127.0.0.1:4317/api'
    const health = await fetch(`${base}/health`).then(r => r.json())
    assert.equal(health.ai, false)
    const post = body => fetch(`${base}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    assert.equal((await post({ messages: [] })).status, 400)
    assert.equal((await post({ messages: [{ role: 'assistant', content: 'hello' }] })).status, 400)
    const unavailable = await post({ messages: [{ role: 'user', content: 'What AWS skills do you have?' }], lang: 'en' })
    assert.equal(unavailable.status, 503)
    assert.deepEqual(await unavailable.json(), { error: 'Assistant temporarily unavailable.' })
  } finally {
    child.kill()
    await exited
  }
})

