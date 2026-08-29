'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { workOrders, technicians as demoTechs, customers, invoices } from '../lib/demoData';
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
  ShieldCheck,
  Truck,
  Zap,
  PhoneCall,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  Flame
} from 'lucide-react';
import styles from './dashboard.module.css';

// 6 Physical Shop Bays Configuration
const DEFAULT_BAYS = [
  {
    id: 1,
    bayName: 'Bay 1 — HD Lift',
    type: 'Heavy 4-Post Lift',
    status: 'occupied',
    unit: '#2019 - Freightliner Cascadia',
    jobScope: 'Front Brake Overhaul & Calipers',
    tech: 'Sarah L.',
    timer: '02h 45m',
    progress: 75,
    woId: 'WO-8821'
  },
  {
    id: 2,
    bayName: 'Bay 2 — Diagnostics',
    type: 'Emissions & Drivetrain',
    status: 'occupied',
    unit: '#1850 - Kenworth T680',
    jobScope: 'Cummins X15 EGR Valve Clean',
    tech: 'Mike D.',
    timer: '01h 12m',
    progress: 60,
    woId: 'WO-8825'
  },
  {
    id: 3,
    bayName: 'Bay 3 — Drivetrain',
    type: 'Transmission Pit',
    status: 'waiting',
    unit: '#2231 - Volvo VNL 760',
    jobScope: 'I-Shift Clutch Teardown',
    tech: 'Ben M.',
    timer: '03h 05m',
    progress: 40,
    woId: 'WO-8830'
  },
  {
    id: 4,
    bayName: 'Bay 4 — Air & Brakes',
    type: 'Pneumatics Bay',
    status: 'ready',
    unit: '#2104 - Western Star 4900',
    jobScope: 'Air Compressor & Governor',
    tech: 'Alex K.',
    timer: '04h 20m',
    progress: 100,
    woId: 'WO-8815'
  },
  {
    id: 5,
    bayName: 'Bay 5 — Trailer Bay',
    type: '53ft Reefer Bay',
    status: 'occupied',
    unit: 'TRL-7720 - Great Dane Reefer',
    jobScope: 'Annual DOT & S-Cam Bearings',
    tech: 'Chris R.',
    timer: '00h 45m',
    progress: 25,
    woId: 'WO-8819'
  },
  {
    id: 6,
    bayName: 'Bay 6 — Roadside / Staging',
    type: 'Emergency Inbound',
    status: 'available',
    unit: 'Available for Inbound Dispatch',
    jobScope: 'Staged for Breakdown Dispatch',
    tech: 'Unassigned',
    timer: '00h 00m',
    progress: 0,
    woId: null
  }
];

export default function DashboardPage() {
  const [filter, setFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [techs, setTechs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [woRes, techRes] = await Promise.all([
          supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
          supabase.from('technicians').select('*')
        ]);

        let loadedJobs = [];
        if (woRes.data && woRes.data.length > 0) {
          loadedJobs = woRes.data.map(wo => {
            const hours = Math.floor((wo.timer || 0) / 3600);
            const mins = Math.floor(((wo.timer || 0) % 3600) / 60);
            return {
              id: wo.id,
              unit: wo.unit_display || 'Commercial Fleet Unit',
              customer: wo.customer_name || 'Fleet Customer',
              issue: wo.complaint || 'Heavy Duty Mechanical Service',
              tech: wo.tech_name || 'Assigned Mechanic',
              status: wo.status || 'diagnosing',
              timer: `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`,
              billedLabor: `$${(parseFloat(wo.estimated_cost) || 850.00).toFixed(2)} CAD`,
              margin: `${wo.margin || 68}%`,
              marginStatus: (wo.margin || 68) >= 60 ? 'good' : 'warn'
            };
          });
        } else {
          // Rich Canadian Heavy Duty Demo Data Fallback
          loadedJobs = workOrders.map(wo => {
            const hours = Math.floor((wo.timer || 0) / 3600);
            const mins = Math.floor(((wo.timer || 0) % 3600) / 60);
            return {
              id: wo.id,
              unit: wo.unitDisplay,
              customer: wo.customer,
              issue: wo.complaint,
              tech: wo.techName || 'Lead Tech',
              status: wo.status,
              timer: `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`,
              billedLabor: `$${(wo.estimatedCost || 1250.00).toFixed(2)} CAD`,
              margin: `${wo.margin || 65}%`,
              marginStatus: (wo.margin || 65) >= 60 ? 'good' : 'warn'
            };
          });
        }
        setJobs(loadedJobs);

        let loadedTechs = [];
        if (techRes.data && techRes.data.length > 0) {
          loadedTechs = techRes.data.map(t => ({
            id: t.id,
            name: t.name || 'Technician',
            role: t.role || 'Journeyman Heavy-Duty Tech',
            avatar: t.avatar || (t.name || 'TC').slice(0, 2).toUpperCase(),
            hoursToday: t.hours_today || 6.5,
            efficiency: t.efficiency || 128,
            activeJob: t.active_job || 'In Bay',
            status: t.status || 'Active'
          }));
        } else {
          loadedTechs = demoTechs.map(t => ({
            id: t.id,
            name: t.name,
            role: t.role,
            avatar: t.avatar,
            hoursToday: t.hoursToday || 6.2,
            efficiency: t.stats?.efficiency || 125,
            activeJob: t.activeJob || 'Available',
            status: t.status === 'active' ? 'Active' : t.status === 'paused' ? 'Paused' : 'Off'
          }));
        }
        setTechs(loadedTechs);
      } catch (err) {
        console.warn('Dashboard data fallback active:', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const filteredJobs = filter === 'all'
    ? jobs
    : filter === 'in_progress'
      ? jobs.filter(j => ['repairing', 'diagnosing', 'new'].includes(j.status))
      : filter === 'waiting_parts'
        ? jobs.filter(j => j.status === 'waiting_parts')
        : jobs.filter(j => ['ready_invoice', 'ready_to_invoice', 'completed', 'invoiced', 'paid'].includes(j.status));

  // Key Calculations
  const activeJobsCount = jobs.filter(j => !['invoiced', 'paid'].includes(j.status)).length || 5;
  const occupiedBaysCount = DEFAULT_BAYS.filter(b => b.status === 'occupied' || b.status === 'waiting' || b.status === 'ready').length;
  const bayCapacityPercent = Math.round((occupiedBaysCount / DEFAULT_BAYS.length) * 100);

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Header & Fast Command Bar */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className={styles.pageTitle}>Shop Live Command Center</h1>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              {occupiedBaysCount}/6 Bays Active
            </span>
          </div>
          <p className={styles.pageSubtitle}>
            Live Class 8 fleet repairs, journeyman technician efficiency, and margin protection.
          </p>
        </div>

        <div className={styles.quickActionBar}>
          <Link href="/dashboard/jobs/new" className={styles.fastBtnPrimary}>
            <Plus size={15} /> New Work Order (Fast RO)
          </Link>
          <Link href="/dashboard/dispatch" className={styles.fastBtnEmergency}>
            <Flame size={15} /> Emergency Roadside
          </Link>
          <Link href="/dashboard/estimates" className={styles.fastBtnOutline}>
            <Sparkles size={14} /> Fast Estimate
          </Link>
          <Link href="/dashboard/invoices" className={styles.fastBtnOutline}>
            <FileText size={14} /> Invoices & Collections
          </Link>
        </div>
      </div>

      {/* 2. Top 4 High-Density Efficiency KPIs */}
      <div className={styles.kpiGrid}>
        {/* KPI 1: Bay Occupancy */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Bay Capacity</span>
            <div className={styles.kpiIconBox} style={{ background: '#EFF6FF', color: '#2563FF' }}>
              <Layers size={17} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiBigNumber}>{bayCapacityPercent}%</span>
            <span className={styles.kpiUnit}>({occupiedBaysCount}/6 Bays)</span>
          </div>
          <div className={styles.kpiFooter}>
            <span className={styles.trendBadgeNeutral}>5 Occupied</span>
            <span>1 Staging Ready</span>
          </div>
        </div>

        {/* KPI 2: Effective Labor Rate */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Effective Labor Rate (ELR)</span>
            <div className={styles.kpiIconBox} style={{ background: '#ECFDF5', color: '#059669' }}>
              <DollarSign size={17} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiBigNumber}>$154.20</span>
            <span className={styles.kpiUnit}>CAD / hr</span>
          </div>
          <div className={styles.kpiFooter}>
            <span className={styles.trendBadgePositive}>+6.3%</span>
            <span>vs. $145.00 Base Target</span>
          </div>
        </div>

        {/* KPI 3: Billed vs Clocked Labor Hours */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Billed vs Clocked Hours</span>
            <div className={styles.kpiIconBox} style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Clock size={17} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiBigNumber}>32.5h</span>
            <span className={styles.kpiUnit}>billed / 24.0h clocked</span>
          </div>
          <div className={styles.kpiFooter}>
            <span className={styles.trendBadgePositive}>135.4%</span>
            <span>Floor Labor Efficiency</span>
          </div>
        </div>

        {/* KPI 4: WIP & Unbilled Revenue */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Unbilled WIP Value</span>
            <div className={styles.kpiIconBox} style={{ background: '#EDE9FE', color: '#7C3AED' }}>
              <TrendingUp size={17} />
            </div>
          </div>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiBigNumber}>$8,940</span>
            <span className={styles.kpiUnit}>CAD</span>
          </div>
          <div className={styles.kpiFooter}>
            <span className={styles.trendBadgeNeutral}>4 ROs</span>
            <span>Ready for 1-Click Invoicing</span>
          </div>
        </div>
      </div>

      {/* 3. 🚨 REAL-TIME SHOP FLOOR BOTTLENECK RADAR */}
      <div className={styles.bottleneckSection}>
        <div className={styles.bottleneckHeader}>
          <h2 className={styles.bottleneckTitle}>
            <AlertTriangle size={17} />
            Live Operational Bottleneck Radar
          </h2>
          <span className={styles.bottleneckCountBadge}>3 Requiring Action</span>
        </div>

        <div className={styles.bottleneckGrid}>
          {/* Bottleneck 1: Customer Approval Pending */}
          <div className={styles.bottleneckCard}>
            <div className={styles.bottleneckCardTop}>
              <span className={`${styles.bottleneckType} ${styles.typeApproval}`}>⏳ Approval Hold</span>
              <span className={styles.bottleneckTime}>Sent 3.5h ago</span>
            </div>
            <div>
              <h4 className={styles.bottleneckUnit}>Unit #104 — 2022 Freightliner</h4>
              <p className={styles.bottleneckDesc}>
                Interstate Haulers LLC · DEF Doser & Forced Regen ($850.00 CAD). Tech Sarah L. staged.
              </p>
            </div>
            <div className={styles.bottleneckActions}>
              <span className={styles.bottleneckValue}>$850.00 CAD</span>
              <Link href="/portal/WO-8821" className={styles.btnActionSmall}>
                ⚡ View & Resend SMS
              </Link>
            </div>
          </div>

          {/* Bottleneck 2: Critical Parts Delivery Delay */}
          <div className={styles.bottleneckCard}>
            <div className={styles.bottleneckCardTop}>
              <span className={`${styles.bottleneckType} ${styles.typeParts}`}>📦 Parts Delayed</span>
              <span className={styles.bottleneckTime}>ETA 2:30 PM Today</span>
            </div>
            <div>
              <h4 className={styles.bottleneckUnit}>Unit #1850 — Kenworth T680</h4>
              <p className={styles.bottleneckDesc}>
                Midwest Logistics · Cummins X15 EGR Valve (FleetPride PO #99148). Tech Mike D. paused.
              </p>
            </div>
            <div className={styles.bottleneckActions}>
              <span className={styles.bottleneckValue}>PO: $420.00</span>
              <Link href="/dashboard/parts" className={styles.btnActionSmall}>
                📦 Supplier Status
              </Link>
            </div>
          </div>

          {/* Bottleneck 3: Promised Delivery Risk */}
          <div className={styles.bottleneckCard}>
            <div className={styles.bottleneckCardTop}>
              <span className={`${styles.bottleneckType} ${styles.typeRisk}`}>⚠️ Promise Time Risk</span>
              <span className={styles.bottleneckTime}>Due 4:30 PM Today</span>
            </div>
            <div>
              <h4 className={styles.bottleneckUnit}>Unit #2104 — Western Star</h4>
              <p className={styles.bottleneckDesc}>
                Heavy Haul Services · Air Compressor Assembly. 1.2h test remaining before customer pickup.
              </p>
            </div>
            <div className={styles.bottleneckActions}>
              <span className={styles.bottleneckValue}>$1,640.00 CAD</span>
              <Link href="/dashboard/jobs/WO-8815" className={styles.btnActionSmall}>
                👨‍🔧 Assign 2nd Tech
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 🏢 VISUAL BAY OCCUPANCY MATRIX (BAYS 1–6) */}
      <div className={styles.baySection}>
        <div className={styles.bayHeader}>
          <h3 className={styles.baySectionTitle}>
            <Truck size={17} />
            Live Physical Bay Occupancy (Bays 1–6)
          </h3>
          <span className={styles.bayStatusSummary}>
            5 Occupied · 1 Available · Click any bay to view repair order
          </span>
        </div>

        <div className={styles.bayGrid}>
          {DEFAULT_BAYS.map((bay) => (
            <Link
              key={bay.id}
              href={bay.woId ? `/dashboard/jobs/${bay.woId}` : '/dashboard/jobs/new'}
              className={`${styles.bayCard} ${
                bay.status === 'occupied'
                  ? styles.bayOccupied
                  : bay.status === 'waiting'
                    ? styles.bayWaiting
                    : bay.status === 'ready'
                      ? styles.bayReady
                      : styles.bayAvailable
              }`}
              style={{ textDecoration: 'none' }}
            >
              {bay.status !== 'available' ? (
                <>
                  <div className={styles.bayTopRow}>
                    <span className={styles.bayNum}>{bay.bayName.split('—')[0]}</span>
                    <span
                      className={`${styles.bayPill} ${
                        bay.status === 'occupied'
                          ? styles.bayPillActive
                          : bay.status === 'waiting'
                            ? styles.bayPillWait
                            : styles.bayPillReady
                      }`}
                    >
                      {bay.status === 'occupied' ? 'In Bay' : bay.status === 'waiting' ? 'Waiting Parts' : 'Ready to Clear'}
                    </span>
                  </div>
                  <div>
                    <h5 className={styles.bayUnitName}>{bay.unit}</h5>
                    <p className={styles.bayJobScope}>{bay.jobScope}</p>
                  </div>
                  <div className={styles.bayFooter}>
                    <span className={styles.bayTech}>{bay.tech}</span>
                    <span>⏱️ {bay.timer}</span>
                  </div>
                </>
              ) : (
                <div style={{ padding: '10px 0' }}>
                  <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>➕</div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    Bay 6 Available
                  </span>
                  <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    Click to Assign Inbound RO
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* 5. MAIN SPLIT GRID (Active Repair Orders + Floor Intelligence) */}
      <div className={styles.mainSplitGrid}>
        {/* Left Column: Active Repair Orders Stream */}
        <div className={styles.roSection}>
          <div className={styles.roSectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Active Repair Orders</h3>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
              <button
                onClick={() => setFilter('all')}
                className={`${styles.tabBtn} ${filter === 'all' ? styles.tabBtnActive : ''}`}
              >
                All ({jobs.length})
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`${styles.tabBtn} ${filter === 'in_progress' ? styles.tabBtnActive : ''}`}
              >
                Active Bays ({jobs.filter(j => ['repairing', 'diagnosing', 'new'].includes(j.status)).length})
              </button>
              <button
                onClick={() => setFilter('waiting_parts')}
                className={`${styles.tabBtn} ${filter === 'waiting_parts' ? styles.tabBtnActive : ''}`}
              >
                Waiting Parts ({jobs.filter(j => j.status === 'waiting_parts').length})
              </button>
              <button
                onClick={() => setFilter('ready_invoice')}
                className={`${styles.tabBtn} ${filter === 'ready_invoice' ? styles.tabBtnActive : ''}`}
              >
                Ready to Invoice ({jobs.filter(j => ['ready_invoice', 'ready_to_invoice', 'completed', 'invoiced', 'paid'].includes(j.status)).length})
              </button>
            </div>
          </div>

          {/* Job Stream */}
          <div className={styles.roList}>
            {filteredJobs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No repair orders matching this status filter.
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div key={job.id} className={styles.roCard}>
                  <div className={styles.roTopRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.roId}>{job.id}</span>
                      <h4 className={styles.roUnitTitle}>{job.unit}</h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className={`${styles.roMarginPill} ${
                          job.marginStatus === 'good' ? styles.marginGood : styles.marginWarn
                        }`}
                      >
                        Margin: {job.margin}
                      </span>
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="btn btn-outline"
                        style={{ fontSize: '0.72rem', padding: '4px 10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        View RO <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.roCustomer}>Fleet Account: <strong>{job.customer}</strong></span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Status: <strong style={{ color: 'var(--color-text)' }}>{job.status.replace('_', ' ').toUpperCase()}</strong>
                    </span>
                  </div>

                  <p className={styles.roComplaint}>
                    <strong>Scope:</strong> {job.issue}
                  </p>

                  <div className={styles.roMetaRow}>
                    <div className={styles.roTechTimer}>
                      <span>👨‍🔧 <strong>{job.tech}</strong></span>
                      <span>·</span>
                      <span>⏱️ Clocked: <strong>{job.timer}</strong></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>Billed Amount: <strong className={styles.roBilledAmount}>{job.billedLabor}</strong></span>
                      <Link href={`/portal/${job.id}`} target="_blank" style={{ fontSize: '0.72rem', color: '#2563FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                        Customer Link <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Floor Intelligence & Tech Feed */}
        <div className={styles.rightIntelligenceCol}>
          {/* Tech Productivity Leaderboard */}
          <div className={styles.intelCard}>
            <div className={styles.intelHeader}>
              <h4 className={styles.intelTitle}>
                <User size={15} color="var(--color-primary)" />
                Journeyman Tech Floor Feed
              </h4>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                {techs.filter(t => t.status === 'Active').length} Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {techs.slice(0, 4).map((tech) => (
                <div key={tech.id} className={styles.techRankItem}>
                  <div className={styles.techLeft}>
                    <div className={styles.techAvatarMini}>{tech.avatar}</div>
                    <div>
                      <div className={styles.techNameSmall}>{tech.name}</div>
                      <div className={styles.techRoleSmall}>{tech.activeJob}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={styles.techEfficiency}>{tech.efficiency}% eff</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{tech.hoursToday}h logged</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parts Markup & Core Shield */}
          <div className={styles.intelCard}>
            <div className={styles.intelHeader}>
              <h4 className={styles.intelTitle}>
                <ShieldCheck size={15} color="#10B981" />
                Profit & Core Shield
              </h4>
              <Link href="/dashboard/parts" style={{ fontSize: '0.72rem', color: '#2563FF', fontWeight: 700, textDecoration: 'none' }}>
                Manage Parts ↗
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className={styles.profitShieldItem}>
                <div>
                  <strong style={{ color: 'var(--color-text)' }}>Avg. Parts Markup Health</strong>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>Target: 35.0% Across Heavy Duty POs</div>
                </div>
                <span style={{ fontWeight: 800, color: '#10B981', fontSize: '0.85rem' }}>34.8% ✓</span>
              </div>

              <div className={styles.profitShieldItem} style={{ borderLeft: '3px solid #F59E0B' }}>
                <div>
                  <strong style={{ color: '#B45309' }}>Unreturned Core Deposits</strong>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>3 Turbos & Alternators to Return</div>
                </div>
                <span style={{ fontWeight: 800, color: '#B45309', fontSize: '0.85rem' }}>$450 CAD</span>
              </div>

              <div className={styles.profitShieldItem} style={{ borderLeft: '3px solid #2563FF' }}>
                <div>
                  <strong style={{ color: '#1E40AF' }}>Invoicing Readiness</strong>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>2 Approved Orders Ready to Bill</div>
                </div>
                <span style={{ fontWeight: 800, color: '#1E40AF', fontSize: '0.85rem' }}>$3,290 CAD</span>
              </div>
            </div>
          </div>

          {/* Canadian Fleet Support Contact Strip */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text)' }}>Commercial Dispatch Hotline</span>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>24/7 Heavy Towing & Roadside</div>
            </div>
            <a href="tel:4035550199" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563FF', textDecoration: 'none', background: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              📞 (403) 555-0199
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
