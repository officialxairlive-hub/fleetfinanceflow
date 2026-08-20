// CTABanner.js
'use client';

import { Check } from 'lucide-react';
import styles from './CTABanner.module.css';

const MARQUEE_TEXT = "30-Day Free Trial ✦ No long-term contracts ✦ No per-user fees ✦ No pressure ✦ Jobs & tech time ✦ Parts & invoices ✦ Profit in one system ✦ ";

export default function CTABanner() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.marqueeContainer}>
        <div className={styles.marquee}>
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
        </div>
      </div>

      <div className={styles.banner}>
        <div className="container">
          <div className={styles.content}>
            <div className={styles.glow}></div>
            <h2 className={styles.headline}>Ready to see where your shop is losing money?</h2>
            <p className={styles.subtitle}>
              Start your 30-day free trial — jobs, tech time, parts, invoices, and profit in one system.
            </p>
            <button className="btn btn-primary btn-lg">Sign Up Now</button>
            
            <div className={styles.features}>
              <div className={styles.featureItem}>
                <Check className={styles.icon} size={16} />
                <span>30-Day Free Trial</span>
              </div>
              <span className={styles.dot}>·</span>
              <div className={styles.featureItem}>
                <Check className={styles.icon} size={16} />
                <span>No contracts</span>
              </div>
              <span className={styles.dot}>·</span>
              <div className={styles.featureItem}>
                <Check className={styles.icon} size={16} />
                <span>No per-user fees</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.marqueeContainer}>
        <div className={styles.marquee} style={{ animationDirection: 'reverse' }}>
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
          <span>{MARQUEE_TEXT}</span>
        </div>
      </div>
    </section>
  );
}
