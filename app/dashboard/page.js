'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { workOrders, technicians as demoTechs } from '../lib/demoData';
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
  Sparkles
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [filter, setFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const [woRes, techRes] = await Promise.all([
          supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
          supabase.from('technicians').select('*')
        ]);

        let loadedJobs = [];
        if (woRes.data && woRes.data.length > 0) {
          loadedJobs = woRes.data.map(wo => {
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
              tech: wo.tech_name || 'Assigned Mechanic',
              timer: `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`,
              partsStatus,
              partsVariant,
              margin: `${wo.margin || 65}%`,
              marginStatus,
              billedLabor: `$${(parseFloat(wo.estimated_cost) || 850.00).toFixed(2)} CAD`,
              clockedLabor: `${(hours + mins / 60).toFixed(2)} hrs`
            };
          });
        } else {
          // Fallback to rich Canadian Heavy-Duty Demo Data
          loadedJobs = workOrders.map(wo => {
            let partsStatus = 'Parts Ready';
            let partsVariant = 'success';
            if (wo.status === 'waiting_parts') {
              partsStatus = 'Pending Parts';
              partsVariant = 'warning';
            }

            const hours = Math.floor((wo.timer || 0) / 3600);
            const mins = Math.floor(((wo.timer || 0) % 3600) / 60);

            return {
              ...wo,
              unit: wo.unitDisplay,
              customer: wo.customer,
              issue: wo.complaint,
              tech: wo.techName || 'Lead Tech',
              timer: `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`,
              partsStatus,
              partsVariant,
              margin: `${wo.margin || 68}%`,
              marginStatus: (wo.margin || 68) >= 60 ? 'good' : 'warn',
              billedLabor: `$${(wo.estimatedCost || 1250.00).toFixed(2)} CAD`,
              clockedLabor: `${(hours + mins / 60).toFixed(2)} hrs`
            };
          });
        }
        setJobs(loadedJobs);

        // Map technicians
        let loadedTechs = [];
        if (techRes.data && techRes.data.length > 0) {
          loadedTechs = techRes.data.map(t => ({
            ...t,
            activeJob: t.active_job || 'In Bay',
            status: t.status || 'Active',
            timer: `${Math.floor(t.hours_today || 6)}h 30m`,
            avatar: t.avatar || (t.name || 'TC').slice(0, 2).toUpperCase()
          }));
        } else {
          loadedTechs = demoTechs.map(t => ({
            ...t,
            activeJob: t.activeJob || 'In Bay',
            status: t.status === 'active' ? 'Active' : t.status === 'paused' ? 'Paused' : 'Done',
            timer: `${Math.floor(t.hoursToday || 6)}h 15m`,
            avatar: t.avatar || t.name.slice(0, 2).toUpperCase()
          }));
        }
        setTechnicians(loadedTechs);
      } catch (err) {
        console.warn("Using fallback demo dataset for dashboard:", err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter((j) => j.status === filter || (filter === 'in_progress' && (j.status === 'repairing' || j.status === 'diagnosing')));

  const activeJobsCount = jobs.filter(j => !['invoiced', 'paid'].includes(j.status)).length;
  const totalBilled = jobs.reduce((sum, j) => sum + (parseFloat(j.estimated_cost || j.estimatedCost) || 0), 0) || 8420.00;
  const totalClocked = jobs.reduce((sum, j) => sum + ((j.timer_seconds || j.timer || 0) / 3600), 0) || 28.5;
  
  // 6-Module Live Cockpit Snippets
  const cockpitModules = [
    {
      id: 'jobs',
      title: 'Work Orders',
      icon: <Wrench size={16} color="#2563FF" />,
      badge: `${activeJobsCount} Active`,
      badgeClass: styles.badgeBlue,
      desc: `${jobs[0]?.unit || 'Freightliner #2019'} in Bay 1 · 1 Waiting Parts`,
      actionText: 'Open Work Orders',
      href: '/dashboard/jobs'
    },
    {
      id: 'dispatch',
      title: 'Dispatch & Bays',
      icon: <Truck size={16} color="#059669" />,
      badge: '5/6 Bays Occupied',
      badgeClass: styles.badgeGreen,
      desc: 'Bays 1-5 active · Bay 6 staged for emergency roadside breakdown',
      actionText: 'Open Dispatch Board',
      href: '/dashboard/dispatch'
    },
    {
      id: 'labour',
      title: 'Floor Labor & Clocks',
      icon: <Clock size={16} color="#D97706" />,
      badge: `${technicians.filter(t => t.status === 'Active').length || 4} Techs Clocked`,
      badgeClass: styles.badgeOrange,
      desc: `${(totalClocked || 28.5).toFixed(1)}h logged today · Sarah L. leading at 135% efficiency`,
      actionText: 'View Floor Clocks',
      href: '/dashboard/labour'
    },
    {
      id: 'estimates',
      title: 'Estimates & Approvals',
      icon: <FileText size={16} color="#7C3AED" />,
      badge: '2 Pending Signature',
      badgeClass: styles.badgePurple,
      desc: 'Interstate Haulers ($1,250.00 CAD) awaiting digital authorization',
      actionText: 'View Estimates',
      href: '/dashboard/estimates'
    },
    {
      id: 'invoices',
      title: 'Invoices & Payments',
      icon: <CreditCard size={16} color="#2563FF" />,
      badge: '4 Ready to Bill ($8,940)',
      badgeClass: styles.badgeBlue,
      desc: '1 Stripe payment cleared today ($850.00 CAD) · Ready for export',
      actionText: 'Open Invoices',
      href: '/dashboard/invoices'
    },
    {
      id: 'parts',
      title: 'Parts & Core Shield',
      icon: <Package size={16} color="#059669" />,
      badge: '34.2% Avg Markup',
      badgeClass: styles.badgeGreen,
      desc: '2 low-stock filters · $450 CAD in unreturned supplier core refunds',
      actionText: 'Parts Inventory',
      href: '/dashboard/parts'
    }
  ];

  // Dynamic Real Activity Items derived from active jobs
  const liveActivities = [
    {
      id: 1,
      type: 'approval',
      title: 'Digital Customer Approval',
      desc: `${jobs[0]?.customer || 'Interstate Haulers'} authorized ${jobs[0]?.unit || 'Freightliner #2019'} ($${parseFloat(jobs[0]?.estimatedCost || jobs[0]?.estimated_cost || 1250).toFixed(2)} CAD).`,
      link: `/dashboard/jobs/${jobs[0]?.id || 'WO-8821'}`
    },
    {
      id: 2,
      type: 'parts',
      title: 'Parts Markup Shield Active',
      desc: `OEM parts for ${jobs[1]?.unit || 'Kenworth #1850'} logged with target 35% parts margin.`,
      link: '/dashboard/parts'
    },
    {
      id: 3,
      type: 'payment',
      title: 'Stripe & Interac Payment Cleared',
      desc: `Invoice clearance logged for ${jobs[3]?.id || 'WO-8815'} (${jobs[3]?.customer || 'Heavy Haul Services'}).`,
      link: '/dashboard/invoices'
    }
  ];

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
          <span>Live Floor Sync Active</span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading dashboard data...</div>
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
                <span className={styles.greenText}>Active</span> in Shop Bays & Roadside
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Clocked Tech Hours</span>
                <div className={styles.kpiIconWrapper}>
                  <Clock size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{(totalClocked || 28.5).toFixed(1)} <span className={styles.kpiUnit}>hrs today</span></div>
              <div className={styles.kpiMeta}>
                <span className={styles.greenText}>+12.4%</span> vs. yesterday · {technicians.length} Techs Active
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
              <div className={styles.kpiValue}>66.8%</div>
              <div className={styles.kpiMeta}>
                <span className={styles.greenText}>Above Target (&gt;60%)</span>
              </div>
            </div>
          </div>

          {/* 2. 6-Module Live Shop Operations Radar */}
          <div className={styles.cockpitSection}>
            <div className={styles.cockpitHeader}>
              <h3 className={styles.cockpitTitle}>
                <Layers size={17} color="var(--color-primary)" />
                Shop Operations Radar (Live Module Quick Links)
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Click any section to open live workspace
              </span>
            </div>

            <div className={styles.cockpitGrid}>
              {cockpitModules.map((mod) => (
                <Link key={mod.id} href={mod.href} className={styles.cockpitCard}>
                  <div className={styles.cockpitTop}>
                    <span className={styles.cockpitModuleTitle}>
                      {mod.icon}
                      {mod.title}
                    </span>
                    <span className={`${styles.cockpitBadge} ${mod.badgeClass}`}>
                      {mod.badge}
                    </span>
                  </div>
                  <p className={styles.cockpitDesc}>{mod.desc}</p>
                  <div className={styles.cockpitFooter}>
                    <span>{mod.actionText}</span>
                    <ChevronRight size={14} />
                  </div>
                </Link>
              ))}
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
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No jobs found in this category.</div>
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
                  <span className={styles.feedSubtitle}>{technicians.filter(t => t.status === 'Active').length} Clocked In</span>
                </div>

                <div className={styles.techList}>
                  {technicians.length === 0 ? (
                    <div style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No technicians found.</div>
                  ) : (
                    technicians.map((t, idx) => (
                      <div key={idx} className={styles.techItem}>
                        <div className={styles.techAvatar}>{t.avatar}</div>
                        <div className={styles.techInfo}>
                          <div className={styles.techNameRow}>
                            <span className={styles.techName}>{t.name}</span>
                            <span className={`${styles.techStatus} ${t.status === 'Active' ? styles.statusActive : t.status === 'Paused' ? styles.statusPaused : styles.statusDone}`}>
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
                  <h3 className={styles.feedTitle}>Live Activity & Profit Stream</h3>
                  <Link href="/dashboard/reports" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }} title="View Detailed Reports">
                    <ArrowUpRight size={16} className={styles.feedIcon} />
                  </Link>
                </div>

                <div className={styles.alertList}>
                  {liveActivities.map((act) => (
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
                  ))}
                </div>

                {/* Profit & Core Health Bottom Strip */}
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    Parts Markup: <strong style={{ color: '#16A34A' }}>34.2% Avg ✓</strong>
                  </span>
                  <Link href="/dashboard/parts" style={{ color: '#2563FF', fontWeight: 700, textDecoration: 'none' }}>
                    Core Credits: $450 CAD ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
