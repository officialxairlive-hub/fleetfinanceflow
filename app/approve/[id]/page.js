'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Check, X, Calculator, ShieldAlert, CheckCircle } from 'lucide-react';
import { workOrders } from '../../lib/demoData';
import styles from '../approve.module.css';

export default function ApprovalPage() {
  const params = useParams();
  const { id } = params;
  
  const [order, setOrder] = useState(null);
  const [signature, setSignature] = useState('');
  const [name, setName] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    // In a real app, we'd fetch from Supabase here
    const found = workOrders.find(wo => wo.id === id);
    if (found) {
      setOrder(found);
    }
  }, [id]);

  const handleApprove = () => {
    if (!name.trim()) {
      alert("Please enter your name to approve.");
      return;
    }
    
    // Simulate API call to save approval
    setIsApproved(true);
  };

  const handleDecline = () => {
    // Simulate API call to decline
    alert("Repair declined. The shop will contact you to discuss options.");
  };

  if (!order) {
    return (
      <div className={styles.container}>
        <div className={styles.main} style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2>Work Order Not Found</h2>
          <p>Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  const labourTotal = (order.labour || []).reduce((sum, l) => sum + (l.hours * l.rate), 0);
  const partsTotal = (order.parts || []).reduce((sum, p) => sum + (p.qty * p.sell), 0);
  const total = labourTotal + partsTotal;

  if (isApproved) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <Calculator size={24} color="var(--color-primary)" />
            Fleet Finance <span>Flow</span>
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.successState}>
            <CheckCircle size={64} className={styles.successIcon} />
            <h1 className={styles.successTitle}>Repair Approved</h1>
            <p>Thank you, {name}. Your approval has been securely logged.</p>
            <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
              We will proceed with the repairs and notify you when your vehicle is ready.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Calculator size={24} color="var(--color-primary)" />
          Fleet Finance <span>Flow</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.alert}>
          <ShieldAlert size={24} className={styles.alertIcon} />
          <div className={styles.alertContent}>
            <h2>Authorization Required</h2>
            <p>
              Additional repairs are required for your vehicle. Please review the details below 
              and provide your authorization to proceed.
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Repair Order {order.id}</h3>
            <span className={styles.orderMeta}>{order.unitDisplay}</span>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Original Complaint</h4>
            <p className={styles.sectionText}>{order.complaint || 'N/A'}</p>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Diagnostic Findings</h4>
            <p className={styles.sectionText}>{order.cause || 'N/A'}</p>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Proposed Correction</h4>
            <p className={styles.sectionText}>{order.correction || 'N/A'}</p>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Estimated Costs</h3>
          
          <div className={styles.costRow}>
            <span>Labour Estimate</span>
            <span>${labourTotal.toFixed(2)}</span>
          </div>
          
          <div className={styles.costRow}>
            <span>Parts Estimate</span>
            <span>${partsTotal.toFixed(2)}</span>
          </div>
          
          <div className={styles.costRow}>
            <span>Shop Supplies (8%)</span>
            <span>${(labourTotal * 0.08).toFixed(2)}</span>
          </div>
          
          <div className={styles.costRow}>
            <span>Tax (5%)</span>
            <span>${((labourTotal + partsTotal + (labourTotal * 0.08)) * 0.05).toFixed(2)}</span>
          </div>
          
          <div className={styles.costTotal}>
            <span>Total Estimated Cost</span>
            <span>${(total + (labourTotal * 0.08) + ((total + (labourTotal * 0.08)) * 0.05)).toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Digital Signature</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            By signing below, you authorize the repair work described above, including the 
            installation of necessary parts and materials, at the estimated prices provided.
          </p>

          <div className={styles.signatureArea}>
            <span className={styles.signatureLabel}>Draw Signature:</span>
            <div className={styles.canvasContainer}>
              <span className={styles.canvasPlaceholder}>[Signature Canvas Area]</span>
              {/* In a real app, use react-signature-canvas here */}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.signatureLabel} htmlFor="authName">Print Name:</label>
              <input 
                id="authName"
                type="text" 
                className={styles.input} 
                placeholder="First and Last Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Timestamp: {new Date().toLocaleString()} | Device logged for security.
            </p>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnApprove} onClick={handleApprove}>
              <Check size={20} />
              Approve Repair
            </button>
            <button className={styles.btnDecline} onClick={handleDecline}>
              <X size={20} style={{ marginRight: '8px', display: 'inline' }}/>
              Decline
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
