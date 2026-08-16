'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { customers, trucks, workOrders } from '../../lib/demoData';
import styles from './customers.module.css';
import { Search, Plus, X } from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => 
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  // Derived metrics
  const totalCustomers = customers.length;
  const totalFleetUnits = trucks.length;
  const outstandingBalance = customers.reduce((sum, c) => sum + c.balance, 0);
  const activeWOs = workOrders.filter(wo => !['completed', 'ready_invoice', 'invoiced', 'paid'].includes(wo.status)).length;

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
          <p className={styles.value}>{totalCustomers}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Total Fleet Units</h3>
          <p className={styles.value}>{totalFleetUnits}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Outstanding Balance</h3>
          <p className={styles.value}>{formatCurrency(outstandingBalance)}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Active Work Orders</h3>
          <p className={styles.value}>{activeWOs}</p>
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
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id} onClick={() => router.push(`/dashboard/customers/${customer.id}`)}>
                  <td data-label="Company">{customer.company}</td>
                  <td data-label="Contact">{customer.contact}<br/><small style={{color: 'var(--color-text-secondary)'}}>{customer.email}</small></td>
                  <td data-label="Phone">{customer.phone}</td>
                  <td data-label="Fleet Size">{customer.fleetSize} units</td>
                  <td data-label="Balance" className={customer.balance > 0 ? styles.overdue : ''}>
                    {formatCurrency(customer.balance)}
                  </td>
                  <td data-label="Terms">{customer.paymentTerms}</td>
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
