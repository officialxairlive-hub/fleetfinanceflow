'use client';

import { useState } from 'react';
import { estimates } from '../../lib/demoData';
import { Plus, Search, Eye, Send, FilePlus } from 'lucide-react';
import styles from './estimates.module.css';

export default function EstimatesList() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredEstimates = estimates.filter(est => {
    if (filter !== 'All' && est.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (search) {
      const s = search.toLowerCase();
      return est.id.toLowerCase().includes(s) || 
             est.customerId.toLowerCase().includes(s) || 
             est.unit.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Estimates</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Create Estimate
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          {['All', 'Draft', 'Sent', 'Approved', 'Declined', 'Expired'].map(tab => (
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
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEstimates.map(est => (
                <tr key={est.id}>
                  <td><strong>{est.id}</strong></td>
                  <td>{est.customerId}</td>
                  <td>{est.unit}</td>
                  <td>{est.description}</td>
                  <td>${est.total.toFixed(2)}</td>
                  <td>
                    <span className={`${styles.pill} ${styles[est.status.toLowerCase()]}`}>
                      {est.status}
                    </span>
                  </td>
                  <td>{new Date(est.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(est.expiresAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="View"><Eye size={18}/></button>
                      <button className={styles.actionBtn} title="Send"><Send size={18}/></button>
                      {est.status === 'approved' && (
                        <button className={styles.actionBtn} title="Convert to Work Order">
                          <FilePlus size={18}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEstimates.length === 0 && (
                <tr>
                  <td colSpan="9" style={{textAlign: 'center', padding: 'var(--space-8)'}}>No estimates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
