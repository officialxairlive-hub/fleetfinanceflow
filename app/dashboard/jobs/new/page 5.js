'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload, ArrowLeft, Save, Plus, X, Building2,
  Search, Send, Copy, Check, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Link2, Loader2, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { getDefaultShopRateString, fetchShopSettings } from '../../../lib/shopConfig';
import styles from '../jobs.module.css';
import wz from './intake.module.css';

const EMPTY_CONTACT = { name: '', phone: '', email: '' };
const NEW_CUSTOMER_COLS = ['usdot', 'billing_street', 'billing_city', 'billing_state', 'billing_zip', 'billing_country'];
const NEW_UNIT_COLS = ['vehicle_type', 'plate_state'];

const VEHICLE_TYPES = [
  'Trailer', 'Semi Truck', 'Heavy Equipment', 'Dump Truck', 'Pickup', 'Car',
  'Box Truck', 'Reefer Unit', 'Machinery', 'Generator / Compressor', 'Forklift', 'Other'
];

const REGIONS = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL',
  'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT',
  'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

/** Roller-digit odometer. Stores km as a string; empty means "not recorded". */
function Odometer({ value, onChange, digits = 7 }) {
  const padded = String(value || '').replace(/\D/g, '').padStart(digits, '0').slice(-digits);

  const setDigit = (idx, d) => {
    const arr = padded.split('');
    arr[idx] = String(d);
    const next = arr.join('').replace(/^0+(?=\d)/, '');
    onChange(next === '0'.repeat(digits) ? '' : next);
  };

  const bump = (delta) => {
    const cur = parseInt(padded, 10) || 0;
    const next = Math.max(0, Math.min(9999999, cur + delta));
    onChange(next === 0 ? '' : String(next));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div className={wz.odo}>
        {padded.split('').map((d, i) => (
          <div
            key={i}
            className={wz.odoDigit}
            onClick={() => setDigit(i, (parseInt(d, 10) + 1) % 10)}
            title="Click to increase · scroll to adjust"
            onWheel={(e) => { e.preventDefault(); setDigit(i, (parseInt(d, 10) + (e.deltaY > 0 ? 1 : 9)) % 10); }}
            style={{ cursor: 'pointer' }}
          >
            <div className={wz.odoStrip} style={{ transform: `translateY(-${parseInt(d, 10) * 30}px)` }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n, k) => <span key={k}>{n}</span>)}
            </div>
          </div>
        ))}
        <span className={wz.odoUnit}>km</span>
      </div>
      <div className={wz.odoBtns}>
        <button type="button" onClick={() => bump(1)} aria-label="Increase odometer"><ChevronUp size={12} /></button>
        <button type="button" onClick={() => bump(-1)} aria-label="Decrease odometer"><ChevronDown size={12} /></button>
      </div>
    </div>
  );
}

const STEPS = [
  { n: 1, title: 'Customer Details', sub: 'Who is this for?' },
  { n: 2, title: 'Vehicle', sub: 'What are we working on?' },
  { n: 3, title: 'Concern', sub: 'Why is it here?' }
];

export default function CreateWorkOrderPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState([]);
  const [units, setUnits] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [shopId, setShopId] = useState(null);

  // wizard
  const [step, setStep] = useState(1);
  const [customerMode, setCustomerMode] = useState('existing');

  // existing customer
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  // new customer
  const [custForm, setCustForm] = useState(() => ({
    company: '', usdot: '', contacts: [{ ...EMPTY_CONTACT }],
    street: '', city: '', state: '', zip: '',
    paymentTerms: 'Net 30', labourRate: getDefaultShopRateString(), pstNumber: ''
  }));
  const [addressSuggestions, setAddressSuggestions] = useState([]);

  // vehicle / concern
  const [selectedUnit, setSelectedUnit] = useState('');
  const [trailer, setTrailer] = useState('');
  const [complaint, setComplaint] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [priority, setPriority] = useState('normal');
  const [selectedTech, setSelectedTech] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isRoadside, setIsRoadside] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [defaultShopRate, setDefaultShopRate] = useState(() => getDefaultShopRateString());

  // vehicle (new-vehicle form on the Vehicle step)
  const [unitForm, setUnitForm] = useState({
    unitNumber: '', vin: '', make: '', model: '', year: '',
    vehicleType: '', plate: '', plateState: 'AB', odometer: '', engine: ''
  });
  const [vinLoading, setVinLoading] = useState(false);
  const [vinMsg, setVinMsg] = useState('');
  const [partsInvoiceOnly, setPartsInvoiceOnly] = useState(false);

  // send intake link
  const [showIntake, setShowIntake] = useState(false);
  const [intakeEmail, setIntakeEmail] = useState('');
  const [intakeName, setIntakeName] = useState('');
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeLink, setIntakeLink] = useState('');
  const [intakeError, setIntakeError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadFormData() {
      try {
        const [cRes, uRes, tRes, shopConfig] = await Promise.all([
          supabase.from('customers').select('*').order('company'),
          supabase.from('units').select('*'),
          supabase.from('technicians').select('*'),
          fetchShopSettings()
        ]);
        setCustomers(cRes.data || []);
        setUnits(uRes.data || []);
        setTechnicians(tRes.data || []);

        if (shopConfig?.defaultLabourRate) {
          const rateStr = parseFloat(shopConfig.defaultLabourRate).toFixed(2);
          setDefaultShopRate(rateStr);
          setCustForm((prev) => ({ ...prev, labourRate: prev.labourRate === '145.00' ? rateStr : prev.labourRate }));
        }

        // best-effort: current shop for linking new rows
        try {
          const { data: auth } = await supabase.auth.getUser();
          if (auth?.user) {
            const { data: profile } = await supabase
              .from('profiles').select('shop_id').eq('id', auth.user.id).maybeSingle();
            if (profile?.shop_id) setShopId(profile.shop_id);
          }
        } catch { /* profile lookup optional */ }
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      }
    }
    loadFormData();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      (c.company || '').toLowerCase().includes(q) ||
      (c.contact || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const filteredTrucks = selectedCustomer
    ? units.filter((u) => u.customer_id === selectedCustomer)
    : units;

  const selectedCustObj = customers.find((c) => c.id === selectedCustomer) || null;

  /* ---------- address autocomplete (OpenStreetMap, keyless) ---------- */
  const lookupAddress = useCallback(async (q) => {
    if (!q || q.length < 5) { setAddressSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setAddressSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setAddressSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (!custForm.street || custForm.street.length < 5) return;
    const t = setTimeout(() => lookupAddress(custForm.street), 500);
    return () => clearTimeout(t);
  }, [custForm.street, lookupAddress]);

  const applyAddress = (s) => {
    const a = s.address || {};
    setCustForm((f) => ({
      ...f,
      street: [a.house_number, a.road].filter(Boolean).join(' ') || s.display_name?.split(',')[0] || f.street,
      city: a.city || a.town || a.village || a.hamlet || f.city,
      state: a.state || a.province || f.state,
      zip: a.postcode || f.zip
    }));
    setAddressSuggestions([]);
  };

  const updateContact = (i, field, val) =>
    setCustForm((f) => ({ ...f, contacts: f.contacts.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)) }));

  /* ---------- customer creation (resilient to missing migration) ---------- */
  async function createCustomer() {
    const company = custForm.company.trim();
    const contacts = custForm.contacts.filter((c) => (c.name || c.phone || c.email));
    const primary = contacts[0] || {};
    const custId = `CUST-${Date.now().toString().slice(-4)}`;
    const addressLine = [custForm.street, custForm.city, custForm.state, custForm.zip].filter(Boolean).join(', ');

    const base = {
      id: custId,
      company,
      contact: primary.name || company,
      phone: primary.phone || '',
      email: primary.email || '',
      address: addressLine,
      payment_terms: custForm.paymentTerms || 'Net 30',
      labour_rate: parseFloat(custForm.labourRate) || 145.0,
      tax_setting: custForm.pstNumber ? `PST# ${custForm.pstNumber}` : 'GST+PST',
      notes: custForm.pstNumber ? `PST / Tax Exemption #: ${custForm.pstNumber}` : '',
      balance: 0,
      status: 'active'
    };
    if (shopId) base.shop_id = shopId;

    const full = {
      ...base,
      usdot: custForm.usdot.trim(),
      billing_street: custForm.street.trim(),
      billing_city: custForm.city.trim(),
      billing_state: custForm.state.trim(),
      billing_zip: custForm.zip.trim()
    };

    let attempt = full;
    let created = null;
    for (let i = 0; i < 2; i++) {
      const { data, error } = await supabase.from('customers').insert([attempt]).select().single();
      if (!error) { created = data; break; }
      const msg = ((error.message || '') + (error.details || '')).toLowerCase();
      const hitNewCol = NEW_CUSTOMER_COLS.some((c) => attempt[c] !== undefined && msg.includes(c));
      if (i === 0 && hitNewCol) {
        const reduced = { ...attempt };
        NEW_CUSTOMER_COLS.forEach((c) => delete reduced[c]);
        attempt = reduced;
        console.warn('customers: new columns missing, falling back to legacy address column. Run the intake migration.');
        continue;
      }
      throw error;
    }

    // secondary contacts (best effort)
    if (contacts.length) {
      try {
        await supabase.from('customer_contacts').insert(
          contacts.map((c, i) => ({
            id: `CC-${Date.now().toString(36).toUpperCase()}-${i}`,
            customer_id: created?.id || custId,
            name: c.name || '',
            phone: c.phone || '',
            email: c.email || '',
            is_primary: i === 0
          }))
        );
      } catch { /* table may not exist yet */ }
    }

    const result = created || { ...attempt };
    setCustomers((prev) => [...prev, result]);
    setSelectedCustomer(result.id);
    return result;
  }

  /* ---------- navigation ---------- */
  const validateStep = (n) => {
    if (n === 2 && !selectedUnit && !unitForm.unitNumber.trim()) {
      setError('Unit Number is required — enter one to attach this vehicle to the job, or pick an existing unit.');
      return false;
    }
    setError(null);
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => { setError(null); setStep((s) => Math.max(1, s - 1)); };
  const goTo = (n) => {
    if (n <= step) { setError(null); setStep(n); return; }
    if (step === n - 1) { goNext(); return; }
    if (validateStep(step)) setStep((s) => Math.min(3, s + 1));
  };

  /* ---------- VIN lookup (NHTSA vPIC, keyless) ---------- */
  const lookupVIN = async () => {
    const vin = unitForm.vin.trim().toUpperCase();
    if (vin.length !== 17) { setVinMsg('Enter a 17-character VIN first.'); return; }
    setVinLoading(true);
    setVinMsg('');
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`);
      const json = await res.json();
      const r = json?.Results?.[0] || {};
      const year = (r.ModelYear || '').trim();
      const make = (r.Make || '').trim();
      const model = (r.Model || '').trim();
      if (!year && !make && !model) { setVinMsg('No match found for that VIN — enter details manually.'); return; }
      setUnitForm((f) => ({ ...f, year: year || f.year, make: make || f.make, model: model || f.model }));
      setVinMsg(`Decoded: ${[year, make, model].filter(Boolean).join(' ')}`);
    } catch (err) {
      setVinMsg('VIN lookup unavailable — enter details manually.');
    } finally {
      setVinLoading(false);
    }
  };

  /* ---------- create the vehicle for this job ---------- */
  async function createUnitForJob(customerId) {
    const payload = {
      id: `UNIT-${Date.now().toString().slice(-4)}`,
      customer_id: customerId,
      unit_number: unitForm.unitNumber.trim(),
      vin: unitForm.vin.trim().toUpperCase(),
      make: unitForm.make.trim(),
      model: unitForm.model.trim(),
      year: parseInt(unitForm.year) || null,
      plate: unitForm.plate.trim().toUpperCase(),
      mileage: parseInt(unitForm.odometer) || 0,
      engine_type: unitForm.engine.trim(),
      vehicle_type: unitForm.vehicleType || '',
      plate_state: unitForm.plateState || '',
      status: 'active'
    };
    if (shopId) payload.shop_id = shopId;

    let attempt = payload;
    for (let i = 0; i < 2; i++) {
      const { data, error } = await supabase.from('units').insert([attempt]).select().single();
      if (!error) { setUnits((prev) => [...prev, data]); return data; }
      const msg = ((error.message || '') + (error.details || '')).toLowerCase();
      if (i === 0 && NEW_UNIT_COLS.some((c) => attempt[c] !== undefined && msg.includes(c))) {
        const reduced = { ...attempt };
        NEW_UNIT_COLS.forEach((c) => delete reduced[c]);
        attempt = reduced;
        console.warn('units: vehicle_type/plate_state missing — run the intake migration.');
        continue;
      }
      throw error;
    }
    return { ...attempt };
  }

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (customerMode === 'existing' && !selectedCustomer) {
      setError('Select an existing customer (or switch to New Customer) before creating the job.'); setStep(1); return;
    }
    if (customerMode === 'new' && !custForm.company.trim()) {
      setError('Company name is required before creating the job.'); setStep(1); return;
    }
    if (!selectedUnit && !unitForm.unitNumber.trim()) {
      setError('Unit Number is required — enter one, or pick an existing unit.'); setStep(2); return;
    }
    if (!complaint.trim()) { setError('Enter the customer complaint / reason for service.'); setStep(3); return; }

    setIsLoading(true);
    setError(null);

    try {
      let custObj = selectedCustObj;
      if (customerMode === 'new') custObj = await createCustomer();

      let unitObj = units.find((u) => u.id === selectedUnit) || null;
      if (!unitObj && unitForm.unitNumber.trim()) {
        unitObj = await createUnitForJob(custObj?.id || selectedCustomer);
        setSelectedUnit(unitObj.id);
      }
      const techObj = technicians.find((t) => t.id === selectedTech);
      const newWoId = `WO-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        id: newWoId,
        customer_id: custObj?.id || selectedCustomer,
        customer_name: custObj?.company || custObj?.company_name || 'Customer',
        unit_id: unitObj?.id || null,
        unit_display: unitObj ? `#${unitObj.unit_number} - ${unitObj.make || ''} ${unitObj.model || ''}`.trim() : 'Unassigned Unit',
        trailer: trailer || null,
        complaint,
        internal_notes: internalNotes || null,
        customer_notes: customerNotes || null,
        tech_id: selectedTech || null,
        tech_name: techObj ? (techObj.full_name || techObj.name) : null,
        priority,
        is_emergency: isEmergency,
        is_roadside: isRoadside,
        authorized: isAuthorized,
        parts_invoice_only: partsInvoiceOnly,
        status: 'new',
        labour: [], parts: [], photos: [], estimated_cost: 0, margin: 65.0
      };
      if (shopId) payload.shop_id = shopId;

      let woAttempt = payload;
      let woData = null;
      for (let i = 0; i < 2; i++) {
        const { data, error } = await supabase.from('work_orders').insert([woAttempt]).select().single();
        if (!error) { woData = data; break; }
        const msg = ((error.message || '') + (error.details || '')).toLowerCase();
        if (i === 0 && msg.includes('parts_invoice_only')) {
          const { parts_invoice_only, ...reduced } = woAttempt;
          woAttempt = reduced;
          console.warn('work_orders: parts_invoice_only missing — run the intake migration.');
          continue;
        }
        throw error;
      }
      if (!woData) throw new Error('Failed to create work order.');

      router.push(`/dashboard/jobs/${woData.id}`);
    } catch (err) {
      console.error('Error creating work order:', err);
      setError(err.message || 'Failed to create work order.');
      setIsLoading(false);
    }
  };

  /* ---------- intake link ---------- */
  const openIntake = () => {
    setIntakeError('');
    setIntakeLink('');
    setCopied(false);
    setIntakeName(customerMode === 'new' ? custForm.contacts[0]?.name || '' : selectedCustObj?.contact || '');
    setIntakeEmail(customerMode === 'new' ? custForm.contacts[0]?.email || ''
      : selectedCustObj?.email || '');
    setShowIntake(true);
  };

  const generateIntakeLink = async () => {
    setIntakeLoading(true);
    setIntakeError('');
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customerId: customerMode === 'existing' ? selectedCustomer || null : null,
          company: customerMode === 'new' ? custForm.company : selectedCustObj?.company || '',
          usdot: customerMode === 'new' ? custForm.usdot : '',
          email: intakeEmail,
          phone: customerMode === 'new' ? (custForm.contacts[0]?.phone || '') : (selectedCustObj?.phone || '')
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not create link');
      setIntakeLink(json.url);
    } catch (err) {
      setIntakeError(err.message || 'Could not create link');
    } finally {
      setIntakeLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(intakeLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  const rate = selectedCustObj?.labour_rate || selectedCustObj?.custom_labour_rate;
  const tax = selectedCustObj?.tax_setting;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard/jobs" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '8px' }}>
            <ArrowLeft size={16} /> Back to Work Orders
          </Link>
          <h1>Create New Job</h1>
          <p>Create a new service order for a customer.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className="btn btn-outline" onClick={openIntake} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={16} /> Send Intake Form
          </button>
          <button type="button" className="btn btn-outline" onClick={() => router.push('/dashboard/jobs')}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            <Save size={18} /> {isLoading ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </header>

      {error && <div style={{ color: '#B91C1C', padding: '0.85rem 1rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px', marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

      {/* stepper */}
      <div className={wz.stepper}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <span className={wz.stepDivider} />}
            <button
              type="button"
              className={`${wz.stepItem} ${step === s.n ? wz.stepActive : ''} ${step > s.n ? wz.stepDone : ''}`}
              onClick={() => goTo(s.n)}
            >
              <span className={wz.stepNum}>{step > s.n ? <Check size={14} /> : s.n}</span>
              <span className={wz.stepLabel}>
                <strong style={{ fontSize: '13.5px', fontWeight: 600 }}>{s.title}</strong>
                <small>{s.sub}</small>
              </span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Customer Details</h2>

          <div className={wz.tabs}>
            <button type="button" className={`${wz.tab} ${customerMode === 'existing' ? wz.tabActive : ''}`} onClick={() => setCustomerMode('existing')}>Existing</button>
            <button type="button" className={`${wz.tab} ${customerMode === 'new' ? wz.tabActive : ''}`} onClick={() => setCustomerMode('new')}>New Customer</button>
          </div>

          {customerMode === 'existing' && (
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Search</label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-muted)' }} />
                  <input
                    className={styles.input}
                    style={{ paddingLeft: 34 }}
                    placeholder="Search by company, contact, phone or email…"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className={wz.searchResults}>
                {filteredCustomers.length === 0 && (
                  <div style={{ padding: '14px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    No customers match. Use the <strong>New Customer</strong> tab.
                  </div>
                )}
                {filteredCustomers.slice(0, 40).map((c) => (
                  <button key={c.id} type="button" className={wz.searchResult} onClick={() => { setSelectedCustomer(c.id); setSelectedUnit(''); }}>
                    <span>
                      <div className={wz.searchResultCompany}>{c.company || c.company_name}</div>
                      <div className={wz.searchResultMeta}>{[c.contact, c.phone, c.email].filter(Boolean).join(' · ')}</div>
                    </span>
                    {selectedCustomer === c.id && <Check size={16} color="var(--color-primary)" />}
                  </button>
                ))}
              </div>

              {selectedCustObj && (
                <div className={wz.selectedCard}>
                  <Building2 size={20} color="var(--color-primary)" />
                  <div>
                    <div className="name">{selectedCustObj.company || selectedCustObj.company_name}</div>
                    <div className="meta">
                      {[selectedCustObj.usdot ? `USDOT ${selectedCustObj.usdot}` : null, rate ? `Rate $${rate}/hr` : null, tax].filter(Boolean).join(' · ') || 'Selected customer'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {customerMode === 'new' && (
            <div className={styles.formSection}>
              <div className={wz.sectionLabel}>Company Information</div>
              <div className={wz.grid2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Company *</label>
                  <input
                    className={styles.input}
                    list="company-options"
                    placeholder="Select a company or type a new name…"
                    value={custForm.company}
                    onChange={(e) => setCustForm((f) => ({ ...f, company: e.target.value }))}
                  />
                  <datalist id="company-options">
                    {customers.map((c) => <option key={c.id} value={c.company || c.company_name || ''} />)}
                  </datalist>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>USDOT Number</label>
                  <input className={styles.input} placeholder="Enter USDOT number" value={custForm.usdot}
                    onChange={(e) => setCustForm((f) => ({ ...f, usdot: e.target.value }))} />
                </div>
              </div>

              <div className={wz.sectionLabel}>Contact</div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '-4px 0 10px' }}>
                Leave name blank to default to company. Enter a phone or email.
              </p>
              {custForm.contacts.map((c, i) => (
                <div className={wz.contactRow} key={i}>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.label}>Name</label>
                    <input className={styles.input} placeholder={custForm.company || 'e.g. John'} value={c.name}
                      onChange={(e) => updateContact(i, 'name', e.target.value)} />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.label}>Phone</label>
                    <input className={styles.input} placeholder="(xxx)-xxx-xxxx" value={c.phone}
                      onChange={(e) => updateContact(i, 'phone', e.target.value)} />
                  </div>
                  <div className={styles.formGroup} style={{ margin: 0 }}>
                    <label className={styles.label}>Email</label>
                    <input className={styles.input} placeholder="email@company.com" value={c.email}
                      onChange={(e) => updateContact(i, 'email', e.target.value)} />
                  </div>
                  {custForm.contacts.length > 1 && (
                    <button type="button" className={wz.iconBtn} aria-label="Remove contact"
                      onClick={() => setCustForm((f) => ({ ...f, contacts: f.contacts.filter((_, idx) => idx !== i) }))}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className={wz.ghostBtn}
                onClick={() => setCustForm((f) => ({ ...f, contacts: [...f.contacts, { ...EMPTY_CONTACT }] }))}>
                <Plus size={15} /> Add contact
              </button>

              <div className={wz.sectionLabel}>Billing Address</div>
              <div className={styles.formGroup} style={{ position: 'relative' }}>
                <label className={styles.label}>Street Address</label>
                <input className={styles.input} placeholder="Start typing address..." autoComplete="off"
                  value={custForm.street} onChange={(e) => setCustForm((f) => ({ ...f, street: e.target.value }))} />
                {addressSuggestions.length > 0 && (
                  <ul className={wz.suggestions}>
                    {addressSuggestions.map((s) => (
                      <li key={s.place_id}>
                        <button type="button" onClick={() => applyAddress(s)}>{s.display_name}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={wz.grid3}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>City</label>
                  <input className={styles.input} placeholder="City" value={custForm.city}
                    onChange={(e) => setCustForm((f) => ({ ...f, city: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>State</label>
                  <input className={styles.input} placeholder="ST" maxLength={4} value={custForm.state}
                    onChange={(e) => setCustForm((f) => ({ ...f, state: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>ZIP</label>
                  <input className={styles.input} placeholder="ZIP" value={custForm.zip}
                    onChange={(e) => setCustForm((f) => ({ ...f, zip: e.target.value }))} />
                </div>
              </div>

              <div className={wz.sectionLabel}>Billing Preferences</div>
              <div className={wz.grid3}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Customer Rate ($/hr){defaultShopRate ? ` — default $${defaultShopRate}` : ''}</label>
                  <input className={styles.input} type="number" step="0.01" value={custForm.labourRate}
                    onChange={(e) => setCustForm((f) => ({ ...f, labourRate: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Payment Terms</label>
                  <select className={styles.select} value={custForm.paymentTerms}
                    onChange={(e) => setCustForm((f) => ({ ...f, paymentTerms: e.target.value }))}>
                    <option>Net 30</option><option>Due Upon Receipt</option><option>Net 15</option><option>Net 60</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>PST No. / Tax Exemption #</label>
                  <input className={styles.input} placeholder="e.g. PST-1004-8921" value={custForm.pstNumber}
                    onChange={(e) => setCustForm((f) => ({ ...f, pstNumber: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — Vehicle */}
      {step === 2 && (
        <div className={styles.card}>
          <div className={wz.stepHead}>
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>Vehicle Information</h2>
            <label className={`${wz.partsToggle} ${partsInvoiceOnly ? wz.partsToggleOn : ''}`}>
              <input type="checkbox" checked={partsInvoiceOnly} onChange={(e) => setPartsInvoiceOnly(e.target.checked)} />
              Parts Invoice Only
            </label>
          </div>

          {!selectedCustomer && (
            <div className={wz.notice}>
              <AlertTriangle size={16} style={{ flex: 'none', marginTop: 1 }} />
              <span>No company selected yet. You can enter vehicle details now — a company is required before the job is created.</span>
            </div>
          )}

          {selectedCustomer && filteredTrucks.length > 0 && (
            <>
              <div className={wz.sectionLabel}>Existing Unit</div>
              <select className={styles.select} value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                <option value="">— Add a new vehicle below —</option>
                {filteredTrucks.map((t) => (
                  <option key={t.id} value={t.id}>#{t.unit_number} - {t.make} {t.model} {t.plate ? `(${t.plate})` : ''}</option>
                ))}
              </select>
              <div className={wz.sectionLabel}>{selectedUnit ? 'New vehicle (not used)' : 'Or add a new vehicle'}</div>
            </>
          )}

          <fieldset
            disabled={!!selectedUnit}
            style={{ border: 'none', padding: 0, margin: 0, opacity: selectedUnit ? 0.45 : 1 }}
          >
            <div className={wz.grid2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Unit Number *</label>
                <input
                  className={styles.input}
                  placeholder="Enter unit number"
                  value={unitForm.unitNumber}
                  onChange={(e) => setUnitForm((f) => ({ ...f, unitNumber: e.target.value }))}
                />
                <div className={wz.helperError}>Required — enter a unit number to attach this vehicle to the job.</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>VIN (17 characters)</label>
                <div className={wz.vinRow}>
                  <input
                    className={styles.input}
                    placeholder="VIN"
                    maxLength={17}
                    value={unitForm.vin}
                    onChange={(e) => { setUnitForm((f) => ({ ...f, vin: e.target.value.toUpperCase() })); setVinMsg(''); }}
                  />
                  <button type="button" className={wz.lookupBtn} onClick={lookupVIN} disabled={vinLoading}>
                    {vinLoading ? <Loader2 size={14} className={wz.spin} /> : null} Lookup
                  </button>
                </div>
                <div className={vinMsg ? wz.helper : wz.helper}>
                  {vinMsg || 'Enter the 17-character VIN — lookup can fill year, make, and model.'}
                </div>
              </div>
            </div>

            <div className={wz.grid3}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Year</label>
                <input className={styles.input} placeholder="Year" value={unitForm.year}
                  onChange={(e) => setUnitForm((f) => ({ ...f, year: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Make</label>
                <input className={styles.input} placeholder="Make" value={unitForm.make}
                  onChange={(e) => setUnitForm((f) => ({ ...f, make: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Model</label>
                <input className={styles.input} placeholder="Model" value={unitForm.model}
                  onChange={(e) => setUnitForm((f) => ({ ...f, model: e.target.value }))} />
              </div>
            </div>

            <div className={wz.sectionLabel}>Vehicle Type</div>
            <div className={wz.typeWrap}>
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${wz.typeChip} ${unitForm.vehicleType === t ? wz.typeChipOn : ''}`}
                  onClick={() => setUnitForm((f) => ({ ...f, vehicleType: f.vehicleType === t ? '' : t }))}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className={wz.typeHint}>Arrows loop through all types · scroll or click to select or deselect</div>

            <div className={wz.grid2} style={{ marginTop: 18 }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Odometer (kilometers)</label>
                <Odometer value={unitForm.odometer} onChange={(v) => setUnitForm((f) => ({ ...f, odometer: v }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>License Plate</label>
                <div className={wz.plateRow}>
                  <select className={styles.select} value={unitForm.plateState}
                    onChange={(e) => setUnitForm((f) => ({ ...f, plateState: e.target.value }))}>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input className={styles.input} placeholder="e.g. ABC1234" value={unitForm.plate}
                    onChange={(e) => setUnitForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))} />
                </div>
              </div>
            </div>

            <div className={wz.grid2} style={{ marginTop: 4 }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Engine Type (Optional)</label>
                <input className={styles.input} placeholder="e.g. Detroit DD15 / Cummins X15" value={unitForm.engine}
                  onChange={(e) => setUnitForm((f) => ({ ...f, engine: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Trailer (Optional)</label>
                <input className={styles.input} placeholder="Trailer #" value={trailer}
                  onChange={(e) => setTrailer(e.target.value)} />
              </div>
            </div>
          </fieldset>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className={styles.gridTwoCol}>
          <div className={styles.leftCol}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Issue Details</h2>
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Complaint / Reason for Service *</label>
                  <textarea className={styles.textarea} placeholder="Describe the customer's complaint or requested service..." value={complaint} onChange={(e) => setComplaint(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Internal Notes</label>
                  <textarea className={styles.textarea} placeholder="Notes visible only to shop staff..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Customer Notes</label>
                  <textarea className={styles.textarea} placeholder="Notes that will appear on the invoice..." value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
                </div>
              </div>
              <div className={styles.formSection}>
                <label className={styles.label}>Photos / Attachments</label>
                <div className={styles.uploadArea}>
                  <Upload size={24} style={{ color: 'var(--color-primary)', marginBottom: '8px' }} />
                  <p>Drag and drop photos here, or click to browse</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Settings</h2>
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Assign Technician</label>
                  <select className={styles.select} value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                    <option value="">Unassigned</option>
                    {technicians.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formSection}>
                <label className={styles.label}>Priority</label>
                <div className={styles.radioGroup} style={{ flexDirection: 'column' }}>
                  {['normal', 'high', 'emergency'].map((p) => (
                    <label className={styles.radioLabel} key={p}>
                      <input type="radio" name="priority" value={p} checked={priority === p} onChange={() => setPriority(p)} /> {p[0].toUpperCase() + p.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.formSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className={styles.label}>Breakdown / Emergency</span>
                  <label className={styles.toggleSwitch}>
                    <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={styles.label}>Roadside Call</span>
                  <label className={styles.toggleSwitch}>
                    <input type="checkbox" checked={isRoadside} onChange={(e) => setIsRoadside(e.target.checked)} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.card} style={{ marginTop: '1.5rem' }}>
              <h2 className={styles.cardTitle}>Customer Authorization</h2>
              <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                <label className={styles.radioLabel}>
                  <input type="checkbox" checked={isAuthorized} onChange={(e) => setIsAuthorized(e.target.checked)} /> I authorize the repair work and diagnostic steps.
                </label>
              </div>
              <div className={styles.signatureBox}>Digital Sign Authorized</div>
            </div>
          </div>
        </div>
      )}

      {/* footer nav */}
      <div className={wz.wizardFooter}>
        <button type="button" className="btn btn-outline" onClick={goBack} disabled={step === 1} style={{ opacity: step === 1 ? .5 : 1 }}>
          <ChevronLeft size={16} /> Back
        </button>
        <div className={wz.footerRight}>
          {step < 3 ? (
            <button type="button" className="btn btn-primary" onClick={goNext} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
              <Save size={18} /> {isLoading ? 'Creating...' : 'Create Job'}
            </button>
          )}
        </div>
      </div>

      {/* ---- Send Intake Link dialog ---- */}
      {showIntake && (
        <div className={wz.overlay} onClick={(e) => { if (e.target === e.currentTarget) setShowIntake(false); }}>
          <div className={wz.dialog}>
            <div className={wz.dialogHead}>
              <h2><Link2 size={18} color="var(--color-primary)" /> Send Intake Form</h2>
              <button onClick={() => setShowIntake(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <p className={wz.dialogSub}>Generate a secure link for the customer to fill in their own company, contact, vehicle and billing details.</p>

            {intakeError && <div style={{ color: '#B91C1C', fontSize: '13px', marginBottom: '10px' }}>{intakeError}</div>}

            <div className={styles.formGroup}>
              <label className={styles.label}>Customer name</label>
              <input className={styles.input} value={intakeName} onChange={(e) => setIntakeName(e.target.value)} placeholder="e.g. Mark Johnson" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Send to email (optional)</label>
              <input className={styles.input} type="email" value={intakeEmail} onChange={(e) => setIntakeEmail(e.target.value)} placeholder="dispatch@company.com" />
            </div>

            {intakeLink ? (
              <>
                <div className={wz.linkBox}>
                  <input readOnly value={intakeLink} onFocus={(e) => e.target.select()} />
                  <button type="button" className="btn btn-outline" onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                    {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={wz.badge}>Link ready</span>
                  <a href={intakeLink} target="_blank" rel="noreferrer" style={{ fontSize: '12.5px', color: 'var(--color-primary)', fontWeight: 600 }}>Open preview →</a>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowIntake(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={generateIntakeLink} disabled={intakeLoading} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {intakeLoading ? <><Loader2 size={16} /> Generating…</> : <><Send size={16} /> Generate link</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
