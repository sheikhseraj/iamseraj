import { useState, useEffect, useRef } from 'react'
import { profile, socials, skills, experience, education, certifications, languages, projects, ui } from './data.js'
import { LangContext, useLang } from './lang.js'
import ChatWidget from './ChatWidget.jsx'
import Connect from './Connect.jsx'
import Blog from './Blog.jsx'

const NAV_IDS = ['about', 'skills', 'projects', 'experience', 'education', 'certifications', 'connect', 'blog', 'contact']

function Navbar() {
  const { lang, setLang } = useLang()
  const t = ui[lang]
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="container nav__inner">
        <a href="#top" className="nav__brand">
          <img src={profile.logo} alt={profile.name} className="nav__logo" />
        </a>
        <button className="nav__toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span /><span /><span />
        </button>
        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          {NAV_IDS.map((id) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{t.nav[id]}</a>
          ))}
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
            aria-label="Switch language"
          >
            {t.switchTo}
          </button>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  const { lang } = useLang()
  const t = ui[lang]
  return (
    <section id="top" className="hero">
      <div className="container hero__inner">
        <p className="hero__eyebrow">{t.hero.eyebrow}</p>
        <h1 className="hero__name">{profile.name}</h1>
        <h2 className="hero__role">{profile.role[lang]}</h2>
        <p className="hero__tagline">{profile.tagline[lang]}</p>
        <div className="hero__cta">
          <a href="#experience" className="btn btn--primary">{t.hero.viewWork}</a>
          <a href="#contact" className="btn btn--ghost">{t.hero.getInTouch}</a>
          {profile.resumeUrl && (
            <a href={profile.resumeUrl} className="btn btn--ghost" target="_blank" rel="noreferrer">{t.hero.resume}</a>
          )}
        </div>
        <div className="hero__socials">
          {socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
          ))}
        </div>
      </div>
    </section>
  )
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="section">
      <div className="container">
        <h2 className="section__title"><span>#</span> {title}</h2>
        {children}
      </div>
    </section>
  )
}

function About() {
  const { lang } = useLang()
  const t = ui[lang]
  return (
    <Section id="about" title={t.titles.about}>
      <div className="about">
        <div className="about__text">
          {profile.about[lang].map((p, i) => <p key={i}>{p}</p>)}
          <p className="about__meta">📍 {profile.location[lang]}</p>
        </div>
      </div>
    </Section>
  )
}

function Skills() {
  const { lang } = useLang()
  const t = ui[lang]
  return (
    <Section id="skills" title={t.titles.skills}>
      <div className="skills">
        {skills.map((g) => (
          <div key={g.group.en} className="skills__group">
            <h3>{g.group[lang]}</h3>
            <ul>{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Projects() {
  const { lang } = useLang()
  const t = ui[lang]
  const [filter, setFilter] = useState('all')
  const [idx, setIdx] = useState(0)
  const trackRef = useRef(null)

  const filters = [
    { key: 'all', en: 'All', de: 'Alle' },
    { key: 'qa', en: 'QA / Testing', de: 'QA / Testing' },
    { key: 'dev', en: 'Development', de: 'Entwicklung' },
    { key: 'cicd', en: 'CI/CD', de: 'CI/CD' },
  ]

  const categoryMap = {
    portfolio: ['dev', 'qa'],
    qaops: ['qa', 'cicd', 'dev'],
    cicd: ['cicd', 'dev'],
    langnation: ['qa'],
    futureingermany: ['qa'],
    'business-sites': ['qa'],
  }

  const visible = projects.filter(p => filter === 'all' || (categoryMap[p.id] || []).includes(filter))
  const VISIBLE = 3
  const maxIdx = Math.max(0, visible.length - VISIBLE)

  function changeFilter(key) {
    setFilter(key)
    setIdx(0)
  }

  function slide(dir) {
    setIdx(prev => Math.min(maxIdx, Math.max(0, prev + dir)))
  }

  useEffect(() => {
    if (!trackRef.current) return
    const cardW = trackRef.current.querySelector('.proj-card')?.offsetWidth || 0
    const gap = 18
    trackRef.current.style.transform = `translateX(-${idx * (cardW + gap)}px)`
  }, [idx, visible.length])

  return (
    <Section id="projects" title={t.titles.projects}>
      <div className="proj-controls">
        <div className="proj-filters">
          {filters.map(f => (
            <button
              key={f.key}
              className={`proj-filter ${filter === f.key ? 'proj-filter--active' : ''}`}
              onClick={() => changeFilter(f.key)}
            >
              {f[lang]}
            </button>
          ))}
        </div>
        <div className="proj-arrows">
          <button className="proj-arrow" onClick={() => slide(-1)} disabled={idx === 0} aria-label="Previous">&#8592;</button>
          <span className="proj-counter">{idx + 1} / {maxIdx + 1}</span>
          <button className="proj-arrow" onClick={() => slide(1)} disabled={idx >= maxIdx} aria-label="Next">&#8594;</button>
        </div>
      </div>

      <div className="proj-slider">
        <div className="proj-track" ref={trackRef}>
          {visible.map(p => (
            <div key={p.id} className={`proj-card ${p.featured ? 'proj-card--featured' : ''}`}>
              <div className="proj-card__top">
                {p.featured && <div className="proj-card__badge">★ Featured</div>}
                <div className="proj-card__icon">
                  <i className={`ti ${p.icon}`} aria-hidden="true" />
                </div>
                <h3 className="proj-card__title">{p.title[lang]}</h3>
                <p className="proj-card__desc">{p.desc[lang]}</p>
              </div>
              <div className="proj-card__tags">
                {p.tags.map(tag => <span key={tag} className="proj-tag">{tag}</span>)}
              </div>
              <div className="proj-card__footer">
                <div className="proj-card__role">
                  <span className={`proj-dot proj-dot--${p.status}`} />
                  <span>{p.role[lang]}</span>
                </div>
                <div className="proj-card__links">
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                      <i className="ti ti-brand-github" aria-hidden="true" /> Code
                    </a>
                  )}
                  {p.demo && (
                    <a href={p.demo} target="_blank" rel="noreferrer" aria-label="Live demo">
                      <i className="ti ti-external-link" aria-hidden="true" /> Live
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="proj-dots">
        {Array.from({ length: maxIdx + 1 }).map((_, i) => (
          <button key={i} className={`proj-dot-btn ${i === idx ? 'proj-dot-btn--active' : ''}`} onClick={() => setIdx(i)} aria-label={`Go to slide ${i + 1}`} />
        ))}
      </div>
    </Section>
  )
}

function Experience() {
  const { lang } = useLang()
  const t = ui[lang]
  return (
    <Section id="experience" title={t.titles.experience}>
      <div className="timeline">
        {experience[lang].map((e, i) => (
          <div key={i} className="timeline__item">
            <div className="timeline__dot" />
            <div className="timeline__body">
              <h3>{e.role} <span className="timeline__company">@ {e.company}</span></h3>
              <p className="timeline__period">{e.location} · {e.period}</p>
              <ul>{e.points.map((pt, j) => <li key={j}>{pt}</li>)}</ul>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Education() {
  const { lang } = useLang()
  const t = ui[lang]
  return (
    <Section id="education" title={t.titles.education}>
      <div className="timeline">
        {education[lang].map((e, i) => (
          <div key={i} className="timeline__item">
            <div className="timeline__dot" />
            <div className="timeline__body">
              <h3>{e.degree}</h3>
              <p className="timeline__period">{e.period}</p>
              <p className="edu__school">{e.school}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Certifications() {
  const { lang } = useLang()
  const t = ui[lang]

  // ISTQB certificate badge logo
  const ISTQBLogo = () => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      {/* Outer dark circle (certificate base) */}
      <circle cx="50" cy="50" r="48" fill="#1a3a52" opacity="0.9" />

      {/* Gold/brass border ring (premium certificate look) */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#d4a574" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#d4a574" strokeWidth="0.8" opacity="0.6" />

      {/* White center circle (certificate paper) */}
      <circle cx="50" cy="50" r="42" fill="#fafafa" />

      {/* Subtle star/seal mark at top */}
      <circle cx="50" cy="25" r="3.5" fill="#d4a574" />

      {/* ISTQB text - main */}
      <text x="50" y="47" fontSize="13" fontWeight="bold" fill="#0052cc" textAnchor="middle" fontFamily="Arial, sans-serif">ISTQB</text>

      {/* Decorative line */}
      <line x1="35" y1="55" x2="65" y2="55" stroke="#d4a574" strokeWidth="0.8" opacity="0.5" />

      {/* Certificate text */}
      <text x="50" y="68" fontSize="5" fill="#666" textAnchor="middle" fontFamily="Arial, sans-serif">CERTIFIED</text>
    </svg>
  )

  return (
    <Section id="certifications" title={t.titles.certifications}>
      <div className="certs">
        {certifications[lang].map((c, i) => (
          <div key={i} className="cert-card">
            <div className="cert-card__logo">
              <ISTQBLogo />
            </div>
            <div className="cert-card__content">
              <h3>{c.name}</h3>
              <p>{c.year}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="langs">
        <h3 className="langs__title">{t.titles.languages}</h3>
        <ul>
          {languages[lang].map((l) => (
            <li key={l.name}><strong>{l.name}</strong> — {l.level}</li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function Contact() {
  const { lang } = useLang()
  const t = ui[lang]
  return (
    <Section id="contact" title={t.titles.contact}>
      <div className="contact">
        <p>{t.contact.blurb}</p>
        <a href={`mailto:${profile.email}`} className="btn btn--primary">{t.contact.sayHello}</a>
        <div className="contact__details">
          <span>📧 {profile.email}</span>
          <span>📞 {profile.phone}</span>
          <span>📍 {profile.location[lang]}</span>
        </div>
        <div className="contact__socials">
          {socials.map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Footer() {
  const { lang } = useLang()
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} {profile.name}. {ui[lang].footerBuilt}</p>
      </div>
    </footer>
  )
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en')

  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <div className="exp-edu-grid">
          <Experience />
          <Education />
        </div>
        <Certifications />
        <Connect />
        <Blog />
        <Contact />
      </main>
      <Footer />
      <ChatWidget />
    </LangContext.Provider>
  )
}
