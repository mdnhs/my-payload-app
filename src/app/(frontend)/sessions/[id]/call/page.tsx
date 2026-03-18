'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// SRS FR-28: Google STUN server
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

interface SessionData {
  id: string
  topic: string
  status: string
  duration: number
  scheduledAt: string
  mentorUser: string | { id: string }
  menteeUser: string | { id: string }
}

const css = `
  .call-page {
    min-height: calc(100vh - 68px);
    display: flex;
    flex-direction: column;
    background: #080808;
  }

  .call-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.02);
    flex-shrink: 0;
  }

  .call-back {
    display: inline-flex; align-items: center; gap: 6px;
    text-decoration: none;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.8rem; font-weight: 600;
    color: rgba(245,245,245,0.4);
    transition: color 0.18s; flex-shrink: 0;
  }
  .call-back:hover { color: #C9FF47; }

  .call-header-info { flex: 1; min-width: 0; }

  .call-header-topic {
    font-family: var(--font-syne), sans-serif;
    font-weight: 700; font-size: 1rem;
    color: #F5F5F5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .call-header-meta {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.72rem; color: rgba(245,245,245,0.35);
    display: flex; gap: 10px; align-items: center;
  }

  .call-timer {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.88rem; font-weight: 700;
    color: #C9FF47; letter-spacing: 0.06em;
    flex-shrink: 0;
  }

  .call-timer.ending { color: #FF2D6E; animation: pulse 1s ease-in-out infinite; }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  .call-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    background: rgba(255,255,255,0.04);
    position: relative;
    min-height: 0;
  }

  .call-video-wrap {
    position: relative;
    background: #0d0d0d;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }

  .call-video {
    width: 100%; height: 100%;
    object-fit: cover;
  }

  .call-video-label {
    position: absolute; bottom: 14px; left: 14px;
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.75rem; font-weight: 600;
    color: rgba(245,245,245,0.7);
    background: rgba(0,0,0,0.55);
    border-radius: 8px; padding: 4px 10px;
  }

  .call-video-placeholder {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px;
  }

  .call-avatar-big {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, #C9FF47, #8BD924);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-syne), sans-serif;
    font-weight: 800; font-size: 1.6rem; color: #080808;
  }

  .call-placeholder-name {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.85rem; color: rgba(245,245,245,0.4);
  }

  .call-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 20px 24px;
    flex-shrink: 0;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .call-ctrl-btn {
    width: 52px; height: 52px;
    border-radius: 50%;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
    transition: all 0.2s;
  }

  .call-ctrl-btn.active {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
  }

  .call-ctrl-btn.active:hover { background: rgba(255,255,255,0.14); }

  .call-ctrl-btn.muted {
    background: rgba(255,45,110,0.15);
    border: 1px solid rgba(255,45,110,0.3);
  }

  .call-ctrl-btn.end-call {
    width: 60px; height: 60px; font-size: 1.5rem;
    background: #FF2D6E; border: none;
    box-shadow: 0 0 24px rgba(255,45,110,0.4);
  }

  .call-ctrl-btn.end-call:hover { background: #ff1a5e; transform: scale(1.06); }

  .call-status-box {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px;
    background: #080808;
  }

  .call-status-icon { font-size: 3rem; }

  .call-status-title {
    font-family: var(--font-syne), sans-serif;
    font-weight: 800; font-size: 1.4rem;
    color: #F5F5F5; text-align: center;
  }

  .call-status-sub {
    font-family: var(--font-dm-sans), sans-serif;
    font-size: 0.88rem; color: rgba(245,245,245,0.4);
    text-align: center; max-width: 400px; line-height: 1.6;
  }

  .call-start-btn {
    padding: 14px 36px;
    background: #C9FF47; border: none; border-radius: 100px;
    font-family: var(--font-dm-sans), sans-serif;
    font-weight: 700; font-size: 1rem; color: #080808;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 0 28px rgba(201,255,71,0.25);
  }

  .call-start-btn:hover:not(:disabled) {
    background: #D8FF60; transform: translateY(-2px);
    box-shadow: 0 0 44px rgba(201,255,71,0.4);
  }

  .call-start-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .call-spinner {
    width: 40px; height: 40px;
    border: 3px solid rgba(201,255,71,0.15);
    border-top-color: #C9FF47;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 680px) {
    .call-body { grid-template-columns: 1fr; }
  }
`

function formatCountdown(ms: number) {
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export default function CallPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: authSession, isPending: authLoading } = useSession()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'active' | 'ended' | 'blocked'>('idle')
  const [blockReason, setBlockReason] = useState('')
  const [audioMuted, setAudioMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const callStartRef = useRef<CallSession | null>(null)

  const userId = authSession?.user?.id

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSessionData(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [id])

  useEffect(() => {
    if (authLoading) return
    if (!authSession?.user) { router.push('/login'); return }
    fetchSession()
  }, [authLoading, authSession, fetchSession, router])

  // FR-26: enforce booking time window + FR-28: auto-end
  useEffect(() => {
    if (!sessionData) return

    // FR-25: only confirmed bookings
    if (sessionData.status !== 'confirmed') {
      setBlockReason('Video call is only available for confirmed bookings.')
      setCallState('blocked')
      return
    }

    const start = new Date(sessionData.scheduledAt).getTime()
    const end = start + sessionData.duration * 60 * 1000
    const now = Date.now()

    // FR-26: not yet started
    if (now < start) {
      setBlockReason(`Call will be available at ${new Date(start).toLocaleTimeString()}.`)
      setCallState('blocked')
      return
    }

    // FR-26: already ended
    if (now >= end) {
      setBlockReason('The session time has passed. This call is no longer available.')
      setCallState('ended')
      return
    }

    // Active window — start countdown
    setCountdown(end - now)
    timerRef.current = setInterval(() => {
      const remaining = end - Date.now()
      if (remaining <= 0) {
        setCountdown(0)
        if (timerRef.current) clearInterval(timerRef.current)
        // FR-28: auto end call
        endCall(true)
      } else {
        setCountdown(remaining)
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData])

  async function startCall() {
    if (!sessionData) return
    setCallState('connecting')

    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create RTCPeerConnection with Google STUN (SRS FR-27)
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pcRef.current = pc

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))

      // Display remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // Log ICE connection state
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallState('active')
        }
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          endCall(false)
        }
      }

      // Record call session start
      await fetch(`/api/sessions/${id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      }).catch(() => {/* ignore if route not available */})

      setCallState('active')
    } catch (err) {
      console.error('Failed to start call:', err)
      setCallState('blocked')
      setBlockReason('Could not access camera/microphone. Please check your permissions.')
    }
  }

  async function endCall(auto = false) {
    // Stop local tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current = null

    // Record call session end
    await fetch(`/api/sessions/${id}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    }).catch(() => {/* ignore */})

    setCallState('ended')
    if (auto) {
      // Brief delay then redirect back to sessions
      setTimeout(() => router.push('/sessions'), 3000)
    }
  }

  function toggleAudio() {
    if (!localStreamRef.current) return
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled })
    setAudioMuted((prev) => !prev)
  }

  function toggleVideo() {
    if (!localStreamRef.current) return
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled })
    setVideoOff((prev) => !prev)
  }

  if (loading || authLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="call-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="call-spinner" />
        </div>
      </>
    )
  }

  if (!sessionData) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="call-page" style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: '2.5rem' }}>404</div>
          <p style={{ fontFamily: 'var(--font-dm-sans),sans-serif', color: 'rgba(245,245,245,0.4)' }}>Session not found</p>
          <Link href="/sessions" style={{ color: '#C9FF47', fontWeight: 700, textDecoration: 'none' }}>Back to sessions</Link>
        </div>
      </>
    )
  }

  const mentorUserId = typeof sessionData.mentorUser === 'string' ? sessionData.mentorUser : sessionData.mentorUser?.id
  const isMentor = userId === mentorUserId

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="call-page">
        {/* Header */}
        <div className="call-header">
          <Link href="/sessions" className="call-back">← Back</Link>
          <div className="call-header-info">
            <div className="call-header-topic">{sessionData.topic}</div>
            <div className="call-header-meta">
              <span>{sessionData.duration} min</span>
              <span>{new Date(sessionData.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          </div>
          {callState === 'active' && countdown > 0 && (
            <div className={`call-timer${countdown < 5 * 60 * 1000 ? ' ending' : ''}`}>
              {formatCountdown(countdown)} left
            </div>
          )}
        </div>

        {/* Video area */}
        <div className="call-body" style={{ position: 'relative' }}>
          {/* Blocked / ended overlay */}
          {(callState === 'blocked' || callState === 'ended') && (
            <div className="call-status-box">
              <div className="call-status-icon">
                {callState === 'ended' ? '📞' : '🔒'}
              </div>
              <div className="call-status-title">
                {callState === 'ended' ? 'Call Ended' : 'Call Unavailable'}
              </div>
              <div className="call-status-sub">{blockReason || 'This call has ended.'}</div>
              <Link href="/sessions" style={{ color: '#C9FF47', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-dm-sans),sans-serif', fontSize: '0.88rem', marginTop: 8 }}>
                Back to sessions →
              </Link>
            </div>
          )}

          {/* Pre-call / connecting state */}
          {(callState === 'idle' || callState === 'connecting') && (
            <div className="call-status-box">
              {callState === 'connecting' ? (
                <div className="call-spinner" />
              ) : (
                <div className="call-status-icon">📹</div>
              )}
              <div className="call-status-title">
                {callState === 'connecting' ? 'Connecting...' : 'Ready to call?'}
              </div>
              <div className="call-status-sub">
                {callState === 'idle'
                  ? `${sessionData.duration}-min session. Time remaining: ${formatCountdown(countdown)}`
                  : 'Setting up your camera and microphone...'}
              </div>
              {callState === 'idle' && (
                <button className="call-start-btn" onClick={startCall}>
                  Start Video Call
                </button>
              )}
            </div>
          )}

          {/* Active call videos */}
          {callState === 'active' && (
            <>
              <div className="call-video-wrap">
                <video
                  ref={remoteVideoRef}
                  className="call-video"
                  autoPlay
                  playsInline
                  style={{ display: 'block' }}
                />
                <div className="call-video-label">{isMentor ? 'Student' : 'Mentor'}</div>
                <div className="call-video-placeholder" style={{ position: 'absolute', display: 'none' }}>
                  <div className="call-avatar-big">?</div>
                </div>
              </div>

              <div className="call-video-wrap">
                <video
                  ref={localVideoRef}
                  className="call-video"
                  autoPlay
                  playsInline
                  muted
                  style={{ display: 'block', transform: 'scaleX(-1)' }}
                />
                <div className="call-video-label">You</div>
              </div>
            </>
          )}
        </div>

        {/* Controls — only shown during active call */}
        {callState === 'active' && (
          <div className="call-controls">
            <button
              className={`call-ctrl-btn ${audioMuted ? 'muted' : 'active'}`}
              onClick={toggleAudio}
              title={audioMuted ? 'Unmute' : 'Mute'}
            >
              {audioMuted ? '🔇' : '🎤'}
            </button>
            <button
              className={`call-ctrl-btn ${videoOff ? 'muted' : 'active'}`}
              onClick={toggleVideo}
              title={videoOff ? 'Camera on' : 'Camera off'}
            >
              {videoOff ? '📵' : '📷'}
            </button>
            <button
              className="call-ctrl-btn end-call"
              onClick={() => endCall(false)}
              title="End call"
            >
              📵
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// Local type to avoid TS unused error
type CallSession = null
