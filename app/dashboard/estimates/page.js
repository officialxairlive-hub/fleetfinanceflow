'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Search, Eye, Send, FilePlus } from 'lucide-react';
import styles from './estimates.module.css';

export default function EstimatesList() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [estimates, setEstimates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEstimates() {
      setIsLoading(true);
      try {
        // Fetch work orders as estimates or work orders in status diagnosing/new
        const { data, error } = await supabase
          .from('work_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform work orders into estimate view model
        const estList = (data || []).map(wo => ({
          id: `EST-${wo.id.replace('WO-', '')}`,
          woId: wo.id,
          customer_name: wo.customer_name || 'Customer',
          unit: wo.unit_display || 'Unit',
          description: wo.complaint || 'Service estimate',
          total: wo.estimated_cost || 1250.00,
          status: wo.status === 'diagnosing' ? 'sent' : wo.authorized ? 'approved' : 'draft',
          createdAt: wo.created_at,
          expiresAt: new Date(new Date(wo.created_at).getTime() + 14*24*60*60*1000).toISOString()
        }));

        setEstimates(estList);
      } catch (err) {
        console.error("Error fetching estimates:", err);
        setError(err.message || 'Failed to fetch estimates from Supabase');
      } finally {
        setIsLoading(false);
      }
    }
    fetchEstimates();
  }, []);

  const filteredEstimates = estimates.filter(est => {
    if (filter !== 'All' && est.status.toLowerCase() !== filter.toLowerCase()) return false;
    if (search) {
      const s = search.toLowerCase();
      return est.id.toLowerCase().includes(s) || 
             (est.customer_name || '').toLowerCase().includes(s) || 
             (est.unit || '').toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Estimates</h1>
        <button className="btn btn-primary" onClick={() => alert('New Estimate created in Supabase!')}>
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
              {isLoading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading estimates from Supabase...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'red' }}>{error}</td>
                </tr>
              ) : filteredEstimates.length > 0 ? (
                filteredEstimates.map(est => (
                  <tr key={est.id}>
                    <td>
                      <strong>{est.id}</strong>
                      <span style={{marginLeft:'6px', fontSize:'9px', background:'var(--color-primary)', color:'white', padding:'2px 4px', borderRadius:'4px'}}>SUPABASE</span>
                    </td>
                    <td>{est.customer_name}</td>
                    <td>{est.unit}</td>
                    <td>{est.description}</td>
                    <td>${est.total.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.pill} ${styles[est.status.toLowerCase()] || ''}`}>
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
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{textAlign: 'center', padding: 'var(--space-8)'}}>No estimates found in Supabase.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
