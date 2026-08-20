'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  ShieldCheck
} from 'lucide-react';
import styles from './bay.module.css';

export default function TechBayPage() {
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [savedNotes, setSavedNotes] = useState([
    'Replaced left front brake rotor. Verified torque specs at 165 ft-lbs.',
    'Brake pad wear logged at 15%. Cleaned caliper bracket assemblies.'
  ]);

  const [activeJob, setActiveJob] = useState(null);
  const [assignedQueue, setAssignedQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTechJobs() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Find a repairing job for the active one
        const repairing = data.find(wo => wo.status === 'repairing' || wo.status === 'diagnosing');
        setActiveJob(repairing || null);
        
        if (repairing && repairing.timer) {
          setSeconds(repairing.timer);
        }

        // Use the rest as the queue
        const queue = data.filter(wo => wo.id !== (repairing?.id) && ['new', 'waiting_parts', 'repairing', 'diagnosing'].includes(wo.status));
        setAssignedQueue(queue);
      } catch (err) {
        console.error("Error fetching tech jobs:", err);
        setError(err.message || 'Failed to fetch data from Supabase');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTechJobs();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && activeJob) {
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

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setSavedNotes([notes, ...savedNotes]);
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
            <div className={styles.avatar}>SL</div>
            <div>
              <div className={styles.techName}>Sarah L.</div>
              <div className={styles.shiftStatus}>
                <span className={styles.shiftDot} /> Clocked In · 07:30 AM
              </div>
            </div>
            <Link href="/login" className={styles.logoutBtn} title="End Shift & Log Out">
              <LogOut size={18} />
            </Link>
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
                    <div className={styles.statusPill}>
                      {activeJob.status === 'repairing' ? '🔵 IN BAY — ACTIVE WORK' : '🟠 IN BAY — DIAGNOSING'}
                      <span style={{marginLeft:'8px', fontSize:'9px', background:'rgba(255,255,255,0.2)', color:'white', padding:'2px 5px', borderRadius:'10px'}}>SUPABASE</span>
                    </div>
                  </div>

                  <div className={styles.truckTitleRow}>
                    <div>
                      <h1 className={styles.truckName}>{activeJob.unit_display || 'Unknown Unit'}</h1>
                      <p className={styles.fleetCustomer}>Fleet: {activeJob.customer_name || 'Unknown Customer'} · RO Created: {new Date(activeJob.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className={styles.issueBox}>
                    <Wrench size={18} className={styles.issueIcon} />
                    <span><strong>Job Description:</strong> {activeJob.complaint || 'No complaint specified'}</span>
                  </div>

                  {/* Big Touch Job Timer */}
                  <div className={styles.timerContainer}>
                    <div className={styles.timerLabel}>JOB CLOCK TIMER</div>
                    <div className={styles.timerClock}>{formatTimer(seconds)}</div>
                    
                    <div className={styles.timerControls}>
                      <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
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

                      <button
                        onClick={() => alert('Job Completed! Sent to Service Manager for Final Invoice Review.')}
                        className={styles.completeBtn}
                      >
                        <CheckCircle size={20} />
                        <span>Complete Job & Move to Invoice</span>
                      </button>
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

                <button onClick={() => alert('Parts Request sent to Parts Room!')} className={styles.toolBtn}>
                  <div className={styles.toolIconWrapper}>
                    <Package size={22} />
                  </div>
                  <div>
                    <div className={styles.toolTitle}>Request Parts</div>
                    <div className={styles.toolDesc}>Notify parts counter for bay delivery</div>
                  </div>
                </button>

                <button onClick={() => alert('Voice notes recorder ready')} className={styles.toolBtn}>
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
                        No jobs in queue.
                      </div>
                    ) : (
                      assignedQueue.map((item) => (
                        <div key={item.id} className={styles.queueItem}>
                          <div className={styles.queueHeader}>
                            <span className={styles.queueUnit}>{item.unit_display}</span>
                            <span className={styles.priorityBadge}>{item.priority || 'Normal'}</span>
                          </div>
                          <div className={styles.queueCustomer}>{item.customer_name}</div>
                          <div className={styles.queueIssue}>{item.complaint}</div>
                          <div className={styles.queueFooter}>
                            <span className={styles.queueEst}>Est: ${item.estimated_cost}</span>
                            <button className={styles.startJobBtn}>Start Job →</button>
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
