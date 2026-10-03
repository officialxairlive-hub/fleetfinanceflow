'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Users, Package, Calendar, Download, DollarSign,
  AlertCircle, Wrench, Clock, Timer, PiggyBank, Building2
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, BarChart
} from 'recharts';
import styles from './reports.module.css';
import { supabase } from '../../lib/supabaseClient';

/* ---------- helpers ---------- */
const num = (v) => Number(v) || 0;
const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};
const money = (n) => `$${Math.round(num(n)).toLocaleString()}`;
const money2 = (n) => `$${num(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n) => `${num(n).toFixed(1)}%`;
const monthKey = (d) => (d ? String(d).slice(0, 7) : '');
const monthLabel = (k) => {
  if (!k) return '—';
  const [y, m] = k.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

function rangeStart(range) {
  const now = new Date();
  switch (range) {
    case 'Today': { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
    case 'This Week': { const d = new Date(now); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); d.setHours(0, 0, 0, 0); return d; }
    case 'This Month': return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'Last 90 Days': { const d = new Date(now); d.setDate(d.getDate() - 90); d.setHours(0, 0, 0, 0); return d; }
    default: return null; // All Time
  }
}

const tooltipStyle = {
  background: 'var(--color-white)', border: '1px solid var(--color-border)',
  borderRadius: 8, fontSize: 12, padding: '8px 10px'
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('All Time');
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
        console.error('Error loading report data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReportData();
  }, []);

  /* ---------- shared derived data ---------- */
  const woById = useMemo(() => Object.fromEntries(workOrders.map((w) => [w.id, w])), [workOrders]);
  const customerById = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers]);

  const partsCostOf = (wo) => toArray(wo?.parts).reduce((s, p) => s + num(p.cost) * (num(p.qty) || 1), 0);
  const labourHoursOf = (wo) => toArray(wo?.labour).reduce((s, l) => s + num(l.hours), 0);
  const trackedHoursOf = (wo) => (num(wo?.timer) > 0 ? num(wo.timer) / 3600 : 0);

  const start = useMemo(() => rangeStart(dateRange), [dateRange]);

  const fInvoices = useMemo(
    () => (!start ? invoices : invoices.filter((i) => i.issue_date && new Date(i.issue_date) >= start)),
    [invoices, start]
  );
  const fWorkOrders = useMemo(
    () => (!start ? workOrders : workOrders.filter((w) => w.created_at && new Date(w.created_at) >= start)),
    [workOrders, start]
  );

  /* ---------- financial ---------- */
  const fin = useMemo(() => {
    const paid = fInvoices.filter((i) => i.status === 'paid');
    const open = fInvoices.filter((i) => i.status !== 'paid');

    const totalRevenue = fInvoices.reduce((s, i) => s + num(i.total), 0);
    const paidRevenue = paid.reduce((s, i) => s + num(i.total), 0);
    const outstanding = open.reduce((s, i) => s + num(i.total), 0);

    const labourTotal = fInvoices.reduce((s, i) => s + num(i.labour_total), 0);
    const partsTotal = fInvoices.reduce((s, i) => s + num(i.parts_total), 0);
    const suppliesTotal = fInvoices.reduce((s, i) => s + num(i.shop_supplies), 0);
    const taxTotal = fInvoices.reduce((s, i) => s + num(i.tax_amount), 0);

    // Real cost basis: cost of parts actually consumed on each invoice's work order.
    const partsCost = fInvoices.reduce((s, i) => s + partsCostOf(woById[i.work_order_id]), 0);

    const partsGross = partsTotal - partsCost;
    const labourGross = labourTotal; // per-tech labour cost isn't tracked in this schema
    const grossProfit = labourGross + partsGross + suppliesTotal;

    const byMonth = {};
    fInvoices.forEach((i) => {
      const k = monthKey(i.issue_date);
      if (!k) return;
      if (!byMonth[k]) byMonth[k] = { month: k, revenue: 0, labour: 0, parts: 0, supplies: 0, partsCost: 0 };
      byMonth[k].revenue += num(i.total);
      byMonth[k].labour += num(i.labour_total);
      byMonth[k].parts += num(i.parts_total);
      byMonth[k].supplies += num(i.shop_supplies);
      byMonth[k].partsCost += partsCostOf(woById[i.work_order_id]);
    });
    const trend = Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => {
        const gross = m.labour + (m.parts - m.partsCost) + m.supplies;
        return {
          ...m,
          monthLabel: monthLabel(m.month),
          gross: Math.round(gross),
          marginPct: m.revenue > 0 ? Number(((gross / m.revenue) * 100).toFixed(1)) : 0
        };
      });

    return {
      totalRevenue, paidRevenue, outstanding, labourTotal, partsTotal, suppliesTotal, taxTotal,
      partsCost, partsGross, labourGross, grossProfit, trend,
      paidCount: paid.length, openCount: open.length,
      avgRoValue: fInvoices.length ? totalRevenue / fInvoices.length : 0,
      grossMarginPct: totalRevenue ? (grossProfit / totalRevenue) * 100 : 0,
      partsMarginPct: partsTotal ? (partsGross / partsTotal) * 100 : 0
    };
  }, [fInvoices, woById]);

  /* ---------- receivables / A-R aging ---------- */
  const ar = useMemo(() => {
    const today = new Date();
    const buckets = [
      { label: 'Not due', min: -1e9, max: 0, amount: 0, count: 0, color: '#10b981' },
      { label: '1–30d', min: 1, max: 30, amount: 0, count: 0, color: '#f59e0b' },
      { label: '31–60d', min: 31, max: 60, amount: 0, count: 0, color: '#f97316' },
      { label: '61–90d', min: 61, max: 90, amount: 0, count: 0, color: '#ef4444' },
      { label: '90d+', min: 91, max: 1e9, amount: 0, count: 0, color: '#991b1b' }
    ];
    const rows = [];

    fInvoices.filter((i) => i.status !== 'paid').forEach((i) => {
      const due = i.due_date || i.issue_date;
      const days = due ? Math.floor((today - new Date(due)) / 86400000) : 0;
      const b = buckets.find((x) => days >= x.min && days <= x.max);
      if (b) { b.amount += num(i.total); b.count += 1; }
      rows.push({ ...i, daysOverdue: days, due });
    });

    const paidWithDates = invoices.filter((i) => i.status === 'paid' && i.paid_date && i.issue_date);
    const avgDaysToPay = paidWithDates.length
      ? paidWithDates.reduce((s, i) => s + (new Date(i.paid_date) - new Date(i.issue_date)) / 86400000, 0) / paidWithDates.length
      : 0;

    let dso = 0;
    if (invoices.length && fin.totalRevenue > 0) {
      const dates = invoices.map((i) => new Date(i.issue_date)).filter((d) => !isNaN(d));
      if (dates.length) {
        const spanDays = Math.max(1, Math.round((Math.max(...dates) - Math.min(...dates)) / 86400000));
        dso = fin.outstanding / (fin.totalRevenue / spanDays);
      }
    }

    return {
      buckets, rows, avgDaysToPay, dso,
      overdueAmount: rows.filter((r) => r.daysOverdue > 0).reduce((s, r) => s + num(r.total), 0),
      overdueCount: rows.filter((r) => r.daysOverdue > 0).length
    };
  }, [fInvoices, invoices, fin.outstanding, fin.totalRevenue]);

  /* ---------- money saved / leakage ---------- */
  const savings = useMemo(() => {
    // A timer under 15 minutes is a stub (started then stopped), not real job time —
    // counting it as "tracked" would make billed hours look inflated.
    const MIN_TRACKED_HOURS = 0.25;
    const timedOrders = fWorkOrders.filter((w) => trackedHoursOf(w) > MIN_TRACKED_HOURS);
    let tracked = 0, billed = 0, leakageHours = 0, leakageDollars = 0, unbilledOrders = 0;

    timedOrders.forEach((w) => {
      const t = trackedHoursOf(w);
      const b = labourHoursOf(w);
      tracked += t;
      billed += b;
      const gap = t - b;
      if (gap > 0.01) {
        unbilledOrders += 1;
        leakageHours += gap;
        leakageDollars += gap * (num(customerById[w.customer_id]?.labour_rate) || 145);
      }
    });

    // Markup only compares like-for-like: lines that actually carry both a cost and a sell price.
    let partsLines = 0, partsLinesPriced = 0, pricedSell = 0, pricedCost = 0, allCost = 0;
    fWorkOrders.forEach((w) => toArray(w.parts).forEach((p) => {
      partsLines += 1;
      const c = num(p.cost) * (num(p.qty) || 1);
      allCost += c;
      if (p.sell !== null && p.sell !== undefined) {
        partsLinesPriced += 1;
        pricedSell += num(p.sell) * (num(p.qty) || 1);
        pricedCost += c;
      }
    }));

    const markupRealized = pricedSell - pricedCost;
    const partsCostUsed = allCost;
    const billedHoursTotal = fWorkOrders.reduce((s, w) => s + labourHoursOf(w), 0);
    const labourBilledValue = fWorkOrders.reduce(
      (s, w) => s + labourHoursOf(w) * (num(customerById[w.customer_id]?.labour_rate) || 145), 0
    );

    const emergencyOrders = fWorkOrders.filter((w) => w.is_emergency || w.is_roadside);
    const premiumRevenue = emergencyOrders.reduce((s, w) => {
      const inv = fInvoices.find((i) => i.work_order_id === w.id);
      return s + num(inv?.total);
    }, 0);

    return {
      tracked, billed, leakageHours, leakageDollars, unbilledOrders, markupRealized, partsCostUsed,
      billedHoursTotal, labourBilledValue,
      timedOrderCount: timedOrders.length,
      untrackedOrders: fWorkOrders.length - timedOrders.length,
      partsLines, partsLinesPriced, pricedCost,
      efficiency: tracked > 0 ? (billed / tracked) * 100 : 0,
      emergencyCount: emergencyOrders.length, premiumRevenue,
      comebacks: technicians.reduce((s, t) => s + num(t.stats?.comebacks), 0),
      suppliesRecovered: fInvoices.reduce((s, i) => s + num(i.shop_supplies), 0)
    };
  }, [fWorkOrders, fInvoices, customerById, technicians]);

  /* ---------- customers ---------- */
  const customerStats = useMemo(() => {
    const map = {};
    fInvoices.forEach((i) => {
      const id = i.customer_id || 'unknown';
      if (!map[id]) map[id] = { id, revenue: 0, orders: 0, outstanding: 0 };
      map[id].revenue += num(i.total);
      map[id].orders += 1;
      if (i.status !== 'paid') map[id].outstanding += num(i.total);
    });
    return Object.values(map)
      .map((c) => ({
        ...c,
        name: customerById[c.id]?.company || customerById[c.id]?.company_name || c.id,
        fleetSize: num(customerById[c.id]?.fleet_size),
        avgRo: c.orders ? c.revenue / c.orders : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [fInvoices, customerById]);

  /* ---------- technicians ---------- */
  const techStats = useMemo(() => {
    const map = {};
    fWorkOrders.forEach((w) => {
      const name = w.tech_name || 'Unassigned';
      if (!map[name]) map[name] = { name, jobs: 0, billedHours: 0, trackedHours: 0, revenue: 0 };
      map[name].jobs += 1;
      map[name].billedHours += labourHoursOf(w);
      map[name].trackedHours += trackedHoursOf(w);
      const inv = fInvoices.find((i) => i.work_order_id === w.id);
      map[name].revenue += num(inv?.total);
    });
    return Object.values(map)
      .map((t) => ({ ...t, efficiency: t.trackedHours > 0 ? (t.billedHours / t.trackedHours) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [fWorkOrders, fInvoices]);

  /* ---------- inventory ---------- */
  const invStats = useMemo(() => {
    const stockRows = parts.filter((p) => p.qty_on_hand !== null && p.qty_on_hand !== undefined);
    const stockValue = stockRows.reduce((s, p) => s + num(p.cost) * num(p.qty_on_hand), 0);
    const lowStock = parts.filter(
      (p) => p.qty_on_hand !== null && p.min_stock !== null && num(p.qty_on_hand) <= num(p.min_stock)
    );

    const usage = {};
    workOrders.forEach((w) => {
      toArray(w.parts).forEach((p) => {
        const key = p.partNumber || p.description || 'Unknown';
        if (!usage[key]) usage[key] = { key, qty: 0, sell: 0, cost: 0 };
        usage[key].qty += num(p.qty) || 1;
        usage[key].sell += num(p.sell) * (num(p.qty) || 1);
        usage[key].cost += num(p.cost) * (num(p.qty) || 1);
      });
    });

    return {
      stockValue, stockTracked: stockRows.length, lowStock,
      movers: Object.values(usage).sort((a, b) => b.sell - a.sell).slice(0, 10),
      missingStock: parts.length - stockRows.length
    };
  }, [parts, workOrders]);

  /* ---------- export ---------- */
  const exportCsv = () => {
    const header = ['Invoice', 'Customer', 'Issue Date', 'Due Date', 'Status', 'Labour', 'Parts', 'Supplies', 'Tax', 'Total'];
    const lines = fInvoices.map((i) => [
      i.id,
      `"${(customerById[i.customer_id]?.company || customerById[i.customer_id]?.company_name || i.customer_id || '').replace(/"/g, '""')}"`,
      i.issue_date || '', i.due_date || '', i.status || '',
      num(i.labour_total).toFixed(2), num(i.parts_total).toFixed(2),
      num(i.shop_supplies).toFixed(2), num(i.tax_amount).toFixed(2), num(i.total).toFixed(2)
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-finance-invoices-${dateRange.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= TAB: FINANCIAL ================= */
  const renderFinancialTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Invoiced Revenue</span><DollarSign className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money2(fin.totalRevenue)}</div>
          <div className={styles.kpiTrend}><span>{fInvoices.length} invoices · {dateRange}</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Collected</span><DollarSign className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money2(fin.paidRevenue)}</div>
          <div className={styles.kpiTrend}><span>{fin.paidCount} paid invoices</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Outstanding</span><AlertCircle className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money2(fin.outstanding)}</div>
          <div className={styles.kpiTrend}><span>{fin.openCount} unpaid</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Average RO Value</span><BarChart3 className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money(fin.avgRoValue)}</div>
          <div className={styles.kpiTrend}><span>per invoice</span></div>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Labour Revenue</span><Wrench className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money(fin.labourTotal)}</div>
          <div className={styles.kpiTrend}><span>labour cost not tracked</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Parts Revenue</span><Package className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money(fin.partsTotal)}</div>
          <div className={styles.kpiTrend}><div className={styles.marginPill}>{pct(fin.partsMarginPct)} margin</div></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Gross Profit</span><TrendingUp className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money(fin.grossProfit)}</div>
          <div className={styles.kpiTrend}><div className={styles.marginPill}>{pct(fin.grossMarginPct)} margin</div></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Parts Cost of Sale</span><Package className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money(fin.partsCost)}</div>
          <div className={styles.kpiTrend}><span>{money(fin.partsGross)} parts gross</span></div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3>Revenue &amp; Gross Margin by Month</h3>
          {fin.trend.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>No invoices in this range.</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <ComposedChart data={fin.trend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <YAxis yAxisId="left" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => (n === 'Margin %' ? `${v}%` : money2(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#2563FF" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="gross" name="Gross profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="marginPct" name="Margin %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Gross Profit Composition</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Labour', value: Math.round(fin.labourGross) },
                    { name: 'Parts', value: Math.round(fin.partsGross) },
                    { name: 'Shop supplies', value: Math.round(fin.suppliesTotal) }
                  ]}
                  dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}
                >
                  {['#2563FF', '#10b981', '#8b5cf6'].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => money2(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Unpaid Invoice Aging</h3>
          {ar.rows.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Nothing outstanding — every invoice is paid.</p>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={ar.buckets} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
                  <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => money2(v)} />
                  <Bar dataKey="amount" name="Outstanding" radius={[4, 4, 0, 0]}>
                    {ar.buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ================= TAB: MONEY SAVED ================= */
  const renderSavingsTab = () => {
    const maxOf = Math.max(
      savings.labourBilledValue, savings.markupRealized,
      savings.suppliesRecovered, savings.premiumRevenue, 1
    );
    return (
      <div className={styles.tabContent}>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Unbilled Time Leakage</span><Timer className={styles.kpiIcon} size={20} /></div>
            <div className={styles.kpiValue} style={{ color: savings.leakageDollars > 0 ? '#ef4444' : undefined }}>
              {money2(savings.leakageDollars)}
            </div>
            <div className={styles.kpiTrend}>
              <span>{savings.leakageHours.toFixed(1)} hrs tracked but never billed · {savings.unbilledOrders} orders</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Parts Markup Realized</span><PiggyBank className={styles.kpiIcon} size={20} /></div>
            <div className={styles.kpiValue} style={{ color: '#10b981' }}>{money(savings.markupRealized)}</div>
            <div className={styles.kpiTrend}>
              <div className={styles.marginPill}>
                {savings.pricedCost > 0 ? pct((savings.markupRealized / savings.pricedCost) * 100) : '0%'} on {money(savings.pricedCost)} priced cost
              </div>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Shop Supplies Recovered</span><DollarSign className={styles.kpiIcon} size={20} /></div>
            <div className={styles.kpiValue}>{money(savings.suppliesRecovered)}</div>
            <div className={styles.kpiTrend}><span>collected on invoices</span></div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Comebacks / Rework</span><AlertCircle className={styles.kpiIcon} size={20} /></div>
            <div className={styles.kpiValue}>{savings.comebacks}</div>
            <div className={styles.kpiTrend}><span>logged against technicians</span></div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3>Tracked vs Billed Hours</h3>
            {savings.tracked <= 0 ? (
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No timer data yet. Time tracked on work orders appears here — that&apos;s where leakage is measured.
              </p>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      { name: 'Tracked', hours: Number(savings.tracked.toFixed(1)) },
                      { name: 'Billed', hours: Number(savings.billed.toFixed(1)) },
                      { name: 'Unbilled', hours: Number(savings.leakageHours.toFixed(1)) }
                    ]}
                    margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v} hrs`} />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                      <Cell fill="#2563FF" /><Cell fill="#10b981" /><Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Compared across the {savings.timedOrderCount} work order{savings.timedOrderCount === 1 ? '' : 's'} with a real timer (over 15 min).
              {savings.untrackedOrders > 0 && <> <strong>{savings.untrackedOrders} order{savings.untrackedOrders === 1 ? '' : 's'}</strong> have no meaningful time tracked — that time is invisible, and is the bigger risk.</>}
            </p>
          </div>

          <div className={styles.chartCard}>
            <h3>Where the Money Comes From</h3>
            <div className={styles.barList}>
              {[
                { label: 'Labour billed', value: savings.labourBilledValue, color: '#2563FF' },
                { label: 'Parts markup realized', value: savings.markupRealized, color: '#10b981' },
                { label: 'Shop supplies recovered', value: savings.suppliesRecovered, color: '#8b5cf6' },
                { label: 'Emergency / roadside revenue', value: savings.premiumRevenue, color: '#f59e0b' }
              ].map((row) => (
                <div key={row.label} className={styles.barListItem}>
                  <div className={styles.barListHeader}>
                    <span>{row.label}</span>
                    <span>{money(row.value)}</span>
                  </div>
                  <div className={styles.barContainer}>
                    <div className={styles.barFill} style={{ width: `${Math.max(2, (row.value / maxOf) * 100)}%`, backgroundColor: row.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.25rem', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
              <strong>{savings.billedHoursTotal.toFixed(1)} billed hours</strong> across {fWorkOrders.length} work orders
              {savings.tracked > 0 && <> · billed ÷ tracked = <strong>{pct(savings.efficiency)}</strong> on timered orders</>}.
            </div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
            <h3>Recovery Opportunities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              {[
                { t: 'Bill the tracked hours', v: money(savings.leakageDollars), d: `${savings.leakageHours.toFixed(1)} hrs sit in the timer on ${savings.unbilledOrders} orders but never reached an invoice.` },
                { t: 'Start the clock', v: `${savings.untrackedOrders} orders`, d: 'Work orders with no time tracked at all — no timer, so no way to know what they cost you.' },
                { t: 'Price every parts line', v: `${savings.partsLinesPriced}/${savings.partsLines}`, d: 'Parts lines carrying a sell price. The rest are cost-only, so their markup is unmeasurable.' },
                { t: 'Emergency premium captured', v: money(savings.premiumRevenue), d: `${savings.emergencyCount} breakdown / roadside orders.` },
                { t: 'Supplies line collected', v: money(savings.suppliesRecovered), d: 'Shop supplies recovered on invoices.' },
                { t: 'Rework to eliminate', v: `${savings.comebacks} jobs`, d: 'Comebacks logged — each one is unpaid shop time.' }
              ].map((c) => (
                <div key={c.t} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{c.t}</div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, margin: '6px 0 4px' }}>{c.v}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ================= TAB: RECEIVABLES ================= */
  const renderReceivablesTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Outstanding A/R</span><DollarSign className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money2(fin.outstanding)}</div>
          <div className={styles.kpiTrend}><span>{ar.rows.length} open invoices</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Overdue</span><AlertCircle className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue} style={{ color: ar.overdueAmount > 0 ? '#ef4444' : undefined }}>{money2(ar.overdueAmount)}</div>
          <div className={styles.kpiTrend}><span>{ar.overdueCount} past due date</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Avg Days to Pay</span><Clock className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{ar.avgDaysToPay.toFixed(1)}</div>
          <div className={styles.kpiTrend}><span>issue date → paid date</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Days Sales Outstanding</span><Timer className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{ar.dso.toFixed(0)}</div>
          <div className={styles.kpiTrend}><span>outstanding ÷ daily revenue</span></div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3>Unpaid Invoices by Age</h3>
          <table className={styles.table}>
            <thead>
              <tr><th>Invoice</th><th>Customer</th><th>Issued</th><th>Due</th><th>Status</th><th>Days Overdue</th><th>Total</th></tr>
            </thead>
            <tbody>
              {ar.rows.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-secondary)' }}>Nothing outstanding.</td></tr>
              )}
              {[...ar.rows].sort((a, b) => b.daysOverdue - a.daysOverdue).map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{customerById[r.customer_id]?.company || customerById[r.customer_id]?.company_name || r.customer_id}</td>
                  <td>{r.issue_date}</td>
                  <td>{r.due_date || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.status}</td>
                  <td>
                    {r.daysOverdue > 0
                      ? <span className={styles.badgeRed}>{r.daysOverdue}d</span>
                      : <span style={{ color: 'var(--color-text-muted)' }}>current</span>}
                  </td>
                  <td>{money2(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ================= TAB: CUSTOMERS ================= */
  const renderCustomersTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Top Customers by Revenue</h3>
          {customerStats.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>No invoiced customers in this range.</p>
          ) : (
            <div style={{ width: '100%', height: Math.max(240, customerStats.slice(0, 8).length * 42) }}>
              <ResponsiveContainer>
                <BarChart data={customerStats.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => money2(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill="#2563FF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={styles.chartCard}>
          <h3>Account Detail</h3>
          <table className={styles.table}>
            <thead>
              <tr><th>Customer</th><th>Fleet</th><th>ROs</th><th>Avg RO</th><th>Revenue</th><th>Outstanding</th></tr>
            </thead>
            <tbody>
              {customerStats.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.fleetSize || '—'}</td>
                  <td>{c.orders}</td>
                  <td>{money(c.avgRo)}</td>
                  <td>{money(c.revenue)}</td>
                  <td>{c.outstanding > 0 ? <span className={styles.badgeRed}>{money(c.outstanding)}</span> : '—'}</td>
                </tr>
              ))}
              {customerStats.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-secondary)' }}>No data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ================= TAB: TECHNICIANS ================= */
  const renderTechnicianTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3>Revenue, Jobs &amp; Efficiency by Technician</h3>
          {techStats.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>No work orders with a technician assigned.</p>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <ComposedChart data={techStats} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
                  <YAxis yAxisId="left" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => (n === 'Efficiency' ? `${num(v).toFixed(0)}%` : money2(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#2563FF" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="jobs" name="Jobs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Efficiency" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
          <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Efficiency = billed hours ÷ hours tracked on the timer. Techs without timer data show no value.
          </p>
        </div>
      </div>

      <div className={styles.techGrid}>
        {techStats.map((t) => (
          <div key={t.name} className={styles.techCard}>
            <div className={styles.techHeader}>
              <div className={styles.techAvatar}>{(t.name || 'T')[0]}</div>
              <div>
                <div className={styles.techName}>{t.name}</div>
                <div className={styles.techRole}>{t.jobs} job{t.jobs === 1 ? '' : 's'} in range</div>
              </div>
            </div>
            <div className={styles.techStats}>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Billed Hours</span>
                <span className={styles.statValue}>{t.billedHours.toFixed(1)}h</span>
              </div>
              <div className={styles.techStatItem}>
                <span className={styles.statLabel}>Revenue</span>
                <span className={styles.statValue}>{money(t.revenue)}</span>
              </div>
            </div>
            <div className={styles.efficiencySection}>
              <div className={styles.efficiencyHeader}>
                <span>Efficiency</span>
                <span>{t.trackedHours > 0 ? pct(t.efficiency) : 'no timer data'}</span>
              </div>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{
                    width: `${Math.min(100, Math.max(0, t.efficiency))}%`,
                    backgroundColor: t.efficiency >= 90 ? '#10b981' : t.efficiency >= 70 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        {techStats.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No technician activity.</div>
        )}
      </div>
    </div>
  );

  /* ================= TAB: INVENTORY ================= */
  const renderInventoryTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Inventory Value on Hand</span><DollarSign className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{money2(invStats.stockValue)}</div>
          <div className={styles.kpiTrend}><span>{invStats.stockTracked} of {parts.length} SKUs have stock counts</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Low Stock Items</span><AlertCircle className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{invStats.lowStock.length}</div>
          <div className={styles.kpiTrend}><span>at or below minimum</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Total SKUs</span><Package className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>{parts.length}</div>
          <div className={styles.kpiTrend}><span>in the catalogue</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span className={styles.kpiTitle}>Parts Margin (sold)</span><TrendingUp className={styles.kpiIcon} size={20} /></div>
          <div className={styles.kpiValue}>
            {savings.pricedCost > 0 ? pct((savings.markupRealized / savings.pricedCost) * 100) : '—'}
          </div>
          <div className={styles.kpiTrend}><span>{money(savings.markupRealized)} realized</span></div>
        </div>
      </div>

      {invStats.missingStock > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', borderRadius: 9, padding: '10px 14px', fontSize: '12.5px', marginBottom: '1rem' }}>
          {invStats.missingStock} part{invStats.missingStock === 1 ? '' : 's'} have no <code>qty_on_hand</code> value and are excluded from the valuation above — stock counts need populating for accurate inventory analytics.
        </div>
      )}

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Top Parts by Revenue</h3>
          {invStats.movers.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>No parts consumed on work orders yet.</p>
          ) : (
            <div style={{ width: '100%', height: Math.max(240, invStats.movers.length * 34) }}>
              <ResponsiveContainer>
                <BarChart data={invStats.movers} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} stroke="var(--color-text-muted)" />
                  <YAxis type="category" dataKey="key" width={120} tick={{ fontSize: 10.5 }} stroke="var(--color-text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => money2(v)} />
                  <Bar dataKey="sell" name="Sold value" fill="#2563FF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={styles.chartCard}>
          <h3>Parts Below Minimum Stock</h3>
          <table className={styles.table}>
            <thead>
              <tr><th>Part Number</th><th>Description</th><th>On Hand</th><th>Min</th></tr>
            </thead>
            <tbody>
              {invStats.lowStock.map((p) => (
                <tr key={p.id}>
                  <td>{p.part_number}</td>
                  <td>{p.description}</td>
                  <td><span className={styles.badgeRed}>{p.qty_on_hand}</span></td>
                  <td>{p.min_stock}</td>
                </tr>
              ))}
              {invStats.lowStock.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)' }}>
                  No items at or below minimum stock.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports &amp; Analytics</h1>
          <p className={styles.subtitle}>Computed live from your invoices, work orders and parts — no estimates</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.dateSelector}>
            <Calendar size={18} />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={styles.select}>
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <button className="btn btn-outline" onClick={exportCsv}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'financial' ? styles.activeTab : ''}`} onClick={() => setActiveTab('financial')}>
          <DollarSign size={18} /> Financial
        </button>
        <button className={`${styles.tab} ${activeTab === 'savings' ? styles.activeTab : ''}`} onClick={() => setActiveTab('savings')}>
          <PiggyBank size={18} /> Money Saved
        </button>
        <button className={`${styles.tab} ${activeTab === 'receivables' ? styles.activeTab : ''}`} onClick={() => setActiveTab('receivables')}>
          <Clock size={18} /> Receivables
        </button>
        <button className={`${styles.tab} ${activeTab === 'customers' ? styles.activeTab : ''}`} onClick={() => setActiveTab('customers')}>
          <Building2 size={18} /> Customers
        </button>
        <button className={`${styles.tab} ${activeTab === 'technician' ? styles.activeTab : ''}`} onClick={() => setActiveTab('technician')}>
          <Users size={18} /> Technicians
        </button>
        <button className={`${styles.tab} ${activeTab === 'inventory' ? styles.activeTab : ''}`} onClick={() => setActiveTab('inventory')}>
          <Package size={18} /> Inventory
        </button>
      </div>

      <div className={styles.tabContainer}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>Loading reports from Supabase...</div>
        ) : (
          <>
            {activeTab === 'financial' && renderFinancialTab()}
            {activeTab === 'savings' && renderSavingsTab()}
            {activeTab === 'receivables' && renderReceivablesTab()}
            {activeTab === 'customers' && renderCustomersTab()}
            {activeTab === 'technician' && renderTechnicianTab()}
            {activeTab === 'inventory' && renderInventoryTab()}
          </>
        )}
      </div>
    </div>
  );
}
