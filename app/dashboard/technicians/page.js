'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './technicians.module.css';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  UserPlus, 
  Wrench, 
  Clock, 
  DollarSign, 
  Search, 
  Building2, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Coffee, 
  X, 
  Edit, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  FileBadge
} from 'lucide-react';
import Link from 'next/link';

const STANDARD_TECH_TYPES = [
  'Red Seal Journeyman Heavy Duty',
  '310T Truck & Coach Apprentice (L1-L4)',
  '310S Automotive Service Tech',
  'Trailer & Air Brake Specialist',
  'Mobile Roadside Diesel Mechanic',
  'Commercial Vehicle Safety Inspector (CVSE/DOT)',
  'Shop Foreman / Lead Hand',
  'Lube, Tire & PM Technician'
];

const CANADIAN_BANKS = [
  { name: 'RBC Royal Bank', inst: '003' },
  { name: 'TD Canada Trust', inst: '004' },
  { name: 'Scotiabank', inst: '002' },
  { name: 'BMO Bank of Montreal', inst: '001' },
  { name: 'CIBC', inst: '010' },
  { name: 'Desjardins', inst: '815' },
  { name: 'National Bank of Canada', inst: '006' },
  { name: 'ATB Financial', inst: '219' },
  { name: 'Other / Credit Union', inst: '999' }
];

const WORKING_TERMS = [
  'Full-Time Hourly',
  'Full-Time Flat Rate',
  'Part-Time Hourly',
  'Subcontractor / 1099'
];

export default function TechniciansHubPage() {
  const [primaryTab, setPrimaryTab] = useState('team'); // 'team' | 'labour'
  const [technicians, setTechnicians] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [partRequests, setPartRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [isCustomType, setIsCustomType] = useState(false);

  // Time Adjustment Form State
  const [timeForm, setTimeForm] = useState({
    techId: '',
    woId: '',
    hoursDelta: '1.0',
    reason: 'Extended diagnostics & troubleshooting',
    rateType: 'Standard ($145/hr CAD)'
  });
  const [savingTime, setSavingTime] = useState(false);

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    idProofType: "Provincial Driver's License",
    idProofNumber: '',
    techType: 'Red Seal Journeyman Heavy Duty',
    customType: '',
    workingTerms: 'Full-Time Hourly',
    hourlyPayCad: '45.00',
    overtimePayCad: '67.50',
    labourRate: '145.00',
    bankName: 'RBC Royal Bank',
    institutionNumber: '003',
    transitNumber: '',
    accountNumber: '',
    payFrequency: 'Bi-Weekly',
    nextPayDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    directDepositNotes: 'Void cheque on file',
    canCreateEstimates: true,
    canApproveEstimates: false,
    canCreateWorkOrders: false
  });

  const fetchData = async () => {
    try {
      const [techRes, woRes, reqRes] = await Promise.all([
        supabase.from('technicians').select('*').order('created_at', { ascending: true }),
        supabase.from('work_orders').select('id, customer_name, unit_display, status, tech_id, timer'),
        supabase.from('part_requests').select('*').eq('status', 'pending')
      ]);

      if (techRes.error) throw techRes.error;

      setTechnicians(techRes.data || []);
      setWorkOrders(woRes.data || []);
      setPartRequests(reqRes.data || []);
    } catch (err) {
      console.error("Error fetching technician hub data:", err);
      setError(err.message || 'Failed to fetch technicians from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Lightweight 10s auto-refresh for realtime status
    const interval = setInterval(fetchData, 10000);

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('tech-hub-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const openAddModal = () => {
    setSelectedTech(null);
    setIsCustomType(false);
    setForm({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      idProofType: "Provincial Driver's License",
      idProofNumber: '',
      techType: 'Red Seal Journeyman Heavy Duty',
      customType: '',
      workingTerms: 'Full-Time Hourly',
      hourlyPayCad: '45.00',
      overtimePayCad: '67.50',
      labourRate: '145.00',
      bankName: 'RBC Royal Bank',
      institutionNumber: '003',
      transitNumber: '',
      accountNumber: '',
      payFrequency: 'Bi-Weekly',
      nextPayDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      directDepositNotes: 'Void cheque on file',
      canCreateEstimates: true,
      canApproveEstimates: false,
      canCreateWorkOrders: false
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (tech) => {
    setSelectedTech(tech);
    const isCustom = !STANDARD_TECH_TYPES.includes(tech.tech_type || tech.role);
    setIsCustomType(isCustom);

    setForm({
      fullName: tech.full_name || tech.name || '',
      email: tech.email || '',
      phone: tech.phone || '',
      address: tech.address || '',
      idProofType: tech.id_proof_type || "Provincial Driver's License",
      idProofNumber: tech.id_proof_number || '',
      techType: isCustom ? 'CUSTOM' : (tech.tech_type || tech.role || 'Red Seal Journeyman Heavy Duty'),
      customType: isCustom ? (tech.tech_type || tech.role || '') : '',
      workingTerms: tech.working_terms || 'Full-Time Hourly',
      hourlyPayCad: (tech.hourly_pay_cad || 45.00).toString(),
      overtimePayCad: (tech.overtime_pay_cad || 67.50).toString(),
      labourRate: (tech.labour_rate || 145.00).toString(),
      bankName: tech.bank_name || 'RBC Royal Bank',
      institutionNumber: tech.institution_number || '003',
      transitNumber: tech.transit_number || '',
      accountNumber: tech.account_number || '',
      payFrequency: tech.pay_frequency || 'Bi-Weekly',
      nextPayDate: tech.next_pay_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      directDepositNotes: tech.direct_deposit_notes || 'Void cheque on file',
      canCreateEstimates: tech.can_create_estimates ?? true,
      canApproveEstimates: tech.can_approve_estimates ?? false,
      canCreateWorkOrders: tech.can_create_work_orders ?? false
    });
    setIsEditModalOpen(true);
  };

  const handleBankChange = (bName) => {
    const found = CANADIAN_BANKS.find(b => b.name === bName);
    setForm(prev => ({
      ...prev,
      bankName: bName,
      institutionNumber: found ? found.inst : prev.institutionNumber
    }));
  };

  const handleSaveTech = async (e) => {
    e.preventDefault();
    try {
      const finalType = isCustomType ? form.customType : form.techType;
      const hourlyCad = parseFloat(form.hourlyPayCad) || 45;
      const overtimeCad = parseFloat(form.overtimePayCad) || (hourlyCad * 1.5);
      const labourRate = parseFloat(form.labourRate) || 145;

      const payload = {
        name: form.fullName.split(' ')[0] || form.fullName,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        id_proof_type: form.idProofType,
        id_proof_number: form.idProofNumber,
        tech_type: finalType,
        role: finalType,
        working_terms: form.workingTerms,
        hourly_pay_cad: hourlyCad,
        overtime_pay_cad: overtimeCad,
        labour_rate: labourRate,
        bank_name: form.bankName,
        institution_number: form.institutionNumber,
        transit_number: form.transitNumber,
        account_number: form.accountNumber,
        pay_frequency: form.payFrequency,
        next_pay_date: form.nextPayDate,
        direct_deposit_notes: form.directDepositNotes,
        can_create_estimates: form.canCreateEstimates,
        can_approve_estimates: form.canApproveEstimates,
        can_create_work_orders: form.canCreateWorkOrders
      };

      if (isEditModalOpen && selectedTech) {
        const { error } = await supabase
          .from('technicians')
          .update(payload)
          .eq('id', selectedTech.id);

        if (error) throw error;
        alert(`Technician ${form.fullName} updated successfully!`);
      } else {
        const newId = `TECH-${Date.now().toString().slice(-4)}`;
        const { error } = await supabase
          .from('technicians')
          .insert([{
            id: newId,
            status: 'off',
            hours_today: 0,
            avatar: form.fullName.charAt(0).toUpperCase(),
            ...payload
          }]);

        if (error) throw error;
        alert(`New technician ${form.fullName} added to team!`);
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error saving technician:", err);
      alert(`Error saving technician: ${err.message}`);
    }
  };

  const handleDeleteTech = async (techId, techName) => {
    if (!confirm(`Are you sure you want to remove ${techName} from the shop team?`)) return;
    try {
      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', techId);

      if (error) throw error;
      fetchData();
    } catch (err) {
      alert(`Error deleting technician: ${err.message}`);
    }
  };

  const handleSaveTimeAdjustment = async (e) => {
    e?.preventDefault();
    if (!timeForm.techId) {
      alert('Please select a technician.');
      return;
    }
    setSavingTime(true);
    try {
      const selectedTechObj = technicians.find(t => t.id === timeForm.techId);
      const hoursToAdd = parseFloat(timeForm.hoursDelta) || 0;
      const currentHours = parseFloat(selectedTechObj?.hours_today || 0);
      const newHours = Math.max(0, currentHours + hoursToAdd);

      // 1. Update technician hours_today in Supabase
      const { error: techErr } = await supabase
        .from('technicians')
        .update({ hours_today: newHours })
        .eq('id', timeForm.techId);

      if (techErr) throw techErr;

      // 2. If a work order was selected, add a labour line to that work order
      if (timeForm.woId) {
        const { data: fullWo } = await supabase.from('work_orders').select('*').eq('id', timeForm.woId).single();
        if (fullWo) {
          const currentLabour = fullWo.labour || [];
          const newLine = {
            description: `Manual Time Adjustment: ${timeForm.reason}`,
            hours: hoursToAdd,
            rate: 145.00,
            technician: selectedTechObj?.full_name || selectedTechObj?.name || 'Technician'
          };
          const updatedLabour = [...currentLabour, newLine];
          const labourTotal = updatedLabour.reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
          const partsTotal = (fullWo.parts || []).reduce((sum, p) => sum + ((p.quantity || 0) * (p.sellPrice || p.price || 0)), 0);
          const supplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
          const subtotal = labourTotal + partsTotal + supplies;
          const tax = subtotal * 0.05;

          await supabase.from('work_orders').update({
            labour: updatedLabour,
            estimated_cost: subtotal + tax
          }).eq('id', timeForm.woId);
        }
      }

      alert(`✅ Successfully recorded ${hoursToAdd > 0 ? `+${hoursToAdd}` : hoursToAdd} hours for ${selectedTechObj?.full_name || selectedTechObj?.name}!`);
      setIsTimeModalOpen(false);
      setTimeForm({
        techId: '',
        woId: '',
        hoursDelta: '1.0',
        reason: 'Extended diagnostics & troubleshooting',
        rateType: 'Standard ($145/hr CAD)'
      });
      fetchData();
    } catch (err) {
      alert(`Error recording time adjustment: ${err.message}`);
    } finally {
      setSavingTime(false);
    }
  };

  // KPIs
  const totalTechs = technicians.length;
  const clockedInTechs = technicians.filter(t => t.status && t.status !== 'off').length;
  const activeRepairingTechs = technicians.filter(t => t.status === 'repairing' || t.status === 'active').length;
  const totalPayrollLiabilityCad = technicians.reduce((sum, t) => {
    const rate = parseFloat(t.hourly_pay_cad) || 45;
    const hours = (t.stats?.hoursThisWeek) || 37.5;
    return sum + (rate * hours);
  }, 0);

  // Labour KPI calculations
  const totalHoursToday = technicians.reduce((sum, t) => sum + (parseFloat(t.hours_today) || 0), 0) || 28.5;
  const billableHoursToday = Math.round(totalHoursToday * 0.88);
  const shopLabourRevenueCad = billableHoursToday * 145.00;
  const avgEfficiency = totalHoursToday > 0 ? Math.round((billableHoursToday / totalHoursToday) * 100) : 92;

  // Filtering
  const filteredTechs = useMemo(() => {
    return technicians.filter(t => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (t.full_name || t.name || '').toLowerCase().includes(q) ||
        (t.tech_type || t.role || '').toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Clocked In' && t.status !== 'off') ||
        (statusFilter === 'Repairing' && (t.status === 'repairing' || t.status === 'active')) ||
        (statusFilter === 'Waiting Parts' && t.status === 'waiting_parts') ||
        (statusFilter === 'Off' && (!t.status || t.status === 'off'));

      const matchesType = typeFilter === 'All' || (t.tech_type || t.role) === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [technicians, searchQuery, statusFilter, typeFilter]);

  const formatCad = (val) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val || 0);

  const maskAccount = (acct) => {
    if (!acct) return 'Not on file';
    if (acct.length <= 4) return `••••${acct}`;
    return `••••${acct.slice(-4)}`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Technicians, Team & Labour Hub</h1>
          <p className={styles.subtitle}>
            Live shop floor synchronization, technician profiles, Canadian payroll banking, and unified labour tracking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => setIsTimeModalOpen(true)}>
            <Clock size={16} /> Manual Time Entry
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <UserPlus size={18} /> Add New Technician
          </button>
        </div>
      </header>

      {/* Main View Switcher Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem', paddingBottom: '4px' }}>
        <button
          className={`${styles.categoryTab} ${primaryTab === 'team' ? styles.active : ''}`}
          onClick={() => setPrimaryTab('team')}
          style={{ fontSize: '14px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={16} /> Team & Canadian Payroll
        </button>
        <button
          className={`${styles.categoryTab} ${primaryTab === 'labour' ? styles.active : ''}`}
          onClick={() => setPrimaryTab('labour')}
          style={{ fontSize: '14px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Clock size={16} /> Labour & Time Tracking
        </button>
      </div>

      {primaryTab === 'team' ? (
        <>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.blue}`}>
                <Users size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Total Technicians</p>
                <p className={styles.kpiValue}>{isLoading ? '...' : totalTechs}</p>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.green}`}>
                <CheckCircle2 size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Currently Clocked In</p>
                <p className={styles.kpiValue}>{isLoading ? '...' : `${clockedInTechs} Active`}</p>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.amber}`}>
                <Wrench size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Working in Bay</p>
                <p className={styles.kpiValue}>{isLoading ? '...' : `${activeRepairingTechs} on Trucks`}</p>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.purple}`}>
                <DollarSign size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Est. Weekly Payroll (CAD)</p>
                <p className={styles.kpiValue}>{isLoading ? '...' : formatCad(totalPayrollLiabilityCad)}</p>
              </div>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Search tech name, role, phone..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.categoryTabs}>
              {['All', 'Clocked In', 'Repairing', 'Waiting Parts', 'Off'].map(status => (
                <button
                  key={status}
                  className={`${styles.categoryTab} ${statusFilter === status ? styles.active : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Technicians Grid */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
              Syncing technician team from Supabase...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>Error: {error}</div>
          ) : filteredTechs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <Users size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <h3>No technicians found matching filters.</h3>
              <p>Click "Add New Technician" to build your shop team.</p>
            </div>
          ) : (
            <div className={styles.techGrid}>
              {filteredTechs.map(tech => {
                const isClockedIn = tech.status && tech.status !== 'off';
                const assignedJobs = workOrders.filter(wo => wo.tech_id === tech.id);
                const activeJob = assignedJobs[0] || null;
                const techPartRequests = partRequests.filter(r => r.requested_by?.toLowerCase().includes((tech.name || '').toLowerCase()));

                let statusClass = styles.statusGray;
                let statusText = 'Clocked Out';
                if (tech.status === 'repairing' || tech.status === 'active') {
                  statusClass = styles.statusGreen;
                  statusText = '⚡ Active / Repairing';
                } else if (tech.status === 'waiting_parts') {
                  statusClass = styles.statusAmber;
                  statusText = '🚨 Waiting on Parts';
                } else if (tech.status === 'break') {
                  statusClass = styles.statusBlue;
                  statusText = '☕ On Break';
                } else if (isClockedIn) {
                  statusClass = styles.statusBlue;
                  statusText = '🟢 Online / Ready';
                }

                return (
                  <div key={tech.id} className={styles.techCard}>
                    {/* Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarAndInfo}>
                        <div className={styles.techAvatar}>
                          {tech.avatar || (tech.full_name || tech.name || 'T')[0]}
                        </div>
                        <div>
                          <h3 className={styles.techName}>{tech.full_name || tech.name}</h3>
                          <div className={styles.techType}>{tech.tech_type || tech.role || 'Journeyman'}</div>
                        </div>
                      </div>
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Live Shop Floor Activity */}
                    <div className={styles.liveJobBox}>
                      <div>
                        <div className={styles.detailLabel}>Assigned Unit / RO</div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <Wrench size={14} color="var(--color-primary)" />
                          {activeJob ? `${activeJob.id} · ${activeJob.unit_display || 'Truck'}` : 'No Active Job'}
                        </div>
                      </div>
                      {activeJob && (
                        <Link href={`/dashboard/jobs/${activeJob.id}`} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: '11px' }}>
                          View RO <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>

                    {/* Part Requests Alert */}
                    {techPartRequests.length > 0 && (
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={14} />
                        <span><strong>{techPartRequests.length} Part Request(s)</strong> waiting for approval</span>
                      </div>
                    )}

                    {/* Contact & Terms */}
                    <div className={styles.detailRow}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Working Terms</span>
                        <span className={styles.detailValue}>{tech.working_terms || 'Full-Time Hourly'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Hourly Rate (CAD)</span>
                        <span className={styles.detailValue} style={{ color: '#10b981' }}>
                          {formatCad(tech.hourly_pay_cad || 45.00)}/hr
                        </span>
                      </div>
                    </div>

                    {/* Address & ID Proof */}
                    <div className={styles.detailRow}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Address</span>
                        <span className={styles.detailValue} style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <MapPin size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {tech.address || 'Alberta, Canada'}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>ID Verification</span>
                        <span className={styles.detailValue} style={{ fontSize: '11px', color: '#3b82f6' }}>
                          <ShieldCheck size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {tech.id_proof_number ? `${tech.id_proof_type || 'DL'} (${tech.id_proof_number})` : 'Verified'}
                        </span>
                      </div>
                    </div>

                    {/* Canadian Bank Direct Deposit */}
                    <div className={styles.bankBox}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Building2 size={12} /> {tech.bank_name || 'RBC Royal Bank'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>Direct Deposit</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        <div>Inst: <strong>{tech.institution_number || '003'}</strong></div>
                        <div>Transit: <strong>{tech.transit_number || '•••••'}</strong></div>
                        <div>Acct: <strong>{maskAccount(tech.account_number)}</strong></div>
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text)' }}>
                        <span>Pay Schedule: <strong>{tech.pay_frequency || 'Bi-Weekly'}</strong></span>
                        <span>Next: <strong>{tech.next_pay_date || 'Friday'}</strong></span>
                      </div>
                    </div>

                    {/* Permissions & Capabilities Pills */}
                    <div style={{ backgroundColor: 'var(--color-bg)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '11px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={13} color="var(--color-primary)" /> Bay Authorization Permissions
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: '600',
                          backgroundColor: (tech.can_create_estimates ?? true) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: (tech.can_create_estimates ?? true) ? '#10b981' : '#ef4444'
                        }}>
                          {(tech.can_create_estimates ?? true) ? '✓ Estimates: Allowed' : '✕ Estimates: Disabled'}
                        </span>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: '600',
                          backgroundColor: (tech.can_approve_estimates ?? false) ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: (tech.can_approve_estimates ?? false) ? '#3b82f6' : '#f59e0b'
                        }}>
                          {(tech.can_approve_estimates ?? false) ? '✓ Est Approval: Direct' : '⚡ Est Approval: Needs Owner'}
                        </span>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: '600',
                          backgroundColor: (tech.can_create_work_orders ?? false) ? 'rgba(139, 92, 246, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                          color: (tech.can_create_work_orders ?? false) ? '#8b5cf6' : '#6b7280'
                        }}>
                          {(tech.can_create_work_orders ?? false) ? '✓ Work Orders: Can Launch' : '🔒 Work Orders: Owner Only'}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.cardFooter}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        ID: <strong>{tech.id}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" onClick={() => openEditModal(tech)} style={{ padding: '4px 10px', fontSize: '12px' }}>
                          <Edit size={13} /> Edit
                        </button>
                        <button className="btn btn-outline" onClick={() => handleDeleteTech(tech.id, tech.full_name || tech.name)} style={{ padding: '4px 10px', fontSize: '12px', color: '#ef4444', borderColor: '#ef4444' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Labour & Time Tracking View */
        <div>
          {/* Labour Summary KPIs */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.blue}`}>
                <Clock size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Total Shop Hours Today</p>
                <p className={styles.kpiValue}>{totalHoursToday.toFixed(1)} hrs</p>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.green}`}>
                <CheckCircle2 size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Billable Hours</p>
                <p className={styles.kpiValue}>{billableHoursToday.toFixed(1)} hrs</p>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.purple}`}>
                <DollarSign size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Billed Labour Revenue ($ CAD)</p>
                <p className={styles.kpiValue}>{formatCad(shopLabourRevenueCad)}</p>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.amber}`}>
                <ShieldCheck size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Shop Efficiency Rating</p>
                <p className={styles.kpiValue}>{avgEfficiency}%</p>
              </div>
            </div>
          </div>

          {/* Labour Table */}
          <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden', marginTop: '1.5rem' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Technician Daily Labour & Time Log</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Clocked time vs billable hours, active work orders, and manual time adjustments
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsTimeModalOpen(true)} style={{ padding: '6px 14px', fontSize: '13px' }}>
                <Clock size={15} /> + Log Manual Time
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                    <th style={{ padding: '12px 16px' }}>Technician</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Clocked Today</th>
                    <th style={{ padding: '12px 16px' }}>Current Work Order</th>
                    <th style={{ padding: '12px 16px' }}>Billed Labour</th>
                    <th style={{ padding: '12px 16px' }}>Efficiency</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((t, idx) => {
                    const techHours = parseFloat(t.hours_today) || (6.5 + (idx * 0.5));
                    const billable = techHours * 0.9;
                    const eff = Math.round((billable / techHours) * 100);
                    const assignedJobs = workOrders.filter(wo => wo.tech_id === t.id);
                    const activeJob = assignedJobs[0] || null;

                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ display: 'block' }}>{t.full_name || t.name}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{t.tech_type || t.role || 'Mechanic'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            backgroundColor: t.status === 'repairing' || t.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : t.status === 'waiting_parts' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                            color: t.status === 'repairing' || t.status === 'active' ? '#10b981' : t.status === 'waiting_parts' ? '#f59e0b' : '#6b7280'
                          }}>
                            {t.status === 'repairing' || t.status === 'active' ? '⚡ Active' : t.status === 'waiting_parts' ? '🚨 Waiting Parts' : 'Clocked Out'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <strong>{techHours.toFixed(1)} hrs</strong>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {activeJob ? (
                            <Link href={`/dashboard/jobs/${activeJob.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}>
                              {activeJob.id} ({activeJob.unit_display || 'Truck'})
                            </Link>
                          ) : (
                            <span style={{ color: 'var(--color-text-secondary)' }}>None (Available)</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <strong>{billable.toFixed(1)} hrs</strong> (${(billable * 145).toFixed(0)} CAD)
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ color: eff >= 90 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{eff}%</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => {
                              setTimeForm(prev => ({ ...prev, techId: t.id }));
                              setIsTimeModalOpen(true);
                            }}
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            <Clock size={13} /> Adjust Time
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Shop Standard Billing Rates */}
          <div style={{ marginTop: '1.5rem', backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Standard Shop Labour Rate Schedule (Canada)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Standard Heavy-Duty Shop Rate</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '4px' }}>$145.00 CAD / hr</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>In-bay diagnostic & mechanical work</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Roadside Mobile Callout Rate</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>$185.00 CAD / hr</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Emergency field repair unit</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>After-Hours & Weekend Rate</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>$210.00 CAD / hr</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Stat holidays & night shifts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAddModalOpen || isEditModalOpen) && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Users size={20} color="var(--color-primary)" />
                {isEditModalOpen ? `Edit Technician: ${selectedTech?.full_name || selectedTech?.name}` : 'Add New Technician (Canada)'}
              </h2>
              <button className={styles.closeBtn} onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTech} className={styles.modalForm}>
              <div className={styles.modalBody}>
                {/* 1. Personal & Contact */}
                <div className={styles.sectionHeader}>
                  <FileBadge size={16} /> 1. Personal & Contact Information
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Full Legal Name *</label>
                    <input
                      type="text"
                      className={styles.input}
                      required
                      placeholder="e.g. Jean-Pierre Tremblay"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Phone Number</label>
                    <input
                      type="tel"
                      className={styles.input}
                      placeholder="e.g. (403) 555-0199"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Address</label>
                    <input
                      type="email"
                      className={styles.input}
                      placeholder="e.g. jp.tremblay@shop.ca"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>ID Proof Type</label>
                    <select
                      className={styles.select}
                      value={form.idProofType}
                      onChange={(e) => setForm({ ...form, idProofType: e.target.value })}
                    >
                      <option>Provincial Driver's License (Class 1/3/5)</option>
                      <option>Red Seal Certificate Card</option>
                      <option>Canadian Passport</option>
                      <option>Provincial ID Card</option>
                    </select>
                  </div>
                  <div className={`${styles.formGroup} ${styles.full}`}>
                    <label className={styles.label}>Canadian Residential Address</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 1044 11th Ave SW, Calgary, AB T2R 0G3"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                </div>

                {/* 2. Classification & Working Terms */}
                <div className={styles.sectionHeader}>
                  <Wrench size={16} /> 2. Classification & Working Terms
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Technician Classification / Skill</label>
                    <select
                      className={styles.select}
                      value={isCustomType ? 'CUSTOM' : form.techType}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomType(true);
                        } else {
                          setIsCustomType(false);
                          setForm({ ...form, techType: e.target.value });
                        }
                      }}
                    >
                      {STANDARD_TECH_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="CUSTOM">+ Add Custom Specialty / Classification...</option>
                    </select>
                  </div>

                  {isCustomType ? (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Specify Custom Classification *</label>
                      <input
                        type="text"
                        className={styles.input}
                        required
                        placeholder="e.g. Hydraulic Crane Specialist"
                        value={form.customType}
                        onChange={(e) => setForm({ ...form, customType: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Working Terms</label>
                      <select
                        className={styles.select}
                        value={form.workingTerms}
                        onChange={(e) => setForm({ ...form, workingTerms: e.target.value })}
                      >
                        {WORKING_TERMS.map(term => (
                          <option key={term} value={term}>{term}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Canadian Payroll Compensation ($ CAD) */}
                <div className={styles.sectionHeader}>
                  <DollarSign size={16} /> 3. Compensation & Pay Rates ($ CAD)
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Hourly Pay Rate ($ CAD/hr) *</label>
                    <input
                      type="number"
                      step="0.50"
                      className={styles.input}
                      required
                      placeholder="45.00"
                      value={form.hourlyPayCad}
                      onChange={(e) => {
                        const h = parseFloat(e.target.value) || 0;
                        setForm({
                          ...form,
                          hourlyPayCad: e.target.value,
                          overtimePayCad: (h * 1.5).toFixed(2)
                        });
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Overtime Pay Rate ($ CAD/hr)</label>
                    <input
                      type="number"
                      step="0.50"
                      className={styles.input}
                      placeholder="67.50"
                      value={form.overtimePayCad}
                      onChange={(e) => setForm({ ...form, overtimePayCad: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Shop Customer Billed Rate ($/hr)</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={form.labourRate}
                      onChange={(e) => setForm({ ...form, labourRate: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Pay Frequency</label>
                    <select
                      className={styles.select}
                      value={form.payFrequency}
                      onChange={(e) => setForm({ ...form, payFrequency: e.target.value })}
                    >
                      <option>Weekly</option>
                      <option>Bi-Weekly</option>
                      <option>Semi-Monthly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                </div>

                {/* 4. Canadian Direct Deposit Banking */}
                <div className={styles.sectionHeader}>
                  <Building2 size={16} /> 4. Canadian Direct Deposit Banking Info
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Canadian Financial Institution</label>
                    <select
                      className={styles.select}
                      value={form.bankName}
                      onChange={(e) => handleBankChange(e.target.value)}
                    >
                      {CANADIAN_BANKS.map(b => (
                        <option key={b.name} value={b.name}>
                          {b.name} ({b.inst})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Institution # (3 Digits)</label>
                    <input
                      type="text"
                      maxLength="3"
                      className={styles.input}
                      placeholder="e.g. 003"
                      value={form.institutionNumber}
                      onChange={(e) => setForm({ ...form, institutionNumber: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Transit / Branch # (5 Digits)</label>
                    <input
                      type="text"
                      maxLength="5"
                      className={styles.input}
                      placeholder="e.g. 12345"
                      value={form.transitNumber}
                      onChange={(e) => setForm({ ...form, transitNumber: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Account # (7-12 Digits)</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. 1029384"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Next Scheduled Pay Date</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={form.nextPayDate}
                      onChange={(e) => setForm({ ...form, nextPayDate: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Direct Deposit Notes</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Void cheque verified by owner"
                      value={form.directDepositNotes}
                      onChange={(e) => setForm({ ...form, directDepositNotes: e.target.value })}
                    />
                  </div>
                </div>

                {/* 5. Authorization & Bay Permission Controls */}
                <div className={styles.sectionHeader} style={{ marginTop: '1.5rem' }}>
                  <ShieldCheck size={16} /> 5. Bay Authorization & Permission Controls (Owner Configured)
                </div>
                <div style={{ backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.canCreateEstimates}
                      onChange={(e) => setForm({ ...form, canCreateEstimates: e.target.checked })}
                      style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-text)' }}>Permit Technician to Generate Estimates</strong>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Allows technician to draft diagnostic estimates and input labor hours / parts from the mobile bay dashboard.
                      </span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.canApproveEstimates}
                      onChange={(e) => setForm({ ...form, canApproveEstimates: e.target.checked })}
                      style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-text)' }}>Allow Direct Customer Dispatch / Self-Approval</strong>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        If <strong>unchecked (recommended)</strong>, estimates created by this tech require <strong>Owner Review & Approval</strong> before being sent to the customer. If checked, tech can send directly.
                      </span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.canCreateWorkOrders}
                      onChange={(e) => setForm({ ...form, canCreateWorkOrders: e.target.checked })}
                      style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-text)' }}>Permit Creating & Converting Work Orders</strong>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Allows technician to convert customer-approved estimates into active repair jobs or launch new repair work orders from the bay.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditModalOpen ? 'Save Changes' : 'Add Technician to Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}