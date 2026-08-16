'use client';

import React, { useState } from 'react';
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
import {
  workOrders,
  invoices,
  technicians,
  partsInventory,
  customers,
  calculateWOTotal
} from '../../lib/demoData';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('This Month');
  const [activeTab, setActiveTab] = useState('financial');

  const renderFinancialTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Revenue Today</span>
            <DollarSign className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>$4,850</div>
          <div className={styles.kpiTrend}>
            <TrendingUp size={16} className={styles.trendUp} />
            <span>+12% vs last week</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Revenue This Month</span>
            <DollarSign className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>$38,420</div>
          <div className={styles.kpiTrend}>
            <TrendingUp size={16} className={styles.trendUp} />
            <span>+8% vs last month</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Outstanding Invoices</span>
            <AlertCircle className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>$3,470</div>
          <div className={styles.kpiTrend}>
            <span>4 invoices pending</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Paid Invoices</span>
            <CheckCircleIcon size={20} className={styles.kpiIcon} />
          </div>
          <div className={styles.kpiValue}>$12,840</div>
          <div className={styles.kpiTrend}>
            <span>This week</span>
          </div>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Labour Revenue</span>
            <Wrench className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>$18,200</div>
          <div className={styles.kpiTrend}>
            <div className={styles.marginPill}>Margin: 68.5%</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Parts Revenue</span>
            <Package className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>$14,800</div>
          <div className={styles.kpiTrend}>
            <div className={styles.marginPill}>Margin: 31.2%</div>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Gross Profit</span>
            <TrendingUp className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>$21,450</div>
          <div className={styles.kpiTrend}>
            <span>55.8% overall</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiTitle}>Average RO Value</span>
            <BarChart3 className={styles.kpiIcon} size={20} />
          </div>
          <div className={styles.kpiValue}>$1,285</div>
          <div className={styles.kpiTrend}>
            <TrendingUp size={16} className={styles.trendUp} />
            <span>+4% vs last month</span>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Top 5 Customers by Revenue</h3>
          <div className={styles.barList}>
            {customers.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className={styles.barListItem}>
                <div className={styles.barListHeader}>
                  <span>{customer.name}</span>
                  <span>${(20000 - index * 3000).toLocaleString()}</span>
                </div>
                <div className={styles.barContainer}>
                  <div 
                    className={styles.barFill} 
                    style={{ width: `${100 - index * 15}%`, backgroundColor: 'var(--color-primary)' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Unpaid Invoice Aging</h3>
          <div className={styles.barList}>
            <div className={styles.barListItem}>
              <div className={styles.barListHeader}>
                <span>Current</span>
                <span>$1,200</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: '60%', backgroundColor: '#10b981' }}></div>
              </div>
            </div>
            <div className={styles.barListItem}>
              <div className={styles.barListHeader}>
                <span>1-15 days</span>
                <span>$850</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: '40%', backgroundColor: '#f59e0b' }}></div>
              </div>
            </div>
            <div className={styles.barListItem}>
              <div className={styles.barListHeader}>
                <span>16-30 days</span>
                <span>$420</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: '20%', backgroundColor: '#f97316' }}></div>
              </div>
            </div>
            <div className={styles.barListItem}>
              <div className={styles.barListHeader}>
                <span>31-60 days</span>
                <span>$1,000</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: '50%', backgroundColor: '#ef4444' }}></div>
              </div>
            </div>
            <div className={styles.barListItem}>
              <div className={styles.barListHeader}>
                <span>60+ days</span>
                <span>$0</span>
              </div>
              <div className={styles.barContainer}>
                <div className={styles.barFill} style={{ width: '0%', backgroundColor: '#dc2626' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTechnicianTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.techRankings}>
        <div className={styles.rankingCard}>
          <div className={styles.rankingIcon}><TrendingUp size={24} color="#10b981" /></div>
          <div className={styles.rankingInfo}>
            <span className={styles.rankingLabel}>Top Efficiency</span>
            <span className={styles.rankingValue}>Mike R. (92%)</span>
          </div>
        </div>
        <div className={styles.rankingCard}>
          <div className={styles.rankingIcon}><DollarSign size={24} color="#3b82f6" /></div>
          <div className={styles.rankingInfo}>
            <span className={styles.rankingLabel}>Top Revenue</span>
            <span className={styles.rankingValue}>Sarah C. ($8,400)</span>
          </div>
        </div>
        <div className={styles.rankingCard}>
          <div className={styles.rankingIcon}><Wrench size={24} color="#8b5cf6" /></div>
          <div className={styles.rankingInfo}>
            <span className={styles.rankingLabel}>Most Jobs Completed</span>
            <span className={styles.rankingValue}>David W. (14)</span>
          </div>
        </div>
      </div>

      <div className={styles.techGrid}>
        {technicians.map((tech) => (
          <div key={tech.id} className={styles.techCard}>
            <div className={styles.techHeader}>
              <div className={styles.techAvatar}>
                {tech.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className={styles.techName}>{tech.name}</div>
                <div className={styles.techRole}>{tech.role}</div>
              </div>
            </div>
            
            <div className={styles.techStats}>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Hours Worked</span>
                <span className={styles.statValue}>40h</span>
              </div>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Billable Hours</span>
                <span className={styles.statValue}>36h</span>
              </div>
            </div>

            <div className={styles.efficiencySection}>
              <div className={styles.efficiencyHeader}>
                <span>Efficiency</span>
                <span>90%</span>
              </div>
              <div className={styles.progressBarBg}>
                <div className={styles.progressBarFill} style={{ width: '90%', backgroundColor: '#10b981' }}></div>
              </div>
            </div>

            <div className={styles.techStatsSecondary}>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Jobs Completed</span>
                <span className={styles.statValue}>12</span>
              </div>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Revenue</span>
                <span className={styles.statValue}>$4,800</span>
              </div>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Avg Job Time</span>
                <span className={styles.statValue}>3.2h</span>
              </div>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Comebacks</span>
                <span className={styles.statValue}>0</span>
              </div>
            </div>
            
            <div className={styles.utilizationChart}>
              <div className={styles.utilizationLabel}>Labour Utilization</div>
              <div className={styles.utilizationBars}>
                <div className={styles.utilDay} style={{ height: '80%' }}></div>
                <div className={styles.utilDay} style={{ height: '100%' }}></div>
                <div className={styles.utilDay} style={{ height: '90%' }}></div>
                <div className={styles.utilDay} style={{ height: '70%' }}></div>
                <div className={styles.utilDay} style={{ height: '85%' }}></div>
              </div>
              <div className={styles.utilizationDays}>
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInventoryTab = () => {
    const totalValue = partsInventory.reduce((sum, part) => sum + (part.cost * part.stock), 0);
    const lowStockParts = partsInventory.filter(part => part.stock <= part.minStock);

    return (
      <div className={styles.tabContent}>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>Total Inventory Value</span>
              <DollarSign className={styles.kpiIcon} size={20} />
            </div>
            <div className={styles.kpiValue}>${totalValue.toLocaleString()}</div>
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
              <span className={styles.kpiTitle}>Core Charges Outstanding</span>
              <Package className={styles.kpiIcon} size={20} />
            </div>
            <div className={styles.kpiValue}>$450</div>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockParts.map(part => (
                  <tr key={part.id}>
                    <td>{part.partNumber}</td>
                    <td>{part.description}</td>
                    <td><span className={styles.badgeRed}>{part.stock}</span></td>
                    <td>{part.minStock}</td>
                    <td><button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>Order</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.chartCard}>
            <h3>Top Parts by Usage</h3>
            <div className={styles.barList}>
              {partsInventory.slice(0, 5).map((part, index) => (
                <div key={part.id} className={styles.barListItem}>
                  <div className={styles.barListHeader}>
                    <span>{part.description}</span>
                    <span>{20 - index * 3} units</span>
                  </div>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.barFill} 
                      style={{ width: `${100 - index * 15}%`, backgroundColor: '#3b82f6' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
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
          <p className={styles.subtitle}>Track your shop's performance and financials</p>
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
          <button className="btn btn-outline">
            <Download size={18} /> Export
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
        {activeTab === 'financial' && renderFinancialTab()}
        {activeTab === 'technician' && renderTechnicianTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
      </div>
    </div>
  );
}

// Simple dummy component for missing icon
function CheckCircleIcon({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
