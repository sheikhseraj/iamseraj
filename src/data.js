// ============================================================
//  EDIT THIS FILE to make the portfolio yours.
//  Everything the site displays comes from here.
// ============================================================

export const profile = {
  name: 'Seraj',
  role: 'Test Manager & Test Automation Engineer',
  tagline:
    'I lead QA strategy and build robust test automation — now powered by AI agents.',
  location: 'Your City, Country',
  email: 'herrsiddiqui@gmail.com',
  resumeUrl: '', // e.g. '/resume.pdf' (place the file in /public)
  about: [
    'I\'m a Test Manager and Test Automation Engineer who turns quality into a ' +
      'competitive advantage. I design test strategies, lead QA teams, and build ' +
      'automation frameworks that catch issues early and ship with confidence.',
    'Lately I\'ve been bringing AI agents into the testing loop — using LLMs to ' +
      'generate test cases, triage failures, and self-heal flaky tests. I also ' +
      'write code, so I bridge the gap between QA and engineering.',
  ],
}

export const socials = [
  { label: 'GitHub', url: 'https://github.com/yourusername' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/yourusername' },
  { label: 'Email', url: 'mailto:herrsiddiqui@gmail.com' },
]

export const skills = [
  {
    group: 'Test Management',
    items: ['Test Strategy', 'Test Planning', 'Risk-Based Testing', 'Team Leadership', 'Agile / Scrum', 'Jira / Xray'],
  },
  {
    group: 'Test Automation',
    items: ['Selenium', 'Playwright', 'Cypress', 'Appium', 'REST Assured', 'TestNG / JUnit', 'Postman'],
  },
  {
    group: 'AI & Agents',
    items: ['LLM Test Generation', 'AI Failure Triage', 'Self-Healing Tests', 'Prompt Engineering', 'OpenAI / Claude APIs'],
  },
  {
    group: 'Development & DevOps',
    items: ['Java', 'Python', 'JavaScript', 'SQL', 'Git', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Docker'],
  },
]

export const projects = [
  {
    title: 'AI-Powered Test Automation Framework',
    description:
      'A Playwright + AI agent framework that auto-generates test cases from ' +
      'user stories, self-heals broken selectors, and triages failures using an ' +
      'LLM — cutting test maintenance effort significantly.',
    tech: ['Playwright', 'TypeScript', 'OpenAI API', 'CI/CD'],
    liveUrl: '',
    codeUrl: '',
  },
  {
    title: 'End-to-End Automation Suite',
    description:
      'A scalable UI + API automation suite covering critical business flows, ' +
      'integrated into the CI/CD pipeline with parallel execution and rich ' +
      'reporting for fast feedback on every commit.',
    tech: ['Selenium', 'Java', 'TestNG', 'Jenkins'],
    liveUrl: '',
    codeUrl: '',
  },
  {
    title: 'QA Strategy & Test Management',
    description:
      'Defined and rolled out a company-wide test strategy: test planning, ' +
      'risk-based prioritization, defect governance, and quality metrics ' +
      'dashboards that gave leadership clear release-readiness signals.',
    tech: ['Jira', 'Xray', 'Agile', 'Reporting'],
    liveUrl: '',
    codeUrl: '',
  },
  {
    title: 'AI Test Assistant Agent',
    description:
      'A chat-based AI agent that helps QA engineers write, review, and run ' +
      'tests in natural language — bridging manual testers and automation code.',
    tech: ['Python', 'Claude API', 'LangChain'],
    liveUrl: '',
    codeUrl: '',
  },
]

export const experience = [
  {
    role: 'Test Manager',
    company: 'Company Name',
    period: '2023 — Present',
    points: [
      'Lead a QA team and own the end-to-end test strategy across multiple products.',
      'Introduced AI-assisted testing, reducing test maintenance and triage time.',
      'Established quality metrics and release-readiness reporting for stakeholders.',
    ],
  },
  {
    role: 'Test Automation Engineer',
    company: 'Previous Company',
    period: '2020 — 2023',
    points: [
      'Built and maintained UI and API automation frameworks integrated with CI/CD.',
      'Increased automation coverage and reduced regression cycle time.',
      'Mentored manual testers in moving toward automation.',
    ],
  },
]
