import { createContext, useContext, useEffect, useId, useRef, useState, useCallback } from 'react'

export const CommunityContext = createContext(null)
export const useCommunity = () => useContext(CommunityContext)
export function useResource(path) {
  const { api } = useCommunity(), [revision, setRevision] = useState(0)
  const [state, setState] = useState({ data: null, loading: true, error: null })
  useEffect(() => {
    const controller = new AbortController()
    setState({ data: null, loading: true, error: null })
    api.get(path, controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ data, loading: false, error: null })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ data: null, loading: false, error })
    })
    return () => controller.abort()
  }, [api, path, revision])
  const reload = useCallback(() => setRevision(value => value + 1), [])
  return { ...state, reload }
}
export function pretty(value) { return String(value ?? '').toLowerCase().replaceAll('_', ' ').replace(/^\w/, char => char.toUpperCase()) }
export function date(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
export function Badge({ value }) {
  const good = ['ACTIVE','APPROVED','APPROVE','RESOLVED','COMPLETED'].includes(value)
  const bad = ['BLOCKED','REJECTED','REJECT','URGENT','FINAL_WARNING','REMOVAL_RECOMMENDED'].includes(value)
  return <span className={`community-badge ${good ? 'is-good' : bad ? 'is-bad' : 'is-neutral'}`}>{pretty(value) || '—'}</span>
}
export function Risk({ score }) {
  const { settings } = useCommunity()
  if (score === null || score === undefined) return <span className="text-muted">Not screened</span>
  const tone = score <= (settings?.low_risk_threshold ?? 30) ? 'good' : score > (settings?.high_risk_threshold ?? 60) ? 'bad' : 'review'
  return <span className={`community-badge is-${tone}`}>{score}/100 · {tone === 'good' ? 'Low risk' : tone === 'bad' ? 'High risk' : 'Review'}</span>
}
export function Notice({ error, success, onRetry }) {
  if (!error && !success) return null
  return <div className={error ? 'error-message' : 'success-message'} role={error ? 'alert' : 'status'}>
    {error?.message || success}{error && onRetry && <button className="btn-edit" onClick={onRetry}>Try again</button>}
  </div>
}
export function Loading() { return <p className="loading" role="status">Loading community records…</p> }
export function Field({ label, value, onChange, options, multiline, hint, ...props }) {
  const fieldId = useId(), hintId = `${fieldId}-hint`
  return <div className="form-group"><label htmlFor={fieldId}>{label}</label>
    {options ? <select id={fieldId} value={value ?? ''} onChange={event => onChange(event.target.value)} aria-describedby={hint ? hintId : undefined} {...props}>
      {options.map(option => { const [key, title] = Array.isArray(option) ? option : [option, pretty(option)]; return <option key={key} value={key}>{title}</option> })}
    </select> : multiline ? <textarea id={fieldId} value={value ?? ''} onChange={event => onChange(event.target.value)} aria-describedby={hint ? hintId : undefined} {...props} />
      : <input id={fieldId} value={value ?? ''} onChange={event => onChange(event.target.value)} aria-describedby={hint ? hintId : undefined} {...props} />}
    {hint && <small id={hintId} className="text-muted">{hint}</small>}
  </div>
}
export function Toggle({ label, checked, onChange, hint, disabled }) {
  return <label className="community-toggle"><input type="checkbox" checked={Boolean(checked)} onChange={event => onChange(event.target.checked)} disabled={disabled} /><span>{label}{hint && <small>{hint}</small>}</span></label>
}
export function Table({ columns, items, empty = 'No records found.', caption }) {
  if (!items?.length) return <p className="empty-state">{empty}</p>
  return <div className="community-table-scroll" tabIndex={0} role="region" aria-label={caption}><table className="community-table">
    <caption className="community-sr-only">{caption}</caption><thead><tr>{columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
    <tbody>{items.map(item => <tr key={item.id}>{columns.map(column => <td key={column.key}>{column.render ? column.render(item) : item[column.key] ?? '—'}</td>)}</tr>)}</tbody>
  </table></div>
}
export function Pagination({ data, page, setPage }) {
  const pages = Math.max(1, Math.ceil(data.total / data.limit))
  return <div className="community-pagination"><span>{data.total} records · Page {page} of {pages}</span><div className="item-actions">
    <button className="btn-edit" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
    <button className="btn-edit" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
  </div></div>
}
export function RecordList({ resource, columns, filters = {}, empty, reloadKey = 0 }) {
  const [page, setPage] = useState(1), filterKey = JSON.stringify(filters)
  useEffect(() => { setPage(1) }, [filterKey])
  const query = new URLSearchParams(Object.entries({ ...filters, page, limit: 20 }).filter(([, value]) => value !== '' && value !== undefined && value !== null)).toString()
  const state = useResource(`${resource}?${query}&revision=${reloadKey}`)
  return <><Notice error={state.error} onRetry={state.reload} />{state.loading ? <Loading /> : state.data && <>
    <Table columns={columns} items={state.data.items} empty={empty} caption={pretty(resource)} /><Pagination data={state.data} page={page} setPage={setPage} />
  </>}</>
}
export function Dialog({ title, children, onClose }) {
  const dialog = useRef(null), titleId = useId()
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement
    if (element.showModal) element.showModal(); else element.setAttribute('open', '')
    const first = element.querySelector('input,textarea,select,button'); first?.focus()
    return () => { element.close?.(); if (previous?.isConnected) previous.focus() }
  }, [])
  return <dialog ref={dialog} className="community-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="community-dialog-header"><h3 id={titleId}>{title}</h3></div>{children}
  </dialog>
}
export function ActionDialog({ title, description, children, onClose, onConfirm, onDone, label = 'Confirm', danger = false }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(null)
  const submit = async event => {
    event.preventDefault(); if (busy) return
    setBusy(true); setError(null)
    try { await onConfirm(); onDone?.(); onClose() } catch (failure) { setError(failure); setBusy(false) }
  }
  return <Dialog title={title} onClose={() => { if (!busy) onClose() }}><form onSubmit={submit}>
    <p className="community-dialog-description">{description}</p><Notice error={error} /><fieldset disabled={busy}>{children}</fieldset>
    <div className="community-actions"><button type="button" className="btn-edit" disabled={busy} onClick={onClose}>Cancel</button>
      <button className={danger ? 'btn-delete' : 'btn-primary'} disabled={busy}>{busy ? 'Saving…' : label}</button></div>
  </form></Dialog>
}
export function GroupSelect({ value, onChange, optional = true, ...props }) {
  const { groups, groupsError } = useCommunity()
  return <Field label="Group" value={value} onChange={onChange} options={[["", optional ? 'All groups' : 'Select a group'], ...groups.map(group => [String(group.id), group.name])]} hint={groupsError ? 'Group choices could not be loaded. Refresh to try again.' : undefined} {...props} />
}
export function MemberSelect({ value, onChange, optional = false }) {
  const { api } = useCommunity(), [search, setSearch] = useState(''), [options, setOptions] = useState([]), [error, setError] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      api.get(`members?limit=20&search=${encodeURIComponent(search)}`, controller.signal).then(data => {
        if (!controller.signal.aborted) { setOptions(data.items.filter(member => !member.anonymized_at)); setError(null) }
      }).catch(failure => { if (!controller.signal.aborted) setError(failure) })
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [api, search])
  return <><Field label="Find a member by name" value={search} onChange={setSearch} maxLength={160} />
    <Field label="Member" value={value} onChange={onChange} required={!optional} options={[["", optional ? 'Unidentified member' : 'Select a member'],
      ...(value && !options.some(member => String(member.id) === String(value)) ? [[String(value), `Member #${value}`]] : []),
      ...options.map(member => [String(member.id), `${member.full_name || 'Member'} · ${member.normalized_phone || 'No phone'}`])]} />
    <Notice error={error} /></>
}
