'use client';

import React, { useState, useEffect } from 'react';
import styles from './maintenance.module.css';
import { Plus, X, Search, Calendar, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function MaintenancePage() {
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [units, setUnits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMaintenanceData() {
      setIsLoading(true);
      try {
        const [uRes, cRes] = await Promise.all([
          supabase.from('units').select('*').order('unit_number'),
          supabase.from('customers').select('*')
        ]);

        if (uRes.error) throw uRes.error;
        setUnits(uRes.data || []);
        setCustomers(cRes.data || []);
      } catch (err) {
        console.error("Error fetching fleet maintenance data:", err);
        setError(err.message || 'Failed to fetch data from Supabase');
      } finally {
        setIsLoading(false);
      }
    }
    fetchMaintenanceData();
  }, []);

  const getCustomerName = (custId) => {
    const cust = customers.find(c => c.id === custId);
    return cust ? (cust.company || cust.company_name) : 'Internal Fleet';
  };

  // Construct maintenance items from units' next_pm or status
  const maintenanceItems = units.map(unit => {
    const pm = unit.next_pm || { type: 'PM A (Oil & Filter)', dueIn: '5,000 km', urgency: 'normal' };
    return {
      id: unit.id,
      unitNumber: unit.unit_number,
      make: unit.make,
      model: unit.model,
      customerId: unit.customer_id,
      pmType: pm.type || 'PM A Inspection',
      dueIn: pm.dueIn || '30 days',
      urgency: pm.urgency || (unit.status === 'in_service' ? 'normal' : 'upcoming'),
      dueDate: unit.last_service ? new Date(new Date(unit.last_service).getTime() + 90*24*60*60*1000).toISOString() : new Date().toISOString()
    };
  });

  const filteredItems = maintenanceItems.filter(item => {
    const custName = getCustomerName(item.customerId);
    if (filter === 'Overdue' && item.urgency !== 'overdue') return false;
    if (filter === 'Upcoming' && item.urgency !== 'upcoming') return false;
    if (filter === 'Normal' && item.urgency !== 'normal') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchUnit = item.unitNumber.toLowerCase().includes(q) || (item.make || '').toLowerCase().includes(q);
      const matchCust = custName.toLowerCase().includes(q);
      const matchType = item.pmType.toLowerCase().includes(q);
      if (!matchUnit && !matchCust && !matchType) return false;
    }
    return true;
  });

  const overdueCount = maintenanceItems.filter(s => s.urgency === 'overdue').length;
  const upcomingCount = maintenanceItems.filter(s => s.urgency === 'upcoming').length;
  const normalCount = maintenanceItems.filter(s => s.urgency === 'normal').length;
  const totalCount = maintenanceItems.length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Fleet Maintenance</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Schedule New PM
        </button>
      </header>

      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Overdue PMs</span>
          <span className={`${styles.cardValue} ${styles.red}`}>{isLoading ? '...' : overdueCount}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Due Within 30 Days</span>
          <span className={`${styles.cardValue} ${styles.yellow}`}>{isLoading ? '...' : upcomingCount}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Upcoming</span>
          <span className={`${styles.cardValue} ${styles.green}`}>{isLoading ? '...' : normalCount}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Total Fleet Units</span>
          <span className={styles.cardValue}>{isLoading ? '...' : totalCount}</span>
        </div>
      </div>

      <div className={styles.filters}>
        <button 
          className={`${styles.filterBtn} ${filter === 'All' ? styles.active : ''}`}
          onClick={() => setFilter('All')}
        >
          All
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'Overdue' ? styles.active : ''}`}
          onClick={() => setFilter('Overdue')}
        >
          Overdue
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'Upcoming' ? styles.active : ''}`}
          onClick={() => setFilter('Upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'Normal' ? styles.active : ''}`}
          onClick={() => setFilter('Normal')}
        >
          Normal
        </button>
        
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            className={styles.input} 
            placeholder="Search schedules..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', width: '250px' }}
          />
        </div>
      </div>

      <div className={styles.listContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Unit # / Make</th>
              <th>Customer</th>
              <th>PM Type</th>
              <th>Status / Urgency</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading maintenance data from Supabase...</td></tr>
            ) : error ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>{error}</td></tr>
            ) : filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td data-label="Unit # / Make">
                    <div className={styles.unitInfo}>
                      <span className={styles.unitNumber}>#{item.unitNumber}</span>
                      <span className={styles.unitModel}>{item.make} {item.model}</span>
                    </div>
                  </td>
                  <td data-label="Customer">{getCustomerName(item.customerId)}</td>
                  <td data-label="PM Type">{item.pmType}</td>
                  <td data-label="Status / Urgency">
                    <span className={`${styles.badge} ${item.urgency === 'overdue' ? styles.badgeOverdue : item.urgency === 'upcoming' ? styles.badgeUpcoming : styles.badgeNormal}`}>
                      {item.urgency.toUpperCase()}
                    </span>
                  </td>
                  <td data-label="Due Date">{new Date(item.dueDate).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No maintenance schedules found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Schedule New PM</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Select Unit</label>
                <select className={styles.select}>
                  <option value="">Select a unit...</option>
                  {units.map(t => (
                    <option key={t.id} value={t.id}>Unit #{t.unit_number} - {t.make} {t.model}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>PM Type</label>
                <select className={styles.select}>
                  <option value="pm-a">PM A (Dry Service)</option>
                  <option value="pm-b">PM B (Wet Service)</option>
                  <option value="pm-c">PM C (Annual Inspection)</option>
                  <option value="dot">DOT Inspection</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Next Due Date</label>
                <input type="date" className={styles.input} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { alert('PM Schedule Saved!'); setShowModal(false); }}>Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
