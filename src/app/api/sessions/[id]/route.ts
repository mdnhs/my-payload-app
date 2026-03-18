import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// GET /api/sessions/[id] — get a single session
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
    depth: 2,
    overrideAccess: true,
  })

  if (!sess) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Verify user is a participant
  const mentorUserId = typeof sess.mentorUser === 'string' ? sess.mentorUser : sess.mentorUser?.id
  const menteeUserId = typeof sess.menteeUser === 'string' ? sess.menteeUser : sess.menteeUser?.id

  if (session.user.id !== mentorUserId && session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(sess)
}
