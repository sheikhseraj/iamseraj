import { useEffect, useId, useRef, useState } from 'react'
import { normalizePublicPhone, meaningfulReason } from './api.js'
import { useLang } from '../lang.js'
import { copy } from './translations.js'

export function PublicField({ label, value, onChange, options, multiline, hint, ...props }) {
  const id = useId()
  return <div className="public-community-field"><label htmlFor={id}>{label}</label>
    {options ? <select id={id} value={value} onChange={event => onChange(event.target.value)} {...props}>{options.map(([key,text]) => <option key={key} value={key}>{text}</option>)}</select>
      : multiline ? <textarea id={id} value={value} onChange={event => onChange(event.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
        : <input id={id} value={value} onChange={event => onChange(event.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />}
    {hint && <small id={`${id}-hint`}>{hint}</small>}
  </div>
}
export function PublicError({ code, t, onRefresh }) {
  const keys = { phone: 'invalidPhone', reason: 'invalidReason', consent: 'acceptRequired', group: 'missingGroup', network: 'networkError', rate: 'rateError', stale: 'changed', generic: 'genericError' }
  if (!code) return null
  return <div className="public-community-error" role="alert"><p>{t[keys[code] || 'genericError']}</p>{code === 'stale' && <button type="button" className="btn btn--ghost" onClick={onRefresh}>{t.refresh}</button>}</div>
}
export function errorCode(error) { return error.status === 409 || error.status === 503 ? 'stale' : error.status === 429 ? 'rate' : error.status ? 'generic' : 'network' }
const blank = { fullName: '', phone: '', city: '', reason: '', referralSource: '', rulesAccepted: false, privacyAccepted: false }
export default function JoinRequestForm({ api, config, groups, selectedGroup, onGroupChange, onRefresh, revision, refreshing }) {
  const { lang } = useLang(), t = copy[lang], [form, setForm] = useState(blank), [busy, setBusy] = useState(false), [error, setError] = useState(null), [success, setSuccess] = useState(false)
  const inFlight = useRef(false), result = useRef(null)
  useEffect(() => { setForm(previous => ({ ...previous, rulesAccepted: false, privacyAccepted: false })); setError(null) }, [revision])
  useEffect(() => { if (success) result.current?.focus() }, [success])
  const set = key => value => setForm(previous => ({ ...previous, [key]: value }))
  const submit = async event => {
    event.preventDefault(); if (inFlight.current || refreshing || error === 'stale') return
    setError(null)
    const phone = normalizePublicPhone(form.phone)
    if (!phone) return setError('phone')
    if (!meaningfulReason(form.reason)) return setError('reason')
    if (!form.rulesAccepted || !form.privacyAccepted) return setError('consent')
    if (!groups.some(group => String(group.id) === selectedGroup && group.acceptingApplications)) return setError('group')
    inFlight.current = true; setBusy(true)
    try {
      await api.join({ ...form, fullName: form.fullName.trim(), city: form.city.trim(), reason: form.reason.trim(), phone,
        groupId: Number(selectedGroup), rulesVersion: config.rulesVersion, privacyVersion: config.privacyVersion })
      setForm({ ...blank }); setSuccess(true)
    } catch (failure) { setError(errorCode(failure)) }
    finally { inFlight.current = false; setBusy(false) }
  }
  if (success) return <div className="public-community-success" ref={result} tabIndex={-1} role="status"><span aria-hidden="true">✓</span><h3>{t.successTitle}</h3><p>{t.success}</p><p>{t.successDetail}</p></div>
  return <form onSubmit={submit} className="public-community-form">
    <PublicError code={error} t={t} onRefresh={onRefresh} /><fieldset disabled={busy || refreshing}>
      <div className="public-community-form-row"><PublicField label={t.name} value={form.fullName} onChange={set('fullName')} required minLength={2} maxLength={160} autoComplete="name" />
        <PublicField label={t.phone} value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" required maxLength={40} autoComplete="tel" placeholder="+49 …" hint={t.phoneHint} /></div>
      <div className="public-community-form-row"><PublicField label={t.city} value={form.city} onChange={set('city')} required maxLength={120} autoComplete="address-level2" hint={t.cityHint} />
        <PublicField label={t.group} value={selectedGroup} onChange={onGroupChange} required options={[["",t.chooseGroup], ...groups.filter(group => group.acceptingApplications).map(group => [String(group.id),group.name])]} /></div>
      <PublicField label={t.reason} value={form.reason} onChange={set('reason')} multiline required minLength={15} maxLength={2000} hint={t.reasonHint} />
      <PublicField label={t.referral} value={form.referralSource} onChange={set('referralSource')} maxLength={200} />
      <details className="public-community-privacy"><summary>{t.privacy}</summary><p className="public-community-policy">{config.privacyNotice}</p><small>{t.privacyVersion}: {config.privacyVersion}</small></details>
      <label className="public-community-consent"><input type="checkbox" checked={form.rulesAccepted} onChange={event => set('rulesAccepted')(event.target.checked)} required /><span>{t.acceptRules} <a href="#community-rules">{t.rules} ↗</a></span></label>
      <label className="public-community-consent"><input type="checkbox" checked={form.privacyAccepted} onChange={event => set('privacyAccepted')(event.target.checked)} required /><span>{t.acceptPrivacy}</span></label>
    </fieldset><button className="btn btn--primary" disabled={busy || refreshing || error === 'stale'}>{busy ? t.sending : t.send}</button><p className="public-community-fineprint">{t.pending}</p>
  </form>
}
