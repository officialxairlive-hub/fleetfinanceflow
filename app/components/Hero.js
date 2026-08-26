'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Hero.module.css';
import { ArrowRight, PlayCircle, Check } from 'lucide-react';

export default function Hero() {
  return (
    <section className={styles.hero}>

      {/* ── Background Image ── */}
      <div className={styles.bgWrapper}>
        <Image
          src="/images/hero-connected-ecosystem.jpg"
          alt="Shop Owner, Mechanic with Truck, Fleet Customer — All Connected"
          fill
          priority
          quality={90}
          className={styles.bgImage}
        />
        {/* Gradient scrim: strong at top for text, fades out in middle, returns at bottom for ribbon */}
        <div className={styles.scrim} />
      </div>

      {/* ── Overlaid Content ── */}
      <div className={styles.inner}>

        {/* Headline + Subtitle + CTAs */}
        <div className={styles.textBlock}>
          <motion.p
            className={styles.eyebrow}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Heavy-Duty Shop Management Software
          </motion.p>

          <motion.h1
            className={styles.headline}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            One Platform.<br />Three Connected Perspectives.
          </motion.h1>

          <motion.p
            className={styles.subline}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            The shop owner tracking margins on their desktop. The mechanic logging
            time on a bay tablet. The fleet customer approving estimates on their phone.
            All in one live ecosystem.
          </motion.p>

          <motion.div
            className={styles.ctas}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/signup" className={styles.btnPrimary}>
              Start 14-Day Free Trial <ArrowRight size={15} />
            </Link>
            <Link href="/bay" className={styles.btnGhost}>
              <PlayCircle size={15} /> Launch Live Demo
            </Link>
          </motion.div>

          <motion.div
            className={styles.trust}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <span><Check size={13} className={styles.checkIcon} /> No credit card required</span>
            <span className={styles.dot}>·</span>
            <span><Check size={13} className={styles.checkIcon} /> Live in 10 minutes</span>
            <span className={styles.dot}>·</span>
            <span><Check size={13} className={styles.checkIcon} /> 2-way QuickBooks sync</span>
          </motion.div>
        </div>

      </div>

      {/* ── Bottom Telemetry Ribbon (Aston Martin style, sits at very bottom) ── */}
      <motion.div
        className={styles.ribbon}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
      >
        {[
          { label: 'Billed Labor Efficiency', value: '96.2%', sub: 'vs 68% industry avg' },
          { label: 'Approval Turnaround', value: '3.2 min', sub: 'via instant SMS link' },
          { label: 'Shop Labor Rate', value: '$145/hr', sub: 'CAD flat-rate billing' },
          { label: 'Parts Margin Shield', value: '+24.5%', sub: 'automated matrix markup' },
          { label: 'QuickBooks Sync', value: 'Instant', sub: '2-way live ledger' },
        ].map((item) => (
          <div key={item.label} className={styles.ribbonCard}>
            <span className={styles.ribbonLabel}>{item.label}</span>
            <span className={styles.ribbonValue}>{item.value}</span>
            <span className={styles.ribbonSub}>{item.sub}</span>
          </div>
        ))}
      </motion.div>

    </section>
  );
}
