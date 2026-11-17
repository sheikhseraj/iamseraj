import { useEffect, useState } from 'react'
import { Field, GroupSelect, RecordList, Risk, Badge, date, useCommunity } from './components.jsx'
import RequestDetail from './RequestDetail.jsx'

export default function JoinRequests({ requestId, initialStatus = '' }) {
  const { navigate, groups } = useCommunity()
  const [filters, setFilters] = useState({ status: '', risk: '', groupId: '', city: '', from: '', to: '', search: '' })
  const [draft, setDraft] = useState(filters)
  useEffect(() => {
    const status = ['PENDING','REVIEW','APPROVED','REJECTED'].includes(initialStatus) ? initialStatus : ''
    setFilters(previous => ({ ...previous, status })); setDraft(previous => ({ ...previous, status }))
  }, [initialStatus])
  if (requestId) return <RequestDetail key={requestId} requestId={requestId} />
  const set = key => value => setDraft(previous => ({ ...previous, [key]: value }))
  return <><h3>Join requests</h3><p className="text-muted">Screening helps you review an application. You make the final decision.</p>
    <form className="community-filters" onSubmit={event => { event.preventDefault(); setFilters(draft) }}>
      <Field label="Applicant name" value={draft.search} onChange={set('search')} maxLength={160} />
      <Field label="Status" value={draft.status} onChange={set('status')} options={[["",'All statuses'],'PENDING','REVIEW','APPROVED','REJECTED']} />
      <Field label="Risk" value={draft.risk} onChange={set('risk')} options={[["",'All risk levels'],['LOW','Low risk'],['REVIEW','Review'],['HIGH','High risk']]} />
      <GroupSelect value={draft.groupId} onChange={set('groupId')} /><Field label="City" value={draft.city} onChange={set('city')} maxLength={120} />
      <Field label="From date" type="date" value={draft.from} onChange={set('from')} /><Field label="To date" type="date" value={draft.to} onChange={set('to')} />
      <div className="community-actions"><button className="btn-primary">Apply filters</button><button type="button" className="btn-edit" onClick={() => { const empty = Object.fromEntries(Object.keys(draft).map(key => [key,''])); setDraft(empty); setFilters(empty) }}>Clear</button></div>
    </form>
    <RecordList resource="join-requests" filters={filters} empty="No join requests match these filters." columns={[
      { key: 'full_name', label: 'Applicant', render: item => <button className="community-link" onClick={() => navigate('requests', { requestId: item.id })}>{item.full_name || 'Anonymized applicant'}<small>Request #{item.id}</small></button> },
      { key: 'normalized_phone', label: 'Phone' }, { key: 'group_id', label: 'Group', render: item => groups.find(group => group.id === item.group_id)?.name || `Group #${item.group_id}` },
      { key: 'city', label: 'City' }, { key: 'risk_score', label: 'Risk', render: item => <Risk score={item.risk_score} /> },
      { key: 'recommendation', label: 'Recommendation', render: item => <Badge value={item.recommendation} /> },
      { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'created_at', label: 'Submitted', render: item => date(item.created_at) }
    ]} />
  </>
}
