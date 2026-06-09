import { useState, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function BlogManager({ token }) {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [lang, setLang] = useState('en')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    published: true,
  })

  useEffect(() => {
    fetchBlogs()
  }, [lang])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/blogs?lang=${lang}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setBlogs(data || [])
    } catch (err) {
      console.error('Error fetching blogs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      ...form,
      lang,
    }

    try {
      const url = editingId ? `/api/admin/blogs/${editingId}` : '/api/admin/blogs'
      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save blog')
      }

      resetForm()
      fetchBlogs()
      setShowForm(false)
    } catch (err) {
      console.error('Error saving blog:', err)
    }
  }

  const handleEdit = (blog) => {
    setForm({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      category: blog.category,
      date: blog.date,
      published: blog.published,
    })
    setEditingId(blog.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return

    try {
      const response = await fetch(`/api/admin/blogs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to delete blog')
      }

      fetchBlogs()
    } catch (err) {
      console.error('Error deleting blog:', err)
    }
  }

  const resetForm = () => {
    setForm({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      published: true,
    })
    setEditingId(null)
  }

  return (
    <div className="admin-manager">
      <div className="manager-header">
        <div>
          <h2>Blog Posts</h2>
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
          {showForm ? 'Cancel' : '+ New Blog Post'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g., Testing, Automation"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Published</label>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Brief summary of the blog post"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <ReactQuill
              theme="snow"
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="Write your blog post here..."
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['blockquote', 'code-block'],
                  ['link', 'image'],
                  ['clean'],
                ],
              }}
            />
          </div>

          <button type="submit" className="btn-submit">
            {editingId ? 'Update Blog Post' : 'Create Blog Post'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading blogs...</div>
      ) : blogs.length === 0 ? (
        <div className="empty-state">No blog posts yet. Create one to get started!</div>
      ) : (
        <div className="items-list">
          {blogs.map((blog) => (
            <div key={blog.id} className="item-card">
              <div className="item-header">
                <h3>{blog.title}</h3>
                <div className="item-actions">
                  <button onClick={() => handleEdit(blog)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(blog.id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </div>
              <p className="item-meta">
                {blog.date} • {blog.category}
              </p>
              <p className="item-excerpt">{blog.excerpt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
