import { useState } from 'react'
import { Field, RecordList, pretty, date } from './components.jsx'

export default function AuditLog() {
  const [filters, setFilters] = useState({ targetType: '', targetId: '', from: '', to: '' }), [draft, setDraft] = useState(filters)
  const set = key => value => setDraft(previous => ({ ...previous, [key]: value }))
  return <><h3>Audit log</h3><p className="text-muted">A record of community decisions and configuration changes.</p><form className="community-filters" onSubmit={event => { event.preventDefault(); setFilters(draft) }}>
    <Field label="Record type" value={draft.targetType} onChange={set('targetType')} options={[["",'All records'],'JOIN_REQUEST','GROUP','MEMBER','MEMBERSHIP','REPORT','WARNING','NOTE','SETTINGS']} />
    <Field label="Record number (optional)" type="number" min={1} value={draft.targetId} onChange={set('targetId')} /><Field label="From date" type="date" value={draft.from} onChange={set('from')} /><Field label="To date" type="date" value={draft.to} onChange={set('to')} /><button className="btn-primary">Apply filters</button>
  </form><RecordList resource="audit-logs" filters={filters} empty="No audit events match these filters." columns={[
    { key: 'action', label: 'Action', render: item => pretty(item.action) }, { key: 'actor_user_id', label: 'Actor', render: item => item.actor_user_id ? `Administrator #${item.actor_user_id}` : pretty(item.actor_kind) },
    { key: 'target_id', label: 'Record', render: item => `${pretty(item.target_type)} #${item.target_id}` }, { key: 'created_at', label: 'Time', render: item => date(item.created_at) },
    { key: 'metadata', label: 'Details', render: item => <details><summary>View details</summary><pre className="community-metadata">{JSON.stringify(item.metadata, null, 2)}</pre></details> }
  ]} /></>
}
