import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// GET /api/availability?mentorId=MENTOR_PROFILE_ID[&all=1]
// Public: returns upcoming non-booked slots.
// With &all=1 (mentor's own view): returns all upcoming slots including booked.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mentorId = searchParams.get('mentorId')
  const showAll = searchParams.get('all') === '1'

  if (!mentorId) {
    return NextResponse.json({ error: 'mentorId is required' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  const whereClause = showAll
    ? {
        and: [
          { mentor: { equals: mentorId } },
          { startTime: { greater_than: new Date().toISOString() } },
        ],
      }
    : {
        and: [
          { mentor: { equals: mentorId } },
          { isBooked: { equals: false } },
          { startTime: { greater_than: new Date().toISOString() } },
        ],
      }

  const slots = await payload.find({
    collection: 'availability',
    where: whereClause,
    sort: 'startTime',
    limit: 100,
    overrideAccess: true,
  })

  return NextResponse.json(slots.docs)
}

// POST /api/availability — mentor creates a new slot
export async function POST(req: NextRequest) {
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { startTime, endTime } = body as { startTime: string; endTime: string }

  if (!startTime || !endTime) {
    return NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 })
  }

  const durMin = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)

  if (durMin <= 0) {
    return NextResponse.json({ error: 'endTime must be after startTime' }, { status: 400 })
  }
  if (durMin < 10) {
    return NextResponse.json({ error: 'Slot must be at least 10 minutes long.' }, { status: 400 })
  }
  if (durMin > 30) {
    return NextResponse.json({ error: 'Slot cannot be longer than 30 minutes.' }, { status: 400 })
  }
  if (new Date(startTime) <= new Date()) {
    return NextResponse.json({ error: 'Slot must be in the future' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  // Find this user's mentor profile
  const mentors = await payload.find({
    collection: 'mentors',
    where: { user: { equals: session.user.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (!mentors.docs[0]) {
    return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 })
  }

  const mentorProfile = mentors.docs[0]

  // Check for overlapping slots — fetch all non-booked slots for this mentor and compare in JS
  // (avoids relying on Payload date query operators which can be unreliable with MongoDB)
  const existingSlots = await payload.find({
    collection: 'availability',
    where: {
      and: [
        { mentor: { equals: mentorProfile.id } },
        { isBooked: { equals: false } },
      ],
    },
    limit: 200,
    overrideAccess: true,
  })

  const newStart = new Date(startTime).getTime()
  const newEnd = new Date(endTime).getTime()

  const overlaps = existingSlots.docs.some((s) => {
    const sStart = new Date(s.startTime as string).getTime()
    const sEnd = new Date(s.endTime as string).getTime()
    return newStart < sEnd && newEnd > sStart
  })

  if (overlaps) {
    return NextResponse.json({ error: 'This slot overlaps with an existing slot.' }, { status: 409 })
  }

  const slot = await payload.create({
    collection: 'availability',
    overrideAccess: true,
    data: {
      mentor: mentorProfile.id,
      startTime,
      endTime,
      isBooked: false,
    },
  })

  return NextResponse.json({ success: true, slot })
}
