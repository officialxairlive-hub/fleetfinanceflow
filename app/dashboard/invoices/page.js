'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Search, Eye, Send, CheckCircle, Printer, X, Receipt } from 'lucide-react';
import styles from './invoices.module.css';

export default function InvoicesList() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [invoices, setInvoices] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState('');
  const [savingInvoice, setSavingInvoice] = useState(false);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const [invRes, woRes, custRes] = await Promise.all([
        supabase.from('invoices').select('*, customers(company)').order('created_at', { ascending: false }),
        supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('company')
      ]);
        
      if (invRes.error) throw invRes.error;
      setInvoices(invRes.data || []);
      setWorkOrders(woRes.data || []);
      setCustomers(custRes.data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.message || 'Failed to fetch data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleMarkPaid = async (inv) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Optimistic update
      setInvoices(prev => prev.map(item => item.id === inv.id ? { ...item, status: 'paid', paid_date: today } : item));

      const { error: invErr } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_date: today })
        .eq('id', inv.id);

      if (invErr) throw invErr;

      if (inv.work_order_id) {
        await supabase
          .from('work_orders')
          .update({ status: 'paid' })
          .eq('id', inv.work_order_id);
      }

      alert(`✅ Invoice #${inv.id} marked as PAID!`);
    } catch (err) {
      alert(`Error marking invoice paid: ${err.message}`);
      fetchInvoices();
    }
  };

  const handleSendInvoice = async (inv) => {
    try {
      setInvoices(prev => prev.map(item => item.id === inv.id ? { ...item, status: 'sent' } : item));
      await supabase.from('invoices').update({ status: 'sent' }).eq('id', inv.id);
      alert(`✅ Invoice #${inv.id} marked as SENT and queued for customer.`);
    } catch (err) {
      alert(`Error sending invoice: ${err.message}`);
    }
  };

  const handleCreateInvoiceFromWO = async (e) => {
    e.preventDefault();
    if (!selectedWoId) {
      alert('Please select a work order to invoice.');
      return;
    }

    setSavingInvoice(true);
    try {
      const wo = workOrders.find(w => w.id === selectedWoId);
      const invId = `INV-${wo.id.replace('WO-', '')}`;
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

      const labourList = wo.labour || [];
      const partsList = wo.parts || [];
      const labourTotal = labourList.reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
      const partsTotal = partsList.reduce((sum, p) => sum + ((p.quantity || 0) * (p.sellPrice || p.price || 0)), 0);
      const shopSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
      const subtotal = labourTotal + partsTotal + shopSupplies;
      const tax = subtotal * 0.05;
      const total = wo.estimated_cost || (subtotal + tax);

      const { error: insertErr } = await supabase
        .from('invoices')
        .upsert([{
          id: invId,
          customer_id: wo.customer_id,
          work_order_id: wo.id,
          total: total,
          tax_amount: tax,
          labour_total: labourTotal,
          parts_total: partsTotal,
          shop_supplies: shopSupplies,
          status: 'draft',
          issue_date: today,
          due_date: dueDate
        }]);

      if (insertErr) throw insertErr;

      await supabase.from('work_orders').update({ status: 'invoiced' }).eq('id', wo.id);

      alert(`✅ Invoice #${invId} created successfully!`);
      setShowCreateModal(false);
      setSelectedWoId('');
      fetchInvoices();
    } catch (err) {
      alert(`Error creating invoice: ${err.message}`);
    } finally {
      setSavingInvoice(false);
    }
  };

  // Calculate KPIs
  const totalOutstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'draft').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const paidThisMonth = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const avgInvoice = invoices.length ? invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0) / invoices.length : 0;

  const filteredInvoices = invoices.filter(inv => {
    if (filter !== 'All' && inv.status?.toLowerCase() !== filter.toLowerCase()) return false;
    if (search) {
      const s = search.toLowerCase();
      const companyName = inv.customers?.company || '';
      return inv.id?.toLowerCase().includes(s) || companyName.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices & Billing</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
            Generate invoices, track receivables, record payments, and manage shop revenue in CAD
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Total Outstanding (CAD)</div>
          <div className={styles.kpiValue}>${isLoading ? '...' : totalOutstanding.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Overdue Amount (CAD)</div>
          <div className={`${styles.kpiValue} ${styles.danger}`}>${isLoading ? '...' : overdueAmount.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Paid / Collected (CAD)</div>
          <div className={styles.kpiValue} style={{ color: '#10b981' }}>${isLoading ? '...' : paidThisMonth.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Average Invoice (CAD)</div>
          <div className={styles.kpiValue}>${isLoading ? '...' : avgInvoice.toFixed(2)}</div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map(tab => (
            <button 
              key={tab}
              className={`${styles.tab} ${filter === tab ? styles.active : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by INV# or Customer..."
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
                <th>INV#</th>
                <th>Customer</th>
                <th>Amount ($ CAD)</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading data from Supabase...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                    <strong>Data fetch failed:</strong> {error}
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className={inv.status === 'overdue' ? styles.overdue : ''}>
                    <td><strong>{inv.id}</strong></td>
                    <td>
                      {inv.customers?.company || 'Fleet Customer'}
                      <span style={{marginLeft:'8px', fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'2px 6px', borderRadius:'12px'}}>SUPABASE</span>
                    </td>
                    <td><strong>${Number(inv.total || 0).toFixed(2)}</strong></td>
                    <td>
                      <span className={`${styles.statusPill} ${styles[inv.status]}`}>
                        {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : 'Draft'}
                      </span>
                    </td>
                    <td>{inv.issue_date || '-'}</td>
                    <td>{inv.due_date || '-'}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/dashboard/invoices/${inv.id}`} className={styles.iconBtn} title="View Invoice">
                          <Eye size={18} />
                        </Link>
                        <button className={styles.iconBtn} title="Print Invoice" onClick={() => window.print()}>
                          <Printer size={18} />
                        </button>
                        {inv.status !== 'paid' && (
                          <button className={styles.iconBtn} title="Send to Customer" onClick={() => handleSendInvoice(inv)}>
                            <Send size={18} />
                          </button>
                        )}
                        {inv.status !== 'paid' ? (
                          <button 
                            className={styles.iconBtn} 
                            title="Mark as Paid" 
                            style={{ color: '#10b981' }}
                            onClick={() => handleMarkPaid(inv)}
                          >
                            <CheckCircle size={18} />
                          </button>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 'bold' }}>✓ Paid</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--color-primary)" />
                Create Invoice from Work Order
              </h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceFromWO}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Select Completed / Active Work Order *
                </label>
                <select
                  required
                  value={selectedWoId}
                  onChange={(e) => setSelectedWoId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Choose Work Order...</option>
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.customer_name || 'Customer'} ({wo.unit_display || 'Unit'}) · ${Number(wo.estimated_cost || 0).toFixed(2)} CAD [{wo.status}]
                    </option>
                  ))}
                </select>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  This will generate a formal invoice matching the labor lines, parts, shop supplies, and taxes calculated in the work order.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingInvoice}>
                  {savingInvoice ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
