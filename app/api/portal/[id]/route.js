import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { workOrders, customers, trucks, invoices } from '../../../lib/demoData';

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

    // 1. Fetch work order from Supabase
    let order = null;
    let customer = null;
    let unit = null;
    let invoice = null;

    try {
      const { data: dbOrder } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (dbOrder) {
        order = {
          ...dbOrder,
          labour_lines: dbOrder.labour || [],
          parts_lines: dbOrder.parts || []
        };

        if (order.customer_id) {
          const { data: custData } = await supabase
            .from('customers')
            .select('id, company, contact_name, phone, email, address, payment_terms')
            .eq('id', order.customer_id)
            .maybeSingle();
          if (custData) customer = custData;
        }

        if (order.unit_id) {
          const { data: unitData } = await supabase
            .from('units')
            .select('id, unit_number, make, model, year, vin, license_plate')
            .eq('id', order.unit_id)
            .maybeSingle();
          if (unitData) unit = unitData;
        }

        const { data: invData } = await supabase
          .from('invoices')
          .select('*')
          .eq('work_order_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (invData) invoice = invData;
      }
    } catch (dbErr) {
      console.warn("Database lookup note:", dbErr.message);
    }

    // 2. Fallback to demo data only if the specific ID matches demoData exactly
    if (!order) {
      const demoOrder = workOrders.find(w => w.id === id || w.woNumber === id);
      if (demoOrder) {
        order = {
          id: demoOrder.id || id,
          wo_number: demoOrder.woNumber || id,
          status: demoOrder.status || 'diagnosing',
          customer_id: demoOrder.customerId || 'CUST-001',
          unit_display: demoOrder.unit || 'Unit #104 - 2022 Freightliner Cascadia',
          complaint: demoOrder.complaint || '',
          cause: demoOrder.cause || '',
          correction: demoOrder.correction || '',
          estimated_cost: demoOrder.total || 0,
          authorized: !!demoOrder.authorized,
          signature: demoOrder.signature || null,
          labour: demoOrder.labour || [],
          parts: demoOrder.parts || [],
          labour_lines: demoOrder.labour || [],
          parts_lines: demoOrder.parts || []
        };

        const demoCust = customers.find(c => c.id === order.customer_id);
        if (demoCust) {
          customer = {
            id: demoCust.id,
            company: demoCust.company,
            contact_name: demoCust.contact,
            phone: demoCust.phone,
            email: demoCust.email || '',
            address: demoCust.address || ''
          };
        }

        invoice = {
          id: `INV-${id.replace('WO-', '')}`,
          total: order.estimated_cost,
          status: order.status === 'paid' ? 'paid' : 'draft',
          issue_date: new Date().toISOString().split('T')[0]
        };
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

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
