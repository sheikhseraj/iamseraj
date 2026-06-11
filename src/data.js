// ============================================================
//  All website content — EDIT HERE. Bilingual: English + German.
//  Shared values (name, email, skills tech names) are language-neutral.
// ============================================================

export const profile = {
  name: 'Seraj Ahmad Siddiqui',
  email: 'herrsiddiqui@gmail.com',
  phone: '+49 176 5524 1842',
  logo: '/logo.png',
  // Your profile photo for the cards. Put an image in /public (e.g. photo.jpg)
  // and set it here, e.g. '/photo.jpg'. If empty, falls back to the GitHub avatar.
  photo: '',
  resumeUrl: '', // optional: put a PDF in /public and set e.g. '/cv.pdf'

  role: {
    en: 'Test Manager & Test Automation Engineer',
    de: 'Testmanager & Testautomatisierungs-Ingenieur',
  },
  tagline: {
    en: 'ISTQB Advanced Level certified Test Manager — I build quality in through clear test strategy, automation, and AI-driven testing.',
    de: 'ISTQB Advanced Level zertifizierter Testmanager — ich sichere Qualität durch klare Teststrategie, Automatisierung und KI-gestütztes Testen.',
  },
  location: {
    en: 'Magdeburg, Germany',
    de: 'Magdeburg, Deutschland',
  },
  about: {
    en: [
      "I'm an ISTQB Advanced Level certified Test Manager with 3+ years of experience in test management and quality assurance for complex IT systems. I specialize in test strategy, test automation (Playwright, Selenium, Python/JavaScript), and CI/CD integration (Jenkins, Azure DevOps).",
      'I work in agile teams (Scrum/Kanban), lead international cross-functional teams, and act as the link between development, business units, and management. I speak fluent German and English (C1 each).',
      "Right now I'm deepening my expertise in AI-driven test automation with Playwright MCP and Claude Code — because I believe the future of quality assurance lies in combining automation with AI.",
    ],
    de: [
      'Ich bin ein ISTQB Advanced Level zertifizierter Testmanager mit über 3 Jahren Erfahrung im Testmanagement und in der Qualitätssicherung komplexer IT-Systeme. Mein Schwerpunkt liegt auf Teststrategie, Testautomatisierung (Playwright, Selenium, Python/JavaScript) und CI/CD-Integration (Jenkins, Azure DevOps).',
      'Ich arbeite in agilen Teams (Scrum/Kanban), führe internationale, cross-funktionale Teams und bin das verbindende Element zwischen Entwicklung, Fachbereichen und Management. Ich spreche fließend Deutsch und Englisch (je C1).',
      'Aktuell vertiefe ich mein Wissen in KI-gestützter Testautomatisierung mit Playwright MCP und Claude Code — denn ich bin überzeugt, dass die Zukunft der Qualitätssicherung in der Verbindung von Automatisierung und KI liegt.',
    ],
  },
}

// LinkedIn profile URL is language-aware (English vs. German locale).
const LINKEDIN = {
  en: 'https://www.linkedin.com/in/sheikh-seraj/',
  de: 'https://www.linkedin.com/in/sheikh-seraj/?locale=de_DE',
}
const XING = 'https://www.xing.com/profile/SerajAhmad_Siddiqui/web_profiles'
const GITHUB_URL = 'https://github.com/sheikhseraj'

export const socials = [
  { label: 'LinkedIn', url: LINKEDIN },
  { label: 'Xing', url: XING },
  { label: 'GitHub', url: GITHUB_URL },
  { label: 'Email', url: 'mailto:herrsiddiqui@gmail.com' },
]

// Branded "Connect" cards. (url may be a string or { en, de } for per-language links.)
export const connect = [
  { key: 'linkedin', name: 'LinkedIn', handle: 'Seraj Ahmad Siddiqui', url: LINKEDIN, color: '#0A66C2', photo: '/photo-linkedin.jpg' },
  { key: 'xing', name: 'Xing', handle: 'Seraj Ahmad Siddiqui', url: XING, color: '#0698A0', photo: '/photo-xing.jpg' },
  { key: 'github', name: 'GitHub', handle: '@sheikhseraj', url: GITHUB_URL, color: '#9aa4b8' }, // avatar from GitHub
]

// Live GitHub stats use this username.
export const github = { username: 'sheikhseraj' }

// Headline and tagline for the connect cards.
export const profileCard = {
  headline: {
    en: 'Test Manager & Test Automation Engineer · ISTQB CTAL-TM',
    de: 'Testmanager & Testautomatisierungs-Ingenieur · ISTQB CTAL-TM',
  },
  githubTagline: {
    en: 'Software Quality & Automation',
    de: 'Softwarequalität & Automatisierung',
  },
}

// Blog posts (add your blogs here)
export const blogs = {
  en: [
    {
      id: 1,
      title: 'Getting Started with Test Automation',
      excerpt: 'Learn the fundamentals of test automation and best practices...',
      date: '2026-06-09',
      category: 'Testing',
      content: 'Full blog content here...',
    },
  ],
  de: [
    {
      id: 1,
      title: 'Erste Schritte mit Testautomatisierung',
      excerpt: 'Erfahren Sie die Grundlagen der Testautomatisierung...',
      date: '2026-06-09',
      category: 'Testing',
      content: 'Vollständiger Blog-Inhalt hier...',
    },
  ],
}

// Tech names are the same in both languages; only the group label is translated.
export const skills = [
  { group: { en: 'Test Management', de: 'Testmanagement' }, items: ['Jira', 'Xray', 'Confluence', 'TestRail', 'MS Azure Test Plans'] },
  { group: { en: 'Test Automation', de: 'Testautomatisierung' }, items: ['Playwright', 'Selenium WebDriver', 'Pytest', 'TestNG'] },
  { group: { en: 'API Testing', de: 'API-Testing' }, items: ['Postman', 'REST API', 'Swagger'] },
  { group: { en: 'Programming', de: 'Programmierung' }, items: ['Python', 'JavaScript', 'C++'] },
  { group: { en: 'DevOps & CI/CD', de: 'DevOps & CI/CD' }, items: ['Jenkins', 'Git', 'GitHub', 'Azure DevOps', 'Docker'] },
  { group: { en: 'Methods & Process', de: 'Methoden & Prozesse' }, items: ['Agile (Scrum/Kanban)', 'SDLC', 'V-Model', 'ISTQB'] },
]

export const experience = {
  en: [
    {
      role: 'Test Manager',
      company: 'Akkodis GmbH',
      location: 'Magdeburg',
      period: 'Oct 2023 – Oct 2025',
      points: [
        'Overall responsibility for test management and test coordination in international client projects.',
        'Built and operated test automation frameworks with Playwright & Selenium (Python/JavaScript) and integrated automated tests into CI/CD pipelines (Jenkins, Azure DevOps).',
        'Developed test strategies, test concepts, test cases and regression suites; planned and ran integration, system and regression testing.',
        'Established structured defect management with Jira & Xray and reported risks and quality metrics to stakeholders.',
        'Built 50+ automated test cases reaching 70% coverage → 30% less manual test time; reduced the defect rate and cut documentation effort by 20%.',
      ],
    },
    {
      role: 'Test Engineer',
      company: 'EDAG GmbH',
      location: 'Ingolstadt',
      period: 'Mar 2023 – Aug 2023',
      points: [
        'Created test cases for functional requirements and ran manual system & integration tests.',
        'Developed first Python/Selenium automation scripts and analyzed defects together with developers.',
      ],
    },
    {
      role: 'Project Manager',
      company: 'Alaska Group',
      location: 'Dubai',
      period: 'Mar 2015 – Aug 2017',
      points: [
        'Resource and budget planning, process optimization and stakeholder communication.',
        'Achieved customer satisfaction above 98%.',
      ],
    },
  ],
  de: [
    {
      role: 'Testmanager',
      company: 'Akkodis GmbH',
      location: 'Magdeburg',
      period: '10/2023 – 10/2025',
      points: [
        'Gesamtverantwortung für Testmanagement und Teststeuerung in internationalen Kundenprojekten.',
        'Aufbau und Betrieb von Testautomatisierungs-Frameworks mit Playwright & Selenium (Python/JavaScript) und Integration automatisierter Tests in CI/CD-Pipelines (Jenkins, Azure DevOps).',
        'Entwicklung von Teststrategien, Testkonzepten, Testfällen und Regressionstestsuiten; Planung und Durchführung von Integrations-, System- und Regressionstests.',
        'Etablierung strukturierter Defektmanagement-Prozesse mit Jira & Xray sowie Reporting von Risiken und Qualitätskennzahlen an Stakeholder.',
        'Aufbau von 50+ automatisierten Testfällen mit 70 % Abdeckung → 30 % weniger manuelle Testzeit; Reduktion der Defektrate und 20 % weniger Dokumentationsaufwand.',
      ],
    },
    {
      role: 'Testingenieur',
      company: 'EDAG GmbH',
      location: 'Ingolstadt',
      period: '03/2023 – 08/2023',
      points: [
        'Erstellung von Testfällen für funktionale Anforderungen; manuelle System- und Integrationstests.',
        'Entwicklung erster Python/Selenium-Automatisierungsskripte und Defektanalyse gemeinsam mit Entwicklern.',
      ],
    },
    {
      role: 'Projektmanager',
      company: 'Alaska Group',
      location: 'Dubai',
      period: '03/2015 – 08/2017',
      points: [
        'Ressourcen- und Budgetplanung, Prozessoptimierung und Stakeholder-Kommunikation.',
        'Kundenzufriedenheit von über 98 % erreicht.',
      ],
    },
  ],
}

export const education = {
  en: [
    {
      degree: 'Test Automation with AI — professional training',
      school: 'AI-driven test automation: Playwright MCP & Claude Code, CI/CD testing, automated reporting',
      period: '2026',
    },
    {
      degree: 'M.Sc. Mechanical Engineering — focus on Digitalization',
      school: 'TH Nürnberg · Master thesis: nanostructure pressure sensor (HEIG-VD, Switzerland). Completed entirely in German.',
      period: '2020 – 2022',
    },
    {
      degree: 'German language courses A1–C1',
      school: 'UNS Sprachschule, Hamburg',
      period: '2018 – 2019',
    },
    {
      degree: 'B.Tech. Mechanical Engineering',
      school: 'Uttar Pradesh Technical University, India',
      period: '2010 – 2014',
    },
  ],
  de: [
    {
      degree: 'Testautomatisierung mit KI — praxisorientierte Weiterbildung',
      school: 'KI-gestützte Testautomatisierung: Playwright MCP & Claude Code, CI/CD-Testing, automatisiertes Reporting',
      period: '2026',
    },
    {
      degree: 'M.Sc. Maschinenbau — Schwerpunkt Digitalisierung',
      school: 'TH Nürnberg · Masterarbeit: Nanostruktur-Drucksensor (HEIG-VD, Schweiz). Vollständig auf Deutsch absolviert.',
      period: '2020 – 2022',
    },
    {
      degree: 'Deutsch-Sprachkurse A1–C1',
      school: 'UNS Sprachschule, Hamburg',
      period: '2018 – 2019',
    },
    {
      degree: 'B.Tech. Maschinenbau',
      school: 'Uttar Pradesh Technical University, Indien',
      period: '2010 – 2014',
    },
  ],
}

export const certifications = {
  en: [
    { name: 'ISTQB® Certified Tester — Advanced Level Test Manager (CTAL-TM)', year: '2024' },
    { name: 'ISTQB® Certified Tester — Foundation Level v4.0', year: '2024' },
  ],
  de: [
    { name: 'ISTQB® Certified Tester — Advanced Level Test Manager (CTAL-TM)', year: '2024' },
    { name: 'ISTQB® Certified Tester — Foundation Level v4.0', year: '2024' },
  ],
}

export const languages = {
  en: [
    { name: 'German', level: 'C1 — fluent' },
    { name: 'English', level: 'C1 — fluent' },
  ],
  de: [
    { name: 'Deutsch', level: 'C1 — verhandlungssicher' },
    { name: 'Englisch', level: 'C1 — verhandlungssicher' },
  ],
}


export const projects = [
  {
    id: 'portfolio',
    featured: true,
    icon: 'ti-code',
    title: { en: 'Personal Portfolio — iamseraj.com', de: 'Persönliches Portfolio — iamseraj.com' },
    desc: {
      en: 'Full-stack portfolio site built with React, Node.js & Claude AI. Features a bilingual chat assistant, AI content generator, and job search agent.',
      de: 'Full-Stack-Portfolio mit React, Node.js & Claude KI. Zweisprachiger Chat-Assistent, KI-Inhaltsgenerator und Job-Such-Agent.',
    },
    tags: ['React', 'Node.js', 'Claude API', 'Vite'],
    role: { en: 'Built & QA tested', de: 'Entwickelt & getestet' },
    status: 'live',
    github: 'https://github.com/sheikhseraj/iamseraj',
    demo: 'https://iamseraj.com',
  },
  {
    id: 'qaops',
    featured: false,
    icon: 'ti-test-pipe',
    title: { en: 'QAOps Playwright Framework', de: 'QAOps Playwright Framework' },
    desc: {
      en: 'End-to-end browser automation framework using Playwright & Python. Structured for CI/CD integration with detailed reporting.',
      de: 'End-to-End-Browser-Automatisierungsframework mit Playwright & Python. Strukturiert für CI/CD-Integration mit detailliertem Reporting.',
    },
    tags: ['Playwright', 'Python', 'GitHub Actions', 'CI/CD'],
    role: { en: 'Developer & QA', de: 'Entwickler & QA' },
    status: 'live',
    github: 'https://github.com/sheikhseraj/QAOpsPlaywright',
    demo: null,
  },
  {
    id: 'cicd',
    featured: false,
    icon: 'ti-git-merge',
    title: { en: 'CI/CD Pipeline Practice', de: 'CI/CD Pipeline Übungen' },
    desc: {
      en: 'Hands-on CI/CD pipeline implementations using Jenkins and GitHub Actions. Includes automated test execution, code quality gates, and deployment stages.',
      de: 'Praktische CI/CD-Pipeline-Implementierungen mit Jenkins und GitHub Actions. Enthält automatisierte Testausführung und Deployment-Stufen.',
    },
    tags: ['Jenkins', 'GitHub Actions', 'Python', 'Docker'],
    role: { en: 'Developer & QA', de: 'Entwickler & QA' },
    status: 'live',
    github: 'https://github.com/sheikhseraj/wtecc-CICD_PracticeCode',
    demo: null,
  },
  {
    id: 'langnation',
    featured: false,
    icon: 'ti-language',
    title: { en: 'LangNation — EN↔DE Dictionary', de: 'LangNation — EN↔DE Wörterbuch' },
    desc: {
      en: 'Bilingual English-German dictionary and language learning platform. Tested end-to-end across browsers for accuracy and performance.',
      de: 'Zweisprachiges Englisch-Deutsch Wörterbuch und Sprachlernplattform. End-to-End getestet auf Genauigkeit und Performance.',
    },
    tags: ['QA Testing', 'E2E Tests', 'Cross-browser'],
    role: { en: 'QA Tester', de: 'QA Tester' },
    status: 'live',
    github: null,
    demo: 'https://langnation.de',
  },
  {
    id: 'futureingermany',
    featured: false,
    icon: 'ti-world',
    title: { en: 'FutureInGermany — Study & Work Portal', de: 'FutureInGermany — Studien- & Arbeitsportal' },
    desc: {
      en: 'Educational consultancy platform helping people study and work in Germany. QA tested portal flows including visa guidance, application tracking, and counseling.',
      de: 'Bildungsberatungsplattform für Studium und Arbeit in Deutschland. Portal-Flows getestet inkl. Visa-Beratung und Bewerbungsverfolgung.',
    },
    tags: ['QA Testing', 'Functional Testing', 'User Flows'],
    role: { en: 'QA Tester', de: 'QA Tester' },
    status: 'live',
    github: null,
    demo: 'https://futureingermany.in',
  },
  {
    id: 'business-sites',
    featured: false,
    icon: 'ti-building',
    title: { en: 'Business Websites — Alaska & ElbSol', de: 'Unternehmenswebsites — Alaska & ElbSol' },
    desc: {
      en: 'Quality assurance for two international business websites. Tested responsive layouts, contact flows, SEO elements, and cross-device compatibility.',
      de: 'Qualitätssicherung für zwei internationale Unternehmenswebsites. Getestet: Responsive Layouts, Kontakt-Flows, SEO-Elemente und Gerätekompatibilität.',
    },
    tags: ['QA Testing', 'Responsive', 'Cross-device', 'SEO'],
    role: { en: 'QA Tester', de: 'QA Tester' },
    status: 'live',
    github: null,
    demo: 'https://elbsol.com',
  },
]

// UI labels, buttons, section titles, and chat strings per language.
export const ui = {
  en: {
    nav: { about: 'About', skills: 'Skills', projects: 'Projects', experience: 'Experience', education: 'Education', certifications: 'Certifications', connect: 'Connect', blog: 'Blog', contact: 'Contact' },
    hero: { eyebrow: 'Hi, my name is', viewWork: 'View my experience', getInTouch: 'Get in touch', resume: 'Résumé' },
    titles: { about: 'About', skills: 'Skills', projects: 'Projects', experience: 'Experience', education: 'Education', certifications: 'Certifications', connect: 'Connect', blog: 'Blog', contact: 'Contact', languages: 'Languages' },
    connectUI: { findMe: 'Find me online', githubActivity: 'Live GitHub activity', viewProfile: 'View profile', optionA: 'Option 1 — Branded cards', optionB: 'Option 2 — Live add-ons (GitHub stats + LinkedIn-style card)' },
    contact: {
      blurb: 'Have a role or project in mind? My inbox is always open — in German or English.',
      sayHello: 'Say hello', email: 'Email', phone: 'Phone', location: 'Location',
    },
    footerBuilt: 'Built with React.',
    switchTo: 'DE',
    chat: {
      title: "Ask Seraj's AI",
      greeting: "Hi! I'm Seraj's AI assistant. Ask me anything about Seraj's experience, skills, or background.",
      placeholder: 'Type your question…',
      send: 'Send',
      bubble: '👋 Hi! Got a question? Chat with me',
      suggestions: ['What do you do?', 'Tell me about your test automation experience', 'What certifications do you have?'],
    },
  },
  de: {
    nav: { about: 'Über mich', skills: 'Kenntnisse', projects: 'Projekte', experience: 'Berufserfahrung', education: 'Ausbildung', certifications: 'Zertifizierungen', connect: 'Profile', blog: 'Blog', contact: 'Kontakt' },
    hero: { eyebrow: 'Hallo, mein Name ist', viewWork: 'Meine Erfahrung ansehen', getInTouch: 'Kontakt aufnehmen', resume: 'Lebenslauf' },
    titles: { about: 'Über mich', skills: 'Kenntnisse', projects: 'Projekte', experience: 'Berufserfahrung', education: 'Ausbildung', certifications: 'Zertifizierungen', connect: 'Profile', blog: 'Blog', contact: 'Kontakt', languages: 'Sprachen' },
    connectUI: { findMe: 'Finden Sie mich online', githubActivity: 'Live GitHub-Aktivität', viewProfile: 'Profil ansehen', optionA: 'Option 1 — Branding-Karten', optionB: 'Option 2 — Live-Erweiterungen (GitHub-Statistiken + LinkedIn-Karte)' },
    contact: {
      blurb: 'Sie haben eine Position oder ein Projekt im Kopf? Schreiben Sie mir gern — auf Deutsch oder Englisch.',
      sayHello: 'Hallo sagen', email: 'E-Mail', phone: 'Telefon', location: 'Ort',
    },
    footerBuilt: 'Erstellt mit React.',
    switchTo: 'EN',
    chat: {
      title: 'Fragen Sie Serajs KI',
      greeting: 'Hallo! Ich bin Serajs KI-Assistent. Fragen Sie mich alles über Serajs Erfahrung, Kenntnisse oder Werdegang.',
      placeholder: 'Stellen Sie Ihre Frage…',
      send: 'Senden',
      bubble: '👋 Hallo! Eine Frage? Schreiben Sie mir',
      suggestions: ['Was machst du beruflich?', 'Erzähl mir von deiner Testautomatisierungs-Erfahrung', 'Welche Zertifizierungen hast du?'],
    },
  },
}
