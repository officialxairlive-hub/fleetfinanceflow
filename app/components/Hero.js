'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from './Hero.module.css';
import { ArrowRight, PlayCircle, ShieldCheck, Star, Users, TrendingUp, CheckCircle, Cpu } from 'lucide-react';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className="grid-bg" />
      <div className={styles.glow} />
      
      <div className={`container ${styles.content}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={styles.labelWrapper}
        >
          <span className="section-label">HEAVY-DUTY SHOP MANAGEMENT SOFTWARE</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className={styles.title}>
            Your Shop Runs on Numbers.<br />
            Make Sure They're Right.
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.subtitle}
        >
          One platform to manage jobs, track technician hours, handle parts and invoices, and see real profit — before it slips away.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className={styles.ctas}
        >
          <button className="btn btn-primary btn-lg">
            Book Free Walkthrough
            <ArrowRight size={18} />
          </button>
          <button className="btn btn-outline btn-lg">
            <PlayCircle size={18} />
            See How It Works
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className={styles.stats}
        >
          <div className={styles.statPill}>
            <Users size={16} className={styles.statIcon} />
            <span><strong>250+</strong> Heavy-Duty Shops</span>
          </div>
          <div className={styles.statPill}>
            <ShieldCheck size={16} className={styles.statIcon} />
            <span><strong>98%</strong> Customer Retention</span>
          </div>
          <div className={styles.statPill}>
            <Star size={16} className={styles.statIcon} />
            <span><strong>4.9★</strong> User Rating</span>
          </div>
          <div className={styles.statPill}>
            <TrendingUp size={16} className={styles.statIcon} />
            <span><strong>$4.2M+</strong> Recovered Margins</span>
          </div>
        </motion.div>

        {/* Dual Hero Visual: High-Tech Truck + Floating Dashboard UI */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={styles.heroVisualContainer}
        >
          <div className={styles.heroImageCard}>
            <Image
              src="/images/hero-truck.jpg"
              alt="Heavy-Duty Diagnostic Technology"
              width={1100}
              height={620}
              priority
              className={styles.heroTruckImg}
            />
            
            {/* Floating Glassmorphic Software Overlay */}
            <motion.div
              initial={{ opacity: 0, x: 20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className={styles.floatingDashboardCard}
            >
              <div className={styles.floatingHeader}>
                <Cpu size={18} className={styles.floatingIcon} />
                <span>Live Bay Diagnostic & Margin Feed</span>
              </div>
              <Image
                src="/images/dashboard-light.jpg"
                alt="Live Shop Dashboard Preview"
                width={500}
                height={300}
                className={styles.miniDashboardImg}
              />
            </motion.div>
          </div>
          <div className={styles.imageFade} />
        </motion.div>
      </div>
    </section>
  );
}
