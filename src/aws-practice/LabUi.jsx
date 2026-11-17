import { useState } from 'react'
import { isCorrect, practiceBank } from './bank.mjs'

export const statusOptions = [
  ['all', 'All questions'], ['attempted', 'Attempted'], ['unattempted', 'Unattempted'],
  ['correct', 'Latest answer correct'], ['incorrect', 'Latest answer incorrect'],
  ['saved', 'Saved'], ['review', 'Needs bank review'],
]

export function LabLink({ to, children, primary = false, ...props }) {
  return <a className={'lab-button' + (primary ? ' lab-button--primary' : '')} href={'#' + to} {...props}>{children}</a>
}

export function LabButton({ children, primary = false, ...props }) {
  return <button type="button" className={'lab-button' + (primary ? ' lab-button--primary' : '')} {...props}>{children}</button>
}

export function PageHeading({ title, children, action }) {
  return <header className="lab-page-heading">
    <div><h1 tabIndex={-1} data-page-title>{title}</h1>{children && <p>{children}</p>}</div>
    {action}
  </header>
}

export function Metrics({ items, label }) {
  return <dl className={items.length > 5 ? "lab-metrics lab-metrics--wide" : "lab-metrics"} aria-label={label}>
    {items.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}
  </dl>
}

export function Empty({ children, action }) {
  return <div className="lab-empty"><p>{children}</p>{action}</div>
}

export function Meter({ value, label }) {
  return <progress className="lab-meter" value={value} max="100" aria-label={label}>{value}%</progress>
}

export function QuestionMeta({ question }) {
  return <ul className="lab-tags" aria-label="Question details">
    <li>{question.originalQuestionNumber}{question.sourceOccurrence > 1 ? ' · entry ' + question.sourceOccurrence : ''}</li>
    <li>{question.domainName}</li><li>{question.topic}</li>
  </ul>
}

export function Bookmark({ questionId, state, dispatch }) {
  const saved = state.bookmarks.includes(questionId)
  const [pending, setPending] = useState(false)
  async function toggle() {
    setPending(true)
    try { await dispatch({ type: 'bookmark', questionId, saved: !saved }) }
    finally { setPending(false) }
  }
  return <LabButton aria-pressed={saved} disabled={pending} onClick={toggle}>{saved ? '★ Saved' : '☆ Save question'}</LabButton>
}

export function ReportIssue({ questionId, dispatch }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event) {
    event.preventDefault()
    if (!note.trim() || pending) return
    setPending(true)
    const updated = await dispatch({ type: 'report', questionId, note, id: crypto.randomUUID() })
    setPending(false)
    if (updated) {
      setOpen(false)
      setNote('')
      setMessage('Issue note saved with your learning progress.')
    }
  }
  return <>
    <LabButton onClick={() => { setOpen(!open); setMessage('') }} aria-expanded={open}>Report issue</LabButton>
    {open && <form className="lab-inline-form" onSubmit={submit}>
      <label>What should be reviewed?
        <textarea required maxLength={500} value={note} onChange={event => setNote(event.target.value)} />
      </label>
      <p className="lab-muted">This note is saved with your progress.</p>
      <button className="lab-button lab-button--primary" disabled={!note.trim() || pending}>Save issue note</button>
    </form>}
    {message && <p role="status">{message}</p>}
  </>
}

export function ReviewNotice({ question }) {
  if (question.reviewStatus !== 'needs_review') return null
  return <aside className="lab-notice">
    <strong>Source question needs review</strong>
    {question.technicalReview.map(item => <p key={item.reason}>{item.reason}</p>)}
    {!question.correctAnswers.length && <p>The source has no explicit answer key.</p>}
  </aside>
}

export function AnswerFeedback({ question, answers, isAttempt = true }) {
  const graded = isAttempt && answers.length > 0 && question.correctAnswers.length > 0
  return <div className="lab-feedback" aria-live={graded ? 'polite' : undefined}>
    {graded && <p className={isCorrect(question, answers) ? 'lab-positive' : 'lab-negative'}>
      <strong>{isCorrect(question, answers) ? 'Correct' : 'Incorrect'}</strong>
    </p>}
    <p><strong>Source answer</strong></p>
    {question.correctAnswers.length > 0
      ? <ul>{question.correctAnswers.map(id => <li key={id}>{id}. {question.options.find(option => option.id === id)?.text}</li>)}</ul>
      : <p className="lab-muted">No answer key in the source document.</p>}
    <p><strong>Explanation</strong></p>
    <p className="lab-source-text">{question.explanation || 'Explanation not available in the source document.'}</p>
    {(Object.keys(question.incorrectExplanations).length > 0 || question.incorrectExplanationNotes) && <details>
      <summary>Incorrect option explanations</summary>
      {question.incorrectExplanationNotes && <p className="lab-source-text">{question.incorrectExplanationNotes}</p>}
      <dl>{Object.entries(question.incorrectExplanations).map(([id, text]) => <div key={id}>
        <dt>Option {id}</dt><dd className="lab-source-text">{text}</dd>
      </div>)}</dl>
    </details>}
    {question.references.length > 0 && <details>
      <summary>AWS and source references</summary>
      <ul>{question.references.filter(url => /^https?:\/\//i.test(url)).map(url => <li key={url}>
        <a href={url} target="_blank" rel="noreferrer">{url}</a>
      </li>)}</ul>
    </details>}
  </div>
}

export function ReviewQuestion({ question, children }) {
  return <details className="lab-panel lab-review-question">
    <summary><span>{question.originalQuestionNumber}</span> {question.question}</summary>
    <div className="lab-review-body">
      <QuestionMeta question={question} />
      {children}
      <ReviewNotice question={question} />
      <ol className="lab-option-preview" type="A">{question.options.map(option =>
        <li key={option.id}>{option.text}</li>)}</ol>
      <AnswerFeedback question={question} answers={[]} isAttempt={false} />
    </div>
  </details>
}

export function Readiness({ metrics }) {
  return <section className="lab-panel lab-readiness" aria-label="Learning readiness">
    <div className="lab-ring" style={{ '--lab-angle': metrics.completion + '%' }} aria-hidden="true">
      <span>{metrics.completion}%</span>
    </div>
    <div>
      <h2>Question bank completion</h2>
      <p>{metrics.all.size} of {practiceBank.length} practice questions attempted ({metrics.completion}%)</p>
      <p>Practice accuracy: <strong>{metrics.practiceAttempts ? metrics.practiceAccuracy + '%' : 'No practice answers yet'}</strong></p>
      <p>Unofficial readiness: <strong>{metrics.readiness === null ? 'Needs more practice data' : metrics.readiness + '%'}</strong></p>
    </div>
  </section>
}
