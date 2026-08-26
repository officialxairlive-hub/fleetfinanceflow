'use client';

import React from 'react';
import styles from './TrustBar.module.css';

const integrations = [
  { name: 'QuickBooks', color: '#2CA01C' },
  { name: 'Stripe', color: '#635BFF' },
  { name: 'CARFAX', color: '#00629A' },
  { name: 'Nexpart', color: '#D2232A' },
  { name: 'MOTOR', color: '#E1261C' },
];

export default function TrustBar() {
  return (
    <section className={styles.section}>
      <div className={`container ${styles.container}`}>
        <p className={styles.label}>SEAMLESSLY CONNECTS WITH THE TOOLS YOU ALREADY USE</p>
        
        <div className={styles.logoGrid}>
          {integrations.map((item, idx) => (
            <div key={idx} className={styles.logoItem}>
              <span className={styles.logoText} style={{ '--brand-color': item.color }}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
