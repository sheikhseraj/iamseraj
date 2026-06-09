import { useEffect, useState } from 'react'
import { profile, connect, github, profileCard, ui } from './data.js'
import { useLang } from './lang.js'

// Brand glyphs (simple-icons paths, 24×24 viewBox)
const ICONS = {
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  xing: 'M18.188 0c-.517 0-.741.325-.927.66 0 0-7.455 13.224-7.702 13.657.015.024 4.919 9.023 4.919 9.023.17.308.436.66.967.66h3.454c.211 0 .375-.078.463-.22.089-.151.089-.346-.009-.536l-4.879-8.916c-.004-.006-.004-.016 0-.022L22.139.756c.095-.191.097-.387.006-.535C22.056.078 21.894 0 21.686 0h-3.498zM3.648 4.74c-.211 0-.385.074-.473.216-.09.149-.078.339.02.531l2.34 4.05c.004.01.004.016 0 .021L1.86 16.051c-.099.188-.093.381 0 .529.085.142.239.234.45.234h3.461c.518 0 .766-.348.945-.667l3.734-6.609-2.378-4.155c-.172-.315-.434-.659-.962-.659H3.648v.016z',
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
}

// Banner gradient color per platform (the card's brand accent).
const BANNER = { linkedin: '#0A66C2', xing: '#0698A0', github: '#2f3645' }

const resolveUrl = (url, lang) => (typeof url === 'string' ? url : url[lang])

function ProfileCard({ card, avatar, lang, t }) {
  return (
    <a className="pcard" href={card.url} target="_blank" rel="noreferrer" style={{ '--brand': BANNER[card.key] }}>
      <div className="pcard__banner" />
      <div className="pcard__header">
        <img className="pcard__avatar" src={avatar} alt={profile.name} onError={(e) => { e.currentTarget.src = profile.logo }} />
        <svg className="pcard__icon" viewBox="0 0 24 24" fill="currentColor"><path d={ICONS[card.key]} /></svg>
      </div>
      <div className="pcard__body">
        <h3 className="pcard__name">{profile.name}</h3>
        <p className="pcard__headline">{card.headline}</p>
        <span className="pcard__btn">{t.connectUI.viewProfile}</span>
      </div>
    </a>
  )
}

export default function Connect() {
  const { lang } = useLang()
  const t = ui[lang]
  const [gh, setGh] = useState(null)

  // Fetch live GitHub data (bio, repos, followers, avatar).
  useEffect(() => {
    let alive = true
    fetch(`https://api.github.com/users/${github.username}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setGh(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const get = (key) => connect.find((c) => c.key === key)
  // GitHub avatar comes from the live API (with a hotlink fallback).
  const ghAvatar = gh?.avatar_url || `https://github.com/${github.username}.png`
  const cards = [
    { key: 'linkedin', url: resolveUrl(get('linkedin').url, lang), avatar: get('linkedin').photo, headline: profileCard.headline[lang] },
    { key: 'xing', url: resolveUrl(get('xing').url, lang), avatar: get('xing').photo, headline: profileCard.headline[lang] },
    {
      key: 'github',
      url: resolveUrl(get('github').url, lang),
      avatar: ghAvatar,
      headline: profileCard.githubTagline[lang],
    },
  ]

  return (
    <section id="connect" className="section">
      <div className="container">
        <h2 className="section__title"><span>#</span> {t.titles.connect}</h2>

        {/* ---- Live profile cards (one per platform) ---- */}
        <div className="pcards">
          {cards.map((card) => (
            <ProfileCard key={card.key} card={card} avatar={card.avatar || profile.logo} lang={lang} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
