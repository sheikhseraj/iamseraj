import React, { lazy, Suspense, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Load the admin editor only when the admin page is opened.
const Admin = lazy(() => import('./Admin.jsx'))

function Router() {
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin')

  useEffect(() => {
    const handlePopState = () => {
      setIsAdmin(window.location.pathname === '/admin')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return isAdmin ? <Suspense fallback={<p role="status">Loading admin…</p>}><Admin /></Suspense> : <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
