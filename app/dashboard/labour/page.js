'use client';

import React, { useState } from 'react';
import { technicians, workOrders, labourRateTypes, customers } from '../../lib/demoData';
import styles from './labour.module.css';
import { Clock, DollarSign, Activity, Percent, ChevronDown, ChevronUp, Plus, Edit2 } from 'lucide-react';

export default function LabourTrackingPage() {
  const [expandedTech, setExpandedTech] = useState(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Calculate mock stats
  const totalHours = 42.5;
  const billableHours = 38.0;
  const averageEfficiency = Math.round((billableHours / totalHours) * 100);
  const totalRevenue = billableHours * 145; // average rate

  const toggleExpand = (techId) => {
    if (expandedTech === techId) {
      setExpandedTech(null);
    } else {
      setExpandedTech(techId);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Labour Tracking</h1>
        <button className="btn btn-primary" onClick={() => setIsAdjustmentModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Manual Time Entry
        </button>
      </header>

      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Clock size={16} /> Total Hours (Today)
          </div>
          <div className={styles.cardValue}>{totalHours}h</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Activity size={16} /> Billable Hours
          </div>
          <div className={styles.cardValue}>{billableHours}h</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <DollarSign size={16} /> Total Labour Revenue
          </div>
          <div className={styles.cardValue}>${totalRevenue.toLocaleString()}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Percent size={16} /> Average Efficiency
          </div>
          <div className={styles.cardValue}>{averageEfficiency}%</div>
        </div>
      </div>

      <div className={styles.gridLayout}>
        <div>
          <div className={styles.sectionTitle}>
            Technician Time Log
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Clock In</th>
                  <th>Hours Today</th>
                  <th>Active Job</th>
                  <th>Status</th>
                  <th>Efficiency</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {technicians.map(tech => {
                  const techJobs = workOrders.filter(wo => wo.techId === tech.id);
                  const isExpanded = expandedTech === tech.id;
                  // mock values
                  const hoursToday = (Math.random() * 4 + 4).toFixed(1);
                  const efficiency = Math.floor(Math.random() * 30 + 75);
                  const isClockedIn = Math.random() > 0.2;
                  
                  return (
                    <React.Fragment key={tech.id}>
                      <tr>
                        <td data-label="Technician">
                          <div className={styles.techCell}>
                            <div className={styles.techAvatar}>
                              {tech.avatar}
                            </div>
                            {tech.name}
                          </div>
                        </td>
                        <td data-label="Clock In">{isClockedIn ? '07:30 AM' : '-'}</td>
                        <td data-label="Hours Today">{hoursToday}h</td>
                        <td data-label="Active Job">
                          {techJobs.length > 0 ? techJobs[0].id : 'None'}
                        </td>
                        <td data-label="Status">
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            fontWeight: '600',
                            backgroundColor: isClockedIn ? '#dcfce7' : '#f1f5f9',
                            color: isClockedIn ? '#166534' : '#64748b'
                          }}>
                            {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                          </span>
                        </td>
                        <td data-label="Efficiency">
                          <span style={{ color: efficiency >= 100 ? '#166534' : efficiency > 85 ? '#1e40af' : '#c2410c', fontWeight: '600' }}>
                            {efficiency}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '4px 8px', height: 'auto' }}
                            onClick={() => toggleExpand(tech.id)}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className={styles.expandableRow}>
                          <td colSpan={7}>
                            <div className={styles.expandedContent}>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Recent Entries</h4>
                              {techJobs.length > 0 ? (
                                <table className={styles.innerTable}>
                                  <thead>
                                    <tr>
                                      <th>Work Order</th>
                                      <th>Task</th>
                                      <th>Time Logged</th>
                                      <th>Billable</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {techJobs.map(job => (
                                      <tr key={job.id}>
                                        <td>{job.id}</td>
                                        <td>Diagnostics & Repair</td>
                                        <td>2.5h</td>
                                        <td>2.5h</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No entries found for today.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>
            Rate Types Reference
            <button className="btn btn-sm btn-outline" style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '32px' }}>
              <Edit2 size={14} /> Edit
            </button>
          </div>
          <div className={styles.card}>
            <div className={styles.ratesList}>
              {labourRateTypes.map(rate => (
                <div key={rate.id} className={styles.rateItem}>
                  <div>
                    <span className={styles.rateName}>{rate.name}</span>
                    <span className={styles.rateCode}>{rate.code}</span>
                  </div>
                  <span className={styles.ratePrice}>${rate.defaultRate.toFixed(2)}/hr</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sectionTitle} style={{ marginTop: '24px' }}>
            Customer Overrides
          </div>
          <div className={styles.card}>
             <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>Customers with custom negotiated labour rates:</p>
             <div className={styles.ratesList}>
                {customers.filter(c => c.labourRate !== 145).map(c => (
                  <div key={c.id} className={styles.rateItem}>
                    <span className={styles.rateName}>{c.company}</span>
                    <span className={styles.ratePrice}>${c.labourRate.toFixed(2)}/hr</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {isAdjustmentModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90vw' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Manual Time Entry</h2>
            
            <div className={styles.formGroup}>
              <label>Technician</label>
              <select className={styles.input}>
                <option value="">Select Technician...</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>Work Order</label>
              <select className={styles.input}>
                <option value="">Select Work Order...</option>
                {workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.id}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label>Hours (+/-)</label>
                <input type="number" step="0.1" className={styles.input} placeholder="e.g. 1.5 or -0.5" />
              </div>
              <div className={styles.formGroup}>
                <label>Rate Type</label>
                <select className={styles.input}>
                  {labourRateTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.code}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Reason / Notes</label>
              <textarea className={styles.input} rows="3" placeholder="Explain adjustment..."></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { alert('Time entry saved!'); setIsAdjustmentModalOpen(false); }}>Save Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
