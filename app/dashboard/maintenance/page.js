'use client';

import React, { useState } from 'react';
import styles from './maintenance.module.css';
import { Plus, X, Search, Calendar } from 'lucide-react';
import { maintenanceSchedules, trucks, customers, getTruckById, getCustomerById } from '../../lib/demoData';

export default function MaintenancePage() {
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Example Unit 2049 Demo Display
  const unitCardData = {
    unit: '2049',
    items: [
      { id: 1, name: 'PM due in', value: '8,500 km', status: 'normal' },
      { id: 2, name: 'Oil service due in', value: '2,000 km', status: 'upcoming' },
      { id: 3, name: 'Brake inspection due in', value: '15 days', status: 'overdue' }
    ]
  };

  const getUrgencyInfo = (schedule) => {
    // In a real app this would compare distances/dates
    // For demo, we'll randomize or base it on status
    if (schedule.status === 'Overdue') return { text: 'Overdue', className: styles.badgeOverdue, rowClass: styles.rowOverdue };
    if (schedule.status === 'Due Soon') return { text: 'Due Soon', className: styles.badgeUpcoming, rowClass: '' };
    return { text: 'Normal', className: styles.badgeNormal, rowClass: '' };
  };

  const filteredSchedules = maintenanceSchedules.filter(schedule => {
    const truck = getTruckById(schedule.truckId);
    const customer = truck ? getCustomerById(truck.customerId) : null;
    
    // Status filter
    if (filter === 'Overdue' && schedule.status !== 'Overdue') return false;
    if (filter === 'Upcoming' && schedule.status !== 'Due Soon') return false;
    if (filter === 'Normal' && schedule.status !== 'Completed' && schedule.status !== 'Scheduled') return false;
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTruck = truck && (truck.unitNumber.toLowerCase().includes(q) || truck.make.toLowerCase().includes(q));
      const matchCustomer = customer && customer.name.toLowerCase().includes(q);
      const matchType = schedule.serviceType.toLowerCase().includes(q);
      if (!matchTruck && !matchCustomer && !matchType) return false;
    }
    
    return true;
  });

  const overdueCount = maintenanceSchedules.filter(s => s.status === 'Overdue').length;
  const upcomingCount = maintenanceSchedules.filter(s => s.status === 'Due Soon').length;
  const normalCount = maintenanceSchedules.filter(s => s.status === 'Scheduled' || s.status === 'Completed').length;
  const totalCount = maintenanceSchedules.length;

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
          <span className={`${styles.cardValue} ${styles.red}`}>{overdueCount}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Due Within 30 Days</span>
          <span className={`${styles.cardValue} ${styles.yellow}`}>{upcomingCount}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Upcoming</span>
          <span className={`${styles.cardValue} ${styles.green}`}>{normalCount}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Total Scheduled</span>
          <span className={styles.cardValue}>{totalCount}</span>
        </div>
      </div>

      <div className={styles.unitCard}>
        <h3 className={styles.unitCardTitle}>Featured Unit: {unitCardData.unit}</h3>
        {unitCardData.items.map(item => (
          <div key={item.id} className={`${styles.unitCardItem} ${item.status === 'overdue' ? styles.cardItemOverdue : item.status === 'upcoming' ? styles.cardItemUpcoming : ''}`}>
            <span>{item.name}</span>
            <span>{item.value}</span>
          </div>
        ))}
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
              <th>Interval</th>
              <th>Status / Urgency</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map(schedule => {
              const truck = getTruckById(schedule.truckId);
              const customer = truck ? getCustomerById(truck.customerId) : null;
              const urgency = getUrgencyInfo(schedule);
              
              return (
                <tr key={schedule.id} className={urgency.rowClass} onClick={() => alert(`Showing history for Unit ${truck?.unitNumber}`)}>
                  <td data-label="Unit # / Make">
                    <div className={styles.unitInfo}>
                      <span className={styles.unitNumber}>{truck?.unitNumber || 'Unknown'}</span>
                      <span className={styles.unitModel}>{truck?.make} {truck?.model}</span>
                    </div>
                  </td>
                  <td data-label="Customer">{customer?.name || 'Internal'}</td>
                  <td data-label="PM Type">{schedule.serviceType}</td>
                  <td data-label="Interval">{schedule.intervalDays ? `${schedule.intervalDays} Days` : ''} {schedule.intervalKm ? `/ ${schedule.intervalKm} km` : ''}</td>
                  <td data-label="Status / Urgency">
                    <span className={`${styles.badge} ${urgency.className}`}>
                      {urgency.text}
                    </span>
                  </td>
                  <td data-label="Due Date">{new Date(schedule.nextDueDate).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {filteredSchedules.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No maintenance schedules found.</td>
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
                  {trucks.map(t => (
                    <option key={t.id} value={t.id}>Unit {t.unitNumber} - {t.make} {t.model}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>PM Type</label>
                <select className={styles.select}>
                  <option value="">Select PM type...</option>
                  <option value="pm-a">PM A (Dry)</option>
                  <option value="pm-b">PM B (Wet)</option>
                  <option value="pm-c">PM C (Annual)</option>
                  <option value="dot">DOT Inspection</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Interval (Days)</label>
                <input type="number" className={styles.input} placeholder="e.g. 90" />
              </div>
              <div className={styles.formGroup}>
                <label>Interval (KM)</label>
                <input type="number" className={styles.input} placeholder="e.g. 25000" />
              </div>
              <div className={styles.formGroup}>
                <label>Next Due Date</label>
                <input type="date" className={styles.input} />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
