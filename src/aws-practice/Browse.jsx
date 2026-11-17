import { useMemo, useState } from 'react'
import { practiceBank, questions, shuffle, summary, topics } from './bank.mjs'
import { filterQuestions, indexAttempts, poolStats } from './learning.mjs'
import { Bookmark, Empty, LabButton, LabLink, Meter, PageHeading, ReportIssue, ReviewQuestion, statusOptions } from './LabUi.jsx'

const statuses = statusOptions.filter(([key]) => ['all', 'unattempted', 'incorrect', 'saved'].includes(key))
const pageSize = 15

function Select({ label, value, onChange, items }) {
  return <label>{label}<select value={value} onChange={event => onChange(event.target.value)}>
    {items.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
  </select></label>
}

function PoolStats({ pool, index }) {
  const stats = poolStats(pool, index)
  return <>
    <p className="lab-muted">{stats.total} questions · {stats.attempted} attempted</p>
    <p className="lab-muted">{stats.correct} correct · {stats.incorrect} incorrect · {stats.accuracy}% latest accuracy</p>
    <Meter value={stats.completion} label={'Completion: ' + stats.completion + '%'} />
    <small>{stats.completion}% complete</small>
  </>
}

const blocks = Array.from({ length: Math.ceil(summary.total / 30) }, (_, index) => {
  const first = index * 30 + 1
  const last = Math.min(first + 29, summary.total)
  return { title: 'Questions ' + first + '–' + last, pool: practiceBank.filter(q => q.sourceOrder >= first && q.sourceOrder <= last) }
})

export function PracticePicker({ mode, state, start }) {
  const [status, setStatus] = useState('all')
  const [order, setOrder] = useState('source')
  const [keyword, setKeyword] = useState('')
  const index = useMemo(() => indexAttempts(state.attempts), [state.attempts])
  const isTopic = mode === 'topics'
  const isDomain = mode === 'domains'
  const title = isDomain ? 'Practice by domain' : isTopic ? 'Practice by topic' : 'Practice all questions'
  const groups = isDomain ? summary.domains.map(domain => ({
    title: domain.name, classified: domain.total, extra: domain.weight + '% exam weight', pool: practiceBank.filter(q => q.domain === domain.id),
  })) : isTopic ? topics.map(topic => ({
    title: topic, pool: practiceBank.filter(q => q.topic === topic),
  })).filter(group => !keyword.trim() || [group.title, ...group.pool.map(q => q.subtopic)].some(
    item => item.toLowerCase().includes(keyword.trim().toLowerCase()),
  )) : blocks

  function selection(pool) {
    return filterQuestions(pool, { status }, index, state.bookmarks)
  }
  function begin(pool, label) {
    const eligible = selection(pool)
    start('practice', (order === 'random' ? shuffle(eligible) : eligible).map(q => q.id), label)
  }

  return <>
    <PageHeading title={title} action={state.sessions.practice && <LabLink to="practice-session">Resume practice</LabLink>}>
      {isDomain ? 'Review the four CLF-C02 domains and focus on one at a time.'
        : isTopic ? 'Choose a topic or subtopic from the imported bank.'
          : 'Work through blocks of up to 30 questions in source order, or choose a randomized session.'}
    </PageHeading>
    <div className="lab-filter-row">
      <Select label="Questions" value={status} onChange={setStatus} items={statuses} />
      <Select label="Order" value={order} onChange={setOrder}
        items={[[ 'source', 'Sequential' ], [ 'random', 'Randomized' ]]} />
      {isTopic && <label>Find a topic<input type="search" value={keyword} onChange={event => setKeyword(event.target.value)} /></label>}
      {mode === 'practice' && <LabButton primary disabled={selection(practiceBank).length === 0}
        onClick={() => begin(practiceBank, 'All practice questions')}>Start all matching questions</LabButton>}
    </div>
    {!groups.length && <Empty>No topics match your search.</Empty>}
    <div className="lab-grid">
      {groups.map(group => {
        const selected = selection(group.pool)
        const subtopics = isTopic ? [...new Set(group.pool.map(q => q.subtopic).filter(Boolean))].sort() : []
        return <article key={group.title} className={'lab-panel lab-pool' + (isDomain ? ' aws-lab__domain' : '')}>
          <div className="lab-row"><h2>{group.title}</h2>{group.extra && <span className="lab-accent">{group.extra}</span>}</div>
          {isDomain && group.classified !== group.pool.length && <p className="lab-muted">{group.classified} classified, including entries in source review.</p>}
          <PoolStats pool={group.pool} index={index} />
          <LabButton disabled={!selected.length} onClick={() => begin(group.pool, group.title)}>Practice {selected.length} questions</LabButton>
          {subtopics.length > 0 && <details className="lab-subtopics">
            <summary>View subtopics</summary>
            {subtopics.map(subtopic => {
              const pool = group.pool.filter(q => q.subtopic === subtopic)
              return <LabButton key={subtopic} disabled={selection(pool).length === 0}
                onClick={() => begin(pool, subtopic)}>{subtopic} ({selection(pool).length})</LabButton>
            })}
          </details>}
        </article>
      })}
    </div>
    <p className="lab-muted lab-note">Source entries with incomplete keys remain available in question search.</p>
  </>
}

export function QuestionBrowser({ mode, state, dispatch, start }) {
  const [domain, setDomain] = useState('')
  const [topic, setTopic] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(0)
  const index = useMemo(() => indexAttempts(state.attempts), [state.attempts])
  const selected = new Set(state.bookmarks)
  const pool = mode === 'saved' ? questions.filter(q => selected.has(q.id))
    : mode === 'mistakes' ? questions.filter(q => index.get(q.id)?.incorrect)
      : questions
  const matched = filterQuestions(pool, { domain, topic, query, status }, index, state.bookmarks)
  const eligible = matched.filter(q => !q.validationIssues.length)
  const topicOptions = [...new Set(pool.filter(q => !domain || q.domain === Number(domain)).map(q => q.topic))].sort()
  const pages = Math.max(1, Math.ceil(matched.length / pageSize))
  const currentPage = Math.min(page, pages - 1)
  const titles = { search: 'Question search', mistakes: 'My mistakes', saved: 'Saved questions' }
  const title = titles[mode]
  const intro = mode === 'mistakes' ? 'Review every question you have missed and see how your latest answer compares.'
    : mode === 'saved' ? 'Review bookmarked questions or practise a filtered set.'
      : 'Find source questions by number, keyword, AWS service, domain, or topic.'

  function update(setter, value) { setter(value); setPage(0) }
  return <>
    <PageHeading title={title}>{intro}</PageHeading>
    <div className="lab-filter-row">
      <label>Search questions<input type="search" value={query} placeholder="e.g. Q67 or Route 53"
        onChange={event => update(setQuery, event.target.value)} /></label>
      <Select label="Domain" value={domain} onChange={value => { setTopic(''); update(setDomain, value) }}
        items={[[ '', 'All domains' ], ...summary.domains.map(d => [d.id, d.name])]} />
      <Select label="Topic" value={topic} onChange={value => update(setTopic, value)}
        items={[[ '', 'All topics' ], ...topicOptions.map(t => [t, t])]} />
      <Select label="Status" value={status} onChange={value => update(setStatus, value)} items={statusOptions} />
    </div>
    <div className="lab-row lab-list-toolbar">
      <p role="status">{matched.length} {matched.length === 1 ? 'question' : 'questions'}</p>
      <LabButton primary disabled={!eligible.length} onClick={() => start('practice', eligible.map(q => q.id), title)}>
        Practice matching questions
      </LabButton>
    </div>
    {!matched.length && <Empty>{mode === 'mistakes' && !pool.length ? 'Questions you miss will appear here.'
      : mode === 'saved' && !pool.length ? 'Save a question to add it to this list.' : 'No questions match these filters.'}</Empty>}
    <div className="lab-list">
      {matched.slice(currentPage * pageSize, currentPage * pageSize + pageSize).map(q => {
        const item = index.get(q.id)
        return <ReviewQuestion key={q.id} question={q}>
          <div className="lab-actions">
            <Bookmark questionId={q.id} state={state} dispatch={dispatch} />
            <ReportIssue questionId={q.id} dispatch={dispatch} />
          </div>
          <p className="lab-muted">{q.id} · {q.reviewStatus === 'needs_review' ? 'Source review needed' : 'Structurally validated'}</p>
          {item && <p className="lab-muted">{item.total} attempts · {item.correct} correct · {item.incorrect} incorrect
            {' · Latest: '}{item.latest.correct ? 'correct' : 'incorrect'}{' · '}{new Date(item.latest.at).toLocaleDateString()}</p>}
          {mode === 'mistakes' && item?.latest.correct && <p className="lab-positive">Correct on your latest attempt</p>}
        </ReviewQuestion>
      })}
    </div>
    {pages > 1 && <div className="lab-row lab-pagination">
      <LabButton disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous page</LabButton>
      <span>Page {currentPage + 1} of {pages}</span>
      <LabButton disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage + 1)}>Next page</LabButton>
    </div>}
  </>
}
