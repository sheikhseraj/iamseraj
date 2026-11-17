export default function ThemeToggle({ lang = 'en' }) {
  return <button type="button" className="site-theme-toggle" data-theme-toggle="">
    <span className="theme-for-dark">
      <span aria-hidden="true">☀</span>
      <span className="theme-label">{lang === 'de' ? 'Helles Design aktivieren' : 'Switch to light mode'}</span>
    </span>
    <span className="theme-for-light">
      <span aria-hidden="true">☾</span>
      <span className="theme-label">{lang === 'de' ? 'Dunkles Design aktivieren' : 'Switch to dark mode'}</span>
    </span>
  </button>
}
