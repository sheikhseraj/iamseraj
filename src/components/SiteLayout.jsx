import { useState, useEffect } from 'react'
import { profile, ui } from '../data.js'
import { LangContext, useLang } from '../lang.js'
import ChatWidget from '../ChatWidget.jsx'

const NAV_IDS = ['about','skills','projects','tools','cloud-journey','experience','education','certifications','contact']
function Navbar({ community, practiceLab }) {
  const { lang, setLang } = useLang(), t = ui[lang]
  const [open, setOpen] = useState(false), [scrolled, setScrolled] = useState(false)
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
  const links = community ? [['/', lang === 'de' ? 'Startseite' : 'Home'], ['/community', lang === 'de' ? 'Community' : 'Community'],
    ['#community-rules', lang === 'de' ? 'Regeln' : 'Rules'], ['#join-request', lang === 'de' ? 'Beitritt anfragen' : 'Request to join']]
    : practiceLab ? [['/', lang === 'de' ? 'Startseite' : 'Home'], ['/#tools', 'Tools'], ['/aws-practice', 'AWS Practice Lab']]
    : NAV_IDS.map(id => [`#${id}`, t.nav[id]])
  return <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}><div className="container nav__inner">
    <a href={community || practiceLab ? '/' : '#top'} className="nav__brand"><img src={profile.logo} alt={profile.name} className="nav__logo" /></a>
    <button className="nav__toggle" aria-label={lang === 'de' ? 'Menü' : 'Menu'} aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(value => !value)}><span /><span /><span /></button>
    <nav id="site-navigation" className={`nav__links ${open ? 'is-open' : ''}`} inert={mobile && !open ? '' : undefined} aria-hidden={mobile && !open ? true : undefined} aria-label={lang === 'de' ? 'Hauptnavigation' : 'Main navigation'}>
      {links.map(([href,label]) => <a key={href} href={href} aria-current={href === '/community' || href === '/aws-practice' ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</a>)}
      <button className="lang-toggle" onClick={() => setLang(lang === 'en' ? 'de' : 'en')} aria-label={lang === 'de' ? 'Sprache wechseln' : 'Switch language'}>{t.switchTo}</button>
    </nav>
  </div></header>
}
function Footer() {
  const { lang } = useLang()
  return <footer className="footer"><div className="container"><p>© {new Date().getFullYear()} {profile.name}. {ui[lang].footerBuilt}</p>
    <a href="/community" className="site-community-link" style={{ display: 'inline-block', color: 'var(--accent-2)', marginTop: 12, fontSize: '.85rem' }}>{lang === 'de' ? 'Lokale Community entdecken' : 'Discover the local community'} →</a>
  </div></footer>
}
export default function SiteLayout({ children, community = false, practiceLab = false, includeChat = false }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem('lang') === 'de' ? 'de' : 'en' } catch { return 'en' } })
  useEffect(() => { try { localStorage.setItem('lang', lang) } catch { /* Storage is optional. */ } document.documentElement.lang = lang }, [lang])
  return <LangContext.Provider value={{ lang, setLang }}><Navbar community={community} practiceLab={practiceLab} /><main className={community ? 'public-community' : undefined}>{children}</main><Footer />{includeChat && <ChatWidget />}</LangContext.Provider>
}
