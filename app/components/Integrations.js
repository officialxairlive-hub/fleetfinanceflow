'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Integrations.module.css';
import { Link, CreditCard, Smartphone, Sparkles } from 'lucide-react';

const integrations = [
  { name: 'QuickBooks Sync', icon: Link },
  { name: 'Stripe Payments', icon: CreditCard },
  { name: 'iOS & Android', icon: Smartphone },
  { name: 'AI-Powered Estimates', icon: Sparkles },
];

export default function Integrations() {
  return (
    <section className={styles.section}>
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          {integrations.map((item, index) => (
            <motion.div 
              key={item.name}
              className={styles.pill}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <item.icon size={20} className={styles.icon} />
              <span className={styles.name}>{item.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
