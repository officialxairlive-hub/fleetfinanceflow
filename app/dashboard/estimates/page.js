'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Search, Eye, Send, FilePlus, X, Calculator, CheckCircle2, ExternalLink, Clock, DollarSign, Wrench } from 'lucide-react';
import styles from './estimates.module.css';

export default function EstimatesList() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [estimates, setEstimates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingEstimate, setSavingEstimate] = useState(false);
  const [estimateForm, setEstimateForm] = useState({
    customerId: '',
    unitId: '',
    description: '',
    labourHours: '2.5',
    labourRate: '145.00',
    partsTotal: '350.00',
    notes: 'Valid for 14 days from date of issue.'
  });

  // Quick Customer Inline State
  const [showQuickCust, setShowQuickCust] = useState(false);
  const [savingQuickCust, setSavingQuickCust] = useState(false);
  const [quickCustForm, setQuickCustForm] = useState({
    company: '',
    contactName: '',
    phone: '',
    email: ''
  });

  // Quick Unit Inline State
  const [showQuickUnit, setShowQuickUnit] = useState(false);
  const [savingQuickUnit, setSavingQuickUnit] = useState(false);
  const [quickUnitForm, setQuickUnitForm] = useState({
    unitNumber: '',
    make: 'Freightliner',
    model: 'Cascadia',
    year: '2023',
    vin: ''
  });

  // View / Detail Modal State
  const [viewEstimate, setViewEstimate] = useState(null);

  const handleSaveQuickCustomer = async (e) => {
    e.preventDefault();
    if (!quickCustForm.company.trim()) {
      alert('Please enter a company name.');
      return;
    }
    setSavingQuickCust(true);
    try {
      const newCustId = `cust-${Date.now().toString().slice(-4)}`;
      const newCust = {
        id: newCustId,
        company: quickCustForm.company.trim(),
        contact: quickCustForm.contactName.trim() || 'Fleet Contact',
        phone: quickCustForm.phone.trim() || '(403) 555-0199',
        email: quickCustForm.email.trim() || 'dispatch@fleet.com',
        status: 'active',
        payment_terms: 'Net 30'
      };

      const { data, error } = await supabase.from('customers').insert([newCust]).select().single();
      if (error) throw error;

      const added = data || newCust;
      setCustomers(prev => [added, ...prev]);
      setEstimateForm(prev => ({ ...prev, customerId: added.id, unitId: '' }));
      setShowQuickCust(false);
      setQuickCustForm({ company: '', contactName: '', phone: '', email: '' });
      alert(`✅ Customer "${added.company}" added and selected!`);
    } catch (err) {
      alert(`Error adding customer: ${err.message}`);
    } finally {
      setSavingQuickCust(false);
    }
  };

  const handleSaveQuickUnit = async (e) => {
    e.preventDefault();
    if (!quickUnitForm.unitNumber.trim()) {
      alert('Please enter a unit number.');
      return;
    }
    if (!estimateForm.customerId) {
      alert('Please select a customer first to assign this unit.');
      return;
    }
    setSavingQuickUnit(true);
    try {
      const newUnitId = `trk-${Date.now().toString().slice(-4)}`;
      const newUnit = {
        id: newUnitId,
        customer_id: estimateForm.customerId,
        unit_number: quickUnitForm.unitNumber.trim(),
        make: quickUnitForm.make.trim() || 'Freightliner',
        model: quickUnitForm.model.trim() || 'Cascadia',
        year: parseInt(quickUnitForm.year) || 2023,
        vin: quickUnitForm.vin.trim() || `1FUJGLDR${Date.now().toString().slice(-8)}`,
        status: 'active'
      };

      const { data, error } = await supabase.from('units').insert([newUnit]).select().single();
      if (error) throw error;

      const added = data || newUnit;
      setUnits(prev => [added, ...prev]);
      setEstimateForm(prev => ({ ...prev, unitId: added.id }));
      setShowQuickUnit(false);
      setQuickUnitForm({ unitNumber: '', make: 'Freightliner', model: 'Cascadia', year: '2023', vin: '' });
      alert(`✅ Unit #${added.unit_number} added and selected!`);
    } catch (err) {
      alert(`Error adding unit: ${err.message}`);
    } finally {
      setSavingQuickUnit(false);
    }
  };

  const fetchEstimatesAndData = async () => {
    setIsLoading(true);
    try {
      const [woRes, custRes, unitRes] = await Promise.all([
        supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('company'),
        supabase.from('units').select('*').order('unit_number')
      ]);

      if (woRes.error) throw woRes.error;
      
      setCustomers(custRes.data || []);
      setUnits(unitRes.data || []);

      const estList = (woRes.data || []).map(wo => {
        const labourList = wo.labour || [];
        const partsList = wo.parts || [];
        const labourTotal = labourList.reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
        const partsTotal = partsList.reduce((sum, p) => sum + ((p.quantity || 0) * (p.sellPrice || p.price || 0)), 0);
        const totalCalc = wo.estimated_cost || (labourTotal + partsTotal ? (labourTotal + partsTotal) * 1.05 : 1250.00);

        let estStatus = 'draft';
        if (wo.status === 'pending_owner_approval') estStatus = 'pending_owner_approval';
        else if (wo.status === 'diagnosing') estStatus = 'sent';
        else if (wo.authorized || wo.status === 'ready_to_invoice' || wo.status === 'repairing' || wo.status === 'completed' || wo.status === 'invoiced' || wo.status === 'paid') estStatus = 'approved';

        return {
          id: `EST-${wo.id.replace('WO-', '')}`,
          woId: wo.id,
          customer_id: wo.customer_id,
          customer_name: wo.customer_name || 'Fleet Customer',
          unit: wo.unit_display || 'Unit',
          description: wo.complaint || 'Diagnostic & Service Estimate',
          labourTotal,
          partsTotal,
          total: totalCalc,
          status: estStatus,
          rawStatus: wo.status,
          techName: wo.tech_name || 'Shop Assigned',
          needsOwnerApproval: wo.status === 'pending_owner_approval',
          createdAt: wo.created_at,
          expiresAt: new Date(new Date(wo.created_at).getTime() + 14*24*60*60*1000).toISOString()
        };
      });

      setEstimates(estList);
    } catch (err) {
      console.error("Error fetching estimates:", err);
      setError(err.message || 'Failed to fetch estimates from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimatesAndData();
  }, []);

  const handleCreateEstimate = async (e) => {
    e.preventDefault();
    if (!estimateForm.customerId || !estimateForm.description.trim()) {
      alert('Please select a customer and provide a description.');
      return;
    }

    setSavingEstimate(true);
    try {
      const cust = customers.find(c => c.id === estimateForm.customerId);
      const selectedUnit = units.find(u => u.id === estimateForm.unitId);
      
      const newWoId = `WO-${Date.now().toString().slice(-4)}`;
      const hoursNum = parseFloat(estimateForm.labourHours) || 0;
      const rateNum = parseFloat(estimateForm.labourRate) || 145.00;
      const partsNum = parseFloat(estimateForm.partsTotal) || 0;
      
      const labourTotal = hoursNum * rateNum;
      const supplies = Math.min((labourTotal + partsNum) * 0.05, 50);
      const subtotal = labourTotal + partsNum + supplies;
      const total = subtotal * 1.05;

      const payload = {
        id: newWoId,
        customer_id: estimateForm.customerId,
        customer_name: cust ? (cust.company || cust.company_name) : 'Fleet Customer',
        unit_id: estimateForm.unitId || null,
        unit_display: selectedUnit ? `#${selectedUnit.unit_number} - ${selectedUnit.make} ${selectedUnit.model}` : 'Shop Unit',
        complaint: estimateForm.description,
        status: 'draft',
        estimated_cost: total,
        customer_notes: estimateForm.notes,
        labour: [{
          description: estimateForm.description,
          hours: hoursNum,
          rate: rateNum,
          technician: 'Shop Assigned'
        }],
        parts: partsNum > 0 ? [{
          partNumber: 'EST-PARTS',
          description: 'Estimated replacement parts & materials',
          quantity: 1,
          sellPrice: partsNum,
          cost: partsNum * 0.7
        }] : []
      };

      const { error: insertErr } = await supabase.from('work_orders').insert([payload]);
      if (insertErr) throw insertErr;

      alert(`Estimate #${newWoId.replace('WO-', 'EST-')} created successfully!`);
      setShowCreateModal(false);
      setEstimateForm({
        customerId: '',
        unitId: '',
        description: '',
        labourHours: '2.5',
        labourRate: '145.00',
        partsTotal: '350.00',
        notes: 'Valid for 14 days from date of issue.'
      });
      fetchEstimatesAndData();
    } catch (err) {
      alert(`Error creating estimate: ${err.message}`);
    } finally {
      setSavingEstimate(false);
    }
  };

  const handleOwnerApproveAndSend = async (est) => {
    try {
      await supabase
        .from('work_orders')
        .update({ 
          status: 'diagnosing'
        })
        .eq('id', est.woId);

      const approveLink = `${window.location.origin}/approve/${est.woId}`;
      navigator.clipboard?.writeText(approveLink);
      alert(`✅ Owner Approval Granted! Estimate #${est.id} is now approved and dispatched.\n\nCustomer Live Approval Link copied to clipboard:\n${approveLink}`);
      fetchEstimatesAndData();
    } catch (err) {
      alert(`Error approving estimate: ${err.message}`);
    }
  };

  const handleSendEstimate = async (est) => {
    try {
      await supabase.from('work_orders').update({ status: 'diagnosing' }).eq('id', est.woId);
      const approveLink = `${window.location.origin}/approve/${est.woId}`;
      navigator.clipboard?.writeText(approveLink);
      alert(`✅ Estimate approval link copied to clipboard:\n${approveLink}\n\nStatus marked as SENT to customer.`);
      fetchEstimatesAndData();
    } catch (err) {
      alert(`Error sending estimate: ${err.message}`);
    }
  };

  const handleCopyCustomerLink = (est) => {
    const approveLink = `${window.location.origin}/approve/${est.woId}`;
    navigator.clipboard?.writeText(approveLink);
    alert(`📋 Customer live tracking & approval link copied to clipboard:\n${approveLink}`);
  };

  const handleConvertToWorkOrder = async (est) => {
    try {
      await supabase.from('work_orders').update({ status: 'repairing' }).eq('id', est.woId);
      alert(`Estimate converted to active Repair Order #${est.woId}!`);
      router.push(`/dashboard/jobs/${est.woId}`);
    } catch (err) {
      alert(`Error converting estimate: ${err.message}`);
    }
  };

  const pendingShopReviewCount = estimates.filter(e => e.status === 'pending_owner_approval').length;

  const filteredEstimates = estimates.filter(est => {
    if (filter === 'Pending Owner Review') return est.status === 'pending_owner_approval';
    if (filter !== 'All' && est.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (search) {
      const s = search.toLowerCase();
      return est.id.toLowerCase().includes(s) || 
             (est.customer_name || '').toLowerCase().includes(s) || 
             (est.unit || '').toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Estimates & Quotes</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
            Multi-tier estimate drafting, owner authorization review, digital customer approval, and RO conversion
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Create Estimate
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          {['All', 'Pending Owner Review', 'Draft', 'Sent', 'Approved'].map(tab => (
            <button 
              key={tab}
              className={`${styles.tab} ${filter === tab ? styles.active : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
              {tab === 'Pending Owner Review' && pendingShopReviewCount > 0 && (
                <span style={{ marginLeft: '6px', backgroundColor: '#f59e0b', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>
                  {pendingShopReviewCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by EST#, Customer, or Unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div style={{overflowX: 'auto'}}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>EST#</th>
                <th>Customer</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Total ($ CAD)</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading estimates from Supabase...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'red' }}>{error}</td>
                </tr>
              ) : filteredEstimates.length > 0 ? (
                filteredEstimates.map(est => (
                  <tr key={est.id}>
                    <td>
                      <strong>{est.id}</strong>
                      <span style={{marginLeft:'6px', fontSize:'9px', background:'var(--color-primary)', color:'white', padding:'2px 4px', borderRadius:'4px'}}>SUPABASE</span>
                    </td>
                    <td>{est.customer_name}</td>
                    <td>{est.unit}</td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{est.description}</td>
                    <td><strong>${est.total.toFixed(2)}</strong></td>
                    <td>
                      {est.status === 'pending_owner_approval' ? (
                        <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ⚡ Pending Owner Review
                        </span>
                      ) : (
                        <span className={`${styles.pill} ${styles[est.status.toLowerCase()] || ''}`} style={{ textTransform: 'capitalize' }}>
                          {est.status}
                        </span>
                      )}
                    </td>
                    <td>{new Date(est.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(est.expiresAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions} style={{ display: 'flex', gap: '6px' }}>
                        {est.status === 'pending_owner_approval' ? (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f59e0b', borderColor: '#f59e0b' }} 
                            title="Approve Tech Estimate & Dispatch to Customer"
                            onClick={() => handleOwnerApproveAndSend(est)}
                          >
                            <CheckCircle2 size={13} /> Approve & Send
                          </button>
                        ) : (
                          <button className={styles.actionBtn} title="Copy Digital Approval Link & Mark Sent" onClick={() => handleSendEstimate(est)}>
                            <Send size={17}/>
                          </button>
                        )}
                        <button className={styles.actionBtn} title="Copy Customer Live Link" onClick={() => handleCopyCustomerLink(est)}>
                          <ExternalLink size={17} color="var(--color-primary)"/>
                        </button>
                        <button className={styles.actionBtn} title="View Estimate Breakdown" onClick={() => setViewEstimate(est)}>
                          <Eye size={17}/>
                        </button>
                        <button className={styles.actionBtn} title="Convert to Active Work Order" onClick={() => handleConvertToWorkOrder(est)}>
                          <FilePlus size={17} color="#10b981"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{textAlign: 'center', padding: 'var(--space-8)'}}>No estimates found. Click "+ Create Estimate" to generate a quote.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Estimate Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={20} color="var(--color-primary)" />
                Create Service Estimate
              </h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEstimate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>Customer *</label>
                      <button
                        type="button"
                        onClick={() => { setShowQuickCust(!showQuickCust); setShowQuickUnit(false); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        {showQuickCust ? '✕ Cancel' : '+ Add Customer'}
                      </button>
                    </div>
                    <select
                      required
                      value={estimateForm.customerId}
                      onChange={(e) => setEstimateForm({ ...estimateForm, customerId: e.target.value, unitId: '' })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    >
                      <option value="">Select Customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.company || c.company_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', margin: 0 }}>Unit / Truck</label>
                      {estimateForm.customerId && (
                        <button
                          type="button"
                          onClick={() => { setShowQuickUnit(!showQuickUnit); setShowQuickCust(false); }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                          {showQuickUnit ? '✕ Cancel' : '+ Add Unit'}
                        </button>
                      )}
                    </div>
                    <select
                      value={estimateForm.unitId}
                      onChange={(e) => setEstimateForm({ ...estimateForm, unitId: e.target.value })}
                      disabled={!estimateForm.customerId}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    >
                      <option value="">Select Unit...</option>
                      {units.filter(u => u.customer_id === estimateForm.customerId).map(u => (
                        <option key={u.id} value={u.id}>#{u.unit_number} - {u.make} {u.model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Inline Quick Customer Creation Box */}
                {showQuickCust && (
                  <div style={{ backgroundColor: 'rgba(37, 99, 255, 0.05)', border: '1px solid rgba(37, 99, 255, 0.25)', borderRadius: '8px', padding: '12px', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                      ⚡ Quick Add New Fleet Customer
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="Company Name *"
                        value={quickCustForm.company}
                        onChange={(e) => setQuickCustForm({ ...quickCustForm, company: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                      <input
                        type="text"
                        placeholder="Contact Person Name"
                        value={quickCustForm.contactName}
                        onChange={(e) => setQuickCustForm({ ...quickCustForm, contactName: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={quickCustForm.phone}
                        onChange={(e) => setQuickCustForm({ ...quickCustForm, phone: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={quickCustForm.email}
                        onChange={(e) => setQuickCustForm({ ...quickCustForm, email: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button type="button" onClick={() => setShowQuickCust(false)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '11px' }}>Cancel</button>
                      <button type="button" onClick={handleSaveQuickCustomer} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px' }} disabled={savingQuickCust}>
                        {savingQuickCust ? 'Saving...' : 'Save & Select Customer'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Quick Unit Creation Box */}
                {showQuickUnit && (
                  <div style={{ backgroundColor: 'rgba(37, 99, 255, 0.05)', border: '1px solid rgba(37, 99, 255, 0.25)', borderRadius: '8px', padding: '12px', marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '8px' }}>
                      ⚡ Quick Add Unit / Vehicle to Selected Customer
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="Unit # (e.g. 104) *"
                        value={quickUnitForm.unitNumber}
                        onChange={(e) => setQuickUnitForm({ ...quickUnitForm, unitNumber: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                      <input
                        type="text"
                        placeholder="Make (e.g. Peterbilt)"
                        value={quickUnitForm.make}
                        onChange={(e) => setQuickUnitForm({ ...quickUnitForm, make: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                      <input
                        type="text"
                        placeholder="Model (e.g. 579)"
                        value={quickUnitForm.model}
                        onChange={(e) => setQuickUnitForm({ ...quickUnitForm, model: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="number"
                        placeholder="Year (e.g. 2024)"
                        value={quickUnitForm.year}
                        onChange={(e) => setQuickUnitForm({ ...quickUnitForm, year: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                      <input
                        type="text"
                        placeholder="VIN / Serial Number (Optional)"
                        value={quickUnitForm.vin}
                        onChange={(e) => setQuickUnitForm({ ...quickUnitForm, vin: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button type="button" onClick={() => setShowQuickUnit(false)} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '11px' }}>Cancel</button>
                      <button type="button" onClick={handleSaveQuickUnit} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px' }} disabled={savingQuickUnit}>
                        {savingQuickUnit ? 'Saving...' : 'Save & Select Unit'}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Scope of Work / Description *</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="e.g. Diagnostic scan, complete brake replacement on drive axle, and air system pressure test."
                    value={estimateForm.description}
                    onChange={(e) => setEstimateForm({ ...estimateForm, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  ></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Est. Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      value={estimateForm.labourHours}
                      onChange={(e) => setEstimateForm({ ...estimateForm, labourHours: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Rate ($ CAD/hr)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="145.00"
                      value={estimateForm.labourRate}
                      onChange={(e) => setEstimateForm({ ...estimateForm, labourRate: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Parts Total ($ CAD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="350.00"
                      value={estimateForm.partsTotal}
                      onChange={(e) => setEstimateForm({ ...estimateForm, partsTotal: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Estimate Terms / Validity</label>
                  <input
                    type="text"
                    value={estimateForm.notes}
                    onChange={(e) => setEstimateForm({ ...estimateForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingEstimate}>
                  {savingEstimate ? 'Creating...' : 'Save & Generate Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Estimate Modal */}
      {viewEstimate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Estimate {viewEstimate.id}</h2>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Tied to RO #{viewEstimate.woId}</span>
              </div>
              <button onClick={() => setViewEstimate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-surface)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Customer:</span>
                <strong>{viewEstimate.customer_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Unit / Vehicle:</span>
                <strong>{viewEstimate.unit}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Status:</span>
                <span className={`${styles.pill} ${styles[viewEstimate.status.toLowerCase()] || ''}`} style={{ textTransform: 'capitalize' }}>
                  {viewEstimate.status}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Scope of Work</span>
              <p style={{ margin: 0, padding: '10px', backgroundColor: 'var(--color-surface)', borderRadius: '6px', fontSize: '13px' }}>
                {viewEstimate.description}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span>Estimated Total:</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-primary)' }}>${viewEstimate.total.toFixed(2)} CAD</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Includes estimated technician labor, required parts, supplies & 5% GST.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <Link 
                href={`/approve/${viewEstimate.woId}`} 
                target="_blank" 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <ExternalLink size={15} /> Open Approval Portal
              </Link>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => {
                  handleConvertToWorkOrder(viewEstimate);
                  setViewEstimate(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <FilePlus size={15} /> Convert to Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
