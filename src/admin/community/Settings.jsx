import { useEffect, useState } from 'react'
import { useCommunity, useResource, Notice, Loading, Field, Toggle, ActionDialog } from './components.jsx'

export default function Settings() {
  const { api, refreshConfiguration } = useCommunity(), state = useResource('settings')
  const [form, setForm] = useState(null), [confirm, setConfirm] = useState(false), [success, setSuccess] = useState('')
  useEffect(() => {
    if (state.data) setForm({ feature_enabled: Boolean(state.data.feature_enabled), applications_enabled: Boolean(state.data.applications_enabled),
      rules_text: state.data.rules_text, rules_version: state.data.rules_version, privacy_text: state.data.privacy_text, privacy_version: state.data.privacy_version,
      low_risk_threshold: state.data.low_risk_threshold, high_risk_threshold: state.data.high_risk_threshold, retention_days: state.data.retention_days,
      public_reporting_enabled: Boolean(state.data.public_reporting_enabled), dashboard: Boolean(state.data.notification_preferences.dashboard),
      patterns: state.data.screening_patterns.join('\n'), warning_policy: [...state.data.warning_policy] })
  }, [state.data])
  const set = key => value => { setSuccess(''); setForm(previous => ({ ...previous, [key]: value })) }
  const body = () => ({ feature_enabled: form.feature_enabled, applications_enabled: form.applications_enabled, rules_text: form.rules_text, rules_version: form.rules_version,
    privacy_text: form.privacy_text, privacy_version: form.privacy_version, low_risk_threshold: Number(form.low_risk_threshold), high_risk_threshold: Number(form.high_risk_threshold),
    retention_days: Number(form.retention_days), public_reporting_enabled: form.public_reporting_enabled, ai_enabled: false, default_handoff_mode: 'MANUAL',
    notification_preferences: { dashboard: form.dashboard, applicantDelivery: 'MANUAL' }, screening_patterns: form.patterns.split('\n').map(item => item.trim()).filter(Boolean), warning_policy: form.warning_policy })
  return <><h3>Community settings</h3><Notice error={state.error} onRetry={state.reload} success={success} />{state.loading ? <Loading /> : form && state.data && <form className="admin-form community-settings" onSubmit={event => { event.preventDefault(); setConfirm(true) }}>
    <h4>Availability</h4><Toggle label="Enable community" checked={form.feature_enabled} onChange={set('feature_enabled')} hint="Makes configured public groups available on the community page." />
    <Toggle label="Accept applications" checked={form.applications_enabled} onChange={set('applications_enabled')} hint="Each group must also allow applications." /><Toggle label="Allow public reports" checked={form.public_reporting_enabled} onChange={set('public_reporting_enabled')} />
    <h4 className="community-section-title">Community rules</h4><Field label="Rules shown to applicants" value={form.rules_text} onChange={set('rules_text')} multiline required maxLength={10000} />
    <Field label="Rules version" value={form.rules_version} onChange={set('rules_version')} required maxLength={64} hint="Use a new version when you change the rules." />
    <h4 className="community-section-title">Privacy and retention</h4><Field label="Privacy notice" value={form.privacy_text} onChange={set('privacy_text')} multiline required maxLength={10000} hint="Include the controller/contact, purpose, lawful basis, retention and applicant rights." />
    <div className="form-row"><Field label="Privacy notice version" value={form.privacy_version} onChange={set('privacy_version')} required maxLength={64} hint="Use a new version when you change this notice." /><Field label="Retention review period (days)" type="number" min={1} max={3650} value={form.retention_days} onChange={set('retention_days')} required hint="Review records after this period. Automatic deletion is not enabled." /></div>
    <h4 className="community-section-title">Screening</h4><p className="text-muted">Recommendations support a human decision. Applicants are never approved or blocked automatically.</p>
    <div className="form-row"><Field label="Low risk up to" type="number" min={0} max={99} value={form.low_risk_threshold} onChange={set('low_risk_threshold')} required /><Field label="High risk above" type="number" min={1} max={100} value={form.high_risk_threshold} onChange={set('high_risk_threshold')} required /></div>
    <Field label="Known advertisement phrases" value={form.patterns} onChange={set('patterns')} multiline maxLength={20100} hint="One phrase per line, at least four characters. Up to 100 phrases; avoid sensitive or identity-based criteria." />
    <Toggle label="AI-assisted screening" checked={false} disabled onChange={() => {}} hint="Currently unavailable. Rule-based screening works without an AI service." />
    <h4 className="community-section-title">Warning progression</h4>{form.warning_policy.map((level, index) => <Field key={index} label={`Violation ${index + 1}`} value={level} options={['WARNING','FINAL_WARNING','REMOVAL_RECOMMENDED']} onChange={value => setForm(previous => ({ ...previous, warning_policy: previous.warning_policy.map((item, position) => position === index ? value : item) }))} />)}
    <div className="community-actions"><button type="button" className="btn-edit" disabled={form.warning_policy.length >= 5} onClick={() => set('warning_policy')([...form.warning_policy,'REMOVAL_RECOMMENDED'])}>Add step</button><button type="button" className="btn-edit" disabled={form.warning_policy.length <= 1} onClick={() => set('warning_policy')(form.warning_policy.slice(0,-1))}>Remove last step</button></div>
    <h4 className="community-section-title">Notifications and handoff</h4><Toggle label="Show dashboard notifications" checked={form.dashboard} onChange={set('dashboard')} /><p className="community-info">Applicant decisions and group instructions are delivered manually in WhatsApp. No automated messages are sent.</p>
    <button className="btn-primary">Review and save settings</button>
  </form>}
    {confirm && <ActionDialog title="Save community settings?" description={form.feature_enabled ? 'This saves your rules, privacy notice and policy settings. Public availability follows the enabled settings and group configuration.' : 'The community remains disabled. Your configuration is saved for later use.'} onClose={() => setConfirm(false)} onConfirm={() => api.patch('settings', body())} onDone={() => { setSuccess('Community settings saved.'); state.reload(); refreshConfiguration() }} label="Save settings" />}
  </>
}
