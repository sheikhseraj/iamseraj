import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import ThemeToggle from '../../components/ThemeToggle.jsx'
import { createCommunityApi } from './api.js'
import { CommunityContext, Notice } from './components.jsx'
import Overview from './Overview.jsx'
import JoinRequests from './JoinRequests.jsx'
import Groups from './Groups.jsx'
import Members from './Members.jsx'
import Reports from './Reports.jsx'
import Warnings from './Warnings.jsx'
import Blocked from './Blocked.jsx'
import Settings from './Settings.jsx'
import AuditLog from './AuditLog.jsx'
import Icon from './icons.jsx'
import SearchDialog from './SearchDialog.jsx'
import './community.css'

const views = [['overview','Overview'], ['requests','Join Requests'], ['members','Members'], ['groups','Groups'], ['reports','Reports'],
  ['warnings','Warnings'], ['blocked','Blocked'], ['settings','Settings'], ['audit','Audit Log']]
function locationState() {
  const params = new URLSearchParams(window.location.search), view = params.get('view') || 'overview'
  return { view: views.some(([key]) => key === view) ? view : 'overview', requestId: /^\d+$/.test(params.get('requestId') || '') ? params.get('requestId') : '',
    memberId: /^\d+$/.test(params.get('memberId') || '') ? params.get('memberId') : '' }
}
export default function CommunityManager({ token, onUnauthorized, onExit, onLogout }) {
  const api = useMemo(() => createCommunityApi(token, onUnauthorized), [token, onUnauthorized])
  const [location, setLocation] = useState(locationState), [revision, setRevision] = useState(0)
  const [settings, setSettings] = useState(null), [groups, setGroups] = useState([])
  const [settingsError, setSettingsError] = useState(null), [groupsError, setGroupsError] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false), [search, setSearch] = useState(''), [searchOpen, setSearchOpen] = useState(false), [counts, setCounts] = useState(null)
  const [mobile, setMobile] = useState(() => window.matchMedia?.('(max-width: 700px)').matches || false)
  const wasMenuOpen = useRef(false)
  useEffect(() => {
    if (menuOpen && mobile) document.querySelector('#community-sidebar button')?.focus()
    else if (wasMenuOpen.current && mobile) document.querySelector('.community-menu-toggle')?.focus()
    wasMenuOpen.current = menuOpen
  }, [menuOpen, mobile])
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 700px)')
    if (!media) return
    const handle = () => setMobile(media.matches)
    media.addEventListener('change', handle); return () => media.removeEventListener('change', handle)
  }, [])
  useEffect(() => {
    const close = event => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close)
  }, [])
  const refreshConfiguration = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => { const handle = () => setLocation(locationState()); window.addEventListener('popstate', handle); return () => window.removeEventListener('popstate', handle) }, [])
  useEffect(() => {
    const controller = new AbortController()
    api.get('settings', controller.signal).then(data => { if (!controller.signal.aborted) { setSettings(data); setSettingsError(null) } })
      .catch(error => { if (!controller.signal.aborted) setSettingsError(error) })
    const loadGroups = async () => {
      const all = []; let page = 1, total
      do { const data = await api.get(`groups?limit=100&page=${page++}`, controller.signal); all.push(...data.items); total = data.total } while (all.length < total && page <= 100)
      if (!controller.signal.aborted) { setGroups(all); setGroupsError(null) }
    }
    loadGroups().catch(error => { if (!controller.signal.aborted) setGroupsError(error) })
    api.get('overview', controller.signal).then(data => { if (!controller.signal.aborted) setCounts(data.counts) }).catch(() => {})
    return () => controller.abort()
  }, [api, revision, location.view])
  const navigate = useCallback((view, extra = {}) => {
    const params = new URLSearchParams({ section: 'community', view, ...extra })
    window.history.pushState(null, '', `/admin?${params}`); setLocation(locationState())
    setMenuOpen(false)
  }, [])
  const context = useMemo(() => ({ api, settings, groups, groupsError, refreshConfiguration, navigate }), [api, settings, groups, groupsError, refreshConfiguration, navigate])
  const icons = { overview: 'dashboard', requests: 'requests', members: 'people', groups: 'people', reports: 'shield', warnings: 'warning', blocked: 'blocked', settings: 'settings', audit: 'audit' }
  return <CommunityContext.Provider value={context}><div className="community-shell">
    {menuOpen && <button className="community-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    <aside id="community-sidebar" className={`community-sidebar ${menuOpen ? 'is-open' : ''}`} inert={mobile && !menuOpen ? '' : undefined} aria-hidden={mobile && !menuOpen ? true : undefined}>
      <a className="community-brand" href="/" aria-label="iamseraj.com home"><img src="/photo-linkedin.jpg" alt="" /><span><strong>iamseraj.com</strong><small>Admin Portal</small></span></a>
      <nav className="community-main-nav" aria-label="Existing admin portal"><button aria-label="Portfolio dashboard" title="Portfolio dashboard" onClick={() => onExit?.('blogs')}><Icon name="dashboard" /><span>Portfolio dashboard</span></button><a href="/" aria-label="Website" title="Website"><Icon name="globe" /><span>Website</span></a><a href="/admin/dashboard.html" aria-label="Content tools" title="Content tools"><Icon name="tools" /><span>Content tools</span></a></nav>
      <div className="community-sidebar-title"><span className="community-whatsapp-symbol"><Icon name="phone" size={16} /></span><span>WhatsApp Community</span></div>
      <nav className="community-side-nav" aria-label="WhatsApp Community sections">{views.map(([key, label]) => <button key={key} title={label} aria-label={label} className={location.view === key ? 'active' : ''} aria-current={location.view === key ? 'page' : undefined} onClick={() => navigate(key)}>
        <Icon name={icons[key]} /><span>{key === 'settings' ? 'Rules & Settings' : label}</span>{key === 'requests' && counts?.pendingRequests > 0 && <small className="community-nav-count">{counts.pendingRequests}</small>}
      </button>)}</nav>
      <div className="community-sidebar-footer"><button aria-label="Profile" title="Profile" onClick={() => onExit?.('profile')}><Icon name="user" /><span>Profile</span></button><button aria-label="Logout" title="Logout" onClick={onLogout}><Icon name="logout" /><span>Logout</span></button></div>
    </aside>
    <div className="community-workspace" inert={mobile && menuOpen ? '' : undefined}><header className="community-topbar"><button className="community-menu-toggle" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-controls="community-sidebar" aria-label="Toggle navigation"><Icon name="menu" /></button>
      <form className="community-global-search" onSubmit={event => { event.preventDefault(); setSearchOpen(true) }}><Icon name="search" /><input aria-label="Search members, groups, requests" placeholder="Search members, groups, requests…" value={search} maxLength={160} onChange={event => setSearch(event.target.value)} /><button aria-label="Search community" type="submit"><Icon name="arrow" size={16} /></button></form>
      <div className="community-topbar-user"><ThemeToggle /><button className="community-notifications" aria-label="Review join requests" onClick={() => navigate('requests')}><Icon name="bell" />{counts?.pendingRequests > 0 && <small>{counts.pendingRequests}</small>}</button><button className="community-account" onClick={() => onExit?.('profile')}><img src="/photo-linkedin.jpg" alt="" /><span><strong>Seraj</strong><small>Admin</small></span></button></div>
    </header><main className="community-content"><section className="community" aria-labelledby="community-heading">
    <div className="community-heading"><div className="community-title-group"><span className="community-title-icon" aria-hidden="true"><Icon name="phone" size={34} /></span><div><h2 id="community-heading">WhatsApp Community Management</h2><p className="text-muted">Manage join requests, groups and members, and keep the community safe and helpful.</p></div></div>
      <div className="community-summary"><span className="community-badge is-neutral">Manual WhatsApp handoff</span>{settings && <span className={`community-badge ${settings.feature_enabled ? 'is-good' : 'is-neutral'}`}>{settings.feature_enabled ? 'Community enabled' : 'Community disabled'}</span>}</div>
    </div>
    <Notice error={settingsError} onRetry={refreshConfiguration} />
    <div className="admin-manager community-panel" key={location.view}>
      {location.view === 'overview' && <Overview />}
      {location.view === 'requests' && <JoinRequests requestId={location.requestId} initialStatus={new URLSearchParams(window.location.search).get('status') || ''} />}
      {location.view === 'members' && <Members memberId={location.memberId} />}
      {location.view === 'groups' && <Groups />}
      {location.view === 'reports' && <Reports />}
      {location.view === 'warnings' && <Warnings />}
      {location.view === 'blocked' && <Blocked />}
      {location.view === 'settings' && <Settings />}
      {location.view === 'audit' && <AuditLog />}
    </div>
  </section></main></div>{searchOpen && <SearchDialog initialSearch={search} onClose={() => setSearchOpen(false)} />}</div></CommunityContext.Provider>
}
