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
import { shopSettings, labourRateTypes, technicians } from '../../lib/demoData';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('shop');
  const [settings, setSettings] = useState(shopSettings);

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
              <div className={styles.card}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Company Name</label>
                    <input type="text" className={styles.input} defaultValue={settings.name} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Owner Name</label>
                    <input type="text" className={styles.input} defaultValue="John Doe" />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Address</label>
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
                  <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                </div>
              </div>
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
                      <h3>Stripe Payments</h3>
                      <p className={styles.integrationStatus} style={{ color: 'var(--color-text-secondary)' }}>Not connected</p>
                    </div>
                  </div>
                  <p className={styles.integrationDesc}>Accept credit card payments directly on digital invoices.</p>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>Connect to Stripe</button>
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
                  <button className="btn btn-primary"><Plus size={16}/> Add User</button>
                </div>
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
                    {technicians.map((tech, idx) => (
                      <tr key={tech.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={styles.avatar}>{tech.name[0]}</div>
                            {tech.name}
                          </div>
                        </td>
                        <td>{tech.role}</td>
                        <td>{tech.name.split(' ')[0].toLowerCase()}@fleetfinance.demo</td>
                        <td>
                          {idx === 0 ? <ToggleRight size={24} className={styles.toggleActive} /> : <ToggleRight size={24} className={styles.toggleActive} />}
                        </td>
                        <td><button className="btn btn-outline" style={{ padding: '4px 8px' }}>Edit</button></td>
                      </tr>
                    ))}
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
    </div>
  );
}
