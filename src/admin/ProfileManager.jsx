import { useState, useEffect } from 'react'

export default function ProfileManager({ token }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role_en: '',
    role_de: '',
    tagline_en: '',
    tagline_de: '',
    location_en: '',
    location_de: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.id) {
        setForm(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Loading profile...</div>

  return (
    <div className="admin-manager">
      <h2>Profile Information</h2>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div className="section-divider">English</div>

        <div className="form-row">
          <div className="form-group">
            <label>Professional Title (EN)</label>
            <input
              type="text"
              value={form.role_en}
              onChange={(e) => setForm({ ...form, role_en: e.target.value })}
              placeholder="e.g., Test Manager & Test Automation Engineer"
            />
          </div>
          <div className="form-group">
            <label>Location (EN)</label>
            <input
              type="text"
              value={form.location_en}
              onChange={(e) => setForm({ ...form, location_en: e.target.value })}
              placeholder="e.g., New York, USA"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Tagline (EN)</label>
          <textarea
            value={form.tagline_en}
            onChange={(e) => setForm({ ...form, tagline_en: e.target.value })}
            placeholder="Your professional tagline"
            rows="2"
          />
        </div>

        <div className="section-divider">Deutsch</div>

        <div className="form-row">
          <div className="form-group">
            <label>Berufsbezeichnung (DE)</label>
            <input
              type="text"
              value={form.role_de}
              onChange={(e) => setForm({ ...form, role_de: e.target.value })}
              placeholder="z.B. Testmanager"
            />
          </div>
          <div className="form-group">
            <label>Ort (DE)</label>
            <input
              type="text"
              value={form.location_de}
              onChange={(e) => setForm({ ...form, location_de: e.target.value })}
              placeholder="z.B. Berlin, Deutschland"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Tagsatz (DE)</label>
          <textarea
            value={form.tagline_de}
            onChange={(e) => setForm({ ...form, tagline_de: e.target.value })}
            placeholder="Ihr professioneller Tagsatz"
            rows="2"
          />
        </div>

        {message && <div className={message.includes('Error') ? 'error-message' : 'success-message'}>{message}</div>}

        <button type="submit" className="btn-submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
