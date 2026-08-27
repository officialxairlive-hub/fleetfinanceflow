import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

export async function POST(req) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const payload = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      } catch (err) {
        console.error(`Webhook signature verification failed:`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      }
    } else {
      // If no webhook secret configured in dev mode, parse JSON payload safely
      event = JSON.parse(payload);
    }

    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // Handle completed checkout session
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const workOrderId = session.metadata?.work_order_id;

      if (workOrderId) {
        // 1. Mark Work Order as Paid
        await supabase
          .from('work_orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            stripe_payment_id: session.payment_intent || session.id
          })
          .eq('id', workOrderId);

        // 2. Mark Invoice as Paid
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: today,
            payment_method: 'Stripe Card / Digital'
          })
          .eq('work_order_id', workOrderId);

        console.log(`✅ Webhook: Work Order #${workOrderId} marked as PAID via Stripe Checkout.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
