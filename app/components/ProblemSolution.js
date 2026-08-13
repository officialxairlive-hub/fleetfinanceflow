'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import styles from './ProblemSolution.module.css';

const checklist = [
  'Which technicians are clocked in right now',
  'Which jobs are actively being worked',
  'Which repairs are waiting on parts or approval',
  'How much labor has been billed vs spent',
  'Whether a repair order is still profitable',
  'What is ready to be invoiced',
  'Where the shop is slowing down',
  'Real numbers, not end-of-month surprises',
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const imageVariants = {
  float: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export default function ProblemSolution() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section className={`section ${styles.problemSolution}`} ref={sectionRef}>
      <div className="container">
        <div className="section-header">
          <span className="section-label">THE VISIBILITY GAP</span>
          <h2 className="section-title">
            Most shops know what they invoiced.<br />
            Few know what they actually kept.
          </h2>
          <p className="section-subtitle">
            Fleet Finance Flow gives owners and managers live visibility into every corner of the operation.
          </p>
        </div>

        <div className={styles.content}>
          <motion.div
            className={styles.checklist}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            {checklist.map((item, index) => (
              <motion.div key={index} className={styles.checklistItem} variants={itemVariants}>
                <div className={styles.checkIconWrapper}>
                  <Check className={styles.checkIcon} size={16} />
                </div>
                <span className={styles.checklistText}>{item}</span>
              </motion.div>
            ))}
          </motion.div>

          <div className={styles.imageColumn}>
            <motion.div
              className={styles.imageWrapper}
              variants={imageVariants}
              animate="float"
            >
              <Image
                src="/images/bay-tablet.jpg"
                alt="Live visibility from the shop floor."
                width={720}
                height={480}
                className={styles.dashboardImage}
                priority={false}
              />
              <p className={styles.imageCaption}>Live visibility from the shop floor.</p>
            </motion.div>
          </div>
        </div>

        <div className={styles.closingLineWrapper}>
          <p className={styles.closingLine}>
            Stop guessing. Start running your shop from real numbers.
          </p>
        </div>
      </div>
    </section>
  );
}
