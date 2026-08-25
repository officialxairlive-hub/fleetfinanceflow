'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, MapPin, Mail, Phone, CreditCard, Percent, FileText, Settings, History, Plus, X, Truck } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import styles from '../customers.module.css';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id;
  
  const [customer, setCustomer] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('fleet');

  // Add Unit State
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [savingUnit, setSavingUnit] = useState(false);
  const [unitForm, setUnitForm] = useState({
    unitNumber: '',
    vin: '',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2022,
    mileage: 185000,
    engine: 'Detroit DD15'
  });
  
  useEffect(() => {
    async function fetchCustomerDetails() {
      setIsLoading(true);
      try {
        const [custRes, fleetRes, woRes, invRes] = await Promise.all([
          supabase.from('customers').select('*').eq('id', customerId).single(),
          supabase.from('units').select('*').eq('customer_id', customerId),
          supabase.from('work_orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
          supabase.from('invoices').select('*').eq('customer_id', customerId).order('issue_date', { ascending: false })
        ]);

        if (custRes.error) throw custRes.error;

        setCustomer({
          ...custRes.data,
          company: custRes.data.company_name,
          contact: custRes.data.contact_name,
          creditLimit: custRes.data.credit_limit,
          paymentTerms: custRes.data.payment_terms,
          taxSetting: custRes.data.tax_setting,
          labourRate: custRes.data.custom_labour_rate,
          partsMarkup: custRes.data.custom_parts_markup,
          createdAt: custRes.data.created_at
        });
        
        setFleet((fleetRes.data || []).map(u => ({
          ...u,
          unitNumber: u.unit_number,
          nextPM: u.next_pm
        })));
        
        setWorkOrders((woRes.data || []).map(wo => ({
          ...wo,
          unitDisplay: wo.unit_display,
          techName: wo.tech_name,
          estimatedCost: wo.estimated_cost,
          createdAt: wo.created_at,
          updatedAt: wo.updated_at
        })));
        
        setInvoices((invRes.data || []).map(inv => ({
          ...inv,
          issueDate: inv.issue_date,
          dueDate: inv.due_date,
          paymentDate: inv.payment_date
        })));
      } catch (err) {
        console.error("Error fetching customer details:", err);
        setError(err.message || 'Failed to load customer details from Supabase.');
      } finally {
        setIsLoading(false);
      }
    }

    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!unitForm.unitNumber.trim()) return;

    setSavingUnit(true);
    try {
      const { data, error } = await supabase
        .from('units')
        .insert([{
          customer_id: customerId,
          unit_number: unitForm.unitNumber,
          vin: unitForm.vin,
          make: unitForm.make,
          model: unitForm.model,
          year: parseInt(unitForm.year) || 2022,
          mileage: parseInt(unitForm.mileage) || 0,
          engine: unitForm.engine,
          status: 'in_service'
        }])
        .select()
        .single();

      if (error) throw error;

      setFleet(prev => [data, ...prev]);
      setShowAddUnitModal(false);
      setUnitForm({
        unitNumber: '',
        vin: '',
        make: 'Freightliner',
        model: 'Cascadia',
        year: 2022,
        mileage: 185000,
        engine: 'Detroit DD15'
      });
      alert('Fleet unit added successfully!');
    } catch (err) {
      alert(`Error creating unit: ${err.message}`);
    } finally {
      setSavingUnit(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-CA');
  };

  if (isLoading) {
    return <div className={styles.container} style={{ padding: '3rem', textAlign: 'center' }}>Loading customer details...</div>;
  }

  if (error || !customer) {
    return (
      <div className={styles.container}>
        <Link href="/dashboard/customers" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Customers
        </Link>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'red' }}>{error || 'Customer not found'}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/dashboard/customers" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Customers
      </Link>
      
      <div className={styles.detailHeader}>
        <div>
          <div className={styles.customerTitle}>
            <h1>{customer.company}</h1>
            <span className={`${styles.statusPill} ${styles[customer.status] || styles.inactive}`}>
              {customer.status}
            </span>
            <span style={{fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'3px 6px', borderRadius:'10px', alignSelf: 'center'}}>SUPABASE</span>
          </div>
          <p className={styles.customerSubtitle}>
            <span>{customer.contact}</span>
            <span>Customer since {formatDate(customer.createdAt)}</span>
          </p>
        </div>
        <button className={styles.btnOutline}>
          <Edit2 size={16} /> Edit Customer
        </button>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <h3>Contact Details</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><MapPin size={14} style={{display:'inline', marginRight: 4}}/> Address</span>
              <span className={styles.infoValue}>{customer.address || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><Mail size={14} style={{display:'inline', marginRight: 4}}/> Email</span>
              <span className={styles.infoValue}>{customer.email || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><Phone size={14} style={{display:'inline', marginRight: 4}}/> Phone</span>
              <span className={styles.infoValue}>{customer.phone || '-'}</span>
            </div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <h3>Financial Terms</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><CreditCard size={14} style={{display:'inline', marginRight: 4}}/> Credit Limit</span>
              <span className={styles.infoValue}>{formatCurrency(customer.creditLimit)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Balance</span>
              <span className={`${styles.infoValue} ${(customer.balance || 0) > 0 ? styles.overdue : ''}`}>
                {formatCurrency(customer.balance)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Terms</span>
              <span className={styles.infoValue}>{customer.paymentTerms || '-'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Tax</span>
              <span className={styles.infoValue}>{customer.taxSetting || '-'}</span>
            </div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <h3>Rate Settings</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><Settings size={14} style={{display:'inline', marginRight: 4}}/> Custom Labour Rate</span>
              <span className={styles.infoValue}>{formatCurrency(customer.labourRate)} /hr</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}><Percent size={14} style={{display:'inline', marginRight: 4}}/> Custom Parts Markup</span>
              <span className={styles.infoValue}>{customer.partsMarkup || 0}%</span>
            </div>
          </div>
          <h3 style={{ marginTop: '1rem' }}>Notes</h3>
          <textarea 
            className={styles.notesArea} 
            defaultValue={customer.notes || ''}
            placeholder="Add customer notes here..."
          />
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'fleet' ? styles.active : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          Fleet ({fleet.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'workOrders' ? styles.active : ''}`}
          onClick={() => setActiveTab('workOrders')}
        >
          Work Orders ({workOrders.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'invoices' ? styles.active : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices ({invoices.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Service History
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'fleet' && (
          <div className={styles.tableContainer} style={{ border: 'none', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowAddUnitModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Add Fleet Unit
              </button>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Unit #</th>
                  <th>VIN</th>
                  <th>Make / Model</th>
                  <th>Year</th>
                  <th>Mileage</th>
                  <th>Next PM</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {fleet.length > 0 ? fleet.map(truck => (
                  <tr key={truck.id}>
                    <td data-label="Unit #"><strong>{truck.unitNumber || truck.unit_number}</strong></td>
                    <td data-label="VIN"><small>{truck.vin || '-'}</small></td>
                    <td data-label="Make / Model">{truck.make} {truck.model}</td>
                    <td data-label="Year">{truck.year || '-'}</td>
                    <td data-label="Mileage">{(truck.mileage || 0).toLocaleString()} km</td>
                    <td data-label="Next PM">
                      {truck.nextPM ? (
                        <div>
                          {truck.nextPM.type}<br/>
                          <small style={{ color: truck.nextPM.urgency === 'overdue' ? '#DC2626' : 'var(--color-text-secondary)' }}>
                            Due in {truck.nextPM.dueIn}
                          </small>
                        </div>
                      ) : 'PM A (Due 30d)'}
                    </td>
                    <td data-label="Status">
                      <span className={`${styles.statusPill} ${truck.status === 'ready' || truck.status === 'active' || truck.status === 'in_service' ? styles.active : styles.inactive}`}>
                        {truck.status?.replace('_', ' ') || 'Active'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>No fleet units registered for this customer yet. Click "Add Fleet Unit" to register one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'workOrders' && (
          <div className={styles.tableContainer} style={{ border: 'none', boxShadow: 'none' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>WO #</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Tech</th>
                  <th>Date</th>
                  <th>Est. Total</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.length > 0 ? workOrders.map(wo => (
                  <tr key={wo.id}>
                    <td data-label="WO #">
                      <Link href={`/dashboard/jobs/${wo.id}`}><strong>{wo.id}</strong></Link>
                    </td>
                    <td data-label="Unit">{wo.unitDisplay?.split(' - ')[0]}</td>
                    <td data-label="Status">
                      <span className={`${styles.statusPill} ${styles[wo.status] || styles.inactive}`}>
                        {wo.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td data-label="Tech">{wo.techName || 'Unassigned'}</td>
                    <td data-label="Date">{formatDate(wo.createdAt)}</td>
                    <td data-label="Est. Total">{formatCurrency(wo.estimatedCost)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No work orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className={styles.tableContainer} style={{ border: 'none', boxShadow: 'none' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>INV #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Paid Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? invoices.map(inv => (
                  <tr key={inv.id}>
                    <td data-label="INV #">
                      <Link href={`/dashboard/invoices/${inv.id}`}><strong>{inv.id}</strong></Link>
                    </td>
                    <td data-label="Date">{formatDate(inv.issueDate)}</td>
                    <td data-label="Due Date">{formatDate(inv.dueDate)}</td>
                    <td data-label="Amount">{formatCurrency(inv.total)}</td>
                    <td data-label="Status">
                      <span className={`${styles.statusPill} ${inv.status === 'paid' ? styles.active : (inv.status === 'overdue' ? styles.overdue : styles.inactive)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td data-label="Paid Date">{formatDate(inv.paymentDate)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No invoices found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <History size={24} color="var(--color-text-secondary)" />
              <h3 style={{ margin: 0 }}>Recent Service History</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {workOrders.filter(wo => wo.status === 'invoiced' || wo.status === 'paid' || wo.status === 'ready_invoice').length > 0 ? 
                workOrders.filter(wo => wo.status === 'invoiced' || wo.status === 'paid' || wo.status === 'ready_invoice').map(wo => (
                <div key={wo.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{wo.unitDisplay}</strong>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{formatDate(wo.updatedAt)}</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}><strong>Issue:</strong> {wo.complaint || 'No complaint specified'}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}><strong>Resolution:</strong> {wo.correction || 'No correction recorded'}</p>
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>No completed service history available.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Fleet Unit Modal */}
      {showAddUnitModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            borderRadius: '12px',
            width: '480px',
            maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--color-primary)" />
                Add Fleet Unit to {customer.company}
              </h2>
              <button 
                onClick={() => setShowAddUnitModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUnit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Unit # (Required)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 2049"
                    value={unitForm.unitNumber}
                    onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    VIN
                  </label>
                  <input
                    type="text"
                    placeholder="1FUJGLDR8ML..."
                    value={unitForm.vin}
                    onChange={(e) => setUnitForm({ ...unitForm, vin: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Make
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Freightliner"
                    value={unitForm.make}
                    onChange={(e) => setUnitForm({ ...unitForm, make: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cascadia"
                    value={unitForm.model}
                    onChange={(e) => setUnitForm({ ...unitForm, model: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    value={unitForm.year}
                    onChange={(e) => setUnitForm({ ...unitForm, year: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Mileage (km)
                  </label>
                  <input
                    type="number"
                    value={unitForm.mileage}
                    onChange={(e) => setUnitForm({ ...unitForm, mileage: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddUnitModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingUnit}
                >
                  {savingUnit ? 'Saving Unit...' : 'Save Fleet Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
