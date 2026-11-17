const namespace = '/api/aws-practice'

export async function accountRequest(route, { body, username, method = 'GET' } = {}) {
  const headers = { Accept: 'application/json' }
  if (method !== 'GET') headers['X-AWS-Practice'] = '1'
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (username) headers['X-AWS-Practice-Account'] = username
  if (body?.type === 'import') headers['X-AWS-Practice-Import'] = '1'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), route === 'session' ? 3500 : 15000)
  try {
    const response = await fetch(namespace + '/' + route, {
      method, headers, credentials: 'same-origin', cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
    const json = await response.json().catch(() => null)
    if (!response.ok || !json) {
      const error = new Error(json?.error || 'Account service is unavailable. You can continue as a guest.')
      error.status = response.status
      throw error
    }
    return json
  } catch (error) {
    if (error.status) throw error
    throw new Error('Account service is unavailable. You can continue as a guest.')
  } finally {
    clearTimeout(timer)
  }
}
