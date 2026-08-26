'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import styles from './Navbar.module.css';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : styles.atTop}`}>
        <div className={styles.container}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Logo size="default" showText={true} />
          </Link>

          {/* Center nav links */}
          <div className={styles.navLinks}>
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className={styles.desktopActions}>
            <Link href="/login" className={styles.signInLink}>
              Sign In
            </Link>
            <Link href="/signup" className={styles.signUpBtn}>
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Slide Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.mobileBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              className={styles.mobileMenu}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
            >
              <div className={styles.mobileMenuHeader}>
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <Logo size="small" showText={true} />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={styles.mobileCloseBtn}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.mobileLinks}>
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={styles.mobileLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className={styles.mobileActions}>
                <Link
                  href="/login"
                  className={styles.mobileSignIn}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className={styles.mobileSignUp}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
