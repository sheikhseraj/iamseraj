import { useEffect, useState } from 'react'
import { byId, practiceBank, shuffle } from './bank.mjs'
import { AnswerFeedback, Bookmark, Empty, LabButton, LabLink, PageHeading, QuestionMeta, ReviewNotice } from './LabUi.jsx'

export default function Flashcards({ questionId, state, dispatch }) {
  const [kind, setKind] = useState('question')
  const [mode, setMode] = useState('all')
  const [randomOrder, setRandomOrder] = useState(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [now, setNow] = useState(Date.now)
  const single = byId.get(questionId)
  const pool = single ? practiceBank.filter(q => q.id === single.id) : practiceBank
  const eligible = pool.filter(q => kind === 'question' || q.explanation)
  const reviewed = eligible.filter(q => state.cards[kind + ':' + q.id]).length
  const reviewPool = eligible.filter(q => {
    const record = state.cards[kind + ':' + q.id]
    return record && (record.dueAt <= now || record.history.at(-1).rating === 'again')
  })
  const matching = mode === 'review' ? reviewPool : eligible
  const matchingIds = new Set(matching.map(q => q.id))
  const queue = randomOrder ? randomOrder.filter(id => matchingIds.has(id)).map(id => byId.get(id)) : matching
  const position = Math.min(index, Math.max(0, queue.length - 1))
  const q = queue[position]
  const record = q && state.cards[kind + ':' + q.id]

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])

  function changeQueue(setter, value) {
    setter(value)
    setRandomOrder(null)
    setIndex(0)
    setFlipped(false)
    setMessage('')
  }
  function move(next) {
    setIndex(next)
    setFlipped(false)
    setMessage('')
  }
  async function rate(rating) {
    if (!q || pending) return
    setPending(true)
    const updated = await dispatch({ type: 'rate', cardId: kind + ':' + q.id, rating })
    setPending(false)
    if (!updated) return
    const interval = updated.cards[kind + ':' + q.id].interval
    setNow(Date.now())
    setMessage(rating === 'again' ? 'Added to the review queue. Scheduled in 10 minutes.'
      : 'Review scheduled in ' + interval + (interval === 1 ? ' day.' : ' days.'))
    setIndex(mode === 'review' && rating === 'know' ? position : Math.min(position + 1, queue.length - 1))
    setFlipped(false)
  }

  return <>
    <PageHeading title="Flashcards" action={single && <LabLink to="cards">Browse all cards</LabLink>}>
      Study the source answers and explanations. Flashcard reviews are tracked separately from practice answers.
    </PageHeading>
    <div className="lab-filter-row">
      <label>Card type<select value={kind} disabled={pending} onChange={event => changeQueue(setKind, event.target.value)}>
        <option value="question">Question flashcards</option><option value="concept">Concept flashcards</option>
      </select></label>
      {!single && <label>Deck<select value={mode} disabled={pending} onChange={event => changeQueue(setMode, event.target.value)}>
        <option value="all">All cards</option><option value="review">Review queue ({reviewPool.length})</option>
      </select></label>}
      <LabButton disabled={eligible.length < 2 || pending} onClick={() => {
        setRandomOrder(shuffle(eligible).map(item => item.id)); move(0)
      }}>Shuffle</LabButton>
    </div>
    <p className="lab-muted">{reviewed} of {eligible.length} cards reviewed · {reviewPool.length} in the review queue</p>
    {message && <p role="status" className="lab-positive">{message}</p>}
    {q ? <article className="lab-panel lab-flashcard">
      <div className="lab-row"><QuestionMeta question={q} /><span>Card {position + 1} of {queue.length}</span></div>
      <h2 className="lab-source-text">{q.question}</h2>
      {kind === 'concept' && <p className="lab-muted">Concept: {q.subtopic}</p>}
      {flipped && <>
        <ReviewNotice question={q} />
        {kind === 'concept'
          ? <div className="lab-feedback"><h3>Source explanation</h3><p className="lab-source-text">{q.explanation}</p></div>
          : <AnswerFeedback question={q} answers={[]} isAttempt={false} />}
      </>}
      <div className="lab-actions">
        <LabButton primary aria-expanded={flipped} onClick={() => setFlipped(!flipped)}>Flip card</LabButton>
        <Bookmark questionId={q.id} state={state} dispatch={dispatch} />
        <LabButton disabled={!flipped || pending} onClick={() => rate('know')}>Know it</LabButton>
        <LabButton disabled={!flipped || pending} onClick={() => rate('again')}>Review again</LabButton>
      </div>
      {record && <p className="lab-muted">Next review: {new Date(record.dueAt).toLocaleString()}</p>}
      <nav className="lab-actions" aria-label="Flashcard navigation">
        <LabButton disabled={position === 0 || pending} onClick={() => move(position - 1)}>Previous card</LabButton>
        <LabButton disabled={position >= queue.length - 1 || pending} onClick={() => move(position + 1)}>Next card</LabButton>
      </nav>
    </article> : <Empty>{mode === 'review' ? 'No cards are waiting for review.' : 'No cards are available for this selection.'}</Empty>}
    <details className="lab-panel lab-section lab-inline-details">
      <summary>How scheduling works</summary>
      <p>“Review again” schedules a card in 10 minutes and adds it to the review queue immediately.
        “Know it” starts a card at one day, then doubles its interval up to 30 days.</p>
    </details>
  </>
}
