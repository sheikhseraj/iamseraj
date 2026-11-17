import { useState } from 'react'
import { byId, summary } from './bank.mjs'
import { localDateKey, percentage, resultStats } from './learning.mjs'
import { exportProgress, readProgressFile } from './progress-store.mjs'
import { Empty, LabButton, LabLink, Meter, Metrics, PageHeading, Readiness } from './LabUi.jsx'

function PerformanceBars({ rows }) {
  return <ul className="lab-performance">
    {rows.map(row => <li key={row.name}>
      <div className="lab-row"><span>{row.name}</span>
        <strong>{row.attempted ? row.accuracy + '% · ' + row.attempted + ' attempted' : 'Unattempted'}</strong></div>
      <Meter value={row.accuracy} label={row.name + ' latest accuracy ' + row.accuracy + '%'} />
    </li>)}
  </ul>
}

function ActivityChart({ attempts }) {
  const days = new Map()
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.set(localDateKey(date), { label: date.toLocaleDateString(undefined, { weekday: 'short' }), count: 0 })
  }
  for (const attempt of attempts) {
    const day = days.get(localDateKey(attempt.at))
    if (day) day.count++
  }
  const max = Math.max(1, ...Array.from(days.values(), day => day.count))
  return <div className="lab-activity-chart" role="list" aria-label="Attempts over the last seven days">
    {[...days].map(([date, { label, count }]) => <div key={date} role="listitem" aria-label={label + ': ' + count + ' attempts'}>
      <strong>{count}</strong><div className="lab-activity-track">
        <div style={{ height: percentage(count, max) + '%' }} />
      </div><span aria-hidden="true">{label}</span>
    </div>)}
  </div>
}

function ManageProgress({ state, dispatch, account }) {
  const [target, setTarget] = useState(String(state.preferences.passTarget))
  const [candidate, setCandidate] = useState(null)
  const [status, setStatus] = useState('')
  const [failure, setFailure] = useState('')
  const [pending, setPending] = useState(false)
  const preview = candidate && candidate.progress
  const scope = account ? 'your account' : 'this browser'

  function download() {
    const url = URL.createObjectURL(new Blob([exportProgress(state)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'aws-practice-progress.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function inspect(event) {
    const file = event.target.files[0]
    event.target.value = ''
    setFailure('')
    setStatus('')
    setCandidate(null)
    if (!file) return
    setPending(true)
    try { setCandidate({ name: file.name, progress: await readProgressFile(file) }) }
    catch (error) { setFailure(error.message) }
    finally { setPending(false) }
  }
  async function changeProgress(action, message) {
    setPending(true)
    const updated = await dispatch(action)
    setPending(false)
    if (updated) {
      setTarget(String(updated.preferences.passTarget))
      setStatus(message)
      setFailure('')
      setCandidate(null)
    }
  }
  function confirmImport() {
    if (!preview || !window.confirm('Replace all progress in ' + scope + ' with the selected backup?')) return
    changeProgress({ type: 'import', progress: preview }, 'Progress restored from backup.')
  }
  function reset() {
    if (window.confirm('Reset all AWS Practice Lab progress in ' + scope + '? This deletes saved sessions, answers, bookmarks, reports, and flashcard reviews.')) {
      changeProgress({ type: 'reset' }, 'Learning progress reset.')
    }
  }

  return <section className="lab-panel lab-section">
    <h2>Learning preferences and backups</h2>
    <form className="lab-filter-row lab-inline-form" onSubmit={event => {
      event.preventDefault()
      changeProgress({ type: 'target', value: Number(target) }, 'Practice pass target saved.')
    }}>
      <label>Practice pass target (%)<input type="number" min="1" max="100" step="1" required value={target}
        onChange={event => setTarget(event.target.value)} /></label>
      <button className="lab-button" disabled={pending}>Save target</button>
    </form>
    <p className="lab-muted">{account ? 'Progress syncs to your account.' : 'Guest progress is stored on this browser.'} Export a backup before replacing your progress.</p>
    <div className="lab-actions">
      <LabButton onClick={download}>Export progress</LabButton>
      <label className="lab-file-label">Import progress<input type="file" accept=".json,application/json"
        disabled={pending} onChange={inspect} /></label>
      <LabButton className="lab-button lab-button--danger" disabled={pending} onClick={reset}>Reset progress</LabButton>
    </div>
    {preview && <div className="lab-notice">
      <p><strong>{candidate.name}</strong> has {preview.attempts.length} attempts, {preview.results.length} completed sessions,
        and {preview.bookmarks.length} bookmarks. Import replaces the existing data in {scope}.</p>
      <div className="lab-actions">
        <LabButton primary disabled={pending} onClick={confirmImport}>Replace progress with this backup</LabButton>
        <LabButton disabled={pending} onClick={() => setCandidate(null)}>Cancel import</LabButton>
      </div>
    </div>}
    {failure && <p role="alert" className="lab-negative">{failure}</p>}
    {status && <p role="status" className="lab-positive">{status}</p>}
  </section>
}

export default function Progress({ state, metrics, dispatch, account }) {
  const recent = [...state.attempts].sort((a, b) => b.at - a.at).slice(0, 8)
  const practices = state.results.filter(result => result.kind === 'practice').slice(0, 10)
  const practiceData = metrics.practiceAttempts > 0
  return <>
    <PageHeading title="My progress and exam history">Follow your learning across practice, mock exams, and flashcards.</PageHeading>
    <Readiness metrics={metrics} />
    <Metrics label="Learning statistics" items={[
      ['Questions in source bank', summary.total], ['Unique questions attempted', metrics.all.size],
      ['Total answer attempts', state.attempts.length], ['Questions mastered', metrics.mastered],
      ['Latest answer incorrect', metrics.needsLearningReview], ['Questions saved', state.bookmarks.length],
      ['Source questions needing review', summary.needsReview], ['Flashcards reviewed', Object.keys(state.cards).length],
    ]} />
    <section className="lab-panel lab-section">
      <h2>Practice accuracy</h2>
      <Metrics label="Accuracy breakdown" items={[
        ['All practice answers', practiceData ? metrics.practiceAccuracy + '%' : '—'],
        ['First-attempt accuracy', practiceData ? metrics.firstAccuracy + '%' : '—'],
        ['Latest-attempt accuracy', practiceData ? metrics.latestAccuracy + '%' : '—'],
      ]} />
      {practiceData && <div className="lab-stacked" aria-label={metrics.correct + ' correct, ' + metrics.incorrect + ' incorrect'}>
        <div style={{ width: metrics.practiceAccuracy + '%' }} />
      </div>}
      <p className="lab-muted">{metrics.correct} correct · {metrics.incorrect} incorrect practice answers.
        Mastered means at least two correct answers and a correct latest answer.</p>
      <details className="lab-inline-details">
        <summary>How readiness is estimated</summary>
        <p>Shown after 20 distinct questions have been attempted in practice. Without a mock exam, the estimate uses equal weights for completion and first-attempt accuracy.
          With a mock exam, it uses 30% completion, 30% first-attempt accuracy, and 40% latest mock score. The estimate is unofficial.</p>
      </details>
    </section>
    <div className="lab-grid lab-section">
      <section className="lab-panel"><h2>Accuracy by domain</h2><p className="lab-muted">Based on your latest answer to each question.</p>
        <PerformanceBars rows={metrics.domains} /></section>
      <section className="lab-panel"><h2>Weak topics</h2><p className="lab-muted">Topics below 70% latest accuracy after at least two distinct questions.</p>
        {metrics.weak.length ? <PerformanceBars rows={metrics.weak.slice(0, 8)} />
          : <p className="lab-muted">No topics meet this threshold yet.</p>}
        <LabLink to="topics">Practice by topic</LabLink>
      </section>
    </div>
    <details className="lab-panel lab-section lab-inline-details"><summary>Topic performance</summary>
      <PerformanceBars rows={metrics.topicPerformance} />
    </details>
    <section className="lab-panel lab-section"><h2>Practice activity</h2>
      <p className="lab-muted">Practice and mock exam answers during the last seven days.</p>
      <ActivityChart attempts={state.attempts} />
      <h3>Recent activity</h3>
      {recent.length ? <ul className="lab-log">{recent.map(attempt => {
        const q = byId.get(attempt.questionId)
        return <li key={attempt.id}><span>{q.originalQuestionNumber} · {q.topic} · {attempt.correct ? 'Correct' : 'Incorrect'}</span>
          <time dateTime={new Date(attempt.at).toISOString()}>{new Date(attempt.at).toLocaleString()}</time></li>
      })}</ul> : <p className="lab-muted">Your first answers will appear here.</p>}
    </section>
    <section className="lab-panel lab-section"><h2>Mock exam history</h2>
      {metrics.exams.length ? <ul className="lab-log">{metrics.exams.map(exam =>
        <li key={exam.id}><span>{new Date(exam.endedAt).toLocaleString()} · {resultStats(exam).percent}% practice score</span>
          <LabLink to={'result/' + exam.id}>View result</LabLink></li>)}</ul>
        : <Empty action={<LabLink to="mock">Go to mock exam</LabLink>}>No mock exams completed yet.</Empty>}
    </section>
    {practices.length > 0 && <section className="lab-panel lab-section"><h2>Recent practice sessions</h2>
      <ul className="lab-log">{practices.map(result => <li key={result.id}><span>{result.title} · {resultStats(result).answered} answered</span>
        <LabLink to={'result/' + result.id}>View result</LabLink></li>)}</ul>
    </section>}
    <ManageProgress key={account?.username ?? "guest"} state={state} dispatch={dispatch} account={account} />
  </>
}
