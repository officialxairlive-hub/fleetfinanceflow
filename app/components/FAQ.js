// FAQ.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';

const faqs = [
  {
    q: 'How long does it take to get our shop up and running?',
    a: 'Most shops are live within 1 to 2 hours. Our team provides free 1-on-1 white-glove onboarding to import your existing fleet units, VINs, parts inventory, and customer accounts.'
  },
  {
    q: 'Does Fleet Finance Flow sync with QuickBooks?',
    a: 'Yes. We provide seamless 2-way live sync with QuickBooks Online and Desktop. Invoices, parts expenses, customer accounts, and payments post automatically without double data entry.'
  },
  {
    q: 'Can technicians easily use it from tablets or phones in the bay?',
    a: 'Yes. The bay technician view was built specifically for mechanics wearing gloves. Two taps to clock into a work order, request parts, and snap inspection photos from any iPad, Android tablet, or smartphone.'
  },
  {
    q: 'Are there long-term contracts or per-user lock-ins?',
    a: 'No. Straightforward month-to-month pricing with no long-term contracts and no hidden setup fees. You can cancel or change your plan at any time.'
  },
  {
    q: 'Can I track real profit per repair order before closing?',
    a: 'Yes. Fleet Finance Flow calculates exact technician labor costs, billed flat-rate hours, parts markups, and overall gross margin in real time while the truck is still on the shop floor.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section">
      <div className="container">
        <div className="section-header">
          <span className="section-label">COMMON QUESTIONS</span>
          <h2 className="section-title">Everything You Need to Know</h2>
          <p className="section-subtitle">
            Straightforward answers for shop owners and fleet managers.
          </p>
        </div>

        <div className={styles.faqList}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}>
                <button 
                  className={styles.questionButton} 
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.questionText}>{faq.q}</span>
                  <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={styles.iconWrapper}
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={styles.answerWrapper}
                    >
                      <div className={styles.answerText}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
