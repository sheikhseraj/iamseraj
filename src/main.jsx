import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Admin from './Admin.jsx'
import './index.css'

function Router() {
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin')

  useEffect(() => {
    const handlePopState = () => {
      setIsAdmin(window.location.pathname === '/admin')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return isAdmin ? <Admin /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
