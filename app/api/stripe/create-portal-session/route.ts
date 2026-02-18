import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' })
  : (null as unknown as Stripe);

export async function POST(req: Request) {
  if (!stripeSecret) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const { email, userId } = body || {};
  if (!email && !userId) {
    return NextResponse.json({ error: 'email ou userId requis' }, { status: 400 });
  }

  try {
    // Trouver le customer par email (simple et sans stocker l'id côté app)
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json({ error: 'Aucun client Stripe trouvé pour cet email' }, { status: 404 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/pricing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    console.error('Stripe portal error', error);
    return NextResponse.json({ error: 'Impossible de créer la session portail' }, { status: 500 });
  }
}
