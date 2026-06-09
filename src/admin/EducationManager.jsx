import { useState, useEffect } from 'react'

export default function EducationManager({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('en')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ degree: '', school: '', period: '' })

  useEffect(() => {
    fetchItems()
  }, [lang])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/education?lang=${lang}`, {
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
    try {
      const url = editingId ? `/api/admin/education/${editingId}` : '/api/admin/education'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lang, ...form }),
      })

      if (!response.ok) throw new Error('Failed')
      resetForm()
      fetchItems()
      setShowForm(false)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleEdit = (item) => {
    setForm({ degree: item.degree, school: item.school, period: item.period })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this education?')) return
    try {
      const response = await fetch(`/api/admin/education/${id}`, {
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
    setForm({ degree: '', school: '', period: '' })
    setEditingId(null)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="admin-manager">
      <div className="manager-header">
        <div>
          <h2>Education</h2>
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
          {showForm ? 'Cancel' : '+ Add Education'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Degree *</label>
            <input value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="e.g., B.Sc. Computer Science" required />
          </div>

          <div className="form-group">
            <label>School/University *</label>
            <input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="e.g., University of Example" required />
          </div>

          <div className="form-group">
            <label>Period</label>
            <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g., 2015 - 2018" />
          </div>

          <button type="submit" className="btn-submit">
            {editingId ? 'Update' : 'Add'} Education
          </button>
        </form>
      )}

      <div className="items-list">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-header">
              <div>
                <h3>{item.degree}</h3>
                <p className="text-muted">{item.school}</p>
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
