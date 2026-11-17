import { lazy, Suspense, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import SiteLayout from '../components/SiteLayout.jsx'
import { practiceBank, summary } from './bank.mjs'
import { analytics, newSession } from './learning.mjs'
import { useLearning } from './useLearning.jsx'
import { LabLink, Metrics, Readiness } from './LabUi.jsx'
import './aws-practice.css'

const LabWorkspace = lazy(() => import('./LabWorkspace.jsx'))
const title = 'AWS Cloud Practitioner Practice Lab'
const cards = [
  ['mock', 'Mock Exam', 'Take a timed 65-question exam with the CLF-C02 domain mix.', '◷'],
  ['practice', 'Practice All Questions', 'Work through the question bank in order or shuffle a block.', '≡'],
  ['domains', 'Practice by Domain', 'Focus on one of the four exam domains.', '▦'],
  ['topics', 'Practice by Topic', 'Drill a particular AWS service, concept, or subtopic.', '◎'],
  ['cards', 'Flashcards', 'Recall source answers and schedule reviews.', '▤'],
  ['mistakes', 'My Mistakes', 'Revisit missed questions and track your recovery.', '↺'],
  ['saved', 'Saved Questions', 'Review bookmarked questions or start a focused session.', '☆'],
  ['progress', 'My Progress / Exam History', 'Review accuracy, weak topics, and completed exams.', '↗'],
]

const navigation = [
  ['dashboard', 'Dashboard'], ['practice', 'Practice'], ['mock', 'Mock exam'], ['cards', 'Flashcards'],
  ['mistakes', 'Mistakes'], ['saved', 'Saved'], ['search', 'Search'], ['progress', 'Progress'], ['account', 'Account'],
]

function readRoute() { return window.location.hash.slice(1) || 'dashboard' }
function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
function go(route) { window.location.hash = route === 'dashboard' ? '' : route }

function Dashboard({ state, metrics, account }) {
  return <>
    <section className="lab-hero">
      <div className="lab-hero__copy">
        <p className="lab-kicker">AWS CERTIFICATION · CLF-C02</p>
        <h1 data-page-title tabIndex={-1}>{title}</h1>
        <p className="lab-hero__lead">Prepare for your AWS Certified Cloud Practitioner (CLF-C02) certification with practice questions, mock exams, flashcards, and personalized progress tracking.</p>
        <div className="lab-actions">
          {state.sessions.practice
            ? <LabLink primary to="practice-session">Resume practice</LabLink>
            : <LabLink primary to="practice">Start practising</LabLink>}
          {state.sessions.exam
            ? <LabLink to="exam-session">Resume mock exam</LabLink>
            : <LabLink to="mock">Explore mock exam</LabLink>}
        </div>
        <p className="lab-account-note">{account
          ? <>Saving to <a href="#account">{account.username}</a></>
          : <>Guest mode · <a href="#account">Sign in to save across devices</a></>}</p>
      </div>
      <Readiness metrics={metrics} />
    </section>
    <Metrics label="Question bank and practice statistics" items={[
      ['Total questions', summary.total], ['Questions attempted', metrics.all.size],
      ['Correct practice answers', metrics.correct], ['Incorrect practice answers', metrics.incorrect],
      ['Practice accuracy', metrics.practiceAttempts ? metrics.practiceAccuracy + '%' : '—'],
      ['Unattempted practice questions', practiceBank.length - metrics.all.size],
      ['Saved questions', state.bookmarks.length], ['Questions needing review', summary.needsReview],
    ]} />
    <section className="lab-section" aria-labelledby="lab-learning">
      <div className="lab-row lab-section-heading"><h2 id="lab-learning">Choose how to study</h2><LabLink to="search">Search question bank</LabLink></div>
      <div className="lab-dashboard-cards">
        {cards.map(([route, label, copy, icon]) => <a key={route} href={'#' + route} className="lab-panel lab-dashboard-card">
          <span aria-hidden="true" className="lab-card-icon">{icon}</span>
          <h3>{label}</h3><p>{copy}</p><span aria-hidden="true" className="lab-card-arrow">→</span>
        </a>)}
      </div>
    </section>
    <p className="lab-note lab-muted">Independent learning tool. AWS does not affiliate with or endorse this lab.</p>
  </>
}

function navRoute(route) {
  const [view] = route.split('/')
  if (['domains', 'topics', 'practice-session'].includes(view)) return 'practice'
  if (view === 'exam-session') return 'mock'
  if (view === 'result') return 'progress'
  return view
}

export default function AwsPractice() {
  const route = useSyncExternalStore(subscribe, readRoute)
  const lastRoute = useRef(route)
  const starting = useRef(false)
  const { state, dispatch, persistent, error, account, sign, readGuest } = useLearning()
  const metrics = useMemo(() => state ? analytics(state) : null, [state])

  useEffect(() => {
    const previousTitle = document.title
    document.title = title + ' | iamseraj.com'
    return () => { document.title = previousTitle }
  }, [])
  useEffect(() => {
    if (lastRoute.current === route) return
    lastRoute.current = route
    document.querySelector('.aws-lab [data-page-title]')?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route])

  async function start(kind, ids, label) {
    if (!ids.length || starting.current) return
    const current = state.sessions[kind]
    if (current && !window.confirm('Replace your current unfinished ' + (kind === 'exam' ? 'exam' : 'practice session') + '?')) return
    starting.current = true
    const session = newSession(kind, ids, label)
    try {
      const updated = await dispatch({ type: 'start', session, replaceId: current?.id ?? null })
      if (updated?.sessions[kind]) go(kind === 'exam' ? 'exam-session' : 'practice-session')
    } finally {
      starting.current = false
    }
  }

  const active = navRoute(route)
  return <SiteLayout practiceLab>
    <div className="aws-lab" lang="en">
      <div className="container lab-shell">
        <nav className="lab-nav" aria-label="Practice Lab">
          {navigation.map(([id, text]) => <a key={id} href={'#' + id}
            aria-current={active === id ? 'page' : undefined}>{text}</a>)}
        </nav>
        {active === 'practice' && <nav className="lab-subnav" aria-label="Practice options">
          <LabLink to="practice" aria-current={route === 'practice' ? 'page' : undefined}>All questions</LabLink>
          <LabLink to="domains" aria-current={route === 'domains' ? 'page' : undefined}>By domain</LabLink>
          <LabLink to="topics" aria-current={route === 'topics' ? 'page' : undefined}>By topic</LabLink>
          {state?.sessions.practice && <LabLink to="practice-session" aria-current={route === 'practice-session' ? 'page' : undefined}>Resume</LabLink>}
        </nav>}
        {error && <p className="lab-notice" role="alert">{error}</p>}
        {!persistent && <p className="lab-notice" role="status">Browser storage is unavailable. Export your progress before refreshing or leaving.</p>}
        {state ? route === 'dashboard' ? <Dashboard state={state} metrics={metrics} account={account} />
          : <Suspense fallback={<p role="status">Loading view…</p>}>
            <LabWorkspace route={route} state={state} metrics={metrics} dispatch={dispatch} start={start} go={go} account={account} sign={sign} readGuest={readGuest} />
          </Suspense>
          : !error && <p role="status">Loading practice lab…</p>}
      </div>
    </div>
  </SiteLayout>
}
