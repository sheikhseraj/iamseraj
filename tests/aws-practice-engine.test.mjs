import test from 'node:test'
import assert from 'node:assert/strict'
import { byId, isCorrect, mockCoverage, practiceBank, questions, selectMockQuestions, summary } from '../src/aws-practice/bank.mjs'
import {
  analytics, applyAction, dayMs, emptyProgress, filterQuestions, flashcardSchedule, indexAttempts,
  newSession, resultStats, secondsRemaining, validateProgress,
} from '../src/aws-practice/learning.mjs'
import { createProgressStore, exportProgress, readProgressFile } from '../src/aws-practice/progress-store.mjs'

const now = 1_800_000_000_000

function begin(kind, ids, id = 'test-session') {
  const session = newSession(kind, ids, 'Test session', now, id)
  return { session, state: applyAction(emptyProgress(), { type: 'start', session, replaceId: null }, now) }
}
function act(state, session, type, extra = {}, at = now + 1000) {
  return applyAction(state, { type, kind: session.kind, sessionId: session.id, ...extra }, at)
}

test('multiple responses require an exact answer set regardless of order', () => {
  const single = questions.find(q => q.type === 'single_choice' && q.correctAnswers.length)
  const multi = questions.find(q => q.type === 'multiple_response' && q.eligibleForScoredMock)
  assert.equal(isCorrect(single, single.correctAnswers), true)
  assert.equal(isCorrect(single, []), false)
  assert.equal(isCorrect(multi, [...multi.correctAnswers].reverse()), true)
  assert.equal(isCorrect(multi, [multi.correctAnswers[0]]), false)
  assert.equal(isCorrect(multi, multi.options.map(option => option.id)), false)
})

test('mock selection fills all quotas, omits review entries and avoids duplicate prompts', () => {
  const ids = selectMockQuestions(questions, () => .37)
  assert.equal(ids.length, 65)
  assert.equal(new Set(ids).size, 65)
  assert.ok(ids.every(id => byId.get(id).eligibleForScoredMock))
  for (const domain of summary.domains) assert.equal(ids.filter(id => byId.get(id).domain === domain.id).length, domain.mockTarget)
  for (const group of [...summary.exactDuplicateGroups, ...summary.potentialDuplicatePairs]) {
    assert.ok(group.filter(id => ids.includes(id)).length < 2)
  }
  assert.ok(mockCoverage().every(domain => domain.available >= domain.mockTarget))
  assert.throws(() => selectMockQuestions(questions.filter(q => q.domain !== 1)), /Cloud Concepts needs 16/)
})

test('practice restores an ungraded selection and records each graded question once', () => {
  const [first, next] = practiceBank
  const { session, state } = begin('practice', [first.id, next.id])
  const selection = { questionId: first.id, answers: first.correctAnswers }
  const selected = act(state, session, 'select', selection)
  assert.equal(selected.attempts.length, 0)
  const recovered = validateProgress(JSON.parse(exportProgress(selected)))
  assert.deepEqual(recovered.sessions.practice.responses[first.id], first.correctAnswers)
  let graded = act(recovered, session, 'grade', { questionId: first.id })
  graded = act(graded, session, 'grade', { questionId: first.id })
  assert.equal(graded.attempts.length, 1)
  assert.equal(graded.attempts[0].correct, true)
  assert.equal(resultStats(act(graded, session, 'finish').results[0]).unanswered, 1)
})

test('an expired exam auto-submits exactly once, including after persisted recovery', () => {
  const ids = selectMockQuestions()
  const { session, state } = begin('exam', ids)
  const q = byId.get(ids[0])
  const answered = act(state, session, 'select', { questionId: q.id, answers: q.correctAnswers })
  assert.equal(answered.attempts.length, 0)
  assert.equal(secondsRemaining(session.deadline, now), 5400)
  assert.equal(secondsRemaining(session.deadline, session.deadline + 2000), 0)
  const recovered = validateProgress(JSON.parse(exportProgress(answered)))
  const finished = applyAction(recovered, { type: 'expire' }, session.deadline + 2000)
  const repeated = act(finished, session, 'finish', {}, session.deadline + 3000)
  assert.equal(repeated.results.length, 1)
  assert.equal(repeated.attempts.length, 1)
  assert.equal(repeated.sessions.exam, null)
  assert.equal(repeated.results[0].endedAt, session.deadline)
  const result = resultStats(repeated.results[0])
  assert.deepEqual([result.correct, result.incorrect, result.unanswered], [1, 0, 64])
  assert.doesNotThrow(() => validateProgress(repeated))
})

test('a correct retry updates latest accuracy and retains every mistake', () => {
  const q = practiceBank[0]
  const wrong = q.options.find(option => !q.correctAnswers.includes(option.id)).id
  const sessions = [[wrong], q.correctAnswers]
  let state = emptyProgress()
  for (const [index, answers] of sessions.entries()) {
    const session = newSession('practice', [q.id], 'Retry example', now, 'attempt-' + index)
    state = applyAction(state, { type: 'start', session, replaceId: null }, now)
    state = act(state, session, 'select', { questionId: q.id, answers })
    state = act(state, session, 'grade', { questionId: q.id }, now + 1001 + index)
    state = act(state, session, 'finish', {}, now + 1005)
  }
  const metrics = analytics(state)
  assert.equal(metrics.all.size, 1)
  assert.equal(metrics.all.get(q.id).incorrect, 1)
  assert.equal(metrics.all.get(q.id).latest.correct, true)
  assert.equal(metrics.practiceAccuracy, 50)
  assert.equal(metrics.firstAccuracy, 0)
  assert.equal(metrics.latestAccuracy, 100)
  assert.equal(metrics.readiness, null)
})

test('search recognizes service names with digits and keeps repeated source numbers', () => {
  const find = query => filterQuestions(questions, { query }, indexAttempts([]), [])
  assert.equal(find('105').length, 2)
  assert.equal(find('q251').length, 2)
  const route = find('Route 53')
  assert.ok(route.some(q => q.subtopic.includes('DNS')))
  assert.ok(route.length > 3)
})

test('flashcards schedule retries in minutes and cap consecutive successful intervals', () => {
  const retry = flashcardSchedule(null, 'again', now)
  assert.equal(retry.dueAt, now + 600_000)
  let review = flashcardSchedule(retry, 'know', now + 600_000)
  assert.equal(review.interval, 1)
  assert.equal(review.dueAt, now + 600_000 + dayMs)
  for (let i = 0; i < 10; i++) review = flashcardSchedule(review, 'know', review.dueAt)
  assert.equal(review.interval, 30)
  assert.equal(review.history.length, 12)
})

test('progress round trips bookmarks and rejects malformed or misleading imports', async () => {
  const store = await createProgressStore(undefined)
  const id = practiceBank[0].id
  await store.dispatch({ type: 'bookmark', questionId: id })
  const state = await store.read()
  const data = await readProgressFile(new Blob([exportProgress(state)]))
  assert.deepEqual(data.bookmarks, [id])
  await assert.rejects(readProgressFile(new Blob(['broken'])), /not valid JSON/)
  assert.throws(() => validateProgress({ ...data, version: 0 }), /Unsupported/)
  assert.throws(() => validateProgress({ ...data, bookmarks: [id, id] }), /invalid/)
  assert.throws(() => validateProgress({ ...data, sessions: { ...data.sessions, unknown: {} } }), /invalid/)
  await store.dispatch({ type: 'reset' })
  assert.deepEqual(await store.read(), emptyProgress())
})
