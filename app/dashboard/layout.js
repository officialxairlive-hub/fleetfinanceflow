'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabaseClient';
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
  Settings,
  Loader
} from 'lucide-react';
import styles from './dashboard.module.css';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Work Orders', href: '/dashboard/jobs', icon: Wrench },
  { label: 'Customers & Fleets', href: '/dashboard/customers', icon: Users },
  { label: 'Dispatch Board', href: '/dashboard/dispatch', icon: Map },
  { label: 'Parts & Inventory', href: '/dashboard/parts', icon: PackageCheck },
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
  
  // Dynamic Search State from Supabase
  const [dbJobs, setDbJobs] = useState([]);
  const [dbCustomers, setDbCustomers] = useState([]);
  const [dbTechs, setDbTechs] = useState([]);
  const [dbParts, setDbParts] = useState([]);

  // Multi-Shop State
  const [memberShops, setMemberShops] = useState([]);
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [creatingShop, setCreatingShop] = useState(false);

  // Auth & Profile State
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profile, setProfile] = useState(null);
  const [shop, setShop] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/login');
          return;
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch all shop memberships for this user
        const { data: members } = await supabase
          .from('shop_members')
          .select('shop_id, role, shops(*)')
          .eq('user_id', session.user.id);

        let userShops = [];
        if (members && members.length > 0) {
          userShops = members.map(m => m.shops).filter(Boolean);
        }

        // Fetch shop details for active shop
        if (profileData?.shop_id) {
          const [shopRes, jobsRes, custRes, techRes, partsRes] = await Promise.all([
            supabase.from('shops').select('*').eq('id', profileData.shop_id).single(),
            supabase.from('work_orders').select('id, customer_name, unit_display'),
            supabase.from('customers').select('id, company, contact'),
            supabase.from('technicians').select('id, name, full_name, role'),
            supabase.from('parts').select('id, part_number, description')
          ]);

          const activeShop = shopRes.data || null;
          setShop(activeShop);

          if (activeShop && !userShops.find(s => s.id === activeShop.id)) {
            userShops.unshift(activeShop);
          }

          setDbJobs(jobsRes.data || []);
          setDbCustomers(custRes.data || []);
          setDbTechs(techRes.data || []);
          setDbParts(partsRes.data || []);
        }

        setMemberShops(userShops);
        setLoadingAuth(false);
      } catch (err) {
        console.error("Auth error:", err);
        router.push('/login');
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSwitchShop = async (selectedShopId) => {
    if (selectedShopId === 'ADD_NEW') {
      setShowAddShopModal(true);
      return;
    }

    if (!selectedShopId || selectedShopId === shop?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({ shop_id: selectedShopId })
        .eq('id', session.user.id);

      if (error) throw error;
      window.location.reload();
    } catch (err) {
      alert(`Error switching shop: ${err.message}`);
    }
  };

  const handleCreateNewShop = async (e) => {
    e.preventDefault();
    if (!newShopName.trim()) return;

    setCreatingShop(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Insert new shop
      const { data: newShop, error: shopErr } = await supabase
        .from('shops')
        .insert([{ name: newShopName }])
        .select()
        .single();

      if (shopErr) throw shopErr;

      // 2. Insert into shop_members
      await supabase
        .from('shop_members')
        .insert([{
          user_id: session.user.id,
          shop_id: newShop.id,
          role: 'owner'
        }]);

      // 3. Set active shop_id in profile
      await supabase
        .from('profiles')
        .update({ shop_id: newShop.id })
        .eq('id', session.user.id);

      setShowAddShopModal(false);
      window.location.reload();
    } catch (err) {
      alert(`Error creating shop location: ${err.message}`);
    } finally {
      setCreatingShop(false);
    }
  };

  // Search logic
  const searchLower = searchQuery.toLowerCase();
  
  const searchResults = {
    jobs: searchQuery ? dbJobs.filter(wo => (wo.id || '').toLowerCase().includes(searchLower) || (wo.customer_name || '').toLowerCase().includes(searchLower)) : [],
    customers: searchQuery ? dbCustomers.filter(c => (c.company || '').toLowerCase().includes(searchLower) || (c.id || '').toLowerCase().includes(searchLower)) : [],
    techs: searchQuery ? dbTechs.filter(t => (t.full_name || t.name || '').toLowerCase().includes(searchLower)) : [],
    parts: searchQuery ? dbParts.filter(p => (p.part_number || '').toLowerCase().includes(searchLower) || (p.description || '').toLowerCase().includes(searchLower)) : []
  };

  const hasResults = Object.values(searchResults).some(arr => arr.length > 0);

  const handleSearchNav = (url) => {
    setSearchModalOpen(false);
    setSearchQuery('');
    router.push(url);
  };

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader className="spin" size={32} color="var(--color-primary)" />
          <p>Loading Dashboard...</p>
        </div>
        <style jsx>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

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

        <div className={styles.shopSelector} style={{ position: 'relative', cursor: 'pointer' }}>
          <div className={styles.shopIcon}>
            <Truck size={18} />
          </div>
          <div className={styles.shopInfo} style={{ width: '100%' }}>
            <select
              value={shop?.id || ''}
              onChange={(e) => handleSwitchShop(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text)',
                fontWeight: '600',
                fontSize: '13px',
                width: '100%',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {memberShops.map(s => (
                <option key={s.id} value={s.id} style={{ color: '#000' }}>
                  {s.name}
                </option>
              ))}
              {profile?.role === 'owner' && (
                <option value="ADD_NEW" style={{ color: '#000', fontWeight: 'bold' }}>
                  + Add New Location...
                </option>
              )}
            </select>
            <div className={styles.shopMeta} style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              {memberShops.length > 1 ? `${memberShops.length} Locations (Click to switch)` : 'Main Location'}
            </div>
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
            <div className={styles.userName}>{profile?.full_name || 'User'}</div>
            <div className={styles.userRole} style={{textTransform: 'capitalize'}}>{profile?.role || 'Staff'}</div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Log Out" style={{background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer'}}>
            <LogOut size={16} />
          </button>
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
                                <strong>{job.id}</strong> - {job.customer_name || job.customer}
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
                                <strong>{tech.full_name || tech.name}</strong> - {tech.role}
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults.parts.length > 0 && (
                          <div className={styles.searchGroup}>
                            <div className={styles.searchGroupTitle}>Parts</div>
                            {searchResults.parts.slice(0,3).map(part => (
                              <div key={part.id} className={styles.searchItem} onClick={() => handleSearchNav(`/dashboard/parts`)}>
                                <strong>{part.part_number || part.partNumber}</strong> - {part.description}
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

            <Link href="/dashboard/jobs/new" className="btn btn-primary">
              <Plus size={18} />
              <span>New Repair Order</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>

      {/* Add New Shop Location Modal */}
      {showAddShopModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            borderRadius: '12px',
            width: '420px',
            maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="var(--color-primary)" />
                Add New Shop Location
              </h2>
              <button 
                onClick={() => setShowAddShopModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Create an additional garage or bay location. All data for this new shop will be isolated automatically.
            </p>
            <form onSubmit={handleCreateNewShop}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Shop / Location Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Repairs - West Facility"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddShopModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingShop}
                >
                  {creatingShop ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
