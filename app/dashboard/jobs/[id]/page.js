'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, Printer, Mail, CheckCircle, Plus, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { statusLabels } from '../../../lib/demoData';
import styles from '../jobs.module.css';

const WORKFLOW_STEPS = ['new', 'diagnosing', 'waiting_parts', 'repairing', 'completed', 'ready_to_invoice', 'invoiced', 'paid'];

export default function WorkOrderDetailPage() {
  const params = useParams();
  const id = params.id;
  
  const [wo, setWo] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [activeNotesTab, setActiveNotesTab] = useState('internal');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchJob() {
      setIsLoading(true);
      try {
        const [woRes, techRes] = await Promise.all([
          supabase.from('work_orders').select('*').eq('id', id).single(),
          supabase.from('technicians').select('*')
        ]);

        if (woRes.error) throw woRes.error;
        if (techRes.error) throw techRes.error;

        const data = woRes.data;
        // Map data to component state
        const hours = Math.floor((data.timer || 0) / 3600);
        const mins = Math.floor(((data.timer || 0) % 3600) / 60);
        
        setWo({
          ...data,
          customerName: data.customer_name,
          unitNumber: data.unit_display,
          technicianId: data.technician_id,
          timerDisplay: `${hours}:${mins.toString().padStart(2, '0')}`,
          labour: data.labour || [],
          parts: data.parts || []
        });

        setTechnicians(techRes.data || []);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.message || 'Failed to load work order from Supabase.');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleStatusAdvance = async (step) => {
    setWo(prev => ({ ...prev, status: step }));
    // Optimistic update, but you'd typically await the supabase update here
    await supabase.from('work_orders').update({ status: step }).eq('id', id);
  };

  const handleTechChange = async (newTechId) => {
    const selectedTech = technicians.find(t => t.id === newTechId);
    const newTechName = selectedTech ? (selectedTech.full_name || selectedTech.name) : null;
    
    setWo(prev => ({
      ...prev,
      technicianId: newTechId || null,
      tech_id: newTechId || null,
      techName: newTechName,
      tech_name: newTechName
    }));

    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          tech_id: newTechId || null,
          tech_name: newTechName
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      alert(`Error updating technician: ${err.message}`);
    }
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

  const calculateTotals = () => {
    if (!wo) return { labourTotal: 0, partsTotal: 0, shopSupplies: 0, subtotal: 0, tax: 0, total: 0 };
    
    const labourTotal = (wo.labour || []).reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
    const partsTotal = (wo.parts || []).reduce((sum, p) => sum + ((p.quantity || 0) * (p.sellPrice || p.price || 0)), 0);
    const shopSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50); // 5% capped at $50
    const subtotal = labourTotal + partsTotal + shopSupplies;
    const tax = subtotal * 0.05; // 5% tax
    
    return {
      labourTotal,
      partsTotal,
      shopSupplies,
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  if (isLoading) {
    return <div className={styles.pageContainer} style={{ padding: '3rem', textAlign: 'center' }}>Loading work order details...</div>;
  }

  if (error || !wo) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'red' }}>{error || 'Work Order Not Found'}</h2>
          <Link href="/dashboard/jobs" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Work Orders</Link>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard/jobs" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '8px' }}>
            <ArrowLeft size={16} /> Back to Work Orders
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1>{wo.id}</h1>
            <span className={`${styles.pill} ${getStatusClass(wo.status)}`}>{(statusLabels[wo.status] || {}).label || wo.status}</span>
            <span style={{fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'3px 6px', borderRadius:'10px'}}>SUPABASE</span>
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
                {(statusLabels[step] || {}).label || step}
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
                        <td>${((l.hours || 0) * (l.rate || 0)).toFixed(2)}</td>
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
                        <td>{p.partNumber || p.part_number}</td>
                        <td>{p.description}</td>
                        <td>{p.quantity}</td>
                        <td>${p.sellPrice || p.price}</td>
                        <td>${((p.quantity || 0) * (p.sellPrice || p.price || 0)).toFixed(2)}</td>
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
                <Clock size={18} /> {wo.timerDisplay || '0:00'}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Assigned Technician</label>
              <select 
                className={styles.select} 
                value={wo.technicianId || wo.tech_id || ''} 
                onChange={(e) => handleTechChange(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
              >
                <option value="">Unassigned (None)</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.name} ({t.role || 'Mechanic'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Financial Summary</h2>
            <div className={styles.summaryRow}>
              <span>Labour</span>
              <span>${totals.labourTotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Parts</span>
              <span>${totals.partsTotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shop Supplies</span>
              <span>${totals.shopSupplies.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow} style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
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
