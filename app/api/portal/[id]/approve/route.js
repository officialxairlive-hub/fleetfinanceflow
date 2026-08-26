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
    const { representativeName, signatureData, termsAccepted } = body;

    if (!representativeName || !representativeName.trim()) {
      return NextResponse.json({ error: 'Authorized representative name is required' }, { status: 400 });
    }

    if (!termsAccepted) {
      return NextResponse.json({ error: 'Terms and estimation policy must be accepted' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Check if work order exists
    const { data: existingWo, error: checkErr } = await supabase
      .from('work_orders')
      .select('id, status, customer_notes')
      .eq('id', id)
      .single();

    if (checkErr || !existingWo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const authTimestamp = new Date().toISOString();
    const updatedNotes = existingWo.customer_notes 
      ? `${existingWo.customer_notes}\n[Digital Approval by ${representativeName.trim()} on ${new Date().toLocaleString()}]`
      : `[Digital Approval by ${representativeName.trim()} on ${new Date().toLocaleString()}]`;

    // Advance status to 'repairing' if it was in draft/diagnosing/new
    let nextStatus = existingWo.status;
    if (['draft', 'new', 'diagnosing', 'pending_owner_approval'].includes(existingWo.status)) {
      nextStatus = 'repairing';
    }

    const updatePayload = {
      authorized: true,
      signature: representativeName.trim(),
      status: nextStatus,
      customer_notes: updatedNotes
    };

    const { data: updatedWo, error: updateErr } = await supabase
      .from('work_orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Estimate approved and authorized successfully',
      order: updatedWo,
      authTimestamp
    });
  } catch (err) {
    console.error("Error in POST /api/portal/[id]/approve:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
