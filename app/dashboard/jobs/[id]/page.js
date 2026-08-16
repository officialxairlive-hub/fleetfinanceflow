'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, Printer, Mail, CheckCircle, Plus, ChevronRight } from 'lucide-react';
import { workOrders, statusLabels, priorityLabels, technicians, partsInventory, calculateWOTotal } from '../../../lib/demoData';
import styles from '../jobs.module.css';

const WORKFLOW_STEPS = ['new', 'diagnosing', 'waiting_parts', 'repairing', 'completed', 'ready_to_invoice', 'invoiced', 'paid'];

export default function WorkOrderDetailPage() {
  const params = useParams();
  const id = params.id;
  
  // Find WO
  const initialWO = workOrders.find(w => w.id === id);
  const [wo, setWo] = useState(initialWO);
  const [activeNotesTab, setActiveNotesTab] = useState('internal');

  if (!wo) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <h2>Work Order Not Found</h2>
          <Link href="/dashboard/jobs" className="btn btn-primary">Back to Work Orders</Link>
        </div>
      </div>
    );
  }

  const handleStatusAdvance = (step) => {
    setWo(prev => ({ ...prev, status: step }));
  };

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

  const totals = calculateWOTotal ? calculateWOTotal(wo) : { labourTotal: 0, partsTotal: 0, shopSupplies: 0, subtotal: 0, tax: 0, total: 0 };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard/jobs" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '8px' }}>
            <ArrowLeft size={16} /> Back to Work Orders
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1>{wo.id}</h1>
            <span className={`${styles.pill} ${getStatusClass(wo.status)}`}>{statusLabels[wo.status]}</span>
          </div>
          <p>{wo.customerName} - {wo.unitNumber}</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-outline"><Printer size={18} /> Print</button>
          <button className="btn btn-outline"><Mail size={18} /> Email</button>
          {wo.status === 'ready_to_invoice' && (
            <button className="btn btn-primary">Convert to Invoice</button>
          )}
        </div>
      </header>

      {/* Workflow Bar */}
      <div className={styles.workflowBar}>
        {WORKFLOW_STEPS.map((step, idx) => {
          const isActive = wo.status === step;
          const isCompleted = WORKFLOW_STEPS.indexOf(wo.status) > idx;
          
          return (
            <React.Fragment key={step}>
              <div 
                className={`${styles.workflowStep} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                onClick={() => handleStatusAdvance(step)}
              >
                {isCompleted ? <CheckCircle size={16} /> : <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid currentColor' }}></span>}
                {statusLabels[step]}
              </div>
              {idx < WORKFLOW_STEPS.length - 1 && <ChevronRight size={16} className={styles.workflowDivider} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.gridTwoCol}>
        <div className={styles.leftCol} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Unit Info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Unit Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p className={styles.label}>Customer</p>
                <p>{wo.customerName}</p>
              </div>
              <div>
                <p className={styles.label}>Unit #</p>
                <p>{wo.unitNumber}</p>
              </div>
            </div>
          </div>

          {/* 3Cs */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Complaint, Cause, Correction</h2>
            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
              <label className={styles.label}>Complaint</label>
              <textarea className={styles.textarea} readOnly defaultValue={wo.complaint || 'Customer reported issue.'}></textarea>
            </div>
            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
              <label className={styles.label}>Cause</label>
              <textarea className={styles.textarea} placeholder="Enter diagnosed cause..."></textarea>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Correction</label>
              <textarea className={styles.textarea} placeholder="Enter repairs performed..."></textarea>
            </div>
          </div>

          {/* Labour */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Labour</h2>
              <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem' }}><Plus size={16} /> Add Labour</button>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Hours</th>
                    <th>Rate</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.labour && wo.labour.length > 0 ? (
                    wo.labour.map((l, i) => (
                      <tr key={i}>
                        <td>{l.description}</td>
                        <td>{l.hours}</td>
                        <td>${l.rate}</td>
                        <td>${(l.hours * l.rate).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>No labour lines added.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parts */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Parts</h2>
              <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem' }}><Plus size={16} /> Add Part</button>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Part #</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {wo.parts && wo.parts.length > 0 ? (
                    wo.parts.map((p, i) => (
                      <tr key={i}>
                        <td>{p.partNumber}</td>
                        <td>{p.description}</td>
                        <td>{p.quantity}</td>
                        <td>${p.sellPrice}</td>
                        <td>${(p.quantity * p.sellPrice).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>No parts added.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className={styles.rightCol} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Assignment & Timer */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className={styles.cardTitle}>Assignment</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <Clock size={18} /> {wo.timer || '0:00'}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Technician</label>
              <select className={styles.select} value={wo.technicianId || ''} onChange={() => {}}>
                <option value="">Unassigned</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Financial Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Financial Summary</h2>
            <div className={styles.summaryRow}>
              <span>Labour</span>
              <span>${totals.labourTotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Parts</span>
              <span>${totals.partsTotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shop Supplies</span>
              <span>${totals.shopSupplies?.toFixed(2) || '0.00'}</span>
            </div>
            <div className={styles.summaryRow} style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
              <span>Subtotal</span>
              <span>${totals.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>${totals.tax?.toFixed(2) || '0.00'}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>${totals.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.card}>
            <div className={styles.tabs} style={{ paddingBottom: 0, marginBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <button 
                className={`${styles.tab} ${activeNotesTab === 'internal' ? styles.activeTab : ''}`}
                onClick={() => setActiveNotesTab('internal')}
                style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
              >
                Internal
              </button>
              <button 
                className={`${styles.tab} ${activeNotesTab === 'customer' ? styles.activeTab : ''}`}
                onClick={() => setActiveNotesTab('customer')}
                style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
              >
                Customer
              </button>
            </div>
            <textarea 
              className={styles.textarea} 
              placeholder={activeNotesTab === 'internal' ? "Shop notes (not printed)..." : "Notes to appear on invoice..."}
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}
