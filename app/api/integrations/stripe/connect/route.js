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
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { shopId, originUrl } = body;

    const supabase = getAdminClient();
    let targetShopId = shopId;
    let shop = null;

    if (targetShopId) {
      const { data } = await supabase.from('shops').select('*').eq('id', targetShopId).maybeSingle();
      shop = data;
    }

    if (!shop) {
      const { data: firstShop } = await supabase.from('shops').select('*').limit(1).maybeSingle();
      shop = firstShop;
      if (shop) targetShopId = shop.id;
    }

    let accountId = shop?.stripe_account_id;

    // 1. Create Connected Express Account for Shop Owner if not existing
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CA', // Canadian Heavy Duty Shop Default
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        company: {
          name: shop?.name || 'Heavy Duty Commercial Truck Repair',
        },
      });

      accountId = account.id;

      if (targetShopId) {
        await supabase
          .from('shops')
          .update({ 
            stripe_account_id: accountId,
            stripe_charges_enabled: true,
            stripe_onboarding_complete: true
          })
          .eq('id', targetShopId);
      }
    }

    const baseUrl = originUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 2. Generate Stripe Hosted Express Account Onboarding Link (Uber-Style Bank Setup)
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/settings?stripe=refresh`,
      return_url: `${baseUrl}/dashboard/settings?stripe=success&account_id=${accountId}`,
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

export async function GET(request) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ connected: false });

    const supabase = getAdminClient();
    const { data: shop } = await supabase.from('shops').select('*').limit(1).maybeSingle();

    if (!shop?.stripe_account_id) {
      return NextResponse.json({ connected: false });
    }

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(shop.stripe_account_id);

    return NextResponse.json({
      connected: true,
      accountId: account.id,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      country: account.country,
      currency: account.default_currency || 'cad',
      bankAccounts: account.external_accounts?.data || []
    });
  } catch (err) {
    return NextResponse.json({ connected: false, error: err.message });
  }
}
