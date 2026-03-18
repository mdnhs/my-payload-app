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
export async function POST(req: NextRequest) {
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { mentorId, topic, description, scheduledAt, duration } = body

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

  // Get mentee profile
  const menteeResult = await payload.find({
    collection: 'mentees',
    where: { user: { equals: session.user.id } },
    limit: 1,
    overrideAccess: true,
  })

  if (menteeResult.docs.length === 0) {
    return NextResponse.json({ error: 'Mentee profile not found' }, { status: 404 })
  }

  const menteeProfile = menteeResult.docs[0]

  // Calculate amount
  const hourlyRate = (mentor.hourlyRate as number) || 0
  const amountCharged = Math.round((hourlyRate * (duration as number)) / 60 * 100) / 100

  // Create session
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
      paymentStatus: 'paid', // dummy payment — always succeeds
      meetingLink: '',
    },
  })

  // Create a dummy payment transaction
  const platformFee = Math.round(amountCharged * 0.1 * 100) / 100 // 10% platform fee
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
      status: 'pending', // becomes 'completed' when session completes
    },
  })

  return NextResponse.json({ success: true, session: newSession })
}
