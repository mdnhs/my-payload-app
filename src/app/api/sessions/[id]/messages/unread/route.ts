import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// GET /api/sessions/[id]/messages/unread — count of messages the current user has not sent
// (simple unread indicator: messages from the other participant since last GET)
// Returns { unread: number, lastMessageAt: string | null }
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

  const mentorUserId = typeof sess.mentorUser === 'string' ? sess.mentorUser : sess.mentorUser
  const menteeUserId = typeof sess.menteeUser === 'string' ? sess.menteeUser : sess.menteeUser

  if (session.user.id !== mentorUserId && session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Count messages NOT sent by the current user (proxy for unread)
  const messages = await payload.find({
    collection: 'messages',
    where: {
      and: [
        { session: { equals: id } },
        { sender: { not_equals: session.user.id } },
      ],
    },
    sort: '-createdAt',
    limit: 100,
    overrideAccess: true,
  })

  return NextResponse.json({
    unread: messages.totalDocs,
    lastMessageAt: messages.docs[0]?.createdAt ?? null,
  })
}
