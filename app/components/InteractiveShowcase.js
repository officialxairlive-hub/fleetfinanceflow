'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Building2, Wrench, Smartphone, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import styles from './InteractiveShowcase.module.css';

const perspectives = [
  {
    id: 'owner',
    role: '1. Shop Owner (Office)',
    icon: Building2,
    badge: 'Live Profit & Dispatch',
    headline: 'Real-Time Bay Profitability & Automatic QuickBooks Sync',
    bullet1: 'Track live gross profit and labor efficiency by bay while jobs are open',
    bullet2: 'See exact tech floor time vs. billed flat-rate hours with zero leakage',
    bullet3: '1-click convert approved work orders to final invoices without double entry',
    statNumber: '68.4%',
    statLabel: 'Average gross margin locked',
    image: '/images/dashboard-light.jpg'
  },
  {
    id: 'mechanic',
    role: '2. Lead Mechanic (Bay)',
    icon: Wrench,
    badge: 'Floor Time & Parts',
    headline: '2-Tap Bay Tablet Time Tracking & Direct Parts Requests',
    bullet1: 'Clock into repair orders right at the truck bumper without walking to front desk',
    bullet2: 'Request parts from inventory with automated matrix markup rules applied',
    bullet3: 'Attach digital DOT & CVSE inspection photos directly to the work order',
    statNumber: '96.2%',
    statLabel: 'Billed labor recovery rate',
    image: '/images/bay-tablet.jpg'
  },
  {
    id: 'customer',
    role: '3. Fleet Customer (Mobile)',
    icon: Smartphone,
    badge: 'SMS Sign-Off & Pay',
    headline: 'Instant Mobile Estimate Approvals & Transparent Invoicing',
    bullet1: 'Send clean SMS links with transparent labor and parts breakdowns',
    bullet2: 'Customer reviews inspection photos and signs with their finger in 2 minutes',
    bullet3: 'Accept credit card, debit, EFT or ACH payments with zero phone tag',
    statNumber: '< 3 Min',
    statLabel: 'Average digital sign-off turnaround',
    image: '/images/office-setup.jpg'
  }
];

export default function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState(perspectives[0].id);
  const current = perspectives.find(p => p.id === activeTab) || perspectives[0];

  return (
    <section className={`section ${styles.showcaseSection}`} id="features">
      <div className="container">
        
        <div className="section-header">
          <span className="section-label">LIVE PRODUCT PREVIEW</span>
          <h2 className="section-title">One Connected System. Zero Wasted Steps.</h2>
          <p className="section-subtitle">
            Switch between the three views to see how Fleet Finance Flow connects the office, the garage floor, and your fleet customers.
          </p>
        </div>

        {/* 3 Perspective Switcher Tabs */}
        <div className={styles.tabBar}>
          {perspectives.map((p) => {
            const Icon = p.icon;
            const isActive = activeTab === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              >
                <Icon size={16} />
                <span>{p.role}</span>
              </button>
            );
          })}
        </div>

        {/* Active Perspective Showcase Card */}
        <div className={styles.contentCard}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className={styles.grid}
            >
              {/* Left Details */}
              <div className={styles.detailsCol}>
                <span className={styles.viewBadge}>{current.badge}</span>
                <h3 className={styles.viewHeadline}>{current.headline}</h3>
                
                <ul className={styles.pointsList}>
                  <li className={styles.pointItem}>
                    <Check size={14} className={styles.checkIcon} />
                    <span>{current.bullet1}</span>
                  </li>
                  <li className={styles.pointItem}>
                    <Check size={14} className={styles.checkIcon} />
                    <span>{current.bullet2}</span>
                  </li>
                  <li className={styles.pointItem}>
                    <Check size={14} className={styles.checkIcon} />
                    <span>{current.bullet3}</span>
                  </li>
                </ul>

                <div className={styles.statBox}>
                  <div className={styles.statNumber}>{current.statNumber}</div>
                  <div className={styles.statLabel}>{current.statLabel}</div>
                </div>

                <div className={styles.ctaRow}>
                  <a href="/signup" className="btn btn-primary">
                    Start 14-Day Free Trial
                    <ArrowRight size={14} />
                  </a>
                  <a href="/bay" className="btn btn-outline">
                    Launch Interactive Bay
                  </a>
                </div>
              </div>

              {/* Right Image */}
              <div className={styles.imageCol}>
                <div className={styles.screenFrame}>
                  <Image
                    src={current.image}
                    alt={current.headline}
                    width={640}
                    height={400}
                    className={styles.screenImage}
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
