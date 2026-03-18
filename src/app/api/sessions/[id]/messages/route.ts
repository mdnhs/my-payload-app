import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// GET /api/sessions/[id]/messages — get messages for a session
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

  // Verify user is a participant
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

  // Verify user is a participant
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
