import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

// POST /api/payment/verify — called when Stripe redirects back to success_url.
// Confirms payment directly via Stripe API (fallback when webhook is unavailable).
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
    depth: 0,
    overrideAccess: true,
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Already marked paid — nothing to do
  if (booking.paymentStatus === 'paid') {
    return NextResponse.json({ alreadyPaid: true })
  }

  let stripeSessionId = booking.transactionId as string | undefined

  // If no transactionId stored yet, search Stripe for a paid checkout session for this booking
  if (!stripeSessionId || !stripeSessionId.startsWith('cs_')) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    })
    const match = sessions.data.find(
      (s) => s.metadata?.bookingId === bookingId && s.payment_status === 'paid',
    )
    if (!match) {
      return NextResponse.json({ paid: false, status: 'no_stripe_session_found' })
    }
    stripeSessionId = match.id
  }

  // Retrieve checkout session from Stripe
  const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId)

  if (checkoutSession.payment_status !== 'paid') {
    return NextResponse.json({ paid: false, status: checkoutSession.payment_status })
  }

  // Payment confirmed — update booking
  const paymentIntentId =
    typeof checkoutSession.payment_intent === 'string'
      ? checkoutSession.payment_intent
      : checkoutSession.id

  await payload.update({
    collection: 'sessions',
    id: bookingId,
    overrideAccess: true,
    data: {
      paymentStatus: 'paid',
      paymentMethod: 'stripe',
      transactionId: paymentIntentId,
    },
  })

  // Also mark the transaction record as completed if one exists
  const transactions = await payload.find({
    collection: 'transactions',
    where: { session: { equals: bookingId }, type: { equals: 'payment' } },
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

  return NextResponse.json({ paid: true })
}
