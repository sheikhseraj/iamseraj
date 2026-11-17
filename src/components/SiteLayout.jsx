import { useState, useEffect, useRef } from 'react'
import { profile, ui } from '../data.js'
import { LangContext, useLang } from '../lang.js'
import ChatWidget from '../ChatWidget.jsx'

const PORTFOLIO_NAV = ['about', 'projects', 'experience', 'certifications']
const MORE_NAV = ['skills', 'cloud-journey', 'education']

function Navbar({ page }) {
  const { lang, setLang } = useLang(), t = ui[lang]
  const [open, setOpen] = useState(false), [scrolled, setScrolled] = useState(false)
  const moreMenu = useRef(null)
  const menuButton = useRef(null)
  const [mobile, setMobile] = useState(() => window.matchMedia?.('(max-width: 960px)').matches || false)
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 960px)')
    if (!media) return
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update); return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll(); window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const isPortfolio = page !== '/community' && page !== '/aws-practice'
  const home = lang === 'de' ? 'Startseite' : 'Home'
  const sectionUrl = id => (page === '/' ? '#' : '/#') + id
  const links = page === '/community'
    ? [['/', home], ['/community', 'Community'], ['#community-rules', lang === 'de' ? 'Regeln' : 'Rules'],
      ['#join-request', lang === 'de' ? 'Beitritt anfragen' : 'Request to join']]
    : page === '/aws-practice'
      ? [['/', home], ['/blog', t.nav.blog], ['/tools', t.nav.tools], ['/aws-practice', 'AWS Practice Lab']]
      : [...PORTFOLIO_NAV.map(id => [sectionUrl(id), t.nav[id]]), ['/blog', t.nav.blog], ['/tools', t.nav.tools], [sectionUrl('contact'), t.nav.contact]]

  function closeMenu() {
    if (moreMenu.current) moreMenu.current.open = false
    setOpen(false)
  }

  function dismissOnEscape(event) {
    if (event.key !== 'Escape') return
    if (moreMenu.current?.open) {
      moreMenu.current.open = false
      moreMenu.current.querySelector('summary')?.focus()
    } else if (open) {
      setOpen(false)
      menuButton.current?.focus()
    }
  }

  return <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`} onKeyDown={dismissOnEscape}><div className="container nav__inner">
    <a href={page === '/' ? '#top' : '/'} className="nav__brand"><img src={profile.logo} alt={profile.name} className="nav__logo" /></a>
    <button ref={menuButton} className="nav__toggle" aria-label={lang === 'de' ? 'Menü' : 'Menu'} aria-expanded={open}
      aria-controls="site-navigation" onClick={() => open ? closeMenu() : setOpen(true)}><span /><span /><span /></button>
    <nav id="site-navigation" className={`nav__links ${open ? 'is-open' : ''}`} inert={mobile && !open ? '' : undefined}
      aria-hidden={mobile && !open ? true : undefined} aria-label={lang === 'de' ? 'Hauptnavigation' : 'Main navigation'}>
      {links.map(([href, label]) => <a key={href} href={href} aria-current={href === page ? 'page' : undefined} onClick={closeMenu}>{label}</a>)}
      {isPortfolio && <details ref={moreMenu} className="nav__more" onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false
      }}>
        <summary>{t.nav.more}</summary>
        <div className="nav__more-links">
          {MORE_NAV.map(id => <a key={id} href={sectionUrl(id)} onClick={closeMenu}>{t.nav[id]}</a>)}
        </div>
      </details>}
      <button className="lang-toggle" onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
        aria-label={lang === 'de' ? 'Sprache wechseln' : 'Switch language'}>{t.switchTo}</button>
    </nav>
  </div></header>
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
