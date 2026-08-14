'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Wrench,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  User,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import styles from './dashboard.module.css';

const initialJobs = [
  {
    id: 'TRK-8821',
    unit: '#2019 - Freightliner Cascadia',
    customer: 'Interstate Haulers LLC',
    issue: 'Brake System Overhaul & Rotor Replacement',
    status: 'in_progress',
    tech: 'Sarah L.',
    timer: '02h 45m',
    partsStatus: 'All Parts In Bay',
    partsVariant: 'success',
    margin: '68.4%',
    marginStatus: 'good',
    billedLabor: '$850.00',
    clockedLabor: '2.75 hrs'
  },
  {
    id: 'TRK-8825',
    unit: '#1850 - Kenworth T680',
    customer: 'Midwest Logistics Fleet',
    issue: 'EGR Valve Replacement & Engine Diagnostic',
    status: 'in_progress',
    tech: 'Mike D.',
    timer: '01h 12m',
    partsStatus: 'Delphi Injector Kit Ready',
    partsVariant: 'success',
    margin: '62.1%',
    marginStatus: 'good',
    billedLabor: '$620.00',
    clockedLabor: '1.20 hrs'
  },
  {
    id: 'TRK-8830',
    unit: '#2231 - Volvo VNL 760',
    customer: 'Pacific Express Fleet',
    issue: 'Transmission Fluid Leak & Clutch Inspection',
    status: 'waiting_parts',
    tech: 'Ben M.',
    timer: '03h 05m',
    partsStatus: 'Clutch Kit Pending (ETA 2:30 PM)',
    partsVariant: 'warning',
    margin: '58.0%',
    marginStatus: 'warn',
    billedLabor: '$1,200.00',
    clockedLabor: '3.10 hrs'
  },
  {
    id: 'TRK-8815',
    unit: '#2104 - Western Star 4900',
    customer: 'Heavy Haul Services',
    issue: 'Air Compressor Replacement & Valve Test',
    status: 'ready_invoice',
    tech: 'Alex K.',
    timer: '04h 20m',
    partsStatus: 'Parts Billed & Logged',
    partsVariant: 'success',
    margin: '71.2%',
    marginStatus: 'good',
    billedLabor: '$1,450.00',
    clockedLabor: '4.33 hrs'
  },
  {
    id: 'TRK-8819',
    unit: '#1988 - Peterbilt 579',
    customer: 'Titan Freight Line',
    issue: 'Suspension Air Bag & Bushing Service',
    status: 'ready_invoice',
    tech: 'Sarah L.',
    timer: '01h 50m',
    partsStatus: 'Completed & Verified',
    partsVariant: 'success',
    margin: '65.0%',
    marginStatus: 'good',
    billedLabor: '$540.00',
    clockedLabor: '1.83 hrs'
  }
];

const technicians = [
  { name: 'Sarah L.', role: 'Lead Tech', activeJob: 'Peterbilt 579 (#1988)', status: 'Active', timer: '02h 45m', avatar: 'SL' },
  { name: 'Mike D.', role: 'Diagnostic Specialist', activeJob: 'Kenworth T680 (#1850)', status: 'Active', timer: '01h 12m', avatar: 'MD' },
  { name: 'Ben M.', role: 'Heavy Duty Tech', activeJob: 'Volvo VNL 760 (#2231)', status: 'Paused', timer: '03h 05m', avatar: 'BM' },
  { name: 'Alex K.', role: 'Fleet Specialist', activeJob: 'Western Star (#2104)', status: 'Completed', timer: '04h 20m', avatar: 'AK' },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState('all');
  const [jobs, setJobs] = useState(initialJobs);

  const filteredJobs = filter === 'all'
    ? jobs
    : jobs.filter((j) => j.status === filter);

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

      {/* KPI Metric Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Active Repair Jobs</span>
            <div className={styles.kpiIconWrapper}>
              <Wrench size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>12 <span className={styles.kpiUnit}>Jobs</span></div>
          <div className={styles.kpiMeta}>
            <span className={styles.kpiMetaTag}>4 In Progress</span> · <span>3 Parts Pending</span> · <span>5 Invoice Ready</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Clocked Tech Hours</span>
            <div className={styles.kpiIconWrapper}>
              <Clock size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>42.5 <span className={styles.kpiUnit}>hrs today</span></div>
          <div className={styles.kpiMeta}>
            <span className={styles.greenText}>+12.4%</span> vs. yesterday · 4 Techs Active
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Today's Billed Revenue</span>
            <div className={styles.kpiIconWrapper}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>$4,850<span className={styles.kpiDecimals}>.00</span></div>
          <div className={styles.kpiMeta}>
            <span className={styles.greenText}>+$1,200</span> pending 1-click invoice send
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Est. Gross Profit Margin</span>
            <div className={styles.kpiIconWrapper}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className={styles.kpiValue}>64.2%</div>
          <div className={styles.kpiMeta}>
            <span className={styles.greenText}>Above Target (&gt;60%)</span> · Zero Untracked Leaks
          </div>
        </div>
      </div>

      {/* Main Command Center Grid: Kanban Board + Right Tech Feed */}
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
                In Progress (2)
              </button>
              <button
                onClick={() => setFilter('waiting_parts')}
                className={`${styles.filterBtn} ${filter === 'waiting_parts' ? styles.filterBtnActive : ''}`}
              >
                Waiting Parts (1)
              </button>
              <button
                onClick={() => setFilter('ready_invoice')}
                className={`${styles.filterBtn} ${filter === 'ready_invoice' ? styles.filterBtnActive : ''}`}
              >
                Ready to Invoice (2)
              </button>
            </div>
          </div>

          {/* Job Cards List */}
          <div className={styles.jobCardsList}>
            {filteredJobs.map((job) => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobTopRow}>
                  <div className={styles.unitBox}>
                    <span className={styles.jobId}>{job.id}</span>
                    <h3 className={styles.unitName}>{job.unit}</h3>
                  </div>

                  <div className={styles.statusPillGroup}>
                    {job.status === 'in_progress' && (
                      <span className={styles.statusInProgress}>🔵 In Progress</span>
                    )}
                    {job.status === 'waiting_parts' && (
                      <span className={styles.statusWaiting}>🟠 Waiting Parts</span>
                    )}
                    {job.status === 'ready_invoice' && (
                      <span className={styles.statusReady}>🟢 Ready to Invoice</span>
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
                    <button className={styles.cardActionBtn}>
                      View RO <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Technician Floor Feed & Profit Alerts */}
        <div className={styles.rightFeedCol}>
          {/* Tech Time Clock Feed */}
          <div className={styles.feedCard}>
            <div className={styles.feedHeader}>
              <h3 className={styles.feedTitle}>Technician Floor Clocks</h3>
              <span className={styles.feedSubtitle}>4 Clocked In</span>
            </div>

            <div className={styles.techList}>
              {technicians.map((t, idx) => (
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
              ))}
            </div>
          </div>

          {/* Scanned Receipts & Profit Protection */}
          <div className={styles.feedCard}>
            <div className={styles.feedHeader}>
              <h3 className={styles.feedTitle}>Profit & Parts Protection</h3>
              <ArrowUpRight size={16} className={styles.feedIcon} />
            </div>

            <div className={styles.alertList}>
              <div className={styles.alertItem}>
                <CheckCircle2 size={16} className={styles.checkAlertIcon} />
                <div>
                  <div className={styles.alertTitle}>Parts Invoice Scanned</div>
                  <div className={styles.alertDesc}>Delphi Fuel Injectors ($420.00) logged to Kenworth #1850 with 30% markup.</div>
                </div>
              </div>

              <div className={styles.alertItem}>
                <CheckCircle2 size={16} className={styles.checkAlertIcon} />
                <div>
                  <div className={styles.alertTitle}>Digital Approval Received</div>
                  <div className={styles.alertDesc}>Interstate Haulers approved Brake Overhaul estimate ($1,250.00) via SMS.</div>
                </div>
              </div>

              <div className={styles.alertItem}>
                <CheckCircle2 size={16} className={styles.checkAlertIcon} />
                <div>
                  <div className={styles.alertTitle}>QuickBooks Sync Completed</div>
                  <div className={styles.alertDesc}>3 completed RO invoices synced to QuickBooks Online.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
