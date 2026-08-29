'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import {
  Wrench,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  User,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Truck,
  FileText,
  CreditCard,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [filter, setFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const [woRes, techRes, invRes, partRes] = await Promise.all([
          supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
          supabase.from('technicians').select('*'),
          supabase.from('invoices').select('*').order('created_at', { ascending: false }),
          supabase.from('parts').select('*').order('part_number', { ascending: true })
        ]);

        // 1. Process Live Work Orders from Supabase
        const loadedJobs = (woRes.data || []).map(wo => {
          let partsStatus = 'Parts Ready';
          let partsVariant = 'success';
          if (wo.status === 'waiting_parts') {
            partsStatus = 'Pending Parts';
            partsVariant = 'warning';
          }

          let marginStatus = 'good';
          if ((wo.margin || 65) < 60) marginStatus = 'warn';

          const hours = Math.floor((wo.timer || 0) / 3600);
          const mins = Math.floor(((wo.timer || 0) % 3600) / 60);

          return {
            ...wo,
            unit: wo.unit_display || 'Commercial Fleet Unit',
            customer: wo.customer_name || 'Fleet Customer',
            issue: wo.complaint || 'Heavy Duty Mechanical Service',
            tech: wo.tech_name || 'Unassigned',
            timer: `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`,
            partsStatus,
            partsVariant,
            margin: `${wo.margin || 65}%`,
            marginStatus,
            billedLabor: `$${(parseFloat(wo.estimated_cost) || 0).toFixed(2)} CAD`,
            clockedLabor: `${(hours + mins / 60).toFixed(2)} hrs`
          };
        });
        setJobs(loadedJobs);

        // 2. Process Live Technicians from Supabase
        const loadedTechs = (techRes.data || []).map(t => ({
          ...t,
          activeJob: t.active_job || 'Available',
          status: t.status || 'Active',
          timer: `${Math.floor(t.hours_today || 0)}h 00m`,
          avatar: t.avatar || (t.name || 'TC').slice(0, 2).toUpperCase()
        }));
        setTechnicians(loadedTechs);

        // 3. Process Live Invoices from Supabase
        setInvoices(invRes.data || []);

        // 4. Process Live Parts from Supabase
        setParts(partRes.data || []);
      } catch (err) {
        console.error("Error fetching live dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter((j) => j.status === filter || (filter === 'in_progress' && (j.status === 'repairing' || j.status === 'diagnosing')));

  // Live Metric Aggregations
  const activeJobsCount = jobs.filter(j => !['invoiced', 'paid'].includes(j.status)).length;
  const totalBilled = jobs.reduce((sum, j) => sum + (parseFloat(j.estimated_cost) || 0), 0);
  const totalClocked = jobs.reduce((sum, j) => sum + ((j.timer || 0) / 3600), 0);
  const activeTechsCount = technicians.filter(t => (t.status || '').toLowerCase() === 'active').length;

  // Live Sections Filtered Data
  const activeBayJobs = jobs.filter(j => ['repairing', 'diagnosing', 'waiting_parts', 'new'].includes(j.status));
  const pendingEstimates = jobs.filter(j => !j.authorized || j.status === 'estimate' || j.status === 'new');
  const lowStockParts = parts.filter(p => (p.qty_on_hand || p.qtyOnHand || 0) <= (p.min_stock || p.minStock || 5));
  const unbilledInvoices = invoices.filter(inv => inv.status !== 'paid');

  // Dynamic Live Activity derived from real data
  const liveActivities = jobs.slice(0, 3).map((job, idx) => ({
    id: idx,
    title: job.authorized ? 'Customer Authorized' : `Status: ${(job.status || 'Active').replace('_', ' ').toUpperCase()}`,
    desc: `${job.customer || 'Fleet Customer'} · ${job.unit || 'Unit'} (${job.billedLabor || '$0.00 CAD'}).`,
    link: `/dashboard/jobs/${job.id}`
  }));

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Banner Welcome */}
      <div className={styles.welcomeBanner}>
        <div>
          <h1 className={styles.pageTitle}>Shop Live Command Center</h1>
          <p className={styles.pageSubtitle}>
            Real-time overview of active repair orders, technician floor hours, parts bottlenecks, and margin tracking.
          </p>
        </div>
        <div className={styles.bannerBadge}>
          <span className={styles.liveDot} />
          <span>Live Floor Sync Active (Supabase)</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading live shop data from Supabase...
        </div>
      ) : (
        <>
          {/* 1. KPI Metric Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Active Repair Jobs</span>
                <div className={styles.kpiIconWrapper}>
                  <Wrench size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{activeJobsCount} <span className={styles.kpiUnit}>Jobs</span></div>
              <div className={styles.kpiMeta}>
                <span className={styles.greenText}>{activeJobsCount > 0 ? 'Active' : 'Idle'}</span> in Shop Bays & Roadside
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Clocked Tech Hours</span>
                <div className={styles.kpiIconWrapper}>
                  <Clock size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{totalClocked.toFixed(1)} <span className={styles.kpiUnit}>hrs today</span></div>
              <div className={styles.kpiMeta}>
                <span className={styles.greenText}>{activeTechsCount}</span> Techs Active on Floor
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Today's Est. Revenue</span>
                <div className={styles.kpiIconWrapper}>
                  <DollarSign size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>${Math.floor(totalBilled).toLocaleString()} <span className={styles.kpiUnit}>CAD</span></div>
              <div className={styles.kpiMeta}>
                <span className={styles.greenText}>Live</span> tracking from Work Orders
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Est. Gross Profit Margin</span>
                <div className={styles.kpiIconWrapper}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{jobs.length > 0 ? `${Math.round(jobs.reduce((s, j) => s + parseFloat(j.margin || 65), 0) / jobs.length)}%` : '--'}</div>
              <div className={styles.kpiMeta}>
                <span className={styles.greenText}>{jobs.length > 0 ? 'Target: >60%' : 'No active jobs'}</span>
              </div>
            </div>
          </div>

          {/* 2. 6-Module Live Shop Operations Radar (Mini Window Previews) */}
          <div className={styles.cockpitSection}>
            <div className={styles.cockpitHeader}>
              <h3 className={styles.cockpitTitle}>
                <Layers size={17} color="var(--color-primary)" />
                Shop Operations Radar (Live Section Previews)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Click any window to open live workspace
              </span>
            </div>

            <div className={styles.cockpitGrid}>
              {/* Window 1: Work Orders Live Stream */}
              <Link href="/dashboard/jobs" className={styles.windowCard}>
                <div className={styles.windowTitleBar}>
                  <span className={styles.windowTitle}>
                    <Wrench size={14} color="#2563FF" />
                    Work Orders
                  </span>
                  <span className={`${styles.windowBadge} ${styles.badgeBlue}`}>
                    {activeJobsCount} Active
                  </span>
                </div>
                <div className={styles.windowBody}>
                  {jobs.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                      No active work orders
                    </div>
                  ) : (
                    jobs.slice(0, 2).map((j, i) => (
                      <div key={i} className={styles.windowRow}>
                        <div>
                          <div className={styles.windowRowMain}>{j.unit}</div>
                          <div className={styles.windowRowSub}>{j.issue?.slice(0, 32)}...</div>
                        </div>
                        <span className={`${styles.windowPill} ${j.status === 'waiting_parts' ? styles.badgeOrange : styles.badgeBlue}`}>
                          {j.status === 'waiting_parts' ? 'Parts' : 'In Bay'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.windowFooter}>
                  <span>Open Work Orders ({jobs.length})</span>
                  <ChevronRight size={13} />
                </div>
              </Link>

              {/* Window 2: Dispatch & Bays Live Grid */}
              <Link href="/dashboard/dispatch" className={styles.windowCard}>
                <div className={styles.windowTitleBar}>
                  <span className={styles.windowTitle}>
                    <Truck size={14} color="#059669" />
                    Dispatch & Bays
                  </span>
                  <span className={`${styles.windowBadge} ${styles.badgeGreen}`}>
                    {activeBayJobs.length}/6 Bays Active
                  </span>
                </div>
                <div className={styles.windowBody}>
                  {activeBayJobs.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                      All bays available · No active dispatches
                    </div>
                  ) : (
                    activeBayJobs.slice(0, 2).map((b, i) => (
                      <div key={i} className={styles.windowRow}>
                        <div>
                          <div className={styles.windowRowMain}>Bay {i + 1}: {b.unit}</div>
                          <div className={styles.windowRowSub}>Tech: {b.tech || 'Unassigned'}</div>
                        </div>
                        <span className={`${styles.windowPill} ${styles.badgeGreen}`}>
                          {b.status === 'repairing' ? 'In Bay' : 'Active'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.windowFooter}>
                  <span>Open Dispatch Board</span>
                  <ChevronRight size={13} />
                </div>
              </Link>

              {/* Window 3: Floor Labor & Tech Clocks */}
              <Link href="/dashboard/labour" className={styles.windowCard}>
                <div className={styles.windowTitleBar}>
                  <span className={styles.windowTitle}>
                    <Clock size={14} color="#D97706" />
                    Floor Labor Clocks
                  </span>
                  <span className={`${styles.windowBadge} ${styles.badgeOrange}`}>
                    {activeTechsCount} On Floor
                  </span>
                </div>
                <div className={styles.windowBody}>
                  {technicians.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                      No technicians clocked in
                    </div>
                  ) : (
                    technicians.slice(0, 2).map((t, i) => (
                      <div key={i} className={styles.windowRow}>
                        <div>
                          <div className={styles.windowRowMain}>{t.name} ({t.avatar})</div>
                          <div className={styles.windowRowSub}>Job: {t.activeJob}</div>
                        </div>
                        <span className={`${styles.windowPill} ${styles.badgeGreen}`}>{t.status}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.windowFooter}>
                  <span>View Floor Clocks ({technicians.length})</span>
                  <ChevronRight size={13} />
                </div>
              </Link>

              {/* Window 4: Estimates & Approvals */}
              <Link href="/dashboard/estimates" className={styles.windowCard}>
                <div className={styles.windowTitleBar}>
                  <span className={styles.windowTitle}>
                    <FileText size={14} color="#7C3AED" />
                    Estimates & Approvals
                  </span>
                  <span className={`${styles.windowBadge} ${styles.badgePurple}`}>
                    {pendingEstimates.length} Pending
                  </span>
                </div>
                <div className={styles.windowBody}>
                  {pendingEstimates.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                      No pending estimates
                    </div>
                  ) : (
                    pendingEstimates.slice(0, 2).map((est, i) => (
                      <div key={i} className={styles.windowRow}>
                        <div>
                          <div className={styles.windowRowMain}>{est.id} · {est.customer}</div>
                          <div className={styles.windowRowSub}>{est.unit}</div>
                        </div>
                        <span className={`${styles.windowPill} ${styles.badgePurple}`}>{est.billedLabor}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.windowFooter}>
                  <span>View Estimates & Approvals</span>
                  <ChevronRight size={13} />
                </div>
              </Link>

              {/* Window 5: Invoices & Payments */}
              <Link href="/dashboard/invoices" className={styles.windowCard}>
                <div className={styles.windowTitleBar}>
                  <span className={styles.windowTitle}>
                    <CreditCard size={14} color="#2563FF" />
                    Invoices & Payments
                  </span>
                  <span className={`${styles.windowBadge} ${styles.badgeBlue}`}>
                    {unbilledInvoices.length} Unpaid
                  </span>
                </div>
                <div className={styles.windowBody}>
                  {invoices.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                      No invoices recorded
                    </div>
                  ) : (
                    invoices.slice(0, 2).map((inv, i) => (
                      <div key={i} className={styles.windowRow}>
                        <div>
                          <div className={styles.windowRowMain}>{inv.id} · {inv.customer_id || 'Fleet'}</div>
                          <div className={styles.windowRowSub}>Issue: {inv.issue_date || 'Today'}</div>
                        </div>
                        <span className={`${styles.windowPill} ${inv.status === 'paid' ? styles.badgeGreen : styles.badgeBlue}`}>
                          ${(parseFloat(inv.total) || 0).toFixed(2)} CAD
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.windowFooter}>
                  <span>Open Invoices & Collections ({invoices.length})</span>
                  <ChevronRight size={13} />
                </div>
              </Link>

              {/* Window 6: Parts & Inventory Health */}
              <Link href="/dashboard/parts" className={styles.windowCard}>
                <div className={styles.windowTitleBar}>
                  <span className={styles.windowTitle}>
                    <Package size={14} color="#059669" />
                    Parts & Inventory
                  </span>
                  <span className={`${styles.windowBadge} ${lowStockParts.length > 0 ? styles.badgeOrange : styles.badgeGreen}`}>
                    {lowStockParts.length > 0 ? `${lowStockParts.length} Low Stock` : `${parts.length} In Stock`}
                  </span>
                </div>
                <div className={styles.windowBody}>
                  {parts.length === 0 ? (
                    <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.74rem' }}>
                      No inventory parts recorded
                    </div>
                  ) : (
                    parts.slice(0, 2).map((p, i) => (
                      <div key={i} className={styles.windowRow}>
                        <div>
                          <div className={styles.windowRowMain}>{p.part_number || p.partNumber}</div>
                          <div className={styles.windowRowSub}>{p.description?.slice(0, 24)}...</div>
                        </div>
                        <span className={`${styles.windowPill} ${(p.qty_on_hand || p.qtyOnHand || 0) <= (p.min_stock || p.minStock || 5) ? styles.badgeOrange : styles.badgeGreen}`}>
                          Qty: {p.qty_on_hand || p.qtyOnHand || 0}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.windowFooter}>
                  <span>Parts & Inventory ({parts.length})</span>
                  <ChevronRight size={13} />
                </div>
              </Link>
            </div>
          </div>

          {/* 3. Main Command Center Grid: Kanban Board + Right Tech Feed */}
          <div className={styles.mainGrid}>
            {/* Left / Center: Job Command Board */}
            <div className={styles.jobBoardContainer}>
              <div className={styles.boardHeader}>
                <h2 className={styles.sectionTitle}>Active Repair Orders</h2>
                
                {/* Filter Tabs */}
                <div className={styles.filterTabs}>
                  <button
                    onClick={() => setFilter('all')}
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
                  >
                    All Jobs ({jobs.length})
                  </button>
                  <button
                    onClick={() => setFilter('in_progress')}
                    className={`${styles.filterBtn} ${filter === 'in_progress' ? styles.filterBtnActive : ''}`}
                  >
                    In Progress ({jobs.filter(j => j.status === 'repairing' || j.status === 'diagnosing').length})
                  </button>
                  <button
                    onClick={() => setFilter('waiting_parts')}
                    className={`${styles.filterBtn} ${filter === 'waiting_parts' ? styles.filterBtnActive : ''}`}
                  >
                    Waiting Parts ({jobs.filter(j => j.status === 'waiting_parts').length})
                  </button>
                  <button
                    onClick={() => setFilter('ready_invoice')}
                    className={`${styles.filterBtn} ${filter === 'ready_invoice' ? styles.filterBtnActive : ''}`}
                  >
                    Ready to Invoice ({jobs.filter(j => j.status === 'ready_invoice' || j.status === 'ready_to_invoice').length})
                  </button>
                </div>
              </div>

              {/* Job Cards List */}
              <div className={styles.jobCardsList}>
                {filteredJobs.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    No work orders found in this category.
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.id} className={styles.jobCard}>
                      <div className={styles.jobTopRow}>
                        <div className={styles.unitBox}>
                          <span className={styles.jobId}>{job.id}</span>
                          <h3 className={styles.unitName}>{job.unit}</h3>
                        </div>

                        <div className={styles.statusPillGroup}>
                          {(job.status === 'repairing' || job.status === 'diagnosing') && (
                            <span className={styles.statusInProgress}>🔵 In Progress</span>
                          )}
                          {job.status === 'waiting_parts' && (
                            <span className={styles.statusWaiting}>🟠 Waiting Parts</span>
                          )}
                          {(job.status === 'ready_invoice' || job.status === 'ready_to_invoice') && (
                            <span className={styles.statusReady}>🟢 Ready to Invoice</span>
                          )}
                          {job.status === 'new' && (
                            <span className={styles.statusWaiting}>⚪ New</span>
                          )}
                          <span className={styles.marginTag}>
                            Margin: <strong>{job.margin}</strong>
                          </span>
                        </div>
                      </div>

                      <div className={styles.customerRow}>
                        <span className={styles.customerName}>Fleet: {job.customer}</span>
                        <span className={styles.issueText}>{job.issue}</span>
                      </div>

                      <div className={styles.jobFooter}>
                        <div className={styles.techBadge}>
                          <User size={14} />
                          <span>Tech: {job.tech}</span>
                          <span className={styles.timerBadge}>⏱️ {job.timer}</span>
                        </div>

                        <div className={styles.partsBadge}>
                          <Package size={14} />
                          <span>{job.partsStatus}</span>
                        </div>

                        <div className={styles.jobAction}>
                          <span className={styles.laborCost}>Billed: {job.billedLabor}</span>
                          <Link href={`/dashboard/jobs/${job.id}`} className={styles.cardActionBtn} style={{ textDecoration: 'none' }}>
                            View RO <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Technician Floor Feed & Real-Time Profit Stream */}
            <div className={styles.rightFeedCol}>
              {/* Tech Time Clock Feed */}
              <div className={styles.feedCard}>
                <div className={styles.feedHeader}>
                  <h3 className={styles.feedTitle}>Technician Floor Clocks</h3>
                  <span className={styles.feedSubtitle}>{activeTechsCount} Clocked In</span>
                </div>

                <div className={styles.techList}>
                  {technicians.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                      No technicians registered
                    </div>
                  ) : (
                    technicians.map((t, idx) => (
                      <div key={idx} className={styles.techItem}>
                        <div className={styles.techAvatar}>{t.avatar}</div>
                        <div className={styles.techInfo}>
                          <div className={styles.techNameRow}>
                            <span className={styles.techName}>{t.name}</span>
                            <span className={`${styles.techStatus} ${(t.status || '').toLowerCase() === 'active' ? styles.statusActive : (t.status || '').toLowerCase() === 'paused' ? styles.statusPaused : styles.statusDone}`}>
                              {t.status}
                            </span>
                          </div>
                          <div className={styles.techJob}>{t.activeJob}</div>
                          <div className={styles.techTimer}>Clocked: <strong>{t.timer}</strong></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Real-Time Live Shop Activity & Margin Guard */}
              <div className={styles.feedCard}>
                <div className={styles.feedHeader}>
                  <h3 className={styles.feedTitle}>Live Shop Activity</h3>
                  <Link href="/dashboard/reports" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }} title="View Detailed Reports">
                    <ArrowUpRight size={16} className={styles.feedIcon} />
                  </Link>
                </div>

                <div className={styles.alertList}>
                  {liveActivities.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      No recent shop activity
                    </div>
                  ) : (
                    liveActivities.map((act) => (
                      <Link
                        key={act.id}
                        href={act.link}
                        className={styles.alertItem}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', cursor: 'pointer', transition: 'background 0.15s ease' }}
                      >
                        <CheckCircle2 size={16} className={styles.checkAlertIcon} />
                        <div>
                          <div className={styles.alertTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{act.title}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 600 }}>View ↗</span>
                          </div>
                          <div className={styles.alertDesc}>{act.desc}</div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
