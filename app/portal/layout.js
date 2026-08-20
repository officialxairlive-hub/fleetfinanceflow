'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, LogOut, Bell, Menu } from 'lucide-react';
import styles from './portal.module.css';

export default function PortalLayout({ children }) {
  const pathname = usePathname();
  
  // In demo, hardcoded to CUST-001 (Interstate Haulers LLC)
  const customerName = "Interstate Haulers LLC";
  
  return (
    <div className={styles.portalShell}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brand}>
            <Calculator size={24} color="var(--color-primary)" />
            Fleet Finance <span>Flow</span>
          </div>
          
          <nav className={styles.nav}>
            <Link 
              href="/portal" 
              className={`${styles.navLink} ${pathname === '/portal' ? styles.navLinkActive : ''}`}
            >
              Overview
            </Link>
            <Link 
              href="/portal?tab=jobs" 
              className={`${styles.navLink} ${pathname.includes('jobs') ? styles.navLinkActive : ''}`}
            >
              Repair Orders
            </Link>
            <Link 
              href="/portal?tab=invoices" 
              className={`${styles.navLink} ${pathname.includes('invoices') ? styles.navLinkActive : ''}`}
            >
              Invoices
            </Link>
            <Link 
              href="/portal?tab=fleet" 
              className={`${styles.navLink} ${pathname.includes('fleet') ? styles.navLinkActive : ''}`}
            >
              My Fleet
            </Link>
          </nav>
        </div>
        
        <div className={styles.headerRight}>
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <Bell size={20} />
          </button>
          
          <div className={styles.userMenu}>
            <div className={styles.avatar}>IH</div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{customerName}</span>
          </div>
          
          <Link href="/login" style={{ color: 'var(--color-text-secondary)', marginLeft: '8px' }} title="Logout">
            <LogOut size={20} />
          </Link>
        </div>
      </header>
      
      {children}
    </div>
  );
}
