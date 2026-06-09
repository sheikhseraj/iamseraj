import 'dotenv/config'
import { initDb, isReady, saveAnswer } from './db.js'

// Pre-written Q&A based on Seraj's CV / website. These load into MySQL as
// 'seed' answers so common questions are served instantly without an AI call.
// Add, edit, or remove pairs freely, then re-run `npm run seed`.
const SEED = [
  {
    q: 'What do you do?',
    a: "I'm a Test Manager and Test Automation Engineer. I lead QA strategy, build robust test automation frameworks, and bring AI agents into the testing process to catch issues early and ship with confidence.",
  },
  {
    q: 'Tell me about your test automation experience',
    a: 'I build and maintain UI and API automation frameworks with tools like Selenium, Playwright, Cypress, Appium, and REST Assured, integrated into CI/CD pipelines for fast feedback on every commit. I focus on stable, maintainable suites that increase coverage and cut regression time.',
  },
  {
    q: 'What is your experience as a test manager?',
    a: 'As a Test Manager I own end-to-end test strategy across products, lead QA teams, and set up risk-based test planning, defect governance, and quality metrics that give leadership clear release-readiness signals.',
  },
  {
    q: 'How do you use AI in testing?',
    a: 'I use AI agents and LLMs to generate test cases from user stories, triage failures automatically, and self-heal flaky tests when selectors change. This significantly reduces test maintenance and triage effort.',
  },
  {
    q: 'What tools and technologies do you use?',
    a: 'For automation: Selenium, Playwright, Cypress, Appium, REST Assured, TestNG/JUnit, and Postman. For AI testing: LLM test generation, AI failure triage, and self-healing tests. For development and DevOps: Java, Python, JavaScript, SQL, Git, CI/CD, Jenkins, GitHub Actions, and Docker.',
  },
  {
    q: 'What programming languages do you know?',
    a: 'I work mainly with Java, Python, and JavaScript, and I use SQL for data validation. That lets me bridge the gap between QA and engineering.',
  },
  {
    q: 'Can you tell me about your projects?',
    a: "Some highlights: an AI-Powered Test Automation Framework that auto-generates tests and self-heals broken selectors; an end-to-end UI + API automation suite wired into CI/CD; a company-wide QA strategy with quality dashboards; and an AI Test Assistant agent that helps QA engineers write and run tests in natural language.",
  },
  {
    q: 'Are you a developer?',
    a: "I'm primarily a Test Manager and Automation Engineer, but I also write code — Java, Python, and JavaScript — so I can build tooling and bridge QA with the engineering team.",
  },
  {
    q: 'How can I contact you?',
    a: 'The best way to reach me is by email at herrsiddiqui@gmail.com. You can also find me via the links in the contact section of this site.',
  },
  {
    q: 'Are you available for work?',
    a: "I'm always open to interesting opportunities in test management and automation. The best way to start a conversation is to email me at herrsiddiqui@gmail.com.",
  },
  {
    q: 'What makes you a good test manager?',
    a: 'I combine QA leadership with hands-on automation and coding skills, and I bring modern AI-assisted testing into the workflow. That means I can set strategy, build the automation to back it up, and keep quality measurable and visible to stakeholders.',
  },
  {
    q: 'Do you have experience with CI/CD?',
    a: 'Yes — I integrate automated UI and API tests into CI/CD pipelines using tools like Jenkins and GitHub Actions, with parallel execution and reporting so teams get fast quality feedback on every commit.',
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
