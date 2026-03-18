import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// PATCH /api/sessions/[id]/status — update session status
// New payment flow:
//   Student books + pays immediately via Stripe → status = 'pending', paymentStatus = 'paid'
//   Mentor accepts → status = 'confirmed'  (only allowed when paymentStatus = 'paid')
//   Session completes → status = 'completed'  (mentor earns; mentor can then withdraw)
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

  const validStatuses = ['confirmed', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
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

  const mentorUserId = typeof existingSession.mentorUser === 'string'
    ? existingSession.mentorUser
    : existingSession.mentorUser?.id
  const menteeUserId = typeof existingSession.menteeUser === 'string'
    ? existingSession.menteeUser
    : existingSession.menteeUser?.id

  if (session.user.id !== mentorUserId && session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isMentor = session.user.id === mentorUserId

  // pending → confirmed: only mentor, only when payment is done
  if (status === 'confirmed') {
    if (!isMentor) {
      return NextResponse.json({ error: 'Only mentors can confirm sessions' }, { status: 403 })
    }
    if (existingSession.status !== 'pending') {
      return NextResponse.json({ error: 'Can only confirm pending sessions' }, { status: 400 })
    }
    if (existingSession.paymentStatus !== 'paid') {
      return NextResponse.json(
        { error: 'Cannot confirm — payment has not been received yet. Ask the student to complete payment first.' },
        { status: 400 },
      )
    }
  }

  // confirmed → completed: only mentor
  if (status === 'completed') {
    if (!isMentor) {
      return NextResponse.json({ error: 'Only mentors can mark sessions as completed' }, { status: 403 })
    }
    if (existingSession.status !== 'confirmed') {
      return NextResponse.json({ error: 'Can only complete confirmed sessions' }, { status: 400 })
    }
  }

  const updated = await payload.update({
    collection: 'sessions',
    id,
    overrideAccess: true,
    data: {
      status: status as 'pending' | 'awaiting_payment' | 'confirmed' | 'completed' | 'cancelled',
    },
  })

  // Session completed → credit earnings to mentor profile
  if (status === 'completed') {
    const transactions = await payload.find({
      collection: 'transactions',
      where: { session: { equals: id }, type: { equals: 'payment' } },
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

    // Update mentor stats + available withdrawal balance
    const mentorProfile = typeof existingSession.mentor === 'string'
      ? await payload.findByID({ collection: 'mentors', id: existingSession.mentor, overrideAccess: true })
      : existingSession.mentor

    if (mentorProfile) {
      const tx = transactions.docs[0]
      const earned = (tx?.netAmount as number) || 0
      await payload.update({
        collection: 'mentors',
        id: mentorProfile.id,
        overrideAccess: true,
        data: {
          totalSessions: ((mentorProfile.totalSessions as number) || 0) + 1,
          totalEarningsUSD: ((mentorProfile.totalEarningsUSD as number) || 0) + earned,
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
          totalHoursLearned:
            ((menteeProfile.totalHoursLearned as number) || 0) +
            ((existingSession.duration as number) || 60) / 60,
        },
      })
    }
  }

  // Cancelled → refund transaction record
  if (status === 'cancelled') {
    const transactions = await payload.find({
      collection: 'transactions',
      where: { session: { equals: id }, type: { equals: 'payment' } },
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
