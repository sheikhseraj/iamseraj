import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lang.js'
import { copy } from './translations.js'
import { PublicField, PublicError, errorCode } from './JoinRequestForm.jsx'

const categories = ['ADVERTISEMENT','REPEATED_PROMOTION','SPAM','SCAM_CONCERN','HARASSMENT','INAPPROPRIATE_CONTENT','OTHER']
const blank = { groupId: '', category: 'ADVERTISEMENT', description: '', quotedText: '', reporterContact: '', privacyAccepted: false }
export default function ReportForm({ api, config, groups, onRefresh, revision, refreshing }) {
  const { lang } = useLang(), t = copy[lang], [form, setForm] = useState(blank), [error, setError] = useState(null), [busy, setBusy] = useState(false), [success, setSuccess] = useState(false)
  const inFlight = useRef(false), result = useRef(null)
  useEffect(() => { setForm(previous => ({ ...previous, privacyAccepted: false })); setError(null) }, [revision])
  useEffect(() => { if (success) result.current?.focus() }, [success])
  const set = key => value => setForm(previous => ({ ...previous, [key]: value }))
  const submit = async event => {
    event.preventDefault(); if (inFlight.current || refreshing || error === 'stale') return
    if (!form.privacyAccepted) return setError('consent')
    if (!groups.some(group => String(group.id) === form.groupId)) return setError('group')
    inFlight.current = true; setBusy(true); setError(null)
    try { await api.report({ ...form, groupId: Number(form.groupId), privacyVersion: config.privacyVersion }); setForm({ ...blank }); setSuccess(true) }
    catch (failure) { setError(errorCode(failure)) }
    finally { setBusy(false); inFlight.current = false }
  }
  if (success) return <div className="public-community-success" role="status" ref={result} tabIndex={-1}><span aria-hidden="true">✓</span><h3>{t.reportSuccess}</h3></div>
  return <form className="public-community-form" onSubmit={submit}><PublicError code={error} t={{ ...t, acceptRequired: t.reportConsentError, missingGroup: t.reportGroupError, genericError: t.reportError }} onRefresh={onRefresh} /><fieldset disabled={busy || refreshing}>
    <div className="public-community-form-row"><PublicField label={t.reportGroup} value={form.groupId} onChange={set('groupId')} required options={[["",t.chooseGroup], ...groups.map(group => [String(group.id),group.name])]} />
      <PublicField label={t.reportCategory} value={form.category} onChange={set('category')} options={categories.map((category,index) => [category,t.categories[index]])} /></div>
    <PublicField label={t.reportDescription} value={form.description} onChange={set('description')} multiline required minLength={15} maxLength={4000} />
    <PublicField label={t.quoted} value={form.quotedText} onChange={set('quotedText')} multiline maxLength={4000} /><PublicField label={t.reporterContact} value={form.reporterContact} onChange={set('reporterContact')} maxLength={200} />
    <details className="public-community-privacy"><summary>{t.privacy}</summary><p className="public-community-policy">{config.privacyNotice}</p></details>
    <label className="public-community-consent"><input type="checkbox" checked={form.privacyAccepted} onChange={event => set('privacyAccepted')(event.target.checked)} required /><span>{t.reportPrivacy}</span></label>
  </fieldset><button className="btn btn--primary" disabled={busy || refreshing || error === 'stale'}>{busy ? t.sending : t.reportSend}</button><p className="public-community-fineprint">{t.reportNote}</p></form>
}
