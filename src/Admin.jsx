import { useState, useEffect } from 'react'
import AdminLogin from './admin/AdminLogin'
import AdminDashboard from './admin/AdminDashboard'

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('admin_token'))
  const [loading, setLoading] = useState(!token)

  useEffect(() => {
    const stored = localStorage.getItem('admin_token')
    if (stored) {
      setToken(stored)
    }
    setLoading(false)
  }, [])

  const handleLogin = (newToken) => {
    localStorage.setItem('admin_token', newToken)
    setToken(newToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  if (loading) {
    return <div className="admin-loading">Loading...</div>
  }

  return token ? (
    <AdminDashboard token={token} onLogout={handleLogout} />
  ) : (
    <AdminLogin onLogin={handleLogin} />
  )
}
