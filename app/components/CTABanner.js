'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, PlayCircle, CheckCircle2 } from 'lucide-react';
import styles from './CTABanner.module.css';

export default function CTABanner() {
  return (
    <section className={styles.section}>
      <div className="container">
        
        <div className={styles.ctaCard}>
          {/* Ambient radial glow effect */}
          <div className={styles.glowBg} />
          
          <div className={styles.content}>
            <span className={styles.pillLabel}>
              START PROTECTING YOUR SHOP MARGINS
            </span>

            <h2 className={styles.headline}>
              Ready to see where your shop is losing money?
            </h2>

            <p className={styles.subtitle}>
              Start your 14-day free trial — track live bay hours, stop unbilled parts leakage, 
              and sync invoices directly with QuickBooks in real time.
            </p>

            <div className={styles.btnGroup}>
              <Link href="/signup" className={styles.primaryBtn}>
                <span>Start 14-Day Free Trial</span>
                <ArrowRight size={18} />
              </Link>
              
              <Link href="/bay" className={styles.secondaryBtn}>
                <PlayCircle size={18} />
                <span>Launch Interactive Bay</span>
              </Link>
            </div>

            <div className={styles.trustStrip}>
              <div className={styles.trustItem}>
                <CheckCircle2 size={15} className={styles.checkIcon} />
                <span>14-day free trial</span>
              </div>
              <span className={styles.dot}>·</span>
              <div className={styles.trustItem}>
                <CheckCircle2 size={15} className={styles.checkIcon} />
                <span>No credit card required</span>
              </div>
              <span className={styles.dot}>·</span>
              <div className={styles.trustItem}>
                <CheckCircle2 size={15} className={styles.checkIcon} />
                <span>No contracts</span>
              </div>
              <span className={styles.dot}>·</span>
              <div className={styles.trustItem}>
                <CheckCircle2 size={15} className={styles.checkIcon} />
                <span>Free 1-on-1 shop data import</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
