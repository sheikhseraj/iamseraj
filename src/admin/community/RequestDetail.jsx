import { useState } from 'react'
import { useCommunity, useResource, Notice, Loading, Badge, Risk, date, Field, ActionDialog, Table, pretty } from './components.jsx'

export default function RequestDetail({ requestId }) {
  const { api, navigate, groups } = useCommunity(), state = useResource(`join-requests/${requestId}`)
  const [action, setAction] = useState(null), [reason, setReason] = useState(''), [handoff, setHandoff] = useState(null)
  const [error, setError] = useState(null), [success, setSuccess] = useState(''), [busy, setBusy] = useState(false)
  const refresh = () => { state.reload(); setSuccess('Changes saved.'); setHandoff(null) }
  const run = async task => { setBusy(true); setError(null); try { await task() } catch (failure) { setError(failure) } finally { setBusy(false) } }
  const openAction = value => { setReason(''); setAction(value) }
  const data = state.data, latest = data?.assessments?.[0], blocked = data?.blocks?.some(block => !block.unblocked_at)
  const undecided = data && ['PENDING','REVIEW'].includes(data.status)
  return <><button className="community-link" onClick={() => navigate('requests')}>← All join requests</button><Notice error={state.error || error} onRetry={state.reload} success={success} />
    {state.loading ? <Loading /> : data && <>
      <div className="manager-header"><div><h3>Request #{data.id} · {data.full_name || 'Anonymized applicant'}</h3><p className="text-muted">Submitted {date(data.created_at)}</p></div><Badge value={data.status} /></div>
      {blocked && <p className="error-message" role="alert">This member has an active block. Review the history and resolve the block before approval.</p>}
      <dl className="community-details"><div><dt>WhatsApp number</dt><dd>{data.normalized_phone || 'Anonymized'}</dd></div><div><dt>City</dt><dd>{data.city || '—'}</dd></div>
        <div><dt>Requested group</dt><dd>{groups.find(group => group.id === data.group_id)?.name || `Group #${data.group_id}`}</dd></div>
        <div><dt>How they heard about us</dt><dd>{data.referral_source || 'Not provided'}</dd></div><div><dt>Rules acknowledged</dt><dd>Version {data.rules_version} · {date(data.rules_accepted_at)}</dd></div>
        <div><dt>Privacy acknowledged</dt><dd>Version {data.privacy_version} · {date(data.privacy_accepted_at)}</dd></div></dl>
      <h4 className="community-section-title">Reason for joining</h4><p className="community-quote">{data.reason || 'Anonymized'}</p>
      <h4 className="community-section-title">Screening recommendation</h4>{latest ? <div className="community-assessment"><Risk score={latest.risk_score} /><Badge value={latest.recommendation} />
        <ul>{latest.reasons.map((item, index) => <li key={index}>{item}</li>)}</ul><p className="text-muted">{latest.screening_version} · {date(latest.screened_at)}</p></div> : <p className="text-muted">No assessment recorded.</p>}
      <div className="community-actions">{undecided && <>
        <button className="btn-primary" disabled={blocked || busy} onClick={() => openAction('APPROVED')}>Approve</button>
        <button className="btn-delete" disabled={busy} onClick={() => openAction('REJECTED')}>Reject</button>
        <button className="btn-edit" disabled={busy} onClick={() => openAction('REVIEW')}>Mark for review</button>
        <button className="btn-edit" disabled={busy} onClick={() => run(async () => { await api.post(`join-requests/${requestId}/rescreen`, {}); refresh() })}>Run screening again</button>
      </>}<button className="btn-edit" onClick={() => openAction('NOTE')}>Add internal note</button><button className="community-link" onClick={() => navigate('members', { memberId: data.member_id })}>View member →</button></div>
      {data.decision_reason && <p className="community-quote">Decision note: {data.decision_reason}</p>}
      {data.status === 'APPROVED' && <div className="community-handoff"><h4>WhatsApp handoff</h4><p>Contact the applicant manually. Record admission after you add them in WhatsApp.</p>
        <Badge value={data.handoff_status} /><div className="community-actions"><button className="btn-edit" disabled={blocked || busy} onClick={() => run(async () => setHandoff(await api.get(`join-requests/${requestId}/handoff`)))}>Show private handoff</button>
          {data.handoff_status === 'PENDING' && <button className="btn-primary" disabled={blocked || busy} onClick={() => openAction('ADMITTED')}>Confirm admission</button>}</div>
        {handoff && <><p className="community-quote">{handoff.instructions}</p>{handoff.inviteLink && <p><a className="community-link" href={handoff.inviteLink} target="_blank" rel="noreferrer">Open private WhatsApp invite ↗</a></p>}
          {/^\+[1-9]\d{7,14}$/.test(handoff.phone || '') && <a className="community-link" href={`https://wa.me/${handoff.phone.slice(1)}`} target="_blank" rel="noreferrer">Contact applicant in WhatsApp ↗</a>}
          <button className="btn-edit" onClick={() => setHandoff(null)}>Hide private details</button></>}
      </div>}
      <h4 className="community-section-title">Request history</h4><Table caption="Applicant request history" items={data.requests} columns={[
        { key: 'id', label: 'Request', render: item => <button className="community-link" onClick={() => navigate('requests', { requestId: item.id })}>#{item.id}</button> },
        { key: 'group_id', label: 'Group', render: item => groups.find(group => group.id === item.group_id)?.name || `Group #${item.group_id}` }, { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> },
        { key: 'created_at', label: 'Submitted', render: item => date(item.created_at) }
      ]} />
      <h4 className="community-section-title">Membership history</h4><Table caption="Applicant membership history" items={data.memberships} columns={[
        { key: 'group_id', label: 'Group', render: item => groups.find(group => group.id === item.group_id)?.name || `Group #${item.group_id}` },
        { key: 'status', label: 'Status', render: item => <Badge value={item.status} /> }, { key: 'joined_at', label: 'Recorded admission', render: item => date(item.joined_at) }
      ]} empty="No previous memberships recorded." />
      <div className="community-two-column"><div><h4 className="community-section-title">Warnings</h4>{data.warnings.length ? data.warnings.map(item => <div key={item.id} className="community-history"><Badge value={item.level} /><p>{item.reason || 'No retained reason'}</p><small>{date(item.issued_at)} · {pretty(item.status)}</small></div>) : <p className="empty-state">No warnings.</p>}</div>
        <div><h4 className="community-section-title">Reports</h4>{data.reports.length ? data.reports.map(item => <div key={item.id} className="community-history"><Badge value={item.status} /><p>{pretty(item.category)} · {item.description}</p></div>) : <p className="empty-state">No reports.</p>}</div></div>
      <h4 className="community-section-title">Block history</h4>{data.blocks.length ? data.blocks.map(item => <div key={item.id} className="community-history"><Badge value={item.unblocked_at ? 'RESOLVED' : 'BLOCKED'} /><p>{item.reason}</p><small>{date(item.blocked_at)}</small></div>) : <p className="empty-state">No recorded blocks.</p>}
      <h4 className="community-section-title">Internal notes</h4>{data.notes.length ? data.notes.map(item => <div className="community-history" key={item.id}><p>{item.body || 'Anonymized note'}</p><small>{pretty(item.actor_kind)} · {date(item.created_at)}</small></div>) : <p className="empty-state">No internal notes.</p>}
      <details className="community-history"><summary>Screening history ({data.assessments.length})</summary>{data.assessments.map(item => <div key={item.id}><Risk score={item.risk_score} /><Badge value={item.recommendation} /><p>{item.reasons.join(' ')}</p><small>{item.screening_version} · {date(item.screened_at)}</small></div>)}</details>
      <h4 className="community-section-title">Audit history</h4><Table caption="Request audit history" items={data.audit} columns={[
        { key: 'action', label: 'Action', render: item => pretty(item.action) }, { key: 'actor_kind', label: 'Actor', render: item => pretty(item.actor_kind) }, { key: 'created_at', label: 'Time', render: item => date(item.created_at) }
      ]} />
    </>}
    {action && <ActionDialog title={action === 'NOTE' ? 'Add internal note' : action === 'ADMITTED' ? 'Confirm WhatsApp admission' : `${pretty(action)} request #${requestId}`} danger={action === 'REJECTED'} label={action === 'NOTE' ? 'Save note' : action === 'ADMITTED' ? 'Confirm admission' : 'Save decision'}
      description={action === 'NOTE' ? 'This note is visible only to administrators.' : action === 'ADMITTED' ? 'Confirm that you have admitted this applicant in WhatsApp. This records membership here.' : action === 'APPROVED' ? 'Approval starts a manual WhatsApp handoff. Membership remains pending until you confirm admission.' : action === 'REJECTED' ? 'This is a final decision. Contact the applicant manually with neutral wording.' : 'Keep this application open for a human review.'}
      onClose={() => setAction(null)} onDone={refresh} onConfirm={() => action === 'NOTE' ? api.post('notes', { requestId: Number(requestId), body: reason }) : action === 'ADMITTED' ? api.post(`join-requests/${requestId}/handoff-complete`, { admissionConfirmed: true }) : api.post(`join-requests/${requestId}/decision`, { status: action, reason })}>
      {action !== 'ADMITTED' && <Field label={action === 'NOTE' ? 'Internal note' : 'Internal decision reason (optional)'} value={reason} onChange={setReason} multiline maxLength={action === 'NOTE' ? 4000 : 2000} required={action === 'NOTE'} />}
    </ActionDialog>}
  </>
}
