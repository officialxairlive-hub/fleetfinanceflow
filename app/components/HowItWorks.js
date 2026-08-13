'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { Settings, Monitor, TrendingUp, CheckCircle, Clock, ArrowRight, Shield } from 'lucide-react';
import styles from './HowItWorks.module.css';

const steps = [
  {
    stepNumber: '01',
    stepTag: 'STEP 01 · ONBOARDING',
    title: 'Set Up Your Shop',
    badge: 'Live in < 1 Hour',
    description: 'Add your team, define your bays, set labor rates, and import customer & fleet data with zero downtime.',
    bulletPoints: [
      'Import fleet accounts, VINs & PM schedules',
      'Configure custom labor rates & parts markup',
      'Onboard technicians in under 5 minutes'
    ],
    image: '/images/office-setup.jpg',
    icon: Settings
  },
  {
    stepNumber: '02',
    stepTag: 'STEP 02 · DAILY WORKFLOW',
    title: 'Run Jobs From One Screen',
    badge: 'Zero Whiteboards',
    description: 'Create repair orders, assign techs, track labor time, manage parts, send estimates, and collect payments.',
    bulletPoints: [
      'Live job board searchable by customer or VIN',
      'Two-tap mobile time tracking in the bay',
      'Instant digital customer estimate approvals'
    ],
    image: '/images/dashboard-light.jpg',
    icon: Monitor
  },
  {
    stepNumber: '03',
    stepTag: 'STEP 03 · PROFIT INTEL',
    title: 'See Your Real Profit',
    badge: 'Real-Time Margins',
    description: 'Labor costs, parts margins, tech productivity, and job-level profit — know what you actually keep before closing out.',
    bulletPoints: [
      'Job-level gross profit margin tracking',
      'Automatic 2-way sync with QuickBooks',
      'Instant technician efficiency reports'
    ],
    image: '/images/bay-tablet.jpg',
    icon: TrendingUp
  }
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px 0px' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <section id="how-it-works" className={`section ${styles.howItWorksSection}`} ref={ref}>
      <div className="container">
        <div className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-label">SIMPLE THREE-STEP WORKFLOW</div>
            <h2 className="section-title">Up and running in three steps.</h2>
            <p className="section-subtitle">
              No complicated setup. No month-long onboarding. Start managing jobs and protecting profit in minutes.
            </p>
          </motion.div>
        </div>

        {/* 3 Step Cards Grid */}
        <motion.div 
          className={styles.stepsGrid}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={index} className={styles.stepCard} variants={cardVariants}>
                {/* Step Top Bar */}
                <div className={styles.cardHeader}>
                  <div className={styles.numberBadge}>{step.stepNumber}</div>
                  <span className={styles.stepTag}>{step.stepTag}</span>
                  <span className={styles.badgePill}>{step.badge}</span>
                </div>

                {/* Step Image */}
                <div className={styles.imageContainer}>
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={400}
                    height={240}
                    className={styles.cardImage}
                  />
                  <div className={styles.iconOverlay}>
                    <Icon size={20} className={styles.overlayIcon} />
                  </div>
                </div>

                {/* Step Content */}
                <div className={styles.cardBody}>
                  <h3 className={styles.title}>{step.title}</h3>
                  <p className={styles.description}>{step.description}</p>

                  <ul className={styles.bulletList}>
                    {step.bulletPoints.map((point, pIdx) => (
                      <li key={pIdx} className={styles.bulletItem}>
                        <CheckCircle size={16} className={styles.checkIcon} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className={styles.bottomCallout}
        >
          <Shield size={20} className={styles.shieldIcon} />
          <span>Need help importing your current data? Our dedicated onboarding team handles complete shop setup for free.</span>
        </motion.div>
      </div>
    </section>
  );
}
