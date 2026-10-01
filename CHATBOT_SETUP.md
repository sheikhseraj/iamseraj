# Portfolio chatbot setup

The chatbot tries Anthropic first. If Anthropic is unconfigured, rejects a request,
times out, or returns an empty or truncated answer, it tries OpenAI.
Either provider can operate on its own. If both fail, visitors see the existing
email contact message. Answers are completed before display so fallback replies
never get appended to a partial answer from another provider.

Set these server environment variables in your hosting dashboard (and in `.env`
for local development):

```dotenv
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-haiku-4-5
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
```

Use actual API keys with access to the selected models. Leave an unused provider's
key blank. Do not commit `.env` or place keys in browser code or `VITE_` variables.
Restart or redeploy the Node application after changing hosting variables.

Run `npm run dev` locally to start both the website and its API. `/api/health`
reports `ai: true` when at least one key is present; it does not validate the key,
account balance, or model access. Send a real chat question after configuring keys
to verify the complete connection.

OpenAI uses the Responses API with `store: false`. Both providers receive the same
portfolio facts and conversation history. Each provider attempt has an 18-second
timeout, within the browser's 45-second request timeout.

Verification: `node --test tests/chat.test.mjs tests/ai-providers.test.mjs` and
`npm run build`. Provider tests use simulated responses and do not incur API usage.

References:
- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://developers.openai.com/api/reference/responses/create
