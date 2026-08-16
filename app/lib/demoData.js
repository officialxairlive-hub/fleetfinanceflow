'use client';

// ============================================
// FLEET FINANCE FLOW — Centralized Demo Data
// All pages import from this single source
// ============================================

// --- CUSTOMERS ---
export const customers = [
  {
    id: 'CUST-001',
    company: 'Interstate Haulers LLC',
    contact: 'Robert Chen',
    email: 'robert@interstatehaulers.com',
    phone: '(604) 555-0112',
    address: '14200 Industrial Blvd, Surrey, BC V3R 6T3',
    creditLimit: 50000,
    paymentTerms: 'Net 30',
    labourRate: 145.00,
    partsMarkup: 30,
    taxSetting: 'GST',
    notes: 'Long-time fleet customer. Always pays on time. Preferred vendor for Freightliner parts.',
    balance: 4850.00,
    fleetSize: 28,
    status: 'active',
    createdAt: '2024-03-15'
  },
  {
    id: 'CUST-002',
    company: 'Midwest Logistics Fleet',
    contact: 'Jennifer Walsh',
    email: 'j.walsh@midwestlogistics.com',
    phone: '(403) 555-0198',
    address: '8900 Crossroads Ave, Calgary, AB T2P 1H7',
    creditLimit: 75000,
    paymentTerms: 'Net 15',
    labourRate: 155.00,
    partsMarkup: 35,
    taxSetting: 'GST',
    notes: 'Large fleet. Requires PO numbers on all invoices. Emergency service priority.',
    balance: 12400.00,
    fleetSize: 64,
    status: 'active',
    createdAt: '2023-11-08'
  },
  {
    id: 'CUST-003',
    company: 'Pacific Express Fleet',
    contact: 'David Kowalski',
    email: 'david.k@pacificexpress.ca',
    phone: '(778) 555-0234',
    address: '3100 Marine Way, Burnaby, BC V5J 3E8',
    creditLimit: 40000,
    paymentTerms: 'Net 30',
    labourRate: 140.00,
    partsMarkup: 28,
    taxSetting: 'GST+PST',
    notes: 'Growing fleet. Recently added 10 new Volvos. PM schedule critical.',
    balance: 7200.00,
    fleetSize: 42,
    status: 'active',
    createdAt: '2024-01-22'
  },
  {
    id: 'CUST-004',
    company: 'Heavy Haul Services',
    contact: 'Marcus Thompson',
    email: 'marcus@heavyhaulservices.com',
    phone: '(250) 555-0167',
    address: '5500 Highway 97, Kelowna, BC V1X 7W4',
    creditLimit: 30000,
    paymentTerms: 'Net 45',
    labourRate: 150.00,
    partsMarkup: 32,
    taxSetting: 'GST+PST',
    notes: 'Specializes in heavy haul. Western Star and Kenworth fleet. Roadside calls frequent.',
    balance: 2100.00,
    fleetSize: 18,
    status: 'active',
    createdAt: '2024-06-10'
  },
  {
    id: 'CUST-005',
    company: 'Titan Freight Line',
    contact: 'Angela Rivera',
    email: 'a.rivera@titanfreight.com',
    phone: '(604) 555-0341',
    address: '9200 Annacis Island, Delta, BC V3M 5R5',
    creditLimit: 60000,
    paymentTerms: 'Net 30',
    labourRate: 145.00,
    partsMarkup: 30,
    taxSetting: 'GST+PST',
    notes: 'Regional carrier. Mix of Peterbilt and Kenworth. Requires DOT inspections quarterly.',
    balance: 540.00,
    fleetSize: 35,
    status: 'active',
    createdAt: '2024-02-28'
  },
  {
    id: 'CUST-006',
    company: 'Northern Express Transport',
    contact: 'James Whitfield',
    email: 'james@northernexpress.ca',
    phone: '(780) 555-0455',
    address: '11400 Fort Road, Edmonton, AB T5B 4H5',
    creditLimit: 25000,
    paymentTerms: 'Net 15',
    labourRate: 160.00,
    partsMarkup: 35,
    taxSetting: 'GST',
    notes: 'Cold weather fleet. Requires block heater checks in winter. After-hours calls common.',
    balance: 8900.00,
    fleetSize: 22,
    status: 'active',
    createdAt: '2023-09-14'
  }
];

// --- TRUCKS / FLEET UNITS ---
export const trucks = [
  {
    id: 'UNIT-001', unitNumber: '2019', customerId: 'CUST-001',
    vin: '1FUJAC6C4KL928170', plate: 'BC-KT4819', year: 2019,
    make: 'Freightliner', model: 'Cascadia 126',
    engineType: 'Detroit DD15 14.8L', transmission: 'Detroit DT12 Automated',
    mileage: 485200, engineHours: 12840,
    status: 'in_shop', lastService: '2025-07-18',
    nextPM: { type: 'Oil & Filter Service', dueIn: '2,100 km', urgency: 'upcoming' }
  },
  {
    id: 'UNIT-002', unitNumber: '1850', customerId: 'CUST-002',
    vin: '1XKYD49X8EJ396742', plate: 'AB-MWL205', year: 2021,
    make: 'Kenworth', model: 'T680',
    engineType: 'Cummins X15 15.0L', transmission: 'Eaton Fuller 18-Speed',
    mileage: 312400, engineHours: 8400,
    status: 'in_shop', lastService: '2025-06-25',
    nextPM: { type: 'DPF Regen & Filter Clean', dueIn: '5,200 km', urgency: 'normal' }
  },
  {
    id: 'UNIT-003', unitNumber: '2231', customerId: 'CUST-003',
    vin: '4V4NC9EJ5LN241893', plate: 'BC-PE2231', year: 2020,
    make: 'Volvo', model: 'VNL 760',
    engineType: 'Volvo D13 12.8L', transmission: 'Volvo I-Shift 12-Speed',
    mileage: 398700, engineHours: 10650,
    status: 'in_shop', lastService: '2025-08-02',
    nextPM: { type: 'Transmission Service', dueIn: '800 km', urgency: 'overdue' }
  },
  {
    id: 'UNIT-004', unitNumber: '2104', customerId: 'CUST-004',
    vin: '5KJJAHDR9FPGM0234', plate: 'BC-HH2104', year: 2018,
    make: 'Western Star', model: '4900',
    engineType: 'Detroit DD16 15.6L', transmission: 'Eaton Fuller 18-Speed',
    mileage: 620100, engineHours: 16800,
    status: 'ready', lastService: '2025-08-14',
    nextPM: { type: 'Full PM Service A', dueIn: '12,400 km', urgency: 'normal' }
  },
  {
    id: 'UNIT-005', unitNumber: '1988', customerId: 'CUST-005',
    vin: '1XPBDP9X1FD257831', plate: 'BC-TF1988', year: 2022,
    make: 'Peterbilt', model: '579',
    engineType: 'PACCAR MX-13 12.9L', transmission: 'PACCAR TX-12 Automated',
    mileage: 189300, engineHours: 5100,
    status: 'ready', lastService: '2025-08-14',
    nextPM: { type: 'Brake Inspection', dueIn: '15 days', urgency: 'upcoming' }
  },
  {
    id: 'UNIT-006', unitNumber: '2045', customerId: 'CUST-001',
    vin: '1FUJAC6C2KL928184', plate: 'BC-KT2045', year: 2020,
    make: 'Freightliner', model: 'Cascadia 116',
    engineType: 'Detroit DD13 12.8L', transmission: 'Detroit DT12 Automated',
    mileage: 412300, engineHours: 11200,
    status: 'active', lastService: '2025-07-30',
    nextPM: { type: 'Oil & Filter Service', dueIn: '8,500 km', urgency: 'normal' }
  },
  {
    id: 'UNIT-007', unitNumber: '3102', customerId: 'CUST-002',
    vin: '1XKYD49X0GJ401285', plate: 'AB-MWL310', year: 2022,
    make: 'Kenworth', model: 'W990',
    engineType: 'Cummins X15 Efficiency 15.0L', transmission: 'Eaton Fuller Advantage',
    mileage: 145600, engineHours: 3900,
    status: 'active', lastService: '2025-08-05',
    nextPM: { type: 'A/C System Check', dueIn: '30 days', urgency: 'normal' }
  },
  {
    id: 'UNIT-008', unitNumber: '2049', customerId: 'CUST-006',
    vin: '5KJJAHDR4HPGN1567', plate: 'AB-NE2049', year: 2017,
    make: 'International', model: 'LT625',
    engineType: 'Cummins X15 15.0L', transmission: 'Eaton Fuller 13-Speed',
    mileage: 710200, engineHours: 19400,
    status: 'active', lastService: '2025-07-12',
    nextPM: { type: 'Oil Service', dueIn: '2,000 km', urgency: 'upcoming' }
  }
];

// --- TECHNICIANS ---
export const technicians = [
  {
    id: 'TECH-001', name: 'Sarah L.', fullName: 'Sarah Lawson', avatar: 'SL',
    role: 'Lead Heavy-Duty Tech', phone: '(604) 555-0801', email: 'sarah@thompsondiesel.com',
    certifications: ['Red Seal', 'Freightliner Certified', 'Detroit Diesel'],
    labourRate: 145.00, hoursToday: 6.75, status: 'active',
    activeJob: 'WO-8821', clockedIn: '07:30 AM',
    stats: { hoursThisWeek: 38.5, jobsCompleted: 8, efficiency: 92, revenue: 12400, comebacks: 0 }
  },
  {
    id: 'TECH-002', name: 'Mike D.', fullName: 'Mike Dimitrov', avatar: 'MD',
    role: 'Diagnostic Specialist', phone: '(604) 555-0802', email: 'mike@thompsondiesel.com',
    certifications: ['Red Seal', 'Cummins Certified', 'Volvo Certified'],
    labourRate: 155.00, hoursToday: 4.2, status: 'active',
    activeJob: 'WO-8825', clockedIn: '08:00 AM',
    stats: { hoursThisWeek: 36.0, jobsCompleted: 6, efficiency: 88, revenue: 10800, comebacks: 1 }
  },
  {
    id: 'TECH-003', name: 'Ben M.', fullName: 'Ben Martinez', avatar: 'BM',
    role: 'Heavy Duty Tech', phone: '(604) 555-0803', email: 'ben@thompsondiesel.com',
    certifications: ['Red Seal', 'PACCAR Certified'],
    labourRate: 140.00, hoursToday: 5.1, status: 'paused',
    activeJob: 'WO-8830', clockedIn: '07:45 AM',
    stats: { hoursThisWeek: 34.5, jobsCompleted: 7, efficiency: 85, revenue: 9200, comebacks: 0 }
  },
  {
    id: 'TECH-004', name: 'Alex K.', fullName: 'Alex Kowalchuk', avatar: 'AK',
    role: 'Fleet Specialist', phone: '(604) 555-0804', email: 'alex@thompsondiesel.com',
    certifications: ['Red Seal', 'Western Star Certified', 'Allison Transmission'],
    labourRate: 150.00, hoursToday: 7.3, status: 'completed',
    activeJob: null, clockedIn: '07:00 AM',
    stats: { hoursThisWeek: 40.0, jobsCompleted: 9, efficiency: 95, revenue: 14100, comebacks: 0 }
  },
  {
    id: 'TECH-005', name: 'Chris R.', fullName: 'Chris Russo', avatar: 'CR',
    role: 'Mobile / Roadside Tech', phone: '(604) 555-0805', email: 'chris@thompsondiesel.com',
    certifications: ['Red Seal', 'Mobile Hydraulics'],
    labourRate: 160.00, hoursToday: 0, status: 'off',
    activeJob: null, clockedIn: null,
    stats: { hoursThisWeek: 32.0, jobsCompleted: 5, efficiency: 82, revenue: 8600, comebacks: 1 }
  }
];

// --- WORK ORDERS ---
export const workOrders = [
  {
    id: 'WO-8821', customerId: 'CUST-001', unitId: 'UNIT-001',
    unitDisplay: '#2019 - Freightliner Cascadia 126',
    customer: 'Interstate Haulers LLC', trailer: 'TRL-4401',
    complaint: 'Driver reports spongy brake pedal and grinding noise from front axle during braking.',
    cause: 'Front brake rotors worn below minimum thickness. Left caliper seized. Brake pads at 5% remaining.',
    correction: 'Replaced both front rotors, all brake pads, rebuilt left caliper, adjusted slack adjusters. Road tested OK.',
    techId: 'TECH-001', techName: 'Sarah L.',
    priority: 'high', isEmergency: false, isRoadside: false,
    status: 'repairing',
    labour: [
      { description: 'Brake System Diagnosis', hours: 0.5, rate: 145.00, type: 'shop' },
      { description: 'Brake Rotor & Pad Replacement', hours: 2.25, rate: 145.00, type: 'shop' }
    ],
    parts: [
      { partNumber: 'BRK-R4020', description: 'Brake Rotor 16.5" (pair)', qty: 1, cost: 285.00, sell: 370.50, markup: 30 },
      { partNumber: 'BRK-P1100', description: 'Premium Brake Pad Kit (front)', qty: 1, cost: 120.00, sell: 156.00, markup: 30 },
      { partNumber: 'BRK-C2050', description: 'Caliper Rebuild Kit', qty: 1, cost: 85.00, sell: 110.50, markup: 30 }
    ],
    photos: [],
    internalNotes: 'Rotors were well below minimum spec. Recommend customer checks rear brakes at next PM.',
    customerNotes: 'Front brake system overhauled. All rotors, pads, and left caliper replaced. Road test passed.',
    authorized: true, signature: null,
    timer: 9914, // seconds (02h 45m 14s)
    createdAt: '2025-08-14T07:45:00', updatedAt: '2025-08-14T10:30:00',
    estimatedCost: 1250.00, margin: 68.4
  },
  {
    id: 'WO-8825', customerId: 'CUST-002', unitId: 'UNIT-002',
    unitDisplay: '#1850 - Kenworth T680',
    customer: 'Midwest Logistics Fleet', trailer: null,
    complaint: 'Check engine light on. Loss of power under load. Rough idle.',
    cause: 'Fault codes SPN 3936/FMI 2 — EGR valve stuck partially open. Excessive carbon buildup.',
    correction: 'Removed and replaced EGR valve assembly. Cleaned intake manifold. Cleared fault codes. Test drive OK.',
    techId: 'TECH-002', techName: 'Mike D.',
    priority: 'high', isEmergency: false, isRoadside: false,
    status: 'repairing',
    labour: [
      { description: 'Engine Diagnostic & Fault Code Analysis', hours: 0.75, rate: 155.00, type: 'shop' },
      { description: 'EGR Valve Removal & Replacement', hours: 1.5, rate: 155.00, type: 'shop' }
    ],
    parts: [
      { partNumber: 'EGR-CX15-200', description: 'EGR Valve Assembly — Cummins X15', qty: 1, cost: 420.00, sell: 567.00, markup: 35 },
      { partNumber: 'GSK-INT-400', description: 'Intake Manifold Gasket Set', qty: 1, cost: 45.00, sell: 60.75, markup: 35 }
    ],
    photos: [],
    internalNotes: 'Heavy carbon buildup — possible fuel quality issue. Recommend fuel system cleaning at next service.',
    customerNotes: 'EGR valve replaced, intake cleaned. All fault codes cleared. Engine running normally.',
    authorized: true, signature: null,
    timer: 4320,
    createdAt: '2025-08-14T08:15:00', updatedAt: '2025-08-14T10:00:00',
    estimatedCost: 980.00, margin: 62.1
  },
  {
    id: 'WO-8830', customerId: 'CUST-003', unitId: 'UNIT-003',
    unitDisplay: '#2231 - Volvo VNL 760',
    customer: 'Pacific Express Fleet', trailer: 'TRL-7720',
    complaint: 'Transmission fluid pooling under truck. Hard shifting between 4th and 5th gear.',
    cause: 'Transmission output shaft seal leaking. Clutch disc wear at 40% remaining.',
    correction: 'Pending parts — clutch kit on order from Volvo dealer. ETA today 2:30 PM.',
    techId: 'TECH-003', techName: 'Ben M.',
    priority: 'normal', isEmergency: false, isRoadside: false,
    status: 'waiting_parts',
    labour: [
      { description: 'Transmission Diagnosis & Inspection', hours: 1.0, rate: 140.00, type: 'shop' },
      { description: 'Partial Teardown for Seal Access', hours: 2.0, rate: 140.00, type: 'shop' }
    ],
    parts: [
      { partNumber: 'VLV-CLT-900', description: 'Volvo I-Shift Clutch Kit', qty: 1, cost: 680.00, sell: 870.40, markup: 28, status: 'ordered' },
      { partNumber: 'VLV-SL-120', description: 'Output Shaft Seal', qty: 1, cost: 35.00, sell: 44.80, markup: 28 }
    ],
    photos: [],
    internalNotes: 'Clutch kit ordered from Volvo Vancouver — expected 2:30 PM delivery. Ben paused pending parts.',
    customerNotes: 'Transmission leak found at output shaft seal. Clutch disc at 40% — recommending replacement while transmission is open.',
    authorized: true, signature: null,
    timer: 11100,
    createdAt: '2025-08-13T14:00:00', updatedAt: '2025-08-14T09:30:00',
    estimatedCost: 1650.00, margin: 58.0
  },
  {
    id: 'WO-8815', customerId: 'CUST-004', unitId: 'UNIT-004',
    unitDisplay: '#2104 - Western Star 4900',
    customer: 'Heavy Haul Services', trailer: null,
    complaint: 'Low air pressure warning. Air dryer cycling excessively.',
    cause: 'Air compressor head gasket blown. Governor valve sticking intermittently.',
    correction: 'Replaced air compressor assembly. New governor valve installed. Air system tested — holds 120 PSI steady.',
    techId: 'TECH-004', techName: 'Alex K.',
    priority: 'normal', isEmergency: false, isRoadside: false,
    status: 'ready_invoice',
    labour: [
      { description: 'Air System Diagnosis', hours: 0.5, rate: 150.00, type: 'shop' },
      { description: 'Air Compressor Replacement', hours: 2.5, rate: 150.00, type: 'shop' },
      { description: 'Governor Valve Replacement & Air Test', hours: 1.25, rate: 150.00, type: 'shop' }
    ],
    parts: [
      { partNumber: 'AIR-C5000', description: 'Air Compressor Assembly — Detroit', qty: 1, cost: 580.00, sell: 765.60, markup: 32 },
      { partNumber: 'AIR-GV200', description: 'Governor Valve Assembly', qty: 1, cost: 125.00, sell: 165.00, markup: 32 },
      { partNumber: 'AIR-DY100', description: 'Air Dryer Desiccant Cartridge', qty: 1, cost: 65.00, sell: 85.80, markup: 32 }
    ],
    photos: [],
    internalNotes: 'Old compressor head gasket was completely blown. Recommend checking air tank moisture drain at next PM.',
    customerNotes: 'Air compressor replaced. New governor valve installed. Air system holds steady at 120 PSI.',
    authorized: true, signature: 'Marcus Thompson',
    timer: 15600,
    createdAt: '2025-08-13T07:00:00', updatedAt: '2025-08-14T11:20:00',
    estimatedCost: 1640.00, margin: 71.2
  },
  {
    id: 'WO-8819', customerId: 'CUST-005', unitId: 'UNIT-005',
    unitDisplay: '#1988 - Peterbilt 579',
    customer: 'Titan Freight Line', trailer: 'TRL-9950',
    complaint: 'Rough ride. Driver reports bouncing at highway speed. Right side sits lower.',
    cause: 'Right rear air bag leaking at seam. Both rear bushings cracked and deteriorated.',
    correction: 'Replaced right rear air bag. Replaced both rear suspension bushings. Ride height adjusted.',
    techId: 'TECH-001', techName: 'Sarah L.',
    priority: 'normal', isEmergency: false, isRoadside: false,
    status: 'ready_invoice',
    labour: [
      { description: 'Suspension Inspection & Diagnosis', hours: 0.5, rate: 145.00, type: 'shop' },
      { description: 'Air Bag & Bushing Replacement', hours: 1.75, rate: 145.00, type: 'shop' }
    ],
    parts: [
      { partNumber: 'SUS-AB300', description: 'Rear Air Bag Assembly', qty: 1, cost: 195.00, sell: 253.50, markup: 30 },
      { partNumber: 'SUS-BU150', description: 'Suspension Bushing Kit (pair)', qty: 1, cost: 110.00, sell: 143.00, markup: 30 }
    ],
    photos: [],
    internalNotes: 'Air bag was leaking at factory seam — possible defect. Left bag still OK but showing age.',
    customerNotes: 'Right rear air bag replaced. Both rear bushings replaced. Ride height verified.',
    authorized: true, signature: 'Angela Rivera',
    timer: 6600,
    createdAt: '2025-08-14T08:00:00', updatedAt: '2025-08-14T10:45:00',
    estimatedCost: 720.00, margin: 65.0
  },
  {
    id: 'WO-8832', customerId: 'CUST-006', unitId: 'UNIT-008',
    unitDisplay: '#2049 - International LT625',
    customer: 'Northern Express Transport', trailer: null,
    complaint: 'No-start condition. Cranks but will not fire.',
    cause: '',
    correction: '',
    techId: null, techName: null,
    priority: 'emergency', isEmergency: true, isRoadside: true,
    status: 'new',
    labour: [],
    parts: [],
    photos: [],
    internalNotes: 'ROADSIDE BREAKDOWN — Truck stranded on Hwy 2 near Red Deer. Dispatching mobile tech.',
    customerNotes: '',
    authorized: false, signature: null,
    timer: 0,
    createdAt: '2025-08-14T11:00:00', updatedAt: '2025-08-14T11:00:00',
    estimatedCost: 0, margin: 0
  },
  {
    id: 'WO-8810', customerId: 'CUST-002', unitId: 'UNIT-007',
    unitDisplay: '#3102 - Kenworth W990',
    customer: 'Midwest Logistics Fleet', trailer: 'TRL-5540',
    complaint: 'A/C blowing warm air. No cold at all.',
    cause: 'Refrigerant level zero. Found leak at condenser fitting. Condenser fin damage from road debris.',
    correction: 'Replaced condenser. New O-rings on all fittings. Evacuated and recharged with R-134a. Cold air confirmed.',
    techId: 'TECH-002', techName: 'Mike D.',
    priority: 'normal', isEmergency: false, isRoadside: false,
    status: 'invoiced',
    labour: [
      { description: 'A/C System Diagnosis & Leak Test', hours: 0.75, rate: 155.00, type: 'shop' },
      { description: 'Condenser Replacement & Recharge', hours: 2.0, rate: 155.00, type: 'shop' }
    ],
    parts: [
      { partNumber: 'AC-CND-500', description: 'A/C Condenser Assembly', qty: 1, cost: 340.00, sell: 459.00, markup: 35 },
      { partNumber: 'AC-REF-134', description: 'R-134a Refrigerant (2 cans)', qty: 2, cost: 28.00, sell: 37.80, markup: 35 },
      { partNumber: 'AC-ORG-SET', description: 'A/C O-Ring Kit', qty: 1, cost: 18.00, sell: 24.30, markup: 35 }
    ],
    photos: [],
    internalNotes: 'Condenser had a big dent from a rock. Customer should add a guard screen.',
    customerNotes: 'A/C condenser replaced due to road debris damage. System recharged. Blowing cold.',
    authorized: true, signature: 'Jennifer Walsh',
    timer: 9900,
    createdAt: '2025-08-10T09:00:00', updatedAt: '2025-08-11T14:00:00',
    estimatedCost: 985.00, margin: 66.8
  }
];

// --- PARTS INVENTORY ---
export const partsInventory = [
  { id: 'BRK-R4020', description: 'Brake Rotor 16.5" (pair)', supplier: 'Meritor / Dana', cost: 285.00, sell: 370.50, markup: 30, qtyOnHand: 4, minStock: 2, maxStock: 8, binLocation: 'A-1-03', coreCharge: 50.00, category: 'Brakes' },
  { id: 'BRK-P1100', description: 'Premium Brake Pad Kit (front)', supplier: 'Meritor / Dana', cost: 120.00, sell: 156.00, markup: 30, qtyOnHand: 8, minStock: 4, maxStock: 16, binLocation: 'A-1-05', coreCharge: 0, category: 'Brakes' },
  { id: 'BRK-C2050', description: 'Caliper Rebuild Kit', supplier: 'Meritor / Dana', cost: 85.00, sell: 110.50, markup: 30, qtyOnHand: 3, minStock: 2, maxStock: 6, binLocation: 'A-1-08', coreCharge: 25.00, category: 'Brakes' },
  { id: 'EGR-CX15-200', description: 'EGR Valve Assembly — Cummins X15', supplier: 'Cummins Parts', cost: 420.00, sell: 567.00, markup: 35, qtyOnHand: 1, minStock: 1, maxStock: 3, binLocation: 'B-2-01', coreCharge: 100.00, category: 'Engine' },
  { id: 'GSK-INT-400', description: 'Intake Manifold Gasket Set', supplier: 'Cummins Parts', cost: 45.00, sell: 60.75, markup: 35, qtyOnHand: 6, minStock: 3, maxStock: 10, binLocation: 'B-2-04', coreCharge: 0, category: 'Engine' },
  { id: 'VLV-CLT-900', description: 'Volvo I-Shift Clutch Kit', supplier: 'Volvo Trucks', cost: 680.00, sell: 870.40, markup: 28, qtyOnHand: 0, minStock: 1, maxStock: 2, binLocation: 'C-3-01', coreCharge: 150.00, category: 'Drivetrain' },
  { id: 'VLV-SL-120', description: 'Output Shaft Seal', supplier: 'Volvo Trucks', cost: 35.00, sell: 44.80, markup: 28, qtyOnHand: 5, minStock: 2, maxStock: 8, binLocation: 'C-3-04', coreCharge: 0, category: 'Drivetrain' },
  { id: 'AIR-C5000', description: 'Air Compressor Assembly — Detroit', supplier: 'Detroit Diesel', cost: 580.00, sell: 765.60, markup: 32, qtyOnHand: 1, minStock: 1, maxStock: 2, binLocation: 'D-1-01', coreCharge: 120.00, category: 'Air System' },
  { id: 'AIR-GV200', description: 'Governor Valve Assembly', supplier: 'Bendix', cost: 125.00, sell: 165.00, markup: 32, qtyOnHand: 3, minStock: 2, maxStock: 6, binLocation: 'D-1-03', coreCharge: 0, category: 'Air System' },
  { id: 'AIR-DY100', description: 'Air Dryer Desiccant Cartridge', supplier: 'Bendix', cost: 65.00, sell: 85.80, markup: 32, qtyOnHand: 12, minStock: 4, maxStock: 16, binLocation: 'D-1-05', coreCharge: 0, category: 'Air System' },
  { id: 'SUS-AB300', description: 'Rear Air Bag Assembly', supplier: 'Hendrickson', cost: 195.00, sell: 253.50, markup: 30, qtyOnHand: 6, minStock: 2, maxStock: 8, binLocation: 'E-2-01', coreCharge: 0, category: 'Suspension' },
  { id: 'SUS-BU150', description: 'Suspension Bushing Kit (pair)', supplier: 'Hendrickson', cost: 110.00, sell: 143.00, markup: 30, qtyOnHand: 4, minStock: 2, maxStock: 8, binLocation: 'E-2-03', coreCharge: 0, category: 'Suspension' },
  { id: 'AC-CND-500', description: 'A/C Condenser Assembly', supplier: 'Red Dot', cost: 340.00, sell: 459.00, markup: 35, qtyOnHand: 2, minStock: 1, maxStock: 3, binLocation: 'F-1-01', coreCharge: 0, category: 'HVAC' },
  { id: 'OIL-15W40', description: 'Shell Rotella T6 15W-40 (20L pail)', supplier: 'Shell Canada', cost: 95.00, sell: 130.00, markup: 37, qtyOnHand: 8, minStock: 4, maxStock: 12, binLocation: 'G-1-01', coreCharge: 0, category: 'Fluids' },
  { id: 'FLT-OIL-200', description: 'Oil Filter — DD15 / DD13', supplier: 'Detroit Diesel', cost: 22.00, sell: 30.00, markup: 36, qtyOnHand: 15, minStock: 6, maxStock: 24, binLocation: 'G-1-04', coreCharge: 0, category: 'Filters' },
  { id: 'FLT-FUEL-100', description: 'Fuel Filter Kit — Cummins X15', supplier: 'Cummins Parts', cost: 48.00, sell: 65.00, markup: 35, qtyOnHand: 10, minStock: 4, maxStock: 16, binLocation: 'G-1-06', coreCharge: 0, category: 'Filters' }
];

// --- INVOICES ---
export const invoices = [
  {
    id: 'INV-2025-0042', workOrderId: 'WO-8810', customerId: 'CUST-002',
    customer: 'Midwest Logistics Fleet', contact: 'Jennifer Walsh',
    status: 'sent', issueDate: '2025-08-11', dueDate: '2025-08-26',
    labourTotal: 426.25, partsTotal: 558.90, shopSupplies: 25.00, envFee: 15.00,
    subtotal: 1025.15, taxRate: 5, taxAmount: 51.26, total: 1076.41,
    amountPaid: 0, amountDue: 1076.41,
    paymentMethod: null, paymentDate: null,
    notes: 'A/C condenser replacement — road debris damage.'
  },
  {
    id: 'INV-2025-0041', workOrderId: 'WO-8805', customerId: 'CUST-001',
    customer: 'Interstate Haulers LLC', contact: 'Robert Chen',
    status: 'paid', issueDate: '2025-08-08', dueDate: '2025-09-07',
    labourTotal: 580.00, partsTotal: 412.50, shopSupplies: 25.00, envFee: 15.00,
    subtotal: 1032.50, taxRate: 5, taxAmount: 51.63, total: 1084.13,
    amountPaid: 1084.13, amountDue: 0,
    paymentMethod: 'EFT', paymentDate: '2025-08-12',
    notes: 'PM Service A — Unit #2045'
  },
  {
    id: 'INV-2025-0040', workOrderId: 'WO-8798', customerId: 'CUST-005',
    customer: 'Titan Freight Line', contact: 'Angela Rivera',
    status: 'paid', issueDate: '2025-08-05', dueDate: '2025-09-04',
    labourTotal: 435.00, partsTotal: 328.00, shopSupplies: 25.00, envFee: 15.00,
    subtotal: 803.00, taxRate: 12, taxAmount: 96.36, total: 899.36,
    amountPaid: 899.36, amountDue: 0,
    paymentMethod: 'Credit Card', paymentDate: '2025-08-06',
    notes: 'Wheel bearing replacement — front right.'
  },
  {
    id: 'INV-2025-0039', workOrderId: null, customerId: 'CUST-006',
    customer: 'Northern Express Transport', contact: 'James Whitfield',
    status: 'overdue', issueDate: '2025-07-15', dueDate: '2025-07-30',
    labourTotal: 960.00, partsTotal: 1240.00, shopSupplies: 50.00, envFee: 30.00,
    subtotal: 2280.00, taxRate: 5, taxAmount: 114.00, total: 2394.00,
    amountPaid: 0, amountDue: 2394.00,
    paymentMethod: null, paymentDate: null,
    notes: 'Engine coolant system overhaul. 15 DAYS OVERDUE.'
  }
];

// --- ESTIMATES ---
export const estimates = [
  {
    id: 'EST-2025-0018', customerId: 'CUST-001', unitId: 'UNIT-006',
    customer: 'Interstate Haulers LLC', unit: '#2045 - Freightliner Cascadia 116',
    status: 'sent', createdAt: '2025-08-14', expiresAt: '2025-08-28',
    description: 'Full PM Service B — 400,000 km interval',
    labourTotal: 725.00, partsTotal: 890.00, total: 1740.75,
    revisions: 1, approvedBy: null
  },
  {
    id: 'EST-2025-0017', customerId: 'CUST-003', unitId: 'UNIT-003',
    customer: 'Pacific Express Fleet', unit: '#2231 - Volvo VNL 760',
    status: 'approved', createdAt: '2025-08-13', expiresAt: '2025-08-27',
    description: 'Clutch Kit Replacement & Output Shaft Seal — converted to WO-8830',
    labourTotal: 420.00, partsTotal: 915.20, total: 1443.62,
    revisions: 0, approvedBy: 'David Kowalski'
  },
  {
    id: 'EST-2025-0016', customerId: 'CUST-006', unitId: 'UNIT-008',
    customer: 'Northern Express Transport', unit: '#2049 - International LT625',
    status: 'declined', createdAt: '2025-08-10', expiresAt: '2025-08-24',
    description: 'Block Heater Replacement & Coolant Flush',
    labourTotal: 290.00, partsTotal: 385.00, total: 729.75,
    revisions: 2, approvedBy: null
  }
];

// --- NOTIFICATIONS ---
export const notifications = [
  { id: 'N-001', type: 'emergency', title: 'ROADSIDE BREAKDOWN', message: 'Unit #2049 stranded on Hwy 2 near Red Deer — No start. Needs dispatch.', time: '2 min ago', read: false },
  { id: 'N-002', type: 'approval', title: 'Estimate Awaiting Approval', message: 'EST-2025-0018 sent to Interstate Haulers LLC — PM Service B ($1,740.75)', time: '15 min ago', read: false },
  { id: 'N-003', type: 'parts', title: 'Parts Arriving Soon', message: 'Volvo I-Shift Clutch Kit for WO-8830 — ETA 2:30 PM today.', time: '45 min ago', read: false },
  { id: 'N-004', type: 'payment', title: 'Payment Received', message: 'Interstate Haulers paid INV-2025-0041 ($1,084.13) via EFT.', time: '2 hrs ago', read: true },
  { id: 'N-005', type: 'overdue', title: 'Invoice Overdue', message: 'INV-2025-0039 for Northern Express — $2,394.00 is 15 days overdue.', time: '1 day ago', read: true },
  { id: 'N-006', type: 'pm', title: 'PM Due Soon', message: 'Unit #2019 oil service due in 2,100 km. Schedule with Interstate Haulers.', time: '1 day ago', read: true }
];

// --- MAINTENANCE SCHEDULES ---
export const maintenanceSchedules = [
  { id: 'PM-001', unitId: 'UNIT-001', type: 'Oil & Filter Service', interval: 'Every 25,000 km', dueIn: '2,100 km', urgency: 'upcoming', lastCompleted: '2025-07-18' },
  { id: 'PM-002', unitId: 'UNIT-003', type: 'Transmission Service', interval: 'Every 100,000 km', dueIn: 'OVERDUE', urgency: 'overdue', lastCompleted: '2024-12-10' },
  { id: 'PM-003', unitId: 'UNIT-005', type: 'Brake Inspection', interval: 'Every 90 days', dueIn: '15 days', urgency: 'upcoming', lastCompleted: '2025-05-20' },
  { id: 'PM-004', unitId: 'UNIT-008', type: 'Oil Service', interval: 'Every 20,000 km', dueIn: '2,000 km', urgency: 'upcoming', lastCompleted: '2025-07-12' },
  { id: 'PM-005', unitId: 'UNIT-002', type: 'DPF Regen & Filter Clean', interval: 'Every 50,000 km', dueIn: '5,200 km', urgency: 'normal', lastCompleted: '2025-06-25' },
  { id: 'PM-006', unitId: 'UNIT-004', type: 'Full PM Service A', interval: 'Every 40,000 km', dueIn: '12,400 km', urgency: 'normal', lastCompleted: '2025-08-14' },
  { id: 'PM-007', unitId: 'UNIT-006', type: 'PM Service B', interval: 'Every 100,000 km', dueIn: '8,500 km', urgency: 'normal', lastCompleted: '2025-03-10' },
  { id: 'PM-008', unitId: 'UNIT-007', type: 'A/C System Check', interval: 'Annually', dueIn: '30 days', urgency: 'normal', lastCompleted: '2024-09-15' }
];

// --- LABOUR RATE TYPES ---
export const labourRateTypes = [
  { id: 'shop', label: 'Shop Labour', defaultRate: 145.00 },
  { id: 'roadside', label: 'Roadside Labour', defaultRate: 185.00 },
  { id: 'travel', label: 'Travel Time', defaultRate: 95.00 },
  { id: 'afterhours', label: 'After-Hours', defaultRate: 215.00 },
  { id: 'weekend', label: 'Weekend Rate', defaultRate: 200.00 },
  { id: 'holiday', label: 'Holiday Rate', defaultRate: 250.00 },
  { id: 'minimum', label: 'Minimum Service Call', defaultRate: 250.00 }
];

// --- SHOP SETTINGS ---
export const shopSettings = {
  name: 'Thompson Diesel Repair',
  address: '14800 Industrial Way, Surrey, BC V3S 8C4',
  phone: '(604) 555-0100',
  email: 'service@thompsondiesel.com',
  website: 'www.thompsondiesel.com',
  owner: 'Vince Pallotta',
  taxConfig: {
    province: 'BC',
    gst: 5.0,
    pst: 7.0,
    hst: null,
    applyGST: true,
    applyPST: true
  },
  defaultLabourRate: 145.00,
  defaultPartsMarkup: 30,
  invoicePrefix: 'INV-2025-',
  nextInvoiceNumber: 43,
  woPrefix: 'WO-',
  nextWONumber: 8833,
  shopSupplyRate: 25.00,
  envFee: 15.00,
  bays: 8,
  locations: 1
};

// --- HELPER FUNCTIONS ---
export function getCustomerById(id) {
  return customers.find(c => c.id === id);
}

export function getTrucksByCustomer(customerId) {
  return trucks.filter(t => t.customerId === customerId);
}

export function getWorkOrdersByCustomer(customerId) {
  return workOrders.filter(wo => wo.customerId === customerId);
}

export function getWorkOrdersByTruck(unitId) {
  return workOrders.filter(wo => wo.unitId === unitId);
}

export function getWorkOrdersByStatus(status) {
  return workOrders.filter(wo => wo.status === status);
}

export function getWorkOrdersByTech(techId) {
  return workOrders.filter(wo => wo.techId === techId);
}

export function getTechById(id) {
  return technicians.find(t => t.id === id);
}

export function getTruckById(id) {
  return trucks.find(t => t.id === id);
}

export function getInvoicesByCustomer(customerId) {
  return invoices.filter(inv => inv.customerId === customerId);
}

export function calculateWOTotal(wo) {
  const labourTotal = wo.labour.reduce((sum, l) => sum + (l.hours * l.rate), 0);
  const partsTotal = wo.parts.reduce((sum, p) => sum + (p.sell * p.qty), 0);
  return { labourTotal, partsTotal, subtotal: labourTotal + partsTotal };
}

// Status display mapping
export const statusLabels = {
  new: { label: 'New', color: '#6366F1', bg: '#EEF2FF' },
  diagnosing: { label: 'Diagnosing', color: '#8B5CF6', bg: '#F5F3FF' },
  waiting_parts: { label: 'Waiting Parts', color: '#C2410C', bg: '#FFEDD5' },
  repairing: { label: 'In Progress', color: '#1D4ED8', bg: '#DBEAFE' },
  completed: { label: 'Completed', color: '#15803D', bg: '#DCFCE7' },
  ready_invoice: { label: 'Ready to Invoice', color: '#15803D', bg: '#DCFCE7' },
  invoiced: { label: 'Invoiced', color: '#0369A1', bg: '#E0F2FE' },
  paid: { label: 'Paid', color: '#166534', bg: '#BBF7D0' }
};

export const priorityLabels = {
  normal: { label: 'Normal', color: '#64748B', bg: '#F1F5F9' },
  high: { label: 'High', color: '#C2410C', bg: '#FFEDD5' },
  emergency: { label: '🚨 Emergency', color: '#DC2626', bg: '#FEE2E2' }
};
