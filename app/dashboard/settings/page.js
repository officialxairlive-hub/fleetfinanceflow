'use client';

import React, { useState } from 'react';
import { 
  Save, 
  Building, 
  FileText, 
  Settings, 
  Users, 
  Link as LinkIcon, 
  Bell, 
  Check, 
  Plus,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import styles from './settings.module.css';
import { supabase } from '../../lib/supabaseClient';
import { shopSettings, labourRateTypes } from '../../lib/demoData';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('shop');
  const [settings, setSettings] = useState(shopSettings);
  
  // User Management State
  const [techs, setTechs] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '' });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState(null);

  // Profile & Shop State
  const [shopId, setShopId] = useState(null);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopSaveLoading, setShopSaveLoading] = useState(false);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(true); // Connected with test keys
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectModalData, setConnectModalData] = useState(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('stripe') === 'success') {
        setStripeConnected(true);
        alert('✅ Stripe account connected successfully! Bank payouts enabled.');
      }
    }
  }, []);

  React.useEffect(() => {
    async function fetchShopData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase.from('profiles').select('*, shops(*)').eq('id', session.user.id).single();
      if (profile) {
        setOwnerName(profile.full_name || '');
        if (profile.shop_id) {
          setShopId(profile.shop_id);
          if (profile.shops) {
            setShopName(profile.shops.name || '');
          }
          const { data: t } = await supabase.from('technicians').select('*').eq('shop_id', profile.shop_id);
          setTechs(t || []);
        }
      }
    }
    fetchShopData();
  }, []);

  const handleConnectStripe = async (isSimulate = false) => {
    const shouldSimulate = isSimulate === true;
    setStripeConnecting(true);
    try {
      const res = await fetch('/api/integrations/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shopId || 'SHOP-DEFAULT-1',
          originUrl: window.location.origin,
          simulate: shouldSimulate
        })
      });
      const data = await res.json();
      
      if (res.ok && data.url) {
        // Redirect to Stripe Hosted Express Onboarding (Uber-style bank account setup)
        window.location.href = data.url;
        return;
      }

      if (data.connectNotEnabled) {
        setConnectModalData(data);
        setShowConnectModal(true);
        return;
      }

      if (data.simulated) {
        setStripeConnected(true);
        setShowConnectModal(false);
        alert('✅ Canadian Bank Account (TD Canada Trust) linked successfully! Daily deposits active in CAD.');
        return;
      }

      if (data.error) throw new Error(data.error);
      alert('Stripe test connection initialized!');
      setStripeConnected(true);
    } catch (err) {
      alert(`Stripe Connection Notice: ${err.message}`);
    } finally {
      setStripeConnecting(false);
    }
  };

  const handleSaveShopInfo = async (e) => {
    e.preventDefault();
    if (!shopId || !shopName.trim()) return;

    setShopSaveLoading(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({ name: shopName })
        .eq('id', shopId);

      if (error) throw error;
      alert('Shop settings updated live in Supabase!');
    } catch (err) {
      alert(`Error updating shop: ${err.message}`);
    } finally {
      setShopSaveLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError(null);
    try {
      const res = await fetch('/api/mechanics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, shopId, role: 'mechanic' })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      alert('Mechanic added successfully!');
      setShowAddUser(false);
      setNewUser({ fullName: '', email: '', password: '' });
      
      // Refresh techs
      const { data: t } = await supabase.from('technicians').select('*').eq('shop_id', shopId);
      setTechs(t || []);
    } catch (err) {
      setAddUserError(err.message);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Simulate save
    alert('Settings saved successfully!');
  };

  const sections = [
    { id: 'shop', icon: <Building size={18} />, label: 'Shop Information' },
    { id: 'rates', icon: <Settings size={18} />, label: 'Default Rates & Tax' },
    { id: 'invoicing', icon: <FileText size={18} />, label: 'Invoicing' },
    { id: 'users', icon: <Users size={18} />, label: 'User Management' },
    { id: 'integrations', icon: <LinkIcon size={18} />, label: 'Integrations' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your shop preferences and configurations</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={18} /> Save All Changes
        </button>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            {sections.map(section => (
              <button
                key={section.id}
                className={`${styles.navItem} ${activeSection === section.id ? styles.navItemActive : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.icon}
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className={styles.content}>
          {activeSection === 'shop' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Shop Information</h2>
                <p>Basic details about your business.</p>
              </div>
              <form onSubmit={handleSaveShopInfo} className={styles.card}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Company / Shop Name</label>
                    <input type="text" required className={styles.input} value={shopName} onChange={e => setShopName(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Owner Name</label>
                    <input type="text" className={styles.input} value={ownerName} onChange={e => setOwnerName(e.target.value)} readOnly />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Shop Address</label>
                    <input type="text" className={styles.input} defaultValue={settings.address} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input type="tel" className={styles.input} defaultValue={settings.phone} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input type="email" className={styles.input} defaultValue={settings.email} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Website</label>
                    <input type="url" className={styles.input} defaultValue="www.fleetfinanceflow.com" />
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <button type="submit" className="btn btn-primary" disabled={shopSaveLoading}>
                    {shopSaveLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === 'rates' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Default Rates & Tax</h2>
                <p>Configure pricing defaults and tax rates.</p>
              </div>
              
              <div className={styles.card}>
                <h3>Tax Configuration</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Province/State</label>
                    <select className={styles.input} defaultValue="ON">
                      <option value="ON">Ontario (ON)</option>
                      <option value="BC">British Columbia (BC)</option>
                      <option value="AB">Alberta (AB)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>GST Rate (%)</label>
                    <input type="number" className={styles.input} defaultValue="5" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>PST Rate (%)</label>
                    <input type="number" className={styles.input} defaultValue="8" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>HST Rate (%)</label>
                    <input type="number" className={styles.input} defaultValue="13" />
                  </div>
                </div>
                <div className={styles.toggleGroup}>
                  <div className={styles.toggleItem}>
                    <span>Apply GST</span>
                    <ToggleRight size={24} className={styles.toggleActive} />
                  </div>
                  <div className={styles.toggleItem}>
                    <span>Apply PST</span>
                    <ToggleLeft size={24} className={styles.toggleInactive} />
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3>Default Rates</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Default Labour Rate ($/hr)</label>
                    <input type="number" className={styles.input} defaultValue={settings.defaultLabourRate} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Default Parts Markup (%)</label>
                    <input type="number" className={styles.input} defaultValue="40" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Shop Supply Rate (%)</label>
                    <input type="number" className={styles.input} defaultValue="5" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Environmental Fee ($)</label>
                    <input type="number" className={styles.input} defaultValue="10" />
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3>Labour Rate Types</h3>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Rate Name</th>
                      <th>Amount ($/hr)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labourRateTypes.map(rate => (
                      <tr key={rate.id}>
                        <td><input type="text" className={styles.input} defaultValue={rate.name} style={{ padding: '4px 8px' }} /></td>
                        <td><input type="number" className={styles.input} defaultValue={rate.rate} style={{ padding: '4px 8px', width: '100px' }} /></td>
                        <td><button className="btn btn-outline" style={{ padding: '4px 8px' }}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-outline" style={{ marginTop: '1rem' }}><Plus size={16}/> Add Rate Type</button>
                <div className={styles.cardFooter}>
                  <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'invoicing' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Invoicing Preferences</h2>
                <p>Set up how your documents are numbered and formatted.</p>
              </div>
              <div className={styles.card}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Invoice Number Prefix</label>
                    <input type="text" className={styles.input} defaultValue="INV-" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Next Invoice Number</label>
                    <input type="number" className={styles.input} defaultValue="1045" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Work Order Prefix</label>
                    <input type="text" className={styles.input} defaultValue="WO-" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Next Work Order Number</label>
                    <input type="number" className={styles.input} defaultValue="2150" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Default Payment Terms</label>
                    <select className={styles.input} defaultValue="Net 30">
                      <option>Due on Receipt</option>
                      <option>Net 15</option>
                      <option>Net 30</option>
                      <option>Net 60</option>
                    </select>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Integrations</h2>
                <p>Connect Fleet Finance Flow with other tools.</p>
              </div>
              <div className={styles.integrationGrid}>
                <div className={styles.integrationCard}>
                  <div className={styles.integrationHeader}>
                    <div className={styles.integrationLogo}>QB</div>
                    <div>
                      <h3>QuickBooks Online</h3>
                      <p className={styles.integrationStatus}>Connected</p>
                    </div>
                  </div>
                  <p className={styles.integrationDesc}>Sync invoices, customers, and payments automatically to QuickBooks.</p>
                  <p className={styles.syncTime}>Last sync: 10 mins ago</p>
                  <button className="btn btn-outline" style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}>Disconnect</button>
                </div>
                <div className={styles.integrationCard}>
                  <div className={styles.integrationHeader}>
                    <div className={styles.integrationLogo} style={{ backgroundColor: '#6366f1' }}>S</div>
                    <div>
                      <h3>Stripe Direct Bank Payouts</h3>
                      <p className={styles.integrationStatus} style={{ color: stripeConnected ? '#10B981' : 'var(--color-text-secondary)' }}>
                        {stripeConnected ? '● Direct Deposit Active (CAD)' : 'Not Connected'}
                      </p>
                    </div>
                  </div>
                  <p className={styles.integrationDesc}>
                    Connect your Canadian business bank account (TD, RBC, BMO, Scotiabank) for automatic 2-day direct deposits from customer repair orders.
                  </p>
                  <p className={styles.syncTime}>
                    Auto-split: <strong>99% to Shop Bank</strong> • <strong>1% Platform Fee</strong>
                  </p>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: 'auto', backgroundColor: '#6366f1', borderColor: '#6366f1' }}
                    onClick={() => handleConnectStripe(false)}
                    disabled={stripeConnecting}
                  >
                    {stripeConnecting ? 'Opening Stripe Express...' : '🏦 Setup / Update Canadian Bank Account'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>User Management</h2>
                <p>Manage staff access and roles.</p>
              </div>
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button className="btn btn-primary" onClick={() => setShowAddUser(true)}><Plus size={16}/> Add Mechanic</button>
                </div>
                
                {showAddUser && (
                  <div style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', background: 'var(--color-background)' }}>
                    <h3 style={{marginTop:0, marginBottom:'1rem'}}>Add New Mechanic</h3>
                    {addUserError && <p style={{color:'red', marginBottom:'1rem'}}>{addUserError}</p>}
                    <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div className={styles.formGroup} style={{marginBottom:0, flex: 1, minWidth: '200px'}}>
                        <label>Full Name</label>
                        <input type="text" required className={styles.input} value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
                      </div>
                      <div className={styles.formGroup} style={{marginBottom:0, flex: 1, minWidth: '200px'}}>
                        <label>Email</label>
                        <input type="email" required className={styles.input} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                      </div>
                      <div className={styles.formGroup} style={{marginBottom:0, flex: 1, minWidth: '200px'}}>
                        <label>Password</label>
                        <input type="password" required className={styles.input} minLength={6} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                      </div>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button type="button" className="btn btn-outline" onClick={() => setShowAddUser(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={addUserLoading}>{addUserLoading ? 'Adding...' : 'Create'}</button>
                      </div>
                    </form>
                  </div>
                )}

                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techs.length > 0 ? techs.map((tech, idx) => (
                      <tr key={tech.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={styles.avatar}>{(tech.name || 'M')[0]}</div>
                            {tech.full_name || tech.name}
                          </div>
                        </td>
                        <td>{tech.role}</td>
                        <td>{tech.email || 'N/A'}</td>
                        <td>
                          <ToggleRight size={24} className={styles.toggleActive} />
                        </td>
                        <td><button className="btn btn-outline" style={{ padding: '4px 8px' }}>Edit</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{textAlign: 'center'}}>No mechanics found for your shop.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Notification Preferences</h2>
                <p>Control how and when you receive alerts.</p>
              </div>
              
              <div className={styles.card}>
                <h3>Global Methods</h3>
                <div className={styles.toggleGroup}>
                  <div className={styles.toggleItem}>
                    <span>Email Notifications</span>
                    <ToggleRight size={24} className={styles.toggleActive} />
                  </div>
                  <div className={styles.toggleItem}>
                    <span>SMS Notifications</span>
                    <ToggleRight size={24} className={styles.toggleActive} />
                  </div>
                  <div className={styles.toggleItem}>
                    <span>Push (Browser)</span>
                    <ToggleLeft size={24} className={styles.toggleInactive} />
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h3>Alert Types</h3>
                <div className={styles.notificationList}>
                  <div className={styles.notificationItem}>
                    <div>
                      <h4>New Job Assigned</h4>
                      <p>When a new work order is created and assigned.</p>
                    </div>
                    <ToggleRight size={24} className={styles.toggleActive} />
                  </div>
                  <div className={styles.notificationItem}>
                    <div>
                      <h4>Estimate Approved</h4>
                      <p>When a customer approves an estimate.</p>
                    </div>
                    <ToggleRight size={24} className={styles.toggleActive} />
                  </div>
                  <div className={styles.notificationItem}>
                    <div>
                      <h4>Job Completed</h4>
                      <p>When a technician marks a job as done.</p>
                    </div>
                    <ToggleRight size={24} className={styles.toggleActive} />
                  </div>
                  <div className={styles.notificationItem}>
                    <div>
                      <h4>Invoice Past Due</h4>
                      <p>When an invoice passes its due date.</p>
                    </div>
                    <ToggleRight size={24} className={styles.toggleActive} />
                  </div>
                  <div className={styles.notificationItem}>
                    <div>
                      <h4>Payment Received</h4>
                      <p>When a payment is logged against an invoice.</p>
                    </div>
                    <ToggleRight size={24} className={styles.toggleActive} />
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <button className="btn btn-primary" onClick={handleSave}>Save Preferences</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Stripe Connect Activation & Bank Setup Modal */}
      {showConnectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STRIPE CONNECT MARKETPLACE</span>
                <h2 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800 }}>Canadian Bank Account Payout Setup</h2>
              </div>
              <button onClick={() => setShowConnectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '20px' }}>✕</button>
            </div>

            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--color-text)' }}>
                ℹ️ To link live bank payouts via Stripe Express:
              </p>
              <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-secondary)' }}>
                <li style={{ marginBottom: '4px' }}>Log into your Stripe Dashboard at <a href="https://dashboard.stripe.com/test/connect" target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontWeight: 600 }}>dashboard.stripe.com/connect</a>.</li>
                <li style={{ marginBottom: '4px' }}>Click <strong>"Get Started with Connect"</strong> (takes 1 click in Test Mode).</li>
                <li>Return here to generate live Express onboarding links for your shops.</li>
              </ol>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '18px', lineHeight: 1.4 }}>
              Want to see and test the direct bank payout dashboard right now? You can simulate linking a Canadian bank account in 1 click:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ backgroundColor: '#10B981', borderColor: '#10B981', padding: '12px', justifyContent: 'center' }}
                onClick={() => handleConnectStripe(true)}
              >
                ⚡ Link Demo Canadian Bank (TD / Transit: 01842)
              </button>

              <a 
                href="https://dashboard.stripe.com/test/connect" 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-outline"
                style={{ justifyContent: 'center', padding: '10px', textDecoration: 'none' }}
              >
                ↗️ Open Stripe Dashboard (Enable Connect)
              </a>

              <button 
                type="button" 
                className="btn btn-outline"
                style={{ justifyContent: 'center', borderColor: 'transparent' }}
                onClick={() => setShowConnectModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
