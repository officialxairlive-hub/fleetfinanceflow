'use client';

import React, { useState } from 'react';
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
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Package, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  Building2,
  Wrench,
  Truck
} from 'lucide-react';

const POV_FRAMES = [
  {
    id: 'owner',
    role: 'Shop Owner / Manager',
    location: 'Front Office Desk',
    device: 'Desktop / Laptop',
    icon: Building2,
    deviceIcon: Laptop,
    badgeColor: '#2563FF',
    image: '/images/office-setup.jpg',
    screenTitle: 'Owner Command Center',
    screenSubtitle: 'Live Dispatch & Margin Shield',
    actionText: 'Tracks real-time bay productivity, unbilled tech hours, and job profitability before invoices close.',
    liveItems: [
      { label: 'Active Work Orders', value: '8 Bays Running', color: '#2563FF' },
      { label: 'Live Gross Margin', value: '68.4% Protected', color: '#10B981' },
      { label: 'QuickBooks Sync', value: '2-Way Live Sync', color: '#6366F1' }
    ],
    highlightTag: 'Office Dispatch'
  },
  {
    id: 'mechanic',
    role: 'Lead Technician',
    location: 'Garage Bay 2 Floor',
    device: 'Bay iPad / Tablet',
    icon: Wrench,
    deviceIcon: Tablet,
    badgeColor: '#F59E0B',
    image: '/images/bay-tablet.jpg',
    screenTitle: 'Bay Mechanic Tablet',
    screenSubtitle: '2-Tap Time & Parts Logging',
    actionText: 'Clocks directly into repair orders, requests parts from inventory, and documents inspection photos right at the truck.',
    liveItems: [
      { label: 'Current Vehicle', value: 'Kenworth T680', color: '#F59E0B' },
      { label: 'Floor Time Logged', value: '2.5 hrs clocked', color: '#10B981' },
      { label: 'Parts Request', value: '+ Bendix Brake Shoes', color: '#2563FF' }
    ],
    highlightTag: 'Shop Floor Tablet'
  },
  {
    id: 'customer',
    role: 'Fleet Customer',
    location: 'Transport Co. Office',
    device: 'Customer Smartphone',
    icon: Truck,
    deviceIcon: Smartphone,
    badgeColor: '#10B981',
    image: '/images/mobile-app.jpg',
    screenTitle: 'Customer Live Link',
    screenSubtitle: 'Instant 1-Click Approval',
    actionText: 'Reviews transparent estimate line items, labor hours, and approves with a digital signature in seconds from any phone.',
    liveItems: [
      { label: 'Estimate WO-8833', value: '$1,450.00 CAD', color: '#10B981' },
      { label: 'Approval Status', value: 'Digitally Signed ✓', color: '#10B981' },
      { label: 'Response Time', value: 'Under 3 minutes', color: '#2563FF' }
    ],
    highlightTag: 'Instant Customer SMS'
  }
];

export default function Hero() {
  const [activeFrame, setActiveFrame] = useState(null);

  return (
    <section className={styles.heroSection}>
      {/* Background Ambient Glow */}
      <div className={styles.ambientGlow} />

      <div className={`container ${styles.container}`}>
        
        {/* 1. Top Announcement Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={styles.announcementWrapper}
        >
          <span className={styles.announcementPill}>
            <span className={styles.pillPulse} />
            <Sparkles size={13} className={styles.pillSparkle} />
            THE 3-WAY CONNECTED REPAIR ECOSYSTEM
          </span>
        </motion.div>

        {/* 2. Main High-Converting Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.mainTitle}
        >
          One Platform. Three Connected Perspectives.
        </motion.h1>

        {/* 3. Subtitle explaining the 3 POVs */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.mainSubtitle}
        >
          <strong>The Shop Owner</strong> watching real profit on their laptop, 
          <strong> The Mechanic</strong> logging time & parts on their bay tablet, and 
          <strong> The Fleet Customer</strong> approving estimates in seconds from their phone.
        </motion.p>

        {/* 4. Action Buttons */}
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

        {/* 5. Trust Badges Strip */}
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

        {/* 6. Live Synchronized Data Flow Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className={styles.dataFlowBanner}
        >
          <div className={styles.dataFlowStep}>
            <span className={styles.flowIconWrap}><Laptop size={14} /></span>
            <span>1. Owner Dispatches Job</span>
          </div>
          <span className={styles.flowArrow}>➔</span>
          <div className={styles.dataFlowStep}>
            <span className={styles.flowIconWrap}><Tablet size={14} /></span>
            <span>2. Tech Clocks & Requests Parts</span>
          </div>
          <span className={styles.flowArrow}>➔</span>
          <div className={styles.dataFlowStep}>
            <span className={styles.flowIconWrap}><Smartphone size={14} /></span>
            <span>3. Customer Approves on Phone</span>
          </div>
        </motion.div>

        {/* 7. The 3-POV Connected Triptych Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className={styles.triptychGrid}
        >
          {POV_FRAMES.map((pov, idx) => {
            const RoleIcon = pov.icon;
            const DeviceIcon = pov.deviceIcon;
            const isHovered = activeFrame === pov.id;

            return (
              <div 
                key={pov.id}
                className={`${styles.povCard} ${isHovered ? styles.povCardHovered : ''}`}
                onMouseEnter={() => setActiveFrame(pov.id)}
                onMouseLeave={() => setActiveFrame(null)}
              >
                {/* Header Strip with Role and Device */}
                <div className={styles.cardHeader}>
                  <div className={styles.roleTagGroup}>
                    <div className={styles.roleIconCircle} style={{ background: `${pov.badgeColor}15`, color: pov.badgeColor }}>
                      <RoleIcon size={16} />
                    </div>
                    <div>
                      <h3 className={styles.roleTitle}>{pov.role}</h3>
                      <span className={styles.locationText}>{pov.location}</span>
                    </div>
                  </div>
                  <div className={styles.deviceBadge}>
                    <DeviceIcon size={13} />
                    <span>{pov.device}</span>
                  </div>
                </div>

                {/* Perspective Image Window */}
                <div className={styles.imageWindow}>
                  <Image 
                    src={pov.image}
                    alt={`${pov.role} perspective`}
                    width={480}
                    height={300}
                    priority
                    className={styles.windowImage}
                  />
                  <div className={styles.imageOverlayGradient} />
                  
                  {/* Floating Live Screen Badge */}
                  <div className={styles.floatingScreenBadge}>
                    <span className={styles.screenTagText}>{pov.highlightTag}</span>
                    <strong className={styles.screenMainTitle}>{pov.screenTitle}</strong>
                  </div>
                </div>

                {/* Real-Time Live Activity Feed inside this POV */}
                <div className={styles.liveActivityFeed}>
                  <div className={styles.feedHeader}>
                    <span className={styles.feedPulse} style={{ background: pov.badgeColor }} />
                    <span className={styles.feedLabel}>LIVE TELEMETRY FEED</span>
                  </div>
                  
                  <div className={styles.liveItemsList}>
                    {pov.liveItems.map((item, i) => (
                      <div key={i} className={styles.liveItemRow}>
                        <span className={styles.itemLabel}>{item.label}</span>
                        <span className={styles.itemValue} style={{ color: item.color }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanatory Action Caption */}
                <div className={styles.captionArea}>
                  <p className={styles.captionText}>{pov.actionText}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* 8. Bottom Shop Intelligence Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className={styles.kpiRibbon}
        >
          <div className={styles.kpiCard}>
            <div className={styles.kpiNumber}>250+</div>
            <div className={styles.kpiLabel}>Active Heavy-Duty Shops</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiNumber}>98.4%</div>
            <div className={styles.kpiLabel}>Customer Retention Rate</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiNumber}>3.2 min</div>
            <div className={styles.kpiLabel}>Avg. Customer Approval Turnaround</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiNumber}>$4.2M+</div>
            <div className={styles.kpiLabel}>Recovered Unbilled Labor</div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
