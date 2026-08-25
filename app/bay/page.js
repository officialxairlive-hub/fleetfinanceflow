'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Logo from '../components/Logo';
import {
  Play,
  Pause,
  CheckCircle,
  Camera,
  Package,
  FileText,
  Clock,
  Wrench,
  User,
  LogOut,
  ChevronRight,
  Upload,
  AlertCircle,
  Truck,
  Plus,
  Receipt,
  DollarSign,
  X
} from 'lucide-react';
import styles from './bay.module.css';

const ALL_STATUSES = [
  { id: 'new', label: 'New', color: '#3B82F6' },
  { id: 'diagnosing', label: 'Diagnosing', color: '#F59E0B' },
  { id: 'waiting_parts', label: 'Waiting Parts', color: '#EF4444' },
  { id: 'repairing', label: 'In Progress', color: '#10B981' },
  { id: 'completed', label: 'Completed', color: '#6366F1' },
  { id: 'ready_to_invoice', label: 'Ready to Invoice', color: '#8B5CF6' },
  { id: 'invoiced', label: 'Invoiced', color: '#06B6D4' },
  { id: 'paid', label: 'Paid', color: '#059669' }
];

export default function TechBayPage() {
  const router = useRouter();

  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([
    'Replaced left front brake rotor. Verified torque specs at 165 ft-lbs.',
    'Brake pad wear logged at 15%. Cleaned caliper bracket assemblies.'
  ]);

  const [activeJob, setActiveJob] = useState(null);
  const [assignedQueue, setAssignedQueue] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const [partsModalMode, setPartsModalMode] = useState('stock'); // 'stock' | 'special_order'
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [specialPartForm, setSpecialPartForm] = useState({
    partName: '',
    partNumber: '',
    quantity: '1',
    urgency: 'Standard',
    notes: ''
  });

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  const fetchTechJobs = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      const [profileRes, woRes, partsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('parts').select('*')
      ]);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);
      setAvailableParts(partsRes.data || []);

      const data = woRes.data || [];
      
      // Find a repairing/diagnosing or first active job
      const repairing = data.find(wo => ['repairing', 'diagnosing', 'waiting_parts', 'new'].includes(wo.status));
      if (repairing) {
        setActiveJob(repairing);
        setSeconds(repairing.timer || 0);
        setPaymentAmount(repairing.estimated_cost || 500);
      }

      const queue = data.filter(wo => wo.id !== (repairing?.id));
      setAssignedQueue(queue);
    } catch (err) {
      console.error("Error fetching tech jobs:", err);
      setError(err.message || 'Failed to fetch data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTechJobs();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && activeJob && activeJob.status !== 'completed' && activeJob.status !== 'invoiced' && activeJob.status !== 'paid') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeJob]);

  const formatTimer = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleTimer = async () => {
    const nextState = !isTimerRunning;
    setIsTimerRunning(nextState);
    if (activeJob) {
      try {
        await supabase.from('work_orders').update({ timer: seconds }).eq('id', activeJob.id);
      } catch (err) {
        console.error("Error saving timer:", err);
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeJob) return;
    try {
      setActiveJob(prev => ({ ...prev, status: newStatus }));
      await supabase.from('work_orders').update({
        status: newStatus,
        timer: seconds
      }).eq('id', activeJob.id);
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleStartJob = async (job) => {
    try {
      if (activeJob) {
        await supabase.from('work_orders').update({ timer: seconds }).eq('id', activeJob.id);
      }

      const newStatus = 'repairing';
      await supabase.from('work_orders').update({
        status: newStatus
      }).eq('id', job.id);

      setActiveJob({ ...job, status: newStatus });
      setSeconds(job.timer || 0);
      setIsTimerRunning(true);
      setAssignedQueue(prev => prev.filter(item => item.id !== job.id));
    } catch (err) {
      alert(`Error starting job: ${err.message}`);
    }
  };

  const handleCreateInvoice = async () => {
    if (!activeJob) return;
    try {
      const invId = `INV-${activeJob.id.replace('WO-', '')}`;
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

      const est = activeJob.estimated_cost || 650;
      await supabase.from('invoices').upsert([{
        id: invId,
        customer_id: activeJob.customer_id,
        work_order_id: activeJob.id,
        total: est,
        tax_amount: est * 0.1,
        labour_total: est * 0.5,
        parts_total: est * 0.4,
        shop_supplies: est * 0.05,
        status: 'draft',
        issue_date: today,
        due_date: dueDate
      }]);

      await handleStatusChange('invoiced');
      alert(`Invoice #${invId} created successfully!`);
    } catch (err) {
      alert(`Error creating invoice: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!activeJob) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('invoices').update({
        status: 'paid',
        paid_date: today
      }).eq('work_order_id', activeJob.id);

      await handleStatusChange('paid');
      setShowPaymentModal(false);
      alert(`Payment of $${paymentAmount} recorded via ${paymentMethod}!`);
    } catch (err) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const handleAddPartToJob = async (e) => {
    e.preventDefault();
    if (!selectedPartId || !activeJob) return;

    const partObj = availableParts.find(p => p.id === selectedPartId);
    if (!partObj) return;

    const newPartLine = {
      id: partObj.id,
      partNumber: partObj.part_number,
      description: partObj.description,
      quantity: parseInt(partQty) || 1,
      sellPrice: partObj.sell_price || 45
    };

    const currentParts = activeJob.parts || [];
    const updatedParts = [...currentParts, newPartLine];

    try {
      await supabase.from('work_orders').update({
        parts: updatedParts
      }).eq('id', activeJob.id);

      setActiveJob(prev => ({ ...prev, parts: updatedParts }));
      setShowPartsModal(false);
      setSelectedPartId('');
      setPartQty(1);
      alert(`Part ${partObj.part_number} added to Repair Order!`);
    } catch (err) {
      alert(`Error adding part: ${err.message}`);
    }
  };

  const handleRequestSpecialPart = async (e) => {
    e.preventDefault();
    if (!specialPartForm.partName.trim() || !activeJob) return;

    const newReqId = `REQ-${Date.now().toString().slice(-6)}`;
    const requestedPartLine = {
      id: newReqId,
      partNumber: specialPartForm.partNumber || 'SPECIAL-ORDER',
      description: `[SPECIAL ORDER - ${specialPartForm.urgency}]: ${specialPartForm.partName}`,
      quantity: parseInt(specialPartForm.quantity) || 1,
      sellPrice: 0,
      isRequested: true,
      notes: specialPartForm.notes || null
    };

    const currentParts = activeJob.parts || [];
    const updatedParts = [...currentParts, requestedPartLine];

    try {
      // 1. Try writing to part_requests table if it exists
      await supabase
        .from('part_requests')
        .insert([{
          id: newReqId,
          work_order_id: activeJob.id,
          unit_display: activeJob.unit_display || activeJob.id,
          part_name: specialPartForm.partName,
          part_number: specialPartForm.partNumber || null,
          quantity: parseInt(specialPartForm.quantity) || 1,
          urgency: specialPartForm.urgency,
          requested_by: profile?.full_name || 'Mechanic',
          notes: specialPartForm.notes || null,
          status: 'pending'
        }]);
    } catch (err) {
      console.warn("part_requests table not yet created, saving to RO directly:", err);
    }

    try {
      // 2. Save directly to the work order's parts array and update status to waiting_parts
      await supabase
        .from('work_orders')
        .update({
          parts: updatedParts,
          status: 'waiting_parts'
        })
        .eq('id', activeJob.id);

      setActiveJob(prev => ({
        ...prev,
        parts: updatedParts,
        status: 'waiting_parts'
      }));

      setShowPartsModal(false);
      setSpecialPartForm({
        partName: '',
        partNumber: '',
        quantity: '1',
        urgency: 'Standard',
        notes: ''
      });
      alert(`Special Part Request sent to Shop Manager! RO status updated to "Waiting Parts".`);
    } catch (err) {
      alert(`Error updating work order: ${err.message}`);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setSavedNotes([notes, ...savedNotes]);
    
    if (activeJob) {
      try {
        await supabase.from('work_orders').update({
          correction: notes
        }).eq('id', activeJob.id);
      } catch (err) {
        console.error("Error saving work note:", err);
      }
    }
    setNotes('');
  };

  return (
    <div className={styles.bayContainer}>
      {/* Top Tech Header Bar */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link href="/">
            <Logo size="small" showText={true} />
          </Link>

          <div className={styles.techProfileBox}>
            <div className={styles.avatar}>{(profile?.full_name || 'M')[0]}</div>
            <div>
              <div className={styles.techName}>{profile?.full_name || 'Mechanic'}</div>
              <div className={styles.shiftStatus}>
                <span className={styles.shiftDot} /> Clocked In · {profile?.role || 'Mechanic'}
              </div>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className={styles.logoutBtn} title="End Shift & Log Out" style={{background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer'}}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Bay Content */}
      <main className={styles.mainContent}>
        <div className="container">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
              Loading assigned jobs from Supabase...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <>
              {/* Active Job Hero Card */}
              {activeJob ? (
                <div className={styles.activeJobCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.roBadge}>CURRENT REPAIR ORDER · #{activeJob.id}</div>
                    
                    {/* Live Status Selector for all 8 states */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Status:</label>
                      <select
                        value={activeJob.status || 'new'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                          fontWeight: '600',
                          fontSize: '12px',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s.id} value={s.id} style={{ color: '#000' }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.truckTitleRow}>
                    <div>
                      <h1 className={styles.truckName}>{activeJob.unit_display || 'Unknown Unit'}</h1>
                      <p className={styles.fleetCustomer}>Fleet: {activeJob.customer_name || 'Unknown Customer'} · RO Created: {new Date(activeJob.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Status Progression Bar */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    margin: '12px 0 16px 0',
                    padding: '8px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)'
                  }}>
                    {ALL_STATUSES.map((step) => {
                      const isActive = activeJob.status === step.id;
                      return (
                        <button
                          key={step.id}
                          onClick={() => handleStatusChange(step.id)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: isActive ? '700' : '500',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: isActive ? step.color : 'transparent',
                            backgroundColor: isActive ? step.color : 'transparent',
                            color: isActive ? '#fff' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.issueBox}>
                    <Wrench size={18} className={styles.issueIcon} />
                    <span><strong>Job Description:</strong> {activeJob.complaint || 'No complaint specified'}</span>
                  </div>

                  {/* Parts on this RO */}
                  {activeJob.parts && activeJob.parts.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: 'var(--color-surface)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                      <strong style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={14} color="var(--color-primary)" /> Parts Logged on RO ({activeJob.parts.length}):
                      </strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                        {activeJob.parts.map((p, i) => (
                          <span key={i} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                            {p.partNumber || p.description} (x{p.quantity || 1})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Big Touch Job Timer */}
                  <div className={styles.timerContainer}>
                    <div className={styles.timerLabel}>JOB CLOCK TIMER</div>
                    <div className={styles.timerClock}>{formatTimer(seconds)}</div>
                    
                    <div className={styles.timerControls}>
                      <button
                        onClick={toggleTimer}
                        className={`${styles.timerControlBtn} ${isTimerRunning ? styles.pauseBtn : styles.playBtn}`}
                      >
                        {isTimerRunning ? (
                          <>
                            <Pause size={20} />
                            <span>Pause Timer</span>
                          </>
                        ) : (
                          <>
                            <Play size={20} />
                            <span>Resume Work</span>
                          </>
                        )}
                      </button>

                      {/* Invoice & Payment Quick Actions */}
                      {['completed', 'ready_to_invoice'].includes(activeJob.status) && (
                        <button
                          onClick={handleCreateInvoice}
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Receipt size={18} />
                          <span>Generate Invoice</span>
                        </button>
                      )}

                      {activeJob.status === 'invoiced' && (
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#059669', borderColor: '#059669' }}
                        >
                          <DollarSign size={18} />
                          <span>Collect Payment</span>
                        </button>
                      )}

                      {activeJob.status === 'paid' && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 'bold' }}>
                          <CheckCircle size={20} /> Paid in Full
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.activeJobCard} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 1rem auto' }} />
                  <h2>All Caught Up!</h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>You have no active repair orders in your bay. Select a job from the queue below to start working.</p>
                </div>
              )}

              {/* Quick Bay Action Tools */}
              <div className={styles.toolsGrid}>
                <button onClick={() => setShowPhotoModal(true)} className={styles.toolBtn}>
                  <div className={styles.toolIconWrapper}>
                    <Camera size={22} />
                  </div>
                  <div>
                    <div className={styles.toolTitle}>Attach Repair Photo</div>
                    <div className={styles.toolDesc}>Upload inspection or defect shots</div>
                  </div>
                </button>

                <button onClick={() => setShowPartsModal(true)} className={styles.toolBtn}>
                  <div className={styles.toolIconWrapper}>
                    <Package size={22} />
                  </div>
                  <div>
                    <div className={styles.toolTitle}>Request & Add Parts</div>
                    <div className={styles.toolDesc}>Pick parts from stock to add to RO</div>
                  </div>
                </button>

                <button onClick={() => alert('Work notes can be typed directly into the Repair Work Log below.')} className={styles.toolBtn}>
                  <div className={styles.toolIconWrapper}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className={styles.toolTitle}>Log Work Notes</div>
                    <div className={styles.toolDesc}>Attach repair summary for customer</div>
                  </div>
                </button>
              </div>

              {/* Dual Bay Layout: Work Queue + Repair Notes */}
              <div className={styles.bayLayoutGrid}>
                {/* Left Column: Work Notes Log */}
                <div className={styles.notesCard}>
                  <h2 className={styles.sectionTitle}>Repair Work Log</h2>
                  
                  <form onSubmit={handleAddNote} className={styles.noteForm}>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Type repair notes or specs (e.g. Torque verified at 165 ft-lbs)..."
                      className={styles.noteInput}
                    />
                    <button type="submit" className="btn btn-primary">
                      Add Note
                    </button>
                  </form>

                  <div className={styles.savedNotesList}>
                    {savedNotes.map((noteText, idx) => (
                      <div key={idx} className={styles.noteItem}>
                        <CheckCircle size={16} className={styles.noteCheckIcon} />
                        <span>{noteText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Assigned Bay Queue */}
                <div className={styles.queueCard}>
                  <h2 className={styles.sectionTitle}>Assigned Truck Queue ({assignedQueue.length})</h2>
                  
                  <div className={styles.queueList}>
                    {assignedQueue.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                        No other jobs in queue.
                      </div>
                    ) : (
                      assignedQueue.map((item) => (
                        <div key={item.id} className={styles.queueItem}>
                          <div className={styles.queueHeader}>
                            <span className={styles.queueUnit}>{item.unit_display || item.id}</span>
                            <span className={styles.priorityBadge}>{item.status || 'Normal'}</span>
                          </div>
                          <div className={styles.queueCustomer}>{item.customer_name}</div>
                          <div className={styles.queueIssue}>{item.complaint}</div>
                          <div className={styles.queueFooter}>
                            <span className={styles.queueEst}>Est: ${item.estimated_cost || 0}</span>
                            <button className={styles.startJobBtn} onClick={() => handleStartJob(item)}>Start Job →</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Parts Request & Add Modal */}
      {showPartsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPartsModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className={styles.modalHeader}>
              <h3>Parts Management · RO #{activeJob?.id}</h3>
              <button onClick={() => setShowPartsModal(false)} className={styles.closeModalBtn}>✕</button>
            </div>
            
            {/* Modal Mode Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', margin: '10px 0 16px 0' }}>
              <button
                type="button"
                onClick={() => setPartsModalMode('stock')}
                style={{
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: partsModalMode === 'stock' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: partsModalMode === 'stock' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: partsModalMode === 'stock' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                📦 Pick From In-Stock Parts
              </button>
              <button
                type="button"
                onClick={() => setPartsModalMode('special_order')}
                style={{
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  borderBottom: partsModalMode === 'special_order' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  color: partsModalMode === 'special_order' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontWeight: partsModalMode === 'special_order' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🚨 Request Special Order / Non-Stock
              </button>
            </div>

            {partsModalMode === 'stock' ? (
              <form onSubmit={handleAddPartToJob} style={{ padding: '0.5rem 0' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Select Part from Stock</label>
                  <select 
                    value={selectedPartId} 
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Choose a part SKU...</option>
                    {availableParts.map(p => (
                      <option key={p.id} value={p.id} style={{ color: '#000' }}>
                        {p.part_number} - {p.description} (${p.sell || p.price || 0}) [Stock: {p.qty_on_hand || 0}]
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={partQty} 
                    onChange={(e) => setPartQty(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowPartsModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Part to Work Order</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRequestSpecialPart} style={{ padding: '0.5rem 0' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Part Name / Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cummins ISX Fuel Pressure Relief Valve"
                    value={specialPartForm.partName}
                    onChange={(e) => setSpecialPartForm({ ...specialPartForm, partName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>OEM / Part # (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 4307399"
                      value={specialPartForm.partNumber}
                      onChange={(e) => setSpecialPartForm({ ...specialPartForm, partNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Quantity Needed</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={specialPartForm.quantity}
                      onChange={(e) => setSpecialPartForm({ ...specialPartForm, quantity: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Urgency Level</label>
                  <select
                    value={specialPartForm.urgency}
                    onChange={(e) => setSpecialPartForm({ ...specialPartForm, urgency: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="Standard">Standard (Normal PM / Next Day)</option>
                    <option value="Urgent / Truck Down">🚨 Urgent / Truck Down in Bay</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Special Instructions / Supplier Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Needs to be OEM Cummins, not aftermarket"
                    value={specialPartForm.notes}
                    onChange={(e) => setSpecialPartForm({ ...specialPartForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowPartsModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}>
                    Send Order Request to Manager
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className={styles.modalHeader}>
              <h3>Collect Payment for RO #{activeJob?.id}</h3>
              <button onClick={() => setShowPaymentModal(false)} className={styles.closeModalBtn}>✕</button>
            </div>
            
            <form onSubmit={handleRecordPayment} style={{ padding: '1rem 0' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="Credit Card">Credit Card (POS Terminal)</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="EFT / Direct Deposit">EFT / Direct Deposit</option>
                  <option value="Cheque">Company Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPhotoModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Attach Repair Photo to RO #{activeJob?.id || 'Unknown'}</h3>
              <button onClick={() => setShowPhotoModal(false)} className={styles.closeModalBtn}>✕</button>
            </div>
            
            <div className={styles.uploadArea}>
              <Camera size={40} className={styles.uploadIcon} />
              <p>Tap to take photo or upload image file</p>
              <input type="file" accept="image/*" capture="environment" className={styles.fileInput} />
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => { alert('Photo attached to Repair Order!'); setShowPhotoModal(false); }} className="btn btn-primary" style={{ width: '100%' }}>
                Save Photo to RO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
