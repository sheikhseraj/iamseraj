import React, { lazy, Suspense, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Load the admin editor only when the admin page is opened.
const Admin = lazy(() => import('./Admin.jsx'))
const Community = lazy(() => import('./Community.jsx'))
const AwsPractice = lazy(() => import('./aws-practice/AwsPractice.jsx'))
const Blog = lazy(() => import('./Blog.jsx'))
const Tools = lazy(() => import('./Tools.jsx'))

function Router() {
  const [pathname, setPathname] = useState(window.location.pathname.replace(/\/$/, '') || '/')

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname.replace(/\/$/, '') || '/')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (pathname === '/admin') return <Suspense fallback={<p role="status">Loading admin…</p>}><Admin /></Suspense>
  if (pathname === '/community') return <Suspense fallback={<p role="status">Loading community…</p>}><Community /></Suspense>
  if (pathname === '/aws-practice') return <Suspense fallback={<p role="status">Loading AWS Practice Lab…</p>}><AwsPractice /></Suspense>
  if (pathname === '/blog') return <Suspense fallback={<p role="status">Loading blog…</p>}><Blog /></Suspense>
  if (pathname === '/tools') return <Suspense fallback={<p role="status">Loading tools…</p>}><Tools /></Suspense>
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
