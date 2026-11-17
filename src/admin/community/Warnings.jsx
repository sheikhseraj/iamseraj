import { useState } from 'react'
import { useCommunity, useResource, Field, GroupSelect, MemberSelect, RecordList, Badge, ActionDialog, date } from './components.jsx'

function ReportChoice({ memberId, groupId, value, onChange }) {
  const state = useResource(`reports?limit=100&memberId=${encodeURIComponent(memberId)}&groupId=${encodeURIComponent(groupId)}`)
  return <Field label="Related report (optional)" value={value} onChange={onChange} options={[["",'No related report'], ...(state.data?.items || []).map(report => [String(report.id), `Report #${report.id} · ${report.category.toLowerCase().replaceAll('_',' ')}`])]} hint={state.error ? 'Related reports could not be loaded.' : undefined} />
}
export default function Warnings() {
  const { api, groups, navigate } = useCommunity(), [create, setCreate] = useState(false), [revoke, setRevoke] = useState(null), [revision, setRevision] = useState(0)
  const [form, setForm] = useState({ memberId: '', groupId: '', reportId: '', level: '', reason: '' }), [filters, setFilters] = useState({ status: '', groupId: '' })
  const set = key => value => setForm(previous => ({ ...previous, [key]: value, ...(['memberId','groupId'].includes(key) ? { reportId: '' } : {}) }))
  return <><div className="manager-header"><div><h3>Warnings</h3><p className="text-muted">Record progressive moderation and review repeated violations.</p></div><button className="btn-primary" onClick={() => { setForm({ memberId: '', groupId: '', reportId: '', level: '', reason: '' }); setCreate(true) }}>+ Issue warning</button></div>
    <div className="community-filters"><Field label="Warning status" value={filters.status} onChange={value => setFilters(previous => ({ ...previous, status: value }))} options={[["",'All statuses'],'ACTIVE','REVOKED']} /><GroupSelect value={filters.groupId} onChange={value => setFilters(previous => ({ ...previous, groupId: value }))} /></div>
    <RecordList resource="warnings" filters={filters} reloadKey={revision} empty="No recorded warnings." columns={[
      { key: 'member_id', label: 'Member', render: item => <button className="community-link" onClick={() => navigate('members', { memberId: item.member_id })}>{item.member_name || `Member #${item.member_id}`}</button> },
      { key: 'group_id', label: 'Group', render: item => groups.find(group => group.id === item.group_id)?.name || (item.group_id ? `Group #${item.group_id}` : 'All groups') },
      { key: 'level', label: 'Level', render: item => <Badge value={item.level} /> }, { key: 'reason', label: 'Reason' },
      { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'issued_at', label: 'Issued', render: item => date(item.issued_at) },
      { key: 'actions', label: 'Actions', render: item => item.status === 'ACTIVE' && <button className="btn-edit" onClick={() => setRevoke(item)}>Revoke</button> }
    ]} />
    {create && <ActionDialog title="Issue a warning" description={form.level === 'BLOCKED' ? 'This explicit decision records an internal member block. Remove the person in WhatsApp manually if needed.' : 'The default policy recommends warning, final warning, then removal review. It does not send a message or remove someone in WhatsApp.'} danger={form.level === 'BLOCKED'} label={form.level === 'BLOCKED' ? 'Record warning and block' : 'Record warning'}
      onClose={() => setCreate(false)} onDone={() => setRevision(value => value + 1)} onConfirm={() => api.post('warnings', { memberId: Number(form.memberId), groupId: form.groupId ? Number(form.groupId) : null, reportId: form.reportId ? Number(form.reportId) : null, reason: form.reason, ...(form.level ? { level: form.level } : {}) })}>
      <MemberSelect value={form.memberId} onChange={set('memberId')} /><GroupSelect value={form.groupId} onChange={set('groupId')} />
      {form.memberId && <ReportChoice key={`${form.memberId}-${form.groupId}`} memberId={form.memberId} groupId={form.groupId} value={form.reportId} onChange={set('reportId')} />}
      <Field label="Warning level" value={form.level} onChange={set('level')} options={[["",'Use configured progression'],'WARNING','FINAL_WARNING','REMOVAL_RECOMMENDED','BLOCKED']} /><Field label="Reason" value={form.reason} onChange={set('reason')} multiline required maxLength={2000} />
    </ActionDialog>}
    {revoke && <ActionDialog title={`Revoke warning #${revoke.id}?`} description="The warning remains in history as revoked. Any member block must be resolved separately." onClose={() => setRevoke(null)} onDone={() => setRevision(value => value + 1)} onConfirm={() => api.patch(`warnings/${revoke.id}`, { status: 'REVOKED' })} label="Revoke warning" />}
  </>
}
