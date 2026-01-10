import { useState, useEffect } from 'react'
import initialApps from './data/apps.json'
import './App.css'

const STORAGE_KEY = 'dashboard-apps'
const THEME_KEY = 'dashboard-theme'

const categories = ['All', 'Biblical', 'Horticulture', 'Financial', 'Utilities']

function App() {
  const [apps, setApps] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : initialApps
  })

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored !== null) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
  }, [apps])

  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])


  const handleAddApp = (newApp) => {
    const app = { ...newApp, id: Date.now().toString() }
    setApps([...apps, app])
    setIsFormOpen(false)
  }

  const handleEditApp = (updatedApp) => {
    setApps(apps.map(app => app.id === updatedApp.id ? updatedApp : app))
    setEditingApp(null)
    setIsFormOpen(false)
  }

  const handleDeleteApp = (id) => {
    setApps(apps.filter(app => app.id !== id))
    setDeleteConfirm(null)
  }

  const openEditForm = (app) => {
    setEditingApp(app)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingApp(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">🚀 My Apps</h1>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h2>Chris Miller Applications Made with Help of AI</h2>
        </section>

        <div className="apps-header">
          <h3>My Apps</h3>
          <button className="add-btn" onClick={() => setIsFormOpen(true)}>
            + Add App
          </button>
        </div>

        <div className="apps-table-container">
          {apps.length === 0 ? (
            <p className="no-apps">No apps yet. Add one to get started!</p>
          ) : (
            <table className="apps-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>URL</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr key={app.id}>
                    <td className="icon-cell">{app.icon}</td>
                    <td className="name-cell">{app.name}</td>
                    <td className="url-cell">
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {app.url.replace(/^https?:\/\//, '')}
                      </a>
                    </td>
                    <td className="desc-cell">{app.description}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit"
                        onClick={() => openEditForm(app)}
                        aria-label="Edit app"
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => setDeleteConfirm(app.id)}
                        aria-label="Delete app"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {isFormOpen && (
        <AppForm
          app={editingApp}
          onSubmit={editingApp ? handleEditApp : handleAddApp}
          onClose={closeForm}
          categories={categories.filter(c => c !== 'All')}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
            <h3>Delete App?</h3>
            <p>Are you sure you want to delete this app?</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={() => handleDeleteApp(deleteConfirm)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AppForm({ app, onSubmit, onClose, categories }) {
  const [formData, setFormData] = useState(app || {
    name: '',
    url: '',
    description: '',
    icon: '🔗',
    category: categories[0]
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.url) return

    let url = formData.url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    onSubmit({ ...formData, url })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const commonEmojis = ['🔗', '📖', '🌱', '💰', '🔧', '⛪', '🗣️', '📊', '🎮', '📱', '💻', '🌐']

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{app ? 'Edit App' : 'Add New App'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">App Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="My Awesome App"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="url">URL *</label>
            <input
              type="text"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What does this app do?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div className="emoji-picker">
              {commonEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-btn ${formData.icon === emoji ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {app ? 'Save Changes' : 'Add App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
