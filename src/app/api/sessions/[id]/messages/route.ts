import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// Helper: check if a participant can chat right now
// FR-20: only confirmed bookings
// FR-24: only within booking time window (scheduledAt → scheduledAt + duration)
function canChat(sess: { status: string; scheduledAt: string; duration: number }): { ok: boolean; reason?: string } {
  if (sess.status !== 'confirmed') {
    return { ok: false, reason: 'Chat is only available for confirmed bookings.' }
  }
  const start = new Date(sess.scheduledAt).getTime()
  const end = start + sess.duration * 60 * 1000
  const now = Date.now()
  if (now < start) {
    return { ok: false, reason: 'Chat is not available yet — the session has not started.' }
  }
  if (now > end) {
    return { ok: false, reason: 'Chat window has closed — the session time has passed.' }
  }
  return { ok: true }
}

// GET /api/sessions/[id]/messages — get all messages for a session (read allowed after session too)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  const sess = await payload.findByID({
    collection: 'sessions',
    id,
    depth: 0,
    overrideAccess: true,
  })

  if (!sess) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // FR-20: only confirmed (or completed) sessions can view messages
  if (!['confirmed', 'completed'].includes(sess.status as string)) {
    return NextResponse.json(
      { error: 'Messages are only available for confirmed or completed sessions.' },
      { status: 403 },
    )
  }

  const mentorUserId = typeof sess.mentorUser === 'string' ? sess.mentorUser : sess.mentorUser
  const menteeUserId = typeof sess.menteeUser === 'string' ? sess.menteeUser : sess.menteeUser

  if (session.user.id !== mentorUserId && session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = await payload.find({
    collection: 'messages',
    where: { session: { equals: id } },
    sort: 'createdAt',
    limit: 200,
    overrideAccess: true,
  })

  return NextResponse.json(messages.docs)
}

// POST /api/sessions/[id]/messages — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { content } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  const sess = await payload.findByID({
    collection: 'sessions',
    id,
    depth: 0,
    overrideAccess: true,
  })

  if (!sess) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const mentorUserId = typeof sess.mentorUser === 'string' ? sess.mentorUser : sess.mentorUser
  const menteeUserId = typeof sess.menteeUser === 'string' ? sess.menteeUser : sess.menteeUser

  if (session.user.id !== mentorUserId && session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // FR-20 + FR-24: can only send messages in confirmed sessions within booking window
  const chatCheck = canChat({
    status: sess.status as string,
    scheduledAt: sess.scheduledAt as string,
    duration: sess.duration as number,
  })

  if (!chatCheck.ok) {
    return NextResponse.json({ error: chatCheck.reason }, { status: 403 })
  }

  const message = await payload.create({
    collection: 'messages',
    overrideAccess: true,
    data: {
      session: id,
      sender: session.user.id,
      senderName: session.user.name || 'User',
      content: content.trim(),
    },
  })

  return NextResponse.json(message)
}
