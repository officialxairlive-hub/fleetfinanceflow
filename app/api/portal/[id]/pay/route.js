import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

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

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Work Order ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      action = 'stripe_checkout', // 'stripe_checkout' | 'manual_record' | 'interac'
      paymentMethod = 'Credit Card', 
      amountPaid, 
      customerEmail,
      originUrl 
    } = body;

    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // Fetch work order details
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (woError || !wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Fetch shop settings / stripe account if available
    let shopStripeAccountId = null;
    let shopName = 'Commercial Fleet Repair';
    if (wo.shop_id) {
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('id', wo.shop_id)
        .maybeSingle();
      if (shopData) {
        shopStripeAccountId = shopData.stripe_account_id;
        if (shopData.name) shopName = shopData.name;
      }
    }

    const amount = parseFloat(amountPaid) || parseFloat(wo.estimated_cost) || 150.00;
    const amountInCents = Math.round(amount * 100);

    // ACTION 1: Generate Stripe Hosted Checkout Session
    if (action === 'stripe_checkout') {
      const stripe = getStripe();
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
      }

      const baseUrl = originUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const sessionPayload = {
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'cad', // Canadian Dollars
              product_data: {
                name: `Repair Order #${wo.id} - ${wo.unit_display || 'Commercial Fleet Unit'}`,
                description: `${shopName} • Complaint: ${wo.complaint || 'Heavy Duty Service'}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: customerEmail || undefined,
        metadata: {
          work_order_id: wo.id,
          shop_id: wo.shop_id || '',
          customer_name: wo.customer_name || 'Fleet Customer'
        },
        success_url: `${baseUrl}/portal/${id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/portal/${id}?payment=cancelled`,
      };

      // If Connected Account exists with charges enabled (Stripe Connect Model B)
      if (shopStripeAccountId) {
        const platformFeeInCents = Math.round(amountInCents * 0.01); // 1% platform fee for website owner
        sessionPayload.payment_intent_data = {
          application_fee_amount: platformFeeInCents,
          transfer_data: {
            destination: shopStripeAccountId,
          },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionPayload);

      return NextResponse.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id
      });
    }

    // ACTION 2: Manual / Interac Record (Direct database clearance)
    // Update or mark invoice as paid
    const { data: invData } = await supabase
      .from('invoices')
      .select('*')
      .eq('work_order_id', id)
      .maybeSingle();

    if (invData) {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: today,
          payment_method: paymentMethod
        })
        .eq('id', invData.id);
    }

    // Update work order status to 'paid'
    const { data: updatedWo, error: updateErr } = await supabase
      .from('work_orders')
      .update({
        status: 'paid'
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
      paymentMethod,
      amountPaid: amount,
      paidAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error in POST /api/portal/[id]/pay:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
