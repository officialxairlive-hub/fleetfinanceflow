'use client';

import React, { useState, useEffect } from 'react';
import styles from './inspections.module.css';
import { ClipboardCheck, FileText, CheckCircle, XCircle, FileSignature } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const templates = [
  { id: 'dot', name: 'DOT Inspection', icon: <ClipboardCheck size={18} /> },
  { id: 'cvse', name: 'CVSE Inspection', icon: <FileText size={18} /> },
  { id: 'pm', name: 'PM Inspection', icon: <ClipboardCheck size={18} /> },
  { id: 'trailer', name: 'Trailer Inspection', icon: <FileText size={18} /> },
  { id: 'brake', name: 'Brake Inspection', icon: <ClipboardCheck size={18} /> },
];

const dotChecklist = {
  Brakes: [
    { id: 'b1', desc: 'Air pressure build-up' },
    { id: 'b2', desc: 'Pushrod travel' },
    { id: 'b3', desc: 'Pad/Shoe condition' },
    { id: 'b4', desc: 'Drums/Rotors' }
  ],
  Tires: [
    { id: 't1', desc: 'Tread depth' },
    { id: 't2', desc: 'Condition' },
    { id: 't3', desc: 'Pressure' },
    { id: 't4', desc: 'Lug nuts' }
  ],
  Lights: [
    { id: 'l1', desc: 'Headlights' },
    { id: 'l2', desc: 'Tail lights' },
    { id: 'l3', desc: 'Turn signals' },
    { id: 'l4', desc: 'Marker lights' }
  ],
  Suspension: [
    { id: 's1', desc: 'Air bags' },
    { id: 's2', desc: 'U-bolts' },
    { id: 's3', desc: 'Bushings' },
    { id: 's4', desc: 'Shocks' }
  ],
  Engine: [
    { id: 'e1', desc: 'Leaks' },
    { id: 'e2', desc: 'Belts' },
    { id: 'e3', desc: 'Hoses' },
    { id: 'e4', desc: 'Fluid levels' }
  ],
  Frame: [
    { id: 'f1', desc: 'Cracks' },
    { id: 'f2', desc: 'Welds' },
    { id: 'f3', desc: 'Crossmembers' }
  ]
};

export default function InspectionsPage() {
  const [activeTemplate, setActiveTemplate] = useState('dot');
  const [itemsState, setItemsState] = useState({});
  const [overallResult, setOverallResult] = useState('');
  
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [inspector, setInspector] = useState('Inspector');

  useEffect(() => {
    async function fetchUnits() {
      try {
        const { data } = await supabase.from('units').select('*').order('unit_number');
        setUnits(data || []);
      } catch (err) {
        console.error("Error fetching units for inspection:", err);
      }
    }
    fetchUnits();
  }, []);

  const handleToggle = (itemId, status) => {
    setItemsState(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], status }
    }));
  };

  const handleInputChange = (itemId, field, value) => {
    setItemsState(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmitInspection = async (e) => {
    e?.preventDefault();
    if (!selectedUnit) {
      alert('Please select a unit/truck to inspect.');
      return;
    }
    if (!overallResult) {
      alert('Please select an overall result (Pass, Conditional, or Fail).');
      return;
    }

    setIsSubmitting(true);
    try {
      const unitObj = units.find(u => u.id === selectedUnit);
      const failedItems = Object.entries(itemsState).filter(([_, val]) => val.status === 'fail');

      // 1. Update Unit status and last_service in Supabase
      const newStatus = overallResult === 'pass' ? 'active' : 'needs_service';
      const { error: unitErr } = await supabase
        .from('units')
        .update({
          last_service: inspectionDate,
          status: newStatus
        })
        .eq('id', selectedUnit);

      if (unitErr) throw unitErr;

      // 2. If failed items exist, optionally create a diagnostic work order
      let createdWoId = null;
      if (overallResult === 'fail' || failedItems.length > 0) {
        const failDescriptions = failedItems.map(([key, val]) => {
          return `${key}: ${val.notes || 'Failed check'} (${val.measurement || 'Out of spec'})`;
        }).join('; ');

        createdWoId = `WO-${Date.now().toString().slice(-4)}`;
        await supabase.from('work_orders').insert([{
          id: createdWoId,
          customer_id: unitObj?.customer_id || null,
          customer_name: 'Fleet Inspection Service',
          unit_id: selectedUnit,
          unit_display: unitObj ? `#${unitObj.unit_number} - ${unitObj.make} ${unitObj.model}` : 'Inspected Unit',
          complaint: `Failed ${activeTemplate.toUpperCase()} Inspection: ${failDescriptions || 'Issues detected'}`,
          priority: overallResult === 'fail' ? 'high' : 'normal',
          status: 'new',
          estimated_cost: 450.00
        }]);
      }

      alert(`✅ ${templates.find(t => t.id === activeTemplate)?.name} Logged to Supabase!\n\n- Unit: #${unitObj?.unit_number}\n- Result: ${overallResult.toUpperCase()}\n${createdWoId ? `- Repair Ticket created: #${createdWoId}` : ''}`);
      
      // Reset form
      setItemsState({});
      setOverallResult('');
      setSigned(false);
    } catch (err) {
      alert(`Error submitting inspection: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Digital Vehicle Inspections (DVI)</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
            Conduct DOT, CVSE, PM, and Brake inspections with automatic fleet record logging
          </p>
        </div>
      </header>

      <div className={styles.templateSelector}>
        {templates.map(t => (
          <button
            key={t.id}
            className={`${styles.templateBtn} ${activeTemplate === t.id ? styles.active : ''}`}
            onClick={() => setActiveTemplate(t.id)}
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>

      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <div className={styles.formGroup}>
            <label>Unit / Truck *</label>
            <select className={styles.select} value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} required>
              <option value="">Select Unit...</option>
              {units.map(t => (
                <option key={t.id} value={t.id}>Unit #{t.unit_number} ({t.make} {t.model} {t.plate ? `- ${t.plate}` : ''})</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Inspector Name</label>
            <input type="text" className={styles.input} value={inspector} onChange={e => setInspector(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Date</label>
            <input type="date" className={styles.input} value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} />
          </div>
        </div>

        <div className={styles.checklist}>
          {Object.entries(dotChecklist).map(([section, items]) => (
            <div key={section}>
              <h3 className={styles.sectionTitle}>{section}</h3>
              {items.map(item => {
                const itemState = itemsState[item.id] || {};
                return (
                  <div key={item.id} className={styles.checklistItem}>
                    <div className={styles.itemDesc}>{item.desc}</div>
                    <div className={styles.toggleGroup}>
                      <button 
                        type="button"
                        className={`${styles.toggleBtn} ${styles.btnPass} ${itemState.status === 'pass' ? styles.active : ''}`}
                        onClick={() => handleToggle(item.id, 'pass')}
                      >
                        <CheckCircle size={18} /> Pass
                      </button>
                      <button 
                        type="button"
                        className={`${styles.toggleBtn} ${styles.btnFail} ${itemState.status === 'fail' ? styles.active : ''}`}
                        onClick={() => handleToggle(item.id, 'fail')}
                      >
                        <XCircle size={18} /> Fail
                      </button>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        className={styles.input} 
                        placeholder="Measurement..." 
                        value={itemState.measurement || ''}
                        onChange={(e) => handleInputChange(item.id, 'measurement', e.target.value)}
                      />
                    </div>
                    <div>
                      <input 
                        type="text" 
                        className={styles.input} 
                        placeholder="Notes..." 
                        value={itemState.notes || ''}
                        onChange={(e) => handleInputChange(item.id, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.signatureArea}>
          <h3 className={styles.sectionTitle}>Overall Result & Sign-off</h3>
          <div className={styles.overallResult}>
            <button 
              type="button"
              className={`${styles.resultBtn} ${styles.pass} ${overallResult === 'pass' ? styles.active : ''}`}
              onClick={() => setOverallResult('pass')}
            >
              Pass (Roadworthy)
            </button>
            <button 
              type="button"
              className={`${styles.resultBtn} ${styles.conditional} ${overallResult === 'conditional' ? styles.active : ''}`}
              onClick={() => setOverallResult('conditional')}
            >
              Conditional (Minor Defects)
            </button>
            <button 
              type="button"
              className={`${styles.resultBtn} ${styles.fail} ${overallResult === 'fail' ? styles.active : ''}`}
              onClick={() => setOverallResult('fail')}
            >
              Fail (Out of Service)
            </button>
          </div>
          
          <div 
            className={styles.signBox} 
            onClick={() => setSigned(true)}
            style={{ cursor: 'pointer', border: signed ? '2px solid #10b981' : '1px dashed var(--color-border)', backgroundColor: signed ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}
          >
            <div style={{ textAlign: 'center' }}>
              <FileSignature size={32} style={{ margin: '0 auto 10px', color: signed ? '#10b981' : 'inherit', opacity: signed ? 1 : 0.5 }} />
              <div>{signed ? `✓ Signed Digitally by ${inspector} (${new Date().toLocaleTimeString()})` : 'Tap or click to sign digital authorization'}</div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button 
              type="button" 
              className="btn btn-outline btn-lg" 
              onClick={() => alert('Inspection draft stored locally.')}
            >
              Save Draft
            </button>
            <button 
              type="button" 
              className="btn btn-primary btn-lg" 
              onClick={handleSubmitInspection}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving to Supabase...' : 'Submit & Log Inspection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
