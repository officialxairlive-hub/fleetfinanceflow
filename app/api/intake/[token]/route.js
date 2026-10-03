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

const NEW_CUSTOMER_COLS = [
  'usdot', 'billing_street', 'billing_city', 'billing_state', 'billing_zip', 'billing_country'
];

/** True when the error means the intake tables haven't been created yet (migration not applied). */
function isMissingTable(error) {
  const msg = `${error?.message || ''} ${error?.details || ''} ${error?.code || ''}`.toLowerCase();
  return msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('pgrst205') || msg.includes('42p01');
}

/** Insert a customer, dropping the new columns if the migration hasn't been applied yet. */
async function insertCustomerResilient(supabase, payload) {
  let attempt = { ...payload };
  for (let i = 0; i < 2; i++) {
    const { data, error } = await supabase.from('customers').insert([attempt]).select().single();
    if (!error) return data;
    const msg = (error.message || '') + (error.details || '');
    const hitNewCol = NEW_CUSTOMER_COLS.some((c) => attempt[c] !== undefined && msg.toLowerCase().includes(c));
    if (i === 0 && hitNewCol) {
      const reduced = { ...attempt };
      NEW_CUSTOMER_COLS.forEach((c) => delete reduced[c]);
      // fold the address back into the legacy single-line column
      if (attempt.billing_street) {
        reduced.address = [attempt.billing_street, attempt.billing_city, attempt.billing_state, attempt.billing_zip]
          .filter(Boolean).join(', ');
      }
      attempt = reduced;
      continue;
    }
    throw error;
  }
  return null;
}

/** GET /api/intake/[token] — fetch a pending intake request for the public form. */
export async function GET(request, { params }) {
  try {
    const { token } = await params;
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('intake_requests')
      .select('id, token, status, company, usdot, email, phone, payload, created_at, submitted_at, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ error: 'This intake link is not valid.' }, { status: 404 });
      }
      throw error;
    }
    if (!data) return NextResponse.json({ error: 'This intake link is not valid.' }, { status: 404 });
    const expired = data.expires_at && new Date(data.expires_at) < new Date();
    return NextResponse.json(
      { success: true, request: { ...data, expired } },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error('GET /api/intake/[token] failed:', err);
    return NextResponse.json({ error: err.message || 'Failed to load intake form' }, { status: 500 });
  }
}

/**
 * POST /api/intake/[token] — customer submits the form.
 * Body: { company, usdot, contacts[], billing{}, vehicle{}, concern }
 * Creates (or updates) the customer + unit, links them, and marks the request submitted.
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const supabase = getAdminClient();

    const { data: reqRow, error: findErr } = await supabase
      .from('intake_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!reqRow) return NextResponse.json({ error: 'This intake link is not valid.' }, { status: 404 });
    if (reqRow.status === 'submitted') {
      return NextResponse.json({ error: 'This intake form has already been submitted.' }, { status: 409 });
    }

    const company = (body.company || reqRow.company || '').trim();
    if (!company) return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });

    const contacts = Array.isArray(body.contacts) ? body.contacts.filter((c) => c && (c.name || c.phone || c.email)) : [];
    const primary = contacts[0] || {};
    const billing = body.billing || {};
    const vehicle = body.vehicle || {};

    const custId = reqRow.customer_id || `CUST-${Date.now().toString().slice(-4)}`;
    const addressLine = [billing.street, billing.city, billing.state, billing.zip].filter(Boolean).join(', ');

    // Only create a customer if this link wasn't already tied to one.
    let customerId = reqRow.customer_id;
    if (!customerId) {
      const payload = {
        id: custId,
        company,
        contact: primary.name || company,
        phone: primary.phone || body.phone || '',
        email: primary.email || body.email || '',
        address: addressLine,
        usdot: body.usdot || '',
        billing_street: billing.street || '',
        billing_city: billing.city || '',
        billing_state: billing.state || '',
        billing_zip: billing.zip || '',
        payment_terms: 'Net 30',
        balance: 0,
        status: 'active'
      };
      if (reqRow.shop_id) payload.shop_id = reqRow.shop_id;

      const created = await insertCustomerResilient(supabase, payload);
      customerId = created?.id || custId;

      // secondary contacts -> customer_contacts (best effort; table may not exist yet)
      if (contacts.length) {
        try {
          await supabase.from('customer_contacts').insert(
            contacts.map((c, i) => ({
              id: `CC-${Date.now().toString(36).toUpperCase()}-${i}`,
              customer_id: customerId,
              name: c.name || '',
              phone: c.phone || '',
              email: c.email || '',
              is_primary: i === 0
            }))
          );
        } catch (e) {
          console.warn('customer_contacts insert skipped:', e.message);
        }
      }

      // vehicle -> unit (best effort)
      if (vehicle.unitNumber) {
        try {
          await supabase.from('units').insert([{
            id: `UNIT-${Date.now().toString().slice(-4)}`,
            customer_id: customerId,
            unit_number: vehicle.unitNumber,
            vin: vehicle.vin || '',
            make: vehicle.make || '',
            model: vehicle.model || '',
            year: parseInt(vehicle.year) || null,
            plate: vehicle.plate || '',
            mileage: parseInt(vehicle.mileage) || 0,
            status: 'active'
          }]);
        } catch (e) {
          console.warn('unit insert skipped:', e.message);
        }
      }
    }

    const { error: upErr } = await supabase
      .from('intake_requests')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        customer_id: customerId,
        company,
        usdot: body.usdot || reqRow.usdot || null,
        email: primary.email || body.email || reqRow.email || null,
        phone: primary.phone || body.phone || reqRow.phone || null,
        payload: { ...body, contacts, billing, vehicle }
      })
      .eq('token', token);
    if (upErr) throw upErr;

    return NextResponse.json({ success: true, customerId });
  } catch (err) {
    console.error('POST /api/intake/[token] failed:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit intake form' }, { status: 500 });
  }
}
