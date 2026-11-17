import { useState } from 'react'
import { useCommunity, useResource, Field, GroupSelect, MemberSelect, RecordList, Badge, ActionDialog, pretty, date } from './components.jsx'

const categories = ['ADVERTISEMENT','REPEATED_PROMOTION','SPAM','SCAM_CONCERN','HARASSMENT','INAPPROPRIATE_CONTENT','OTHER']
const blank = { groupId: '', memberId: '', category: 'ADVERTISEMENT', description: '', quotedText: '', reporterContact: '', severity: 'NORMAL', status: 'OPEN', resolution: '', assignedUserId: '' }
export default function Reports() {
  const { api, groups, navigate } = useCommunity(), [selected, setSelected] = useState(null), [form, setForm] = useState(blank), [revision, setRevision] = useState(0)
  const [filters, setFilters] = useState({ status: '', groupId: '' }), admins = useResource('administrators')
  const set = key => value => setForm(previous => ({ ...previous, [key]: value }))
  const open = report => { setSelected(report || { id: null }); setForm(report ? { ...blank, memberId: report.reported_member_id ? String(report.reported_member_id) : '', severity: report.severity, status: report.status, resolution: report.resolution || '', assignedUserId: report.assigned_user_id ? String(report.assigned_user_id) : '' } : { ...blank }) }
  const save = () => selected.id ? api.patch(`reports/${selected.id}`, { status: form.status, severity: form.severity, resolution: form.resolution,
    memberId: form.memberId ? Number(form.memberId) : null, assignedUserId: form.assignedUserId ? Number(form.assignedUserId) : null })
    : api.post('reports', { groupId: Number(form.groupId), memberId: form.memberId ? Number(form.memberId) : null, category: form.category,
      description: form.description, quotedText: form.quotedText, reporterContact: form.reporterContact, severity: form.severity })
  return <><div className="manager-header"><div><h3>Reports</h3><p className="text-muted">Record concerns reported to you. Messages are never collected from WhatsApp.</p></div><button className="btn-primary" onClick={() => open(null)}>+ Record report</button></div>
    <div className="community-filters"><Field label="Report status" value={filters.status} onChange={value => setFilters(previous => ({ ...previous, status: value }))} options={[["",'All statuses'],'OPEN','REVIEW','RESOLVED','DISMISSED']} /><GroupSelect value={filters.groupId} onChange={value => setFilters(previous => ({ ...previous, groupId: value }))} /></div>
    <RecordList resource="reports" filters={filters} reloadKey={revision} empty="No reports match these filters." columns={[
      { key: 'id', label: 'Report', render: item => <button className="community-link" onClick={() => open(item)}>#{item.id}</button> },
      { key: 'category', label: 'Category', render: item => pretty(item.category) }, { key: 'group_id', label: 'Group', render: item => groups.find(group => group.id === item.group_id)?.name || `Group #${item.group_id}` },
      { key: 'reported_member_id', label: 'Member', render: item => item.reported_member_id ? <button className="community-link" onClick={() => navigate('members', { memberId: item.reported_member_id })}>{item.member_name || `Member #${item.reported_member_id}`}</button> : 'Unidentified' },
      { key: 'severity', label: 'Severity', render: item => <Badge value={item.severity} /> }, { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> },
      { key: 'created_at', label: 'Reported', render: item => date(item.created_at) }, { key: 'actions', label: 'Actions', render: item => <button className="btn-edit" onClick={() => open(item)}>Review</button> }
    ]} />
    {selected && <ActionDialog title={selected.id ? `Review report #${selected.id}` : 'Record a report'} description={selected.id ? 'Review the quoted content and context before resolving or escalating this report.' : 'Record only the relevant content. Evidence uploads are not included.'} onClose={() => setSelected(null)} onConfirm={save} onDone={() => setRevision(value => value + 1)} label="Save report">
      {!selected.id ? <><GroupSelect value={form.groupId} onChange={set('groupId')} optional={false} required /><Field label="Category" value={form.category} onChange={set('category')} options={categories} />
        <Field label="Description" value={form.description} onChange={set('description')} multiline required minLength={15} maxLength={4000} /><Field label="Relevant quoted message (optional)" value={form.quotedText} onChange={set('quotedText')} multiline maxLength={4000} />
        <Field label="Reporter contact (optional)" value={form.reporterContact} onChange={set('reporterContact')} maxLength={200} /></>
        : <><p><strong>{pretty(selected.category)}</strong> · {groups.find(group => group.id === selected.group_id)?.name || `Group #${selected.group_id}`}</p><p className="community-quote">{selected.description || 'No retained description'}</p>
          {selected.quoted_text && <blockquote className="community-quote">{selected.quoted_text}</blockquote>}{selected.reporter_contact && <p>Reporter contact: {selected.reporter_contact}</p>}
          <Field label="Report status" value={form.status} onChange={set('status')} options={['OPEN','REVIEW','RESOLVED','DISMISSED']} />
          <Field label="Resolution" value={form.resolution} onChange={set('resolution')} multiline required={['RESOLVED','DISMISSED'].includes(form.status)} maxLength={2000} />
          <Field label="Assigned administrator" value={form.assignedUserId} onChange={set('assignedUserId')} options={[["",'Unassigned'], ...(form.assignedUserId && !admins.data?.some(admin => String(admin.id) === form.assignedUserId) ? [[form.assignedUserId,`Administrator #${form.assignedUserId}`]] : []), ...(admins.data || []).map(admin => [String(admin.id), admin.name || admin.email])]} hint={admins.error ? 'Administrator choices are unavailable. The existing assignment is preserved.' : undefined} />
        </>}
      <MemberSelect value={form.memberId} onChange={set('memberId')} optional /><Field label="Severity" value={form.severity} onChange={set('severity')} options={['NORMAL','HIGH','URGENT']} />
    </ActionDialog>}
  </>
}
