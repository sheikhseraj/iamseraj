// Synthetic test/preview data only; never imported by application code.
export const settings = { id: 1, feature_enabled: 0, applications_enabled: 0, rules_text: 'Be respectful. Help other members. No unsolicited promotions or scams.', rules_version: '1',
  privacy_text: 'Synthetic privacy notice for UI testing only.', privacy_version: '1', low_risk_threshold: 30, high_risk_threshold: 60, retention_days: 180,
  notification_preferences: { dashboard: true, applicantDelivery: 'MANUAL' }, screening_patterns: [], warning_policy: ['WARNING','FINAL_WARNING','REMOVAL_RECOMMENDED'], public_reporting_enabled: 0, ai_enabled: 0 }
export const groups = [
  { id: 1, name: 'Indians in Magdeburg', city: 'Magdeburg', slug: 'indians-in-magdeburg', description: 'Connect locally and help one another.', status: 'ACTIVE', is_public: 1, accepting_applications: 1, approximate_capacity: 500, current_member_count: 460, instructions: 'Contact the applicant and share the group rules.', has_invite_link: true },
  { id: 2, name: 'Indians in Berlin', city: 'Berlin', slug: 'indians-in-berlin', description: 'A helpful local community.', status: 'ACTIVE', is_public: 1, accepting_applications: 1, approximate_capacity: null, current_member_count: null },
  { id: 3, name: 'Indians in Hannover', city: 'Hannover', slug: 'indians-in-hannover', description: 'Meet neighbours and share useful advice.', status: 'INACTIVE', is_public: 0, accepting_applications: 0 }
]
export const request = { id: 12, member_id: 7, group_id: 1, full_name: 'Example Applicant', normalized_phone: '+4917612345678', city: 'Magdeburg',
  reason: 'I would like to meet neighbours and share local advice.', referral_source: 'A friend', status: 'PENDING', handoff_status: 'NOT_READY', created_at: '2026-10-06T08:00:00Z',
  rules_version: '1', privacy_version: '1', rules_accepted_at: '2026-10-06T08:00:00Z', privacy_accepted_at: '2026-10-06T08:00:00Z',
  risk_score: 15, recommendation: 'APPROVE', assessments: [{ id: 1, risk_score: 15, recommendation: 'APPROVE', reasons: ['A useful local request.'], screening_version: 'rules-1.0.0', screened_at: '2026-10-06T08:00:00Z' }],
  requests: [{ id: 12, group_id: 1, status: 'PENDING', created_at: '2026-10-06T08:00:00Z' }], memberships: [], warnings: [], reports: [], blocks: [], notes: [], audit: [] }
export const member = { id: 7, full_name: 'Example Applicant', normalized_phone: '+4917612345678', city: 'Magdeburg', status: 'PENDING', created_at: '2026-10-06T08:00:00Z' }
export function createFixtureApi({ publicEnabled = false } = {}) {
  const current = structuredClone(request), config = structuredClone(settings), calls = []
  const page = items => ({ items, total: items.length, limit: 20, page: 1 })
  const response = (body, status = 200) => Response.json(body, { status })
  let failDecision = false
  if (publicEnabled) { config.feature_enabled = 1; config.applications_enabled = 1 }
  return { current, calls, config, setFailDecision: value => { failDecision = value }, fetch: async (url, options = {}) => {
    const path = new URL(url, 'http://localhost').pathname, method = options.method || 'GET', body = options.body ? JSON.parse(options.body) : null
    calls.push({ path, url: String(url), method, body })
    if (path.startsWith('/api/community/')) {
      if (path === '/api/community/config') return response({ enabled: Boolean(config.feature_enabled), applicationsEnabled: Boolean(config.applications_enabled), rules: config.rules_text, rulesVersion: config.rules_version,
        privacyNotice: config.privacy_text, privacyVersion: config.privacy_version, publicReportingEnabled: Boolean(config.public_reporting_enabled) })
      if (path === '/api/community/groups') return response(config.feature_enabled ? groups.filter(group => group.status === 'ACTIVE' && group.is_public).map(group => ({ id: group.id, name: group.name, city: group.city, slug: group.slug, description: group.description, status: group.status, acceptingApplications: Boolean(group.accepting_applications) })) : [])
      if (path === '/api/community/join-requests') return response({ message: 'Your request has been received and will be reviewed.' }, 201)
      if (path === '/api/community/reports') return response({ message: 'Your report has been received and will be reviewed.' }, 201)
      return response({ error: 'Not found' }, 404)
    }
    if (path === '/admin/api/check-auth') return response({ authenticated: true })
    if (path === '/admin/api/get-token') return response({ token: 'synthetic-fixture-token' })
    if (path === '/admin/api/logout') return response({ success: true })
    const resource = path.replace('/api/admin/community/', '')
    if (method !== 'GET') {
      if (resource === 'join-requests/12/decision') {
        if (failDecision) return response({ error: 'This request already has a final decision' }, 409)
        current.status = body.status; current.handoff_status = body.status === 'APPROVED' ? 'PENDING' : 'NOT_READY'
      }
      if (resource === 'join-requests/12/handoff-complete') current.handoff_status = 'COMPLETED'
      if (resource === 'notes') current.notes.push({ id: 1, body: body.body, actor_kind: 'SHARED_ADMIN' })
      if (resource === 'settings') Object.assign(config, body)
      return response({ id: 12, success: true })
    }
    if (resource === 'settings') return response(config)
    if (resource === 'administrators') return response([{ id: 1, name: 'Example Administrator', email: 'admin@example.invalid' }])
    if (resource === 'groups') return response(page(groups))
    if (resource.startsWith('groups/')) return response(groups[0])
    if (resource === 'join-requests/12/handoff') return response({ mode: 'MANUAL', phone: current.normalized_phone, instructions: 'Contact this synthetic applicant manually.', inviteLink: null })
    if (resource === 'join-requests/12') return response(current)
    if (resource === 'join-requests') return response(page([{ ...current, normalized_phone: '+49******5678' }]))
    if (resource === 'members') return response(page([{ ...member, normalized_phone: '+49******5678' }]))
    if (resource === 'members/7') return response(member)
    if (resource === 'overview') return response({ counts: { groups: 3, activeMembers: 124, pendingRequests: 8, needsReview: 2, openReports: 1, warnedMembers: 3, blockedMembers: 1 },
      recentRequests: page([{ ...current, normalized_phone: '+49******5678' }]), recentActivity: page([{ id: 1, action: 'JOIN_REQUEST_CREATED', actor_kind: 'APPLICANT', target_type: 'JOIN_REQUEST', target_id: 12, created_at: current.created_at }]),
      unresolvedReports: page([{ id: 3, category: 'ADVERTISEMENT', severity: 'NORMAL' }]), groupsNearCapacity: [groups[0]], dashboardNotificationsEnabled: true })
    return response(page([]))
  } }
}
