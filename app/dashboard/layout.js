'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '../components/Logo';
import {
  LayoutDashboard,
  Wrench,
  Clock,
  PackageCheck,
  Receipt,
  Truck,
  TrendingUp,
  Plus,
  Search,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import styles from './dashboard.module.css';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Repair Jobs', href: '/dashboard/jobs', icon: Wrench, badge: '12' },
  { label: 'Tech Time Clocks', href: '/dashboard/techs', icon: Clock, badge: '4 Active' },
  { label: 'Parts & Inventory', href: '/dashboard/parts', icon: PackageCheck },
  { label: 'Invoices & Estimates', href: '/dashboard/invoices', icon: Receipt },
  { label: 'Fleet Accounts', href: '/dashboard/fleets', icon: Truck },
  { label: 'Profit Intelligence', href: '/dashboard/profit', icon: TrendingUp },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={styles.dashboardShell}>
      {/* Sidebar Overlay on mobile */}
      {mobileSidebarOpen && (
        <div className={styles.overlay} onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${mobileSidebarOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard">
            <Logo size="small" showText={true} />
          </Link>
          <button className={styles.closeMobileBtn} onClick={() => setMobileSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.shopSelector}>
          <div className={styles.shopIcon}>
            <Truck size={18} />
          </div>
          <div className={styles.shopInfo}>
            <div className={styles.shopName}>Thompson Diesel Repair</div>
            <div className={styles.shopMeta}>Bay 1-8 · Main Location</div>
          </div>
        </div>

        <nav className={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <Icon size={18} className={styles.navIcon} />
                <span>{item.label}</span>
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile at Bottom */}
        <div className={styles.userFooter}>
          <div className={styles.userAvatar}>
            <User size={18} />
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Vince Pallotta</div>
            <div className={styles.userRole}>Shop Owner</div>
          </div>
          <Link href="/login" className={styles.logoutBtn} title="Log Out">
            <LogOut size={16} />
          </Link>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className={styles.mainWrapper}>
        {/* Top Navbar Header */}
        <header className={styles.topHeader}>
          <div className={styles.topHeaderLeft}>
            <button className={styles.menuToggle} onClick={() => setMobileSidebarOpen(true)}>
              <Menu size={22} />
            </button>

            {/* Global Search Bar */}
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repair orders, VINs, units, fleet accounts, or techs..."
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.topHeaderRight}>
            <button className={styles.iconBtn} title="Notifications">
              <Bell size={18} />
              <span className={styles.notifDot} />
            </button>

            <button className="btn btn-primary" onClick={() => alert('Demo Mode: Launching Repair Order Wizard...')}>
              <Plus size={18} />
              <span>New Repair Order</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
