'use client';

import React, { useState } from 'react';
import { workOrders, technicians, customers, statusLabels, priorityLabels } from '../../lib/demoData';
import styles from './dispatch.module.css';
import { Search, Filter, Clock, MapPin, AlertTriangle, UserPlus, X, Wrench } from 'lucide-react';

export default function DispatchBoardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [techFilter, setTechFilter] = useState('All');
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Helper to get customer name
  const getCustomerName = (customerId) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? cust.company : 'Unknown';
  };

  // Helper to get tech
  const getTech = (techId) => {
    return technicians.find(t => t.id === techId);
  };

  // Filter work orders
  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesSearch = wo.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          getCustomerName(wo.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (wo.unitDisplay || wo.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || wo.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || wo.priority === priorityFilter;
    const matchesTech = techFilter === 'All' || (techFilter === 'Unassigned' ? !wo.techId : wo.techId === techFilter);
    return matchesSearch && matchesStatus && matchesPriority && matchesTech;
  });

  const unassignedJobs = filteredWorkOrders.filter(wo => !wo.techId);
  const assignedJobs = filteredWorkOrders.filter(wo => wo.techId);

  const handleAssignClick = (jobId) => {
    setSelectedJobId(jobId);
    setIsAssignModalOpen(true);
  };

  const handleAssignTech = (techId) => {
    alert(`Assigned Tech ${techId} to Job ${selectedJobId}`);
    setIsAssignModalOpen(false);
    setSelectedJobId(null);
  };

  const renderJobCard = (wo) => {
    const tech = getTech(wo.techId);
    return (
      <div key={wo.id} className={styles.jobCard} data-priority={wo.priority}>
        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>WO#</span>
          <span className={styles.jobValue}>{wo.id}</span>
        </div>
        
        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Customer & Unit</span>
          <span className={styles.jobValue}>
            {getCustomerName(wo.customerId)} - Unit {(wo.unitDisplay || wo.id)}
          </span>
        </div>

        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Location</span>
          <span className={styles.jobValue}>
            {wo.isRoadside ? <MapPin size={14} color="#ef4444" /> : <Wrench size={14} />}
            {wo.isRoadside ? 'Roadside' : 'Shop'}
          </span>
        </div>

        <div className={styles.jobCell}>
          <span className={styles.jobLabel}>Technician</span>
          <span className={styles.jobValue}>
            {tech ? (
              <>
                <div className={styles.techAvatar}>
                  {tech.avatar}
                </div>
                {tech.name}
              </>
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
            {(wo.createdAt || '').split('T')[1]?.slice(0,5) || 'Pending'}
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
            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </header>

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
              {assignedJobs.map(renderJobCard)}
            </div>
          </div>
        </div>

        <aside className={styles.sidePanel}>
          <div className={styles.sideHeader}>
            <h2>Technician Availability</h2>
          </div>
          <div className={styles.techList}>
            {technicians.map(tech => {
              // rough mock status based on currently assigned jobs
              const currentJobs = workOrders.filter(wo => wo.techId === tech.id && (wo.status === 'repairing' || wo.status === 'diagnosing'));
              const status = currentJobs.length > 0 ? 'active' : 'available';
              return (
                <div key={tech.id} className={styles.techCard} onClick={() => isAssignModalOpen && handleAssignTech(tech.id)}>
                  <div className={styles.techHeader}>
                    <div className={styles.techName}>
                      <div className={styles.techAvatar}>
                        {tech.avatar}
                      </div>
                      {tech.name}
                    </div>
                    <span className={`${styles.techStatus} ${styles[status]}`}>
                      {status}
                    </span>
                  </div>
                  {currentJobs.length > 0 && (
                    <div className={styles.techJob}>
                      Current: {currentJobs[0].id} ({currentJobs[0].unitDisplay})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </main>

      {isAssignModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Assign Technician</h2>
              <button className={styles.closeBtn} onClick={() => setIsAssignModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <p>Select a technician from the availability panel to assign to <strong>{selectedJobId}</strong>.</p>
            <div className={styles.controls} style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
               <button className="btn btn-outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
