import { useState, useRef, useEffect } from 'react'

export default function Chat({ messages, onSend }) {
  const [msg, setMsg]   = useState('')
  const bottomRef       = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (!msg.trim()) return
    onSend(msg)
    setMsg('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        💬 Chat
      </h3>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '8px 10px',
        background: 'var(--bg)', borderRadius: '8px',
        border: '1px solid var(--border)', marginBottom: '10px',
        minHeight: '140px', maxHeight: '240px',
      }}>
        {messages.length === 0 && (
          <p style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', marginTop: '24px' }}>
            No messages yet
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '5px', fontSize: '13px', lineHeight: '1.4' }}>
            {m.system ? (
              <span style={{ color: 'var(--text3)', fontStyle: 'italic', fontSize: '12px' }}>
                — {m.message}
              </span>
            ) : (
              <span>
                <strong style={{ color: 'var(--accent)', marginRight: '4px' }}>{m.from}:</strong>
                <span style={{ color: 'var(--text)' }}>{m.message}</span>
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '6px' }}>
        <input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Say something..."
          maxLength={200}
          style={{ flex: 1, padding: '8px 10px', fontSize: '13px' }}
        />
        <button type="submit" className="btn btn-primary"
          style={{ padding: '8px 12px', fontSize: '13px', flexShrink: 0 }}>
          Send
        </button>
      </form>
    </div>
  )
}
