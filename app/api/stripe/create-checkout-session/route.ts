import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_TEST_PRICE_ID || process.env.STRIPE_PRICE_ID;
const publicKey = process.env.STRIPE_TEST_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

if (!stripeSecret) {
  console.warn('[stripe] STRIPE_SECRET_KEY/STRIPE_TEST_SECRET_KEY is not set');
}

const stripe = stripeSecret
  ? new Stripe(stripeSecret) // use account's default API version to avoid mismatches
  : (null as unknown as Stripe);

export async function POST(req: Request) {
  if (!stripeSecret || !priceId || !publicKey) {
    return NextResponse.json({ error: 'Stripe non configuré (clé ou price manquant)' }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const { userId, email } = body || {};
  if (!userId || !email) {
    return NextResponse.json({ error: 'userId et email requis' }, { status: 400 });
  }

  const origin = req.headers.get('origin') || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/pricing?success=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      customer_email: email,
      client_reference_id: userId,
      subscription_data: {
        metadata: {
          userId,
          email,
        },
      },
      metadata: {
        userId,
        email,
        environment: process.env.STRIPE_TEST_SECRET_KEY ? 'test' : 'live',
      },
    });

    return NextResponse.json({ url: session.url, publicKey });
  } catch (error) {
    console.error('Stripe checkout error', error);
    return NextResponse.json({ error: 'Impossible de créer la session' }, { status: 500 });
  }
}
