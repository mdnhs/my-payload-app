'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message {
  id: string
  sender: string
  senderName: string
  content: string
  createdAt: string
}

interface SessionData {
  id: string
  topic: string
  status: string
  duration: number
  scheduledAt: string
  mentorUser: string | { id: string }
  menteeUser: string | { id: string }
  mentor: string | { id: string; user?: string | { name?: string } }
  mentee: string | { id: string; user?: string | { name?: string } }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'pending': return { background: 'rgba(255,169,77,0.1)', border: '1px solid rgba(255,169,77,0.25)', color: '#FFA94D' }
    case 'confirmed': return { background: 'rgba(201,255,71,0.1)', border: '1px solid rgba(201,255,71,0.25)', color: '#C9FF47' }
    case 'completed': return { background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }
    case 'cancelled': return { background: 'rgba(255,45,110,0.1)', border: '1px solid rgba(255,45,110,0.2)', color: '#FF2D6E' }
    default: return {}
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const css = `
  .chat-page {
    min-height: calc(100vh - 68px);
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.02);
    flex-shrink: 0;
  }

  .chat-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(245,245,245,0.4);
    transition: color 0.18s;
    flex-shrink: 0;
  }

  .chat-back:hover { color: #C9FF47; }

  .chat-header-info {
    flex: 1;
    min-width: 0;
  }

  .chat-header-topic {
    font-family: var(--font-syne), sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #F5F5F5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-header-meta {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem;
    color: rgba(245,245,245,0.35);
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .chat-status-pill {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 12px;
    border-radius: 100px;
    flex-shrink: 0;
  }

  .chat-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .chat-action-btn {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 100px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .chat-action-confirm {
    background: #C9FF47;
    color: #080808;
  }

  .chat-action-confirm:hover { opacity: 0.88; }

  .chat-action-complete {
    background: #00E5FF;
    color: #080808;
  }

  .chat-action-complete:hover { opacity: 0.88; }

  .chat-action-cancel {
    background: transparent;
    border: 1px solid rgba(255,45,110,0.3);
    color: rgba(255,45,110,0.7);
  }

  .chat-action-cancel:hover {
    border-color: #FF2D6E;
    color: #FF2D6E;
    background: rgba(255,45,110,0.06);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chat-msg {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.88rem;
    line-height: 1.55;
    color: #F5F5F5;
    position: relative;
    animation: msg-in 0.2s ease-out both;
  }

  @keyframes msg-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .chat-msg.mine {
    align-self: flex-end;
    background: rgba(201,255,71,0.1);
    border: 1px solid rgba(201,255,71,0.2);
    border-bottom-right-radius: 4px;
  }

  .chat-msg.theirs {
    align-self: flex-start;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-bottom-left-radius: 4px;
  }

  .chat-msg-sender {
    font-size: 0.7rem;
    font-weight: 700;
    color: rgba(245,245,245,0.4);
    margin-bottom: 4px;
    letter-spacing: 0.03em;
  }

  .chat-msg.mine .chat-msg-sender {
    color: rgba(201,255,71,0.5);
  }

  .chat-msg-time {
    font-size: 0.65rem;
    color: rgba(245,245,245,0.2);
    margin-top: 4px;
    text-align: right;
  }

  .chat-input-bar {
    display: flex;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.02);
    flex-shrink: 0;
  }

  .chat-input {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    padding: 12px 16px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.9rem;
    color: #F5F5F5;
    outline: none;
    transition: border-color 0.2s;
  }

  .chat-input:focus {
    border-color: rgba(201,255,71,0.5);
  }

  .chat-input::placeholder {
    color: rgba(245,245,245,0.18);
  }

  .chat-send-btn {
    padding: 12px 24px;
    background: #C9FF47;
    border: none;
    border-radius: 14px;
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 700;
    font-size: 0.88rem;
    color: #080808;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .chat-send-btn:hover:not(:disabled) {
    background: #D8FF60;
  }

  .chat-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .chat-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: rgba(245,245,245,0.25);
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.9rem;
  }

  .chat-empty-icon {
    font-size: 2.5rem;
    opacity: 0.5;
  }

  .chat-loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chat-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(201,255,71,0.15);
    border-top-color: #C9FF47;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .chat-ended-bar {
    padding: 14px 24px;
    text-align: center;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.85rem;
    color: rgba(245,245,245,0.4);
    border-top: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.02);
  }

  @media (max-width: 640px) {
    .chat-msg { max-width: 85%; }
    .chat-actions { flex-wrap: wrap; }
    .chat-header { flex-wrap: wrap; }
  }
`

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: authSession, isPending: authLoading } = useSession()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const userId = authSession?.user?.id

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch { /* ignore */ }
  }, [id])

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSessionData(data)
      }
    } catch { /* ignore */ }
  }, [id])

  useEffect(() => {
    if (authLoading) return
    if (!authSession?.user) {
      router.push('/login')
      return
    }
    Promise.all([fetchSession(), fetchMessages()]).then(() => setLoading(false))
    pollRef.current = setInterval(fetchMessages, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [authLoading, authSession, fetchSession, fetchMessages, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/sessions/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages((prev) => [...prev, msg])
        setNewMsg('')
      }
    } catch { /* ignore */ }
    setSending(false)
  }

  async function updateStatus(status: string) {
    setActionLoading(status)
    try {
      const res = await fetch(`/api/sessions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await fetchSession()
      }
    } catch { /* ignore */ }
    setActionLoading('')
  }

  const mentorUserId = sessionData
    ? typeof sessionData.mentorUser === 'string' ? sessionData.mentorUser : sessionData.mentorUser?.id
    : null
  const isMentor = userId === mentorUserId
  // FR-20: chat only for confirmed sessions; FR-24: only within booking time window
  const isConfirmed = sessionData?.status === 'confirmed'
  const sessionStart = sessionData ? new Date(sessionData.scheduledAt).getTime() : 0
  const sessionEnd = sessionData ? sessionStart + sessionData.duration * 60 * 1000 : 0
  const now = Date.now()
  const withinWindow = now >= sessionStart && now <= sessionEnd
  const canSendMessage = isConfirmed && withinWindow
  const isActive = sessionData && !['cancelled', 'completed'].includes(sessionData.status)

  if (loading || authLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="chat-page">
          <div className="chat-loading"><div className="chat-spinner" /></div>
        </div>
      </>
    )
  }

  if (!sessionData) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="chat-page">
          <div className="chat-empty">
            <div className="chat-empty-icon">404</div>
            <p>Session not found</p>
            <Link href="/sessions" style={{ color: '#C9FF47', fontWeight: 700, textDecoration: 'none' }}>Back to sessions</Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="chat-page">
        {/* Header */}
        <div className="chat-header">
          <Link href="/sessions" className="chat-back">← Back</Link>
          <div className="chat-header-info">
            <div className="chat-header-topic">{sessionData.topic}</div>
            <div className="chat-header-meta">
              <span>{sessionData.duration} min</span>
              <span>{new Date(sessionData.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          </div>
          <span className="chat-status-pill" style={getStatusStyle(sessionData.status)}>
            {sessionData.status}
          </span>
          <div className="chat-actions">
            {isMentor && sessionData.status === 'pending' && (
              <button
                className="chat-action-btn chat-action-confirm"
                onClick={() => updateStatus('awaiting_payment')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'awaiting_payment' ? '...' : 'Accept'}
              </button>
            )}
            {isMentor && sessionData.status === 'confirmed' && (
              <button
                className="chat-action-btn chat-action-complete"
                onClick={() => updateStatus('completed')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'completed' ? '...' : 'Complete'}
              </button>
            )}
            {isActive && (
              <button
                className="chat-action-btn chat-action-cancel"
                onClick={() => updateStatus('cancelled')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'cancelled' ? '...' : 'Cancel'}
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <p>No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-msg ${msg.sender === userId ? 'mine' : 'theirs'}`}
              >
                <div className="chat-msg-sender">{msg.senderName}</div>
                <div>{msg.content}</div>
                <div className="chat-msg-time">{formatTime(msg.createdAt)}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input or status bar */}
        {canSendMessage ? (
          <form className="chat-input-bar" onSubmit={sendMessage}>
            <input
              className="chat-input"
              type="text"
              placeholder="Type a message..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              autoFocus
            />
            <button
              className="chat-send-btn"
              type="submit"
              disabled={!newMsg.trim() || sending}
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        ) : isConfirmed && !withinWindow ? (
          <div className="chat-ended-bar">
            {now < sessionStart
              ? `Chat opens at ${new Date(sessionStart).toLocaleTimeString()}.`
              : 'Chat window closed — session time has passed. Messages are read-only.'}
          </div>
        ) : !isActive ? (
          <div className="chat-ended-bar">
            This session has been {sessionData.status}. Messages are read-only.
          </div>
        ) : (
          <div className="chat-ended-bar">
            Chat is only available for confirmed bookings.
          </div>
        )}
      </div>
    </>
  )
}
