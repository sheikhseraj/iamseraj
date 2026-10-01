import test from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { createAnswerService } from '../server/ai-providers.js'

const messages = [{ role: 'user', content: 'Welche AWS-Projekte hast du?' }, { role: 'assistant', content: 'Ich habe AWS-Projekte.' }, { role: 'user', content: 'Erzähle mehr.' }]
const instructions = 'Answer using portfolio facts, in the visitor language.'
const both = { ANTHROPIC_API_KEY: 'test-anthropic', OPENAI_API_KEY: 'test-openai' }
const claude = create => ({ messages: { create } })
const result = (text = 'OpenAI answer', status = 'completed') => Response.json({ status, output: [{ type: 'message', content: [{ type: 'output_text', text }] }] })

test('Anthropic success does not call OpenAI', async () => {
  const service = createAnswerService({ env: both, anthropicClient: claude(async (body, options) => {
    assert.deepEqual(body.messages, messages)
    assert.equal(body.system, instructions)
    assert.ok(options.signal instanceof AbortSignal)
    return { content: [{ type: 'text', text: 'Claude answer' }], stop_reason: 'end_turn' }
  }), fetchImpl: () => assert.fail('Fallback must not be called') })
  assert.equal(await service.answer(messages, instructions), 'Claude answer')
})

for (const failure of [401, 429, 500, 'timeout']) {
  test(`Anthropic ${failure} falls back with full context`, async () => {
    let calls = 0
    const service = createAnswerService({ env: { ...both, OPENAI_MODEL: 'configured-model' },
      anthropicClient: claude(async () => { throw new Error(String(failure)) }),
      fetchImpl: async (url, options) => {
        calls++
        assert.equal(url, 'https://api.openai.com/v1/responses')
        assert.equal(options.headers.Authorization, 'Bearer test-openai')
        assert.ok(options.signal instanceof AbortSignal)
        const body = JSON.parse(options.body)
        assert.deepEqual(body.input, messages)
        assert.equal(body.instructions, instructions)
        assert.equal(body.model, 'configured-model')
        assert.equal(body.store, false)
        return result()
      },
    })
    assert.equal(await service.answer(messages, instructions), 'OpenAI answer')
    assert.equal(calls, 1)
  })
}

test('OpenAI works when Anthropic has no key', async () => {
  const service = createAnswerService({ env: { OPENAI_API_KEY: 'test' }, fetchImpl: async () => result() })
  assert.equal(service.hasKey(), true)
  assert.equal(await service.answer(messages, instructions), 'OpenAI answer')
})

for (const response of [{ content: [], stop_reason: 'end_turn' }, { content: [{ type: 'text', text: 'partial' }], stop_reason: 'max_tokens' }]) {
  test(`Anthropic empty or truncated answer (${response.stop_reason}) uses fallback`, async () => {
    const service = createAnswerService({ env: both, anthropicClient: claude(async () => response), fetchImpl: async () => result() })
    assert.equal(await service.answer(messages, instructions), 'OpenAI answer')
  })
}

for (const fallback of [() => new Response('private error details', { status: 401 }), () => result(''), () => result('partial', 'incomplete')]) {
  test('unusable fallback reports a safe error', async () => {
    const service = createAnswerService({ env: both, anthropicClient: claude(async () => { throw new Error('private details') }), fetchImpl: async () => fallback() })
    await assert.rejects(service.answer(messages, instructions), { message: 'No AI provider could complete the answer.' })
  })
}

test('provider timeout aborts the fallback request', async () => {
  const service = createAnswerService({ env: { OPENAI_API_KEY: 'test' }, timeoutMs: 5, fetchImpl: async (_url, { signal }) => {
    await delay(20)
    assert.equal(signal.aborted, true)
    signal.throwIfAborted()
  } })
  await assert.rejects(service.answer(messages, instructions), /No AI provider/)
})

test('no configured providers makes no network request', async () => {
  const service = createAnswerService({ env: {}, fetchImpl: () => assert.fail('No network call expected') })
  assert.equal(service.hasKey(), false)
  await assert.rejects(service.answer(messages, instructions), /No AI provider/)
})
