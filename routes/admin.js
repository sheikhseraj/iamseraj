import express from 'express'
import { generateToken } from '../server/jwt.js'
import { getTodaysContent } from '../server/db.js'

const router = express.Router()

// Middleware to check admin session
const requireAdmin = (req, res, next) => {
  if (req.session?.admin) {
    return next()
  }
  res.status(401).json({ error: 'Not authenticated' })
}

// Login API
router.post('/api/login', (req, res) => {
  const { password } = req.body
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123'

  if (password === correctPassword) {
    req.session.admin = true
    res.json({ success: true })
  } else {
    res.status(401).json({ error: 'Invalid password' })
  }
})

// Check auth API
router.get('/api/check-auth', (req, res) => {
  if (req.session?.admin) {
    res.json({ authenticated: true })
  } else {
    res.status(401).json({ authenticated: false })
  }
})

// Logout API
router.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true })
  })
})

// Generate JWT token for authenticated session
router.post('/api/get-token', requireAdmin, (req, res) => {
  try {
    const token = generateToken(1, 'admin@portfolio.local')
    res.json({ token, success: true })
  } catch (err) {
    console.error('Token generation error:', err)
    res.status(500).json({ error: 'Failed to generate token' })
  }
})

// Generate content API (calls Anthropic backend)
router.post('/api/generate', requireAdmin, async (req, res) => {
  const { mode, topics, tone } = req.body

  if (!topics || topics.length === 0) {
    return res.status(400).json({ error: 'No topics provided' })
  }

  try {
    // Call backend route to generate content
    const port = process.env.PORT || 3000
    const url = `http://127.0.0.1:${port}/api/generate-content`

    console.log(`Fetching from: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, topics, tone })
    })

    console.log(`Response status: ${response.status}`)

    const data = await response.json()

    console.log(`Response data:`, data)

    if (!response.ok) {
      console.error('API returned error:', data)
      return res.status(response.status).json(data)
    }

    res.json(data)
  } catch (err) {
    console.error('Generate content error:', err.message)
    console.error('Full error:', err)
    res.status(500).json({
      error: 'Failed to generate content',
      details: err.message
    })
  }
})

// Get today's generated content (with auth)
router.post('/api/todays-content', requireAdmin, async (req, res) => {
  const { topic, tone, length } = req.body

  if (!topic || !tone) {
    return res.status(400).json({ error: 'Topic and tone required' })
  }

  try {
    const content = await getTodaysContent(topic, tone, length || 'medium')
    if (content) {
      res.json({ exists: true, content })
    } else {
      res.json({ exists: false })
    }
  } catch (err) {
    console.error('Error retrieving todays content:', err.message)
    res.status(500).json({
      error: 'Failed to retrieve content',
      details: err.message
    })
  }
})

// Job Search Agent API
router.post('/api/job-search', requireAdmin, async (req, res) => {
  const { resume, jobTitle } = req.body

  if (!resume && !jobTitle) {
    return res.status(400).json({ error: 'Resume or job title required' })
  }

  try {
    let searchPlan
    let searchInput

    if (resume) {
      // Step 1: Analyze resume with Claude to create search plan
      searchPlan = await analyzeResumeWithClaude(resume)
      searchInput = resume
    } else {
      // Create search plan from job title
      searchPlan = await analyzeJobTitleWithClaude(jobTitle)
      searchInput = jobTitle
    }

    // Step 2: Search job portals with Claude + Apify
    const jobs = await searchJobPortals(searchPlan, searchInput)

    // Step 3: Score jobs
    const scoredJobs = scoreJobs(jobs, searchInput, searchPlan)

    // Get top 3
    const topPicks = scoredJobs.slice(0, 3).map(j => j.id)

    res.json({
      searchPlan,
      jobs: scoredJobs,
      topPicks
    })
  } catch (err) {
    console.error('Job search error:', err.message)
    res.status(500).json({
      error: 'Job search failed',
      details: err.message
    })
  }
})

// Serve admin pages
router.get('/login.html', (req, res) => {
  res.sendFile('admin/login.html', { root: '.' })
})

router.get('/dashboard.html', requireAdmin, (req, res) => {
  res.sendFile('admin/dashboard.html', { root: '.' })
})

router.get('/agent.html', requireAdmin, (req, res) => {
  res.sendFile('admin/agent.html', { root: '.' })
})

// Helper: Analyze job title with Claude to create search plan
async function analyzeJobTitleWithClaude(jobTitle) {
  try {
    const { Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    const prompt = `Create a job search plan for the following job title in Germany. Generate relevant search keywords and related roles.

JOB TITLE: ${jobTitle}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "targetRoles": ["Role1", "Role2", "Role3"],
  "seniority": "Junior/Mid/Senior",
  "coreSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Guidelines:
- targetRoles: Generate 2-3 related job titles/roles for this position
- seniority: Infer seniority level (Junior for entry-level, Mid for mid-level, Senior for senior roles)
- coreSkills: List 5 technical skills typically required for this role
- keywords: Create 5 search keywords combining role + typical skills + location

Be specific and relevant to the German job market.`

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : responseText
    const searchPlan = JSON.parse(jsonStr)

    console.log('Search Plan from Job Title:', searchPlan)
    return searchPlan
  } catch (err) {
    console.error('Error analyzing job title:', err)
    // Return default search plan based on job title
    return {
      targetRoles: ['Test Automation Engineer', 'QA Engineer', 'SDET'],
      seniority: 'Mid',
      coreSkills: ['Test Automation', 'Selenium', 'Java', 'QA', 'Testing'],
      keywords: ['Test Automation Engineer Germany', 'QA Automation Remote', 'Selenium QA', 'Test Engineer', 'Automation Tester']
    }
  }
}

// Helper: Analyze resume with Claude to create search plan
async function analyzeResumeWithClaude(resume) {
  try {
    const { Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    const prompt = `Analyze this resume/background and create a job search plan for finding test automation/QA engineer roles in Germany.

RESUME/BACKGROUND:
${resume}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "targetRoles": ["Role1", "Role2", "Role3"],
  "seniority": "Junior/Mid/Senior",
  "coreSkills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Guidelines:
- targetRoles: Infer 2-3 target job titles based on resume (e.g., "Test Automation Engineer", "QA Engineer", "SDET")
- seniority: Infer from experience (years, level of responsibilities)
- coreSkills: Extract top 5 technical/domain skills
- keywords: Create 5 search keywords for job portals combining role + skills + location

Be specific and accurate.`

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'

    // Extract JSON from response (in case it has markdown formatting)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : responseText

    const searchPlan = JSON.parse(jsonStr)
    console.log('Search Plan:', searchPlan)
    return searchPlan
  } catch (err) {
    console.error('Error analyzing resume:', err)
    // Return default search plan if Claude fails
    return {
      targetRoles: ['Test Automation Engineer', 'QA Engineer', 'SDET'],
      seniority: 'Mid',
      coreSkills: ['Selenium', 'Java', 'Test Automation', 'QA', 'CI/CD'],
      keywords: ['Test Automation Engineer Germany', 'QA Automation Remote', 'SDET Germany', 'Selenium Java QA', 'Test Engineer Remote']
    }
  }
}

// Helper: Search job portals (returns mock data - in production would use Apify)
async function searchJobPortals(searchPlan, searchInput) {
  const apiToken = process.env.APIFY_API_TOKEN
  if (!apiToken) {
    console.warn('⚠️ APIFY_API_TOKEN not set - using mock jobs')
    return getMockJobs()
  }

  const allJobs = []
  const keyword = searchPlan.keywords[0] || searchPlan.targetRoles[0]

  const actors = [
    { id: 'curious_coder/linkedin-jobs-scraper', name: 'LinkedIn', input: { keyword, location: 'Germany', maxResults: 15 } },
    { id: 'epctex/xing-scraper', name: 'XING', input: { keyword, location: 'Germany', maxResults: 12 } },
    { id: 'borderline/indeed-scraper', name: 'Indeed', input: { keyword, location: 'Germany', maxResults: 15 } },
    { id: 'easyapi/stepstone-jobs-scraper', name: 'StepStone', input: { keyword, location: 'Germany', maxResults: 12 } },
    { id: 'fatihtahta/arbeitsagentur-scraper', name: 'Arbeitsagentur', input: { keyword, location: 'Germany', maxResults: 10 } },
    { id: 'valig/glassdoor-jobs-scraper', name: 'Glassdoor', input: { keyword, location: 'Germany', maxResults: 10 } }
  ]

  try {
    console.log(`🔍 Searching ${actors.length} German job portals for: ${keyword}`)
    console.log(`⏱️ Fetching from all portals (timeout: 30 seconds)...`)

    // Run all actors in parallel
    const results = await Promise.all(
      actors.map(actor => runApifyActor(apiToken, actor.id, actor.name, actor.input))
    )

    // Combine all results
    results.forEach(jobs => allJobs.push(...jobs))

    console.log(`✅ Total jobs fetched: ${allJobs.length}`)

    if (allJobs.length === 0) {
      console.log('⚠️ No jobs found, using mock jobs')
      return getMockJobs()
    }

    // Score jobs against search plan
    console.log(`🎯 Scoring ${allJobs.length} jobs...`)
    const scoredJobs = scoreJobs(allJobs, searchInput, searchPlan)
    console.log(`✅ Jobs scored and ranked`)

    return scoredJobs.slice(0, 40)
  } catch (err) {
    console.error('❌ Error searching job portals:', err.message)
    return getMockJobs()
  }
}

// Run Apify Actor and get results
async function runApifyActor(apiToken, actorId, actorName, input) {
  try {
    console.log(`📍 Starting ${actorName} scraper...`)

    // Start the actor run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    })

    if (!runResponse.ok) {
      console.error(`❌ ${actorName} failed to start: ${runResponse.status}`)
      return []
    }

    const runData = await runResponse.json()
    const runId = runData.data.id
    console.log(`⏳ ${actorName} running (ID: ${runId})`)

    // Wait for completion (max 15 attempts, 2 seconds = 30 seconds total)
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const statusResp = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      })

      const statusData = await statusResp.json()
      const status = statusData.data.status

      if (status === 'SUCCEEDED') {
        // Fetch results
        const itemsResp = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        })
        const items = await itemsResp.json()

        console.log(`✅ ${actorName} completed: ${items.length} jobs`)

        return items.map((job, idx) => ({
          id: `${actorName.toLowerCase()}_${idx}`,
          title: job.positionName || job.jobTitle || job.title || 'Job',
          company: job.companyName || job.company || 'Company',
          location: job.location || 'Germany',
          posted: job.postedDate || job.datePosted || 'Recently',
          source: actorName,
          applyLink: job.positionUrl || job.jobUrl || job.url || `https://${actorName.toLowerCase()}.com`,
          description: job.description || job.jobTitle || job.title || ''
        }))
      }

      if (status === 'FAILED') {
        console.error(`❌ ${actorName} failed: ${statusData.data.statusMessage}`)
        return []
      }
    }

    console.warn(`⏱️ ${actorName} timeout after 30 seconds`)
    return []
  } catch (err) {
    console.error(`Error with ${actorName}:`, err.message)
    return []
  }
}

// Apify: Search Indeed.de
async function searchIndeedDE(apiToken, keywords) {
  try {
    const response = await fetch('https://api.apify.com/v2/acts/apify~indeed-job-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        maxResults: 15,
        countryCode: 'DE',
        keywords: keywords,
        locationName: 'Germany'
      })
    })

    if (!response.ok) {
      throw new Error(`Apify response: ${response.status}`)
    }

    const data = await response.json()
    const runId = data.data.id

    // Wait for job to complete and get results
    const results = await getApifyResults(apiToken, 'apify~indeed-job-scraper', runId)

    return results.map((job, idx) => ({
      id: `indeed_${idx}`,
      title: job.positionName || 'Job Title',
      company: job.companyName || 'Company',
      location: job.location || 'Germany',
      postedDate: job.postedDate || 'Recently',
      source: 'Indeed.de',
      applyLink: job.positionUrl || 'https://indeed.de',
      description: job.description || job.positionName || ''
    }))
  } catch (err) {
    console.error('Indeed search error:', err.message)
    return []
  }
}

// Apify: Search StepStone.de
async function searchStepStoneDE(apiToken, keywords) {
  try {
    const response = await fetch('https://api.apify.com/v2/acts/nMatik~stepstone-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        keyword: keywords,
        location: 'Germany',
        maxResults: 15
      })
    })

    if (!response.ok) {
      throw new Error(`Apify response: ${response.status}`)
    }

    const data = await response.json()
    const runId = data.data.id

    const results = await getApifyResults(apiToken, 'nMatik~stepstone-scraper', runId)

    return results.map((job, idx) => ({
      id: `stepstone_${idx}`,
      title: job.title || 'Job Title',
      company: job.company || 'Company',
      location: job.location || 'Germany',
      postedDate: job.datePosted || 'Recently',
      source: 'StepStone.de',
      applyLink: job.url || 'https://stepstone.de',
      description: job.jobDescription || job.title || ''
    }))
  } catch (err) {
    console.error('StepStone search error:', err.message)
    return []
  }
}

// Apify: Search XING
async function searchXING(apiToken, keywords) {
  try {
    const response = await fetch('https://api.apify.com/v2/acts/nMatik~xing-job-search-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        searchTerm: keywords,
        country: 'DE',
        maxJobs: 15
      })
    })

    if (!response.ok) {
      throw new Error(`Apify response: ${response.status}`)
    }

    const data = await response.json()
    const runId = data.data.id

    const results = await getApifyResults(apiToken, 'nMatik~xing-job-search-scraper', runId)

    return results.map((job, idx) => ({
      id: `xing_${idx}`,
      title: job.jobTitle || 'Job Title',
      company: job.companyName || 'Company',
      location: job.location || 'Germany',
      postedDate: job.publishedDate || 'Recently',
      source: 'XING',
      applyLink: job.jobUrl || 'https://xing.de',
      description: job.jobDescription || job.jobTitle || ''
    }))
  } catch (err) {
    console.error('XING search error:', err.message)
    return []
  }
}

// Get Apify Actor Results
async function getApifyResults(apiToken, actorId, runId) {
  try {
    console.log(`⏳ Waiting for ${actorId} results...`)

    // Wait for run to complete (max 10 attempts, 3 seconds each = 30 seconds total)
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000))

      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        { headers: { 'Authorization': `Bearer ${apiToken}` } }
      )

      if (!statusResponse.ok) {
        console.error(`Status check failed: ${statusResponse.status}`)
        return []
      }

      const statusData = await statusResponse.json()
      console.log(`${actorId} status: ${statusData.data.status}`)

      if (statusData.data.status === 'SUCCEEDED') {
        // Get results from dataset
        console.log(`✅ ${actorId} completed, fetching results...`)
        const datasetResponse = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
          { headers: { 'Authorization': `Bearer ${apiToken}` } }
        )

        if (!datasetResponse.ok) {
          console.error(`Dataset fetch failed: ${datasetResponse.status}`)
          return []
        }

        const results = await datasetResponse.json()
        console.log(`Retrieved ${results.length} items from ${actorId}`)
        return results.map(item => item.data || item).slice(0, 15)
      }

      if (statusData.data.status === 'FAILED') {
        console.error(`❌ ${actorId} failed:`, statusData.data.statusMessage)
        return []
      }
    }

    console.warn(`⏱️ Actor ${actorId} took too long (timeout after 30 seconds)`)
    return []
  } catch (err) {
    console.error(`Error getting ${actorId} results:`, err.message)
    return []
  }
}

// Mock jobs fallback
function getMockJobs() {
  return [
    {
      id: 'job_001',
      title: 'Test Automation Engineer',
      company: 'SinnerSchrader AG',
      location: 'Berlin, Remote',
      postedDate: '2 days ago',
      source: 'StepStone',
      applyLink: 'https://www.stepstone.de/jobs/search?q=Test+Automation+Engineer',
      description: 'Senior Test Automation Engineer for fintech startup'
    },
    {
      id: 'job_002',
      title: 'SDET (Senior Development Engineer in Test)',
      company: 'Zalando SE',
      location: 'Berlin',
      postedDate: '1 day ago',
      source: 'XING',
      applyLink: 'https://www.xing.com/jobs/search?q=SDET',
      description: 'Build automation frameworks for e-commerce platform'
    },
    {
      id: 'job_003',
      title: 'QA Automation Engineer',
      company: 'Bosch Software Innovations',
      location: 'Stuttgart, Remote Option',
      postedDate: '3 days ago',
      source: 'Indeed',
      applyLink: 'https://de.indeed.com/jobs?q=QA+Automation+Engineer',
      description: 'Java-based test automation for automotive software'
    }
  ]
}

// Helper: Score jobs against resume
function scoreJobs(jobs, resume, searchPlan) {
  const resumeLower = resume.toLowerCase()
  const skillsLower = searchPlan.coreSkills.map(s => s.toLowerCase())

  return jobs.map(job => {
    const jobLower = (job.title + ' ' + job.description).toLowerCase()

    // Skills match (40%)
    let skillsScore = 0
    let matchedSkills = []
    skillsLower.forEach(skill => {
      if (jobLower.includes(skill)) {
        skillsScore += 8
        matchedSkills.push(skill)
      }
    })

    // Experience fit (25%)
    let experienceScore = 20
    if (jobLower.includes('senior') || jobLower.includes('lead')) experienceScore = 25
    if (jobLower.includes('junior')) experienceScore = 15

    // Role alignment (20%)
    let roleScore = 0
    searchPlan.targetRoles.forEach(role => {
      if (jobLower.includes(role.toLowerCase())) roleScore = 20
    })

    // Location/work-mode fit (15%)
    let locationScore = 15 // All Germany, give full marks
    if (!jobLower.includes('germany') && !jobLower.includes('remote') && !jobLower.includes('hybrid')) {
      locationScore = 5
    }

    const totalScore = skillsScore + experienceScore + roleScore + locationScore

    // Determine gaps
    let gaps = ''
    const missingSkills = skillsLower.filter(s => !jobLower.includes(s))
    if (missingSkills.length > 0) {
      gaps = `Missing: ${missingSkills.slice(0, 2).join(', ')}`
    }

    return {
      ...job,
      score: Math.min(100, totalScore),
      whyItFits: `Matches ${matchedSkills.length}+ of your core skills: ${matchedSkills.slice(0, 3).join(', ')}. Role aligns with your target positions.`,
      gaps: gaps,
      matchedSkills
    }
  }).sort((a, b) => b.score - a.score)
}

export default router
