import { useState, useEffect } from 'react'

export default function ExperienceManager({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('en')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    role: '',
    company: '',
    location: '',
    period: '',
    points: '',
  })

  useEffect(() => {
    fetchItems()
  }, [lang])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/experience?lang=${lang}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setItems(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const points = form.points.split('\n').filter((p) => p.trim())

    try {
      const url = editingId ? `/api/admin/experience/${editingId}` : '/api/admin/experience'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lang,
          role: form.role,
          company: form.company,
          location: form.location,
          period: form.period,
          points,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')
      resetForm()
      fetchItems()
      setShowForm(false)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleEdit = (item) => {
    setForm({
      role: item.role,
      company: item.company,
      location: item.location,
      period: item.period,
      points: (Array.isArray(item.points) ? item.points : []).join('\n'),
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this experience?')) return
    try {
      const response = await fetch(`/api/admin/experience/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed')
      fetchItems()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const resetForm = () => {
    setForm({ role: '', company: '', location: '', period: '', points: '' })
    setEditingId(null)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="admin-manager">
      <div className="manager-header">
        <div>
          <h2>Experience</h2>
          <div className="lang-selector">
            <label>Language:</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Experience'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Job Title *</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g., Test Manager"
                required
              />
            </div>
            <div className="form-group">
              <label>Company *</label>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Period</label>
              <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="Jan 2020 - Dec 2021" />
            </div>
          </div>

          <div className="form-group">
            <label>Key Points (one per line)</label>
            <textarea value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} rows="4" />
          </div>

          <button type="submit" className="btn-submit">
            {editingId ? 'Update' : 'Add'} Experience
          </button>
        </form>
      )}

      <div className="items-list">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-header">
              <div>
                <h3>{item.role}</h3>
                <p className="text-muted">
                  {item.company} • {item.location}
                </p>
                <p className="text-muted">{item.period}</p>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(item)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(item.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
