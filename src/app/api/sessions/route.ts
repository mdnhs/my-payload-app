import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// GET /api/sessions — list sessions for current user
export async function GET() {
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const userId = session.user.id

  const result = await payload.find({
    collection: 'sessions',
    depth: 2,
    limit: 50,
    sort: '-scheduledAt',
    overrideAccess: true,
    where: {
      or: [
        { mentorUser: { equals: userId } },
        { menteeUser: { equals: userId } },
      ],
    },
  })

  return NextResponse.json(result.docs)
}

// POST /api/sessions — book a new session (mentee books with a mentor)
// Status flow: pending → awaiting_payment (after mentor accepts) → confirmed (after payment) → completed
export async function POST(req: NextRequest) {
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { mentorId, topic, description, scheduledAt, duration, slotId } = body

  if (!mentorId || !topic || !scheduledAt || !duration) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  // Get mentor profile
  const mentor = await payload.findByID({
    collection: 'mentors',
    id: mentorId,
    depth: 1,
    overrideAccess: true,
  })

  if (!mentor) {
    return NextResponse.json({ error: 'Mentor not found' }, { status: 404 })
  }

  const mentorUserId = typeof mentor.user === 'string' ? mentor.user : mentor.user?.id

  // FR-14: Prevent double booking — check for overlapping confirmed/awaiting sessions for this mentor
  const bookingStart = new Date(scheduledAt).getTime()
  const bookingEnd = bookingStart + (duration as number) * 60 * 1000

  const overlapping = await payload.find({
    collection: 'sessions',
    overrideAccess: true,
    where: {
      and: [
        { mentorUser: { equals: mentorUserId } },
        {
          status: {
            in: ['pending', 'awaiting_payment', 'confirmed'],
          },
        },
      ],
    },
    limit: 100,
  })

  for (const existing of overlapping.docs) {
    const existStart = new Date(existing.scheduledAt as string).getTime()
    const existEnd = existStart + (existing.duration as number) * 60 * 1000
    // Check overlap: new booking starts before existing ends AND ends after existing starts
    if (bookingStart < existEnd && bookingEnd > existStart) {
      return NextResponse.json(
        { error: 'This time slot overlaps with an existing booking for this mentor.' },
        { status: 409 },
      )
    }
  }

  // Get or auto-create mentee profile
  const menteeResult = await payload.find({
    collection: 'mentees',
    where: { user: { equals: session.user.id } },
    limit: 1,
    overrideAccess: true,
  })

  let menteeProfile = menteeResult.docs[0]
  if (!menteeProfile) {
    menteeProfile = await payload.create({
      collection: 'mentees',
      overrideAccess: true,
      data: {
        user: session.user.id,
        currentEducation: 'bachelor',
        targetDegree: 'master',
      },
    })
  }

  // Calculate amount
  const hourlyRate = (mentor.hourlyRate as number) || 0
  const amountCharged = Math.round((hourlyRate * (duration as number)) / 60 * 100) / 100

  // Create session — status is 'pending' until mentor accepts (→ awaiting_payment)
  // then 'confirmed' after payment is verified via webhook
  const newSession = await payload.create({
    collection: 'sessions',
    overrideAccess: true,
    data: {
      mentor: mentorId,
      mentee: menteeProfile.id,
      mentorUser: mentorUserId!,
      menteeUser: session.user.id,
      topic,
      description: description || '',
      scheduledAt,
      duration,
      status: 'pending',
      hourlyRate,
      amountCharged,
      paymentStatus: 'pending',
      meetingLink: '',
    },
  })

  // Create a pending transaction record (finalised by webhook after payment)
  const platformFee = Math.round(amountCharged * 0.1 * 100) / 100 // 10%
  const netAmount = Math.round((amountCharged - platformFee) * 100) / 100

  await payload.create({
    collection: 'transactions',
    overrideAccess: true,
    data: {
      session: newSession.id,
      mentorUser: mentorUserId!,
      menteeUser: session.user.id,
      type: 'payment',
      grossAmount: amountCharged,
      platformFee,
      netAmount,
      status: 'pending',
    },
  })

  // Mark the availability slot as booked
  if (slotId) {
    await payload.update({
      collection: 'availability',
      id: slotId,
      overrideAccess: true,
      data: { isBooked: true },
    })
  }

  return NextResponse.json({ success: true, session: newSession })
}
