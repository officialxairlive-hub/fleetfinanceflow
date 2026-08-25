'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { statusLabels, priorityLabels } from '../../lib/demoData';
import styles from './dispatch.module.css';
import { Search, Filter, Clock, MapPin, AlertTriangle, UserPlus, X, Wrench } from 'lucide-react';

export default function DispatchBoardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [techFilter, setTechFilter] = useState('All');
  
  const [workOrders, setWorkOrders] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const fetchDispatchData = async () => {
    setIsLoading(true);
    try {
      const [woRes, techRes, custRes] = await Promise.all([
        supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('technicians').select('*'),
        supabase.from('customers').select('*')
      ]);

      if (woRes.error) throw woRes.error;
      setWorkOrders(woRes.data || []);
      setTechnicians(techRes.data || []);
      setCustomers(custRes.data || []);
    } catch (err) {
      console.error("Error fetching dispatch board data:", err);
      setError(err.message || 'Failed to fetch dispatch data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchData();
  }, []);

  const getCustomerName = (customerId, fallbackName) => {
    if (fallbackName) return fallbackName;
    const cust = customers.find(c => c.id === customerId);
    return cust ? (cust.company || cust.company_name) : 'Unknown Customer';
  };

  const getTech = (techId, fallbackName) => {
    const found = technicians.find(t => t.id === techId);
    if (found) return found;
    if (fallbackName) return { name: fallbackName, avatar: fallbackName[0] };
    return null;
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    const custName = getCustomerName(wo.customer_id, wo.customer_name);
    const matchesSearch = (wo.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (wo.unit_display || wo.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || wo.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || wo.priority === priorityFilter;
    const matchesTech = techFilter === 'All' || (techFilter === 'Unassigned' ? !wo.tech_id : wo.tech_id === techFilter);
    return matchesSearch && matchesStatus && matchesPriority && matchesTech;
  });

  const unassignedJobs = filteredWorkOrders.filter(wo => !wo.tech_id);
  const assignedJobs = filteredWorkOrders.filter(wo => wo.tech_id);

  const handleAssignClick = (jobId) => {
    setSelectedJobId(jobId);
    setIsAssignModalOpen(true);
  };

  const handleAssignTech = async (tech) => {
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          tech_id: tech ? tech.id : null, 
          tech_name: tech ? (tech.full_name || tech.name) : null 
        })
        .eq('id', selectedJobId);

      if (error) throw error;
      
      setIsAssignModalOpen(false);
      setSelectedJobId(null);
      fetchDispatchData();
    } catch (err) {
      alert(`Error assigning technician: ${err.message}`);
    }
  };

  const renderJobCard = (wo) => {
    const tech = getTech(wo.tech_id, wo.tech_name);
    return (
      <div key={wo.id} className={styles.jobCard} data-priority={wo.priority}>
        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>WO#</span>
          <span className={styles.jobValue}>{wo.id}</span>
        </div>
        
        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Customer & Unit</span>
          <span className={styles.jobValue}>
            {getCustomerName(wo.customer_id, wo.customer_name)} - {wo.unit_display || 'Unit Pending'}
          </span>
        </div>

        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Location</span>
          <span className={styles.jobValue}>
            {wo.is_roadside ? <MapPin size={14} color="#ef4444" /> : <Wrench size={14} />}
            {wo.is_roadside ? 'Roadside' : 'Shop'}
          </span>
        </div>

        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Technician</span>
          <span className={styles.jobValue}>
            {tech ? (
              <div 
                onClick={() => handleAssignClick(wo.id)} 
                title="Click to reassign or unassign technician"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'var(--color-surface)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
              >
                <div className={styles.techAvatar}>
                  {tech.avatar || (tech.name || 'T')[0]}
                </div>
                <span>{tech.full_name || tech.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--color-primary)', marginLeft: '4px', textDecoration: 'underline' }}>Change</span>
              </div>
            ) : (
              <button 
                className={`btn btn-sm btn-outline`} 
                onClick={() => handleAssignClick(wo.id)}
                style={{ padding: '4px 8px', fontSize: '12px', height: 'auto' }}
              >
                <UserPlus size={14} style={{ marginRight: '4px' }}/> Assign
              </button>
            )}
          </span>
        </div>

        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Status</span>
          <span className={styles.jobValue}>
            <span className={`${styles.statusPill} ${styles['status-' + wo.status]}`}>
              {(statusLabels[wo.status] || {}).label || wo.status}
            </span>
          </span>
        </div>

        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Priority</span>
          <span className={`${styles.jobValue} ${styles['priority-' + wo.priority]}`}>
            {wo.priority === 'emergency' && <AlertTriangle size={14} />}
            {(priorityLabels[wo.priority] || {}).label || wo.priority}
          </span>
        </div>

        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Timer / ETA</span>
          <span className={styles.jobValue}>
            <Clock size={14} />
            {(wo.created_at || '').split('T')[1]?.slice(0,5) || 'Pending'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dispatch Board</h1>
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search WO, Customer, Unit..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {Object.entries(statusLabels).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
          </select>
          <select 
            className={styles.select}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            {Object.entries(priorityLabels).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
          </select>
          <select 
            className={styles.select}
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
          >
            <option value="All">All Technicians</option>
            <option value="Unassigned">Unassigned</option>
            {technicians.map(t => <option key={t.id} value={t.id}>{t.full_name || t.name}</option>)}
          </select>
        </div>
      </header>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading dispatch board data from Supabase...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>{error}</div>
      ) : (
        <main className={styles.mainContent}>
          <div className={styles.boardArea}>
            {unassignedJobs.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  <AlertTriangle size={20} color="#f97316" /> Unassigned Jobs
                  <span className={styles.badge}>{unassignedJobs.length}</span>
                </h2>
                <div className={styles.jobList}>
                  {unassignedJobs.map(renderJobCard)}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Wrench size={20} /> Active Assignments
                <span className={styles.badge}>{assignedJobs.length}</span>
              </h2>
              <div className={styles.jobList}>
                {assignedJobs.length > 0 ? assignedJobs.map(renderJobCard) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No active assigned jobs.</div>
                )}
              </div>
            </div>
          </div>

          <aside className={styles.sidePanel}>
            <div className={styles.sideHeader}>
              <h2>Technician Availability</h2>
            </div>
            <div className={styles.techList}>
              {technicians.map(tech => {
                const currentJobs = workOrders.filter(wo => wo.tech_id === tech.id && (wo.status === 'repairing' || wo.status === 'diagnosing'));
                const status = currentJobs.length > 0 ? 'active' : 'available';
                return (
                  <div key={tech.id} className={styles.techCard} onClick={() => isAssignModalOpen && handleAssignTech(tech)}>
                    <div className={styles.techHeader}>
                      <div className={styles.techName}>
                        <div className={styles.techAvatar}>
                          {(tech.name || 'T')[0]}
                        </div>
                        {tech.full_name || tech.name}
                      </div>
                      <span className={`${styles.techStatus} ${styles[status]}`}>
                        {status}
                      </span>
                    </div>
                    {currentJobs.length > 0 && (
                      <div className={styles.techJob}>
                        Current: {currentJobs[0].id} ({currentJobs[0].unit_display})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </main>
      )}

      {isAssignModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Assign Technician</h2>
              <button className={styles.closeBtn} onClick={() => setIsAssignModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{marginBottom: '1rem'}}>Select a technician from the list below to assign to <strong>{selectedJobId}</strong>:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {technicians.map(t => (
                <button key={t.id} className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => handleAssignTech(t)}>
                  <UserPlus size={16} /> {t.full_name || t.name} ({t.role || 'Mechanic'})
                </button>
              ))}
              <button 
                className="btn btn-outline" 
                style={{ justifyContent: 'flex-start', color: '#ef4444', borderColor: '#ef4444' }} 
                onClick={() => handleAssignTech(null)}
              >
                <X size={16} /> Unassign (Leave Vacant)
              </button>
            </div>
            <div className={styles.controls} style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
               <button className="btn btn-outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
