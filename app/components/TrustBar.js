'use client';

import React from 'react';
import styles from './TrustBar.module.css';
import { ShieldCheck, RefreshCw, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Class 6-8 Commercial Standard',
    desc: 'CAD & USD with provincial/state tax matrices'
  },
  {
    icon: RefreshCw,
    title: '2-Way QuickBooks Live Sync',
    desc: 'Automatic ledger, invoice & payment posting'
  },
  {
    icon: CreditCard,
    title: 'Stripe Commercial Payments',
    desc: 'Instant online card & ACH payment links'
  },
  {
    icon: CheckCircle2,
    title: 'Month-to-Month · No Contracts',
    desc: 'Free 1-on-1 shop data import & setup'
  }
];

export default function TrustBar() {
  return (
    <section className={styles.section}>
      <div className={`container ${styles.container}`}>
        <div className={styles.trustGrid}>
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className={styles.trustItem}>
                <div className={styles.iconWrap}>
                  <Icon size={16} />
                </div>
                <div className={styles.textWrap}>
                  <strong className={styles.itemTitle}>{item.title}</strong>
                  <span className={styles.itemDesc}>{item.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
