import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// PATCH /api/sessions/[id]/status — update session status
export async function PATCH(
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
  const { status } = body as { status: string }

  if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  const existingSession = await payload.findByID({
    collection: 'sessions',
    id,
    depth: 1,
    overrideAccess: true,
  })

  if (!existingSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Check user is participant
  const mentorUserId = typeof existingSession.mentorUser === 'string'
    ? existingSession.mentorUser
    : existingSession.mentorUser?.id
  const menteeUserId = typeof existingSession.menteeUser === 'string'
    ? existingSession.menteeUser
    : existingSession.menteeUser?.id

  if (session.user.id !== mentorUserId && session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only mentors can confirm; either can cancel; only mentors can complete
  if (status === 'confirmed' && session.user.id !== mentorUserId) {
    return NextResponse.json({ error: 'Only mentors can confirm sessions' }, { status: 403 })
  }
  if (status === 'completed' && session.user.id !== mentorUserId) {
    return NextResponse.json({ error: 'Only mentors can mark sessions as completed' }, { status: 403 })
  }

  const updated = await payload.update({
    collection: 'sessions',
    id,
    overrideAccess: true,
    data: { status },
  })

  // When session is completed, finalize the transaction (transfer to mentor)
  if (status === 'completed') {
    const transactions = await payload.find({
      collection: 'transactions',
      where: {
        session: { equals: id },
        type: { equals: 'payment' },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (transactions.docs.length > 0) {
      await payload.update({
        collection: 'transactions',
        id: transactions.docs[0].id,
        overrideAccess: true,
        data: { status: 'completed' },
      })
    }

    // Update mentor stats
    const mentorProfile = typeof existingSession.mentor === 'string'
      ? await payload.findByID({ collection: 'mentors', id: existingSession.mentor, overrideAccess: true })
      : existingSession.mentor

    if (mentorProfile) {
      const tx = transactions.docs[0]
      await payload.update({
        collection: 'mentors',
        id: mentorProfile.id,
        overrideAccess: true,
        data: {
          totalSessions: ((mentorProfile.totalSessions as number) || 0) + 1,
          totalEarningsUSD: ((mentorProfile.totalEarningsUSD as number) || 0) + ((tx?.netAmount as number) || 0),
        },
      })
    }

    // Update mentee stats
    const menteeProfile = typeof existingSession.mentee === 'string'
      ? await payload.findByID({ collection: 'mentees', id: existingSession.mentee, overrideAccess: true })
      : existingSession.mentee

    if (menteeProfile) {
      await payload.update({
        collection: 'mentees',
        id: menteeProfile.id,
        overrideAccess: true,
        data: {
          totalSessions: ((menteeProfile.totalSessions as number) || 0) + 1,
          totalHoursLearned: ((menteeProfile.totalHoursLearned as number) || 0) + ((existingSession.duration as number) || 60) / 60,
        },
      })
    }
  }

  // If cancelled, refund
  if (status === 'cancelled') {
    const transactions = await payload.find({
      collection: 'transactions',
      where: {
        session: { equals: id },
        type: { equals: 'payment' },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (transactions.docs.length > 0) {
      await payload.update({
        collection: 'transactions',
        id: transactions.docs[0].id,
        overrideAccess: true,
        data: { status: 'refunded' },
      })
    }

    await payload.update({
      collection: 'sessions',
      id,
      overrideAccess: true,
      data: { paymentStatus: 'refunded' },
    })
  }

  return NextResponse.json({ success: true, session: updated })
}
