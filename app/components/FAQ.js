// FAQ.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';

const faqs = [
  {
    q: 'What is Fleet Finance Flow?',
    a: 'Fleet Finance Flow is heavy-duty shop management software that helps repair shops manage jobs, technicians, time tracking, estimates, invoices, payments, parts, fleet customers, and reporting — all in one platform.'
  },
  {
    q: 'Who is Fleet Finance Flow built for?',
    a: 'Heavy-duty truck, trailer, diesel, and fleet repair shops. Whether you run a single bay or a multi-location operation, Fleet Finance Flow scales with your business.'
  },
  {
    q: 'How is Fleet Finance Flow different from other shop software?',
    a: 'Most shop software focuses on invoicing. Fleet Finance Flow is built around profit visibility — tracking labor, parts, and margins at the job level so you know what you actually keep.'
  },
  {
    q: 'Can technicians use it from their phones?',
    a: 'Yes. Technicians can clock in, switch jobs, add notes, and upload photos from any phone, tablet, or desktop. No app download required for basic features.'
  },
  {
    q: 'Does it support estimates and invoices?',
    a: 'Absolutely. Create professional estimates, send digital approvals, and convert approved work into invoices — with online payment links and in-person card support.'
  },
  {
    q: 'Does it connect with QuickBooks?',
    a: 'Yes. Fleet Finance Flow syncs invoices, customers, payments, and key accounting data with QuickBooks to eliminate double entry.'
  },
  {
    q: 'Can I see profit per job?',
    a: 'Yes. You can see labor cost, billed labor, parts margins, discounts, and overall profitability on every repair order — while the job is still open.'
  },
  {
    q: 'Is Fleet Finance Flow cloud-based?',
    a: 'Yes. It runs in the browser and on mobile. Your data is accessible from anywhere — the shop floor, the office, or the road.'
  },
  {
    q: 'How long does it take to get started?',
    a: 'Most shops are up and running in under an hour. We help with setup, data import, and team onboarding at no extra cost.'
  },
  {
    q: 'Are there long-term contracts or per-user fees?',
    a: 'No long-term contracts. No per-user fees. Straightforward pricing that grows with your shop.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section">
      <div className="container">
        <div className="section-header">
          <span className="section-label">FAQ</span>
          <h2 className="section-title">Frequently asked questions</h2>
          <p className="section-subtitle">Everything shops want to know before getting started.</p>
        </div>

        <div className={styles.accordion}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <div 
                key={index} 
                className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
              >
                <button 
                  className={styles.questionBtn} 
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.question}>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} className={styles.icon} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={styles.answerContainer}
                    >
                      <div className={styles.answer}>
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
