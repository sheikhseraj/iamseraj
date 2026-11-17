import { useState } from 'react'
import { useCommunity, Field, Toggle, RecordList, Badge, ActionDialog } from './components.jsx'

const blank = { name: '', slug: '', city: '', description: '', status: 'ACTIVE', is_public: false, accepting_applications: false,
  approximate_capacity: '', current_member_count: '', instructions: '' }
export default function Groups() {
  const { api, refreshConfiguration } = useCommunity(), [selected, setSelected] = useState(null), [form, setForm] = useState(blank)
  const [inviteGroup, setInviteGroup] = useState(null), [invite, setInvite] = useState(''), [archive, setArchive] = useState(null), [revision, setRevision] = useState(0)
  const refresh = () => { setRevision(value => value + 1); refreshConfiguration() }
  const edit = group => { setSelected(group || { id: null }); setForm(group ? { ...blank, ...group, approximate_capacity: group.approximate_capacity ?? '', current_member_count: group.current_member_count ?? '' } : { ...blank }) }
  const set = key => value => setForm(previous => ({ ...previous, [key]: value }))
  const save = () => {
    const body = Object.fromEntries(Object.keys(blank).map(key => [key, form[key]]))
    for (const key of ['approximate_capacity','current_member_count']) body[key] = form[key] === '' ? null : Number(form[key])
    body.is_public = Boolean(form.is_public); body.accepting_applications = Boolean(form.accepting_applications)
    return selected.id ? api.patch(`groups/${selected.id}`, body) : api.post('groups', body)
  }
  return <><div className="manager-header"><div><h3>Groups</h3><p className="text-muted">Configure city groups and manual join instructions.</p></div><button className="btn-primary" onClick={() => edit(null)}>+ New group</button></div>
    <RecordList resource="groups" reloadKey={revision} empty="No groups configured. Create your first city group." columns={[
      { key: 'name', label: 'Group', render: item => <><strong>{item.name}</strong><small>{item.slug}</small></> }, { key: 'city', label: 'City' },
      { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'is_public', label: 'Visibility', render: item => item.is_public ? 'Public listing' : 'Private' },
      { key: 'accepting_applications', label: 'Applications', render: item => item.accepting_applications ? 'Open' : 'Closed' },
      { key: 'current_member_count', label: 'Manual count', render: item => `${item.current_member_count ?? '—'} / ${item.approximate_capacity ?? '—'}` },
      { key: 'actions', label: 'Actions', render: item => <div className="community-actions"><button className="btn-edit" onClick={() => edit(item)}>Edit</button><button className="btn-edit" onClick={() => { setInviteGroup(item); setInvite('') }}>Private invite</button>
        {item.status !== 'ARCHIVED' && <button className="btn-delete" onClick={() => setArchive(item)}>Archive</button>}</div> }
    ]} />
    {selected && <ActionDialog title={selected.id ? 'Edit group' : 'Create group'} description="Public visibility lists this group on the community page. Private invite links are configured separately." onClose={() => setSelected(null)} onConfirm={save} onDone={refresh} label="Save group">
      <div className="form-row"><Field label="Group name" value={form.name} onChange={set('name')} required maxLength={160} /><Field label="City" value={form.city} onChange={set('city')} required maxLength={120} /></div>
      <Field label="Slug" value={form.slug} onChange={set('slug')} required maxLength={160} pattern="[a-z0-9]+(-[a-z0-9]+)*" hint="Lowercase letters, numbers and hyphens, e.g. indians-in-magdeburg." />
      <Field label="Description" value={form.description} onChange={set('description')} multiline required maxLength={4000} />
      <Field label="Group status" value={form.status} onChange={set('status')} options={['ACTIVE','INACTIVE','ARCHIVED']} />
      <Toggle label="Show in the public group listing" checked={form.is_public} onChange={set('is_public')} /><Toggle label="Accept applications" checked={form.accepting_applications} onChange={set('accepting_applications')} />
      <div className="form-row"><Field label="Approximate capacity (optional)" type="number" min={1} max={100000} value={form.approximate_capacity} onChange={set('approximate_capacity')} /><Field label="Current member count (manual, optional)" type="number" min={0} max={100000} value={form.current_member_count} onChange={set('current_member_count')} /></div>
      <Field label="Approved applicant instructions (optional)" value={form.instructions} onChange={set('instructions')} multiline maxLength={4000} />
    </ActionDialog>}
    {inviteGroup && <ActionDialog title={`Private invite · ${inviteGroup.name}`} description={inviteGroup.has_invite_link ? 'An encrypted invite is configured. Enter a replacement; leave blank to remove it. Existing links are revealed only during an approved applicant handoff.' : 'Set an optional private WhatsApp group invite. It is stored encrypted and used only in administrator handoffs.'}
      onClose={() => setInviteGroup(null)} onDone={refresh} onConfirm={() => api.put(`groups/${inviteGroup.id}/invite-link`, { inviteLink: invite || null })} label={invite ? 'Save private invite' : inviteGroup.has_invite_link ? 'Remove invite' : 'Save'} danger={!invite && Boolean(inviteGroup.has_invite_link)}>
      <Field label="WhatsApp group invite" type="url" value={invite} onChange={setInvite} placeholder="https://chat.whatsapp.com/…" maxLength={512} autoComplete="off" />
    </ActionDialog>}
    {archive && <ActionDialog title={`Archive ${archive.name}?`} description="This closes applications and removes the group from the public listing. Existing history is preserved." danger onClose={() => setArchive(null)} onDone={refresh} label="Archive group" onConfirm={() => api.patch(`groups/${archive.id}`, { status: 'ARCHIVED', accepting_applications: false })} />}
  </>
}
