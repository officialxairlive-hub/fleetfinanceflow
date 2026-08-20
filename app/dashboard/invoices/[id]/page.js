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

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      // Optimistic update
      setInvoice(prev => ({ ...prev, status: 'paid' }));
      setShowPaymentModal(false);
      
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid', payment_date: paymentForm.date })
        .eq('id', invoiceId);
        
      if (error) throw error;
      alert(`Payment of $${paymentForm.amount} recorded!`);
    } catch (err) {
      alert(`Error recording payment: ${err.message}`);
      // Revert optimistic update
      setInvoice(prev => ({ ...prev, status: 'unpaid' }));
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
          <div className={styles.invHeader}>
            <div className={styles.companyInfo}>
              <h2>{shop.companyName}</h2>
              <p>{shop.address}</p>
              <p>{shop.phone} | {shop.email}</p>
              <p>{shop.taxNumber}</p>
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
                  <span className={`${styles.pill} ${styles[invoice.status?.toLowerCase()] || ''}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className={styles.billTo}>
            <h3>Bill To</h3>
            <strong>{customer?.companyName || 'Unknown Company'}</strong>
            <p>Attn: {customer?.contactName || 'N/A'}</p>
            <p>{customer?.email || 'N/A'}</p>
            <p>{customer?.phone || 'N/A'}</p>
          </div>

          {/* Items */}
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Description</th>
                <th className={styles.right}>Qty/Hrs</th>
                <th className={styles.right}>Rate</th>
                <th className={styles.right}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Dummy Items for demo, this should theoretically come from invoice line items */}
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
            <div className={styles.actionList}>
              <button className="btn btn-outline" style={{width: '100%', justifyContent: 'flex-start'}}>
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
              <button className="btn btn-outline" style={{width: '100%', justifyContent: 'flex-start'}}>
                <Printer size={18} /> Print PDF
              </button>
              <button className="btn btn-outline" style={{width: '100%', justifyContent: 'flex-start'}} disabled={invoice.status === 'paid'}>
                <CheckCircle size={18} /> Mark as Paid
              </button>
            </div>
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
