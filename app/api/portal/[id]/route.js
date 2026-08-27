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
        order = dbOrder;

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

    // 2. Fallback to demo data if not yet created in database
    if (!order) {
      const demoOrder = workOrders.find(w => w.id === id || w.woNumber === id) || workOrders[0];
      if (demoOrder) {
        order = {
          id: demoOrder.id || id,
          wo_number: demoOrder.woNumber || id,
          status: demoOrder.status || 'diagnosing',
          customer_id: demoOrder.customerId || 'CUST-001',
          unit_display: demoOrder.unit || 'Unit #104 - 2022 Freightliner Cascadia',
          complaint: demoOrder.complaint || 'Check engine light on, DEF system warning on dash.',
          cause: demoOrder.cause || 'DEF doser valve clogged with crystallized urea.',
          correction: demoOrder.correction || 'Cleaned DEF doser valve, performed forced regen.',
          estimated_cost: demoOrder.total || 850.00,
          authorized: demoOrder.status === 'repairing' || demoOrder.status === 'completed' || demoOrder.status === 'paid',
          signature: demoOrder.authorized ? 'Authorized on File' : null,
          labour_lines: [
            { id: '1', description: 'Diagnostic Scan & Forced DPF Regeneration', hours: 2.5, rate: 145.00, total: 362.50 }
          ],
          parts_lines: [
            { id: '1', part_number: 'A0001402039', description: 'DEF Doser Injection Valve', quantity: 1, sell_price: 385.00, total: 385.00 }
          ]
        };

        const demoCust = customers.find(c => c.id === order.customer_id) || customers[0];
        if (demoCust) {
          customer = {
            id: demoCust.id,
            company: demoCust.company,
            contact_name: demoCust.contact,
            phone: demoCust.phone,
            email: demoCust.email || 'dispatch@interstatehaulers.ca',
            address: demoCust.address || '4500 54 Ave SE, Calgary, AB T2C 2Z2'
          };
        }

        unit = {
          unit_number: '104',
          make: 'Freightliner',
          model: 'Cascadia',
          year: 2022,
          vin: '1FUJGLDR5NLAA1928'
        };

        invoice = {
          id: `INV-${id.replace('WO-', '')}`,
          total: order.estimated_cost,
          status: order.status === 'paid' ? 'paid' : 'sent',
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
