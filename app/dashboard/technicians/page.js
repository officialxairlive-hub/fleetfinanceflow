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
  const [selectedTech, setSelectedTech] = useState(null);
  const [isCustomType, setIsCustomType] = useState(false);

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
    directDepositNotes: 'Void cheque on file'
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
      directDepositNotes: 'Void cheque on file'
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
      directDepositNotes: tech.direct_deposit_notes || 'Void cheque on file'
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
        direct_deposit_notes: form.directDepositNotes
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
        alert(`Technician ${form.fullName} added to the shop team!`);
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
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

  // KPIs
  const totalTechs = technicians.length;
  const clockedInTechs = technicians.filter(t => t.status && t.status !== 'off').length;
  const activeRepairingTechs = technicians.filter(t => t.status === 'repairing' || t.status === 'active').length;
  const totalPayrollLiabilityCad = technicians.reduce((sum, t) => {
    const rate = parseFloat(t.hourly_pay_cad) || 45;
    const hours = (t.stats?.hoursThisWeek) || 37.5;
    return sum + (rate * hours);
  }, 0);

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
          <h1 className={styles.title}>Technicians & Team Management</h1>
          <p className={styles.subtitle}>
            Live shop floor synchronization, Canadian payroll & direct deposit banking, and technician skill profiles.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <UserPlus size={18} />
          Add New Technician
        </button>
      </header>

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
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Phone</span>
                    <span className={styles.detailValue}>{tech.phone || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Shop Billed Rate</span>
                    <span className={styles.detailValue}>{formatCad(tech.labour_rate || 145.00)}/hr</span>
                  </div>
                </div>

                {/* Canadian Direct Deposit Banking */}
                <div className={styles.bankBox}>
                  <div className={styles.bankTitle}>
                    <Building2 size={14} />
                    <span>Canadian Direct Deposit · {tech.bank_name || 'Bank'}</span>
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

      {/* Add / Edit Technician Modal */}
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
            
            <form onSubmit={handleSaveTech}>
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