'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '../components/Logo';
import { workOrders, customers, technicians, partsInventory } from '../lib/demoData';
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
  ChevronRight,
  Users,
  Map,
  FileText,
  Shield,
  ClipboardList,
  BarChart3,
  Settings
} from 'lucide-react';
import styles from './dashboard.module.css';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Work Orders', href: '/dashboard/jobs', icon: Wrench, badge: '7' },
  { label: 'Customers & Fleets', href: '/dashboard/customers', icon: Users },
  { label: 'Dispatch Board', href: '/dashboard/dispatch', icon: Map },
  { label: 'Parts & Inventory', href: '/dashboard/parts', icon: PackageCheck, badge: '1 Low' },
  { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { label: 'Estimates', href: '/dashboard/estimates', icon: FileText },
  { label: 'Fleet Maintenance', href: '/dashboard/maintenance', icon: Shield },
  { label: 'Inspections', href: '/dashboard/inspections', icon: ClipboardList },
  { label: 'Labour Tracking', href: '/dashboard/labour', icon: Clock },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Search logic
  const searchLower = searchQuery.toLowerCase();
  
  const searchResults = {
    jobs: searchQuery ? workOrders.filter(wo => wo.id.toLowerCase().includes(searchLower) || (wo.customer || '').toLowerCase().includes(searchLower)) : [],
    customers: searchQuery ? customers.filter(c => c.company.toLowerCase().includes(searchLower) || c.id.toLowerCase().includes(searchLower)) : [],
    techs: searchQuery ? technicians.filter(t => t.name.toLowerCase().includes(searchLower)) : [],
    parts: searchQuery ? partsInventory.filter(p => p.partNumber.toLowerCase().includes(searchLower) || p.description.toLowerCase().includes(searchLower)) : []
  };

  const hasResults = Object.values(searchResults).some(arr => arr.length > 0);

  const handleSearchNav = (url) => {
    setSearchModalOpen(false);
    setSearchQuery('');
    router.push(url);
  };

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchModalOpen(true);
                }}
                onFocus={() => setSearchModalOpen(true)}
                placeholder="Search repair orders, VINs, units, fleet accounts, or techs..."
                className={styles.searchInput}
              />
              
              {searchModalOpen && searchQuery && (
                <>
                  <div className={styles.searchBackdrop} onClick={() => setSearchModalOpen(false)}></div>
                  <div className={styles.searchResults}>
                    {!hasResults ? (
                      <div className={styles.noResults}>No results found for "{searchQuery}"</div>
                    ) : (
                      <>
                        {searchResults.jobs.length > 0 && (
                          <div className={styles.searchGroup}>
                            <div className={styles.searchGroupTitle}>Work Orders</div>
                            {searchResults.jobs.slice(0,3).map(job => (
                              <div key={job.id} className={styles.searchItem} onClick={() => handleSearchNav(`/dashboard/jobs/${job.id}`)}>
                                <strong>{job.id}</strong> - {job.customer}
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults.customers.length > 0 && (
                          <div className={styles.searchGroup}>
                            <div className={styles.searchGroupTitle}>Customers</div>
                            {searchResults.customers.slice(0,3).map(cust => (
                              <div key={cust.id} className={styles.searchItem} onClick={() => handleSearchNav(`/dashboard/customers/${cust.id}`)}>
                                <strong>{cust.company}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults.techs.length > 0 && (
                          <div className={styles.searchGroup}>
                            <div className={styles.searchGroupTitle}>Technicians</div>
                            {searchResults.techs.slice(0,3).map(tech => (
                              <div key={tech.id} className={styles.searchItem} onClick={() => handleSearchNav(`/dashboard/labour`)}>
                                <strong>{tech.name}</strong> - {tech.role}
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults.parts.length > 0 && (
                          <div className={styles.searchGroup}>
                            <div className={styles.searchGroupTitle}>Parts</div>
                            {searchResults.parts.slice(0,3).map(part => (
                              <div key={part.id} className={styles.searchItem} onClick={() => handleSearchNav(`/dashboard/parts`)}>
                                <strong>{part.partNumber}</strong> - {part.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
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
