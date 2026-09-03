# Admin Portal Deployment Checklist

## Before Deploying

- [ ] Read `ADMIN_SETUP.md` completely
- [ ] Have your admin password ready
- [ ] Have your Anthropic API key ready

---

## Local Testing (Before Upload)

- [ ] All 5 files created locally:
  - [ ] `/admin/login.html`
  - [ ] `/admin/dashboard.html`
  - [ ] `/admin/agent.html`
  - [ ] `/admin/admin.js`
  - [ ] `/routes/admin.js`
- [ ] Read the "Update server.js" section in `ADMIN_SETUP.md`
- [ ] Have the server.js additions copied and ready

---

## On Hostinger - Upload Files

### Via File Manager:

**Step 1: Upload Routes**
- [ ] Navigate to: `public_html/routes/`
- [ ] Upload: `routes/admin.js`

**Step 2: Upload Admin Folder**
- [ ] Navigate to: `public_html/`
- [ ] Upload entire `admin/` folder with all 4 files:
  - `login.html`
  - `dashboard.html`
  - `agent.html`
  - `admin.js`

**Step 3: Update server.js**
- [ ] Download current `server.js` from Hostinger
- [ ] Open in text editor
- [ ] Add all code from "Update server.js" section in `ADMIN_SETUP.md`:
  - Add imports at the top
  - Add session middleware
  - Add static serving
  - Add admin routes
  - Add `/api/generate-content` route with helper functions
- [ ] Upload updated `server.js` back to Hostinger

---

## Hostinger Configuration

### Step 1: Environment Variables

Go to **Environment variables** in Hostinger and add:

```
ADMIN_PASSWORD = your-secure-password
SESSION_SECRET = your-session-secret-min-32-chars
ANTHROPIC_API_KEY = sk-ant-...
DB_HOST = localhost
DB_USER = u648779252_chatbot
DB_PASSWORD = (your db password)
DB_NAME = u648779252_portfolio
NODE_ENV = production
JWT_SECRET = (existing, keep it)
```

- [ ] `ADMIN_PASSWORD` set to your password
- [ ] `SESSION_SECRET` set to random 32+ char string
- [ ] `ANTHROPIC_API_KEY` set to your API key (starts with `sk-ant-`)
- [ ] All other variables already set from before
- [ ] Click Save

### Step 2: Install Dependencies

If using Terminal in Deployments:

```bash
cd public_html
npm install express-session
```

- [ ] Ran `npm install express-session`
- [ ] No errors during installation

### Step 3: Restart Application

In **Deployments**:
- [ ] Click **Restart** button
- [ ] Wait 2-3 minutes for app to start

### Step 4: Check Runtime Logs

In **Deployments** → **Runtime logs**:
- [ ] Look for: `✅ Server running on port 3001`
- [ ] No error messages
- [ ] If errors, see troubleshooting below

---

## Testing the Admin Portal

### Step 1: Test Login Page

Visit: `https://iamseraj.com/admin/login.html`

- [ ] Page loads (dark theme, logo, password field)
- [ ] Enter password
- [ ] Click Sign In

### Step 2: Test Dashboard

After login, should redirect to: `https://iamseraj.com/admin/dashboard.html`

- [ ] Dashboard loads
- [ ] See stats cards (LinkedIn, GitHub, Xing)
- [ ] See Logout button (top right)
- [ ] Quick Links button visible (should link to `/admin/agent.html`)

### Step 3: Test Content Agent

Click **Content Agent** quick link or visit: `https://iamseraj.com/admin/agent.html`

- [ ] Agent page loads
- [ ] See Mode selector (Full, LinkedIn, GitHub)
- [ ] See Topic chips
- [ ] Click Generate button
- [ ] Should generate content in 10-20 seconds
- [ ] See output sections with Copy buttons

### Step 4: Test Logout

- [ ] Click Logout button
- [ ] Should redirect to login page
- [ ] Try to access `/admin/dashboard.html` directly
- [ ] Should redirect to login (authentication working ✅)

---

## Troubleshooting

### 503 Service Unavailable

**Check:**
- [ ] Runtime logs show `✅ Server running on port 3001`
- [ ] All npm packages installed: `express-session`
- [ ] All 5 files uploaded to correct locations
- [ ] `server.js` updated with all code

**Fix:**
1. Check Runtime logs for specific errors
2. Restart application
3. Wait 3 minutes and refresh

### Login Not Working

**Check:**
- [ ] `ADMIN_PASSWORD` is set in Environment variables
- [ ] Password is correct (case-sensitive)
- [ ] Browser cookies enabled

**Fix:**
1. Clear browser cache (Ctrl+Shift+R)
2. Try incognito/private window
3. Verify password in `.env` matches

### Content Generation Not Working

**Check:**
- [ ] `ANTHROPIC_API_KEY` is set in Environment variables
- [ ] API key starts with `sk-ant-`
- [ ] API key is not expired/invalid

**Fix:**
1. Verify API key in Environment variables
2. Get new API key from Anthropic if needed
3. Restart application

### Routes Not Found (404)

**Check:**
- [ ] `/routes/admin.js` uploaded to correct location
- [ ] `server.js` imports admin router: `import adminRouter from './routes/admin.js'`
- [ ] `server.js` mounts routes: `app.use('/admin', adminRouter)`

**Fix:**
1. Verify files uploaded to correct paths
2. Verify server.js has all imports and route mounts
3. Restart application

---

## Files Summary

| File | Location | Purpose |
|------|----------|---------|
| `login.html` | `/admin/` | Password login page |
| `dashboard.html` | `/admin/` | Analytics dashboard |
| `agent.html` | `/admin/` | AI content generator |
| `admin.js` | `/admin/` | Shared auth JS |
| `admin.js` | `/routes/` | Express routes & APIs |
| `server.js` | Root | UPDATED with admin code |
| `.env` | Root | Environment variables |

---

## Success Criteria

✅ All of these should be true:

- [ ] Visit `https://iamseraj.com/admin/login.html` → sees login page
- [ ] Enter password → redirects to dashboard
- [ ] Dashboard loads → sees stats and quick links
- [ ] Click Content Agent → loads agent page
- [ ] Click Generate → produces content with copy buttons
- [ ] Click Logout → redirects to login
- [ ] Try accessing dashboard without login → redirects to login (auth working)
- [ ] No 503 errors in Runtime logs

---

## When You Return in 3 Hours

1. Review all 5 files created (they're in your Portfolio folder)
2. Follow the steps in `ADMIN_SETUP.md` carefully
3. Use this checklist to track progress
4. If stuck on any step, check Troubleshooting section

**All files are ready. You've got this! 🚀**
