// Use node --env-file=.env.local instead of dotenv
global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// We use the Service Role key to bypass RLS during seeding
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import demo data (we need to adjust syntax slightly for Node.js if it uses ES modules)
// For simplicity, we'll fetch it dynamically using dynamic import since demoData.js uses ES exports
async function seedDatabase() {
  console.log("🌱 Starting database seed...");
  
  try {
    // Dynamic import to handle ES module
    const { 
      customers, 
      trucks: units, 
      technicians, 
      partsInventory: parts, 
      workOrders, 
      invoices 
    } = await import('../app/lib/demoData.js');

    // 1. Seed Customers (Adding [LIVE] prefix to see the change in the UI later)
    console.log("Seeding Customers...");
    const { error: custErr } = await supabase.from('customers').upsert(
      customers.map(c => ({
        id: c.id,
        company: `[LIVE] ${c.company}`, // Added prefix to verify DB connection
        contact: c.contact,
        email: c.email,
        phone: c.phone,
        address: c.address,
        credit_limit: c.creditLimit,
        payment_terms: c.paymentTerms,
        labour_rate: c.labourRate,
        parts_markup: c.partsMarkup,
        tax_setting: c.taxSetting,
        notes: c.notes,
        balance: c.balance + 100, // Small change to numbers to verify
        fleet_size: c.fleetSize,
        status: c.status,
        created_at: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()
      }))
    );
    if (custErr) throw new Error(`Customers Error: ${custErr.message}`);

    // 2. Seed Units
    console.log("Seeding Units...");
    const { error: unitErr } = await supabase.from('units').upsert(
      units.map(u => ({
        id: u.id,
        customer_id: u.customerId,
        unit_number: u.unitNumber,
        vin: u.vin,
        plate: u.plate,
        year: u.year,
        make: u.make,
        model: `(DB) ${u.model}`, // Added prefix
        engine_type: u.engineType,
        transmission: u.transmission,
        mileage: u.mileage,
        engine_hours: u.engineHours,
        status: u.status,
        last_service: u.lastService,
        next_pm: u.nextPM
      }))
    );
    if (unitErr) throw new Error(`Units Error: ${unitErr.message}`);

    // 3. Seed Technicians
    console.log("Seeding Technicians...");
    const { error: techErr } = await supabase.from('technicians').upsert(
      technicians.map(t => ({
        id: t.id,
        name: t.name,
        full_name: t.fullName,
        avatar: t.avatar,
        role: t.role,
        phone: t.phone,
        email: t.email,
        certifications: t.certifications,
        labour_rate: t.labourRate,
        hours_today: t.hoursToday,
        status: t.status,
        active_job: t.activeJob,
        clocked_in: t.clockedIn,
        stats: t.stats
      }))
    );
    if (techErr) throw new Error(`Technicians Error: ${techErr.message}`);

    // 4. Seed Parts
    console.log("Seeding Parts...");
    const { error: partErr } = await supabase.from('parts').upsert(
      parts.map(p => ({
        id: p.id,
        part_number: p.id, // Using id as part_number
        description: p.description,
        supplier: p.supplier,
        cost: p.cost,
        sell: p.sell,
        markup: p.markup,
        qty_on_hand: p.qty,
        min_stock: p.min,
        max_stock: p.max,
        bin_location: p.bin,
        category: p.category,
        is_core: p.isCore || false,
        core_charge: p.coreCharge || 0
      }))
    );
    if (partErr) throw new Error(`Parts Error: ${partErr.message}`);

    // 5. Seed Work Orders
    console.log("Seeding Work Orders...");
    const { error: woErr } = await supabase.from('work_orders').upsert(
      workOrders.map(w => ({
        id: w.id,
        customer_id: w.customerId,
        unit_id: w.unitId,
        unit_display: w.unitDisplay,
        customer_name: w.customer,
        trailer: w.trailer,
        complaint: w.complaint,
        cause: w.cause,
        correction: w.correction,
        tech_id: w.techId,
        tech_name: w.techName,
        priority: w.priority,
        is_emergency: w.isEmergency || false,
        is_roadside: w.isRoadside || false,
        status: w.status,
        labour: w.labour,
        parts: w.parts,
        photos: w.photos,
        internal_notes: w.internalNotes,
        customer_notes: w.customerNotes,
        authorized: w.authorized || false,
        signature: w.signature,
        timer: w.timer || 0,
        estimated_cost: w.estimatedCost || 0,
        margin: w.margin || 0,
        created_at: w.createdAt ? new Date(w.createdAt).toISOString() : new Date().toISOString(),
        updated_at: w.updatedAt ? new Date(w.updatedAt).toISOString() : new Date().toISOString()
      }))
    );
    if (woErr) throw new Error(`Work Orders Error: ${woErr.message}`);

    // 6. Seed Invoices
    console.log("Seeding Invoices...");
    const validWorkOrderIds = new Set(workOrders.map(w => w.id));
    
    const { error: invErr } = await supabase.from('invoices').upsert(
      invoices.map(i => ({
        id: i.id,
        customer_id: i.customerId,
        work_order_id: validWorkOrderIds.has(i.workOrderId) ? i.workOrderId : null,
        status: i.status,
        issue_date: i.issueDate,
        due_date: i.dueDate,
        paid_date: i.paidDate,
        labour_total: i.labourTotal,
        parts_total: i.partsTotal,
        shop_supplies: i.shopSupplies,
        tax_amount: i.taxAmount,
        total: i.total,
        notes: i.notes
      }))
    );
    if (invErr) throw new Error(`Invoices Error: ${invErr.message}`);

    console.log("✅ Seeding complete! Your Supabase database is now populated.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
