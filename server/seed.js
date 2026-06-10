import 'dotenv/config'
import { initDb, isReady, saveAnswer } from './db.js'

// Pre-written Q&A based on Seraj's CV / website. These load into MySQL as
// 'seed' answers so common questions are served instantly without an AI call.
// Add, edit, or remove pairs freely, then re-run `npm run seed`.
const SEED = [
  // --- English ---
  {
    q: 'What do you do?',
    a: "I'm an ISTQB Advanced Level certified Test Manager and Test Automation Engineer with 3+ years of experience. I lead test strategy, build automation frameworks with Playwright and Selenium, and integrate testing into CI/CD pipelines.",
  },
  {
    q: 'Tell me about your test automation experience',
    a: 'At Akkodis I built test automation frameworks with Playwright & Selenium (Python/JavaScript) from the ground up — 50+ automated test cases reaching 70% coverage, which cut manual test time by 30% — and integrated them into CI/CD pipelines with Jenkins and Azure DevOps.',
  },
  {
    q: 'What is your experience as a test manager?',
    a: 'As Test Manager at Akkodis GmbH (2023–2025) I had overall responsibility for test management in international client projects: test strategy, test concepts, regression suites, structured defect management with Jira & Xray, and reporting risks and quality metrics to stakeholders.',
  },
  {
    q: 'How do you use AI in testing?',
    a: "I'm deepening my expertise in AI-driven test automation with Playwright MCP and Claude Code — spinning up AI agents for testing, CI/CD testing and automated reporting. I believe the future of QA lies in combining automation with AI.",
  },
  {
    q: 'What tools and technologies do you use?',
    a: 'Automation: Playwright, Selenium WebDriver, Pytest, TestNG. API testing: Postman, REST API, Swagger. Test management: Jira, Xray, Confluence, TestRail, MS Azure Test Plans. DevOps/CI-CD: Jenkins, Git, GitHub, Azure DevOps, Docker. Programming: Python, JavaScript, C++.',
  },
  {
    q: 'What certifications do you have?',
    a: "I'm ISTQB® Certified Tester — Advanced Level Test Manager (CTAL-TM) and ISTQB® Certified Tester Foundation Level v4.0, both from 2024.",
  },
  {
    q: 'What is your education?',
    a: 'I hold an M.Sc. in Mechanical Engineering with a focus on Digitalization from TH Nürnberg (completed entirely in German), and a B.Tech. in Mechanical Engineering from India. I also completed German language courses up to C1.',
  },
  {
    q: 'What languages do you speak?',
    a: 'I speak German and English fluently, both at C1 level. I completed my Master’s degree in German and my Bachelor’s in English.',
  },
  {
    q: 'How can I contact you?',
    a: 'The best way to reach me is by email at herrsiddiqui@gmail.com or by phone at +49 176 5524 1842. I’m based in Magdeburg, Germany and open to relocating anywhere in Germany.',
  },
  {
    q: 'Are you available for work?',
    a: "I'm open to Test Manager and test automation roles across Germany. The best way to start a conversation is to email me at herrsiddiqui@gmail.com.",
  },
  // --- German ---
  {
    q: 'Was machst du beruflich?',
    a: 'Ich bin ISTQB Advanced Level zertifizierter Testmanager und Testautomatisierungs-Ingenieur mit über 3 Jahren Erfahrung. Ich verantworte Teststrategien, baue Automatisierungs-Frameworks mit Playwright und Selenium und integriere Tests in CI/CD-Pipelines.',
  },
  {
    q: 'Erzähl mir von deiner Testautomatisierungs-Erfahrung',
    a: 'Bei Akkodis habe ich Testautomatisierungs-Frameworks mit Playwright & Selenium (Python/JavaScript) von Grund auf aufgebaut — 50+ automatisierte Testfälle mit 70 % Abdeckung, was die manuelle Testzeit um 30 % reduziert hat — und in CI/CD-Pipelines mit Jenkins und Azure DevOps integriert.',
  },
  {
    q: 'Welche Zertifizierungen hast du?',
    a: 'Ich bin ISTQB® Certified Tester — Advanced Level Test Manager (CTAL-TM) sowie ISTQB® Certified Tester Foundation Level v4.0, beide aus dem Jahr 2024.',
  },
  {
    q: 'Welche Sprachen sprichst du?',
    a: 'Ich spreche Deutsch und Englisch fließend, beide auf C1-Niveau. Mein Masterstudium habe ich auf Deutsch und mein Bachelorstudium auf Englisch absolviert.',
  },
  {
    q: 'Wie kann ich dich kontaktieren?',
    a: 'Am besten erreichen Sie mich per E-Mail unter herrsiddiqui@gmail.com oder telefonisch unter +49 176 5524 1842. Ich bin in Magdeburg ansässig und deutschlandweit umzugsbereit.',
  },
]

async function run() {
  await initDb()
  if (!isReady()) {
    console.error('❌ Could not connect to MySQL. Check your DB_* values in .env.')
    process.exit(1)
  }
  let n = 0
  for (const { q, a } of SEED) {
    await saveAnswer(q, a, 'seed')
    n++
  }
  console.log(`✅ Seeded ${n} Q&A pairs into the database.`)
  process.exit(0)
}

run().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
