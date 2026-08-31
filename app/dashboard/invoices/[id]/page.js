'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { shopSettings } from '../../../lib/demoData';
import { Mail, DollarSign, Printer, CheckCircle, X, ArrowLeft } from 'lucide-react';
import styles from '../invoices.module.css';

export default function InvoiceDetail() {
  const params = useParams();
  const invoiceId = params.id;
  
  const shop = shopSettings;

  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'Credit Card',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  const [logoUrl, setLogoUrl] = useState(null);
  const [logoPreferences, setLogoPreferences] = useState({
    showLogoOnInvoices: true,
    logoAlignment: 'left',
    logoSize: 'medium'
  });

  useEffect(() => {
    // 1. Instant check from localStorage
    if (typeof window !== 'undefined') {
      const localLogo = localStorage.getItem('shop_invoice_logo');
      const localPrefs = localStorage.getItem('shop_invoice_preferences');
      if (localLogo) setLogoUrl(localLogo);
      if (localPrefs) {
        try {
          setLogoPreferences(prev => ({ ...prev, ...JSON.parse(localPrefs) }));
        } catch (_) {}
      }
    }

    // 2. Cloud storage fetch
    async function fetchLogo() {
      try {
        const res = await fetch('/api/settings/logo');
        if (res.ok) {
          const data = await res.json();
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.preferences) setLogoPreferences(prev => ({ ...prev, ...data.preferences }));
        }
      } catch (err) {
        console.warn('Could not fetch invoice logo:', err);
      }
    }
    fetchLogo();
  }, []);

  useEffect(() => {
    async function fetchInvoiceDetails() {
      setIsLoading(true);
      try {
        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        if (invError) throw invError;
        
        setInvoice({
          ...invData,
          issueDate: invData.issue_date,
          dueDate: invData.due_date,
          amount: invData.total
        });
        
        setPaymentForm(prev => ({ ...prev, amount: invData.total }));

        if (invData.customer_id) {
          const { data: custData, error: custError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', invData.customer_id)
            .single();
            
          if (custError) throw custError;
          setCustomer({
            ...custData,
            companyName: custData.company_name,
            contactName: custData.contact_name
          });
        }
      } catch (err) {
        console.error("Error fetching invoice details:", err);
        setError(err.message || 'Failed to load invoice from Supabase.');
      } finally {
        setIsLoading(false);
      }
    }

    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const handleQuickMarkPaid = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      setInvoice(prev => ({ ...prev, status: 'paid', paid_date: today, paidDate: today }));
      
      const { error: invErr } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_date: today })
        .eq('id', invoiceId);
        
      if (invErr) throw invErr;

      if (invoice?.work_order_id) {
        await supabase
          .from('work_orders')
          .update({ status: 'paid' })
          .eq('id', invoice.work_order_id);
      }

      alert(`✅ Invoice #${invoiceId} marked as PAID!`);
    } catch (err) {
      alert(`Error marking invoice paid: ${err.message}`);
      setInvoice(prev => ({ ...prev, status: 'draft' }));
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const paymentNotes = `Paid via ${paymentForm.method} on ${paymentForm.date}${paymentForm.reference ? ` (Ref: ${paymentForm.reference})` : ''}${paymentForm.notes ? ` - ${paymentForm.notes}` : ''}`;
      
      setInvoice(prev => ({ 
        ...prev, 
        status: 'paid', 
        paid_date: paymentForm.date, 
        paidDate: paymentForm.date,
        notes: prev.notes ? `${prev.notes}\n${paymentNotes}` : paymentNotes 
      }));
      setShowPaymentModal(false);
      
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          paid_date: paymentForm.date,
          notes: invoice?.notes ? `${invoice.notes}\n${paymentNotes}` : paymentNotes 
        })
        .eq('id', invoiceId);
        
      if (error) throw error;

      if (invoice?.work_order_id) {
        await supabase
          .from('work_orders')
          .update({ status: 'paid' })
          .eq('id', invoice.work_order_id);
      }

      alert(`✅ Payment of $${paymentForm.amount} recorded via ${paymentForm.method}!`);
    } catch (err) {
      alert(`Error recording payment: ${err.message}`);
      setInvoice(prev => ({ ...prev, status: 'draft' }));
    }
  };

  if (isLoading) {
    return <div className={styles.container} style={{ padding: '3rem', textAlign: 'center' }}>Loading invoice details...</div>;
  }

  if (error || !invoice) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'red' }}>{error || 'Invoice not found'}</h2>
          <Link href="/dashboard/invoices" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Invoices</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/invoices" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '8px' }}>
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 className={styles.title}>Invoice {invoice.id}</h1>
          <span style={{fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'3px 6px', borderRadius:'10px', alignSelf: 'center'}}>SUPABASE</span>
        </div>
      </div>

      <div className={styles.detailLayout}>
        <div className={styles.invoicePaper}>
          {/* Header */}
          <div className={styles.invHeader} style={{ flexDirection: logoPreferences.logoAlignment === 'right' ? 'row-reverse' : 'row' }}>
            <div className={styles.companyInfoArea}>
              {logoUrl && logoPreferences.showLogoOnInvoices && (
                <div className={styles.invoiceLogoContainer}>
                  <img
                    src={logoUrl}
                    alt="Shop Logo"
                    className={styles.invoiceLogoImg}
                    style={{
                      maxHeight: logoPreferences.logoSize === 'small' ? '50px' : logoPreferences.logoSize === 'large' ? '90px' : '70px'
                    }}
                  />
                </div>
              )}
              <div className={styles.companyInfo}>
                <h2>{shop.companyName}</h2>
                <p>{shop.address}</p>
                <p>{shop.phone} | {shop.email}</p>
                <p>{shop.taxNumber}</p>
              </div>
            </div>
            <div className={styles.invMeta}>
              <h1 className={styles.invTitle}>INVOICE</h1>
              <div className={styles.metaGrid}>
                <div className={styles.metaLabel}>Invoice #:</div>
                <div className={styles.metaValue}>{invoice.id}</div>
                <div className={styles.metaLabel}>Date:</div>
                <div className={styles.metaValue}>{new Date(invoice.issueDate || Date.now()).toLocaleDateString()}</div>
                <div className={styles.metaLabel}>Due Date:</div>
                <div className={styles.metaValue}>{new Date(invoice.dueDate || Date.now()).toLocaleDateString()}</div>
                <div className={styles.metaLabel}>Status:</div>
                <div className={styles.metaValue}>
                  <span className={`${styles.pill} ${styles[invoice.status?.toLowerCase()] || ''}`} style={{ textTransform: 'capitalize' }}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer / Bill To */}
          <div className={styles.billToSection}>
            <div className={styles.billTo}>
              <h3>BILL TO</h3>
              <p className={styles.customerName}>{customer?.company || customer?.companyName || 'Valued Fleet Customer'}</p>
              <p>{customer?.contact_name || customer?.contactName || ''}</p>
              <p>{customer?.address || ''}</p>
              <p>{customer?.email || ''}</p>
              <p>{customer?.phone || ''}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className={styles.lineTable}>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{textAlign: 'right'}}>Amount ($ CAD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>General Labour - Diagnostic</td>
                <td className={styles.right}>2.5</td>
                <td className={styles.right}>$125.00</td>
                <td className={styles.right}>$312.50</td>
              </tr>
              <tr>
                <td>Brake Pads - Heavy Duty</td>
                <td className={styles.right}>4</td>
                <td className={styles.right}>$85.00</td>
                <td className={styles.right}>$340.00</td>
              </tr>
              <tr>
                <td>Shop Supplies</td>
                <td className={styles.right}>1</td>
                <td className={styles.right}>$25.00</td>
                <td className={styles.right}>$25.00</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>${((invoice.amount || 0) / (1 + shop.taxRate / 100)).toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Tax ({shop.taxRate}%)</span>
              <span>${((invoice.amount || 0) - ((invoice.amount || 0) / (1 + shop.taxRate / 100))).toFixed(2)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grand}`}>
              <span>TOTAL</span>
              <span>${Number(invoice.amount || 0).toFixed(2)}</span>
            </div>
            {invoice.status === 'paid' && (
              <div className={styles.totalRow}>
                <span>Amount Paid</span>
                <span>-${Number(invoice.amount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className={styles.totalRow} style={{fontWeight: 600}}>
              <span>Balance Due</span>
              <span>${invoice.status === 'paid' ? '0.00' : Number(invoice.amount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.notes}>
            <p><strong>Payment Terms:</strong> Net 30</p>
            <p>Please make cheques payable to {shop.companyName}. Thank you for your business!</p>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>Actions</h3>
              <button 
                className="btn btn-outline" 
                style={{width: '100%', justifyContent: 'flex-start'}}
                onClick={() => alert(`Invoice #${invoice.id} emailed to customer.`)}
              >
                <Mail size={18} /> Email Invoice
              </button>
              <button 
                className="btn btn-primary" 
                style={{width: '100%', justifyContent: 'flex-start'}}
                onClick={() => setShowPaymentModal(true)}
                disabled={invoice.status === 'paid'}
              >
                <DollarSign size={18} /> Record Payment
              </button>
              <button 
                className="btn btn-outline" 
                style={{width: '100%', justifyContent: 'flex-start'}}
                onClick={() => window.print()}
              >
                <Printer size={18} /> Print PDF
              </button>
                <button 
                  className="btn btn-outline" 
                  style={{
                    width: '100%', 
                    justifyContent: 'flex-start', 
                    color: invoice.status === 'paid' ? 'var(--color-text-secondary)' : '#10b981', 
                    borderColor: invoice.status === 'paid' ? 'var(--color-border)' : '#10b981'
                  }} 
                  disabled={invoice.status === 'paid'}
                  onClick={handleQuickMarkPaid}
                >
                  <CheckCircle size={18} /> {invoice.status === 'paid' ? '✓ Paid in Full' : 'Mark as Paid'}
                </button>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Record Payment</h3>
              <button className={styles.closeBtn} onClick={() => setShowPaymentModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select 
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                >
                  <option>Credit Card</option>
                  <option>EFT</option>
                  <option>Cheque</option>
                  <option>Cash</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Date</label>
                <input 
                  type="date" 
                  value={paymentForm.date}
                  onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Reference #</label>
                <input 
                  type="text" 
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})}
                  placeholder="e.g. Cheque #, Trx ID"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Notes (Optional)</label>
                <textarea 
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
