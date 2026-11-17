import { useState } from 'react'
import { useCommunity, Field, GroupSelect, MemberSelect, RecordList, Badge, ActionDialog, date, Toggle } from './components.jsx'

export default function Blocked() {
  const { api, groups, navigate } = useCommunity(), [create, setCreate] = useState(false), [selected, setSelected] = useState(null), [revision, setRevision] = useState(0)
  const [form, setForm] = useState({ memberId: '', groupId: '', reason: '' }), [history, setHistory] = useState(false)
  const set = key => value => setForm(previous => ({ ...previous, [key]: value }))
  return <><div className="manager-header"><div><h3>Blocked members</h3><p className="text-muted">Internal blocks flag new applications for manual review.</p></div><button className="btn-delete" onClick={() => { setForm({ memberId: '', groupId: '', reason: '' }); setCreate(true) }}>Record block</button></div>
    <Toggle label="Include resolved blocks" checked={history} onChange={setHistory} />
    <RecordList resource="blocks" filters={{ active: history ? 'false' : 'true' }} reloadKey={revision} empty="No blocked members." columns={[
      { key: 'member_id', label: 'Member', render: item => <button className="community-link" onClick={() => navigate('members', { memberId: item.member_id })}>{item.member_name || `Member #${item.member_id}`}</button> },
      { key: 'member_phone', label: 'Phone' },
      { key: 'originating_group_id', label: 'Originating group', render: item => groups.find(group => group.id === item.originating_group_id)?.name || (item.originating_group_id ? `Group #${item.originating_group_id}` : 'Community-wide') },
      { key: 'reason', label: 'Reason' }, { key: 'blocked_at', label: 'Recorded', render: item => date(item.blocked_at) },
      { key: 'actor_kind', label: 'Administrator', render: item => item.blocked_by_user_id ? `Administrator #${item.blocked_by_user_id}` : 'Shared administrator' },
      { key: 'unblocked_at', label: 'Status', render: item => <Badge value={item.unblocked_at ? 'RESOLVED' : 'BLOCKED'} /> },
      { key: 'actions', label: 'Actions', render: item => !item.unblocked_at && <button className="btn-edit" onClick={() => setSelected(item)}>Unblock</button> }
    ]} />
    {create && <ActionDialog title="Record a member block" description="New applications from this phone will be stored and flagged for review. This does not remove the person in WhatsApp." danger label="Record block" onClose={() => setCreate(false)} onDone={() => setRevision(value => value + 1)} onConfirm={() => api.post('blocks', { memberId: Number(form.memberId), groupId: form.groupId ? Number(form.groupId) : null, reason: form.reason })}>
      <MemberSelect value={form.memberId} onChange={set('memberId')} /><GroupSelect value={form.groupId} onChange={set('groupId')} /><Field label="Reason for blocking" value={form.reason} onChange={set('reason')} multiline required maxLength={2000} />
    </ActionDialog>}
    {selected && <ActionDialog title={`Unblock member #${selected.member_id}?`} description="This resolves the internal block. New applications still require a review decision, and WhatsApp membership is unchanged." onClose={() => setSelected(null)} onDone={() => setRevision(value => value + 1)} onConfirm={() => api.post(`blocks/${selected.id}/unblock`, {})} label="Unblock member" />}
  </>
}
