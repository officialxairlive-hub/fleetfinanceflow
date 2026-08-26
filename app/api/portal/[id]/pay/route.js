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

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Work Order ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { paymentMethod = 'Credit Card', amountPaid } = body;

    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Update or mark invoice as paid
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

    // 2. Update work order status to 'paid'
    const { data: updatedWo, error: woErr } = await supabase
      .from('work_orders')
      .update({
        status: 'paid'
      })
      .eq('id', id)
      .select()
      .single();

    if (woErr) {
      return NextResponse.json({ error: woErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
      paymentMethod,
      amountPaid,
      paidAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error in POST /api/portal/[id]/pay:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
