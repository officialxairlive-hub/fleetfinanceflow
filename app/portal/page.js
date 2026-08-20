'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { statusLabels } from '../lib/demoData';
import { Wrench, Receipt, Truck, CreditCard, ExternalLink, Download } from 'lucide-react';
import styles from './portal.module.css';

function PortalContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  // Hardcoded to demo customer CUST-001
  const customerId = 'CUST-001';

  const [activeOrders, setActiveOrders] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [fleetUnits, setFleetUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPortalData() {
      setIsLoading(true);
      try {
        const [woRes, invRes, unitRes] = await Promise.all([
          supabase.from('work_orders').select('*').eq('customer_id', customerId),
          supabase.from('invoices').select('*').eq('customer_id', customerId),
          supabase.from('units').select('*').eq('customer_id', customerId)
        ]);

        if (woRes.error) throw woRes.error;
        if (invRes.error) throw invRes.error;
        if (unitRes.error) throw unitRes.error;

        // Map Work Orders
        const activeWO = (woRes.data || []).filter(wo => !['completed', 'invoiced', 'paid'].includes(wo.status));
        setActiveOrders(activeWO.map(wo => ({
          ...wo,
          unitDisplay: wo.unit_display,
          estimatedCost: wo.estimated_cost
        })));

        // Map Invoices
        const unpaidInv = (invRes.data || []).filter(inv => inv.status !== 'paid');
        setUnpaidInvoices(unpaidInv.map(inv => ({
          ...inv,
          issueDate: inv.issue_date,
          dueDate: inv.due_date
        })));

        // Map Units
        setFleetUnits((unitRes.data || []).map(u => ({
          ...u,
          unitDisplay: `#${u.unit_number} - ${u.make} ${u.model}`,
          nextPM: u.next_pm ? JSON.stringify(u.next_pm) : 'N/A'
        })));

      } catch (err) {
        console.error("Error fetching portal data:", err);
        setError(err.message || 'Failed to fetch data from Supabase');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPortalData();
  }, [customerId]);

  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  return (
    <main className={styles.mainContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Welcome back, Interstate Haulers</h1>
        <p className={styles.pageSubtitle}>View your fleet's repair status, approve estimates, and pay invoices.</p>
        <span style={{display: 'inline-block', marginTop:'12px', fontSize:'12px', background:'var(--color-primary)', color:'white', padding:'4px 8px', borderRadius:'12px'}}>
          SUPABASE LIVE SYNC
        </span>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading customer portal data...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}><strong>Error:</strong> {error}</div>
      ) : (
        <>
          {(activeTab === 'overview' || activeTab === 'jobs') && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Active Repair Orders</h3>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  {activeOrders.length} Open Jobs
                </span>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>WO #</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Opened Date</th>
                    <th>Est. Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map(wo => (
                    <tr key={wo.id}>
                      <td><strong>{wo.id}</strong></td>
                      <td>{wo.unitDisplay}</td>
                      <td>
                        <span className={`${styles.pill} ${styles[wo.status?.replace('_', '')] || ''}`}>
                          {(statusLabels[wo.status] || {}).label || wo.status}
                        </span>
                      </td>
                      <td>{new Date(wo.created_at || Date.now()).toLocaleDateString()}</td>
                      <td>${Number(wo.estimatedCost || 0).toFixed(2)}</td>
                      <td>
                        <Link href={`/approve/${wo.id}`} className={styles.actionBtn}>
                          View & Approve <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {activeOrders.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No active repairs.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          {(activeTab === 'overview' || activeTab === 'invoices') && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Outstanding Invoices</h3>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>
                  ${unpaidTotal.toFixed(2)} Due
                </span>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td><strong>{inv.id}</strong></td>
                      <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td>
                        <span style={{ color: new Date(inv.dueDate) < new Date() ? '#ef4444' : 'inherit' }}>
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td><strong>${Number(inv.total || 0).toFixed(2)}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className={`${styles.actionBtn} ${styles.payBtn}`}>
                            <CreditCard size={14} /> Pay Now
                          </button>
                          <button className={styles.actionBtn} title="Download PDF">
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {unpaidInvoices.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>All caught up! No unpaid invoices.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          {(activeTab === 'overview' || activeTab === 'fleet') && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>My Fleet</h3>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Unit ID</th>
                    <th>Description</th>
                    <th>VIN</th>
                    <th>Next Maintenance</th>
                    <th>History</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetUnits.map(unit => (
                    <tr key={unit.id}>
                      <td><strong>{unit.unit_number}</strong></td>
                      <td>{unit.unitDisplay}</td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{unit.vin || '-'}</span></td>
                      <td>{unit.nextPM}</td>
                      <td>
                        <button className={styles.actionBtn}>
                          View History
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fleetUnits.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No units found for your fleet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px' }}>Loading portal...</div>}>
      <PortalContent />
    </Suspense>
  );
}
