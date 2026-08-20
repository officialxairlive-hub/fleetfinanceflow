'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Wrench, Receipt, Truck, CreditCard, ExternalLink, Download } from 'lucide-react';
import { workOrders, invoices, customers, statusLabels } from '../lib/demoData';
import styles from './portal.module.css';

function PortalContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  // Hardcoded to demo customer CUST-001
  const customerId = 'CUST-001';
  
  const customerOrders = workOrders.filter(wo => wo.customerId === customerId);
  const activeOrders = customerOrders.filter(wo => wo.status !== 'completed' && wo.status !== 'invoiced' && wo.status !== 'paid');
  
  const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
  const unpaidInvoices = customerInvoices.filter(inv => inv.status !== 'paid');
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // For the fleet, we'll just mock 3 units for CUST-001 since demoData units might not map perfectly
  const fleetUnits = [
    { id: 'UNIT-001', unitDisplay: '#2019 - Freightliner Cascadia', vin: '1FUJAC6C2KL928183', nextPM: '8,500 km' },
    { id: 'UNIT-006', unitDisplay: '#2045 - Freightliner Cascadia', vin: '1FUJAC6C2KL928184', nextPM: '2,000 km' },
    { id: 'TRL-4401', unitDisplay: 'Trailer TRL-4401 - Utility', vin: '1UYVS25345L092834', nextPM: 'CVSE Due Oct 2025' }
  ];

  return (
    <main className={styles.mainContent}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Welcome back, Interstate Haulers</h1>
        <p className={styles.pageSubtitle}>View your fleet's repair status, approve estimates, and pay invoices.</p>
      </div>

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
                    <span className={`${styles.pill} ${styles[wo.status.replace('_', '')] || ''}`}>
                      {(statusLabels[wo.status] || {}).label || wo.status}
                    </span>
                  </td>
                  <td>{new Date(wo.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td>${wo.estimatedCost?.toFixed(2) || '0.00'}</td>
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
                  <td><strong>${inv.total.toFixed(2)}</strong></td>
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
                  <td><strong>{unit.id}</strong></td>
                  <td>{unit.unitDisplay}</td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{unit.vin}</span></td>
                  <td>{unit.nextPM}</td>
                  <td>
                    <button className={styles.actionBtn}>
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
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
