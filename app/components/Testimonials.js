'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star } from 'lucide-react';
import styles from './Testimonials.module.css';

const row1Testimonials = [
  {
    quote: "The profit tracking alone paid for itself in the first month. I can see margins on every job before it closes.",
    name: "Mike Torres",
    role: "Owner · Torres Heavy Truck Repair"
  },
  {
    quote: "Our technicians actually log their time now. Two taps on the phone and they're clocked into the job.",
    name: "Sarah Bennett",
    role: "Bay Manager · Class 8 diesel shop"
  },
  {
    quote: "Estimates go out in minutes and customers approve right from their phone. We stopped chasing signatures.",
    name: "David Chen",
    role: "Service Writer · Pacific Fleet Services"
  },
  {
    quote: "Parts costs finally tie back to the repair order. No more guessing markup at invoice time.",
    name: "Linda Graves",
    role: "Parts Manager · Heartland Truck & Trailer"
  },
  {
    quote: "We used to lose an hour a day on paperwork. Now everything flows from estimate to invoice automatically.",
    name: "Carlos Rivera",
    role: "Shop Foreman · 15 years on the floor"
  }
];

const row2Testimonials = [
  {
    quote: "The dashboard shows me exactly which jobs are stuck and why. No more walking the bay to find out.",
    name: "Angela Park",
    role: "Operations Lead · multi-bay HD shop"
  },
  {
    quote: "QuickBooks sync actually works. Friday invoicing went from half a day to twenty minutes.",
    name: "Robert Walsh",
    role: "Bookkeeper · diesel & fleet repair"
  },
  {
    quote: "Fleet customers get clean updates without us doing extra work. It makes us look more professional.",
    name: "James Okafor",
    role: "Fleet Account Manager"
  },
  {
    quote: "Night shift handoffs are seamless. Every tech sees the same job status when they walk in.",
    name: "Patricia Nguyen",
    role: "Night Shift Lead"
  },
  {
    quote: "First shop software that doesn't feel like it was built by someone who never touched a wrench.",
    name: "Tom Bradley",
    role: "Owner · Bradley Diesel Service"
  }
];

const TestimonialCard = ({ quote, name, role }) => (
  <div className={styles.card}>
    <div className={styles.stars}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={styles.starIcon} />
      ))}
    </div>
    <p className={styles.quote}>"{quote}"</p>
    <div className={styles.authorInfo}>
      <span className={styles.authorName}>{name}</span>
      <span className={styles.authorRole}>{role}</span>
    </div>
  </div>
);

export default function Testimonials() {
  const headerRef = useRef(null);
  const isInView = useInView(headerRef, { once: true, margin: "-100px" });

  const renderRow = (testimonials, reverse = false) => {
    // Duplicate array for infinite seamless scroll
    const items = [...testimonials, ...testimonials];
    
    return (
      <div className={styles.marqueeRow}>
        <div className={reverse ? styles.marqueeContentReverse : styles.marqueeContent}>
          {items.map((item, index) => (
            <TestimonialCard key={index} {...item} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="testimonials" className={styles.testimonialsSection}>
      <div className="container">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={styles.header}
        >
          <span className={styles.label}>FROM THE SHOP FLOOR</span>
          <h2 className={styles.title}>Real shops. Real results.</h2>
          <p className={styles.subtitle}>
            Heavy-duty and fleet repair shops use Fleet Finance Flow to run cleaner workflows and protect their margins.
          </p>
        </motion.div>
      </div>

      <div className={styles.marqueeContainer}>
        <div className={styles.gradientLeft} />
        <div className={styles.gradientRight} />
        
        {renderRow(row1Testimonials, false)}
        {renderRow(row2Testimonials, true)}
      </div>
    </section>
  );
}
