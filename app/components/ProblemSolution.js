'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Clock, Smartphone, PackageCheck, Receipt, XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import styles from './ProblemSolution.module.css';

const profitLeaks = [
  {
    icon: Clock,
    title: 'Unbilled Bay Labor',
    metric: '96.2% Billed Recovery',
    leak: 'Techs work 8 hours on the floor, but only 5 make it onto the invoice due to lost paper logs.',
    fix: '2-tap bay clock-in binds every technician minute directly to the open repair order.'
  },
  {
    icon: Smartphone,
    title: 'Estimate Approval Stalls',
    metric: '< 3 Min Sign-Off',
    leak: 'Trucks sit burning valuable bay space for hours while writers play phone tag with dispatchers.',
    fix: 'Instant 1-click SMS estimate links with photo proof for rapid digital customer authorization.'
  },
  {
    icon: PackageCheck,
    title: 'Parts & Core Margin Bleed',
    metric: '+24.5% Margin Shield',
    leak: 'Parts invoiced below markup matrix and lost core returns drain thousands in monthly profit.',
    fix: 'Automated matrix pricing and core tracking lock in your gross margins before job completion.'
  },
  {
    icon: Receipt,
    title: 'QuickBooks Re-Entry Lag',
    metric: 'Zero Double Entry',
    leak: 'Friday bookkeeping backlog manually re-typing paper repair orders and invoices.',
    fix: '1-click invoice generation with seamless 2-way live sync for ledgers, invoices, and payments.'
  }
];

export default function ProblemSolution() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section className={`section ${styles.section}`} ref={sectionRef} id="how-it-works">
      <div className="container">
        
        <div className="section-header">
          <span className="section-label">PROFIT LEAK PROTECTION</span>
          <h2 className="section-title">
            Stop Margin Leakage Before The Job Closes.
          </h2>
          <p className="section-subtitle">
            Four common shop bottlenecks that quietly drain gross profit — and how Fleet Finance Flow fixes them.
          </p>
        </div>

        <div className={styles.grid}>
          {profitLeaks.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div 
                key={idx}
                className={styles.card}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
              >
                {/* Header: Icon + Title + Metric */}
                <div className={styles.cardHeader}>
                  <div className={styles.titleWrap}>
                    <div className={styles.iconCircle}>
                      <Icon size={18} />
                    </div>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                  </div>
                  <span className={styles.metricBadge}>{item.metric}</span>
                </div>

                {/* Leak (Problem) Row */}
                <div className={styles.comparisonRow}>
                  <div className={styles.rowItemLeak}>
                    <div className={styles.statusIconRed}>
                      <XCircle size={15} />
                    </div>
                    <p className={styles.leakText}>{item.leak}</p>
                  </div>

                  {/* Fix (Solution) Row */}
                  <div className={styles.rowItemFix}>
                    <div className={styles.statusIconGreen}>
                      <CheckCircle2 size={15} />
                    </div>
                    <p className={styles.fixText}>{item.fix}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Streamlined Callout Bar */}
        <motion.div 
          className={styles.calloutBar}
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className={styles.calloutText}>
            <strong>Stop guessing your shop's profitability at month-end.</strong>
            <span>See exact labor hours, parts markups, and job margins while the truck is still on the lift.</span>
          </div>
          <a href="/signup" className={styles.calloutBtn}>
            <span>Test Your Shop Free</span>
            <ArrowRight size={15} />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
