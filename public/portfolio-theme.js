(() => {
  const key = 'portfolio-theme'
  const root = document.documentElement
  const system = window.matchMedia('(prefers-color-scheme: dark)')
  const valid = value => value === 'light' || value === 'dark'

  function readPreference() {
    try {
      const value = localStorage.getItem(key)
      return valid(value) ? value : null
    } catch {
      return null
    }
  }

  let preference = readPreference()
  function applyTheme() {
    root.dataset.theme = preference ?? (system.matches ? 'dark' : 'light')
  }

  applyTheme()
  system.addEventListener('change', applyTheme)
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return
    preference = readPreference()
    applyTheme()
  })

  document.addEventListener('click', event => {
    if (!event.target.closest?.('[data-theme-toggle]')) return
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark'
    applyTheme()
    try { localStorage.setItem(key, preference) } catch { /* The current page can still switch themes. */ }
  })
})()
