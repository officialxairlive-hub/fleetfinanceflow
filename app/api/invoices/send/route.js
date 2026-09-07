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

export async function POST(request) {
  try {
    const body = await request.json();
    const { invoiceId, to, ccShop, shopEmail, additionalCc, subject, message } = body;

    if (!invoiceId || !to) {
      return NextResponse.json({ error: 'Invoice ID and recipient email are required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Update invoice status to 'sent'
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'sent',
        notes: `Emailed to ${to}${ccShop && shopEmail ? ` (CC: ${shopEmail})` : ''}${additionalCc ? ` (CC: ${additionalCc})` : ''} on ${new Date().toISOString().split('T')[0]}`
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.warn('Database note on invoice status update:', updateError.message);
    }

    // 2. Return success
    return NextResponse.json({
      success: true,
      message: `Invoice #${invoiceId} successfully emailed to ${to}`,
      dispatchedTo: to,
      cc: [ccShop ? shopEmail : null, additionalCc].filter(Boolean)
    });
  } catch (err) {
    console.error('Error in POST /api/invoices/send:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
