import { useEffect, useRef, useState } from 'react'
import { byId, mockCoverage, mockMinutes, selectMockQuestions, summary } from './bank.mjs'
import { percentage, resultStats, secondsRemaining } from './learning.mjs'
import {
  AnswerFeedback, Bookmark, Empty, LabButton, LabLink, Meter, Metrics, PageHeading,
  QuestionMeta, ReportIssue, ReviewNotice,
} from './LabUi.jsx'

export function MockPage({ state, start }) {
  const coverage = mockCoverage()
  const ready = coverage.every(domain => domain.available >= domain.mockTarget)
  const active = state.sessions.exam
  return <>
    <PageHeading title="Mock exam">
      Work under a 90-minute timer. You can move between questions and mark them for review before submitting.
    </PageHeading>
    <Metrics label="Mock exam settings" items={[
      ['Questions', 65], ['Minutes', mockMinutes], ['Practice target', state.preferences.passTarget + '%'],
    ]} />
    <section className="lab-panel lab-section">
      <h2>Question allocation</h2>
      <div className="lab-table-wrap"><table>
        <thead><tr><th scope="col">Domain</th><th scope="col">Exam weight</th><th scope="col">Questions</th><th scope="col">Eligible pool</th></tr></thead>
        <tbody>{coverage.map(domain => <tr key={domain.id}>
          <th scope="row">{domain.name}</th><td>{domain.weight}%</td>
          <td>{domain.mockTarget}</td><td>{domain.available}</td>
        </tr>)}</tbody>
      </table></div>
      {!ready && <p role="status" className="lab-notice">At least one domain is below the required allocation. A full mock exam is unavailable with this bank.</p>}
      <p className="lab-muted">The exam excludes flagged questions and selects at most one question per duplicate group. Results use a study benchmark and do not use AWS scaled scoring.</p>
      <div className="lab-actions">
        {active ? <LabLink primary to="exam-session">Resume mock exam</LabLink>
          : <LabButton primary disabled={!ready} onClick={() => start('exam', selectMockQuestions(), 'CLF-C02 mock exam')}>Start 65-question exam</LabButton>}
        <LabLink to="progress">Exam history</LabLink>
      </div>
    </section>
  </>
}

function ExamTimer({ deadline }) {
  const [now, setNow] = useState(Date.now)
  const seconds = secondsRemaining(deadline, now)
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = window.setInterval(tick, 500)
    window.addEventListener('focus', tick)
    return () => { clearInterval(timer); window.removeEventListener('focus', tick) }
  }, [deadline])

  const display = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0')
  return <div className={'lab-timer' + (seconds <= 300 ? ' lab-timer--low' : '')}>
    <span>Time left</span><strong role="timer" aria-label="Time remaining">{display}</strong>
    {seconds <= 300 && <span className="lab-sr" role="status">Five minutes or less remaining.</span>}
  </div>
}

function QuestionPalette({ session, move, pending }) {
  return <aside className="lab-panel lab-palette" aria-label="Question palette">
    <h2>Question palette</h2>
    <p className="lab-muted">Answered, unanswered, or marked for review</p>
    <div>{session.ids.map((id, index) => {
      const answered = Boolean(session.responses[id]?.length)
      const marked = session.marked.includes(id)
      const current = index === session.index
      return <button key={id} type="button" className={answered ? 'lab-palette__answered' : ''}
        aria-current={current ? 'step' : undefined} disabled={pending}
        aria-label={'Question ' + (index + 1) + ', ' + (answered ? 'answered' : 'unanswered') + (marked ? ', marked for review' : '')}
        onClick={() => move(index)}>{index + 1}{marked && <sup aria-hidden="true">•</sup>}</button>
    })}</div>
  </aside>
}

export function SessionPage({ kind, state, dispatch, go }) {
  const session = state.sessions[kind]
  if (session) return <ActiveSession key={session.id} session={session} state={state} dispatch={dispatch} go={go} />
  const latest = state.results.find(result => result.kind === kind)
  if (kind === 'exam' && latest) return <SessionResult result={latest} state={state} dispatch={dispatch} />
  return <Empty action={<LabLink to={kind === 'exam' ? 'mock' : 'practice'} primary>Choose a new session</LabLink>}>
    There is no active {kind === 'exam' ? 'mock exam' : 'practice session'}.
  </Empty>
}

function ActiveSession({ session, state, dispatch, go }) {
  const isExam = session.kind === 'exam'
  const q = byId.get(session.ids[session.index])
  const [pendingAnswers, setPendingAnswers] = useState(null)
  const answers = pendingAnswers ?? session.responses[q.id] ?? []
  const graded = session.graded.includes(q.id)
  const multi = q.type === 'multiple_response'
  const answeredCount = isExam ? Object.values(session.responses).filter(answer => answer.length).length : session.graded.length
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const heading = useRef(null)
  const lastQuestion = useRef(q.id)

  async function send(type, fields = {}) {
    if (busy.current) return null
    busy.current = true
    setPending(true)
    try { return await dispatch({ type, kind: session.kind, sessionId: session.id, questionId: q.id, ...fields }) }
    finally { busy.current = false; setPending(false) }
  }
  function move(index) {
    if (index >= 0 && index < session.ids.length) send('move', { index })
  }
  async function choose(id) {
    if (busy.current || graded || !q.options.some(option => option.id === id)) return
    const next = !multi ? [id] : answers.includes(id) ? answers.filter(value => value !== id) : [...answers, id]
    setPendingAnswers(next)
    try { await send('select', { answers: next }) }
    finally { setPendingAnswers(null) }
  }
  async function finish() {
    const unanswered = session.ids.length - answeredCount
    const text = isExam ? 'Submit your mock exam?' : 'Finish this practice session?'
    if ((isExam || unanswered) && !window.confirm(text + (unanswered ? ' Unanswered questions: ' + unanswered + '.' : ''))) return
    const updated = await send('finish')
    if (updated?.results.some(result => result.id === session.id)) go('result/' + session.id)
  }

  useEffect(() => {
    if (lastQuestion.current !== q.id) {
      heading.current?.focus()
      lastQuestion.current = q.id
    }
  }, [q.id])

  useEffect(() => {
    function onKey(event) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || event.defaultPrevented
          || event.target.closest?.('input, textarea, select, button, a, summary, [contenteditable="true"]')) return
      if (/^[a-h]$/i.test(event.key) && q.options.some(option => option.id === event.key.toUpperCase())) {
        event.preventDefault()
        choose(event.key.toUpperCase())
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        move(session.index + (event.key === 'ArrowLeft' ? -1 : 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return <>
    <PageHeading title={session.title} action={isExam ? <ExamTimer deadline={session.deadline} />
      : <LabLink to="dashboard">Pause practice</LabLink>}>
      {isExam ? 'Mock exam in progress' : 'Practice session in progress'}
    </PageHeading>
    <div className="lab-session-progress">
      <span>Question {session.index + 1} of {session.ids.length}</span>
      <span>{answeredCount} answered · {session.ids.length - answeredCount} remaining</span>
      <Meter value={percentage(answeredCount, session.ids.length)} label="Session completion" />
    </div>
    <div className={isExam ? 'lab-exam-layout' : undefined}>
      <article className="lab-panel lab-question">
        <QuestionMeta question={q} />
        <h2 tabIndex={-1} ref={heading} className="lab-source-text">{q.question}</h2>
        {!isExam && <ReviewNotice question={q} />}
        <fieldset className="lab-options" disabled={pending || graded}>
          <legend>{multi ? 'Select all answers that apply.' : 'Select one answer.'}</legend>
          {q.options.map(option => {
            const chosen = answers.includes(option.id)
            const correct = q.correctAnswers.includes(option.id)
            const result = graded ? correct ? ' lab-option--correct' : chosen ? ' lab-option--wrong' : '' : ''
            return <label key={option.id} className={'lab-option' + (chosen ? ' lab-option--selected' : '') + result}>
              <input name={'answer-' + q.id} type={multi ? 'checkbox' : 'radio'} checked={chosen} onChange={() => choose(option.id)} />
              <span className="lab-option-letter">{option.id}</span>
              <span>{option.text}</span>
              {graded && correct && <span className="lab-positive lab-option-state">Correct answer</span>}
              {graded && chosen && !correct && <span className="lab-negative lab-option-state">Your answer</span>}
            </label>
          })}
        </fieldset>
        {!isExam && graded && <AnswerFeedback question={q} answers={answers} />}
        <div className="lab-actions lab-question-tools">
          <Bookmark questionId={q.id} state={state} dispatch={dispatch} />
          {isExam
            ? <LabButton disabled={pending} onClick={() => send('mark')} aria-pressed={session.marked.includes(q.id)}>
              {session.marked.includes(q.id) ? 'Marked for review' : 'Mark for review'}
            </LabButton>
            : <LabLink to={'cards/' + q.id}>Study as flashcard</LabLink>}
          <ReportIssue key={q.id} questionId={q.id} dispatch={dispatch} />
        </div>
        <div className="lab-actions lab-session-controls">
          <LabButton disabled={pending || session.index === 0} onClick={() => move(session.index - 1)}>Previous question</LabButton>
          {!isExam && !graded && <LabButton primary disabled={!answers.length || pending} onClick={() => send('grade')}>Check answer</LabButton>}
          {session.index + 1 < session.ids.length && <LabButton primary={isExam || graded} disabled={pending}
            onClick={() => move(session.index + 1)}>Next question</LabButton>}
          <LabButton disabled={pending} primary={isExam || session.index + 1 === session.ids.length} onClick={finish}>
            {isExam ? 'Submit exam' : 'Finish practice'}
          </LabButton>
        </div>
        <p className="lab-muted lab-key-help">Keyboard: use the answer letters to select choices and the arrow keys to move between questions.</p>
      </article>
      {isExam && <QuestionPalette session={session} move={move} pending={pending} />}
    </div>
  </>
}

export function SessionResult({ result, state, dispatch }) {
  const [filter, setFilter] = useState('all')
  const [limit, setLimit] = useState(15)
  const stats = resultStats(result)
  const isExam = result.kind === 'exam'
  const minutes = Math.floor(Math.max(0, result.endedAt - result.startedAt) / 60_000)
  const seconds = Math.floor(Math.max(0, result.endedAt - result.startedAt) / 1000) % 60
  const rows = stats.rows.filter(row => filter === 'all' || (filter === 'improve' ? row.status !== 'correct' : row.status === filter))
  return <>
    <PageHeading title={isExam ? 'Practice Exam Result' : 'Practice session result'}
      action={<LabLink to={isExam ? 'mock' : 'practice'}>Start another session</LabLink>}>
      {result.title} · {new Date(result.endedAt).toLocaleString()}
    </PageHeading>
    <Metrics label="Session results" items={[
      ['Correct', stats.correct], ['Incorrect', stats.incorrect], ['Unanswered', stats.unanswered],
      [isExam ? 'Practice score' : 'Answer accuracy', stats.percent + '%'], ['Time spent', minutes + 'm ' + seconds + 's'],
    ]} />
    {isExam && <p className="lab-notice">
      {stats.percent >= result.passTarget ? 'You met' : 'You fell short of'} the {result.passTarget}% practice target.
      {' '}This percentage is a study benchmark and differs from AWS certification scoring.
    </p>}
    <section className="lab-panel lab-section">
      <h2>Domain performance</h2>
      <div className="lab-table-wrap"><table>
        <thead><tr><th scope="col">Domain</th><th scope="col">Correct</th><th scope="col">Incorrect</th><th scope="col">Unanswered</th></tr></thead>
        <tbody>{summary.domains.map(domain => {
          const group = stats.rows.filter(row => row.q.domain === domain.id)
          if (!group.length) return null
          return <tr key={domain.id}><th scope="row">{domain.name}</th>
            {['correct', 'incorrect', 'unanswered'].map(status =>
              <td key={status}>{group.filter(row => row.status === status).length}</td>)}</tr>
        })}</tbody>
      </table></div>
    </section>
    <section className="lab-section">
      <div className="lab-row"><h2>Answer review</h2>
        <label>Show <select value={filter} onChange={event => { setFilter(event.target.value); setLimit(15) }}>
          <option value="all">All questions</option><option value="improve">Requires improvement</option>
          <option value="incorrect">Incorrect</option><option value="unanswered">Unanswered</option>
        </select></label>
      </div>
      {!rows.length && <Empty>No answers match this filter.</Empty>}
      <div className="lab-list">{rows.slice(0, limit).map(({ q, answers, status }) =>
        <details key={q.id} className="lab-panel lab-review-question">
          <summary><span>{q.originalQuestionNumber} · {status}</span> {q.question}</summary>
          <div className="lab-review-body">
            <QuestionMeta question={q} />
            <Bookmark questionId={q.id} state={state} dispatch={dispatch} />
            <ReviewNotice question={q} />
            <p><strong>Your selection</strong> {answers.length ? answers.map(id =>
              id + '. ' + q.options.find(option => option.id === id)?.text).join(' · ') : 'Unanswered'}</p>
            <AnswerFeedback question={q} answers={answers} />
          </div>
        </details>)}</div>
      {rows.length > limit && <LabButton onClick={() => setLimit(limit + 15)}>Show more answers</LabButton>}
    </section>
  </>
}
