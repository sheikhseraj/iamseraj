import { useState, useRef, useEffect } from 'react'
import { profile, ui } from './data.js'
import { useLang } from './lang.js'

export default function ChatWidget() {
  const { lang } = useLang()
  const t = ui[lang].chat
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', content: t.greeting }])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  // Reset the greeting when the language changes (only if the chat is fresh).
  useEffect(() => {
    setMessages((prev) => (prev.length <= 1 ? [{ role: 'assistant', content: t.greeting }] : prev))
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  async function send(text) {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setInput('')

    const history = [...messages, { role: 'user', content: question }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(1), lang }),
      })
      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: acc }
          return next
        })
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          content: `${lang === 'de' ? 'Entschuldigung — ich konnte den Assistenten gerade nicht erreichen. Schreiben Sie mir gern an' : "Sorry — I couldn't reach the assistant just now. Feel free to email"} ${profile.email}.`,
        }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <button
        className={`chat-fab ${open ? 'chat-fab--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Ask my AI assistant'}
      >
        {open ? '×' : '💬'}
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="AI assistant chat">
          <div className="chat-header">
            <div><strong>{t.title}</strong></div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                {m.content || (loading && i === messages.length - 1 ? <span className="chat-typing">•••</span> : '')}
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="chat-suggestions">
              {t.suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading}>{s}</button>
              ))}
            </div>
          )}

          <div className="chat-input">
            <textarea
              rows={1}
              value={input}
              placeholder={t.placeholder}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}>{t.send}</button>
          </div>
        </div>
      )}
    </>
  )
}
