import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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

export async function POST(request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
    }

    const { shopId, originUrl } = await request.json();
    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    let accountId = shop.stripe_account_id;

    // 1. Create Connected Account if not existing
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CA', // Canada default
        business_type: 'company',
        company: {
          name: shop.name || 'Commercial Truck Repair',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await supabase
        .from('shops')
        .update({ stripe_account_id: accountId })
        .eq('id', shopId);
    }

    const baseUrl = originUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 2. Generate Stripe Hosted Account Onboarding Link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/settings?stripe=refresh`,
      return_url: `${baseUrl}/dashboard/settings?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId
    });
  } catch (err) {
    console.error('Error creating Stripe Connect account:', err);
    return NextResponse.json({ error: err.message || 'Failed to initialize Stripe Connect' }, { status: 500 });
  }
}
