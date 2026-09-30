'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Printer, Mail, CheckCircle, Plus, ChevronRight, Receipt, X, Wrench, Package, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { statusLabels } from '../../../lib/demoData';
import { calculateMarkupAndSellPrice, formatTierBracket } from '../../../lib/markupUtils';
import { getDefaultShopRateString, fetchShopSettings } from '../../../lib/shopConfig';
import styles from '../jobs.module.css';

const WORKFLOW_STEPS = ['new', 'diagnosing', 'waiting_parts', 'repairing', 'completed', 'ready_to_invoice', 'invoiced', 'paid'];

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  
  const [wo, setWo] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [inventoryParts, setInventoryParts] = useState([]);
  const [activeNotesTab, setActiveNotesTab] = useState('internal');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Labour Modal State
  const [showAddLabourModal, setShowAddLabourModal] = useState(false);
  const [savingLabour, setSavingLabour] = useState(false);
  const [defaultRate, setDefaultRate] = useState(() => getDefaultShopRateString());
  const [customerRate, setCustomerRate] = useState(null);
  const [shopRateTypes, setShopRateTypes] = useState([]);
  const [selectedRatePreset, setSelectedRatePreset] = useState('shop_default');
  const [labourForm, setLabourForm] = useState(() => ({
    description: '',
    hours: '1.5',
    rate: getDefaultShopRateString(),
    technician: '',
    jobGroup: ''
  }));

  // Parts Modal State
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [savingPart, setSavingPart] = useState(false);
  const [selectedInventoryPartId, setSelectedInventoryPartId] = useState('');
  const [partForm, setPartForm] = useState({
    partNumber: '',
    description: '',
    quantity: '1',
    cost: '0',
    sellPrice: '0.00',
    markup: '',
    jobGroup: ''
  });

  // Custom Shop Supplies State (Editable)
  const [customSupplies, setCustomSupplies] = useState(null);
  const [suppliesInput, setSuppliesInput] = useState('');

  // Delete Work Order State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteJob = async () => {
    setIsDeleting(true);
    try {
      // 1. Delete associated invoices & part requests to avoid foreign key errors
      await supabase.from('invoices').delete().eq('work_order_id', id);
      await supabase.from('part_requests').delete().eq('work_order_id', id);

      // 2. Delete work order
      const { error: delError } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);

      if (delError) throw delError;

      alert(`✅ Work Order #${id} was deleted successfully.`);
      router.push('/dashboard/jobs');
    } catch (err) {
      console.error('Error deleting work order:', err);
      alert(`Error deleting work order: ${err.message}`);
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchJob() {
      setIsLoading(true);
      try {
        const [woRes, techRes, partsRes, shopConfig] = await Promise.all([
          supabase.from('work_orders').select('*').eq('id', id).single(),
          supabase.from('technicians').select('*'),
          supabase.from('parts').select('*').order('part_number'),
          fetchShopSettings()
        ]);

        if (woRes.error) throw woRes.error;
        if (techRes.error) throw techRes.error;

        const data = woRes.data;

        // Resolve authoritative labour rate:
        // 1. Default Shop Rate from Settings
        // 2. Customer negotiated rate (if specified in Customers table)
        // 3. Fallback 145.00
        const shopRateNum = parseFloat(shopConfig?.defaultLabourRate) || 145.00;
        const shopRateStr = shopRateNum.toFixed(2);
        setDefaultRate(shopRateStr);
        setShopRateTypes(shopConfig?.labourRateTypes || []);

        let custRate = null;
        if (data.customer_id) {
          try {
            const { data: custData } = await supabase
              .from('customers')
              .select('labour_rate, custom_labour_rate')
              .eq('id', data.customer_id)
              .single();
            const cr = parseFloat(custData?.labour_rate) || parseFloat(custData?.custom_labour_rate);
            if (cr > 0) {
              custRate = cr;
            }
          } catch (_) {}
        } else if (data.customer_name) {
          try {
            const { data: custData } = await supabase
              .from('customers')
              .select('labour_rate, custom_labour_rate')
              .ilike('company', data.customer_name)
              .single();
            const cr = parseFloat(custData?.labour_rate) || parseFloat(custData?.custom_labour_rate);
            if (cr > 0) {
              custRate = cr;
            }
          } catch (_) {}
        }

        setCustomerRate(custRate);
        const effectiveRateStr = custRate ? custRate.toFixed(2) : shopRateStr;
        setSelectedRatePreset(custRate ? 'customer_rate' : 'shop_default');
        setLabourForm(prev => ({
          ...prev,
          rate: effectiveRateStr
        }));

        // Map data to component state
        const hours = Math.floor((data.timer || 0) / 3600);
        const mins = Math.floor(((data.timer || 0) % 3600) / 60);
        
        setWo({
          ...data,
          customerName: data.customer_name,
          unitNumber: data.unit_display,
          technicianId: data.technician_id || data.tech_id,
          timerDisplay: `${hours}:${mins.toString().padStart(2, '0')}`,
          labour: data.labour || [],
          parts: data.parts || []
        });

        setTechnicians(techRes.data || []);
        setInventoryParts(partsRes.data || []);

        // Check for saved custom shop supplies
        try {
          const { data: invData } = await supabase
            .from('invoices')
            .select('shop_supplies')
            .or(`id.eq.INV-${id.replace('WO-', '')},work_order_id.eq.${id}`)
            .limit(1)
            .maybeSingle();

          if (invData && invData.shop_supplies !== null && invData.shop_supplies !== undefined) {
            const val = parseFloat(invData.shop_supplies);
            setCustomSupplies(val);
            setSuppliesInput(val.toFixed(2));
          } else if (typeof window !== 'undefined') {
            const local = localStorage.getItem(`wo_supplies_${id}`);
            if (local !== null) {
              const val = parseFloat(local);
              setCustomSupplies(val);
              setSuppliesInput(val.toFixed(2));
            }
          }
        } catch (_) {}
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.message || 'Failed to load work order from Supabase.');
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleStatusAdvance = async (step) => {
    setWo(prev => ({ ...prev, status: step }));
    await supabase.from('work_orders').update({ status: step }).eq('id', id);
  };

  const handleTechChange = async (newTechId) => {
    const selectedTech = technicians.find(t => t.id === newTechId);
    const newTechName = selectedTech ? (selectedTech.full_name || selectedTech.name) : null;
    
    setWo(prev => ({
      ...prev,
      technicianId: newTechId || null,
      tech_id: newTechId || null,
      techName: newTechName,
      tech_name: newTechName
    }));

    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          tech_id: newTechId || null,
          tech_name: newTechName
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      alert(`Error updating technician: ${err.message}`);
    }
  };

  // Helper to synchronize any existing invoice with the authoritative Work Order
  const syncExistingInvoice = async (labourTotal, partsTotal, shopSupplies, tax, total) => {
    try {
      const invId = `INV-${id.replace('WO-', '')}`;
      await supabase
        .from('invoices')
        .update({
          labour_total: labourTotal,
          parts_total: partsTotal,
          shop_supplies: shopSupplies,
          tax_amount: tax,
          total: total
        })
        .or(`id.eq.${invId},work_order_id.eq.${id}`)
        .eq('status', 'draft');
    } catch (_) {}
  };

  // Labour Handlers
  const handleAddLabourLine = async (e) => {
    e.preventDefault();
    if (!labourForm.description.trim()) return;

    setSavingLabour(true);
    try {
      const hoursNum = parseFloat(labourForm.hours) || 0;
      const rateNum = parseFloat(labourForm.rate) || (customerRate || parseFloat(defaultRate) || 145.00);
      const newLine = {
        description: labourForm.description,
        hours: hoursNum,
        rate: rateNum,
        technician: labourForm.technician || wo.techName || 'Shop Tech',
        jobGroup: labourForm.jobGroup || ''
      };

      const updatedLabour = [...(wo.labour || []), newLine];
      
      const labourTotal = updatedLabour.reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
      const partsTotal = (wo.parts || []).reduce((sum, p) => sum + ((parseFloat(p.quantity || p.qty) || 0) * (parseFloat(p.sellPrice || p.price || p.sell) || 0)), 0);
      const autoSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
      const shopSupplies = customSupplies !== null ? customSupplies : autoSupplies;
      const subtotal = labourTotal + partsTotal + shopSupplies;
      const tax = subtotal * 0.05;
      const newEstimatedCost = subtotal + tax;

      const { error } = await supabase
        .from('work_orders')
        .update({
          labour: updatedLabour,
          estimated_cost: newEstimatedCost
        })
        .eq('id', id);

      if (error) throw error;

      await syncExistingInvoice(labourTotal, partsTotal, shopSupplies, tax, newEstimatedCost);

      setWo(prev => ({
        ...prev,
        labour: updatedLabour,
        estimated_cost: newEstimatedCost
      }));

      setShowAddLabourModal(false);
      const activeDefault = customerRate ? customerRate.toFixed(2) : (defaultRate || '145.00');
      setLabourForm({
        description: '',
        hours: '1.5',
        rate: activeDefault,
        technician: '',
        jobGroup: ''
      });
      setSelectedRatePreset(customerRate ? 'customer_rate' : 'shop_default');
    } catch (err) {
      alert(`Error adding labour line: ${err.message}`);
    } finally {
      setSavingLabour(false);
    }
  };

  const handleRemoveLabourLine = async (indexToRemove) => {
    if (!confirm('Are you sure you want to remove this labour line?')) return;

    const updatedLabour = (wo.labour || []).filter((_, i) => i !== indexToRemove);
    const labourTotal = updatedLabour.reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
    const partsTotal = (wo.parts || []).reduce((sum, p) => sum + ((parseFloat(p.quantity || p.qty) || 0) * (parseFloat(p.sellPrice || p.price || p.sell) || 0)), 0);
    const autoSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
    const shopSupplies = customSupplies !== null ? customSupplies : autoSupplies;
    const subtotal = labourTotal + partsTotal + shopSupplies;
    const tax = subtotal * 0.05;
    const newEstimatedCost = subtotal + tax;

    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          labour: updatedLabour,
          estimated_cost: newEstimatedCost
        })
        .eq('id', id);

      if (error) throw error;

      await syncExistingInvoice(labourTotal, partsTotal, shopSupplies, tax, newEstimatedCost);

      setWo(prev => ({
        ...prev,
        labour: updatedLabour,
        estimated_cost: newEstimatedCost
      }));
    } catch (err) {
      alert(`Error removing labour line: ${err.message}`);
    }
  };

  // Parts Handlers
  const handleSelectInventoryPart = (e) => {
    const partId = e.target.value;
    setSelectedInventoryPartId(partId);

    if (partId) {
      const p = inventoryParts.find(item => item.id === partId);
      if (p) {
        const costVal = p.cost || 0;
        const defaultCalc = calculateMarkupAndSellPrice(costVal);
        const sellVal = p.sell || p.price || defaultCalc.sellPrice;
        const markupVal = costVal > 0 ? (((sellVal - costVal) / costVal) * 100).toFixed(0) : defaultCalc.markup.toString();
        const tierLabel = defaultCalc.matchedTier ? (defaultCalc.matchedTier.label || formatTierBracket(defaultCalc.matchedTier)) : `Default (${markupVal}%)`;

        setPartForm({
          partNumber: p.part_number,
          description: p.description,
          quantity: '1',
          cost: costVal.toString(),
          sellPrice: sellVal.toString(),
          markup: markupVal,
          tierLabel
        });
      }
    }
  };

  const handleJobPartCostChange = (costVal) => {
    const c = parseFloat(costVal) || 0;
    if (costVal === '' || c <= 0) {
      setPartForm(prev => ({ ...prev, cost: costVal, sellPrice: '0.00', markup: '', tierLabel: '' }));
      return;
    }
    const calc = calculateMarkupAndSellPrice(c);
    setPartForm(prev => ({
      ...prev,
      cost: costVal,
      sellPrice: calc.sellPrice.toFixed(2),
      markup: calc.markup.toString(),
      tierLabel: calc.matchedTier ? (calc.matchedTier.label || formatTierBracket(calc.matchedTier)) : `Fallback (${calc.markup}%)`
    }));
  };

  const handleAddPartLine = async (e) => {
    e.preventDefault();
    if (!partForm.description.trim()) return;

    setSavingPart(true);
    try {
      const qtyNum = parseInt(partForm.quantity) || 1;
      const costNum = parseFloat(partForm.cost) || 0;
      const sellPriceNum = parseFloat(partForm.sellPrice) || 0;
      const finalPartNumber = partForm.partNumber.trim() || 'N/A';

      const newPartItem = {
        partNumber: finalPartNumber,
        part_number: finalPartNumber,
        description: partForm.description,
        quantity: qtyNum,
        cost: costNum,
        sellPrice: sellPriceNum,
        price: sellPriceNum,
        jobGroup: partForm.jobGroup || ''
      };

      const updatedParts = [...(wo.parts || []), newPartItem];
      
      const labourTotal = (wo.labour || []).reduce((sum, l) => sum + ((l.hours || 0) * (l.rate || 0)), 0);
      const partsTotal = updatedParts.reduce((sum, p) => sum + ((p.quantity || 0) * (p.sellPrice || p.price || 0)), 0);
      const autoSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
      const shopSupplies = customSupplies !== null ? customSupplies : autoSupplies;
      const subtotal = labourTotal + partsTotal + shopSupplies;
      const tax = subtotal * 0.05;
      const newEstimatedCost = subtotal + tax;

      const { error } = await supabase
        .from('work_orders')
        .update({
          parts: updatedParts,
          estimated_cost: newEstimatedCost
        })
        .eq('id', id);

      if (error) throw error;

      await syncExistingInvoice(labourTotal, partsTotal, shopSupplies, tax, newEstimatedCost);

      if (selectedInventoryPartId) {
        const invPart = inventoryParts.find(p => p.id === selectedInventoryPartId);
        if (invPart) {
          const newQty = Math.max(0, (invPart.qty_on_hand || 0) - qtyNum);
          await supabase.from('parts').update({ qty_on_hand: newQty }).eq('id', selectedInventoryPartId);
        }
      }

      setWo(prev => ({
        ...prev,
        parts: updatedParts,
        estimated_cost: newEstimatedCost
      }));

      setShowAddPartModal(false);
      setSelectedInventoryPartId('');
      setPartForm({
        partNumber: '',
        description: '',
        quantity: '1',
        cost: '0',
        sellPrice: '0.00',
        markup: '',
        tierLabel: '',
        jobGroup: ''
      });
    } catch (err) {
      alert(`Error adding part: ${err.message}`);
    } finally {
      setSavingPart(false);
    }
  };

  const handleRemovePartLine = async (indexToRemove) => {
    if (!confirm('Are you sure you want to remove this part?')) return;

    const updatedParts = (wo.parts || []).filter((_, i) => i !== indexToRemove);
    const labourTotal = (wo.labour || []).reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
    const partsTotal = updatedParts.reduce((sum, p) => sum + ((parseFloat(p.quantity || p.qty) || 0) * (parseFloat(p.sellPrice || p.price || p.sell) || 0)), 0);
    const autoSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
    const shopSupplies = customSupplies !== null ? customSupplies : autoSupplies;
    const subtotal = labourTotal + partsTotal + shopSupplies;
    const tax = subtotal * 0.05;
    const newEstimatedCost = subtotal + tax;

    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          parts: updatedParts,
          estimated_cost: newEstimatedCost
        })
        .eq('id', id);

      if (error) throw error;

      await syncExistingInvoice(labourTotal, partsTotal, shopSupplies, tax, newEstimatedCost);

      setWo(prev => ({
        ...prev,
        parts: updatedParts,
        estimated_cost: newEstimatedCost
      }));
    } catch (err) {
      alert(`Error removing part: ${err.message}`);
    }
  };

  const handleOpenAddLabourModal = (targetJob = '') => {
    const activeDefault = customerRate ? customerRate.toFixed(2) : (defaultRate || '145.00');
    setLabourForm({
      description: '',
      hours: '1.5',
      rate: activeDefault,
      technician: '',
      jobGroup: targetJob
    });
    setSelectedRatePreset(customerRate ? 'customer_rate' : 'shop_default');
    setShowAddLabourModal(true);
  };

  const handleOpenAddPartModal = (targetJob = '') => {
    setPartForm({
      partNumber: '',
      description: '',
      quantity: '1',
      cost: '0',
      sellPrice: '0.00',
      markup: '',
      tierLabel: '',
      jobGroup: targetJob
    });
    setSelectedInventoryPartId('');
    setShowAddPartModal(true);
  };

  const getJobSections = () => {
    if (!wo) return [];
    const allLabour = wo.labour || [];
    const allParts = wo.parts || [];

    const groupNames = [];
    const addGrp = (name) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      if (!groupNames.includes(trimmed)) groupNames.push(trimmed);
    };

    allLabour.forEach(l => addGrp(l.jobGroup));
    allParts.forEach(p => addGrp(p.jobGroup));

    if (groupNames.length === 0) {
      return [{
        name: 'Job 1',
        labour: allLabour.map((l, originalIndex) => ({ ...l, originalIndex })),
        parts: allParts.map((p, originalIndex) => ({ ...p, originalIndex }))
      }];
    }

    const sections = groupNames.map((gName) => ({
      name: gName,
      labour: allLabour
        .map((l, originalIndex) => ({ ...l, originalIndex }))
        .filter(l => (l.jobGroup || '').trim().toLowerCase() === gName.toLowerCase()),
      parts: allParts
        .map((p, originalIndex) => ({ ...p, originalIndex }))
        .filter(p => (p.jobGroup || '').trim().toLowerCase() === gName.toLowerCase())
    }));

    const unassignedLabour = allLabour
      .map((l, originalIndex) => ({ ...l, originalIndex }))
      .filter(l => !groupNames.some(g => g.toLowerCase() === (l.jobGroup || '').trim().toLowerCase()));
    const unassignedParts = allParts
      .map((p, originalIndex) => ({ ...p, originalIndex }))
      .filter(p => !groupNames.some(g => g.toLowerCase() === (p.jobGroup || '').trim().toLowerCase()));

    if (unassignedLabour.length > 0 || unassignedParts.length > 0) {
      sections.push({
        name: 'General / Additional Services',
        labour: unassignedLabour,
        parts: unassignedParts
      });
    }

    return sections;
  };

  const getStatusClass = (status) => {
    const map = {
      'new': styles['status-new'],
      'diagnosing': styles['status-diagnosing'],
      'waiting_parts': styles['status-waiting'],
      'repairing': styles['status-repairing'],
      'completed': styles['status-completed'],
      'ready_to_invoice': styles['status-ready'],
      'invoiced': styles['status-invoiced'],
      'paid': styles['status-paid']
    };
    return map[status] || '';
  };

  const calculateTotals = () => {
    if (!wo) return { labourTotal: 0, partsTotal: 0, shopSupplies: 0, autoSupplies: 0, subtotal: 0, tax: 0, total: 0 };
    
    const labourTotal = (wo.labour || []).reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
    const partsTotal = (wo.parts || []).reduce((sum, p) => sum + ((parseFloat(p.quantity || p.qty) || 0) * (parseFloat(p.sellPrice || p.price || p.sell) || 0)), 0);
    const autoSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
    const shopSupplies = customSupplies !== null ? customSupplies : autoSupplies;
    const subtotal = labourTotal + partsTotal + shopSupplies;
    const tax = subtotal * 0.05; 
    
    return {
      labourTotal,
      partsTotal,
      shopSupplies,
      autoSupplies,
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const handleShopSuppliesChange = async (valStr) => {
    setSuppliesInput(valStr);
    const parsed = parseFloat(valStr);
    const newSupplies = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setCustomSupplies(newSupplies);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`wo_supplies_${id}`, String(newSupplies));
    }

    const labourTotal = (wo?.labour || []).reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
    const partsTotal = (wo?.parts || []).reduce((sum, p) => sum + ((parseFloat(p.quantity || p.qty) || 0) * (parseFloat(p.sellPrice || p.price || p.sell) || 0)), 0);
    const subtotal = labourTotal + partsTotal + newSupplies;
    const tax = subtotal * 0.05;
    const newTotal = subtotal + tax;

    await syncExistingInvoice(labourTotal, partsTotal, newSupplies, tax, newTotal);
    try {
      await supabase.from('work_orders').update({ estimated_cost: newTotal }).eq('id', id);
    } catch (_) {}
    setWo(prev => ({ ...prev, estimated_cost: newTotal }));
  };

  const handleResetShopSupplies = async () => {
    setCustomSupplies(null);
    setSuppliesInput('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`wo_supplies_${id}`);
    }

    const labourTotal = (wo?.labour || []).reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
    const partsTotal = (wo?.parts || []).reduce((sum, p) => sum + ((parseFloat(p.quantity || p.qty) || 0) * (parseFloat(p.sellPrice || p.price || p.sell) || 0)), 0);
    const autoSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
    const subtotal = labourTotal + partsTotal + autoSupplies;
    const tax = subtotal * 0.05;
    const newTotal = subtotal + tax;

    await syncExistingInvoice(labourTotal, partsTotal, autoSupplies, tax, newTotal);
    try {
      await supabase.from('work_orders').update({ estimated_cost: newTotal }).eq('id', id);
    } catch (_) {}
    setWo(prev => ({ ...prev, estimated_cost: newTotal }));
  };

  if (isLoading) {
    return <div className={styles.pageContainer} style={{ padding: '3rem', textAlign: 'center' }}>Loading work order details...</div>;
  }

  if (error || !wo) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'red' }}>{error || 'Work Order Not Found'}</h2>
          <Link href="/dashboard/jobs" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Work Orders</Link>
        </div>
      </div>
    );
  }

  const handleConvertToInvoice = async () => {
    try {
      const invId = `INV-${wo.id.replace('WO-', '')}`;
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

      // Exact mathematical calculation strictly from Work Order authoritative lines
      const computedTotals = calculateTotals();

      const { data, error } = await supabase
        .from('invoices')
        .upsert([{
          id: invId,
          customer_id: wo.customer_id,
          work_order_id: wo.id,
          total: computedTotals.total,
          tax_amount: computedTotals.tax,
          labour_total: computedTotals.labourTotal,
          parts_total: computedTotals.partsTotal,
          shop_supplies: computedTotals.shopSupplies,
          status: 'draft',
          issue_date: today,
          due_date: dueDate
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('work_orders')
        .update({ status: 'invoiced', estimated_cost: computedTotals.total })
        .eq('id', wo.id);

      alert(`✅ Invoice #${invId} generated directly from Work Order #${wo.id}!`);
      router.push(`/dashboard/invoices/${invId}`);
    } catch (err) {
      alert(`Error generating invoice: ${err.message}`);
    }
  };

  const totals = calculateTotals();

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/dashboard/jobs" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '8px' }}>
            <ArrowLeft size={16} /> Back to Work Orders
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1>{wo.id}</h1>
            <span className={`${styles.pill} ${getStatusClass(wo.status)}`}>{(statusLabels[wo.status] || {}).label || wo.status}</span>
            <span style={{fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'3px 6px', borderRadius:'10px'}}>SUPABASE</span>
          </div>
          <p>{wo.customerName} - {wo.unitNumber}</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className="btn btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            onClick={() => {
              const liveLink = `${window.location.origin}/approve/${wo.id}`;
              navigator.clipboard?.writeText(liveLink);
              alert(`📋 Live Customer Tracking & Approval Link copied to clipboard:\n${liveLink}`);
            }}
            title="Copy live customer tracking and payment link"
          >
            <ExternalLink size={18} /> Copy Customer Link
          </button>
          <button className="btn btn-outline" onClick={() => window.print()}><Printer size={18} /> Print</button>
          <button className="btn btn-outline" onClick={() => alert(`Emailing WO #${wo.id} summary to customer...`)}><Mail size={18} /> Email</button>
          {wo.status === 'invoiced' || wo.status === 'paid' ? (
            <Link href={`/dashboard/invoices/INV-${wo.id.replace('WO-', '')}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Receipt size={18} /> View Invoice
            </Link>
          ) : (
            <button className="btn btn-primary" onClick={handleConvertToInvoice} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Receipt size={18} /> Convert to Invoice
            </button>
          )}
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={() => setShowDeleteModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', borderColor: '#FECACA' }}
            title="Delete this work order permanently"
          >
            <Trash2 size={18} /> Delete WO
          </button>
        </div>
      </header>

      {/* Workflow Bar */}
      <div className={styles.workflowBar}>
        {WORKFLOW_STEPS.map((step, idx) => {
          const isActive = wo.status === step;
          return (
            <button 
              key={step} 
              className={`${styles.workflowStep} ${isActive ? styles.workflowStepActive : ''}`}
              onClick={() => handleStatusAdvance(step)}
            >
              <span className={styles.stepNum}>{idx + 1}</span>
              <span className={styles.stepLabel}>{(statusLabels[step] || {}).label || step}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.gridTwoCol}>
        <div className={styles.leftCol} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Unit & Customer Info */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Unit Information</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <span className={styles.label}>Customer</span>
                <p style={{ fontWeight: 'bold' }}>{wo.customerName || 'N/A'}</p>
              </div>
              <div>
                <span className={styles.label}>Unit #</span>
                <p style={{ fontWeight: 'bold' }}>{wo.unitNumber || 'N/A'}</p>
              </div>
              <div>
                <span className={styles.label}>Trailer</span>
                <p>{wo.trailer || 'None'}</p>
              </div>
              <div>
                <span className={styles.label}>Priority</span>
                <p style={{ textTransform: 'capitalize' }}>{wo.priority || 'Normal'}</p>
              </div>
            </div>
          </div>

          {/* Job Sections (Each Job has Labour Lines then Parts) */}
          {getJobSections().map((sec, secIdx) => (
            <div key={secIdx} className={styles.card} style={{ borderLeft: '4px solid var(--color-primary)' }}>
              {/* Job Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', fontWeight: 700 }}>
                    Job {secIdx + 1}
                  </span>
                  <h2 className={styles.cardTitle} style={{ margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px' }}>
                    <Wrench size={18} color="var(--color-primary)" />
                    {sec.name}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleOpenAddLabourModal(sec.name)}
                    style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                  >
                    <Plus size={14} /> + Add Labour
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleOpenAddPartModal(sec.name)}
                    style={{ padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                  >
                    <Plus size={14} /> + Add Part
                  </button>
                </div>
              </div>

              {/* 1. Labour Lines for this Job */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Labour Services
                  </span>
                </div>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style={{ width: '100px' }}>Hours</th>
                        <th style={{ width: '120px' }}>Rate ($/hr)</th>
                        <th style={{ width: '130px' }}>Total ($ CAD)</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.labour && sec.labour.length > 0 ? (
                        sec.labour.map((l) => (
                          <tr key={l.originalIndex}>
                            <td>
                              <div style={{ fontWeight: 600, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{l.description}</div>
                              {l.technician && <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Tech: {l.technician}</span>}
                            </td>
                            <td>{l.hours} hrs</td>
                            <td>${parseFloat(l.rate || 0).toFixed(2)}</td>
                            <td><strong>${((parseFloat(l.hours || 0)) * (parseFloat(l.rate || 0))).toFixed(2)}</strong></td>
                            <td>
                              <button 
                                type="button"
                                onClick={() => handleRemoveLabourLine(l.originalIndex)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                title="Remove Labour Line"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '13px' }}>No labour lines in this job section. Click &quot;+ Add Labour&quot; above.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Parts for this Job */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Parts & Materials
                  </span>
                </div>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ width: '130px' }}>Part #</th>
                        <th>Description</th>
                        <th style={{ width: '70px' }}>Qty</th>
                        <th style={{ width: '120px' }}>Price ($ CAD)</th>
                        <th style={{ width: '130px' }}>Total ($ CAD)</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.parts && sec.parts.length > 0 ? (
                        sec.parts.map((p) => (
                          <tr key={p.originalIndex}>
                            <td><strong>{p.partNumber || p.part_number || 'N/A'}</strong></td>
                            <td>{p.description}</td>
                            <td>{p.quantity}</td>
                            <td>${parseFloat(p.sellPrice || p.price || 0).toFixed(2)}</td>
                            <td><strong>${((parseFloat(p.quantity || 0)) * (parseFloat(p.sellPrice || p.price || 0))).toFixed(2)}</strong></td>
                            <td>
                              <button 
                                type="button"
                                onClick={() => handleRemovePartLine(p.originalIndex)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                title="Remove Part Line"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '13px' }}>No parts added to this job section. Click &quot;+ Add Part&quot; above.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Job Section Line Items Subtotal */}
              {(() => {
                const lTot = (sec.labour || []).reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
                const pTot = (sec.parts || []).reduce((sum, p) => sum + ((parseFloat(p.quantity) || 0) * (parseFloat(p.sellPrice || p.price) || 0)), 0);
                const secSubtotal = lTot + pTot;
                return (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      Line items subtotal:
                    </span>
                    <strong style={{ fontSize: '15px', color: 'var(--color-text)' }}>
                      ${secSubtotal.toFixed(2)}
                    </strong>
                  </div>
                );
              })()}
            </div>
          ))}

          {/* Add Another Job Section Button */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleOpenAddLabourModal(`Job ${getJobSections().length + 1}`)}
            style={{
              padding: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: '2px dashed var(--color-border)',
              borderRadius: '10px',
              backgroundColor: 'var(--color-surface)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} color="var(--color-primary)" />
            + Add Another Job Section on this Truck (Job {getJobSections().length + 1})
          </button>

        </div>

        <div className={styles.rightCol} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Assignment & Timer */}
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className={styles.cardTitle}>Assignment</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <Clock size={18} /> {wo.timerDisplay || '0:00'}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Assigned Technician</label>
              <select 
                className={styles.select} 
                value={wo.technicianId || wo.tech_id || ''} 
                onChange={(e) => handleTechChange(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
              >
                <option value="">Unassigned (None)</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.name} ({t.role || t.tech_type || 'Mechanic'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Summary */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Financial Summary</h2>
            <div className={styles.summaryRow}>
              <span>Labor</span>
              <span>${totals.labour.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Parts</span>
              <span>${totals.parts.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow} style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>Shop Supplies</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {customSupplies !== null ? (
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      Custom • <button type="button" onClick={handleResetShopSupplies} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '11px' }}>Auto (5% max $50)</button>
                    </span>
                  ) : (
                    'Auto (5% max $50)'
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontWeight: 600 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={totals.autoSupplies.toFixed(2)}
                  value={suppliesInput !== '' ? suppliesInput : (customSupplies !== null ? customSupplies.toFixed(2) : totals.shopSupplies.toFixed(2))}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleShopSuppliesChange(e.target.value)}
                  style={{
                    width: '90px',
                    padding: '4px 8px',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>
            </div>
            <div className={styles.summaryRow} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '6px' }}>
              <span style={{ fontWeight: 600 }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax (5% GST)</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total ($ CAD)</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className={styles.card}>
            <div className={styles.tabs} style={{ paddingBottom: 0, marginBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
              <button 
                className={`${styles.tab} ${activeNotesTab === 'internal' ? styles.activeTab : ''}`}
                onClick={() => setActiveNotesTab('internal')}
                style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
              >
                Internal
              </button>
              <button 
                className={`${styles.tab} ${activeNotesTab === 'customer' ? styles.activeTab : ''}`}
                onClick={() => setActiveNotesTab('customer')}
                style={{ borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}
              >
                Customer
              </button>
            </div>
            <textarea 
              className={styles.textarea} 
              placeholder={activeNotesTab === 'internal' ? "Shop notes (not printed)..." : "Notes to appear on invoice..."}
              defaultValue={activeNotesTab === 'internal' ? wo.internal_notes : wo.customer_notes}
            ></textarea>
          </div>

        </div>
      </div>

      {/* Add Labour Modal */}
      {showAddLabourModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} color="var(--color-primary)" />
                Add Labour Line
              </h2>
              <button onClick={() => setShowAddLabourModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddLabourLine}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    Job / Section Name <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>(e.g. Job 1 - Brakes, Job 2 - Engine)</span>
                  </label>
                  <input
                    type="text"
                    list="existing-job-groups"
                    placeholder="e.g. Job 1 - Front Brakes"
                    value={labourForm.jobGroup}
                    onChange={(e) => setLabourForm({ ...labourForm, jobGroup: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                  <datalist id="existing-job-groups">
                    {Array.from(new Set([...(wo?.labour || []).map(l => l.jobGroup), ...(wo?.parts || []).map(p => p.jobGroup)].filter(Boolean))).map((g, idx) => (
                      <option key={idx} value={g} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Detailed Labour Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Detailed description of service, diagnosis, repairs performed and road testing..."
                    value={labourForm.description}
                    onChange={(e) => setLabourForm({ ...labourForm, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600' }}>Labour Rate Preset / Type</label>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>
                      Shop Default: ${defaultRate} CAD/hr
                    </span>
                  </div>
                  <select
                    value={selectedRatePreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedRatePreset(val);
                      if (val === 'shop_default') {
                        setLabourForm(prev => ({ ...prev, rate: defaultRate }));
                      } else if (val === 'customer_rate' && customerRate) {
                        setLabourForm(prev => ({ ...prev, rate: customerRate.toFixed(2) }));
                      } else if (val === 'custom') {
                        // Keep current typed rate
                      } else {
                        const matched = (shopRateTypes || []).find(t => t.id === val);
                        if (matched) {
                          setLabourForm(prev => ({ ...prev, rate: parseFloat(matched.rate).toFixed(2) }));
                        }
                      }
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '13px' }}
                  >
                    <option value="shop_default">Shop Default Rate (${defaultRate} CAD/hr — from Settings)</option>
                    {customerRate && (
                      <option value="customer_rate">Customer Negotiated Rate (${customerRate.toFixed(2)} CAD/hr)</option>
                    )}
                    {(shopRateTypes || [])
                      .filter(t => t.id !== 'shop')
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} (${parseFloat(t.rate).toFixed(2)} CAD/hr)
                        </option>
                      ))}
                    <option value="custom">Custom / Manual Rate</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Billed Hours</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="1.5"
                      value={labourForm.hours}
                      onChange={(e) => setLabourForm({ ...labourForm, hours: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600' }}>Rate ($ CAD/hr)</label>
                      <button
                        type="button"
                        onClick={() => {
                          setLabourForm(prev => ({ ...prev, rate: defaultRate }));
                          setSelectedRatePreset('shop_default');
                        }}
                        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Reset to ${defaultRate}
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder={defaultRate || "145.00"}
                      value={labourForm.rate}
                      onChange={(e) => {
                        setLabourForm({ ...labourForm, rate: e.target.value });
                        setSelectedRatePreset('custom');
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                {/* Quick Presets Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '-4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setLabourForm(prev => ({ ...prev, rate: defaultRate }));
                      setSelectedRatePreset('shop_default');
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: labourForm.rate === defaultRate ? 'var(--color-primary-light, #eff6ff)' : 'transparent',
                      color: labourForm.rate === defaultRate ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontWeight: labourForm.rate === defaultRate ? 600 : 400
                    }}
                  >
                    Shop Default: ${defaultRate}
                  </button>
                  {customerRate && (
                    <button
                      type="button"
                      onClick={() => {
                        setLabourForm(prev => ({ ...prev, rate: customerRate.toFixed(2) }));
                        setSelectedRatePreset('customer_rate');
                      }}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: labourForm.rate === customerRate.toFixed(2) ? 'var(--color-primary-light, #eff6ff)' : 'transparent',
                        color: labourForm.rate === customerRate.toFixed(2) ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontWeight: labourForm.rate === customerRate.toFixed(2) ? 600 : 400
                      }}
                    >
                      Customer: ${customerRate.toFixed(2)}
                    </button>
                  )}
                  {(shopRateTypes || [])
                    .filter(t => t.id !== 'shop')
                    .map(t => {
                      const tRateStr = parseFloat(t.rate).toFixed(2);
                      const isSelected = labourForm.rate === tRateStr;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setLabourForm(prev => ({ ...prev, rate: tRateStr }));
                            setSelectedRatePreset(t.id);
                          }}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: isSelected ? 'var(--color-primary-light, #eff6ff)' : 'transparent',
                            color: isSelected ? 'var(--color-primary, #2563eb)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontWeight: isSelected ? 600 : 400
                          }}
                        >
                          {t.name}: ${tRateStr}
                        </button>
                      );
                    })}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Technician</label>
                  <select
                    value={labourForm.technician}
                    onChange={(e) => setLabourForm({ ...labourForm, technician: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">{wo.techName || 'Assign to general shop'}</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.full_name || t.name}>{t.full_name || t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddLabourModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingLabour}>
                  {savingLabour ? 'Saving...' : 'Add Labour Line'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      {showAddPartModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={20} color="var(--color-primary)" />
                Add Part / Material
              </h2>
              <button onClick={() => setShowAddPartModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPartLine}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '20px' }}>
                {inventoryParts.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Pick from Warehouse Inventory</label>
                    <select
                      value={selectedInventoryPartId}
                      onChange={handleSelectInventoryPart}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    >
                      <option value="">-- Or enter custom part below --</option>
                      {inventoryParts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.part_number} - {p.description} (Stock: {p.qty_on_hand}) - ${(p.sell || p.price || 0).toFixed(2)} CAD
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                    Assign to Job / Section <span style={{ color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>(e.g. Job 1 - Brakes, Job 2 - Engine)</span>
                  </label>
                  <input
                    type="text"
                    list="existing-job-groups-part"
                    placeholder="e.g. Job 1 - Front Brakes"
                    value={partForm.jobGroup}
                    onChange={(e) => setPartForm({ ...partForm, jobGroup: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                  <datalist id="existing-job-groups-part">
                    {Array.from(new Set([...(wo?.labour || []).map(l => l.jobGroup), ...(wo?.parts || []).map(p => p.jobGroup)].filter(Boolean))).map((g, idx) => (
                      <option key={idx} value={g} />
                    ))}
                  </datalist>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Part # (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. FL-2040-BRK"
                      value={partForm.partNumber}
                      onChange={(e) => setPartForm({ ...partForm, partNumber: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="1"
                      value={partForm.quantity}
                      onChange={(e) => setPartForm({ ...partForm, quantity: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Part Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Heavy Duty Brake Shoes Set"
                    value={partForm.description}
                    onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Unit Cost ($ CAD)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={partForm.cost}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleJobPartCostChange(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                    {partForm.tierLabel && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '3px' }}>
                        ⚡ Tier Applied: {partForm.tierLabel} ({partForm.markup}% Markup)
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600' }}>Customer Sell Price ($ CAD)</label>
                      {partForm.markup && (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                          Markup: {partForm.markup}%
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={partForm.sellPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const sVal = e.target.value;
                        const sNum = parseFloat(sVal) || 0;
                        const cNum = parseFloat(partForm.cost) || 0;
                        const mVal = cNum > 0 ? (((sNum - cNum) / cNum) * 100).toFixed(0) : '';
                        setPartForm({ ...partForm, sellPrice: sVal, markup: mVal, tierLabel: 'Manual Override' });
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddPartModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingPart}>
                  {savingPart ? 'Adding...' : 'Add Part to RO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Work Order Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                    Delete Work Order
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {wo.id} • {wo.customerName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => !isDeleting && setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px', fontSize: '13px', color: 'var(--color-text)' }}>
              <div style={{ marginBottom: '4px' }}><strong>Unit:</strong> {wo.unitNumber || 'N/A'}</div>
              <div><strong>Status:</strong> {(statusLabels[wo.status] || {}).label || wo.status}</div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete this repair order? All associated labor lines, parts assignments, and customer portal links for this work order will be removed from Supabase. This cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={confirmDeleteJob}
                disabled={isDeleting}
                style={{
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {isDeleting ? 'Deleting...' : (
                  <>
                    <Trash2 size={16} /> Delete Work Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
