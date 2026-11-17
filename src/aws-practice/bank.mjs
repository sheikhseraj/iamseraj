import rawBank from './question-bank.json' with { type: 'json' }

function validateBank(bank) {
  if (bank.schemaVersion !== 1 || !Array.isArray(bank.questions)) {
    throw new Error('The AWS question bank format is unsupported.')
  }
  const ids = new Set()
  for (const q of bank.questions) {
    if (!/^ccp-\d+$/.test(q.id) || ids.has(q.id) || ![1, 2, 3, 4].includes(q.domain)
        || typeof q.question !== 'string' || !Array.isArray(q.options)
        || !Array.isArray(q.correctAnswers) || !Array.isArray(q.validationIssues)) {
      throw new Error('The AWS question bank contains an invalid record.')
    }
    ids.add(q.id)
  }
  return bank
}

export const { questions, summary } = validateBank(rawBank)
export const byId = new Map(questions.map(q => [q.id, q]))
export const topics = [...new Set(questions.map(q => q.topic))].sort()
export const practiceBank = questions.filter(q => q.validationIssues.length === 0)
export const mockMinutes = 90

const parent = new Map()
function representative(id) {
  while (parent.has(id)) id = parent.get(id)
  return id
}
for (const group of [...summary.exactDuplicateGroups, ...summary.potentialDuplicatePairs]) {
  const root = representative(group[0])
  for (const id of group.slice(1)) {
    const other = representative(id)
    if (other !== root) parent.set(other, root)
  }
}

export function shuffle(items, random = Math.random) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const item = result[i]
    result[i] = result[j]
    result[j] = item
  }
  return result
}

function uniqueMockPool(pool) {
  const seen = new Set()
  return pool.filter(q => {
    const key = representative(q.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function mockCoverage(pool = questions) {
  const eligible = uniqueMockPool(pool.filter(q => q.eligibleForScoredMock))
  return summary.domains.map(domain => ({
    ...domain,
    available: eligible.filter(q => q.domain === domain.id).length,
  }))
}

export function selectMockQuestions(pool = questions, random = Math.random) {
  const eligible = uniqueMockPool(shuffle(pool.filter(q => q.eligibleForScoredMock), random))
  const selected = summary.domains.flatMap(domain => {
    const available = eligible.filter(q => q.domain === domain.id)
    if (available.length < domain.mockTarget) {
      throw new Error(domain.name + ' needs ' + domain.mockTarget + ' eligible questions. Available: ' + available.length + '.')
    }
    return available.slice(0, domain.mockTarget)
  })
  return shuffle(selected, random).map(q => q.id)
}

export function isCorrect(question, answers) {
  const chosen = new Set(answers)
  return question.correctAnswers.length > 0
    && chosen.size === question.correctAnswers.length
    && question.correctAnswers.every(answer => chosen.has(answer))
}

export function validAnswers(question, answers, allowEmpty = true) {
  return Array.isArray(answers)
    && (allowEmpty || answers.length > 0)
    && new Set(answers).size === answers.length
    && (question.type === 'multiple_response' || answers.length <= 1)
    && answers.every(id => question.options.some(option => option.id === id))
}
