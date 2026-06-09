import { useState } from 'react'
import ProfileManager from './ProfileManager'
import BlogManager from './BlogManager'
import SkillsManager from './SkillsManager'
import ExperienceManager from './ExperienceManager'
import EducationManager from './EducationManager'
import CertificationsManager from './CertificationsManager'
import './admin.css'

export default function AdminDashboard({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('blogs')

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'blogs', label: 'Blog Posts' },
  ]

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
            onClick={() => setActiveTab(tab.id)}
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
