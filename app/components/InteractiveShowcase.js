'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { LayoutDashboard, Clock, PackageCheck, Receipt, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import styles from './InteractiveShowcase.module.css';

const tabs = [
  {
    id: 'workflow',
    label: 'Live Job Board',
    icon: LayoutDashboard,
    badge: '100% Real-Time Visibility',
    title: 'Replace the Whiteboard with a Live Command Center',
    subtitle: 'See every active repair order, assigned tech, parts status, and clocked labor minutes from a single screen.',
    points: [
      'Search instantly by customer, VIN, fleet unit, or technician',
      'Filter by bottlenecks: "Waiting on Parts", "Needs Approval", or "Ready to Invoice"',
      'Prevent idle bay time with automated status handoffs'
    ],
    statNumber: '3.5 Hrs',
    statLabel: 'Saved per service manager weekly',
    image: '/images/dashboard-light.jpg'
  },
  {
    id: 'clockin',
    label: 'Tech Time Clock',
    icon: Clock,
    badge: 'Zero Lost Hours',
    title: 'Two-Tap Floor Time Tracking directly from Bay Tablets',
    subtitle: 'Technicians clock in, switch repair jobs, and attach work notes without walking back to the front desk.',
    points: [
      'Every labor minute automatically attaches to the repair order',
      'No rebuilding job times at the end of the week',
      'Compare actual technician hours vs. billed flat-rate labor'
    ],
    statNumber: '+28%',
    statLabel: 'Billed labor accuracy improvement',
    image: '/images/bay-tablet.jpg'
  },
  {
    id: 'parts',
    label: 'Parts & Margins',
    icon: PackageCheck,
    badge: 'Profit Margin Shield',
    title: 'Catch Parts Cost Leaks Before Invoicing',
    subtitle: 'Track supplier cost changes, parts markup rules, and job-level margins while the truck is still in the bay.',
    points: [
      'Scan supplier invoices directly into repair orders',
      'Set automated markup rules for fleet accounts and retail',
      'Get margin alerts if a job falls below target profitability'
    ],
    statNumber: '14.2%',
    statLabel: 'Average gross profit margin increase',
    image: '/images/office-setup.jpg'
  },
  {
    id: 'invoicing',
    label: 'Instant Payments',
    icon: Receipt,
    badge: 'Faster Cash Flow',
    title: 'Digital Estimates to Instant Payment Links',
    subtitle: 'Send digital estimates for customer smartphone approval. Convert approved jobs into invoices with 1-click.',
    points: [
      'Text/email customer estimate approval links',
      'Accept credit cards online, in-person, or via text-to-pay',
      'Automated 2-way sync with QuickBooks Online & Desktop'
    ],
    statNumber: '4x',
    statLabel: 'Faster customer approval turnaround',
    image: '/images/dashboard-light.jpg'
  },
  {
    id: 'ai',
    label: 'AI Assistant',
    icon: Sparkles,
    badge: 'Next-Gen Intelligence',
    title: 'AI Repair Summary & Estimate Generator',
    subtitle: 'Speed up administrative work with built-in shop AI that drafts estimate descriptions and summarizes tech notes.',
    points: [
      'Turn raw technician bay notes into professional customer summaries',
      'AI estimate suggestions based on repair history',
      'Instant answers to daily shop performance questions'
    ],
    statNumber: '75%',
    statLabel: 'Reduction in administrative typing time',
    image: '/images/office-setup.jpg'
  }
];

export default function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === activeTab);

  return (
    <section className={`section ${styles.showcaseSection}`}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">INTERACTIVE PLATFORM DEMO</div>
          <h2 className="section-title">Experience the modern shop workflow.</h2>
          <p className="section-subtitle">
            Click through the core modules below to see how Fleet Finance Flow connects every corner of your shop.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabList}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabBtn} ${isActive ? styles.activeTabBtn : ''}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className={styles.activePill}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={styles.tabContent}>
                  <Icon size={18} className={styles.tabIcon} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className={styles.displayCard}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={styles.gridContainer}
            >
              {/* Left Column: Text & Features */}
              <div className={styles.infoCol}>
                <span className={styles.badge}>{current.badge}</span>
                <h3 className={styles.displayTitle}>{current.title}</h3>
                <p className={styles.displaySubtitle}>{current.subtitle}</p>

                <ul className={styles.pointsList}>
                  {current.points.map((point, idx) => (
                    <li key={idx} className={styles.pointItem}>
                      <CheckCircle2 size={18} className={styles.checkIcon} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className={styles.statBox}>
                  <div className={styles.statNumber}>{current.statNumber}</div>
                  <div className={styles.statLabel}>{current.statLabel}</div>
                </div>
              </div>

              {/* Right Column: Visual Mockup */}
              <div className={styles.visualCol}>
                <div className={styles.imageFrame}>
                  <Image
                    src={current.image}
                    alt={current.title}
                    width={800}
                    height={500}
                    className={styles.previewImage}
                    priority
                  />
                  <div className={styles.glassOverlay}>
                    <div className={styles.overlayDot} />
                    <span className={styles.overlayText}>Live System Preview</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
