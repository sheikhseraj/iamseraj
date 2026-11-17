import { useEffect, useState } from 'react'
import { useCommunity, Dialog, Field, Notice, pretty } from './components.jsx'

export default function SearchDialog({ initialSearch, onClose }) {
  const { api, navigate } = useCommunity(), [search, setSearch] = useState(initialSearch), [results, setResults] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false)
  useEffect(() => {
    const term = search.trim(), controller = new AbortController()
    if (!term) { setResults(null); setBusy(false); return () => controller.abort() }
    setBusy(true)
    const timer = setTimeout(async () => {
      try {
        const collections = await Promise.all(['members','groups','join-requests'].map(resource => api.get(`${resource}?limit=5&search=${encodeURIComponent(term)}`, controller.signal)))
        if (!controller.signal.aborted) { setResults(collections); setError(null) }
      } catch (failure) { if (!controller.signal.aborted) setError(failure) }
      finally { if (!controller.signal.aborted) setBusy(false) }
    }, 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [api, search])
  const open = (view, extra) => { navigate(view, extra); onClose() }
  return <Dialog title="Search community" onClose={onClose}><Field label="Search members, groups and requests" value={search} onChange={setSearch} maxLength={160} autoComplete="off" /><Notice error={error} />
    {busy ? <p role="status" className="text-muted">Searching…</p> : results && results.map((collection, index) => <div key={index}><h4 className="community-section-title">{['Members','Groups','Join requests'][index]}</h4>
      {collection.items.length ? collection.items.map(item => <button className="community-search-result" key={item.id} onClick={() => open(index === 0 ? 'members' : index === 1 ? 'groups' : 'requests', index === 0 ? { memberId: item.id } : index === 2 ? { requestId: item.id } : {})}>
        <strong>{item.full_name || item.name || `Record #${item.id}`}</strong><small>{item.city} · {pretty(item.status)}</small></button>) : <p className="text-muted">No matches.</p>}
    </div>)}<div className="community-actions"><button className="btn-edit" onClick={onClose}>Close</button></div>
  </Dialog>
}
