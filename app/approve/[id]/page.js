'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Check, 
  X, 
  Calculator, 
  ShieldAlert, 
  CheckCircle, 
  CreditCard, 
  Clock, 
  Wrench, 
  Truck, 
  Receipt, 
  AlertTriangle, 
  FileText, 
  Lock, 
  RotateCcw,
  Smartphone,
  Building2,
  Download,
  Printer
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import styles from '../approve.module.css';

const PROGRESS_STEPS = [
  { id: 'estimate', label: '1. Estimate' },
  { id: 'diagnosing', label: '2. Diagnosing' },
  { id: 'waiting_parts', label: '3. Parts' },
  { id: 'repairing', label: '4. Repairing' },
  { id: 'completed', label: '5. Complete' },
  { id: 'invoiced', label: '6. Invoiced' },
  { id: 'paid', label: '7. Paid' }
];

export default function ApprovalPage() {
  const params = useParams();
  const { id } = params;
  
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [unit, setUnit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [name, setName] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  
  // Payment states
  const [selectedPayMethod, setSelectedPayMethod] = useState('card');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Canvas Signature
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const fetchOrderData = async () => {
    setIsLoading(true);
    try {
      const { data: woData, error: woError } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .single();
        
      if (woError) throw woError;
      
      setOrder(woData);
      if (woData.authorized) {
        setIsApproved(true);
        setName(woData.signature || 'Customer on File');
      }

      // Fetch customer
      if (woData.customer_id) {
        const { data: custData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', woData.customer_id)
          .single();
        if (custData) setCustomer(custData);
      }

      // Fetch unit
      if (woData.unit_id) {
        const { data: unitData } = await supabase
          .from('units')
          .select('*')
          .eq('id', woData.unit_id)
          .single();
        if (unitData) setUnit(unitData);
      }

      // Fetch invoice if available
      const { data: invData } = await supabase
        .from('invoices')
        .select('*')
        .eq('work_order_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invData) {
        setInvoice(invData);
        if (invData.status === 'paid') {
          setPaySuccess(true);
        }
      }
    } catch (err) {
      console.error("Error fetching approval order:", err);
      setError(err.message || "Failed to load repair order details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderData();
    }
  }, [id]);

  // Canvas Drawing Handlers
  const getCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (e.touches && e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e, canvas);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2563FF';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches && e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e, canvas);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleApprove = async () => {
    if (!name.trim()) {
      alert("Please enter your printed name to provide digital authorization.");
      return;
    }
    if (!termsAccepted) {
      alert("Please accept the terms and repair estimate notice.");
      return;
    }
    
    setIsApproving(true);
    try {
      const today = new Date().toISOString();
      
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          status: 'repairing',
          authorized: true,
          signature: name.trim(),
          updated_at: today
        })
        .eq('id', id);
        
      if (error) throw error;
      
      setIsApproved(true);
      setOrder(prev => ({ ...prev, status: 'repairing', authorized: true, signature: name.trim() }));
      alert("✅ Estimate Approved! Your repair authorization has been sent directly to the technician and shop foreman.");
    } catch (err) {
      alert(`Error submitting authorization: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleOnlinePayment = async (e) => {
    e.preventDefault();
    setIsPaying(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Update invoice to paid
      if (invoice?.id) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: today,
            notes: `Online customer payment via ${selectedPayMethod.toUpperCase()} on ${today}`
          })
          .eq('id', invoice.id);
      }

      // Update work order to paid
      await supabase
        .from('work_orders')
        .update({ status: 'paid' })
        .eq('id', id);

      setPaySuccess(true);
      setOrder(prev => ({ ...prev, status: 'paid' }));
      if (invoice) setInvoice(prev => ({ ...prev, status: 'paid', paid_date: today }));
      
      alert(`✅ Payment of $${Number(invoice?.total || order?.estimated_cost || 0).toFixed(2)} CAD received successfully! Thank you for your business.`);
    } catch (err) {
      alert(`Payment error: ${err.message}`);
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.main} style={{ textAlign: 'center', paddingTop: '100px' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚙️</div>
          <h2>Loading live repair order details...</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Connecting securely to shop dispatch...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.container}>
        <div className={styles.main} style={{ textAlign: 'center', paddingTop: '100px' }}>
          <h2 style={{ color: '#ef4444' }}>{error || 'Work Order Not Found'}</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Please verify your link or contact Thompson Heavy Duty Diesel Repair.
          </p>
        </div>
      </div>
    );
  }

  // Financial Calculations
  const labourList = order.labour || [];
  const partsList = order.parts || [];
  const labourTotal = labourList.reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
  const partsTotal = partsList.reduce((sum, p) => sum + ((p.quantity || 0) * (p.sellPrice || p.price || 0)), 0);
  const shopSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
  const subtotal = labourTotal + partsTotal + shopSupplies;
  const tax = subtotal * 0.05; // 5% GST
  const grandTotalCad = order.estimated_cost || (subtotal + tax);

  // Determine current step index
  const getStepStatus = (stepId) => {
    const rawStatus = (order.status || 'new').toLowerCase();
    const isPaid = rawStatus === 'paid' || invoice?.status === 'paid';
    const isInvoiced = rawStatus === 'invoiced' || isPaid || !!invoice;
    const isCompleted = rawStatus === 'completed' || isInvoiced;
    const isRepairing = rawStatus === 'repairing' || isCompleted;
    const isWaitingParts = rawStatus === 'waiting_parts';
    const isDiagnosing = rawStatus === 'diagnosing' || isWaitingParts || isRepairing;

    if (stepId === 'paid') return isPaid ? 'completed' : 'pending';
    if (stepId === 'invoiced') return isPaid ? 'completed' : (isInvoiced ? 'active' : 'pending');
    if (stepId === 'completed') return isInvoiced ? 'completed' : (rawStatus === 'completed' ? 'active' : 'pending');
    if (stepId === 'repairing') return isCompleted ? 'completed' : (rawStatus === 'repairing' ? 'active' : 'pending');
    if (stepId === 'waiting_parts') return isCompleted || rawStatus === 'repairing' ? 'completed' : (isWaitingParts ? 'active' : 'pending');
    if (stepId === 'diagnosing') return isRepairing ? 'completed' : (isDiagnosing ? 'active' : 'pending');
    if (stepId === 'estimate') return (order.authorized || isRepairing) ? 'completed' : 'active';

    return 'pending';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Calculator size={24} color="var(--color-primary)" />
          Fleet Finance <span>Flow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', background: 'rgba(37,99,255,0.1)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
            LIVE CUSTOMER PORTAL
          </span>
        </div>
      </header>

      <main className={styles.main}>
        {/* Real-time Repair Progression Stepper */}
        <div className={styles.stepperContainer}>
          <div className={styles.stepperTitle}>
            <span>Live Repair Order Progress</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>
              Status: {order.status?.toUpperCase()}
            </span>
          </div>
          <div className={styles.stepsRow}>
            {PROGRESS_STEPS.map((s, idx) => {
              const state = getStepStatus(s.id);
              return (
                <div key={s.id} className={styles.stepItem}>
                  <div className={`${styles.stepDot} ${state === 'completed' ? styles.completed : (state === 'active' ? styles.active : '')}`}>
                    {state === 'completed' ? <Check size={14} /> : (idx + 1)}
                  </div>
                  <span className={`${styles.stepLabel} ${state === 'completed' ? styles.completed : (state === 'active' ? styles.active : '')}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle & Customer Identification Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Repair Order #{order.id}</h3>
              <div className={styles.orderMeta}>
                Customer: <strong>{customer?.company || order.customer_name || 'Fleet Client'}</strong> · Contact: {customer?.contact_name || 'Fleet Manager'}
              </div>
            </div>
            <span style={{ fontSize: '12px', backgroundColor: 'var(--color-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontWeight: '600' }}>
              {new Date(order.created_at || Date.now()).toLocaleDateString()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px', fontSize: '13px' }}>
            <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Unit / Vehicle</span>
              <strong>{order.unit_display || `${unit?.make || 'Truck'} ${unit?.model || ''}`}</strong>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)' }}>VIN</span>
              <strong>{unit?.vin || '1FUJGLDR9CLBP8821'}</strong>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Trailer / Equipment</span>
              <strong>{order.trailer || 'None attached'}</strong>
            </div>
            <div style={{ backgroundColor: 'var(--color-bg)', padding: '10px', borderRadius: '6px' }}>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Assigned Technician</span>
              <strong>{order.tech_name || 'Certified Heavy Duty Journeyman'}</strong>
            </div>
          </div>
        </div>

        {/* Diagnostics & Scope of Work */}
        <div className={styles.card}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Customer Reported Complaint</h4>
            <p className={styles.sectionText}>{order.complaint || 'Diagnostic inspection and mechanical evaluation requested.'}</p>
          </div>

          {order.cause && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Diagnostic Cause & Root Issue</h4>
              <p className={styles.sectionText}>{order.cause}</p>
            </div>
          )}

          {order.correction && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Certified Mechanical Correction</h4>
              <p className={styles.sectionText}>{order.correction}</p>
            </div>
          )}
        </div>

        {/* 1. If INVOICED or PAID: Display Final Invoice & Online Payment */}
        {(order.status === 'invoiced' || order.status === 'paid' || invoice) && (
          <div className={styles.paymentSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--color-primary)" />
                Final Invoice #{invoice?.id || `INV-${order.id.replace('WO-', '')}`}
              </h3>
              {paySuccess || invoice?.status === 'paid' || order.status === 'paid' ? (
                <span style={{ backgroundColor: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
                  ✓ PAID IN FULL
                </span>
              ) : (
                <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
                  PAYMENT DUE
                </span>
              )}
            </div>

            <div style={{ backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span>Certified Labour Services:</span>
                <span>${labourTotal.toFixed(2)} CAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span>Heavy Duty Replacement Parts:</span>
                <span>${partsTotal.toFixed(2)} CAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span>Shop Supplies & Environmental Eco Disposal:</span>
                <span>${shopSupplies.toFixed(2)} CAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span>Tax (5% GST):</span>
                <span>${tax.toFixed(2)} CAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '6px', borderTop: '2px solid var(--color-border)', fontWeight: 'bold', fontSize: '16px' }}>
                <span>Total Balance Due:</span>
                <span style={{ color: 'var(--color-primary)' }}>${grandTotalCad.toFixed(2)} CAD</span>
              </div>
            </div>

            {/* Direct Pay Options if unpaid */}
            {(!paySuccess && invoice?.status !== 'paid' && order.status !== 'paid') ? (
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '14px' }}>Choose Secure Online Payment Method:</h4>
                <div className={styles.payMethodsGrid}>
                  <button 
                    type="button" 
                    className={`${styles.payMethodBtn} ${selectedPayMethod === 'card' ? styles.selected : ''}`}
                    onClick={() => setSelectedPayMethod('card')}
                  >
                    <CreditCard size={20} color="var(--color-primary)" />
                    Credit Card / Visa / MC
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.payMethodBtn} ${selectedPayMethod === 'applepay' ? styles.selected : ''}`}
                    onClick={() => setSelectedPayMethod('applepay')}
                  >
                    <Smartphone size={20} color="#10b981" />
                    Apple Pay / Google Pay
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.payMethodBtn} ${selectedPayMethod === 'eft' ? styles.selected : ''}`}
                    onClick={() => setSelectedPayMethod('eft')}
                  >
                    <Building2 size={20} color="#8b5cf6" />
                    Direct EFT / Interac
                  </button>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button 
                    type="button" 
                    className={styles.btnApprove} 
                    style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                    onClick={handleOnlinePayment}
                    disabled={isPaying}
                  >
                    <Lock size={18} />
                    {isPaying ? 'Processing Payment...' : `Pay $${grandTotalCad.toFixed(2)} CAD Securely Now`}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ margin: 0, color: '#10b981' }}>Invoice Paid in Full</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 12px' }}>
                  Transaction logged. Thank you for choosing Thompson Heavy Duty Diesel Repair.
                </p>
                <button className="btn btn-outline" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <Printer size={14} /> Print Official Receipt
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. ESTIMATE & AUTHORIZATION SECTION (When in Estimate / Active Approval mode) */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '16px' }}>Itemized Estimate Breakdown ($ CAD)</h3>
          
          <div className={styles.costRow}>
            <span>Certified Technician Labour Services ({labourList.reduce((s,l) => s + (l.hours || 0), 0) || 2.5} hrs @ $145.00/hr CAD)</span>
            <strong>${labourTotal.toFixed(2)}</strong>
          </div>
          
          <div className={styles.costRow}>
            <span>Heavy Duty Replacement Parts & Fluids ({partsList.length || 'Direct OE'} items)</span>
            <strong>${partsTotal.toFixed(2)}</strong>
          </div>
          
          <div className={styles.costRow}>
            <span>Shop Supplies & Environmental Disposal (5% capped at $50)</span>
            <strong>${shopSupplies.toFixed(2)}</strong>
          </div>
          
          <div className={styles.costRow}>
            <span>Applicable Taxes (5% GST)</span>
            <strong>${tax.toFixed(2)}</strong>
          </div>
          
          <div className={styles.costTotal}>
            <span>Total Estimated Cost (CAD):</span>
            <span style={{ color: 'var(--color-primary)' }}>${grandTotalCad.toFixed(2)} CAD</span>
          </div>
        </div>

        {/* Prominent Estimation Disclaimer & Alert */}
        <div className={styles.noticeBox}>
          <div className={styles.noticeHeader}>
            <AlertTriangle size={18} />
            Important Notice of Estimation & Supplemental Terms
          </div>
          <p className={styles.noticeText}>
            This document represents a <strong>preliminary diagnostic estimate</strong> based on initial inspection. 
            In heavy-duty truck and diesel mechanics, deeper mechanical fatigue, seized components, or secondary wear may only become visible upon full component disassembly. 
            If supplemental parts or additional labor are required exceeding 10% of this quote, a <strong>supplementary authorization request</strong> will be provided for your review prior to proceeding.
          </p>
        </div>

        {/* Terms & Conditions Box */}
        <div className={styles.card}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
            Shop Terms, Warranty & Authorization Policies
          </h4>
          <ul className={styles.termsList}>
            <li><strong>Warranty:</strong> 90 days or 20,000 km (whichever occurs first) on all certified replacement parts and shop labor.</li>
            <li><strong>Payment Terms:</strong> Net 30 for registered commercial fleet accounts; payment due upon completion for COD customers.</li>
            <li><strong>Core Charges:</strong> Replaced core components will be credited upon manufacturer return inspection.</li>
            <li><strong>Vehicle Storage:</strong> Vehicles left more than 5 business days after completion notification may be subject to standard storage charges.</li>
          </ul>

          <div style={{ marginTop: '14px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input 
                type="checkbox" 
                checked={termsAccepted} 
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              <span>I have read and agree to the repair terms, scope of work, and estimation policy.</span>
            </label>
          </div>
        </div>

        {/* Digital Signature & Authorization Box */}
        {!isApproved ? (
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ marginBottom: '8px' }}>Digital Authorization Signature</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              By signing below and clicking approve, you authorize Thompson Heavy Duty Diesel Repair to perform the diagnostic repairs and install necessary components as described above.
            </p>

            <div className={styles.signatureArea}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className={styles.signatureLabel} style={{ margin: 0 }}>Draw Your Signature:</span>
                <button 
                  type="button" 
                  onClick={clearCanvas}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCcw size={12} /> Clear Signature
                </button>
              </div>

              <div className={styles.canvasContainer}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasSignature && (
                  <span className={styles.canvasPlaceholder}>Sign here with mouse or finger</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.signatureLabel} htmlFor="authName">Authorized Representative Full Name *</label>
                <input 
                  id="authName"
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. John Miller, Fleet Director"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                🔒 Timestamp logged: {new Date().toLocaleString()} | Digital IP authentication recorded.
              </p>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.btnApprove} 
                onClick={handleApprove}
                disabled={isApproving}
              >
                <Check size={20} />
                {isApproving ? 'Authorizing Repairs...' : `Approve Estimate ($${grandTotalCad.toFixed(2)} CAD)`}
              </button>
              <button 
                className={styles.btnDecline} 
                onClick={() => alert("You have requested a callback from our service advisor. A team member will call you shortly.")}
              >
                <X size={18} style={{ marginRight: '6px', display: 'inline' }} />
                Request Changes / Decline
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.card} style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.3)', textAlign: 'center', padding: '24px' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: '#10b981', margin: '0 0 4px' }}>Estimate Approved & Authorized</h3>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--color-text)' }}>
              Authorized by: <strong>{name || order.signature || 'Customer on File'}</strong>
            </p>
            <div style={{ display: 'inline-flex', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <span>Status: <strong>Active in Repair Bay</strong></span>
              <span>·</span>
              <span>Shop dispatch notified</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
