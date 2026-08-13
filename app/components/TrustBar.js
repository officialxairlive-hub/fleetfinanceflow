'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './TrustBar.module.css';
import { Star } from 'lucide-react';

const reviews = [
  { platform: 'Google', rating: '4.9', count: '1,200+' },
  { platform: 'Capterra', rating: '4.8', count: '850+' },
  { platform: 'G2', rating: '4.7', count: '900+' },
  { platform: 'Trustpilot', rating: '4.9', count: '2,100+' },
];

export default function TrustBar() {
  return (
    <section className={styles.section}>
      <div className={`container ${styles.container}`}>
        <motion.h2 
          className={styles.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          Trusted by heavy-duty shops across the country
        </motion.h2>

        <div className={styles.grid}>
          {reviews.map((review, index) => (
            <motion.div 
              key={review.platform}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className={styles.platformName}>{review.platform}</div>
              <div className={styles.ratingRow}>
                <span className={styles.ratingNumber}>{review.rating}</span>
                <span className={styles.stars}>
                  <Star className={styles.starIcon} fill="currentColor" size={16} />
                  <Star className={styles.starIcon} fill="currentColor" size={16} />
                  <Star className={styles.starIcon} fill="currentColor" size={16} />
                  <Star className={styles.starIcon} fill="currentColor" size={16} />
                  <Star className={styles.starIcon} fill="currentColor" size={16} />
                </span>
              </div>
              <div className={styles.count}>{review.count} reviews</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
