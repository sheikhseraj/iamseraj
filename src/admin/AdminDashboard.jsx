import { lazy, Suspense, useState, useEffect } from 'react'
import ProfileManager from './ProfileManager'
import BlogManager from './BlogManager'
import SkillsManager from './SkillsManager'
import ExperienceManager from './ExperienceManager'
import EducationManager from './EducationManager'
import CertificationsManager from './CertificationsManager'
import './admin.css'
const CommunityManager = lazy(() => import('./community/CommunityManager.jsx'))

export default function AdminDashboard({ token, onLogout, onUnauthorized }) {
  const currentSection = () => {
    const section = new URLSearchParams(window.location.search).get('section')
    return ['profile','skills','experience','education','certifications','blogs','community'].includes(section) ? section : 'blogs'
  }
  const [activeTab, setActiveTab] = useState(currentSection)
  useEffect(() => {
    const handle = () => setActiveTab(currentSection())
    window.addEventListener('popstate', handle); return () => window.removeEventListener('popstate', handle)
  }, [])
  const changeTab = id => {
    setActiveTab(id)
    window.history.pushState(null, '', id === 'community' ? '/admin?section=community&view=overview' : `/admin?section=${id}`)
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'blogs', label: 'Blog Posts' },
    { id: 'community', label: 'WhatsApp Community' },
  ]

  if (activeTab === 'community') return <Suspense fallback={<p className="loading" role="status">Loading WhatsApp Community…</p>}><CommunityManager token={token} onUnauthorized={onUnauthorized} onExit={changeTab} onLogout={onLogout} /></Suspense>

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Portfolio Admin Dashboard</h1>
        <button onClick={onLogout} className="btn-logout">
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => changeTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === 'profile' && <ProfileManager token={token} />}
        {activeTab === 'skills' && <SkillsManager token={token} />}
        {activeTab === 'experience' && <ExperienceManager token={token} />}
        {activeTab === 'education' && <EducationManager token={token} />}
        {activeTab === 'certifications' && <CertificationsManager token={token} />}
        {activeTab === 'blogs' && <BlogManager token={token} />}
      </div>
    </div>
  )
}
