'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { statusLabels, priorityLabels } from '../../lib/demoData';
import styles from './jobs.module.css';

const TABS = ['All', 'New', 'Diagnosing', 'Waiting Parts', 'Repairing', 'Completed', 'Ready to Invoice', 'Invoiced', 'Paid'];

export default function WorkOrdersPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [workOrders, setWorkOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWorkOrders() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setWorkOrders(data || []);
      } catch (err) {
        console.error("Error fetching work orders:", err);
        setError(err.message || 'Failed to fetch data from Supabase');
      } finally {
        setIsLoading(false);
      }
    }
    fetchWorkOrders();
  }, []);

  const filteredOrders = workOrders.filter(wo => {
    const matchesTab = activeTab === 'All' || (statusLabels[wo.status] || {}).label === activeTab;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (wo.id || '').toLowerCase().includes(searchLower) ||
      (wo.customer_name || '').toLowerCase().includes(searchLower) ||
      (wo.unit_display || '').toLowerCase().includes(searchLower);
    
    return matchesTab && matchesSearch;
  });

  const getStatusClass = (status) => {
    const map = {
      'new': styles['status-new'],
      'diagnosing': styles['status-diagnosing'],
      'waiting_parts': styles['status-waiting'],
      'repairing': styles['status-repairing'],
      'completed': styles['status-completed'],
      'ready_to_invoice': styles['status-ready'],
      'invoiced': styles['status-invoiced'],
      'paid': styles['status-paid']
    };
    return map[status] || '';
  };

  const getPriorityClass = (priority) => {
    const map = {
      'normal': styles['priority-normal'],
      'high': styles['priority-high'],
      'emergency': styles['priority-emergency']
    };
    return map[priority] || '';
  };

  const activeJobsCount = workOrders.filter(wo => !['invoiced', 'paid'].includes(wo.status)).length;
  const waitingPartsCount = workOrders.filter(wo => wo.status === 'waiting_parts').length;
  const readyToInvoiceCount = workOrders.filter(wo => wo.status === 'ready_to_invoice').length;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Work Orders</h1>
          <p>Manage shop repairs and service jobs.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard/jobs/new" className="btn btn-primary">
            <Plus size={18} />
            New Work Order
          </Link>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Jobs</span>
          <span className={styles.statValue}>{isLoading ? '...' : activeJobsCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Waiting on Parts</span>
          <span className={styles.statValue}>{isLoading ? '...' : waitingPartsCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Ready to Invoice</span>
          <span className={styles.statValue}>{isLoading ? '...' : readyToInvoiceCount}</span>
        </div>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search WO#, Customer, Unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>WO#</th>
              <th>Customer</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Tech</th>
              <th>Priority</th>
              <th>Timer</th>
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
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No work orders found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map(wo => {
                const isEmergency = wo.priority === 'emergency';
                return (
                  <tr 
                    key={wo.id} 
                    className={`${styles.tableRow} ${isEmergency ? styles.emergencyRow : ''}`}
                    onClick={() => window.location.href = `/dashboard/jobs/${wo.id}`}
                  >
                    <td data-label="WO#"><strong>{wo.id}</strong></td>
                    <td data-label="Customer">
                      {wo.customer_name}
                      <span style={{marginLeft:'8px', fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'2px 6px', borderRadius:'12px'}}>SUPABASE</span>
                    </td>
                    <td data-label="Unit">{wo.unit_display}</td>
                    <td data-label="Status">
                      <span className={`${styles.pill} ${getStatusClass(wo.status)}`}>
                        {(statusLabels[wo.status] || {}).label || wo.status}
                      </span>
                    </td>
                    <td data-label="Tech">{wo.tech_name || 'Unassigned'}</td>
                    <td data-label="Priority">
                      <span className={`${styles.pill} ${getPriorityClass(wo.priority)}`}>
                        {isEmergency && <AlertTriangle size={14} style={{ marginRight: '4px' }} />}
                        {(priorityLabels[wo.priority] || {}).label || wo.priority}
                      </span>
                    </td>
                    <td data-label="Timer">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} />
                        {wo.timer ? `${Math.floor(wo.timer / 3600)}h ${Math.floor((wo.timer % 3600)/60)}m` : '0:00'}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
