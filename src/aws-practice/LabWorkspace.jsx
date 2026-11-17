import { useEffect } from 'react'
import { Empty, LabLink } from './LabUi.jsx'
import { PracticePicker, QuestionBrowser } from './Browse.jsx'
import { MockPage, SessionPage, SessionResult } from './Sessions.jsx'
import Flashcards from './Flashcards.jsx'
import Progress from './Progress.jsx'
import Account from './Account.jsx'

export default function LabWorkspace({ route, state, metrics, dispatch, start, go, account, sign, readGuest }) {
  const [view, id] = route.split('/')
  useEffect(() => {
    document.querySelector('.aws-lab [data-page-title]')?.focus({ preventScroll: true })
  }, [route])
  if (['practice', 'domains', 'topics'].includes(view)) return <PracticePicker key={view} mode={view} state={state} start={start} />
  if (['search', 'mistakes', 'saved'].includes(view)) return <QuestionBrowser key={view} mode={view} state={state} dispatch={dispatch} start={start} />
  if (view === 'cards') return <Flashcards key={id || 'deck'} questionId={id} state={state} dispatch={dispatch} />
  if (view === 'mock') return <MockPage state={state} start={start} />
  if (view === 'account') return <Account account={account} sign={sign} readGuest={readGuest} dispatch={dispatch} />
  if (view === 'progress') return <Progress state={state} metrics={metrics} dispatch={dispatch} account={account} />
  if (view === 'practice-session' || view === 'exam-session') {
    return <SessionPage kind={view === 'practice-session' ? 'practice' : 'exam'} state={state} dispatch={dispatch} go={go} />
  }
  if (view === 'result') {
    const result = state.results.find(item => item.id === id)
    if (result) return <SessionResult key={result.id} result={result} state={state} dispatch={dispatch} />
  }
  return <Empty action={<LabLink to="dashboard">Return to dashboard</LabLink>}>This lab page or result is unavailable.</Empty>
}
