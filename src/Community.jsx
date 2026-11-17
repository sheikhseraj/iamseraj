import { useEffect, useMemo, useRef, useState } from 'react'
import SiteLayout from './components/SiteLayout.jsx'
import { useLang } from './lang.js'
import { createPublicCommunityApi } from './community/api.js'
import { copy } from './community/translations.js'
import JoinRequestForm from './community/JoinRequestForm.jsx'
import ReportForm from './community/ReportForm.jsx'
import './community/community.css'

function CommunityPage() {
  const { lang } = useLang(), t = copy[lang], api = useMemo(() => createPublicCommunityApi(), [])
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0), [revision, setRevision] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState(''), [reportOpen, setReportOpen] = useState(false), formSection = useRef(null)
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setFailed(false)
    const load = async () => {
      try {
        const config = await api.config(controller.signal)
        const groups = config.enabled ? await api.groups(controller.signal) : []
        if (!controller.signal.aborted) { setData({ config, groups }); setRevision(value => value + 1); setSelectedGroup(previous => groups.some(group => String(group.id) === previous && group.acceptingApplications) ? previous : '') }
      } catch { if (!controller.signal.aborted) setFailed(true) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }
    load(); return () => controller.abort()
  }, [api, retry])
  useEffect(() => {
    const original = document.title
    document.title = `${t.title} | iamseraj.com`
    return () => { document.title = original }
  }, [t.title])
  const refresh = () => setRetry(value => value + 1), config = data?.config, groups = data?.groups || []
  const canApply = !failed && config?.enabled && config.applicationsEnabled && config.rules?.trim() && config.privacyNotice?.trim() && groups.some(group => group.acceptingApplications)
  const chooseGroup = id => { setSelectedGroup(String(id)); formSection.current?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); formSection.current?.focus({ preventScroll: true }) }
  return <>
    <section className="hero public-community-hero" id="top"><div className="container"><p className="public-community-eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="public-community-lead">{t.intro}</p>
      <div className="hero__cta">{canApply && <a className="btn btn--primary" href="#join-request">{t.request}</a>}<a className="btn btn--ghost" href="#community-groups">{t.explore}</a></div>
      <div className="public-community-principles">{t.principles.map((principle,index) => <span key={principle}><b aria-hidden="true">{['↔','✦','♡'][index]}</b>{principle}</span>)}</div>
    </div></section>
    <section id="community-groups" className="section"><div className="container"><h2 className="section__title"><span>#</span> {t.groups}</h2><p className="section__intro">{t.groupsIntro}</p>
      {loading && !data ? <p role="status" className="public-community-message">{t.loading}</p> : failed ? <div role="alert" className="public-community-error"><p>{t.unavailable}</p><button className="btn btn--ghost" onClick={refresh}>{t.retry}</button></div>
        : config && !config.enabled ? <p className="public-community-message">{t.disabled}</p> : !groups.length ? <p className="public-community-message">{t.noGroups}</p>
          : <div className="public-community-groups">{groups.map(group => <article className="public-community-group" key={group.id}><span className="public-community-city">{group.city}</span><h3>{group.name}</h3><p>{group.description}</p>
            <div className="public-community-group-footer"><span className={`public-community-status ${config.applicationsEnabled && group.acceptingApplications ? 'is-open' : ''}`}>{config.applicationsEnabled && group.acceptingApplications ? t.open : t.closed}</span>
              {canApply && group.acceptingApplications && <button className="btn btn--ghost" onClick={() => chooseGroup(group.id)} aria-label={`${t.groupRequest}: ${group.name}`}>{t.request} →</button>}</div>
          </article>)}</div>}
    </div></section>
    <section id="community-rules" className="section public-community-rules"><div className="container"><h2 className="section__title"><span>#</span> {t.rules}</h2><p className="section__intro">{t.rulesIntro}</p>
      <ul className="public-community-guidelines">{t.guidelines.map(rule => <li key={rule}>{rule}</li>)}</ul>
      {config?.enabled && config.rules && <div className="public-community-policy-card"><p className="public-community-policy">{config.rules}</p><small>{t.rulesVersion}: {config.rulesVersion}</small></div>}
    </div></section>
    <section id="join-request" className="section" ref={formSection} tabIndex={-1}><div className="container"><h2 className="section__title"><span>#</span> {t.formTitle}</h2><p className="section__intro">{t.formIntro}</p>
      {canApply ? <JoinRequestForm api={api} config={config} groups={groups} selectedGroup={selectedGroup} onGroupChange={setSelectedGroup} onRefresh={refresh} revision={revision} refreshing={loading} />
        : <p className="public-community-message">{loading ? t.loading : failed ? t.unavailable : config?.enabled ? t.applicationsClosed : t.disabled}</p>}
    </div></section>
    {!failed && config?.enabled && config.publicReportingEnabled && config.privacyNotice?.trim() && groups.length > 0 && <section id="community-report" className="section"><div className="container"><div className="public-community-report-header"><div><h2 className="section__title"><span>#</span> {t.reportTitle}</h2><p className="section__intro">{t.reportIntro}</p></div>
      {!reportOpen && <button className="btn btn--ghost" onClick={() => setReportOpen(true)}>{t.reportToggle}</button>}</div>
      {reportOpen && <ReportForm api={api} config={config} groups={groups} onRefresh={refresh} revision={revision} refreshing={loading} />}
    </div></section>}
  </>
}
export default function Community() { return <SiteLayout community><CommunityPage /></SiteLayout> }
