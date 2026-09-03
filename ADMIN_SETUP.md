# Admin Portal Setup Guide

## Files Created

```
admin/
├── login.html        — Password login page
├── dashboard.html    — Analytics dashboard
├── agent.html        — AI content generator
└── admin.js          — Shared auth JS

routes/
└── admin.js          — Express routes for admin API
```

---

## Step 1: Install npm Packages

Run this command in your project folder:

```bash
npm install express-session
```

---

## Step 2: Update server.js

Add these lines to your existing `server.js`:

### Add imports at the top (after existing imports):

```javascript
import session from 'express-session'
import adminRouter from './routes/admin.js'
```

### Add middleware (after `app.use(express.json())`):

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))
```

### Add static serving for admin (before other routes):

```javascript
app.use(express.static('admin'))
```

### Add admin routes (before static file serving):

```javascript
app.use('/admin', adminRouter)
```

### Add this new API route (before other `/api/*` routes):

```javascript
// AI Content Generation API
app.post('/api/generate-content', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const { mode, topics, tone } = req.body

  try {
    const { Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()

    const prompt = buildContentPrompt(mode, topics, tone)

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse the generated content into sections
    const outputs = parseContentSections(content, mode)

    res.json(outputs)
  } catch (err) {
    console.error('Content generation error:', err)
    res.status(500).json({ error: 'Failed to generate content' })
  }
})

// Helper: Build prompt based on mode and topics
function buildContentPrompt(mode, topics, tone) {
  const topicString = topics.join(', ')

  if (mode === 'linkedin') {
    return \`Generate professional content for LinkedIn about: \${topicString}. Tone: \${tone}.

Please provide:
1. A compelling LinkedIn post (3-4 paragraphs)
2. A personal connection message to send when connecting

Format each section with a header like "===LINKEDIN POST===" and "===CONNECTION MESSAGE==="\`
  }

  if (mode === 'github') {
    return \`Generate GitHub-related content ideas about: \${topicString}. Tone: \${tone}.

Please provide:
1. 5 GitHub project ideas or improvements
2. 10 commit message ideas for good practices

Format each section with a header like "===GITHUB IDEAS===" and "===COMMIT MESSAGES==="\`
  }

  // Full Daily Pack
  return \`Generate a complete content pack about: \${topicString}. Tone: \${tone}.

Please provide:
1. LinkedIn Post - A professional post (2-3 paragraphs)
2. Article - A detailed technical article (500+ words)
3. Xing German Post - The same post in German for Xing (2-3 paragraphs)
4. GitHub Ideas - 3-5 project or improvement ideas
5. Connection Message - A message to send when connecting with someone
6. Checklist - Action items or checklist related to the topic

Format each section with headers like "===LINKEDIN POST===", "===ARTICLE===", "===XING GERMAN POST===", "===GITHUB IDEAS===", "===CONNECTION MESSAGE===", "===CHECKLIST==="\`
}

// Helper: Parse content sections from Claude response
function parseContentSections(content, mode) {
  const sections = {}

  if (mode === 'linkedin') {
    sections.linkedin_post = extractSection(content, 'LINKEDIN POST')
    sections.connection_message = extractSection(content, 'CONNECTION MESSAGE')
  } else if (mode === 'github') {
    sections.github_ideas = extractSection(content, 'GITHUB IDEAS')
    sections.commit_messages = extractSection(content, 'COMMIT MESSAGES')
  } else {
    // Full pack
    sections.linkedin_post = extractSection(content, 'LINKEDIN POST')
    sections.article = extractSection(content, 'ARTICLE')
    sections.xing_german_post = extractSection(content, 'XING GERMAN POST')
    sections.github_ideas = extractSection(content, 'GITHUB IDEAS')
    sections.connection_message = extractSection(content, 'CONNECTION MESSAGE')
    sections.checklist = extractSection(content, 'CHECKLIST')
  }

  return sections
}

// Helper: Extract a section from the content
function extractSection(content, sectionName) {
  const regex = new RegExp(\`===\${sectionName}===([\\s\\S]*?)(?=====[A-Z\\s]+===|$)\`)
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}
```

---

## Step 3: Update .env

Add these variables to your `.env` file:

```
ADMIN_PASSWORD=your-secure-password-here
SESSION_SECRET=your-session-secret-here-min-32-chars
ANTHROPIC_API_KEY=sk-ant-...
```

Replace:
- `your-secure-password-here` with a strong password
- `your-session-secret-here-min-32-chars` with a random secret (min 32 characters)
- `sk-ant-...` with your actual Anthropic API key

---

## Step 4: Verify Files Are in Correct Locations

```
Portfolio/
├── server.js               ← UPDATED with admin code
├── package.json           ← Already has dependencies
├── routes/
│   └── admin.js           ← NEW FILE
└── admin/                 ← NEW FOLDER
    ├── login.html         ← NEW FILE
    ├── dashboard.html     ← NEW FILE
    ├── agent.html         ← NEW FILE
    └── admin.js           ← NEW FILE
```

---

## Step 5: Upload to Hostinger

### Via File Manager:

1. **Delete old files** (if re-uploading):
   - Delete `admin/` folder
   - Delete `routes/admin.js` if it exists

2. **Upload new files**:
   - Upload `routes/admin.js` to `routes/` folder
   - Upload `admin/` folder with all 4 files inside

3. **Update files on server**:
   - Download current `server.js`
   - Add the code from Step 2 above
   - Upload back to Hostinger

4. **Update .env**:
   - Add the variables from Step 3

---

## Step 6: Install Dependencies on Hostinger

Via Hostinger Terminal/Console:

```bash
cd public_html
npm install
```

---

## Step 7: Restart Node.js Application

1. Go to **Deployments** in Hostinger
2. Click **Restart** button
3. Wait 2 minutes

---

## Step 8: Test the Admin Portal

Visit: `https://iamseraj.com/admin/login.html`

Login with the password you set in `.env` → Should see Dashboard

---

## Access Points

- **Login**: `https://iamseraj.com/admin/login.html`
- **Dashboard**: `https://iamseraj.com/admin/dashboard.html` (redirects to login if not authenticated)
- **Content Agent**: `https://iamseraj.com/admin/agent.html` (redirects to login if not authenticated)

---

## Troubleshooting

**If 503 error after restart**:
- Check Runtime Logs for errors
- Make sure `express-session` is installed: `npm install express-session`
- Verify `.env` variables are set
- Make sure all files are uploaded

**If login not working**:
- Check password in `.env` is correct
- Check `ADMIN_PASSWORD` is set in Hostinger Environment Variables

**If content generation not working**:
- Check `ANTHROPIC_API_KEY` is set in `.env`
- Make sure it starts with `sk-ant-`
