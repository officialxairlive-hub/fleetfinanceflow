'use client';

import { useState } from 'react';
import Link from 'next/link';
import { invoices } from '../../lib/demoData';
import { Plus, Search, Eye, Send, CheckCircle, Printer } from 'lucide-react';
import styles from './invoices.module.css';

export default function InvoicesList() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Calculate KPIs
  const totalOutstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);
  const paidThisMonth = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0); // Simplified for demo
  const avgInvoice = invoices.length ? invoices.reduce((sum, i) => sum + i.total, 0) / invoices.length : 0;

  const filteredInvoices = invoices.filter(inv => {
    if (filter !== 'All' && inv.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (search) {
      const s = search.toLowerCase();
      return inv.id.toLowerCase().includes(s) || (inv.customer || inv.customerId).toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Invoices</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Total Outstanding</div>
          <div className={styles.kpiValue}>${totalOutstanding.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Overdue Amount</div>
          <div className={`${styles.kpiValue} ${styles.danger}`}>${overdueAmount.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Paid This Month</div>
          <div className={styles.kpiValue}>${paidThisMonth.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Average Invoice</div>
          <div className={styles.kpiValue}>${avgInvoice.toFixed(2)}</div>
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
                <th>Amount</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className={inv.status === 'overdue' ? styles.overdue : ''}>
                  <td><strong>{inv.id}</strong></td>
                  <td>{inv.customer}</td>
                  <td>${inv.total.toFixed(2)}</td>
                  <td>
                    <span className={`${styles.pill} ${styles[inv.status.toLowerCase()]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/dashboard/invoices/${inv.id}`}>
                        <button className={styles.actionBtn} title="View"><Eye size={18}/></button>
                      </Link>
                      <button className={styles.actionBtn} title="Send"><Send size={18}/></button>
                      {inv.status !== 'paid' && <button className={styles.actionBtn} title="Mark Paid"><CheckCircle size={18}/></button>}
                      <button className={styles.actionBtn} title="Print"><Printer size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: 'var(--space-8)'}}>No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
