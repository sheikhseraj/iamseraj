export class PublicCommunityError extends Error {
  constructor(status) { super('Community request failed'); this.status = status }
}
export function createPublicCommunityApi(fetchImpl = globalThis.fetch) {
  async function request(path, { signal, body } = {}) {
    const response = await fetchImpl(`/api/community/${path}`, { method: body ? 'POST' : 'GET', credentials: 'omit', cache: 'no-store', signal,
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) })
    const data = await response.json().catch(() => null)
    if (!response.ok || data === null) throw new PublicCommunityError(response.status)
    return data
  }
  return { config: signal => request('config', { signal }), groups: signal => request('groups', { signal }),
    join: body => request('join-requests', { body }), report: body => request('reports', { body }) }
}
export function normalizePublicPhone(value) {
  const phone = value.normalize('NFKC').trim().replace(/[\s().-]/g,'').replace(/^00/,'+')
  return /^\+[1-9]\d{7,14}$/.test(phone) && !/^(\d)\1+$/.test(phone.slice(1)) ? phone : null
}
export function meaningfulReason(value) {
  const reason = value.normalize('NFKC').trim()
  return reason.length >= 15 && reason.length <= 2000 && /[\p{L}\p{N}]/u.test(reason) && new Set(reason.toLowerCase().replace(/\s/g,'')).size >= 4
}
