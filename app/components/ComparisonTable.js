'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { X, Check, ArrowRight } from 'lucide-react';
import styles from './ComparisonTable.module.css';

const comparisons = [
  {
    feature: 'Shop Job Board',
    oldWay: 'Dry-erase whiteboards that get smudged or out of sync',
    newWay: 'Live digital command board searchable by customer or VIN'
  },
  {
    feature: 'Technician Time Tracking',
    oldWay: 'Chasing techs on Friday to rebuild unlogged labor hours',
    newWay: 'Two-tap mobile time clock attached directly to repair orders'
  },
  {
    feature: 'Parts & Markup Protection',
    oldWay: 'Uncaught supplier price hikes & forgotten parts markup',
    newWay: 'Scanned supplier paperwork with automated markup rules'
  },
  {
    feature: 'Profit Margin Visibility',
    oldWay: 'Waiting 30 days for month-end P&L to see if you made money',
    newWay: 'Live job-level profit margin visibility before invoice close-out'
  },
  {
    feature: 'Accounting Workflow',
    oldWay: 'Manual duplicate data entry into QuickBooks every week',
    newWay: 'Seamless automated 2-way sync with QuickBooks'
  },
  {
    feature: 'Customer Approvals',
    oldWay: 'Phone tag & counter delays waiting for signed paperwork',
    newWay: 'Instant customer smartphone estimate approval links'
  }
];

export default function ComparisonTable() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px 0px' });

  return (
    <section className={`section ${styles.comparisonSection}`} ref={ref}>
      <div className="container">
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-label">WHY SHOPS SWITCH</div>
            <h2 className="section-title">Stop running your shop on guesswork.</h2>
            <p className="section-subtitle">
              See how Fleet Finance Flow compares to whiteboards, spreadsheets, and legacy shop software.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className={styles.grid}
        >
          {/* Old Way Column */}
          <div className={styles.oldCol}>
            <div className={styles.colHeader}>
              <span className={styles.oldBadge}>OLD WAY</span>
              <h3 className={styles.colTitle}>Whiteboards & Spreadsheets</h3>
            </div>
            <div className={styles.rowsList}>
              {comparisons.map((item, idx) => (
                <div key={idx} className={styles.rowItem}>
                  <div className={styles.oldIconWrapper}>
                    <X size={16} />
                  </div>
                  <div>
                    <span className={styles.itemCategory}>{item.feature}</span>
                    <p className={styles.itemText}>{item.oldWay}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Way Column (Featured) */}
          <div className={styles.newCol}>
            <div className={styles.featuredTag}>RECOMMENDED</div>
            <div className={styles.colHeader}>
              <span className={styles.newBadge}>FLEET FINANCE FLOW</span>
              <h3 className={styles.newColTitle}>All-In-One Profit Command</h3>
            </div>
            <div className={styles.rowsList}>
              {comparisons.map((item, idx) => (
                <div key={idx} className={styles.rowItem}>
                  <div className={styles.newIconWrapper}>
                    <Check size={16} />
                  </div>
                  <div>
                    <span className={styles.itemCategoryNew}>{item.feature}</span>
                    <p className={styles.itemTextNew}>{item.newWay}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
