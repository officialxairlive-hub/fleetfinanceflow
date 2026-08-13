'use client';

import Link from 'next/link';
import Logo from './Logo';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.container}`}>
        <div className={styles.topSection}>
          <div className={styles.brandColumn}>
            <Logo showText={true} size="small" />
            <p className={styles.tagline}>Built for shops that run on grit.</p>
            <div className={styles.socialRow}>
              <Link href="#" className={styles.socialLink}>Twitter</Link>
              <Link href="#" className={styles.socialLink}>LinkedIn</Link>
              <Link href="#" className={styles.socialLink}>YouTube</Link>
            </div>
          </div>

          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>Product</h3>
            <ul className={styles.linkList}>
              <li><Link href="#" className={styles.link}>Features</Link></li>
              <li><Link href="#" className={styles.link}>How It Works</Link></li>
              <li><Link href="#" className={styles.link}>Pricing</Link></li>
              <li><Link href="#" className={styles.link}>Integrations</Link></li>
              <li><Link href="#" className={styles.link}>Mobile App</Link></li>
            </ul>
          </div>

          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>Company</h3>
            <ul className={styles.linkList}>
              <li><Link href="#" className={styles.link}>About</Link></li>
              <li><Link href="#" className={styles.link}>Blog</Link></li>
              <li><Link href="#" className={styles.link}>Careers</Link></li>
              <li><Link href="#" className={styles.link}>Contact</Link></li>
              <li><Link href="#" className={styles.link}>Partners</Link></li>
            </ul>
          </div>

          <div className={styles.linksColumn}>
            <h3 className={styles.columnTitle}>Legal</h3>
            <ul className={styles.linkList}>
              <li><Link href="#" className={styles.link}>Privacy Policy</Link></li>
              <li><Link href="#" className={styles.link}>Terms of Service</Link></li>
              <li><Link href="#" className={styles.link}>Cookie Policy</Link></li>
              <li><Link href="#" className={styles.link}>Security</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>© 2025 Fleet Finance Flow. All rights reserved.</p>
          <p className={styles.credit}>Made for the shop floor.</p>
        </div>
      </div>
    </footer>
  );
}
