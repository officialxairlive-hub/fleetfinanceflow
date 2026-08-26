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
  Building2,
  Wrench,
  Smartphone
} from 'lucide-react';

export default function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={`container ${styles.container}`}>
        
        {/* 1. Clean Top Header & CTAs (Unobstructed, Generous Breathing Room) */}
        <div className={styles.heroIntro}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={styles.mainTitle}
          >
            One Platform. Three Connected Perspectives.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={styles.mainSubtitle}
          >
            <strong>Shop Owner</strong> managing margins on desktop · 
            <strong> Lead Mechanic</strong> logging floor time on bay tablet · 
            <strong> Fleet Customer</strong> approving estimates on mobile.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
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

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={styles.trustStrip}
          >
            <span><Check size={14} className={styles.checkIcon} /> No Credit Card Required</span>
            <span className={styles.divider}>•</span>
            <span><Check size={14} className={styles.checkIcon} /> Live in Under 10 Minutes</span>
            <span className={styles.divider}>•</span>
            <span><Check size={14} className={styles.checkIcon} /> 2-Way QuickBooks Sync</span>
          </motion.div>
        </div>

        {/* 2. Pristine 3-POV Visual Showcase Frame */}
        <motion.div 
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className={styles.showcaseCanvas}
        >
          {/* Main Visual Image (Completely Unobstructed) */}
          <div className={styles.imageWrapper}>
            <Image 
              src="/images/hero-connected-ecosystem.jpg"
              alt="Shop Owner on Laptop, Mechanic with Truck in Bay, Customer on Mobile"
              width={1320}
              height={740}
              priority
              className={styles.heroMasterImage}
            />

            {/* Clean Perspective Indicators */}
            <div className={styles.povIndicatorLeft}>
              <div className={styles.povIconWrap}><Building2 size={15} /></div>
              <div>
                <span className={styles.povRoleTitle}>1. Shop Owner (Office)</span>
                <span className={styles.povSubTitle}>Laptop · Live Profit & Dispatch</span>
              </div>
            </div>

            <div className={styles.povIndicatorCenter}>
              <div className={styles.povIconWrap}><Wrench size={15} /></div>
              <div>
                <span className={styles.povRoleTitle}>2. Lead Mechanic (Bay)</span>
                <span className={styles.povSubTitle}>iPad · Time Clock & Parts</span>
              </div>
            </div>

            <div className={styles.povIndicatorRight}>
              <div className={styles.povIconWrap}><Smartphone size={15} /></div>
              <div>
                <span className={styles.povRoleTitle}>3. Fleet Customer (Mobile)</span>
                <span className={styles.povSubTitle}>Phone · 1-Click SMS Approval</span>
              </div>
            </div>
          </div>

          {/* 3. Bottom Telemetry Spec Ribbon (Aston Martin Configurator Style) */}
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
