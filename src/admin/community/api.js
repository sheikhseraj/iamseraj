export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}
export function queryString(values = {}) {
  return new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value !== null && value !== undefined)).toString()
}
export function createCommunityApi(token, onUnauthorized, fetchImpl = globalThis.fetch) {
  async function request(path, { method = 'GET', body, signal } = {}) {
    const response = await fetchImpl(`/api/admin/community/${path}`, {
      method, credentials: 'same-origin', cache: 'no-store', signal,
      headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      if (response.status === 401) onUnauthorized?.()
      throw new ApiError(data?.error || 'The request could not be completed. Please try again.', response.status)
    }
    if (data === null) throw new ApiError('The server returned an unreadable response.', response.status)
    return data
  }
  return { get: (path, signal) => request(path, { signal }),
    post: (path, body) => request(path, { method: 'POST', body }),
    patch: (path, body) => request(path, { method: 'PATCH', body }),
    put: (path, body) => request(path, { method: 'PUT', body }) }
}
export async function bootstrapAdmin(fetchImpl = globalThis.fetch, signal) {
  const auth = await fetchImpl('/admin/api/check-auth', { credentials: 'same-origin', cache: 'no-store', signal })
  if (auth.status === 401) return null
  if (!auth.ok) throw new ApiError('Could not check the existing admin session.', auth.status)
  const response = await fetchImpl('/admin/api/get-token', { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.token) throw new ApiError(data?.error || 'Could not open the existing admin session.', response.status)
  return data.token
}
export function tokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return !payload.exp || payload.exp * 1000 <= Date.now()
  } catch { return true }
}
export function downloadJson(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename
  document.body.append(anchor); anchor.click(); anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
