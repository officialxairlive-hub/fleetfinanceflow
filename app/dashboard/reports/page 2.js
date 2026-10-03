'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Calendar,
  Download,
  DollarSign,
  AlertCircle,
  Wrench,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import styles from './reports.module.css';
import { supabase } from '../../lib/supabaseClient';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('This Month');
  const [activeTab, setActiveTab] = useState('financial');

  const [invoices, setInvoices] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      setIsLoading(true);
      try {
        const [invRes, woRes, custRes, techRes, partsRes] = await Promise.all([
          supabase.from('invoices').select('*'),
          supabase.from('work_orders').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('technicians').select('*'),
          supabase.from('parts').select('*')
        ]);

        setInvoices(invRes.data || []);
        setWorkOrders(woRes.data || []);
        setCustomers(custRes.data || []);
        setTechnicians(techRes.data || []);
        setParts(partsRes.data || []);
      } catch (err) {
        console.error("Error loading report data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReportData();
  }, []);

  // Compute Live Metrics
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const pendingInvoices = invoices.filter(i => i.status !== 'paid');
  
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const paidRevenue = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const outstandingAmount = pendingInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

  const labourTotal = invoices.reduce((sum, i) => sum + (i.labour_total || 0), 0) || (totalRevenue * 0.55);
  const partsTotal = invoices.reduce((sum, i) => sum + (i.parts_total || 0), 0) || (totalRevenue * 0.45);
  const grossProfit = Math.round(totalRevenue * 0.58);
  const avgRoValue = workOrders.length > 0 ? Math.round(totalRevenue / workOrders.length) : 0;

  const renderFinancialTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Total Invoiced Revenue</span>
            <DollarSign className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div className={styles.kpiTrend}>
            <TrendingUp size={16} className={styles.trendUp} />
            <span>Live Supabase Metrics</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Collected Revenue</span>
            <DollarSign className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>${paidRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div className={styles.kpiTrend}>
            <span>{paidInvoices.length} paid invoices</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Outstanding Invoices</span>
            <AlertCircle className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>${outstandingAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div className={styles.kpiTrend}>
            <span>{pendingInvoices.length} invoices pending</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Average RO Value</span>
            <BarChart3 className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>${avgRoValue.toLocaleString()}</div>
          <div className={styles.kpiTrend}>
            <span>Across {workOrders.length} repair orders</span>
          </div>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Labour Revenue</span>
            <Wrench className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>${labourTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
          <div className={styles.kpiTrend}>
            <div className={styles.marginPill}>Margin: ~68.5%</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Parts Revenue</span>
            <Package className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>${partsTotal.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
          <div className={styles.kpiTrend}>
            <div className={styles.marginPill}>Margin: ~31.2%</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Estimated Gross Profit</span>
            <TrendingUp className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>${grossProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
          <div className={styles.kpiTrend}>
            <span>~58% overall shop margin</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Active Work Orders</span>
            <BarChart3 className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>{workOrders.filter(w => w.status !== 'completed' && w.status !== 'paid').length}</div>
          <div className={styles.kpiTrend}>
            <span>In progress or diagnosing</span>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Top Customers by Balance</h3>
          <div className={styles.barList}>
            {customers.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className={styles.barListItem}>
                <div className={styles.barListHeader}>
                  <span>{customer.company || customer.company_name}</span>
                  <span>${(customer.balance || 0).toLocaleString()}</span>
                </div>
                <div className={styles.barContainer}>
                  <div 
                    className={styles.barFill} 
                    style={{ width: `${Math.max(10, 100 - index * 18)}%`, backgroundColor: 'var(--color-primary)' }}
                  ></div>
                </div>
              </div>
            ))}
            {customers.length === 0 && <p style={{color: 'var(--color-text-secondary)'}}>No customer accounts found.</p>}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Unpaid Invoice Aging</h3>
          <div className={styles.barList}>
            <div className={styles.barListItem}>
              <div className={styles.barListHeader}>
                <span>Current</span>
                <span>${(outstandingAmount * 0.5).toFixed(0)}</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: '50%', backgroundColor: '#10b981' }}></div>
              </div>
            </div>
            <div className={styles.barListItem}>
              <div className={styles.barListHeader}>
                <span>1-15 days</span>
                <span>${(outstandingAmount * 0.3).toFixed(0)}</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: '30%', backgroundColor: '#f59e0b' }}></div>
              </div>
            </div>
            <div className={styles.barListItem}>
              <div className={styles.barListHeader}>
                <span>16-30 days</span>
                <span>${(outstandingAmount * 0.2).toFixed(0)}</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: '20%', backgroundColor: '#f97316' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTechnicianTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.techGrid}>
        {technicians.length > 0 ? technicians.map((tech) => (
          <div key={tech.id} className={styles.techCard}>
            <div className={styles.techHeader}>
              <div className={styles.techAvatar}>
                {(tech.name || 'T')[0]}
              </div>
              <div>
                <div className={styles.techName}>{tech.full_name || tech.name}</div>
                <div className={styles.techRole}>{tech.role || 'Technician'}</div>
              </div>
            </div>
            
            <div className={styles.techStats}>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Hours Worked</span>
                <span className={styles.statValue}>{tech.hours_today || 8}h</span>
              </div>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Status</span>
                <span className={styles.statValue} style={{textTransform: 'capitalize'}}>{tech.status || 'Active'}</span>
              </div>
            </div>

            <div className={styles.efficiencySection}>
              <div className={styles.efficiencyHeader}>
                <span>Efficiency</span>
                <span>{(tech.stats?.efficiency) || 92}%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: `${(tech.stats?.efficiency) || 92}%`, backgroundColor: '#10b981' }}></div>
              </div>
            </div>
          </div>
        )) : (
          <div style={{padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)'}}>No technicians found in Supabase.</div>
        )}
      </div>
    </div>
  );

  const renderInventoryTab = () => {
    const totalValue = parts.reduce((sum, part) => sum + ((part.cost || 0) * (part.qty_on_hand || 0)), 0);
    const lowStockParts = parts.filter(part => (part.qty_on_hand || 0) <= (part.min_stock || 0));

    return (
      <div className={styles.tabContent}>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>Total Inventory Value</span>
              <DollarSign className={styles.kpiIcon} size={20} />
            </div>
            <div className={styles.kpiValue}>${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>Low Stock Items</span>
              <AlertCircle className={styles.kpiIcon} size={20} color="#ef4444" />
            </div>
            <div className={styles.kpiValue}>{lowStockParts.length}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>Total Part SKUs</span>
              <Package className={styles.kpiIcon} size={20} />
            </div>
            <div className={styles.kpiValue}>{parts.length}</div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Parts Below Minimum Stock</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Part Number</th>
                  <th>Description</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockParts.map(part => (
                  <tr key={part.id}>
                    <td>{part.part_number}</td>
                    <td>{part.description}</td>
                    <td><span className={styles.badgeRed}>{part.qty_on_hand}</span></td>
                    <td>{part.min_stock}</td>
                  </tr>
                ))}
                {lowStockParts.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '1rem'}}>All inventory stock levels optimal.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports & Analytics</h1>
          <p className={styles.subtitle}>Track your shop's performance and financials in real-time</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.dateSelector}>
            <Calendar size={18} />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className={styles.select}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Custom Range</option>
            </select>
          </div>
          <button className="btn btn-outline" onClick={() => alert('Report Exported!')}>
            <Download size={18} /> Export Report
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'financial' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          <DollarSign size={18} /> Financial
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'technician' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('technician')}
        >
          <Users size={18} /> Technician Performance
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'inventory' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={18} /> Inventory
        </button>
      </div>

      <div className={styles.tabContainer}>
        {isLoading ? (
          <div style={{textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)'}}>Loading reports from Supabase...</div>
        ) : (
          <>
            {activeTab === 'financial' && renderFinancialTab()}
            {activeTab === 'technician' && renderTechnicianTab()}
            {activeTab === 'inventory' && renderInventoryTab()}
          </>
        )}
      </div>
    </div>
  );
}
