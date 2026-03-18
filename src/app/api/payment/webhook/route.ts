import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

// POST /api/payment/webhook — Stripe webhook (FR-17)
// Payment flow:
//   Student pays at booking time → Stripe sends checkout.session.completed
//   → booking paymentStatus = 'paid', status stays 'pending' (mentor must still accept)
//   → mentor accepts → 'confirmed' → session runs → 'completed' → mentor withdraws earnings
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const payload = await getPayload({ config })

  // ── Payment succeeded ─────────────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session
    const bookingId = checkoutSession.metadata?.bookingId

    if (!bookingId) {
      return NextResponse.json({ error: 'No bookingId in metadata' }, { status: 400 })
    }

    const transactionId = (checkoutSession.payment_intent as string) || checkoutSession.id

    // Keep status = 'pending' — mentor still needs to accept.
    // Set paymentStatus = 'paid' + store transactionId (FR-18)
    await payload.update({
      collection: 'sessions',
      id: bookingId,
      overrideAccess: true,
      data: {
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        transactionId,
      },
    })

    // Mark the transaction record as completed
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
  }

  // ── Payment failed / expired → FR-19: auto-cancel booking ────────────────
  if (
    event.type === 'checkout.session.expired' ||
    event.type === 'payment_intent.payment_failed'
  ) {
    let bookingId: string | undefined

    if (event.type === 'checkout.session.expired') {
      const cs = event.data.object as Stripe.Checkout.Session
      bookingId = cs.metadata?.bookingId
    } else {
      // payment_intent.payment_failed — find the pending transaction whose session is pending
      const pi = event.data.object as Stripe.PaymentIntent
      const pendingTx = await payload.find({
        collection: 'transactions',
        where: { status: { equals: 'pending' } },
        limit: 200,
        overrideAccess: true,
      })

      for (const tx of pendingTx.docs) {
        const sessionId = typeof tx.session === 'string' ? tx.session : (tx.session as { id: string })?.id
        if (!sessionId) continue
        const sess = await payload.findByID({
          collection: 'sessions',
          id: sessionId,
          depth: 0,
          overrideAccess: true,
        })
        if (sess?.status === 'pending' && sess?.paymentStatus !== 'paid') {
          bookingId = sessionId
          break
        }
        void pi
      }
    }

    if (bookingId) {
      await payload.update({
        collection: 'sessions',
        id: bookingId,
        overrideAccess: true,
        data: {
          status: 'cancelled' as const,
          paymentStatus: 'failed',
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}
