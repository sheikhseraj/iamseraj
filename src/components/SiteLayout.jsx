import { useState, useEffect, useRef } from 'react'
import { profile, ui } from '../data.js'
import { LangContext, useLang } from '../lang.js'
import ChatWidget from '../ChatWidget.jsx'
import ThemeToggle from './ThemeToggle.jsx'

const portfolioSections = ['about', 'skills', 'projects', 'cloud-journey', 'experience', 'education', 'certifications', 'contact']

function Navbar({ page }) {
  const { lang, setLang } = useLang()
  const t = ui[lang]
  const german = lang === 'de'
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const header = useRef(null)
  const menuButton = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    function dismiss(event) {
      if (!header.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('focusin', dismiss)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('focusin', dismiss)
    }
  }, [open])

  const groups = [
    {
      title: 'Portfolio',
      links: [['/', german ? 'Startseite' : 'Home'], ...portfolioSections.map(id => [
        (page === '/' ? '#' : '/#') + id, t.nav[id],
      ])],
    },
    {
      title: german ? 'Entdecken' : 'Explore',
      links: [['/blog', t.nav.blog], ['/tools', t.nav.tools], ['/aws-practice', 'AWS Practice Lab'], ['/community', 'Community']],
    },
  ]
  if (page === '/community') {
    groups[1].links.push(['#community-rules', german ? 'Regeln' : 'Rules'], ['#join-request', german ? 'Beitritt anfragen' : 'Request to join'])
  }

  function dismissOnEscape(event) {
    if (event.key === 'Escape' && open) {
      setOpen(false)
      menuButton.current?.focus()
    }
  }

  return <header ref={header} className={`nav ${scrolled ? 'nav--scrolled' : ''}`} onKeyDown={dismissOnEscape}>
    <div className="container nav__inner">
      <a href={page === '/' ? '#top' : '/'} className="nav__brand"><img src={profile.logo} alt={profile.name} className="nav__logo" /></a>
      <div className="nav__actions">
        <button type="button" ref={menuButton} className="nav__toggle" aria-expanded={open} aria-controls="site-navigation"
          onClick={() => setOpen(value => !value)}>
          <span className="nav__menu-icon" aria-hidden="true"><i /><i /><i /></span>
          {german ? 'Menü' : 'Menu'}
        </button>
        <nav id="site-navigation" className="nav__links" hidden={!open} inert={!open ? '' : undefined}
          aria-label={german ? 'Hauptnavigation' : 'Main navigation'}>
          {groups.map(group => <div key={group.title} className="nav__group">
            <span>{group.title}</span>
            <ul>{group.links.map(([href, label]) => <li key={href}>
              <a href={href} aria-current={href === page ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</a>
            </li>)}</ul>
          </div>)}
        </nav>
        <ThemeToggle lang={lang} />
        <button type="button" className="lang-toggle" onClick={() => setLang(german ? 'en' : 'de')}
          aria-label={german ? 'Sprache wechseln' : 'Switch language'}>{t.switchTo}</button>
      </div>
    </div>
  </header>
}

function Footer() {
  const { lang } = useLang()
  return <footer className="footer"><div className="container"><p>© {new Date().getFullYear()} {profile.name}. {ui[lang].footerBuilt}</p>
    <a href="/community" className="site-community-link" style={{ display: 'inline-block', color: 'var(--accent-2)', marginTop: 12, fontSize: '.85rem' }}>{lang === 'de' ? 'Lokale Community entdecken' : 'Discover the local community'} →</a>
  </div></footer>
}
export default function SiteLayout({ children, page = '/', pageTitle, community = false, practiceLab = false, includeChat = false }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('lang') === 'de' ? 'de' : 'en' } catch { return 'en' } })
  useEffect(() => { try { localStorage.setItem('lang', lang) } catch { /* Storage is optional. */ } document.documentElement.lang = lang }, [lang])
  useEffect(() => {
    if (!pageTitle) return
    const previousTitle = document.title
    document.title = pageTitle + ' | ' + profile.name
    return () => { document.title = previousTitle }
  }, [pageTitle])
  const currentPage = community ? '/community' : practiceLab ? '/aws-practice' : page
  return <LangContext.Provider value={{ lang, setLang }}><Navbar key={currentPage} page={currentPage} /><main className={community ? 'public-community' : undefined}>{children}</main><Footer />{includeChat && <ChatWidget />}</LangContext.Provider>
}
