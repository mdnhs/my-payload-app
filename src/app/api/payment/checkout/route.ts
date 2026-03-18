import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

// POST /api/payment/checkout — create Stripe Checkout session for a booking
// Called after mentor accepts the booking (session.status === 'awaiting_payment')
export async function POST(req: NextRequest) {
  const headersList = await getHeaders()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { bookingId } = body as { bookingId: string }

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  const booking = await payload.findByID({
    collection: 'sessions',
    id: bookingId,
    depth: 1,
    overrideAccess: true,
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Only the mentee (student) who made the booking can pay
  const menteeUserId = typeof booking.menteeUser === 'string' ? booking.menteeUser : booking.menteeUser?.id
  if (session.user.id !== menteeUserId) {
    return NextResponse.json({ error: 'Only the student can pay for this booking' }, { status: 403 })
  }

  // Must be pending (payment not yet done) — payment happens at booking time
  if (booking.status !== 'pending') {
    return NextResponse.json(
      { error: `Booking must be in pending status (currently: ${booking.status})` },
      { status: 400 },
    )
  }

  if (booking.paymentStatus === 'paid') {
    return NextResponse.json({ error: 'This booking has already been paid.' }, { status: 400 })
  }

  const amountCharged = (booking.amountCharged as number) || 0

  // Free sessions skip payment — mark as paid, mentor still needs to accept
  if (amountCharged === 0) {
    await payload.update({
      collection: 'sessions',
      id: bookingId,
      overrideAccess: true,
      data: { paymentStatus: 'paid', paymentMethod: 'stripe' },
    })
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    return NextResponse.json({ url: `${baseUrl}/sessions?booked=1` })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  const mentorName =
    typeof booking.mentorUser === 'object' && booking.mentorUser
      ? (booking.mentorUser as { name?: string }).name || 'Mentor'
      : 'Mentor'

  // Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Session: ${booking.topic as string}`,
            description: `${booking.duration as number}-min session with ${mentorName}`,
          },
          unit_amount: Math.round(amountCharged * 100), // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId,
      menteeUserId: session.user.id,
    },
    success_url: `${baseUrl}/sessions?payment=success&id=${bookingId}`,
    cancel_url: `${baseUrl}/sessions?payment=cancelled&id=${bookingId}`,
  })

  // Store the Stripe checkout session ID so /api/payment/verify can confirm payment
  // without relying on webhooks (important for localhost/dev environments)
  await payload.update({
    collection: 'sessions',
    id: bookingId,
    overrideAccess: true,
    data: { transactionId: checkoutSession.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
