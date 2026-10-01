import Anthropic from '@anthropic-ai/sdk'

// Each attempt is bounded so both providers fit inside the browser's 45s timeout.
export function createAnswerService({ env = process.env, fetchImpl = globalThis.fetch, anthropicClient, timeoutMs = 18000 } = {}) {
  let client = anthropicClient
  const hasKey = () => Boolean(env.ANTHROPIC_API_KEY?.trim() || env.OPENAI_API_KEY?.trim())

  async function answer(messages, system) {
    if (env.ANTHROPIC_API_KEY?.trim()) {
      try {
        client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: timeoutMs, maxRetries: 0 })
        const result = await client.messages.create({
          model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
          max_tokens: 1024,
          system,
          messages,
        }, { signal: AbortSignal.timeout(timeoutMs) })
        const text = result.content.filter(item => item.type === 'text').map(item => item.text).join('').trim()
        if (!text || result.stop_reason === 'max_tokens') throw new Error('Incomplete Anthropic answer')
        return text
      } catch {
        // Do not log provider response bodies, credentials, or visitor messages.
        console.warn('Anthropic answer unavailable; trying configured fallback.')
      }
    }

    if (env.OPENAI_API_KEY?.trim()) {
      try {
        const response = await fetchImpl('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
          body: JSON.stringify({
            model: env.OPENAI_MODEL || 'gpt-4.1-mini',
            instructions: system,
            input: messages,
            max_output_tokens: 1024,
            store: false,
          }),
        })
        if (!response.ok) {
          await response.body?.cancel()
          throw new Error('OpenAI request failed')
        }
        const result = await response.json()
        const text = (result.output || [])
          .filter(item => item.type === 'message')
          .flatMap(item => item.content || [])
          .filter(item => item.type === 'output_text')
          .map(item => item.text).join('').trim()
        if (result.status !== 'completed' || !text) throw new Error('Incomplete OpenAI answer')
        return text
      } catch {
        console.warn('OpenAI answer unavailable.')
      }
    }
    throw new Error('No AI provider could complete the answer.')
  }

  return { hasKey, answer }
}
