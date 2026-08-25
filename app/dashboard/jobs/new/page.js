'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, ArrowLeft, Save, Plus, X, Truck, UserPlus, Building2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import styles from '../jobs.module.css';

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [units, setUnits] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [trailer, setTrailer] = useState('');
  const [complaint, setComplaint] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isRoadside, setIsRoadside] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quick Add Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    company: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: 'Net 30'
  });

  // Quick Add Unit Modal
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    vin: '',
    make: 'Freightliner',
    model: 'Cascadia',
    year: '2023',
    plate: '',
    mileage: '185000',
    engine: 'Detroit DD15'
  });

  useEffect(() => {
    async function loadFormData() {
      try {
        const [cRes, uRes, tRes] = await Promise.all([
          supabase.from('customers').select('*').order('company'),
          supabase.from('units').select('*'),
          supabase.from('technicians').select('*')
        ]);
        
        setCustomers(cRes.data || []);
        setUnits(uRes.data || []);
        setTechnicians(tRes.data || []);
      } catch (err) {
        console.error("Error loading dropdown data:", err);
      }
    }
    loadFormData();
  }, []);

  const filteredTrucks = selectedCustomer
    ? units.filter(u => u.customer_id === selectedCustomer)
    : units;

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomer(custId);
    setSelectedUnit('');
  };

  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.company.trim()) return;

    setSavingCustomer(true);
    try {
      const newCustId = `CUST-${Date.now().toString().slice(-4)}`;
      const payload = {
        id: newCustId,
        company: customerForm.company,
        company_name: customerForm.company,
        contact: customerForm.contact || 'Fleet Manager',
        contact_name: customerForm.contact || 'Fleet Manager',
        phone: customerForm.phone,
        email: customerForm.email,
        address: customerForm.address,
        payment_terms: customerForm.paymentTerms,
        balance: 0,
        status: 'active'
      };

      const { data, error: custErr } = await supabase
        .from('customers')
        .insert([payload])
        .select()
        .single();

      if (custErr) throw custErr;

      const createdCust = data || payload;
      setCustomers(prev => [...prev, createdCust]);
      setSelectedCustomer(createdCust.id);
      setShowAddCustomerModal(false);
      setCustomerForm({
        company: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: 'Net 30'
      });
      alert(`Customer "${createdCust.company}" added and selected!`);
    } catch (err) {
      alert(`Error creating customer: ${err.message}`);
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleQuickAddUnit = async (e) => {
    e.preventDefault();
    if (!unitForm.unitNumber.trim()) return;

    if (!selectedCustomer) {
      alert('Please select or add a customer first before assigning a unit.');
      return;
    }

    setSavingUnit(true);
    try {
      const newUnitId = `UNIT-${Date.now().toString().slice(-4)}`;
      const payload = {
        id: newUnitId,
        customer_id: selectedCustomer,
        unit_number: unitForm.unitNumber,
        vin: unitForm.vin,
        make: unitForm.make,
        model: unitForm.model,
        year: parseInt(unitForm.year) || 2023,
        plate: unitForm.plate,
        mileage: parseInt(unitForm.mileage) || 0,
        engine_type: unitForm.engine,
        status: 'active'
      };

      const { data, error: unitErr } = await supabase
        .from('units')
        .insert([payload])
        .select()
        .single();

      if (unitErr) throw unitErr;

      const createdUnit = data || payload;
      setUnits(prev => [...prev, createdUnit]);
      setSelectedUnit(createdUnit.id);
      setShowAddUnitModal(false);
      setUnitForm({
        unitNumber: '',
        vin: '',
        make: 'Freightliner',
        model: 'Cascadia',
        year: '2023',
        plate: '',
        mileage: '185000',
        engine: 'Detroit DD15'
      });
      alert(`Unit #${createdUnit.unit_number} (${createdUnit.make} ${createdUnit.model}) added and selected!`);
    } catch (err) {
      alert(`Error creating unit: ${err.message}`);
    } finally {
      setSavingUnit(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !complaint.trim()) {
      setError('Please select a customer and enter a complaint description.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const custObj = customers.find(c => c.id === selectedCustomer);
      const unitObj = units.find(u => u.id === selectedUnit);
      const techObj = technicians.find(t => t.id === selectedTech);

      const newWoId = `WO-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data, error: insertErr } = await supabase
        .from('work_orders')
        .insert([{
          id: newWoId,
          customer_id: selectedCustomer,
          customer_name: custObj?.company || custObj?.company_name || 'Customer',
          unit_id: selectedUnit || null,
          unit_display: unitObj ? `#${unitObj.unit_number} - ${unitObj.make} ${unitObj.model}` : 'Unassigned Unit',
          trailer: trailer || null,
          complaint: complaint,
          internal_notes: internalNotes || null,
          customer_notes: customerNotes || null,
          tech_id: selectedTech || null,
          tech_name: techObj ? (techObj.full_name || techObj.name) : null,
          priority: priority,
          is_emergency: isEmergency,
          is_roadside: isRoadside,
          authorized: isAuthorized,
          status: 'new',
          labour: [],
          parts: [],
          photos: [],
          estimated_cost: 0,
          margin: 65.0
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      router.push(`/dashboard/jobs/${data.id}`);
    } catch (err) {
      console.error("Error creating work order:", err);
      setError(err.message || 'Failed to create work order.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard/jobs" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '8px' }}>
            <ArrowLeft size={16} /> Back to Work Orders
          </Link>
          <h1>Create Work Order</h1>
          <p>Live Supabase RO Dispatch</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className="btn btn-outline" onClick={() => router.push('/dashboard/jobs')}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            <Save size={18} />
            {isLoading ? 'Creating...' : 'Create Work Order'}
          </button>
        </div>
      </header>

      {error && <div style={{ color: 'red', padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.gridTwoCol}>
        <div className={styles.leftCol}>
          {/* Customer & Unit Info */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>Customer & Unit</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Building2 size={13} /> + New Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedCustomer) {
                      alert('Please select or create a customer first before adding a truck!');
                      return;
                    }
                    setShowAddUnitModal(true);
                  }}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Truck size={13} /> + New Unit
                </button>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className={styles.label} style={{ margin: 0 }}>Customer *</label>
                  </div>
                  <select className={styles.select} value={selectedCustomer} onChange={handleCustomerChange} required>
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company || c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className={styles.label} style={{ margin: 0 }}>Unit / Truck</label>
                  </div>
                  <select className={styles.select} value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} disabled={!selectedCustomer}>
                    <option value="">{selectedCustomer ? (filteredTrucks.length > 0 ? 'Select Unit...' : 'No units for this customer — click "+ New Unit"') : 'Select Customer First'}</option>
                    {filteredTrucks.map(t => (
                      <option key={t.id} value={t.id}>#{t.unit_number} - {t.make} {t.model} {t.plate ? `(${t.plate})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Trailer (Optional)</label>
                  <input type="text" className={styles.input} placeholder="Trailer #" value={trailer} onChange={(e) => setTrailer(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div className={styles.card} style={{ marginTop: '1.5rem' }}>
            <h2 className={styles.cardTitle}>Issue Details</h2>
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Complaint / Reason for Service</label>
                <textarea className={styles.textarea} placeholder="Describe the customer's complaint or requested service..." value={complaint} onChange={(e) => setComplaint(e.target.value)} required></textarea>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Internal Notes</label>
                <textarea className={styles.textarea} placeholder="Notes visible only to shop staff..." value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)}></textarea>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Customer Notes</label>
                <textarea className={styles.textarea} placeholder="Notes that will appear on the invoice..." value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)}></textarea>
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
          {/* Assignment & Settings */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Settings</h2>
            
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Assign Technician</label>
                <select className={styles.select} value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
                  <option value="">Unassigned</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name || t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.label}>Priority</label>
              <div className={styles.radioGroup} style={{ flexDirection: 'column' }}>
                <label className={styles.radioLabel}>
                  <input type="radio" name="priority" value="normal" checked={priority === 'normal'} onChange={() => setPriority('normal')} /> Normal
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="priority" value="high" checked={priority === 'high'} onChange={() => setPriority('high')} /> High
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="priority" value="emergency" checked={priority === 'emergency'} onChange={() => setPriority('emergency')} /> Emergency
                </label>
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

          {/* Authorization */}
          <div className={styles.card} style={{ marginTop: '1.5rem' }}>
            <h2 className={styles.cardTitle}>Customer Authorization</h2>
            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
              <label className={styles.radioLabel}>
                <input type="checkbox" checked={isAuthorized} onChange={(e) => setIsAuthorized(e.target.checked)} /> I authorize the repair work and diagnostic steps.
              </label>
            </div>
            <div className={styles.signatureBox}>
              Digital Sign Authorized
            </div>
          </div>
        </div>
      </form>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="var(--color-primary)" />
                Quick Add New Customer
              </h2>
              <button onClick={() => setShowAddCustomerModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Company / Fleet Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bison Transport West"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Mark Johnson"
                      value={customerForm.contact}
                      onChange={(e) => setCustomerForm({ ...customerForm, contact: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. (403) 555-0188"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. dispatch@bisontransport.ca"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Payment Terms</label>
                    <select
                      value={customerForm.paymentTerms}
                      onChange={(e) => setCustomerForm({ ...customerForm, paymentTerms: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    >
                      <option>Net 30</option>
                      <option>Due Upon Receipt</option>
                      <option>Net 15</option>
                      <option>Net 60</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 5200 64th Ave SE, Calgary, AB"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddCustomerModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingCustomer}>
                  {savingCustomer ? 'Adding...' : 'Save & Select Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Unit Modal */}
      {showAddUnitModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--color-primary)" />
                Quick Add Unit / Truck
              </h2>
              <button onClick={() => setShowAddUnitModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAddUnit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Unit / Fleet # *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Unit 2049"
                      value={unitForm.unitNumber}
                      onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>License Plate</label>
                    <input
                      type="text"
                      placeholder="e.g. AB-8921"
                      value={unitForm.plate}
                      onChange={(e) => setUnitForm({ ...unitForm, plate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Year</label>
                    <input
                      type="number"
                      placeholder="2023"
                      value={unitForm.year}
                      onChange={(e) => setUnitForm({ ...unitForm, year: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Make</label>
                    <input
                      type="text"
                      placeholder="Freightliner"
                      value={unitForm.make}
                      onChange={(e) => setUnitForm({ ...unitForm, make: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Model</label>
                    <input
                      type="text"
                      placeholder="Cascadia"
                      value={unitForm.model}
                      onChange={(e) => setUnitForm({ ...unitForm, model: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>VIN (17 Digits)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1FUJGLDR5NLAA9821"
                      value={unitForm.vin}
                      onChange={(e) => setUnitForm({ ...unitForm, vin: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Mileage (km)</label>
                    <input
                      type="number"
                      placeholder="185000"
                      value={unitForm.mileage}
                      onChange={(e) => setUnitForm({ ...unitForm, mileage: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Engine Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Detroit DD15 / Cummins X15"
                    value={unitForm.engine}
                    onChange={(e) => setUnitForm({ ...unitForm, engine: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddUnitModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingUnit}>
                  {savingUnit ? 'Adding...' : 'Save & Select Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
