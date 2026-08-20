'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import styles from './customers.module.css';
import { Search, Plus, X } from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Data state
  const [customers, setCustomers] = useState([]);
  const [metrics, setMetrics] = useState({ fleetUnits: 0, activeWOs: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch customers
        const { data: customersData, error: custErr } = await supabase
          .from('customers')
          .select('*')
          .order('company');
        
        if (custErr) throw custErr;
        setCustomers(customersData || []);

        // Fetch metrics (total units)
        const { count: unitCount } = await supabase
          .from('units')
          .select('*', { count: 'exact', head: true });

        // Fetch metrics (active WOs)
        const { count: woCount } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .not('status', 'in', '("completed","ready_invoice","invoiced","paid")');

        setMetrics({
          fleetUnits: unitCount || 0,
          activeWOs: woCount || 0
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || 'Failed to fetch data from Supabase');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter customers
  const filteredCustomers = customers.filter(c => 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  // Derived metrics from customers array
  const totalCustomers = customers.length;
  const outstandingBalance = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Customers & Fleet</h1>
        <div className={styles.actions}>
          <div className={styles.search}>
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
            />
          </div>
          <button className={styles.btnPrimary} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Customer
          </button>
        </div>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <h3>Total Customers</h3>
          <p className={styles.value}>{isLoading ? '...' : totalCustomers}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Total Fleet Units</h3>
          <p className={styles.value}>{isLoading ? '...' : metrics.fleetUnits}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Outstanding Balance</h3>
          <p className={styles.value}>{isLoading ? '...' : formatCurrency(outstandingBalance)}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Active Work Orders</h3>
          <p className={styles.value}>{isLoading ? '...' : metrics.activeWOs}</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Fleet Size</th>
              <th>Balance</th>
              <th>Terms</th>
              <th>Status</th>
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
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id} onClick={() => router.push(`/dashboard/customers/${customer.id}`)}>
                  <td data-label="Company">
                    {customer.company}
                    {customer.company.includes('[LIVE]') && <span style={{marginLeft:'8px', fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'2px 6px', borderRadius:'12px'}}>SUPABASE</span>}
                  </td>
                  <td data-label="Contact">{customer.contact}<br/><small style={{color: 'var(--color-text-secondary)'}}>{customer.email}</small></td>
                  <td data-label="Phone">{customer.phone}</td>
                  <td data-label="Fleet Size">{customer.fleet_size} units</td>
                  <td data-label="Balance" className={customer.balance > 0 ? styles.overdue : ''}>
                    {formatCurrency(customer.balance)}
                  </td>
                  <td data-label="Terms">{customer.payment_terms}</td>
                  <td data-label="Status">
                    <span className={`${styles.statusPill} ${styles[customer.status] || styles.inactive}`}>
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Add New Customer</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Company Name</label>
                  <input type="text" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Contact Name</label>
                  <input type="text" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input type="tel" required />
                </div>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label>Address</label>
                  <input type="text" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Credit Limit</label>
                  <input type="number" step="0.01" />
                </div>
                <div className={styles.formGroup}>
                  <label>Payment Terms</label>
                  <select>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                    <option>Due on Receipt</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Labour Rate ($)</label>
                  <input type="number" step="0.01" />
                </div>
                <div className={styles.formGroup}>
                  <label>Parts Markup (%)</label>
                  <input type="number" />
                </div>
                <div className={styles.formGroup}>
                  <label>Tax Setting</label>
                  <select>
                    <option>GST+PST</option>
                    <option>GST</option>
                    <option>Exempt</option>
                  </select>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
