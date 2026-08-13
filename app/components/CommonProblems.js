// CommonProblems.js
'use client';

import { motion } from 'framer-motion';
import styles from './CommonProblems.module.css';

const problems = [
  {
    problem: 'I can\'t tell which technician is actually profitable.',
    solution: 'Fleet Finance Flow ties every clocked minute to the repair order, so you can compare labor cost, billed hours, and job-level profit per tech.'
  },
  {
    problem: 'We stay busy, but margins keep shrinking.',
    solution: 'See labor, parts, discounts, and margins at the job level — not just the invoice total. Find the leaks before month-end.'
  },
  {
    problem: 'The whiteboard is a mess and nobody trusts it.',
    solution: 'Replace it with a live digital job board showing statuses, assigned techs, parts, customer approvals, and invoice readiness.'
  },
  {
    problem: 'Technicians forget to clock in and out.',
    solution: 'Simple mobile time tracking connected to each job. Two taps to clock in. No forms, no friction.'
  },
  {
    problem: 'Jobs stall waiting on parts and nobody notices.',
    solution: 'Track parts status and costs per job. See delays at a glance so nothing sits in the bay burning daylight.'
  },
  {
    problem: 'Everything depends on one person remembering everything.',
    solution: 'Give the whole team one shared system. Job updates, notes, and status live in the platform — not in someone’s head.'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function CommonProblems() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <span className="section-label">SOUND FAMILIAR?</span>
          <h2 className="section-title">Problems Fleet Finance Flow helps solve.</h2>
        </div>

        <motion.div 
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {problems.map((item, index) => (
            <motion.div key={index} className={styles.card} variants={itemVariants}>
              <h3 className={styles.problem}>{item.problem}</h3>
              <div className={styles.divider}></div>
              <p className={styles.solution}>{item.solution}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
