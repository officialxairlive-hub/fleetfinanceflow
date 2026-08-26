'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './TrustBar.module.css';
import { ShieldCheck, CheckCircle2, ArrowRight, Zap, RefreshCw } from 'lucide-react';

const trustPillars = [
  {
    title: 'North American HD Standards',
    desc: 'Built specifically for Class 6-8 commercial truck, trailer, diesel & vocational shops. Full CAD & USD multi-currency with provincial & state tax rules.',
    tag: 'US & Canada Certified',
  },
  {
    title: '2-Way QuickBooks Sync',
    desc: 'Live bidirectional sync for repair orders, customer ledgers, parts invoices, and payments. Zero duplicate bookkeeping entries on Friday afternoons.',
    tag: 'Official Accounting Integration',
  },
  {
    title: 'Stripe Verified Commercial Payments',
    desc: 'Instant online credit card, debit, ACH & EFT payment links sent with digital estimates. Money lands directly in your commercial operating account.',
    tag: 'Bank-Grade Security',
  },
  {
    title: 'Zero Lock-in Contract Guarantee',
    desc: 'Transparent month-to-month terms. Free 1-on-1 white glove data onboarding — we import your existing units, inventory, and customer accounts.',
    tag: 'Honest Business Terms',
  },
];

export default function TrustBar() {
  return (
    <section className={styles.section}>
      <div className={`container ${styles.container}`}>
        <motion.div 
          className={styles.headerArea}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">BUILT FOR REAL COMMERCIAL REPAIR OPERATIONS</span>
          <h2 className={styles.headline}>
            A Serious Tool for Shops That Value Real Numbers Over Gimmicks.
          </h2>
          <p className={styles.subheadline}>
            We aren't a generic startup app. Fleet Finance Flow was engineered around the daily reality of commercial diesel bays — protecting your labor recovery, parts markup, and cash flow.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {trustPillars.map((item, index) => (
            <motion.div 
              key={item.title}
              className={styles.card}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <div className={styles.tagBadge}>
                <CheckCircle2 size={13} className={styles.badgeIcon} />
                <span>{item.tag}</span>
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
