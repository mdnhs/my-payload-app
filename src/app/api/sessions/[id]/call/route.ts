import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// POST /api/sessions/[id]/call — record call start/end (FR-25, FR-28)
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
  const { action } = body as { action: 'start' | 'end' }

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

  // FR-25: only confirmed bookings
  if (sess.status !== 'confirmed') {
    return NextResponse.json({ error: 'Call is only available for confirmed bookings.' }, { status: 403 })
  }

  const mentorUserId = typeof sess.mentorUser === 'string' ? sess.mentorUser : sess.mentorUser
  const menteeUserId = typeof sess.menteeUser === 'string' ? sess.menteeUser : sess.menteeUser

  if (session.user.id !== mentorUserId && session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if a call session already exists
  const existing = await payload.find({
    collection: 'call-sessions',
    where: { booking: { equals: id } },
    limit: 1,
    overrideAccess: true,
  })

  if (action === 'start') {
    if (existing.docs.length > 0) {
      // Already exists — return it
      return NextResponse.json(existing.docs[0])
    }
    const callSession = await payload.create({
      collection: 'call-sessions',
      overrideAccess: true,
      data: {
        booking: id,
        startedAt: new Date().toISOString(),
      },
    })
    return NextResponse.json(callSession)
  }

  if (action === 'end') {
    if (existing.docs.length > 0) {
      const updated = await payload.update({
        collection: 'call-sessions',
        id: existing.docs[0].id,
        overrideAccess: true,
        data: { endedAt: new Date().toISOString() },
      })
      return NextResponse.json(updated)
    }
    return NextResponse.json({ message: 'No active call session found.' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
