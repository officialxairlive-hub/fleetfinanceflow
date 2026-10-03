import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

function makeToken() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * POST /api/intake
 * Creates an intake request link for a customer to fill in their own details.
 * Body: { shopId?, customerId?, company?, usdot?, email?, phone?, payload? }
 * Returns: { success, token, url }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = getAdminClient();

    const token = makeToken();
    const id = `IR-${Date.now().toString(36).toUpperCase()}`;

    const row = {
      id,
      token,
      shop_id: body.shopId || null,
      customer_id: body.customerId || null,
      work_order_id: body.workOrderId || null,
      status: 'pending',
      company: body.company || null,
      usdot: body.usdot || null,
      email: body.email || null,
      phone: body.phone || null,
      payload: body.payload || {}
    };

    const { error } = await supabase.from('intake_requests').insert([row]);
    if (error) throw error;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const origin = siteUrl || new URL(request.url).origin;
    const url = `${origin}/intake/${token}`;

    return NextResponse.json({ success: true, token, id, url });
  } catch (err) {
    console.error('POST /api/intake failed:', err);
    return NextResponse.json({ error: err.message || 'Failed to create intake link' }, { status: 500 });
  }
}

/** GET /api/intake — list recent intake requests for the shop (optional ?shopId=). */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const supabase = getAdminClient();

    let q = supabase
      .from('intake_requests')
      .select('id, token, status, company, usdot, email, phone, customer_id, created_at, submitted_at')
      .order('created_at', { ascending: false })
      .limit(25);
    if (shopId) q = q.eq('shop_id', shopId);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ success: true, requests: data || [] });
  } catch (err) {
    console.error('GET /api/intake failed:', err);
    return NextResponse.json({ error: err.message || 'Failed to list intake requests' }, { status: 500 });
  }
}
