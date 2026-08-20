'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Search, Eye, Send, CheckCircle, Printer } from 'lucide-react';
import styles from './invoices.module.css';

export default function InvoicesList() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchInvoices() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, customers(company)')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setInvoices(data || []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError(err.message || 'Failed to fetch data from Supabase');
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  // Calculate KPIs
  const totalOutstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + (i.total || 0), 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (i.total || 0), 0);
  const paidThisMonth = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0); // Simplified for demo
  const avgInvoice = invoices.length ? invoices.reduce((sum, i) => sum + (i.total || 0), 0) / invoices.length : 0;

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
        <h1 className={styles.title}>Invoices</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Total Outstanding</div>
          <div className={styles.kpiValue}>${isLoading ? '...' : totalOutstanding.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Overdue Amount</div>
          <div className={`${styles.kpiValue} ${styles.danger}`}>${isLoading ? '...' : overdueAmount.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Paid This Month</div>
          <div className={styles.kpiValue}>${isLoading ? '...' : paidThisMonth.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Average Invoice</div>
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
                <th>Amount</th>
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
                      {inv.customers?.company || 'Unknown Customer'}
                      <span style={{marginLeft:'8px', fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'2px 6px', borderRadius:'12px'}}>SUPABASE</span>
                    </td>
                    <td>${Number(inv.total).toFixed(2)}</td>
                    <td>
                      <span className={`${styles.statusPill} ${styles[inv.status]}`}>
                        {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : ''}
                      </span>
                    </td>
                    <td>{inv.issue_date || '-'}</td>
                    <td>{inv.due_date || '-'}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/dashboard/invoices/${inv.id}`} className={styles.iconBtn} title="View Invoice">
                          <Eye size={18} />
                        </Link>
                        <button className={styles.iconBtn} title="Print">
                          <Printer size={18} />
                        </button>
                        {inv.status !== 'paid' && (
                          <button className={styles.iconBtn} title="Send to Customer">
                            <Send size={18} />
                          </button>
                        )}
                        {inv.status === 'sent' && (
                          <button className={styles.iconBtn} title="Mark Paid" style={{color: 'var(--color-success)'}}>
                            <CheckCircle size={18} />
                          </button>
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
    </div>
  );
}
