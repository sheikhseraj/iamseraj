export class CommunityError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export function text(value, name, max, { optional = false, min = 1 } = {}) {
  if (optional && (value === undefined || value === null || value === '')) return null
  if (typeof value !== 'string') throw new CommunityError(400, `${name} must be text`)
  const clean = value.normalize('NFKC').trim()
  if (clean.length < min || clean.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(clean)) throw new CommunityError(400, `${name} has an invalid length or characters`)
  return clean
}
export function id(value, name = 'ID') {
  const number = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value
  if (!Number.isSafeInteger(number) || number < 1 || number > 2147483647) throw new CommunityError(400, `Invalid ${name}`)
  return number
}
export function choice(value, allowed, name) {
  if (!allowed.includes(value)) throw new CommunityError(400, `Invalid ${name}`)
  return value
}
export function boolean(value, name) {
  if (typeof value !== 'boolean') throw new CommunityError(400, `${name} must be boolean`)
  return value
}
export function integer(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw new CommunityError(400, `Invalid ${name}`)
  return value
}
export function normalizePhone(value) {
  const phone = text(value, 'Phone', 40).replace(/[\s().-]/g, '').replace(/^00/, '+')
  // International-format plausibility only, not ownership or carrier validation.
  if (!/^\+[1-9]\d{7,14}$/.test(phone) || /^(\d)\1+$/.test(phone.slice(1))) throw new CommunityError(400, 'Use an international phone number with country code, for example +49…')
  return phone
}
export function joinRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new CommunityError(400, 'Invalid application')
  if (body.rulesAccepted !== true || body.privacyAccepted !== true) throw new CommunityError(400, 'Rules and privacy acknowledgements are required')
  const reason = text(body.reason, 'Reason', 2000, { min: 15 })
  if (!/[\p{L}\p{N}]/u.test(reason) || new Set(reason.toLowerCase().replace(/\s/g, '')).size < 4) throw new CommunityError(400, 'Please provide a meaningful reason for joining')
  return { full_name: text(body.fullName, 'Full name', 160, { min: 2 }), normalized_phone: normalizePhone(body.phone), city: text(body.city, 'City', 120),
    group_id: id(body.groupId, 'group'), reason, referral_source: text(body.referralSource, 'Referral source', 200, { optional: true }),
    rules_version: text(body.rulesVersion, 'Rules version', 64), privacy_version: text(body.privacyVersion, 'Privacy version', 64) }
}
export function pagination(query) {
  return { page: integer(Number(query.page ?? 1), 'Page', 1, 100000), limit: integer(Number(query.limit ?? 25), 'Limit', 1, 100) }
}
export const CATEGORIES = ['ADVERTISEMENT', 'REPEATED_PROMOTION', 'SPAM', 'SCAM_CONCERN', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'OTHER']
export const LEVELS = ['WARNING', 'FINAL_WARNING', 'REMOVAL_RECOMMENDED', 'BLOCKED']
