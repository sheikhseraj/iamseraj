import { useState } from 'react'
import { blogs, ui } from './data.js'
import { useLang } from './lang.js'

export default function Blog() {
  const { lang } = useLang()
  const [selectedBlog, setSelectedBlog] = useState(null)
  const labels = { en: { share: 'Share', close: 'Close' }, de: { share: 'Teilen', close: 'Schließen' } }

  const shareOnLinkedIn = (blog) => {
    const url = window.location.href
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank'
    )
  }

  const shareOnXing = (blog) => {
    const url = window.location.href
    const title = blog.title
    window.open(
      `https://www.xing.com/spi/shares/new?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      '_blank'
    )
  }

  const shareOnTwitter = (blog) => {
    const url = window.location.href
    const text = `Check out: ${blog.title}`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    )
  }

  return (
    <section id="blog" className="section">
      <div className="container">
        <h2 className="section__title"><span>#</span> {ui[lang].titles.blog}</h2>

        {/* Blog cards grid */}
        <div className="blog-grid">
          {blogs[lang].map((post) => (
            <article key={post.id} className="blog-card" role="button" tabIndex="0" onClick={() => setSelectedBlog(post)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedBlog(post) }}>
              <div className="blog-card__header">
                <h3 className="blog-card__title">{post.title}</h3>
              </div>
              <div className="blog-card__body">
                <p className="blog-card__excerpt">{post.excerpt}</p>
                <div className="blog-card__meta">
                  <span className="blog-card__date">{post.date}</span>
                  <span className="blog-card__category">{post.category}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Blog modal */}
        {selectedBlog && (
          <div className="blog-modal-overlay" onClick={() => setSelectedBlog(null)}>
            <div className="blog-modal" role="dialog" aria-modal="true" aria-labelledby="blog-modal-title" onClick={(e) => e.stopPropagation()}>
              <button className="blog-modal__close" aria-label={labels[lang].close} onClick={() => setSelectedBlog(null)}>×</button>
              <h2 id="blog-modal-title" className="blog-modal__title">{selectedBlog.title}</h2>
              <div className="blog-modal__meta">
                <span>{selectedBlog.date}</span>
                <span>{selectedBlog.category}</span>
              </div>
              <div className="blog-modal__content">
                {selectedBlog.content}
              </div>
              <div className="blog-modal__share">
                <p>{labels[lang].share}:</p>
                <button onClick={() => shareOnLinkedIn(selectedBlog)} className="share-btn linkedin">LinkedIn</button>
                <button onClick={() => shareOnXing(selectedBlog)} className="share-btn xing">Xing</button>
                <button onClick={() => shareOnTwitter(selectedBlog)} className="share-btn twitter">Twitter</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
