import { useState } from 'react'
import { useCommunity, useResource, Notice, Loading, Field, Badge, RecordList, ActionDialog, pretty, date } from './components.jsx'
import { downloadJson } from './api.js'

function MemberDetail({ memberId }) {
  const { api, navigate, groups } = useCommunity(), state = useResource(`members/${memberId}`)
  const [action, setAction] = useState(null), [name, setName] = useState(''), [city, setCity] = useState(''), [note, setNote] = useState(''), [status, setStatus] = useState('PENDING'), [revision, setRevision] = useState(0)
  const refresh = () => { state.reload(); setRevision(value => value + 1) }, member = state.data
  const confirm = async () => {
    if (action.type === 'EDIT') return api.patch(`members/${memberId}`, { full_name: name, city })
    if (action.type === 'NOTE') return api.post('notes', { memberId: Number(memberId), body: note })
    if (action.type === 'MEMBERSHIP') return api.patch(`memberships/${action.id}`, { status })
    if (action.type === 'EXPORT') return downloadJson(await api.get(`members/${memberId}/export`), `community-member-${memberId}.json`)
    return api.post(`members/${memberId}/anonymize`, { confirm: true })
  }
  return <><button className="community-link" onClick={() => navigate('members')}>← All members</button><Notice error={state.error} onRetry={state.reload} />
    {state.loading ? <Loading /> : member && <>
      <div className="manager-header"><div><h3>{member.full_name || 'Anonymized member'} · #{member.id}</h3><p className="text-muted">First recorded {date(member.created_at)}</p></div><Badge value={member.status} /></div>
      <dl className="community-details"><div><dt>WhatsApp number</dt><dd>{member.normalized_phone || 'Anonymized'}</dd></div><div><dt>City</dt><dd>{member.city || '—'}</dd></div><div><dt>First joined</dt><dd>{date(member.first_joined_at)}</dd></div></dl>
      <div className="community-actions">{!member.anonymized_at && <><button className="btn-edit" onClick={() => { setName(member.full_name || ''); setCity(member.city || ''); setAction({ type: 'EDIT' }) }}>Edit profile</button><button className="btn-edit" onClick={() => { setNote(''); setAction({ type: 'NOTE' }) }}>Add internal note</button></>}
        <button className="btn-edit" onClick={() => setAction({ type: 'EXPORT' })}>Export for admin review</button>{!member.anonymized_at && <button className="btn-delete" onClick={() => setAction({ type: 'ANONYMIZE' })}>Anonymize data</button>}</div>
      <h4 className="community-section-title">Group memberships</h4><RecordList resource="memberships" filters={{ memberId }} reloadKey={revision} empty="No recorded group memberships." columns={[
        { key: 'group_id', label: 'Group', render: item => groups.find(group => group.id === item.group_id)?.name || `Group #${item.group_id}` },
        { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'joined_at', label: 'Recorded admission', render: item => date(item.joined_at) },
        { key: 'actions', label: 'Actions', render: item => !member.anonymized_at && <button className="btn-edit" onClick={() => { setStatus(item.status); setAction({ type: 'MEMBERSHIP', id: item.id }) }}>Update status</button> }
      ]} />
      <h4 className="community-section-title">Join-request history</h4><RecordList resource="join-requests" filters={{ memberId }} reloadKey={revision} columns={[
        { key: 'id', label: 'Request', render: item => <button className="community-link" onClick={() => navigate('requests', { requestId: item.id })}>#{item.id}</button> }, { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'created_at', label: 'Submitted', render: item => date(item.created_at) }
      ]} />
      <h4 className="community-section-title">Reports</h4><RecordList resource="reports" filters={{ memberId }} reloadKey={revision} columns={[
        { key: 'id', label: 'Report' }, { key: 'category', label: 'Category', render: item => pretty(item.category) }, { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'description', label: 'Description' }
      ]} />
      <h4 className="community-section-title">Warnings</h4><RecordList resource="warnings" filters={{ memberId }} reloadKey={revision} columns={[
        { key: 'level', label: 'Level', render: item => <Badge value={item.level} /> }, { key: 'reason', label: 'Reason' }, { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'issued_at', label: 'Issued', render: item => date(item.issued_at) }
      ]} />
      <h4 className="community-section-title">Block history</h4><RecordList resource="blocks" filters={{ memberId, active: 'false' }} reloadKey={revision} columns={[
        { key: 'reason', label: 'Reason' }, { key: 'blocked_at', label: 'Blocked', render: item => date(item.blocked_at) }, { key: 'unblocked_at', label: 'Status', render: item => <Badge value={item.unblocked_at ? 'RESOLVED' : 'BLOCKED'} /> }
      ]} />
      <h4 className="community-section-title">Internal member notes</h4><RecordList resource="notes" filters={{ memberId }} reloadKey={revision} columns={[
        { key: 'body', label: 'Note' }, { key: 'actor_kind', label: 'Author', render: item => pretty(item.actor_kind) }, { key: 'created_at', label: 'Created', render: item => date(item.created_at) }
      ]} />
    </>}
    {action && <ActionDialog title={action.type === 'EDIT' ? 'Edit member profile' : action.type === 'NOTE' ? 'Add internal note' : action.type === 'MEMBERSHIP' ? 'Record membership status' : action.type === 'EXPORT' ? 'Export member records' : 'Anonymize member data?'}
      description={action.type === 'ANONYMIZE' ? 'This clears contact details and linked application/moderation text. Resolve active blocks first. Minimal audit history remains. This does not delete WhatsApp messages or remove someone from WhatsApp.' : action.type === 'EXPORT' ? 'The download contains personal and moderation information. Keep it private and redact third-party information before sharing with an applicant.' : action.type === 'MEMBERSHIP' ? 'Record only a status you have confirmed manually in WhatsApp. This action updates the record here.' : 'These details are visible only to administrators.'}
      danger={action.type === 'ANONYMIZE' || (action.type === 'MEMBERSHIP' && ['BLOCKED','REMOVED'].includes(status))} label={action.type === 'EXPORT' ? 'Download private export' : action.type === 'ANONYMIZE' ? 'Anonymize data' : 'Save changes'} onClose={() => setAction(null)} onConfirm={confirm} onDone={refresh}>
      {action.type === 'EDIT' && <><Field label="Full name" value={name} onChange={setName} required maxLength={160} /><Field label="City" value={city} onChange={setCity} required maxLength={120} /></>}
      {action.type === 'NOTE' && <Field label="Internal note" value={note} onChange={setNote} multiline required maxLength={4000} />}
      {action.type === 'MEMBERSHIP' && <Field label="Membership status" value={status} onChange={setStatus} options={['PENDING','ACTIVE','WARNED','BLOCKED','LEFT','REMOVED']} hint="A group membership status does not create or remove a central member block. Use Blocked for that." />}
    </ActionDialog>}
  </>
}
export default function Members({ memberId }) {
  const { navigate } = useCommunity(), [filters, setFilters] = useState({ search: '', city: '', status: '' }), [draft, setDraft] = useState(filters)
  if (memberId) return <MemberDetail key={memberId} memberId={memberId} />
  const set = key => value => setDraft(previous => ({ ...previous, [key]: value }))
  return <><h3>Members</h3><p className="text-muted">One profile can hold memberships in multiple city groups.</p><form className="community-filters" onSubmit={event => { event.preventDefault(); setFilters(draft) }}>
    <Field label="Name" value={draft.search} onChange={set('search')} maxLength={160} /><Field label="City" value={draft.city} onChange={set('city')} maxLength={120} />
    <Field label="Member status" value={draft.status} onChange={set('status')} options={[["",'All statuses'],'PENDING','ACTIVE','WARNED','BLOCKED','LEFT','REMOVED','ANONYMIZED']} /><button className="btn-primary">Apply filters</button>
  </form><RecordList resource="members" filters={filters} empty="No community members yet." columns={[
    { key: 'full_name', label: 'Member', render: item => <button className="community-link" onClick={() => navigate('members', { memberId: item.id })}>{item.full_name || 'Anonymized member'}<small>#{item.id}</small></button> }, { key: 'normalized_phone', label: 'Phone' },
    { key: 'city', label: 'City' }, { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'created_at', label: 'First recorded', render: item => date(item.created_at) }
  ]} /></>
}
