import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'

// POST /api/mentor/withdraw — mentor requests a withdrawal of their earnings
export async function POST(req: NextRequest) {
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { amount, note } = body as { amount: number; note?: string }

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  // Find mentor profile for this user
  const mentors = await payload.find({
    collection: 'mentors',
    where: { user: { equals: session.user.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const mentor = mentors.docs[0]
  if (!mentor) {
    return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 })
  }

  const availableBalance = (mentor.totalEarningsUSD as number) || 0

  if (amount > availableBalance) {
    return NextResponse.json(
      { error: `Requested amount $${amount} exceeds available balance $${availableBalance.toFixed(2)}` },
      { status: 400 },
    )
  }

  // Create the withdrawal request
  const withdrawal = await payload.create({
    collection: 'withdrawals',
    overrideAccess: true,
    data: {
      mentorUser: session.user.id,
      amount,
      status: 'pending',
      note: note || '',
    },
  })

  // Deduct the requested amount from the mentor's available balance
  await payload.update({
    collection: 'mentors',
    id: mentor.id,
    overrideAccess: true,
    data: {
      totalEarningsUSD: availableBalance - amount,
    },
  })

  return NextResponse.json({ success: true, withdrawal })
}

// GET /api/mentor/withdraw — list this mentor's withdrawal history
export async function GET(_req: NextRequest) {
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })

  const withdrawals = await payload.find({
    collection: 'withdrawals',
    where: { mentorUser: { equals: session.user.id } },
    sort: '-createdAt',
    limit: 50,
    overrideAccess: true,
  })

  return NextResponse.json(withdrawals.docs)
}
