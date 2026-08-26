'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Hero.module.css';
import { 
  ArrowRight, 
  PlayCircle, 
  ShieldCheck, 
  Star, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Cpu, 
  Smartphone, 
  LayoutDashboard, 
  Wrench, 
  Zap, 
  Check, 
  Sparkles, 
  Clock, 
  DollarSign 
} from 'lucide-react';

const PREVIEWS = [
  {
    id: 'dispatch',
    label: 'Owner Command Center',
    icon: LayoutDashboard,
    badge: 'Live Profit & Bay Tracking',
    image: '/images/dashboard-light.jpg',
    description: 'Live visibility across active work orders, technician efficiency, and job margins.'
  },
  {
    id: 'bay',
    label: 'Technician Bay Tablet',
    icon: Wrench,
    badge: '2-Tap Time & Parts Logging',
    image: '/images/bay-tablet.jpg',
    description: 'Mechanics clock into repair orders, request parts, and document photos from any phone or tablet.'
  },
  {
    id: 'portal',
    label: 'Customer Approval Link',
    icon: Smartphone,
    badge: 'Instant SMS / Web Sign-off',
    image: '/images/mobile-app.jpg',
    description: 'Customers review estimates and digitally sign in seconds from their smartphone.'
  }
];

export default function Hero() {
  const [activePreview, setActivePreview] = useState('dispatch');
  const currentPreview = PREVIEWS.find(p => p.id === activePreview) || PREVIEWS[0];

  return (
    <section className={styles.hero}>
      {/* Ambient Radial Mesh Lighting */}
      <div className={styles.ambientGlowPrimary} />
      <div className={styles.ambientGlowSecondary} />
      <div className="grid-bg" />

      <div className={`container ${styles.content}`}>
        {/* 1. Animated Announcement Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.announcementWrapper}
        >
          <Link href="/bay" className={styles.announcementPill}>
            <span className={styles.announcementTag}>
              <Sparkles size={13} /> NEXT-GEN AGY 2.0
            </span>
            <span className={styles.announcementText}>
              Live Customer Approval Links & Bay Tablets Are Live
            </span>
            <ArrowRight size={14} className={styles.announcementArrow} />
          </Link>
        </motion.div>

        {/* 2. Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className={styles.title}>
            Your Shop Runs on Numbers.<br />
            Make Sure They're <span className={styles.gradientText}>Right.</span>
          </h1>
        </motion.div>

        {/* 3. Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.subtitle}
        >
          The heavy-duty shop management software that connects the front desk, 
          technician bay tablets, and customer phone approvals — protecting your gross profit before it slips away.
        </motion.p>

        {/* 4. High-Converting CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className={styles.ctas}
        >
          <Link href="/signup" className={`btn btn-primary btn-lg ${styles.primaryCta}`}>
            Start 14-Day Free Trial
            <ArrowRight size={18} />
          </Link>
          <Link href="/bay" className={`btn btn-outline btn-lg ${styles.secondaryCta}`}>
            <PlayCircle size={18} />
            Explore Live Bay Demo
          </Link>
        </motion.div>

        {/* 5. Trust Badges below CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className={styles.trustBadges}
        >
          <span><Check size={14} className={styles.trustCheck} /> No Credit Card Required</span>
          <span className={styles.dotDivider}>•</span>
          <span><Check size={14} className={styles.trustCheck} /> Live in 10 Minutes</span>
          <span className={styles.dotDivider}>•</span>
          <span><Check size={14} className={styles.trustCheck} /> 1-Click QuickBooks Sync</span>
        </motion.div>

        {/* 6. Social Proof Stat Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className={styles.stats}
        >
          <div className={styles.statPill}>
            <Users size={15} className={styles.statIcon} />
            <span><strong>250+</strong> Heavy-Duty Shops</span>
          </div>
          <div className={styles.statPill}>
            <ShieldCheck size={15} className={styles.statIcon} />
            <span><strong>98.4%</strong> Retention Rate</span>
          </div>
          <div className={styles.statPill}>
            <Star size={15} className={styles.statIcon} />
            <span><strong>4.9★</strong> Verified Rating</span>
          </div>
          <div className={styles.statPill}>
            <TrendingUp size={15} className={styles.statIcon} />
            <span><strong>$4.2M+</strong> Recovered Profit</span>
          </div>
        </motion.div>

        {/* 7. Dual-Preview Visual Showcase with Interactive Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={styles.heroVisualContainer}
        >
          {/* Interactive Mode Selector Tabs */}
          <div className={styles.previewTabs}>
            {PREVIEWS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activePreview === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePreview(tab.id)}
                  className={`${styles.previewTabBtn} ${isActive ? styles.previewTabActive : ''}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeHeroTabIndicator"
                      className={styles.tabGlider}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Visual Display Frame */}
          <div className={styles.heroImageCard}>
            <div className={styles.cardGlowEffect} />
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPreview.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className={styles.imageWrapper}
              >
                <Image
                  src={currentPreview.image}
                  alt={currentPreview.label}
                  width={1120}
                  height={640}
                  priority
                  className={styles.heroMainImg}
                />
              </motion.div>
            </AnimatePresence>

            {/* Floating Live Status Badge 1: Top Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className={`${styles.floatingBadge} ${styles.badgeTopLeft}`}
            >
              <div className={styles.pulseDot} />
              <div>
                <span className={styles.badgeLabel}>Live Bay Activity</span>
                <strong className={styles.badgeValue}>Bay 2: Kenworth T680 · 2.5 hrs clocked</strong>
              </div>
            </motion.div>

            {/* Floating Live Status Badge 2: Top Right */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 1.05 }}
              className={`${styles.floatingBadge} ${styles.badgeTopRight}`}
            >
              <div className={styles.badgeCheckIcon}>
                <CheckCircle2 size={16} color="#10B981" />
              </div>
              <div>
                <span className={styles.badgeLabel}>Instant Customer Approval</span>
                <strong className={styles.badgeValue}>WO-8833 Signed by Midwest Logistics ($1,450 CAD)</strong>
              </div>
            </motion.div>

            {/* Floating Live Status Badge 3: Bottom Left */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2 }}
              className={`${styles.floatingBadge} ${styles.badgeBottomLeft}`}
            >
              <div className={styles.badgeMarginIcon}>
                <TrendingUp size={16} color="#2563FF" />
              </div>
              <div>
                <span className={styles.badgeLabel}>Profit Margin Shield</span>
                <strong className={styles.badgeValue}>68.4% Gross Margin Locked on Drive Axle</strong>
              </div>
            </motion.div>
          </div>

          <div className={styles.imageFade} />
        </motion.div>
      </div>
    </section>
  );
}
