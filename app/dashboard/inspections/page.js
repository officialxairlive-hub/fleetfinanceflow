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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Digital Inspections</h1>
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
            <label>Unit</label>
            <select className={styles.select} value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
              <option value="">Select Unit...</option>
              {units.map(t => (
                <option key={t.id} value={t.id}>Unit #{t.unit_number} ({t.make} {t.model})</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Inspector Name</label>
            <input type="text" className={styles.input} value={inspector} onChange={e => setInspector(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Date</label>
            <input type="date" className={styles.input} defaultValue={new Date().toISOString().split('T')[0]} />
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
                        className={`${styles.toggleBtn} ${styles.btnPass} ${itemState.status === 'pass' ? styles.active : ''}`}
                        onClick={() => handleToggle(item.id, 'pass')}
                      >
                        <CheckCircle size={18} /> Pass
                      </button>
                      <button 
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
              className={`${styles.resultBtn} ${styles.pass} ${overallResult === 'pass' ? styles.active : ''}`}
              onClick={() => setOverallResult('pass')}
            >
              Pass
            </button>
            <button 
              className={`${styles.resultBtn} ${styles.conditional} ${overallResult === 'conditional' ? styles.active : ''}`}
              onClick={() => setOverallResult('conditional')}
            >
              Conditional
            </button>
            <button 
              className={`${styles.resultBtn} ${styles.fail} ${overallResult === 'fail' ? styles.active : ''}`}
              onClick={() => setOverallResult('fail')}
            >
              Fail
            </button>
          </div>
          
          <div className={styles.signBox}>
            <div style={{ textAlign: 'center' }}>
              <FileSignature size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div>Tap or click to sign digital authorization</div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button className="btn btn-outline btn-lg" onClick={() => alert('Draft Saved')}>Save Draft</button>
            <button className="btn btn-primary btn-lg" onClick={() => alert('Inspection Logged to Supabase!')}>Submit Inspection</button>
          </div>
        </div>
      </div>
    </div>
  );
}
