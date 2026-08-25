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
  Calculator,
  ExternalLink,
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
  const [showTechProfileModal, setShowTechProfileModal] = useState(false);
  
  // Estimate & WO Modals State
  const [showCreateEstimateModal, setShowCreateEstimateModal] = useState(false);
  const [showCreateWoModal, setShowCreateWoModal] = useState(false);
  const [savingEstimate, setSavingEstimate] = useState(false);
  const [savingWo, setSavingWo] = useState(false);
  
  const [estimateForm, setEstimateForm] = useState({
    customerId: '',
    unitId: '',
    description: '',
    labourHours: '2.5',
    labourRate: '145.00',
    partsAmount: '0',
    notes: 'Valid for 14 days'
  });

  const [newWoForm, setNewWoForm] = useState({
    customerId: '',
    unitId: '',
    complaint: '',
    cause: '',
    correction: '',
    priority: 'normal'
  });

  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([
    'Replaced left front brake rotor. Verified torque specs at 165 ft-lbs.',
    'Brake pad wear logged at 15%. Cleaned caliper bracket assemblies.'
  ]);

  const [activeJob, setActiveJob] = useState(null);
  const [assignedQueue, setAssignedQueue] = useState([]);
  const [allWorkOrders, setAllWorkOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [units, setUnits] = useState([]);
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
  const [techDetails, setTechDetails] = useState(null);

  const syncTechStatus = async (status, job) => {
    try {
      if (profile?.full_name || profile?.email) {
        await supabase
          .from('technicians')
          .update({
            status: status || 'active',
            active_job: job?.id || null,
            active_job_status: job?.status || status,
            last_heartbeat: new Date().toISOString()
          })
          .or(`full_name.ilike.%${profile?.full_name}%,name.ilike.%${profile?.full_name}%`);
      }
    } catch (err) {
      console.warn("Tech status sync:", err);
    }
  };

  const fetchTechJobs = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        router.push('/login');
        return;
      }

      const [profileRes, woRes, partsRes, techRes, custRes, unitRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('parts').select('*'),
        supabase.from('technicians').select('*'),
        supabase.from('customers').select('*').order('company'),
        supabase.from('units').select('*').order('unit_number')
      ]);

      if (profileRes.error) throw profileRes.error;
      const userProfile = profileRes.data;
      setProfile(userProfile);
      setAvailableParts(partsRes.data || []);
      setCustomers(custRes.data || []);
      setUnits(unitRes.data || []);

      // Find matching technician record for payroll and permissions
      const allTechs = techRes.data || [];
      const matchedTech = allTechs.find(t => 
        (t.email && t.email.toLowerCase() === session.user.email?.toLowerCase()) ||
        (t.full_name && t.full_name.toLowerCase() === userProfile.full_name?.toLowerCase()) ||
        (t.name && userProfile.full_name?.toLowerCase().includes(t.name.toLowerCase()))
      ) || allTechs[0] || null;

      setTechDetails(matchedTech);

      const data = woRes.data || [];
      setAllWorkOrders(data);
      
      // Find a repairing/diagnosing or first active job
      const repairing = data.find(wo => ['repairing', 'diagnosing', 'waiting_parts', 'new'].includes(wo.status));
      if (repairing) {
        setActiveJob(repairing);
        setSeconds(repairing.timer || 0);
        setPaymentAmount(repairing.estimated_cost || 500);
        syncTechStatus(repairing.status === 'repairing' ? 'repairing' : 'active', repairing);
      } else {
        syncTechStatus('active', null);
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

  const handleCopyCustomerLink = (woId) => {
    const link = `${window.location.origin}/approve/${woId}`;
    navigator.clipboard?.writeText(link);
    alert(`📋 Live Customer Link Copied to Clipboard:\n${link}\n\nYou can SMS/text or email this to the customer.`);
  };

  const handleCreateTechEstimate = async (e) => {
    e.preventDefault();
    if (!estimateForm.customerId || !estimateForm.description.trim()) {
      alert('Please select a customer and provide a description.');
      return;
    }

    const canCreate = techDetails?.can_create_estimates ?? true;
    if (!canCreate) {
      alert('⚠️ You do not have owner permission to generate estimates. Please contact shop management.');
      return;
    }

    const canApprove = techDetails?.can_approve_estimates ?? false;
    const techName = techDetails?.full_name || profile?.full_name || 'Mechanic';

    setSavingEstimate(true);
    try {
      const cust = customers.find(c => c.id === estimateForm.customerId);
      const selectedUnit = units.find(u => u.id === estimateForm.unitId);
      
      const newWoId = `WO-${Date.now().toString().slice(-4)}`;
      const hoursNum = parseFloat(estimateForm.labourHours) || 0;
      const rateNum = parseFloat(estimateForm.labourRate) || 145.00;
      const partsNum = parseFloat(estimateForm.partsAmount) || 0;
      
      const labourTotal = hoursNum * rateNum;
      const supplies = Math.min((labourTotal + partsNum) * 0.05, 50);
      const subtotal = labourTotal + partsNum + supplies;
      const total = subtotal * 1.05;

      const payload = {
        id: newWoId,
        customer_id: estimateForm.customerId,
        customer_name: cust ? (cust.company || cust.company_name) : 'Fleet Customer',
        unit_id: estimateForm.unitId || null,
        unit_display: selectedUnit ? `#${selectedUnit.unit_number} - ${selectedUnit.make} ${selectedUnit.model}` : 'Shop Unit',
        complaint: estimateForm.description,
        tech_id: techDetails?.id || null,
        tech_name: techName,
        status: canApprove ? 'diagnosing' : 'pending_owner_approval',
        estimated_cost: total,
        customer_notes: estimateForm.notes,
        labour: [{
          description: estimateForm.description,
          hours: hoursNum,
          rate: rateNum,
          technician: techName
        }],
        parts: partsNum > 0 ? [{
          partNumber: 'EST-PARTS',
          description: 'Estimated replacement parts & materials',
          quantity: 1,
          sellPrice: partsNum,
          cost: partsNum * 0.7
        }] : []
      };

      const { error: insertErr } = await supabase.from('work_orders').insert([payload]);
      if (insertErr) throw insertErr;

      if (canApprove) {
        const liveLink = `${window.location.origin}/approve/${newWoId}`;
        navigator.clipboard?.writeText(liveLink);
        alert(`✅ Estimate #${newWoId.replace('WO-', 'EST-')} created and sent to customer!\n\nLive Approval Link copied:\n${liveLink}`);
      } else {
        alert(`✅ Estimate #${newWoId.replace('WO-', 'EST-')} drafted successfully!\n\n📋 Submitted for Shop Owner Review before sending to customer.`);
      }

      setShowCreateEstimateModal(false);
      setEstimateForm({
        customerId: '',
        unitId: '',
        description: '',
        labourHours: '2.5',
        labourRate: '145.00',
        partsAmount: '0',
        notes: 'Valid for 14 days'
      });
      fetchTechJobs();
    } catch (err) {
      alert(`Error creating estimate: ${err.message}`);
    } finally {
      setSavingEstimate(false);
    }
  };

  const handleCreateTechWorkOrder = async (e) => {
    e.preventDefault();
    const canCreateWo = techDetails?.can_create_work_orders ?? false;
    if (!canCreateWo) {
      alert('⚠️ You do not have owner permission to create new work orders directly. Please ask the shop manager.');
      return;
    }

    setSavingWo(true);
    try {
      const cust = customers.find(c => c.id === newWoForm.customerId);
      const selectedUnit = units.find(u => u.id === newWoForm.unitId);
      const newWoId = `WO-${Date.now().toString().slice(-4)}`;
      const techName = techDetails?.full_name || profile?.full_name || 'Mechanic';

      const payload = {
        id: newWoId,
        customer_id: newWoForm.customerId,
        customer_name: cust ? (cust.company || cust.company_name) : 'Fleet Customer',
        unit_id: newWoForm.unitId || null,
        unit_display: selectedUnit ? `#${selectedUnit.unit_number} - ${selectedUnit.make} ${selectedUnit.model}` : 'Shop Unit',
        complaint: newWoForm.complaint,
        cause: newWoForm.cause,
        correction: newWoForm.correction,
        priority: newWoForm.priority,
        tech_id: techDetails?.id || null,
        tech_name: techName,
        status: 'repairing'
      };

      const { error: insertErr } = await supabase.from('work_orders').insert([payload]);
      if (insertErr) throw insertErr;

      alert(`✅ Work Order #${newWoId} created and active in repair bay!`);
      setShowCreateWoModal(false);
      fetchTechJobs();
    } catch (err) {
      alert(`Error creating work order: ${err.message}`);
    } finally {
      setSavingWo(false);
    }
  };

  const handleStartApprovedEstimate = async (wo) => {
    const canCreateWo = techDetails?.can_create_work_orders ?? false;
    if (!canCreateWo) {
      alert('⚠️ You do not have owner permission to launch repair orders. Please notify shop management.');
      return;
    }

    try {
      await supabase.from('work_orders').update({ status: 'repairing' }).eq('id', wo.id);
      alert(`✅ Repair Order #${wo.id} is now ACTIVE in repair bay!`);
      fetchTechJobs();
    } catch (err) {
      alert(`Error starting repair: ${err.message}`);
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

      syncTechStatus(newStatus === 'repairing' ? 'repairing' : newStatus === 'waiting_parts' ? 'waiting_parts' : 'active', { ...activeJob, status: newStatus });
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleStartJob = async (job) => {
    try {
      setActiveJob(job);
      setSeconds(job.timer || 0);
      setIsTimerRunning(true);
      
      const newStatus = job.status === 'new' ? 'repairing' : job.status;
      await supabase.from('work_orders').update({
        status: newStatus,
        timer: job.timer || 0
      }).eq('id', job.id);

      setActiveJob(prev => ({ ...prev, status: newStatus }));
      setAssignedQueue(prev => prev.filter(w => w.id !== job.id));
      syncTechStatus('repairing', { ...job, status: newStatus });
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

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setShowTechProfileModal(true)}
              style={{
                background: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                borderRadius: '20px',
                padding: '6px 14px',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginRight: '16px'
              }}
            >
              🇨🇦 My Pay & Direct Deposit ($ CAD)
            </button>

            <div className={styles.techProfileBox}>
              <div className={styles.avatar}>{(profile?.full_name || 'M')[0]}</div>
              <div>
                <div className={styles.techName}>{profile?.full_name || 'Mechanic'}</div>
                <div className={styles.shiftStatus}>
                  <span className={styles.shiftDot} /> Clocked In · {techDetails?.tech_type || techDetails?.role || profile?.role || 'Mechanic'}
                </div>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className={styles.logoutBtn} title="End Shift & Log Out" style={{background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer'}}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Bay Content */}
      <main className={styles.mainContent}>
        <div className="container">
          {/* Permission Status Pill Banner */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', backgroundColor: 'var(--color-surface)', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>BAY PERMISSIONS:</span>
              
              {techDetails?.can_create_estimates !== false ? (
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  ✓ Can Create Estimates
                </span>
              ) : (
                <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  🔒 Estimates Disabled
                </span>
              )}

              {techDetails?.can_approve_estimates ? (
                <span style={{ backgroundColor: 'rgba(37, 99, 255, 0.1)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  ✓ Direct Customer Dispatch
                </span>
              ) : (
                <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  ⚡ Needs Owner Approval
                </span>
              )}

              {techDetails?.can_create_work_orders ? (
                <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  ✓ Can Launch Work Orders
                </span>
              ) : (
                <span style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', color: 'var(--color-text-secondary)', padding: '3px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  🔒 Work Orders: Owner Only
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowCreateEstimateModal(true)} 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Calculator size={14} /> + New Estimate
              </button>
              <button 
                onClick={() => {
                  if (techDetails?.can_create_work_orders) {
                    setShowCreateWoModal(true);
                  } else {
                    alert('⚠️ Work order creation requires owner authorization. Please ask the shop manager.');
                  }
                }} 
                className="btn btn-outline" 
                style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> + New Work Order
              </button>
            </div>
          </div>

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
                    
                    {/* 1-Click Copy Customer Live Link */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleCopyCustomerLink(activeJob.id)}
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Copy live customer tracking and approval link"
                      >
                        <ExternalLink size={13} /> Copy Customer Link
                      </button>

                      {/* Live Status Selector for all 8 states */}
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

                  {/* Customer Authorized Notification Banner */}
                  {activeJob.authorized && (
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                      <CheckCircle size={16} /> Customer Authorized: {activeJob.signature || 'Digital Sign-off on File'}
                    </div>
                  )}

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

              {/* Bay Layout: Work Queue + Repair Notes */}
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

                {/* Right Column: Assigned Bay Queue & Estimates Tracker */}
                <div className={styles.queueCard}>
                  <h2 className={styles.sectionTitle}>Assigned Truck Queue & Approvals ({assignedQueue.length})</h2>
                  
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
                            
                            {item.status === 'pending_owner_approval' ? (
                              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                                ⚡ Pending Owner Review
                              </span>
                            ) : item.authorized ? (
                              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                                ✓ Customer Approved!
                              </span>
                            ) : (
                              <span className={styles.priorityBadge}>{item.status || 'Normal'}</span>
                            )}
                          </div>

                          <div className={styles.queueCustomer}>{item.customer_name}</div>
                          <div className={styles.queueIssue}>{item.complaint}</div>
                          
                          <div className={styles.queueFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <span className={styles.queueEst}>Est: ${Number(item.estimated_cost || 0).toFixed(2)} CAD</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                                onClick={() => handleCopyCustomerLink(item.id)}
                                title="Copy customer approval link"
                              >
                                📋 Link
                              </button>
                              
                              {item.status === 'pending_owner_approval' ? (
                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Awaiting Shop Review</span>
                              ) : (
                                <button className={styles.startJobBtn} onClick={() => handleStartJob(item)}>
                                  Start Job →
                                </button>
                              )}
                            </div>
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

      {/* Technician Profile & Direct Deposit Pay Info Modal */}
      {showTechProfileModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTechProfileModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className={styles.modalHeader}>
              <h3>🇨🇦 Technician Profile & Compensation</h3>
              <button onClick={() => setShowTechProfileModal(false)} className={styles.closeModalBtn}>✕</button>
            </div>
            
            <div style={{ padding: '1rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  {(profile?.full_name || 'M')[0]}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{profile?.full_name || 'Mechanic'}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600' }}>
                    {techDetails?.tech_type || techDetails?.role || 'Journeyman Heavy Duty'}
                  </div>
                </div>
              </div>

              {/* Pay Rates ($ CAD) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Hourly Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '2px' }}>
                    ${parseFloat(techDetails?.hourly_pay_cad || 45).toFixed(2)} CAD / hr
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Overtime Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', marginTop: '2px' }}>
                    ${parseFloat(techDetails?.overtime_pay_cad || (parseFloat(techDetails?.hourly_pay_cad || 45) * 1.5)).toFixed(2)} CAD / hr
                  </div>
                </div>
              </div>

              {/* Working Terms */}
              <div style={{ marginBottom: '1rem', padding: '10px 12px', backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Working Terms:</span>
                  <strong>{techDetails?.working_terms || 'Full-Time Hourly'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Pay Schedule:</span>
                  <strong>{techDetails?.pay_frequency || 'Bi-Weekly'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Next Pay Date:</span>
                  <strong style={{ color: 'var(--color-primary)' }}>{techDetails?.next_pay_date || 'Friday'}</strong>
                </div>
              </div>

              {/* Canadian Direct Deposit Banking */}
              <div style={{ padding: '12px', backgroundColor: 'rgba(37, 99, 235, 0.04)', borderRadius: '8px', border: '1px dashed var(--color-border)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '8px' }}>
                  🏛️ Canadian Direct Deposit on File
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block' }}>BANK</span>
                    <strong>{techDetails?.bank_name || 'RBC Royal Bank'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block' }}>INSTITUTION #</span>
                    <strong>{techDetails?.institution_number || '003'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block' }}>TRANSIT #</span>
                    <strong>{techDetails?.transit_number || '12345'}</strong>
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block' }}>ACCOUNT NUMBER</span>
                  <strong>{techDetails?.account_number ? `••••${techDetails.account_number.slice(-4)}` : '••••4821'}</strong>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, textAlign: 'center' }}>
                To update your direct deposit banking or working terms, please contact shop management.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowTechProfileModal(false)} className="btn btn-primary" style={{ width: '100%' }}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technician Bay + Create Estimate Modal */}
      {showCreateEstimateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateEstimateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} color="var(--color-primary)" />
                Draft Repair Estimate (Bay Tablet)
              </h3>
              <button onClick={() => setShowCreateEstimateModal(false)} className={styles.closeModalBtn}>✕</button>
            </div>

            <form onSubmit={handleCreateTechEstimate} style={{ padding: '1rem 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Customer *</label>
                  <select
                    required
                    value={estimateForm.customerId}
                    onChange={(e) => setEstimateForm({ ...estimateForm, customerId: e.target.value, unitId: '' })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Select Fleet Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company || c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Unit / Vehicle</label>
                  <select
                    value={estimateForm.unitId}
                    onChange={(e) => setEstimateForm({ ...estimateForm, unitId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Select Unit...</option>
                    {units
                      .filter(u => !estimateForm.customerId || u.customer_id === estimateForm.customerId)
                      .map(u => (
                        <option key={u.id} value={u.id}>Unit #{u.unit_number} ({u.make} {u.model})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Diagnostic Scope / Complaint *</label>
                <textarea
                  required
                  rows={3}
                  value={estimateForm.description}
                  onChange={(e) => setEstimateForm({ ...estimateForm, description: e.target.value })}
                  placeholder="e.g. Diagnosed worn steer axle kingpins and play in drag link assembly..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Labour Hours</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={estimateForm.labourHours}
                    onChange={(e) => setEstimateForm({ ...estimateForm, labourHours: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Rate ($ CAD)</label>
                  <input
                    type="number"
                    step="1"
                    value={estimateForm.labourRate}
                    onChange={(e) => setEstimateForm({ ...estimateForm, labourRate: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Parts Total ($ CAD)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={estimateForm.partsAmount}
                    onChange={(e) => setEstimateForm({ ...estimateForm, partsAmount: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              {/* Notice pill for routing */}
              <div style={{ backgroundColor: 'rgba(37, 99, 255, 0.06)', border: '1px solid rgba(37, 99, 255, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {techDetails?.can_approve_estimates ? (
                  <span>✓ <strong>Direct Dispatch:</strong> This estimate will be sent directly to the customer with live approval link.</span>
                ) : (
                  <span>⚡ <strong>Owner Review:</strong> This estimate will route to the <strong>Shop Owner for Review & Approval</strong> before sending to the customer.</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateEstimateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingEstimate}>
                  {savingEstimate ? 'Saving Estimate...' : 'Submit Estimate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Technician Bay + Create Work Order Modal */}
      {showCreateWoModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateWoModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--color-primary)" />
                Create New Repair Order (Bay Tablet)
              </h3>
              <button onClick={() => setShowCreateWoModal(false)} className={styles.closeModalBtn}>✕</button>
            </div>

            <form onSubmit={handleCreateTechWorkOrder} style={{ padding: '1rem 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Customer *</label>
                  <select
                    required
                    value={newWoForm.customerId}
                    onChange={(e) => setNewWoForm({ ...newWoForm, customerId: e.target.value, unitId: '' })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Select Fleet Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company || c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Unit / Vehicle</label>
                  <select
                    value={newWoForm.unitId}
                    onChange={(e) => setNewWoForm({ ...newWoForm, unitId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Select Unit...</option>
                    {units
                      .filter(u => !newWoForm.customerId || u.customer_id === newWoForm.customerId)
                      .map(u => (
                        <option key={u.id} value={u.id}>Unit #{u.unit_number} ({u.make} {u.model})</option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Customer Complaint *</label>
                <textarea
                  required
                  rows={2}
                  value={newWoForm.complaint}
                  onChange={(e) => setNewWoForm({ ...newWoForm, complaint: e.target.value })}
                  placeholder="e.g. Engine derate, check engine lamp active on highway..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Diagnostic Cause</label>
                <input
                  type="text"
                  value={newWoForm.cause}
                  onChange={(e) => setNewWoForm({ ...newWoForm, cause: e.target.value })}
                  placeholder="e.g. Fault code SPN 3216 FMI 5 (NOx Sensor Circuit)"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Priority</label>
                <select
                  value={newWoForm.priority}
                  onChange={(e) => setNewWoForm({ ...newWoForm, priority: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="emergency">🚨 Emergency / Roadside Breakdown</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateWoModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingWo}>
                  {savingWo ? 'Creating Work Order...' : 'Launch Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
