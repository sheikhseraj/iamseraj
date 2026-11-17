import { byId, isCorrect, mockMinutes, practiceBank, questions, summary, validAnswers } from './bank.mjs'

export const dayMs = 86_400_000
export const storageVersion = 1
export const modes = ['practice', 'exam']

export function emptyProgress() {
  return {
    version: storageVersion, attempts: [], bookmarks: [], sessions: { practice: null, exam: null },
    results: [], cards: {}, reports: [], preferences: { passTarget: 70 },
  }
}

export function newSession(kind, ids, title, now = Date.now(), id = crypto.randomUUID()) {
  return {
    id, kind, title, ids, index: 0, responses: {}, graded: [], marked: [],
    startedAt: now, deadline: kind === 'exam' ? now + mockMinutes * 60_000 : null,
  }
}

export function flashcardSchedule(previous, rating, now) {
  const interval = rating === 'again' ? 0 : Math.min(30, Math.max(1, (previous?.interval ?? 0) * 2))
  return {
    interval, dueAt: now + (interval ? interval * dayMs : 10 * 60_000),
    history: [...(previous?.history ?? []), { rating, at: now }],
  }
}

export function secondsRemaining(deadline, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000))
}

function addAttempt(state, session, questionId, at) {
  const answers = session.responses[questionId]
  if (!answers?.length) return
  const id = session.id + ':' + questionId
  if (state.attempts.some(attempt => attempt.id === id)) return
  state.attempts.push({
    id, sessionId: session.id, questionId, answers, at, kind: session.kind,
    correct: isCorrect(byId.get(questionId), answers),
  })
}

function finish(state, session, now) {
  const endedAt = Math.max(session.startedAt, session.kind === 'exam' ? Math.min(now, session.deadline) : now)
  if (session.kind === 'exam') {
    for (const id of session.ids) addAttempt(state, session, id, endedAt)
  }
  state.results.unshift({ ...session, endedAt, passTarget: state.preferences.passTarget })
  state.sessions[session.kind] = null
}

export function applyAction(previous, action, now = Date.now()) {
  const state = structuredClone(previous)
  const exam = state.sessions.exam
  if (exam && now >= exam.deadline) finish(state, exam, now)

  if (action.type === 'expire') return exam && !state.sessions.exam ? state : previous
  if (action.type === 'reset') return emptyProgress()
  if (action.type === 'import') return action.progress

  if (action.type === 'bookmark' && byId.has(action.questionId)) {
    const index = state.bookmarks.indexOf(action.questionId)
    const saved = action.saved ?? (index < 0)
    if (saved && index < 0) state.bookmarks.push(action.questionId)
    if (!saved && index >= 0) state.bookmarks.splice(index, 1)
  }
  if (action.type === 'target' && Number.isInteger(action.value) && action.value >= 1 && action.value <= 100) {
    state.preferences.passTarget = action.value
  }
  if (action.type === 'report' && byId.has(action.questionId) && action.note.trim()) {
    state.reports.push({ id: action.id, questionId: action.questionId, note: action.note.trim().slice(0, 500), at: now })
  }
  if (action.type === 'rate' && validCardId(action.cardId) && ['know', 'again'].includes(action.rating)) {
    state.cards[action.cardId] = flashcardSchedule(state.cards[action.cardId], action.rating, now)
  }
  if (action.type === 'start' && modes.includes(action.session.kind) && validSession(action.session, action.session.kind)) {
    const current = state.sessions[action.session.kind]
    if ((current?.id ?? null) === action.replaceId && !state.results.some(result => result.id === action.session.id)) {
      state.sessions[action.session.kind] = action.session
    }
  }

  const session = state.sessions[action.kind]
  if (!session || session.id !== action.sessionId) return state
  if (action.type === 'move' && Number.isInteger(action.index) && action.index >= 0 && action.index < session.ids.length) {
    session.index = action.index
  }
  const qid = action.questionId
  const isCurrent = session.ids[session.index] === qid
  if (action.type === 'select' && isCurrent && !session.graded.includes(qid) && validAnswers(byId.get(qid), action.answers)) {
    session.responses[qid] = action.answers
  }
  if (action.type === 'mark' && session.kind === 'exam' && isCurrent) {
    session.marked = session.marked.includes(qid) ? session.marked.filter(id => id !== qid) : [...session.marked, qid]
  }
  if (action.type === 'grade' && session.kind === 'practice' && isCurrent
      && !session.graded.includes(qid) && session.responses[qid]?.length) {
    session.graded.push(qid)
    addAttempt(state, session, qid, now)
  }
  if (action.type === 'finish') finish(state, session, now)
  return state
}

export function resultRows(result) {
  return result.ids.map(id => {
    const q = byId.get(id)
    const answers = result.kind === 'practice' && !result.graded.includes(id) ? [] : (result.responses[id] ?? [])
    return { q, answers, status: answers.length ? (isCorrect(q, answers) ? 'correct' : 'incorrect') : 'unanswered' }
  })
}

export function resultStats(result) {
  const rows = resultRows(result)
  const correct = rows.filter(row => row.status === 'correct').length
  const incorrect = rows.filter(row => row.status === 'incorrect').length
  const answered = correct + incorrect
  return {
    rows, correct, incorrect, unanswered: rows.length - answered, answered,
    percent: percentage(correct, result.kind === 'exam' ? rows.length : answered),
  }
}

export function percentage(numerator, denominator) {
  return denominator ? Math.round(numerator / denominator * 100) : 0
}

export function indexAttempts(attempts) {
  const index = new Map()
  for (const attempt of attempts) {
    const item = index.get(attempt.questionId) ?? { total: 0, correct: 0, incorrect: 0 }
    item.total++
    item[attempt.correct ? 'correct' : 'incorrect']++
    if (!item.latest || attempt.at >= item.latest.at) item.latest = attempt
    if (!item.first || attempt.at < item.first.at) item.first = attempt
    index.set(attempt.questionId, item)
  }
  return index
}

export function poolStats(pool, index) {
  const attempted = pool.map(q => index.get(q.id)).filter(Boolean)
  const correct = attempted.filter(item => item.latest.correct).length
  const incorrect = attempted.length - correct
  return {
    total: pool.length, attempted: attempted.length, correct, incorrect,
    completion: percentage(attempted.length, pool.length), accuracy: percentage(correct, attempted.length),
  }
}

export function filterQuestions(pool, { domain = '', topic = '', query = '', status = 'all' }, index, bookmarks) {
  const saved = new Set(bookmarks)
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return pool.filter(q => {
    if ((domain && q.domain !== Number(domain)) || (topic && q.topic !== topic)) return false
    const attempt = index.get(q.id)
    if (status === 'attempted' && !attempt) return false
    if (status === 'unattempted' && attempt) return false
    if (status === 'correct' && !attempt?.latest.correct) return false
    if (status === 'incorrect' && (!attempt || attempt.latest.correct)) return false
    if (status === 'saved' && !saved.has(q.id)) return false
    if (status === 'review' && q.reviewStatus !== 'needs_review') return false
    if (!terms.length) return true
    const text = [q.id, q.originalQuestionNumber, q.sourceLabel, q.question, q.domainName, q.topic, q.subtopic,
      ...q.options.map(option => option.text)].join(' ').toLowerCase()
    if (terms.length === 1 && /^\d+$/.test(terms[0])) return q.originalQuestionNumber === 'Q' + terms[0]
    return terms.every(term => text.includes(term))
  })
}

export function localDateKey(timestamp) {
  const date = new Date(timestamp)
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(value => String(value).padStart(2, '0')).join('-')
}

export function analytics(state) {
  const all = indexAttempts(state.attempts)
  const practiceAttempts = state.attempts.filter(attempt => attempt.kind === 'practice')
  const practice = indexAttempts(practiceAttempts)
  const practiceItems = [...practice.values()]
  const correct = practiceAttempts.filter(attempt => attempt.correct).length
  const completion = percentage(all.size, practiceBank.length)
  const firstAccuracy = percentage(practiceItems.filter(item => item.first.correct).length, practice.size)
  const latestAccuracy = percentage(practiceItems.filter(item => item.latest.correct).length, practice.size)
  const exams = state.results.filter(result => result.kind === 'exam').sort((a, b) => b.endedAt - a.endedAt)
  const examScore = exams.length ? resultStats(exams[0]).percent : null
  const readiness = practice.size >= 20
    ? Math.round(examScore === null ? completion * .5 + firstAccuracy * .5
      : completion * .3 + firstAccuracy * .3 + examScore * .4)
    : null
  const domains = summary.domains.map(domain => ({
    ...poolStats(practiceBank.filter(q => q.domain === domain.id), all), name: domain.name,
  }))
  const topicPools = new Map()
  for (const question of practiceBank) {
    if (!topicPools.has(question.topic)) topicPools.set(question.topic, [])
    topicPools.get(question.topic).push(question)
  }
  const topicPerformance = [...topicPools].map(([name, pool]) => ({ name, ...poolStats(pool, all) }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const weak = topicPerformance.filter(topic => topic.attempted >= 2 && topic.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted)
  return {
    all, practiceAttempts: practiceAttempts.length, correct, incorrect: practiceAttempts.length - correct,
    practiceAccuracy: percentage(correct, practiceAttempts.length), completion, firstAccuracy, latestAccuracy,
    mastered: [...all.values()].filter(item => item.correct >= 2 && item.latest.correct).length,
    needsLearningReview: [...all.values()].filter(item => !item.latest.correct).length,
    exams, readiness, domains, topicPerformance, weak,
  }
}

export function validCardId(id) {
  const [kind, questionId, extra] = typeof id === 'string' ? id.split(':') : []
  const q = byId.get(questionId)
  return extra === undefined && ['question', 'concept'].includes(kind)
    && q?.validationIssues.length === 0 && (kind !== 'concept' || Boolean(q.explanation))
}

export function validSession(session, kind, completed = false) {
  const { ids, responses, graded, marked } = session ?? {}
  const distinct = value => Array.isArray(value) && new Set(value).size === value.length
  return record(session) && token(session.id) && session.kind === kind
    && typeof session.title === 'string' && session.title.trim().length > 0 && session.title.length <= 140
    && distinct(ids) && ids.length > 0 && ids.length <= questions.length
    && ids.every(id => byId.has(id) && (kind === 'exam' ? byId.get(id).eligibleForScoredMock : !byId.get(id).validationIssues.length))
    && Number.isInteger(session.index) && session.index >= 0 && session.index < ids.length
    && timestamp(session.startedAt)
    && (kind === 'exam' ? session.deadline === session.startedAt + mockMinutes * 60_000
      && summary.domains.every(domain => ids.filter(id => byId.get(id).domain === domain.id).length === domain.mockTarget)
      : session.deadline === null)
    && record(responses) && Object.entries(responses).every(([id, answers]) => ids.includes(id) && validAnswers(byId.get(id), answers))
    && distinct(graded) && graded.every(id => kind === 'practice' && ids.includes(id) && responses[id]?.length)
    && distinct(marked) && marked.every(id => kind === 'exam' && ids.includes(id))
    && (!completed || (timestamp(session.endedAt) && session.endedAt >= session.startedAt
      && (kind !== 'exam' || session.endedAt <= session.deadline) && passTarget(session.passTarget)))
}

function record(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function timestamp(value) {
  return Number.isInteger(value) && value >= 0 && value <= 8.64e15
}
function token(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(value)
}
function passTarget(value) {
  return Number.isInteger(value) && value >= 1 && value <= 100
}

export function validateProgress(state) {
  if (!record(state) || state.version !== storageVersion) throw new Error('Unsupported progress file version.')
  const { attempts, bookmarks, sessions, results, cards, reports, preferences } = state
  const attemptIds = new Map()
  const valid = Array.isArray(attempts) && attempts.every(attempt => {
    if (!record(attempt) || !token(attempt.sessionId) || !byId.has(attempt.questionId)) return false
    const q = byId.get(attempt.questionId)
    if (attempt.id !== attempt.sessionId + ':' + q.id || attemptIds.has(attempt.id)
        || !modes.includes(attempt.kind) || !timestamp(attempt.at) || !validAnswers(q, attempt.answers, false)
        || attempt.correct !== isCorrect(q, attempt.answers)) return false
    attemptIds.set(attempt.id, attempt)
    return true
  }) && Array.isArray(bookmarks) && new Set(bookmarks).size === bookmarks.length && bookmarks.every(id => byId.has(id))
    && record(sessions) && Object.keys(sessions).length === modes.length && modes.every(kind => sessions[kind] === null || validSession(sessions[kind], kind))
    && Array.isArray(results) && results.every(result => modes.includes(result?.kind) && validSession(result, result.kind, true))
    && record(cards) && Object.entries(cards).every(([id, card]) => validCardId(id) && record(card)
      && timestamp(card.dueAt) && Number.isInteger(card.interval) && card.interval >= 0 && card.interval <= 30
      && Array.isArray(card.history) && card.history.length && card.history.every(event => record(event)
        && timestamp(event.at) && ['again', 'know'].includes(event.rating)))
    && Array.isArray(reports) && reports.every(report => record(report) && token(report.id) && byId.has(report.questionId)
      && typeof report.note === 'string' && report.note.trim() && report.note.length <= 500 && timestamp(report.at))
    && record(preferences) && passTarget(preferences.passTarget)
  if (!valid) throw new Error('The progress file contains invalid or incompatible learning data.')
  const sessionIds = [...results, ...Object.values(sessions).filter(Boolean)].map(session => session.id)
  if (new Set(sessionIds).size !== sessionIds.length) throw new Error('The progress file has duplicate sessions.')
  const requireAttempts = (session, ids) => ids.every(id => {
    const attempt = attemptIds.get(session.id + ':' + id)
    const chosen = session.responses[id]
    return attempt?.kind === session.kind && attempt.answers.length === chosen.length
      && attempt.answers.every(answer => chosen.includes(answer))
  })
  if ((sessions.practice && !requireAttempts(sessions.practice, sessions.practice.graded))
      || results.some(result => !requireAttempts(result, result.kind === 'practice'
        ? result.graded : result.ids.filter(id => result.responses[id]?.length)))) {
    throw new Error('The progress file is missing attempt history for a saved session.')
  }
  return state
}
