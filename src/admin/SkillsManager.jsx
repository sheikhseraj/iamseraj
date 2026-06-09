import { useState, useEffect } from 'react'

export default function SkillsManager({ token }) {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ group_en: '', group_de: '', items: '' })

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/skills', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setSkills(data || [])
    } catch (err) {
      console.error('Error fetching skills:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const items = form.items.split('\n').filter((i) => i.trim())

    try {
      const url = editingId ? `/api/admin/skills/${editingId}` : '/api/admin/skills'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_en: form.group_en,
          group_de: form.group_de,
          items,
        }),
      })

      if (!response.ok) throw new Error('Failed to save skill')
      resetForm()
      fetchSkills()
      setShowForm(false)
    } catch (err) {
      console.error('Error saving skill:', err)
    }
  }

  const handleEdit = (skill) => {
    setForm({
      group_en: skill.group_en,
      group_de: skill.group_de,
      items: (Array.isArray(skill.items) ? skill.items : []).join('\n'),
    })
    setEditingId(skill.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this skill group?')) return
    try {
      const response = await fetch(`/api/admin/skills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to delete')
      fetchSkills()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const resetForm = () => {
    setForm({ group_en: '', group_de: '', items: '' })
    setEditingId(null)
  }

  if (loading) return <div className="loading">Loading skills...</div>

  return (
    <div className="admin-manager">
      <div className="manager-header">
        <h2>Skills</h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Skill Group'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Group Name (EN) *</label>
              <input
                type="text"
                value={form.group_en}
                onChange={(e) => setForm({ ...form, group_en: e.target.value })}
                placeholder="e.g., Test Automation"
                required
              />
            </div>
            <div className="form-group">
              <label>Gruppenname (DE) *</label>
              <input
                type="text"
                value={form.group_de}
                onChange={(e) => setForm({ ...form, group_de: e.target.value })}
                placeholder="z.B. Testautomatisierung"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Skills (one per line)</label>
            <textarea
              value={form.items}
              onChange={(e) => setForm({ ...form, items: e.target.value })}
              placeholder="Playwright&#10;Selenium&#10;Python"
              rows="4"
            />
          </div>

          <button type="submit" className="btn-submit">
            {editingId ? 'Update' : 'Add'} Skill Group
          </button>
        </form>
      )}

      <div className="items-list">
        {skills.map((skill) => (
          <div key={skill.id} className="item-card">
            <div className="item-header">
              <div>
                <h3>{skill.group_en}</h3>
                <p className="text-muted">{skill.group_de}</p>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(skill)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(skill.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
            <div className="skill-items">
              {Array.isArray(skill.items) &&
                skill.items.map((item, i) => (
                  <span key={i} className="skill-tag">
                    {item}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
