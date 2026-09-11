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

const DEFAULT_SHOP_INFO = {
  companyName: 'Road Ready',
  ownerName: 'Harman Buttar',
  streetAddress: '18983 72a Avenue',
  city: 'Surrey',
  province: 'BC',
  postalCode: 'V4N 0B2',
  phone: '(604) 555-0100',
  email: 'service@roadreadyrepair.ca',
  website: 'www.fleetfinanceflow.com',
  taxNumber: 'GST # 783920194 RT0001',
  defaultLabourRate: 145,
  defaultPartsMarkup: 35,
  partsMarkupTiers: [
    { id: 'tier-1', minCost: 0, maxCost: 25, markup: 60, label: 'Under $25.00' },
    { id: 'tier-2', minCost: 25.01, maxCost: 100, markup: 50, label: '$25.01 – $100.00' },
    { id: 'tier-3', minCost: 100.01, maxCost: 300, markup: 40, label: '$100.01 – $300.00' },
    { id: 'tier-4', minCost: 300.01, maxCost: 1000, markup: 30, label: '$300.01 – $1,000.00' },
    { id: 'tier-5', minCost: 1000.01, maxCost: null, markup: 20, label: '$1,000.01 and above' }
  ]
};

// GET: Retrieve saved shop information
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId') || 'default';
    const supabase = getAdminClient();

    // 1. Try to download from storage bucket
    const filename = `shop-info-${shopId}.json`;
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('shop-assets')
      .download(filename);

    if (!fileError && fileData) {
      const text = await fileData.text();
      const json = JSON.parse(text);
      return NextResponse.json({ success: true, shopInfo: json });
    }

    // 2. Also check global default if specific shopId wasn't found
    if (shopId !== 'default') {
      const { data: defaultData, error: defErr } = await supabase
        .storage
        .from('shop-assets')
        .download('shop-info-default.json');
      if (!defErr && defaultData) {
        const text = await defaultData.text();
        const json = JSON.parse(text);
        return NextResponse.json({ success: true, shopInfo: json });
      }
    }

    // 3. Fallback to default shop info
    return NextResponse.json({
      success: true,
      shopInfo: DEFAULT_SHOP_INFO
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message, shopInfo: DEFAULT_SHOP_INFO },
      { status: 200 }
    );
  }
}

// POST: Save or update shop information
export async function POST(request) {
  try {
    const supabase = getAdminClient();
    const body = await request.json();
    const shopId = body.shopId || 'default';
    const shopInfo = {
      ...DEFAULT_SHOP_INFO,
      ...(body.shopInfo || body),
      updatedAt: new Date().toISOString()
    };

    // 1. Save JSON to Supabase Storage bucket
    const payloadBuffer = Buffer.from(JSON.stringify(shopInfo, null, 2));
    
    // Save under shop-specific name
    await supabase
      .storage
      .from('shop-assets')
      .upload(`shop-info-${shopId}.json`, payloadBuffer, {
        contentType: 'application/json',
        upsert: true
      });

    // Also save under default to ensure global fallback
    if (shopId !== 'default') {
      await supabase
        .storage
        .from('shop-assets')
        .upload('shop-info-default.json', payloadBuffer, {
          contentType: 'application/json',
          upsert: true
        });
    }

    // 2. Update shops table in Supabase if shopId is a valid UUID
    if (shopId && shopId !== 'default') {
      try {
        await supabase
          .from('shops')
          .update({ name: shopInfo.companyName })
          .eq('id', shopId);
      } catch (dbErr) {
        console.warn('Could not update shops table name:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      shopInfo
    });
  } catch (err) {
    console.error('Error saving shop information:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save shop info' },
      { status: 500 }
    );
  }
}
