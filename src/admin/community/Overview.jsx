import { useState } from 'react'
import { useResource, useCommunity, Notice, Loading, Table, Badge, Risk, date, pretty, ActionDialog, Field } from './components.jsx'
import Icon from './icons.jsx'

const cards = [['groups','Total groups','groups','people','blue'], ['activeMembers','Active members','members','people','green'],
  ['pendingRequests','Pending requests','requests','clock','amber'], ['openReports','Open reports','reports','shield','purple'], ['blockedMembers','Blocked members','blocked','blocked','teal']]
export default function Overview() {
  const state = useResource('overview'), { api, navigate, groups, settings, refreshConfiguration } = useCommunity()
  const [action, setAction] = useState(null), [reason, setReason] = useState('')
  return <div className="community-overview"><Notice error={state.error} onRetry={state.reload} />{state.loading ? <Loading /> : state.data && <>
    <div className="community-reference-stats">{cards.map(([key,label,view,icon,tone]) => <button key={key} className="community-stat" onClick={() => navigate(view)}><div className={`community-stat-symbol ${tone}`}><Icon name={icon} size={25} /></div><div><strong>{state.data.counts[key]}</strong><span>{label}</span></div></button>)}</div>
    <div className="community-queue-summary"><button className="community-link" onClick={() => navigate('requests')}>{state.data.counts.needsReview} requests need review</button><button className="community-link" onClick={() => navigate('warnings')}>{state.data.counts.warnedMembers} warned members</button><button className="community-link" onClick={state.reload}>Refresh</button></div>
    <div className="community-overview-layout"><div className="community-overview-main">
      <section className="community-overview-card"><div className="community-overview-card-heading"><h3>Recent Join Requests</h3><button className="community-link" onClick={() => navigate('requests')}>View all requests →</button></div>
        <Table caption="Recent join requests" items={state.data.recentRequests.items} columns={[
          { key: 'full_name', label: 'Name', render: item => <div className="community-person"><span className="community-person-avatar" aria-hidden="true">{(item.full_name || '?').slice(0,1).toUpperCase()}</span><div><button className="community-link" onClick={() => navigate('requests', { requestId: item.id })}>{item.full_name || 'Anonymized applicant'}</button><small>{item.normalized_phone || 'Anonymized'}</small></div></div> },
          { key: 'group_id', label: 'Group', render: item => groups.find(group => group.id === item.group_id)?.name || `Group #${item.group_id}` },
          { key: 'reason', label: 'Reason for joining', render: item => <span className="community-reason-excerpt">{item.reason || 'No retained reason'}</span> },
          { key: 'risk_score', label: 'Risk', render: item => <Risk score={item.risk_score} /> },
          { key: 'actions', label: 'Action', render: item => ['PENDING','REVIEW'].includes(item.status) ? <div className="community-actions"><button className="btn-primary" onClick={() => { setReason(''); setAction({ request: item, status: 'APPROVED' }) }}>Approve</button><button className="btn-delete" onClick={() => { setReason(''); setAction({ request: item, status: 'REJECTED' }) }}>Reject</button></div> : <Badge value={item.status} /> }
        ]} empty="No applications yet." />
      </section>
      <section className="community-overview-card"><div className="community-overview-card-heading"><h3>Your WhatsApp Groups ({groups.length})</h3><button className="btn-primary" onClick={() => navigate('groups')}>Manage groups</button></div>
        <Table caption="Configured WhatsApp groups" items={groups.slice(0,5)} columns={[
          { key: 'name', label: 'Group name' }, { key: 'current_member_count', label: 'Manual count' }, { key: 'city', label: 'City' },
          { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> },
          { key: 'accepting_applications', label: 'Applications', render: item => item.accepting_applications ? 'Open' : 'Closed' },
          { key: 'has_invite_link', label: 'Private invite', render: item => item.has_invite_link ? 'Configured' : 'Not set' }
        ]} empty="No groups configured yet." />
      </section>
      {state.data.groupsNearCapacity.length > 0 && <p className="community-info">{state.data.groupsNearCapacity.length} group(s) nearing configured capacity. Counts are maintained manually.</p>}
    </div><aside className="community-overview-aside" aria-label="Community administration tools">
      <section className="community-overview-card community-handoff-card"><h3>Approval Handoff (Admin Only)</h3><p>Admit approved applicants manually in WhatsApp, then record their membership here.</p><button className="btn-primary" onClick={() => navigate('requests', { status: 'APPROVED' })}>Review approved applicants</button><div className="community-overview-card-heading"><h3>Recent activity</h3><button className="community-link" onClick={() => navigate('audit')}>View all →</button></div>
        {state.data.recentActivity.items.length ? state.data.recentActivity.items.slice(0,4).map(item => <div className="community-activity-item" key={item.id}><strong>{pretty(item.action)}</strong><small>{pretty(item.actor_kind)} · {date(item.created_at)}</small></div>) : <p>No moderation activity yet.</p>}
      </section>
      <section className="community-overview-card community-rules-card"><div className="community-overview-card-heading"><h3>Community Rules</h3><button className="community-link" onClick={() => navigate('settings')}>View / edit rules</button></div>
        {settings?.rules_text ? <ol className="community-rules-list">{settings.rules_text.split(/\n+|(?<=[.!?])\s+/).filter(Boolean).map((rule,index) => <li key={index}>{rule}</li>)}</ol> : <p>Configure the community rules before opening applications.</p>}
        <div className="community-rules-acceptance">Applicants must acknowledge the rules and privacy notice before requesting to join.</div>
      </section>
      <section className="community-overview-card"><div className="community-overview-card-heading"><h3>Open Reports</h3><button className="community-link" onClick={() => navigate('reports')}>Review →</button></div>{state.data.unresolvedReports.items.length ? state.data.unresolvedReports.items.map(item => <div className="community-activity-item" key={item.id}><strong>#{item.id} · {pretty(item.category)}</strong><small><Badge value={item.severity} /></small></div>) : <p className="text-muted">No unresolved reports.</p>}</section>
    </aside></div>
  </>}
    {action && <ActionDialog title={`${pretty(action.status)} request #${action.request.id}`} description={action.status === 'APPROVED' ? 'Review the application and its history before confirming. Approval starts a manual handoff; membership remains pending until admission is confirmed.' : 'This is a final rejection. Contact the applicant manually with neutral wording.'} danger={action.status === 'REJECTED'} label="Save decision" onClose={() => setAction(null)} onConfirm={() => api.post(`join-requests/${action.request.id}/decision`, { status: action.status, reason })} onDone={() => { state.reload(); refreshConfiguration() }}>
      <Field label="Internal decision reason (optional)" value={reason} onChange={setReason} multiline maxLength={2000} /><button type="button" className="community-link" onClick={() => { navigate('requests', { requestId: action.request.id }); setAction(null) }}>View full application before deciding →</button>
    </ActionDialog>}
  </div>
}
