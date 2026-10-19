import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// Neutral placeholders — never another shop's real contact details.
const BLANK_SHOP_INFO = {
  companyName: '',
  ownerName: '',
  streetAddress: '',
  city: '',
  province: '',
  postalCode: '',
  phone: '',
  email: '',
  website: '',
  taxNumber: '',
  defaultLabourRate: 145,
  defaultPartsMarkup: 35,
  labourRateTypes: [
    { id: 'shop', name: 'Standard Shop Labour', rate: 145.00 },
    { id: 'roadside', name: 'Roadside Labour', rate: 185.00 },
    { id: 'travel', name: 'Travel Time', rate: 95.00 },
    { id: 'afterhours', name: 'After-Hours / Emergency', rate: 215.00 },
    { id: 'weekend', name: 'Weekend Rate', rate: 200.00 }
  ],
  partsMarkupTiers: [
    { id: 'tier-1', minCost: 0, maxCost: 25, markup: 60, label: 'Under $25.00' },
    { id: 'tier-2', minCost: 25.01, maxCost: 100, markup: 50, label: '$25.01 – $100.00' },
    { id: 'tier-3', minCost: 100.01, maxCost: 300, markup: 40, label: '$100.01 – $300.00' },
    { id: 'tier-4', minCost: 300.01, maxCost: 1000, markup: 30, label: '$300.01 – $1,000.00' },
    { id: 'tier-5', minCost: 1000.01, maxCost: null, markup: 20, label: '$1,000.01 and above' }
  ]
};

/**
 * Resolve the shop for this request. Prefers an explicit shopId, otherwise
 * derives it from the caller's session (Authorization: Bearer <access_token>).
 * Never falls back to a shared global record.
 */
async function resolveShopId(supabase, request, provided) {
  if (provided && provided !== 'default') return provided;

  const auth = request.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  try {
    const { data: userData } = await supabase.auth.getUser(token);
    const uid = userData?.user?.id;
    if (!uid) return null;
    const { data: profile } = await supabase
      .from('profiles').select('shop_id').eq('id', uid).maybeSingle();
    return profile?.shop_id || null;
  } catch {
    return null;
  }
}

// Per-shop storage object name.
const shopFile = (shopId) => `shop-info-${shopId}.json`;

// GET: Retrieve saved shop information for ONE shop
export async function GET(request) {
  const supabase = getAdminClient();
  try {
    const { searchParams } = new URL(request.url);
    const shopId = await resolveShopId(supabase, request, searchParams.get('shopId'));

    // No shop to scope to — return blanks, never another shop's details.
    if (!shopId) {
      return NextResponse.json({ success: true, shopInfo: null, needsSetup: true });
    }

    const { data: fileData, error: fileError } = await supabase
      .storage.from('shop-assets').download(shopFile(shopId));

    let saved = null;
    if (!fileError && fileData) {
      try { saved = JSON.parse(await fileData.text()); } catch { saved = null; }
    }

    // Seed the company name from the shops table so the owner sees their own name
    // even before saving settings.
    let shopName = '';
    try {
      const { data: shopRow } = await supabase
        .from('shops').select('name').eq('id', shopId).maybeSingle();
      shopName = shopRow?.name || '';
    } catch { /* optional */ }

    return NextResponse.json({
      success: true,
      shopId,
      shopInfo: { ...BLANK_SHOP_INFO, companyName: shopName, ...(saved || {}) }
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message, shopInfo: null },
      { status: 200 }
    );
  }
}

// POST: Save or update shop information for ONE shop
export async function POST(request) {
  const supabase = getAdminClient();
  try {
    const body = await request.json();
    const shopId = await resolveShopId(supabase, request, body.shopId);

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'Could not determine which shop to save. Sign in again and retry.' },
        { status: 400 }
      );
    }

    const shopInfo = {
      ...BLANK_SHOP_INFO,
      ...(body.shopInfo || {}),
      updatedAt: new Date().toISOString()
    };

    const payloadBuffer = Buffer.from(JSON.stringify(shopInfo, null, 2));
    const { error: upErr } = await supabase
      .storage.from('shop-assets')
      .upload(shopFile(shopId), payloadBuffer, { contentType: 'application/json', upsert: true });
    if (upErr) throw new Error(upErr.message || 'Upload failed');

    // Keep the shops table name in sync.
    if (shopInfo.companyName) {
      try {
        await supabase.from('shops').update({ name: shopInfo.companyName }).eq('id', shopId);
      } catch (dbErr) {
        console.warn('Could not update shops table name:', dbErr);
      }
    }

    return NextResponse.json({ success: true, shopId, shopInfo });
  } catch (err) {
    console.error('Error saving shop information:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save shop info' },
      { status: 500 }
    );
  }
}
