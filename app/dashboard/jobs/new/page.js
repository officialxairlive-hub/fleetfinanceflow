'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, ArrowLeft, Save } from 'lucide-react';
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
    : [];

  const handleCustomerChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomer(custId);
    setSelectedUnit('');
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
            <h2 className={styles.cardTitle}>Customer & Unit</h2>
            <div className={styles.formSection}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Customer</label>
                  <select className={styles.select} value={selectedCustomer} onChange={handleCustomerChange} required>
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company || c.company_name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unit/Truck</label>
                  <select className={styles.select} value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} disabled={!selectedCustomer}>
                    <option value="">Select Unit...</option>
                    {filteredTrucks.map(t => (
                      <option key={t.id} value={t.id}>#{t.unit_number} - {t.make} {t.model}</option>
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
    </div>
  );
}
