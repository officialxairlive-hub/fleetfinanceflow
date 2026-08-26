'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Hero.module.css';
import { 
  ArrowRight, 
  PlayCircle, 
  Check, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Sparkles,
  Building2,
  Wrench,
  Truck,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={`container ${styles.container}`}>
        
        {/* Top Tag */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.announcementWrapper}
        >
          <span className={styles.announcementPill}>
            <span className={styles.pillPulse} />
            <Sparkles size={13} className={styles.pillSparkle} />
            LIVE REPAIR OPERATIONS ECOSYSTEM
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.mainTitle}
        >
          One Platform. Three Connected Perspectives.
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.mainSubtitle}
        >
          <strong>Shop Owner</strong> managing jobs & protecting margins on desktop · 
          <strong> Lead Mechanic</strong> clocking time & requesting parts on bay tablet · 
          <strong> Fleet Customer</strong> approving estimates in seconds from their phone.
        </motion.p>

        {/* Action CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={styles.ctaGroup}
        >
          <Link href="/signup" className={`btn btn-primary btn-lg ${styles.primaryBtn}`}>
            Start 14-Day Free Trial
            <ArrowRight size={18} />
          </Link>
          <Link href="/bay" className={`btn btn-outline btn-lg ${styles.secondaryBtn}`}>
            <PlayCircle size={18} />
            Launch Live Bay Demo
          </Link>
        </motion.div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={styles.trustStrip}
        >
          <span><Check size={14} className={styles.checkIcon} /> No Credit Card Required</span>
          <span className={styles.divider}>•</span>
          <span><Check size={14} className={styles.checkIcon} /> Live in Under 10 Minutes</span>
          <span className={styles.divider}>•</span>
          <span><Check size={14} className={styles.checkIcon} /> 2-Way QuickBooks Sync</span>
        </motion.div>

        {/* Master Showcase Frame (Aston Martin Configurator Style) */}
        <motion.div 
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className={styles.showcaseCanvas}
        >
          {/* Top Bar inside Canvas */}
          <div className={styles.canvasHeader}>
            <div className={styles.canvasHeaderLeft}>
              <span className={styles.canvasHeaderTitle}>COMMERCIAL REPAIR ECOSYSTEM</span>
              <span className={styles.canvasHeaderSub}>Real-Time Cross-Device Synchronization</span>
            </div>
            <div className={styles.liveStatusBadge}>
              <span className={styles.liveStatusDot} />
              <span>All 3 Systems Synced</span>
            </div>
          </div>

          {/* Unified 3-POV Master Image */}
          <div className={styles.imageContainer}>
            <Image 
              src="/images/hero-connected-ecosystem.jpg"
              alt="Shop Owner on Laptop, Mechanic in Bay with Truck, Customer on Mobile"
              width={1280}
              height={720}
              priority
              className={styles.heroMasterImage}
            />

            {/* Perspective Overlay Pills */}
            <div className={styles.povPillLeft}>
              <div className={styles.povPillIcon}><Building2 size={14} /></div>
              <div>
                <span className={styles.povPillRole}>1. Shop Owner (Office)</span>
                <span className={styles.povPillDesc}>Laptop · Live Profit & Dispatch</span>
              </div>
            </div>

            <div className={styles.povPillCenter}>
              <div className={styles.povPillIcon}><Wrench size={14} /></div>
              <div>
                <span className={styles.povPillRole}>2. Lead Mechanic (Bay)</span>
                <span className={styles.povPillDesc}>iPad · Time Clock & Parts Request</span>
              </div>
            </div>

            <div className={styles.povPillRight}>
              <div className={styles.povPillIcon}><Smartphone size={14} /></div>
              <div>
                <span className={styles.povPillRole}>3. Fleet Customer (Mobile)</span>
                <span className={styles.povPillDesc}>Phone · 1-Click SMS Sign-Off</span>
              </div>
            </div>
          </div>

          {/* Bottom Feature Highlights Spec Ribbon (from Aston Martin inspiration) */}
          <div className={styles.specRibbon}>
            <div className={styles.specCard}>
              <div className={styles.specLabel}>Billed Labor Efficiency</div>
              <div className={styles.specValue}>96.2%</div>
              <div className={styles.specFoot}>vs 68% industry avg</div>
            </div>

            <div className={styles.specCard}>
              <div className={styles.specLabel}>Approval Turnaround</div>
              <div className={styles.specValue}>3.2 min</div>
              <div className={styles.specFoot}>instant SMS link</div>
            </div>

            <div className={styles.specCard}>
              <div className={styles.specLabel}>Shop Labor Rate</div>
              <div className={styles.specValue}>$145.00</div>
              <div className={styles.specFoot}>per billed hour CAD</div>
            </div>

            <div className={styles.specCard}>
              <div className={styles.specLabel}>Parts Margin Shield</div>
              <div className={styles.specValue}>+24.5%</div>
              <div className={styles.specFoot}>automated markup matrix</div>
            </div>

            <div className={styles.specCard}>
              <div className={styles.specLabel}>Accounting Sync</div>
              <div className={styles.specValue}>Instant</div>
              <div className={styles.specFoot}>2-way QuickBooks</div>
            </div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
