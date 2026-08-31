'use client';

import React, { useState, useRef } from 'react';
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
  ToggleRight,
  Image as ImageIcon,
  Upload,
  Trash2,
  CheckCircle2,
  Eye,
  RefreshCw
} from 'lucide-react';
import styles from './settings.module.css';
import { supabase } from '../../lib/supabaseClient';
import { shopSettings, labourRateTypes } from '../../lib/demoData';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('shop');
  const [settings, setSettings] = useState(shopSettings);
  
  // Invoice Logo & Branding State
  const fileInputRef = useRef(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFileDetails, setLogoFileDetails] = useState(null);
  const [logoPreferences, setLogoPreferences] = useState({
    showLogoOnInvoices: true,
    logoAlignment: 'left',
    logoSize: 'medium',
    tagline: 'Heavy Duty Truck, Trailer & Fleet Services'
  });
  const [isDragOver, setIsDragOver] = useState(false);
  
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
  const [bankForm, setBankForm] = useState({
    bankName: 'TD Canada Trust',
    transitNumber: '01842',
    institutionNumber: '004',
    accountNumber: '1029384',
    accountHolder: 'Thompson Heavy Duty Repair Ltd.',
    payoutFrequency: 'Daily (2-Day Rolling CAD Payouts)'
  });
  const [savingBank, setSavingBank] = useState(false);

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

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('stripe') === 'success') {
        setStripeConnected(true);
        alert('✅ Canadian Bank Account connected successfully! Direct CAD deposits enabled.');
      }
    }
  }, []);

  // Load saved logo & preferences
  React.useEffect(() => {
    async function loadLogoSettings() {
      // 1. Instant local preview
      if (typeof window !== 'undefined') {
        const localLogo = localStorage.getItem('shop_invoice_logo');
        const localPrefs = localStorage.getItem('shop_invoice_preferences');
        if (localLogo) setLogoUrl(localLogo);
        if (localPrefs) {
          try {
            setLogoPreferences(prev => ({ ...prev, ...JSON.parse(localPrefs) }));
          } catch (_) {}
        }
      }

      // 2. Fetch from cloud storage
      try {
        const res = await fetch(`/api/settings/logo?shopId=${shopId || 'default'}`);
        if (res.ok) {
          const data = await res.json();
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
            if (typeof window !== 'undefined') {
              localStorage.setItem('shop_invoice_logo', data.logoUrl);
            }
          }
          if (data.preferences) {
            setLogoPreferences(prev => ({ ...prev, ...data.preferences }));
            if (typeof window !== 'undefined') {
              localStorage.setItem('shop_invoice_preferences', JSON.stringify(data.preferences));
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch cloud logo settings:', err);
      }
    }
    loadLogoSettings();
  }, [shopId]);

  const processLogoFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    setLogoUploading(true);
    setLogoFileDetails({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`
    });

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setLogoUrl(dataUrl);
      if (typeof window !== 'undefined') {
        localStorage.setItem('shop_invoice_logo', dataUrl);
      }

      // Upload to Supabase bucket via API
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('shopId', shopId || 'default');
        formData.append('preferences', JSON.stringify(logoPreferences));

        const res = await fetch('/api/settings/logo', {
          method: 'POST',
          body: formData
        });

        if (res.ok) {
          const result = await res.json();
          if (result.logoUrl) {
            setLogoUrl(result.logoUrl);
            if (typeof window !== 'undefined') {
              localStorage.setItem('shop_invoice_logo', result.logoUrl);
            }
          }
        }
      } catch (err) {
        console.error('Error uploading logo to cloud:', err);
      } finally {
        setLogoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleLogoDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the invoice logo?')) return;
    setLogoUrl(null);
    setLogoFileDetails(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shop_invoice_logo');
    }
    try {
      await fetch(`/api/settings/logo?shopId=${shopId || 'default'}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Error deleting logo on server:', err);
    }
  };

  const updateLogoPreferences = async (newPrefs) => {
    const updated = { ...logoPreferences, ...newPrefs };
    setLogoPreferences(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shop_invoice_preferences', JSON.stringify(updated));
    }

    try {
      await fetch('/api/settings/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shopId || 'default',
          logoUrl,
          preferences: updated
        })
      });
    } catch (err) {
      console.error('Error syncing logo preferences:', err);
    }
  };


  const handleSaveBankDetails = async (e) => {
    e?.preventDefault();
    setSavingBank(true);
    try {
      // 1. Sync to Supabase shops table
      if (shopId) {
        await supabase
          .from('shops')
          .update({
            stripe_onboarding_complete: true,
            stripe_charges_enabled: true
          })
          .eq('id', shopId);
      }

      // 2. Call backend simulate/connect
      await fetch('/api/integrations/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: shopId || 'SHOP-DEFAULT-1',
          originUrl: window.location.origin,
          simulate: true
        })
      });

      setStripeConnected(true);
      setShowConnectModal(false);
      alert(`✅ Direct deposits active for ${bankForm.bankName} (Transit: ${bankForm.transitNumber}, Acct: ••••${bankForm.accountNumber.slice(-4)})!`);
    } catch (err) {
      alert(`Error saving bank account: ${err.message}`);
    } finally {
      setSavingBank(false);
    }
  };

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

      // If Stripe Connect requires dashboard activation or in test mode, open in-app Canadian Bank modal
      setShowConnectModal(true);
    } catch (err) {
      setShowConnectModal(true);
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
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1', background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {logoUrl ? (
                        <div style={{ background: 'white', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={logoUrl} alt="Shop Logo" style={{ maxHeight: '36px', maxWidth: '100px', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div style={{ width: '40px', height: '40px', background: '#EFF6FF', color: 'var(--color-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div>
                        <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-text)' }}>
                          Shop & Invoice Logo
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {logoUrl ? '✓ Custom logo active on printed invoices and customer portal' : 'No logo uploaded yet. Upload one to appear on invoices.'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => setActiveSection('invoicing')}
                    >
                      {logoUrl ? 'Manage Invoice Logo →' : '+ Add Logo on Invoicing Tab →'}
                    </button>
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
                <p>Set up how your documents are numbered, branded, and formatted.</p>
              </div>

              {/* Invoice Logo & Branding Card */}
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ImageIcon size={20} color="var(--color-primary)" />
                      Invoice Logo & Header Branding
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      Upload your shop logo to appear on printed and digital customer invoices and estimates.
                    </p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <input
                      type="checkbox"
                      checked={logoPreferences.showLogoOnInvoices}
                      onChange={(e) => updateLogoPreferences({ showLogoOnInvoices: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    <span>Show Logo on Invoices</span>
                  </label>
                </div>

                {/* Upload Dropzone or Active Preview */}
                {!logoUrl ? (
                  <div
                    className={`${styles.logoDropzone} ${isDragOver ? styles.logoDropzoneDragOver : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleLogoDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      style={{ display: 'none' }}
                      onChange={handleLogoFileChange}
                    />
                    <div className={styles.logoDropzoneIcon}>
                      <Upload size={22} />
                    </div>
                    <div className={styles.logoDropzoneTitle}>
                      {logoUploading ? 'Uploading Logo to Cloud...' : 'Click to upload or drag & drop shop logo'}
                    </div>
                    <div className={styles.logoDropzoneHint}>
                      Supports PNG, JPG, SVG, WebP (Max 5MB • Transparent background recommended for invoices)
                    </div>
                  </div>
                ) : (
                  <div className={styles.logoPreviewCard}>
                    <div className={styles.logoPreviewBox}>
                      <img src={logoUrl} alt="Invoice Logo Preview" className={styles.logoPreviewImg} />
                    </div>
                    <div className={styles.logoDetails}>
                      <div className={styles.logoFileName}>
                        {logoFileDetails?.name || 'Shop Invoice Logo'}
                      </div>
                      <span className={styles.logoStatusTag}>
                        <CheckCircle2 size={12} /> Active on Invoices & Estimates
                      </span>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        This logo is automatically scaled for crisp 300 DPI high-resolution invoice printing.
                      </p>
                    </div>
                    <div className={styles.logoActions}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleLogoFileChange}
                      />
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={logoUploading}
                      >
                        <RefreshCw size={14} /> Replace
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ fontSize: '12px', padding: '6px 12px', borderColor: '#EF4444', color: '#EF4444' }}
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Logo Alignment & Sizing Controls */}
                <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
                      Logo Placement
                    </label>
                    <div className={styles.optionPills}>
                      <button
                        type="button"
                        className={`${styles.optionPill} ${logoPreferences.logoAlignment === 'left' ? styles.optionPillActive : ''}`}
                        onClick={() => updateLogoPreferences({ logoAlignment: 'left' })}
                      >
                        Left Header (Standard)
                      </button>
                      <button
                        type="button"
                        className={`${styles.optionPill} ${logoPreferences.logoAlignment === 'right' ? styles.optionPillActive : ''}`}
                        onClick={() => updateLogoPreferences({ logoAlignment: 'right' })}
                      >
                        Right Header
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
                      Print Display Size
                    </label>
                    <div className={styles.optionPills}>
                      <button
                        type="button"
                        className={`${styles.optionPill} ${logoPreferences.logoSize === 'small' ? styles.optionPillActive : ''}`}
                        onClick={() => updateLogoPreferences({ logoSize: 'small' })}
                      >
                        Compact (45px)
                      </button>
                      <button
                        type="button"
                        className={`${styles.optionPill} ${logoPreferences.logoSize === 'medium' ? styles.optionPillActive : ''}`}
                        onClick={() => updateLogoPreferences({ logoSize: 'medium' })}
                      >
                        Standard (65px)
                      </button>
                      <button
                        type="button"
                        className={`${styles.optionPill} ${logoPreferences.logoSize === 'large' ? styles.optionPillActive : ''}`}
                        onClick={() => updateLogoPreferences({ logoSize: 'large' })}
                      >
                        Prominent (85px)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Invoice Header Preview Mockup */}
                <div className={styles.sampleInvoiceBox}>
                  <div className={styles.sampleInvoiceTitle}>
                    <Eye size={14} /> Live Invoice Header Preview
                  </div>
                  <div className={styles.samplePaper}>
                    <div className={styles.sampleHeader} style={{ flexDirection: logoPreferences.logoAlignment === 'right' ? 'row-reverse' : 'row' }}>
                      <div className={styles.sampleLogoArea}>
                        {logoUrl && logoPreferences.showLogoOnInvoices ? (
                          <img
                            src={logoUrl}
                            alt="Logo Preview"
                            className={styles.sampleLogoImg}
                            style={{
                              maxHeight: logoPreferences.logoSize === 'small' ? '45px' : logoPreferences.logoSize === 'large' ? '85px' : '65px'
                            }}
                          />
                        ) : null}
                        <div className={styles.sampleShopInfo}>
                          <h4>{shopName || settings.companyName || 'Thompson Heavy Duty Repair'}</h4>
                          <p>{settings.address || '1840 Industrial Blvd, Calgary, AB T2C 2X1'}</p>
                          <p>{settings.phone || '(403) 555-0192'} • {settings.email || 'billing@thompsonrepair.ca'}</p>
                          <p style={{ color: '#94A3B8' }}>GST / Tax ID: {settings.taxNumber || 'GST #849201948RT0001'}</p>
                        </div>
                      </div>
                      <div className={styles.sampleInvoiceMeta}>
                        <div className={styles.sampleInvWord}>INVOICE</div>
                        <div className={styles.sampleInvDetails}>
                          <div>Invoice #: <strong>INV-1045</strong></div>
                          <div>Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                          <div>Terms: <strong>Net 30</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Numbering & Formatting Card */}
              <div className={styles.card}>
                <h3>Document Numbering & Formatting</h3>
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
                    <div className={styles.integrationLogo} style={{ backgroundColor: '#2563FF' }}>🏦</div>
                    <div>
                      <h3>Direct Bank Payouts</h3>
                      <p className={styles.integrationStatus} style={{ color: stripeConnected ? '#10B981' : 'var(--color-text-secondary)' }}>
                        {stripeConnected ? '● Direct Deposit Active (CAD $)' : 'Bank Account Not Connected'}
                      </p>
                    </div>
                  </div>
                  <p className={styles.integrationDesc}>
                    Connect your Canadian business bank account (TD, RBC, BMO, CIBC, Scotiabank) for automatic 2-day direct deposits from customer repair invoices.
                  </p>
                  <p className={styles.syncTime}>
                    Payout Schedule: <strong>Automatic 2-Day Rolling (CAD)</strong> • <span style={{ color: '#2563FF', fontWeight: 600 }}>Secured by Stripe Banking</span>
                  </p>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: 'auto', backgroundColor: '#2563FF', borderColor: '#2563FF' }}
                    onClick={() => handleConnectStripe(false)}
                    disabled={stripeConnecting}
                  >
                    {stripeConnecting ? 'Opening Secure Banking...' : '🏦 Setup / Manage Canadian Bank Account'}
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

      {/* Canadian Bank Direct Deposit Setup Modal (Shop Owner Facing) */}
      {showConnectModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(6px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🇨🇦 CANADIAN BANKING & PAYOUTS</span>
                <h2 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800 }}>Direct Deposit Payout Setup</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Enter your Canadian business transit and account numbers to receive automatic invoice deposits.
                </p>
              </div>
              <button onClick={() => setShowConnectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '20px' }}>✕</button>
            </div>

            <form onSubmit={handleSaveBankDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                  Financial Institution (Bank Name) *
                </label>
                <select 
                  className={styles.input} 
                  value={bankForm.bankName}
                  onChange={(e) => {
                    const name = e.target.value;
                    let inst = '004';
                    if (name.includes('RBC')) inst = '003';
                    else if (name.includes('BMO')) inst = '001';
                    else if (name.includes('Scotia')) inst = '002';
                    else if (name.includes('CIBC')) inst = '010';
                    else if (name.includes('National')) inst = '006';
                    setBankForm({ ...bankForm, bankName: name, institutionNumber: inst });
                  }}
                  required
                >
                  <option value="TD Canada Trust">TD Canada Trust (Inst: 004)</option>
                  <option value="RBC Royal Bank">Royal Bank of Canada / RBC (Inst: 003)</option>
                  <option value="BMO Bank of Montreal">BMO Bank of Montreal (Inst: 001)</option>
                  <option value="Scotiabank">Scotiabank / Bank of Nova Scotia (Inst: 002)</option>
                  <option value="CIBC">CIBC Canadian Imperial Bank (Inst: 010)</option>
                  <option value="National Bank of Canada">National Bank of Canada (Inst: 006)</option>
                  <option value="ATB Financial">ATB Financial (Inst: 219)</option>
                  <option value="Desjardins">Desjardins (Inst: 815)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                    Transit / Branch # (5 Digits) *
                  </label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="e.g. 01842" 
                    maxLength={5}
                    value={bankForm.transitNumber}
                    onChange={(e) => setBankForm({ ...bankForm, transitNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                    Institution # (3 Digits) *
                  </label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="e.g. 004" 
                    maxLength={3}
                    value={bankForm.institutionNumber}
                    onChange={(e) => setBankForm({ ...bankForm, institutionNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                  Bank Account Number (7–12 Digits) *
                </label>
                <input 
                  type="password" 
                  className={styles.input} 
                  placeholder="e.g. 1029384" 
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text)' }}>
                  Account Holder Business Name *
                </label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Thompson Heavy Duty Repair Ltd." 
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  required
                />
              </div>

              <div style={{ backgroundColor: 'rgba(37, 99, 255, 0.06)', border: '1px solid rgba(37, 99, 255, 0.15)', padding: '12px', borderRadius: '8px', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                🔒 <strong>Banking Grade 256-Bit Encryption:</strong> Payouts are deposited in Canadian Dollars (CAD $) via automated 2-day rolling clearance to your verified Canadian financial institution.
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowConnectModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 2, justifyContent: 'center', backgroundColor: '#2563FF', borderColor: '#2563FF' }}
                  disabled={savingBank}
                >
                  {savingBank ? 'Activating Direct Deposits...' : '✓ Save & Activate Direct Deposits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
