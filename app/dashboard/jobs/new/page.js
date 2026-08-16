'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, ArrowLeft, Save } from 'lucide-react';
import { customers, trucks, technicians, getTrucksByCustomer, shopSettings } from '../../../lib/demoData';
import styles from '../jobs.module.css';

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isRoadside, setIsRoadside] = useState(false);

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomer(customerId);
    setAvailableTrucks(getTrucksByCustomer(customerId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate creating and redirecting
    router.push('/dashboard/jobs/WO-8833');
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard/jobs" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '8px' }}>
            <ArrowLeft size={16} /> Back to Work Orders
          </Link>
          <h1>Create Work Order</h1>
          <p>WO-8833 (Auto-generated)</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className="btn btn-outline" onClick={() => router.push('/dashboard/jobs')}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            <Save size={18} />
            Create Work Order
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.gridTwoCol}>
        <div className={styles.leftCol}>
          {/* Customer & Unit Info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Customer & Unit</h2>
            <div className={styles.formSection}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Customer</label>
                  <select className={styles.select} value={selectedCustomer} onChange={handleCustomerChange} required>
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unit/Truck</label>
                  <select className={styles.select} required disabled={!selectedCustomer}>
                    <option value="">Select Unit...</option>
                    {availableTrucks.map(t => (
                      <option key={t.id} value={t.id}>{t.unitNumber} - {t.make} {t.model}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Trailer (Optional)</label>
                  <input type="text" className={styles.input} placeholder="Trailer #" />
                </div>
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div className={styles.card} style={{ marginTop: '1.5rem' }}>
            <h2 className={styles.cardTitle}>Issue Details</h2>
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Complaint / Reason for Service</label>
                <textarea className={styles.textarea} placeholder="Describe the customer's complaint or requested service..." required></textarea>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Internal Notes</label>
                <textarea className={styles.textarea} placeholder="Notes visible only to shop staff..."></textarea>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Customer Notes</label>
                <textarea className={styles.textarea} placeholder="Notes that will appear on the invoice..."></textarea>
              </div>
            </div>
            
            <div className={styles.formSection}>
              <label className={styles.label}>Photos / Attachments</label>
              <div className={styles.uploadArea}>
                <Upload size={24} style={{ color: 'var(--color-primary)', marginBottom: '8px' }} />
                <p>Drag and drop photos here, or click to browse</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          {/* Assignment & Settings */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Settings</h2>
            
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Assign Technician</label>
                <select className={styles.select}>
                  <option value="">Unassigned</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.label}>Priority</label>
              <div className={styles.radioGroup} style={{ flexDirection: 'column' }}>
                <label className={styles.radioLabel}>
                  <input type="radio" name="priority" value="normal" defaultChecked /> Normal
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="priority" value="high" /> High
                </label>
                <label className={styles.radioLabel}>
                  <input type="radio" name="priority" value="emergency" /> Emergency
                </label>
              </div>
            </div>

            <div className={styles.formSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className={styles.label}>Breakdown / Emergency</span>
                <label className={styles.toggleSwitch}>
                  <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={styles.label}>Roadside Call</span>
                <label className={styles.toggleSwitch}>
                  <input type="checkbox" checked={isRoadside} onChange={(e) => setIsRoadside(e.target.checked)} />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </div>

          {/* Authorization */}
          <div className={styles.card} style={{ marginTop: '1.5rem' }}>
            <h2 className={styles.cardTitle}>Customer Authorization</h2>
            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
              <label className={styles.radioLabel}>
                <input type="checkbox" /> I authorize the repair work and diagnostic steps.
              </label>
            </div>
            <div className={styles.signatureBox}>
              Sign Here
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
