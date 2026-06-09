import { useState, useRef, useEffect } from 'react'
import { profile } from './data.js'

const firstName = profile.name.split(' ')[0]

const SUGGESTIONS = [
  'What do you do?',
  'Tell me about your test automation experience',
  'How do you use AI in testing?',
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm ${firstName}'s AI assistant. Ask me anything about ${firstName}'s experience, skills, or projects.`,
    },
  ])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

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
        // Drop the canned greeting; send only the real conversation.
        body: JSON.stringify({ messages: history.slice(1) }),
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
          content: `Sorry — I couldn't reach the assistant just now. Feel free to email ${profile.email}.`,
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
            <div>
              <strong>Ask {firstName}'s AI</strong>
            </div>
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
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading}>{s}</button>
              ))}
            </div>
          )}

          <div className="chat-input">
            <textarea
              rows={1}
              value={input}
              placeholder="Type your question…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}
