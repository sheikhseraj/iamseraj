import { useState, useEffect } from 'react'
import { profile, socials, skills, projects, experience } from './data.js'
import ChatWidget from './ChatWidget.jsx'

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]

function Navbar() {
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
        <a href="#top" className="nav__brand">{profile.name.split(' ')[0]}<span>.</span></a>
        <button
          className="nav__toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)}>{n.label}</a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="container hero__inner">
        <p className="hero__eyebrow">Hi, my name is</p>
        <h1 className="hero__name">{profile.name}</h1>
        <h2 className="hero__role">{profile.role}</h2>
        <p className="hero__tagline">{profile.tagline}</p>
        <div className="hero__cta">
          <a href="#projects" className="btn btn--primary">View my work</a>
          <a href="#contact" className="btn btn--ghost">Get in touch</a>
          {profile.resumeUrl && (
            <a href={profile.resumeUrl} className="btn btn--ghost" target="_blank" rel="noreferrer">Résumé</a>
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
  return (
    <Section id="about" title="About">
      <div className="about">
        <div className="about__text">
          {profile.about.map((p, i) => <p key={i}>{p}</p>)}
          <p className="about__meta">📍 {profile.location}</p>
        </div>
      </div>
    </Section>
  )
}

function Skills() {
  return (
    <Section id="skills" title="Skills">
      <div className="skills">
        {skills.map((g) => (
          <div key={g.group} className="skills__group">
            <h3>{g.group}</h3>
            <ul>
              {g.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Projects() {
  return (
    <Section id="projects" title="Projects">
      <div className="projects">
        {projects.map((p) => (
          <article key={p.title} className="card">
            <div className="card__top">
              <span className="card__icon">{'</>'}</span>
              <div className="card__links">
                {p.codeUrl && <a href={p.codeUrl} target="_blank" rel="noreferrer">Code</a>}
                {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer">Live</a>}
              </div>
            </div>
            <h3 className="card__title">{p.title}</h3>
            <p className="card__desc">{p.description}</p>
            <ul className="card__tech">
              {p.tech.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  )
}

function Experience() {
  return (
    <Section id="experience" title="Experience">
      <div className="timeline">
        {experience.map((e, i) => (
          <div key={i} className="timeline__item">
            <div className="timeline__dot" />
            <div className="timeline__body">
              <h3>{e.role} <span className="timeline__company">@ {e.company}</span></h3>
              <p className="timeline__period">{e.period}</p>
              <ul>
                {e.points.map((pt, j) => <li key={j}>{pt}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Contact() {
  return (
    <Section id="contact" title="Contact">
      <div className="contact">
        <p>Have a question or want to work together? My inbox is always open.</p>
        <a href={`mailto:${profile.email}`} className="btn btn--primary">Say hello</a>
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
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} {profile.name}. Built with React + Vite.</p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
      <ChatWidget />
    </>
  )
}
