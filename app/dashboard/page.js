'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const [filter, setFilter] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        const [woRes, techRes] = await Promise.all([
          supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
          supabase.from('technicians').select('*')
        ]);

        if (woRes.error) throw woRes.error;
        if (techRes.error) throw techRes.error;

        // Map work orders to match the UI
        const mappedJobs = (woRes.data || []).map(wo => {
          let partsStatus = 'Parts Ready';
          let partsVariant = 'success';
          if (wo.status === 'waiting_parts') {
            partsStatus = 'Pending Parts';
            partsVariant = 'warning';
          }

          let marginStatus = 'good';
          if (wo.margin < 60) marginStatus = 'warn';

          // Timer is in seconds
          const hours = Math.floor((wo.timer || 0) / 3600);
          const mins = Math.floor(((wo.timer || 0) % 3600) / 60);

          return {
            ...wo,
            unit: wo.unit_display,
            customer: wo.customer_name,
            issue: wo.complaint,
            tech: wo.tech_name || 'Unassigned',
            timer: `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`,
            partsStatus,
            partsVariant,
            margin: `${wo.margin || 0}%`,
            marginStatus,
            billedLabor: `$${(wo.estimated_cost || 0).toFixed(2)}`,
            clockedLabor: `${(hours + mins / 60).toFixed(2)} hrs`
          };
        });

        setJobs(mappedJobs);

        // Map technicians
        const mappedTechs = (techRes.data || []).map(t => ({
          ...t,
          activeJob: t.active_job || 'Available',
          status: t.status || 'Active',
          timer: `${Math.floor((t.hours_today || 0))}h 00m`,
          avatar: t.avatar || t.name.slice(0, 2).toUpperCase()
        }));
        
        setTechnicians(mappedTechs);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || 'Failed to fetch data from Supabase');
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
  const totalBilled = jobs.reduce((sum, j) => sum + Number(j.estimated_cost || 0), 0);
  const totalClocked = jobs.reduce((sum, j) => sum + ((j.timer || 0) / 3600), 0);
  
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
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard data from Supabase...</div>
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}><strong>Error:</strong> {error}</div>
      ) : (
        <>
          {/* KPI Metric Cards */}
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
                <span className={styles.kpiMetaTag}>Live via Supabase</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiLabel}>Clocked Tech Hours</span>
                <div className={styles.kpiIconWrapper}>
                  <Clock size={18} />
                </div>
              </div>
              <div className={styles.kpiValue}>{(totalClocked || 0).toFixed(1)} <span className={styles.kpiUnit}>hrs today</span></div>
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
              <div className={styles.kpiValue}>${Math.floor(totalBilled).toLocaleString()}<span className={styles.kpiDecimals}>.{(totalBilled % 1).toFixed(2).substring(2)}</span></div>
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
              <div className={styles.kpiValue}>64.2%</div>
              <div className={styles.kpiMeta}>
                <span className={styles.greenText}>Above Target (&gt;60%)</span>
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
                          <button className={styles.cardActionBtn}>
                            View RO <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Technician Floor Feed & Profit Alerts */}
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
        </>
      )}
    </div>
  );
}
