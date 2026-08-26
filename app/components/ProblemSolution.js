'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Clock, Smartphone, PackageCheck, Receipt, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './ProblemSolution.module.css';

const profitLeaks = [
  {
    icon: Clock,
    problemSlang: 'Techs work 8 hours on the bay floor, but only 5 get billed on the work order.',
    plainTruth: 'Technicians forget manual paperwork or guess flagged hours after the repair is already done.',
    solutionReal: '2-tap iPad clock-in right at the truck bumper. Every logged minute binds to the open repair order live.',
    metricBadge: '96.2% Billed Labor Recovery'
  },
  {
    icon: Smartphone,
    problemSlang: 'Truck sits burning bay space for 4 hours waiting on a customer phone call approval.',
    plainTruth: 'Service writers play endless phone tag with fleet dispatchers while repairs stall out.',
    solutionReal: 'Automated 1-click SMS approval link. Customer reviews photos & transparent itemized lines on their phone and signs in 2 minutes.',
    metricBadge: 'Under 3 Min Sign-Off'
  },
  {
    icon: PackageCheck,
    problemSlang: 'Parts bought with 25% markup get accidentally invoiced at cost or cores get lost.',
    plainTruth: 'Parts pricing errors and unreturned cores drain thousands of dollars from gross margin every single month.',
    solutionReal: 'Automated tier markup matrix and core tracking. Parts added by tech or parts manager are margin-locked before closing.',
    metricBadge: '+24.5% Margin Shielded'
  },
  {
    icon: Receipt,
    problemSlang: 'Friday invoicing backlog and tedious manual re-entry into QuickBooks.',
    plainTruth: 'Double-entry bookkeeping causes billing delays, late payments, and payroll calculation headaches.',
    solutionReal: '1-click convert approved repair order to final invoice. Instant two-way sync with QuickBooks Desktop & Online.',
    metricBadge: 'Zero Double Entry'
  }
];

export default function ProblemSolution() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-60px' });

  return (
    <section className={`section ${styles.problemSolution}`} ref={sectionRef} id="how-it-works">
      <div className="container">
        
        <div className="section-header">
          <span className="section-label">THE FOUR MAJOR SHOP PROFIT LEAKS</span>
          <h2 className="section-title">
            Where Heavy-Duty Repair Shops Bleed Money — And How We Plug The Leak.
          </h2>
          <p className="section-subtitle">
            Most shops know what they invoiced at the end of the month. Few know what they actually kept. Here is how Fleet Finance Flow protects your hard-earned margin at every step of the job.
          </p>
        </div>

        <div className={styles.grid}>
          {profitLeaks.map((leak, idx) => {
            const Icon = leak.icon;
            return (
              <motion.div 
                key={idx}
                className={styles.leakCard}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.iconCircle}>
                    <Icon size={18} />
                  </div>
                  <span className={styles.metricBadge}>{leak.metricBadge}</span>
                </div>

                <div className={styles.problemBox}>
                  <span className={styles.boxTagRed}>THE LEAK (SHOP REALITY)</span>
                  <h3 className={styles.problemTitle}>"{leak.problemSlang}"</h3>
                  <p className={styles.plainExplanation}>{leak.plainTruth}</p>
                </div>

                <div className={styles.solutionBox}>
                  <span className={styles.boxTagGreen}>THE FLEET FLOW FIX</span>
                  <p className={styles.solutionText}>{leak.solutionReal}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Visual Callout Bar */}
        <motion.div 
          className={styles.bottomTakeaway}
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <div className={styles.takeawayLeft}>
            <CheckCircle2 size={24} className={styles.takeawayIcon} />
            <div>
              <h4 className={styles.takeawayTitle}>Stop guessing your shop's profitability at month-end.</h4>
              <p className={styles.takeawaySub}>See exact labor costs, parts margins, and technician efficiency while the truck is still on the lift.</p>
            </div>
          </div>
          <a href="/signup" className="btn btn-primary">
            Test Your Shop With A Free Trial
            <ArrowRight size={14} />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
