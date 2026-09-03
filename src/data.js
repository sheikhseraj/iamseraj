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
    en: 'AWS Cloud & Infrastructure Engineer',
    de: 'AWS Cloud & Infrastructure Engineer',
  },
  tagline: {
    en: 'Building secure, reliable cloud infrastructure with AWS, Linux, networking, Python, automation and CI/CD — backed by professional Software Quality Engineering experience.',
    de: 'Aufbau sicherer, zuverlässiger Cloud-Infrastruktur mit AWS, Linux, Netzwerken, Python, Automatisierung und CI/CD — gestützt durch professionelle Erfahrung im Software Quality Engineering.',
  },
  location: {
    en: 'Magdeburg, Germany',
    de: 'Magdeburg, Deutschland',
  },
  about: {
    en: [
      "I'm an engineer expanding my professional focus into AWS Cloud & Infrastructure Engineering, with hands-on experience building and automating AWS environments involving VPC, EC2, IAM, S3, networking, security and monitoring.",
      'My professional background is in Software Quality Engineering, Test Management and Test Automation, where I worked on complex automotive systems and led testing activities in professional engineering environments.',
      "I'm combining that experience with AWS, Linux, networking, Python, automation and CI/CD to build reliable cloud infrastructure. My quality-engineering background brings a strong focus on reliability, troubleshooting, validation and systematic problem solving.",
    ],
    de: [
      'Ich erweitere meinen beruflichen Schwerpunkt in Richtung AWS Cloud & Infrastructure Engineering und verfüge über praktische Erfahrung beim Aufbau und bei der Automatisierung von AWS-Umgebungen mit VPC, EC2, IAM, S3, Netzwerken, Sicherheit und Monitoring.',
      'Mein professioneller Hintergrund liegt im Software Quality Engineering, Testmanagement und in der Testautomatisierung. Dabei arbeitete ich an komplexen Automotive-Systemen und leitete Testaktivitäten in professionellen Engineering-Umgebungen.',
      'Diese Erfahrung verbinde ich mit AWS, Linux, Netzwerken, Python, Automatisierung und CI/CD. Mein Quality-Engineering-Hintergrund stärkt dabei meinen Fokus auf Zuverlässigkeit, Fehlersuche, Validierung und systematische Problemlösung.',
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
    en: 'AWS Cloud & Infrastructure Engineering · Quality Automation',
    de: 'AWS Cloud & Infrastructure Engineering · Qualitätsautomatisierung',
  },
  githubTagline: {
    en: 'Cloud Infrastructure & Automation Projects',
    de: 'Cloud-Infrastruktur- & Automatisierungsprojekte',
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
  { group: { en: 'AWS Cloud', de: 'AWS Cloud' }, items: ['AWS', 'EC2', 'VPC', 'S3', 'IAM', 'CloudWatch', 'CloudTrail', 'AWS Config', 'Security Groups', 'Internet Gateway', 'NAT Gateway', 'Route Tables'] },
  { group: { en: 'Networking', de: 'Netzwerke' }, items: ['TCP/IP', 'CIDR', 'DNS', 'DHCP', 'Subnets', 'Routing', 'Public / Private Networks', 'VPC Peering'] },
  { group: { en: 'Linux & Systems', de: 'Linux & Systeme' }, items: ['Linux', 'Ubuntu', 'Amazon Linux', 'SSH', 'Bash (foundational)', 'System Administration'] },
  { group: { en: 'Programming & Automation', de: 'Programmierung & Automatisierung' }, items: ['Python', 'Boto3', 'PowerShell', 'JavaScript', 'Git', 'AWS CLI'] },
  { group: { en: 'DevOps & CI/CD', de: 'DevOps & CI/CD' }, items: ['GitHub Actions', 'Jenkins', 'Docker', 'Azure DevOps', 'CI/CD'] },
  { group: { en: 'Quality Engineering', de: 'Quality Engineering' }, items: ['Playwright', 'Selenium', 'Pytest', 'API Testing', 'Test Automation', 'Test Management', 'Jira', 'Xray', 'ISTQB'] },
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
      degree: 'AWS Cloud Bootcamp / Cloud Engineering Training',
      school: 'neue fische · AWS Cloud, Linux, networking, security, Python, databases, automation and CI/CD',
      period: '2026',
    },
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
      degree: 'AWS Cloud Bootcamp / Cloud Engineering Weiterbildung',
      school: 'neue fische · AWS Cloud, Linux, Netzwerke, Sicherheit, Python, Datenbanken, Automatisierung und CI/CD',
      period: '2026',
    },
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


export const cloudJourney = [
  {
    stage: { en: 'Foundation', de: 'Fundament' },
    items: ['VPC', 'Public & Private Subnets', 'Route Tables', 'Internet Gateway', 'NAT Gateway', 'EC2'],
    status: { en: 'Completed · Hands-on', de: 'Abgeschlossen · Praxis' },
    state: 'complete',
    icon: 'ti-building-community',
  },
  {
    stage: { en: 'Security', de: 'Sicherheit' },
    items: ['IAM', 'Security Groups', 'CloudTrail', 'AWS Config'],
    status: { en: 'Completed · Hands-on', de: 'Abgeschlossen · Praxis' },
    state: 'complete',
    icon: 'ti-shield-lock',
  },
  {
    stage: { en: 'Storage & Automation', de: 'Speicher & Automatisierung' },
    items: ['S3', 'Python', 'Boto3', 'AWS CLI'],
    status: { en: 'Hands-on', de: 'Praxis' },
    state: 'complete',
    icon: 'ti-database-cog',
  },
  {
    stage: { en: 'Monitoring', de: 'Monitoring' },
    items: ['CloudWatch', 'CloudTrail', 'AWS Config', 'Trusted Advisor'],
    status: { en: 'Hands-on', de: 'Praxis' },
    state: 'complete',
    icon: 'ti-activity-heartbeat',
  },
  {
    stage: { en: 'Infrastructure as Code', de: 'Infrastructure as Code' },
    items: ['Terraform'],
    status: { en: 'Learning · Next', de: 'Lernen · Nächster Schritt' },
    state: 'next',
    icon: 'ti-code-dots',
  },
]

export const projects = [
  {
    id: 'aws-vpc-ec2',
    featured: true,
    icon: 'ti-cloud-network',
    categories: ['cloud', 'infrastructure'],
    title: { en: 'AWS Cloud Infrastructure — VPC & EC2', de: 'AWS Cloud-Infrastruktur — VPC & EC2' },
    desc: {
      en: 'Designed and built a hands-on AWS network environment with a custom VPC, public and private subnets, route tables, Internet Gateway, NAT Gateway, Security Groups and EC2 instances.',
      de: 'Praktischer Aufbau einer AWS-Netzwerkumgebung mit eigener VPC, öffentlichen und privaten Subnetzen, Routingtabellen, Internet Gateway, NAT Gateway, Security Groups und EC2-Instanzen.',
    },
    tags: ['AWS', 'VPC', 'EC2', 'Networking', 'Subnets', 'NAT Gateway', 'Security Groups'],
    role: { en: 'Hands-on cloud lab', de: 'Praktisches Cloud-Lab' }, status: 'live', github: null, demo: null,
  },
  {
    id: 'aws-security', featured: true, icon: 'ti-shield-lock', categories: ['cloud', 'infrastructure'],
    title: { en: 'AWS IAM & Cloud Security', de: 'AWS IAM & Cloud Security' },
    desc: { en: 'Hands-on AWS security labs covering IAM identities, roles, policies, least-privilege access, Security Groups, CloudTrail, AWS Config and cloud security monitoring.', de: 'Praktische AWS-Sicherheitslabs zu IAM-Identitäten, Rollen, Richtlinien, Least-Privilege-Zugriff, Security Groups, CloudTrail, AWS Config und Security Monitoring.' },
    tags: ['AWS', 'IAM', 'CloudTrail', 'AWS Config', 'Security', 'Least Privilege'],
    role: { en: 'Hands-on cloud lab', de: 'Praktisches Cloud-Lab' }, status: 'live', github: null, demo: null,
  },
  {
    id: 'aws-s3-automation', featured: true, icon: 'ti-cloud-cog', categories: ['cloud', 'automation'],
    title: { en: 'AWS S3 Automation with Python', de: 'AWS S3-Automatisierung mit Python' },
    desc: { en: 'Automated AWS S3 tasks using Python, Boto3 and the AWS CLI, including bucket operations and IAM-based access control.', de: 'Automatisierung von AWS-S3-Aufgaben mit Python, Boto3 und AWS CLI, einschließlich Bucket-Operationen und IAM-basierter Zugriffskontrolle.' },
    tags: ['AWS', 'S3', 'Python', 'Boto3', 'AWS CLI', 'IAM', 'Automation'],
    role: { en: 'Hands-on cloud lab', de: 'Praktisches Cloud-Lab' }, status: 'live', github: null, demo: null,
  },
  {
    id: 'aws-monitoring', featured: false, icon: 'ti-chart-histogram', categories: ['cloud', 'infrastructure'],
    title: { en: 'AWS Monitoring & Governance', de: 'AWS Monitoring & Governance' },
    desc: { en: 'Explored AWS monitoring, logging and governance using CloudWatch, CloudTrail, AWS Config and Trusted Advisor to understand infrastructure visibility and compliance.', de: 'Praktische Erkundung von AWS Monitoring, Logging und Governance mit CloudWatch, CloudTrail, AWS Config und Trusted Advisor für Infrastrukturtransparenz und Compliance.' },
    tags: ['AWS', 'CloudWatch', 'CloudTrail', 'AWS Config', 'Trusted Advisor'],
    role: { en: 'Hands-on cloud lab', de: 'Praktisches Cloud-Lab' }, status: 'live', github: null, demo: null,
  },
  {
    id: 'portfolio',
    featured: false,
    icon: 'ti-code',
    categories: ['automation', 'devops'],
    title: { en: 'Personal Portfolio — iamseraj.com', de: 'Persönliches Portfolio — iamseraj.com' },
    desc: {
      en: 'Full-stack portfolio site built with React, Node.js & Claude AI. Features a bilingual chat assistant, AI content generator, and job search agent.',
      de: 'Full-Stack-Portfolio mit React, Node.js & Claude KI. Zweisprachiger Chat-Assistent, KI-Inhaltsgenerator und Job-Such-Agent.',
    },
    tags: ['React', 'Node.js', 'JavaScript', 'GitHub Actions', 'E2E Tests', 'AI', 'Vite'],
    role: { en: 'Built & QA tested', de: 'Entwickelt & getestet' },
    status: 'live',
    github: 'https://github.com/sheikhseraj/iamseraj',
    demo: 'https://iamseraj.com',
  },
  {
    id: 'qaops',
    featured: false,
    icon: 'ti-test-pipe',
    categories: ['automation', 'devops', 'quality'],
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
    categories: ['automation', 'devops'],
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
    categories: ['quality'],
    title: { en: 'LangNation — EN↔DE Dictionary', de: 'LangNation — EN↔DE Wörterbuch' },
    desc: {
      en: 'Bilingual English-German dictionary and language learning platform. Tested end-to-end across browsers for accuracy and performance.',
      de: 'Zweisprachiges Englisch-Deutsch Wörterbuch und Sprachlernplattform. End-to-End getestet auf Genauigkeit und Performance.',
    },
    tags: ['QA Testing', 'E2E Tests', 'Cross-browser', 'MySQL', 'JavaScript', 'CSS'],
    role: { en: 'QA Tester', de: 'QA Tester' },
    status: 'live',
    github: null,
    demo: 'https://langnation.de',
  },
  {
    id: 'futureingermany',
    featured: false,
    icon: 'ti-world',
    categories: ['quality'],
    title: { en: 'FutureInGermany — Study & Work Portal', de: 'FutureInGermany — Studien- & Arbeitsportal' },
    desc: {
      en: 'Educational consultancy platform helping people study and work in Germany. QA tested portal flows including visa guidance, application tracking, and counseling.',
      de: 'Bildungsberatungsplattform für Studium und Arbeit in Deutschland. Portal-Flows getestet inkl. Visa-Beratung und Bewerbungsverfolgung.',
    },
    tags: ['QA Testing', 'Functional Testing', 'User Flows', 'JavaScript', 'CSS'],
    role: { en: 'QA Tester', de: 'QA Tester' },
    status: 'live',
    github: null,
    demo: 'https://futureingermany.in',
  },
  {
    id: 'business-sites',
    featured: false,
    icon: 'ti-building',
    categories: ['quality'],
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
    nav: { about: 'About', skills: 'Cloud & Skills', projects: 'Projects', 'cloud-journey': 'Cloud Journey', experience: 'Experience', education: 'Education', certifications: 'Certifications', contact: 'Contact' },
    hero: { eyebrow: 'Cloud infrastructure · automation · quality', viewProjects: 'View Cloud Projects', getInTouch: 'Contact Me', resume: 'Résumé' },
    titles: { about: 'About', skills: 'Cloud & Engineering Skills', projects: 'Cloud & Engineering Projects', cloudJourney: 'Building My AWS Cloud City', experience: 'Professional Engineering & Quality Experience', education: 'Education & Training', certifications: 'Certifications', connect: 'Connect', blog: 'Knowledge & Blog', contact: 'Contact', languages: 'Languages' },
    projects: { featured: '★ Cloud focus' },
    cloudJourney: { subtitle: 'Turning cloud concepts into hands-on infrastructure, one layer at a time.' },
    experienceIntro: 'Professional roles are presented separately from hands-on AWS labs and training. This experience contributes proven automation, troubleshooting, validation and engineering leadership skills.',
    certificationGroups: { quality: 'Quality Engineering' },
    connectUI: { findMe: 'Find me online', githubActivity: 'Live GitHub activity', viewProfile: 'View profile', optionA: 'Option 1 — Branded cards', optionB: 'Option 2 — Live add-ons (GitHub stats + LinkedIn-style card)' },
    contact: {
      heading: "Let's build reliable cloud infrastructure.",
      blurb: "I'm open to opportunities across Germany and the DACH region in AWS Cloud Engineering, Cloud Infrastructure, Cloud Operations, DevOps-oriented roles and engineering positions where automation and quality expertise add value.",
      sayHello: 'Say hello', email: 'Email', phone: 'Phone', location: 'Location',
    },
    footerBuilt: 'Built with React.',
    switchTo: 'DE',
    chat: {
      title: "Ask Seraj's AI",
      greeting: "Hi! I'm Seraj's AI assistant. Ask about his cloud projects, infrastructure skills, professional quality-engineering experience, or background.",
      placeholder: 'Type your question…',
      send: 'Send',
      bubble: '👋 Hi! Got a question? Chat with me',
      suggestions: ['Tell me about your AWS projects', 'What cloud skills do you have?', 'What is your professional experience?'],
    },
  },
  de: {
    nav: { about: 'Über mich', skills: 'Cloud & Skills', projects: 'Projekte', 'cloud-journey': 'Cloud Journey', experience: 'Erfahrung', education: 'Ausbildung', certifications: 'Zertifikate', contact: 'Kontakt' },
    hero: { eyebrow: 'Cloud-Infrastruktur · Automatisierung · Qualität', viewProjects: 'Cloud-Projekte ansehen', getInTouch: 'Kontakt aufnehmen', resume: 'Lebenslauf' },
    titles: { about: 'Über mich', skills: 'Cloud- & Engineering-Kenntnisse', projects: 'Cloud- & Engineering-Projekte', cloudJourney: 'Aufbau meiner AWS Cloud City', experience: 'Professionelle Engineering- & Quality-Erfahrung', education: 'Ausbildung & Weiterbildung', certifications: 'Zertifizierungen', connect: 'Profile', blog: 'Wissen & Blog', contact: 'Kontakt', languages: 'Sprachen' },
    projects: { featured: '★ Cloud-Fokus' },
    cloudJourney: { subtitle: 'Cloud-Konzepte Schritt für Schritt in praktische Infrastruktur umsetzen.' },
    experienceIntro: 'Berufliche Positionen sind klar von praktischen AWS-Labs und Weiterbildungen getrennt. Diese Erfahrung bringt bewährte Kompetenzen in Automatisierung, Fehlersuche, Validierung und Engineering-Führung ein.',
    certificationGroups: { quality: 'Quality Engineering' },
    connectUI: { findMe: 'Finden Sie mich online', githubActivity: 'Live GitHub-Aktivität', viewProfile: 'Profil ansehen', optionA: 'Option 1 — Branding-Karten', optionB: 'Option 2 — Live-Erweiterungen (GitHub-Statistiken + LinkedIn-Karte)' },
    contact: {
      heading: 'Lassen Sie uns zuverlässige Cloud-Infrastruktur aufbauen.',
      blurb: 'Ich bin offen für Positionen in Deutschland und der DACH-Region in den Bereichen AWS Cloud Engineering, Cloud-Infrastruktur, Cloud Operations, DevOps sowie Engineering-Rollen, in denen Automatisierung und Qualitätsexpertise Mehrwert schaffen.',
      sayHello: 'Hallo sagen', email: 'E-Mail', phone: 'Telefon', location: 'Ort',
    },
    footerBuilt: 'Erstellt mit React.',
    switchTo: 'EN',
    chat: {
      title: 'Fragen Sie Serajs KI',
      greeting: 'Hallo! Ich bin Serajs KI-Assistent. Fragen Sie nach seinen Cloud-Projekten, Infrastrukturkenntnissen oder seiner professionellen Quality-Engineering-Erfahrung.',
      placeholder: 'Stellen Sie Ihre Frage…',
      send: 'Senden',
      bubble: '👋 Hallo! Eine Frage? Schreiben Sie mir',
      suggestions: ['Welche AWS-Projekte hast du?', 'Welche Cloud-Kenntnisse hast du?', 'Was ist deine Berufserfahrung?'],
    },
  },
}
