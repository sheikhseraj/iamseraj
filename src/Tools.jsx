import SiteLayout from './components/SiteLayout.jsx'
import { useLang } from './lang.js'

function ToolDirectory() {
  const { lang } = useLang()
  return <section id="tools" className="portfolio-page">
    <div className="container">
      <h1 className="portfolio-page__title">Tools</h1>
      <div className="tools-grid">
        <article className="tool-card">
          <div>
            <h2>AWS Cloud Practitioner Practice Lab</h2>
            <p>{lang === 'de'
              ? 'Übungsfragen, Probeklausuren und Lernkarten zur Vorbereitung auf die AWS-Zertifizierung CLF-C02.'
              : 'Prepare for the AWS CLF-C02 certification with practice questions, mock exams, and flashcards.'}</p>
          </div>
          <a className="btn btn--primary" href="/aws-practice">AWS Practice Lab</a>
        </article>
      </div>
    </div>
  </section>
}

export default function Tools() {
  return <SiteLayout page="/tools" pageTitle="Tools"><ToolDirectory /></SiteLayout>
}
