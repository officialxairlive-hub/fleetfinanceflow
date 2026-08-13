'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { 
  Wrench, LayoutDashboard, Clock, Package, Camera,
  DollarSign, FileText, Receipt, CreditCard, Link as LinkIcon,
  Truck, ClipboardList, MessageSquare, History, MapPin,
  BarChart3, TrendingUp, Sparkles, AlertTriangle, Monitor
} from 'lucide-react';
import styles from './Features.module.css';

const categories = [
  {
    title: 'Run Every Job',
    icon: Wrench,
    features: [
      {
        title: 'Workflow Management',
        icon: LayoutDashboard,
        description: 'Organize repair orders by status, priority, tech, and due date.',
      },
      {
        title: 'Time Tracking',
        icon: Clock,
        description: 'Track technician hours per job to keep labor costs accurate.',
      },
      {
        title: 'Parts Tracking',
        icon: Package,
        description: 'Monitor parts costs, markup, suppliers, and per-job usage.',
      },
      {
        title: 'Photo Documentation',
        icon: Camera,
        description: 'Attach inspection shots and proof of work to every order.',
      },
    ]
  },
  {
    title: 'Get Paid Faster',
    icon: DollarSign,
    features: [
      {
        title: 'Estimates',
        icon: FileText,
        description: 'Create professional estimates with labor, parts, notes, and digital approvals.',
      },
      {
        title: 'Invoicing',
        icon: Receipt,
        description: 'Convert completed jobs into clear invoices without duplicate entry.',
      },
      {
        title: 'Payments',
        icon: CreditCard,
        description: 'Accept online and in-person card payments with payment links.',
      },
      {
        title: 'QuickBooks Sync',
        icon: LinkIcon,
        description: 'Sync invoices, customers, and payments to reduce manual work.',
      },
    ]
  },
  {
    title: 'Fleet & Customers',
    icon: Truck,
    features: [
      {
        title: 'Fleet Management',
        icon: ClipboardList,
        description: 'Manage units, VINs, PM schedules, DOT inspections, and history.',
      },
      {
        title: 'Customer Messaging',
        icon: MessageSquare,
        description: 'Send updates, approvals, and repair info through simple workflows.',
      },
      {
        title: 'Service History',
        icon: History,
        description: 'Complete repair records tied to every unit and customer.',
      },
      {
        title: 'Multi-Location',
        icon: MapPin,
        description: 'Support for shops running multiple bays or locations.',
      },
    ]
  },
  {
    title: 'Shop Intelligence',
    icon: BarChart3,
    features: [
      {
        title: 'Reports',
        icon: TrendingUp,
        description: 'Revenue, profit, labor efficiency, AR, and tech productivity.',
      },
      {
        title: 'AI Assistant',
        icon: Sparkles,
        description: 'Draft estimates, summarize notes, and speed up admin tasks.',
      },
      {
        title: 'Profit Alerts',
        icon: AlertTriangle,
        description: 'Get notified when a job\'s margin drops below threshold.',
      },
      {
        title: 'Dashboard',
        icon: Monitor,
        description: 'Live overview of every active job, tech, and bottleneck.',
      },
    ]
  }
];

export default function Features() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px 0px' });

  return (
    <section id="features" className={styles.featuresSection}>
      <div className={styles.container} ref={containerRef}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.label}>EVERYTHING IN ONE PLACE</span>
          <h2 className={styles.title}>Everything your shop needs. One platform.</h2>
          <p className={styles.subtitle}>Four areas. One system. No jumping between tools.</p>
        </motion.div>

        <motion.div 
          className={styles.imageContainer}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Image
            src="/images/office-setup.jpg"
            alt="Office Setup"
            width={1200}
            height={600}
            className={styles.featureImage}
          />
        </motion.div>

        <div className={styles.grid}>
          {categories.map((category, index) => {
            const CategoryIcon = category.icon;
            return (
              <motion.div 
                key={index} 
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.15 * index }}
              >
                <div className={styles.cardHeader}>
                  <CategoryIcon className={styles.cardIcon} size={32} strokeWidth={1.5} />
                  <h3 className={styles.cardTitle}>{category.title}</h3>
                </div>
                
                <div className={styles.subFeatures}>
                  {category.features.map((feature, fIndex) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={fIndex} className={styles.subFeature}>
                        <FeatureIcon className={styles.subFeatureIcon} size={18} strokeWidth={2} />
                        <div className={styles.subFeatureContent}>
                          <h4 className={styles.subFeatureTitle}>{feature.title}</h4>
                          <p className={styles.subFeatureDesc}>{feature.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
