import { transaction, settings } from './repository.js'
import { CommunityError, text, integer, boolean, choice, LEVELS } from './validation.js'
import { audit } from './audit.js'

export async function changeSettings(body, actor) {
  const data = {}, validators = {
    feature_enabled: value => boolean(value, 'Feature'), applications_enabled: value => boolean(value, 'Applications'),
    rules_text: value => text(value, 'Rules', 10000), privacy_text: value => text(value, 'Privacy notice', 10000),
    rules_version: value => text(value, 'Rules version', 64), privacy_version: value => text(value, 'Privacy version', 64),
    low_risk_threshold: value => integer(value, 'Low risk threshold', 0, 99), high_risk_threshold: value => integer(value, 'High risk threshold', 1, 100),
    retention_days: value => integer(value, 'Retention days', 1, 3650), public_reporting_enabled: value => boolean(value, 'Public reporting'),
    ai_enabled: value => { if (boolean(value, 'AI')) throw new CommunityError(400, 'AI screening is not implemented; paid provider use requires separate approval'); return false },
    default_handoff_mode: value => choice(value, ['MANUAL'], 'handoff mode'),
    screening_patterns: value => {
      if (!Array.isArray(value) || value.length > 100) throw new CommunityError(400, 'Provide at most 100 plain-text screening patterns')
      return JSON.stringify(value.map(pattern => text(pattern, 'Pattern', 200, { min: 4 })))
    }, warning_policy: value => {
      if (!Array.isArray(value) || value.length < 1 || value.length > 5) throw new CommunityError(400, 'Invalid warning policy')
      // Automatic progressive policy never blocks: a block needs an explicit human decision.
      return JSON.stringify(value.map(level => choice(level, LEVELS.filter(item => item !== 'BLOCKED'), 'warning level')))
    }, notification_preferences: value => {
      if (!value || typeof value !== 'object' || Array.isArray(value) || value.applicantDelivery !== 'MANUAL' || typeof value.dashboard !== 'boolean' || Object.keys(value).some(key => !['applicantDelivery', 'dashboard'].includes(key))) throw new CommunityError(400, 'Only dashboard notifications and manual applicant delivery are available')
      return JSON.stringify(value)
    }
  }
  for (const [key, value] of Object.entries(body)) {
    if (!Object.hasOwn(validators, key)) throw new CommunityError(400, 'Unsupported setting')
    data[key] = validators[key](value)
  }
  if (!Object.keys(data).length) throw new CommunityError(400, 'No changes provided')
  return transaction(async connection => {
    const existing = await settings(connection, true), merged = { ...existing, ...data }
    if (merged.low_risk_threshold >= merged.high_risk_threshold) throw new CommunityError(400, 'Low risk threshold must be below high risk threshold')
    for (const [content, version] of [['rules_text', 'rules_version'], ['privacy_text', 'privacy_version']]) {
      if (data[content] && data[content] !== existing[content] && merged[version] === existing[version]) throw new CommunityError(400, `Change ${version} when updating ${content}`)
    }
    if (merged.feature_enabled) {
      if (!merged.privacy_text.trim()) throw new CommunityError(400, 'Configure the privacy notice before enabling the feature')
      if (!(process.env.SESSION_SECRET?.length >= 32 && process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== 'admin123')) throw new CommunityError(503, 'Strong administrator session configuration is required before enabling the feature')
    }
    const fields = Object.keys(data)
    await connection.execute(`UPDATE community_settings SET ${fields.map(key => `${key} = ?`).join(', ')} WHERE id = 1`, Object.values(data))
    await audit(connection, actor, 'SETTINGS_CHANGED', 'SETTINGS', 1, { fields })
    return { success: true }
  })
}
