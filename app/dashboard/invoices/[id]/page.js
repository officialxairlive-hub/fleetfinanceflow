'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { invoices, customers, shopSettings } from '../../../lib/demoData';
import { Mail, DollarSign, Printer, CheckCircle, X } from 'lucide-react';
import styles from '../invoices.module.css';

export default function InvoiceDetail() {
  const params = useParams();
  const invoiceId = params.id;
  
  const invoice = invoices.find(i => i.id === invoiceId) || invoices[0];
  const customer = customers.find(c => c.id === invoice?.customerId) || customers[0];
  const shop = shopSettings;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: invoice?.amount || 0,
    method: 'Credit Card',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  if (!invoice) return <div>Invoice not found</div>;

  const handleRecordPayment = (e) => {
    e.preventDefault();
    // Simulate recording payment
    alert(`Payment of $${paymentForm.amount} recorded!`);
    setShowPaymentModal(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Invoice {invoice.id}</h1>
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
                <div className={styles.metaValue}>{new Date(invoice.issueDate).toLocaleDateString()}</div>
                <div className={styles.metaLabel}>Due Date:</div>
                <div className={styles.metaValue}>{new Date(invoice.dueDate).toLocaleDateString()}</div>
                <div className={styles.metaLabel}>Status:</div>
                <div className={styles.metaValue}>
                  <span className={`${styles.pill} ${styles[invoice.status.toLowerCase()]}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className={styles.billTo}>
            <h3>Bill To</h3>
            <strong>{customer.companyName}</strong>
            <p>Attn: {customer.contactName}</p>
            <p>{customer.email}</p>
            <p>{customer.phone}</p>
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
              {/* Dummy Items for demo */}
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
              <span>$677.50</span>
            </div>
            <div className={styles.totalRow}>
              <span>Tax ({shop.taxRate}%)</span>
              <span>${(677.5 * (shop.taxRate / 100)).toFixed(2)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grand}`}>
              <span>TOTAL</span>
              <span>${invoice.amount.toFixed(2)}</span>
            </div>
            {invoice.status === 'paid' && (
              <div className={styles.totalRow}>
                <span>Amount Paid</span>
                <span>-${invoice.amount.toFixed(2)}</span>
              </div>
            )}
            <div className={styles.totalRow} style={{fontWeight: 600}}>
              <span>Balance Due</span>
              <span>${invoice.status === 'paid' ? '0.00' : invoice.amount.toFixed(2)}</span>
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
