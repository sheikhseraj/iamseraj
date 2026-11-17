import { useState, useEffect, useCallback } from 'react'
import AdminLogin from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'
import { bootstrapAdmin, tokenExpired } from './admin/community/api.js'

export default function Admin() {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setAuthError('')
    const stored = localStorage.getItem('admin_token')
    bootstrapAdmin(globalThis.fetch, controller.signal).then(sessionToken => {
      if (controller.signal.aborted) return
      if (sessionToken) setToken(sessionToken)
      else if (stored && !tokenExpired(stored)) setToken(stored)
      else { localStorage.removeItem('admin_token'); setToken(null) }
    }).catch(error => {
      if (!controller.signal.aborted) {
        if (stored && !tokenExpired(stored)) setToken(stored)
        else setAuthError(error.message)
      }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retry])

  const handleLogin = (newToken) => {
    setAuthError('')
    localStorage.setItem('admin_token', newToken)
    setToken(newToken)
  }

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('admin_token')
    setToken(null)
    setAuthError('Your admin session has expired. Please sign in again.')
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch('/admin/api/logout', { method: 'POST', credentials: 'same-origin' })
      if (!response.ok) throw new Error('Sign-out failed. Please try again.')
      localStorage.removeItem('admin_token'); setToken(null); setAuthError('')
    } catch (error) { setAuthError(error.message) }
  }

  if (loading) {
    return <div className="admin-loading">Loading...</div>
  }

  return <>{authError && <div className="error-message" role="alert">{authError}<button className="btn-edit" onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
    {token ? <AdminDashboard token={token} onLogout={handleLogout} onUnauthorized={handleUnauthorized} /> : <AdminLogin onLogin={handleLogin} />}
  </>
}
