import { useState, useEffect } from 'react'

export default function CertificationsManager({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('en')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', year: '' })

  useEffect(() => {
    fetchItems()
  }, [lang])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/certifications?lang=${lang}`, {
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
      const url = editingId ? `/api/admin/certifications/${editingId}` : '/api/admin/certifications'
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
    setForm({ name: item.name, year: item.year })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this certification?')) return
    try {
      const response = await fetch(`/api/admin/certifications/${id}`, {
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
    setForm({ name: '', year: '' })
    setEditingId(null)
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="admin-manager">
      <div className="manager-header">
        <div>
          <h2>Certifications</h2>
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
          {showForm ? 'Cancel' : '+ Add Certification'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Certification Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., ISTQB Certified Tester" required />
          </div>

          <div className="form-group">
            <label>Year</label>
            <input type="text" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g., 2024" />
          </div>

          <button type="submit" className="btn-submit">
            {editingId ? 'Update' : 'Add'} Certification
          </button>
        </form>
      )}

      <div className="items-list">
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <div className="item-header">
              <div>
                <h3>{item.name}</h3>
                <p className="text-muted">{item.year}</p>
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
