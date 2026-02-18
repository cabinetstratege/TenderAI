import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecret = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' })
  : (null as unknown as Stripe);

function log(message: string, extra?: Record<string, unknown>) {
  console.log(`[stripe-webhook] ${message}`, extra || '');
}

export async function POST(req: Request) {
  if (!webhookSecret || !stripeSecret) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    log('Signature failed', { error: err.message });
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  log('Event received', { id: event.id, type: event.type });

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    log('Supabase config missing');
    return NextResponse.json({ error: 'Supabase non configuré' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metaUserId = session.metadata?.userId;
    const clientRef = session.client_reference_id;
    let targetId = metaUserId || clientRef;

    if (!targetId) {
      log('No target id found for session', { sessionId: session.id });
      return NextResponse.json({ error: 'Aucun utilisateur associé (metadata userId manquant)' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'Active' })
      .eq('id', targetId);

    if (updateError) {
      log('Supabase update error', { error: updateError.message, targetId });
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    log('Subscription activated', { targetId, sessionId: session.id });
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const metaUserId = subscription.metadata?.userId as string | undefined;
    let targetId = metaUserId;

    if (!targetId) {
      log('No target id for subscription update', { subscriptionId: subscription.id, hasMetadata: !!subscription.metadata });
      return NextResponse.json({ error: 'Aucun utilisateur associé (metadata userId manquant)' }, { status: 400 });
    }

    const status = subscription.status;
    const toStatus = status === 'active' || status === 'trialing' ? 'Active' : 'Expired';

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: toStatus })
      .eq('id', targetId);

    if (updateError) {
      log('Supabase update error', { error: updateError.message, targetId });
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 });
    }

    log('Subscription status synced', { targetId, stripeStatus: status, appStatus: toStatus });
  }

  return NextResponse.json({ received: true });
}
