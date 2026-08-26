import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Work Order ID required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch work order
    const { data: order, error: woError } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (woError || !order) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // 2. Fetch customer details if available
    let customer = null;
    if (order.customer_id) {
      const { data: custData } = await supabase
        .from('customers')
        .select('id, company, contact_name, phone, email, address, payment_terms')
        .eq('id', order.customer_id)
        .maybeSingle();
      if (custData) customer = custData;
    }

    // 3. Fetch unit details if available
    let unit = null;
    if (order.unit_id) {
      const { data: unitData } = await supabase
        .from('units')
        .select('id, unit_number, make, model, year, vin, license_plate')
        .eq('id', order.unit_id)
        .maybeSingle();
      if (unitData) unit = unitData;
    }

    // 4. Fetch invoice if available
    let invoice = null;
    const { data: invData } = await supabase
      .from('invoices')
      .select('*')
      .eq('work_order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invData) invoice = invData;

    return NextResponse.json({
      success: true,
      order,
      customer,
      unit,
      invoice
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (err) {
    console.error("Error in GET /api/portal/[id]:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
