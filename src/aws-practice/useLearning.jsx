import { useCallback, useEffect, useRef, useState } from 'react'
import { createProgressStore } from './progress-store.mjs'
import { accountRequest } from './account-api.mjs'

export function useLearning() {
  const guest = useRef(null)
  const channel = useRef(null)
  const identity = useRef(null)
  const revision = useRef(0)
  const [state, setState] = useState(null)
  const [account, setAccount] = useState(null)
  const [persistent, setPersistent] = useState(true)
  const [error, setError] = useState('')

  const accept = useCallback(async (snapshot, version, expireGuest = false) => {
    const next = snapshot.account ?? null
    const progress = next ? snapshot.progress : await (expireGuest
      ? guest.current?.dispatch({ type: 'expire' }) : guest.current?.read())
    if (version !== revision.current || !progress) return
    identity.current = next
    setAccount(next)
    setState(progress)
    setPersistent(Boolean(next || guest.current?.persistent))
  }, [])

  useEffect(() => {
    let disposed = false
    let instance
    let messaging
    const version = ++revision.current
    async function load() {
      try {
        const results = await Promise.all([
          createProgressStore(window.indexedDB),
          accountRequest('session').catch(() => ({ account: null })),
        ])
        instance = results[0]
        if (disposed) { instance.close(); return }
        guest.current = instance
        await accept(results[1], version, true)
        if (disposed || !window.BroadcastChannel) return
        messaging = new window.BroadcastChannel('portfolio-aws-practice-progress')
        channel.current = messaging
        messaging.onmessage = async ({ data }) => {
          const latest = revision.current
          try {
            if (data === 'guest' && !identity.current && instance.persistent) {
              await accept({ account: null }, latest)
            }
            if (data === 'auth' || (data === 'account' && identity.current)) {
              const snapshot = await accountRequest('session')
              if (!disposed) await accept(snapshot, latest)
            }
          } catch {
            if (!disposed && identity.current) setError('Could not refresh account progress from another tab.')
          }
        }
      } catch {
        if (!disposed) setError('The lab could not load your learning progress. Refresh to try again.')
      }
    }
    load()
    return () => {
      disposed = true
      revision.current++
      guest.current = null
      channel.current = null
      messaging?.close()
      instance?.close()
    }
  }, [accept])

  const sign = useCallback(async (route, body) => {
    if (!guest.current) throw new Error('The lab is still loading. Try again in a moment.')
    const version = ++revision.current
    const snapshot = await accountRequest(route, { method: 'POST', body })
    await accept(snapshot, version, route === 'logout')
    setError('')
    channel.current?.postMessage('auth')
    return snapshot.account
  }, [accept])

  const dispatch = useCallback(async action => {
    if (!guest.current) return null
    const current = identity.current
    const version = revision.current
    try {
      const progress = current
        ? (await accountRequest('progress', { method: 'POST', body: action, username: current.username })).progress
        : await guest.current.dispatch(action)
      if (version !== revision.current || current?.username !== identity.current?.username) return null
      setState(progress)
      setError('')
      channel.current?.postMessage(current ? 'account' : 'guest')
      return progress
    } catch (failure) {
      if (version !== revision.current) return null
      if (current && failure.status === 401) {
        try { await accept(await accountRequest('session'), version, true) }
        catch { /* Keep the account snapshot visible while the connection is down. */ }
      }
      if (version === revision.current) setError(current ? failure.message : 'Progress could not be saved. Try again before leaving this page.')
      return null
    }
  }, [accept])

  const readGuest = useCallback(() => guest.current?.read(), [])
  const exam = state?.sessions.exam
  useEffect(() => {
    if (!exam) return
    let busy = false
    let retryAfter = 0
    async function check() {
      const now = Date.now()
      if (busy || now < exam.deadline || now < retryAfter) return
      busy = true
      try { await dispatch({ type: 'expire' }) }
      finally { busy = false; retryAfter = Date.now() + 5000 }
    }
    check()
    const timer = window.setInterval(check, 1000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [exam?.id, exam?.deadline, account?.username, dispatch])

  return { state, dispatch, persistent, error, account, sign, readGuest }
}
