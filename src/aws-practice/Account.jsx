import { useState } from 'react'
import { LabButton, LabLink, PageHeading } from './LabUi.jsx'

export default function Account({ account, sign, readGuest, dispatch }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function authenticate(event) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setMessage('')
    setError('')
    try {
      await sign(mode, { username, password })
      setPassword('')
      setMessage(mode === 'register' ? 'Your account is ready.' : 'You are signed in.')
    } catch (failure) { setError(failure.message) }
    finally { setPending(false) }
  }

  async function signOut() {
    setPending(true)
    setMessage('')
    setError('')
    try {
      await sign('logout')
      setMode('login')
      setMessage('Signed out. You can continue as a guest.')
    } catch (failure) { setError(failure.message) }
    finally { setPending(false) }
  }

  async function copyGuest() {
    setPending(true)
    setMessage('')
    setError('')
    try {
      const progress = await readGuest()
      if (!progress) throw new Error('Guest progress could not be read.')
      if (!window.confirm('Copy guest progress from this browser to your account? This replaces the account’s current learning progress.')) return
      if (await dispatch({ type: 'import', progress })) setMessage('Guest progress copied to your account.')
    } catch (failure) { setError(failure.message) }
    finally { setPending(false) }
  }

  return <>
    <PageHeading title="Practice Lab account">
      Practise as a guest with this browser, or sign in to keep your progress with your account across devices.
    </PageHeading>
    <section className="lab-panel lab-account">
      {account ? <>
        <h2>Signed in as {account.username}</h2>
        <p className="lab-muted">Your answers, sessions, mock exam history, flashcards, bookmarks, and preferences are saved to your account.</p>
        <div className="lab-actions">
          <LabLink primary to="dashboard">Continue practising</LabLink>
          <LabButton disabled={pending} onClick={copyGuest}>Copy guest progress to account</LabButton>
          <LabButton disabled={pending} onClick={signOut}>Sign out</LabButton>
        </div>
      </> : <>
        <div className="lab-actions" aria-label="Account options">
          <LabButton aria-pressed={mode === 'login'} disabled={pending} onClick={() => { setMode('login'); setError('') }}>Sign in</LabButton>
          <LabButton aria-pressed={mode === 'register'} disabled={pending} onClick={() => { setMode('register'); setError('') }}>Create account</LabButton>
        </div>
        <form className="lab-account-form" onSubmit={authenticate}>
          <label>Username<input required autoComplete="username" autoCapitalize="none" spellCheck="false"
            minLength={3} maxLength={32} value={username} onChange={event => setUsername(event.target.value)} /></label>
          <label>Password<input type="password" required minLength={mode === 'register' ? 12 : 1} maxLength={512}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password} onChange={event => setPassword(event.target.value)} /></label>
          {mode === 'register' && <p className="lab-muted">Use at least 12 characters. Choose a username with letters, numbers, dots, hyphens, or underscores.</p>}
          <div className="lab-actions">
            <button className="lab-button lab-button--primary" disabled={pending}>{mode === 'register' ? 'Register' : 'Sign in to account'}</button>
            <LabLink to="dashboard">Continue as guest</LabLink>
          </div>
        </form>
      </>}
      {error && <p role="alert" className="lab-negative">{error}</p>}
      {message && <p role="status" className="lab-positive">{message}</p>}
    </section>
  </>
}
