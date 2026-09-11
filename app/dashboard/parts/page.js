'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './parts.module.css';
import { supabase } from '../../lib/supabaseClient';
import { Search, Plus, Package, DollarSign, AlertTriangle, ArrowUpDown, Edit, History, X, ChevronUp, ChevronDown, CheckCircle, Clock, ShoppingCart, Sparkles, UploadCloud, FileText, Trash2, Check, RefreshCw, Layers } from 'lucide-react';
import { calculateMarkupAndSellPrice, formatTierBracket, getSavedMarkupSettings } from '../../lib/markupUtils';

const CATEGORIES = ['All', 'Brakes', 'Engine', 'Drivetrain', 'Air System', 'Suspension', 'HVAC', 'Fluids', 'Filters'];

export default function PartsPage() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'requests'

  const [parts, setParts] = useState([]);
  const [partRequests, setPartRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // AI Scanner States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanStep, setAiScanStep] = useState('');
  const [aiInvoiceData, setAiInvoiceData] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [isAiImporting, setIsAiImporting] = useState(false);

  // Form States
  const [partForm, setPartForm] = useState({
    partNumber: '',
    category: 'Brakes',
    description: '',
    supplier: '',
    binLocation: '',
    cost: '',
    sellPrice: '',
    minStock: '2',
    maxStock: '10',
    coreCharge: '0',
    initialQty: '0'
  });

  const [adjustForm, setAdjustForm] = useState({
    adjustment: '',
    reason: 'Received',
    notes: ''
  });

  const [receiveForm, setReceiveForm] = useState({
    neededQty: 1,
    receivedQty: 1,
    cost: '45.00',
    sellPrice: '65.00',
    category: 'Engine',
    binLocation: 'A-01',
    supplier: 'FleetPride'
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'partNumber', direction: 'asc' });

  const fetchPartsAndRequests = async () => {
    setIsLoading(true);
    try {
      const [partsRes, reqRes] = await Promise.all([
        supabase.from('parts').select('*').order('part_number', { ascending: true }),
        supabase.from('part_requests').select('*').order('created_at', { ascending: false })
      ]);
        
      if (partsRes.error) throw partsRes.error;
      
      const mappedParts = (partsRes.data || []).map(p => ({
        ...p,
        partNumber: p.part_number,
        qtyOnHand: p.qty_on_hand,
        minStock: p.min_stock,
        maxStock: p.max_stock || (p.min_stock * 2),
        coreCharge: p.core_charge,
        sellPrice: p.sell || p.price,
        binLocation: p.bin_location || p.location || '-'
      }));
      
      setParts(mappedParts);
      setPartRequests(reqRes.data || []);
    } catch (err) {
      console.error("Error fetching parts data:", err);
      setError(err.message || 'Failed to fetch data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartsAndRequests();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredParts = useMemo(() => {
    let filtered = [...parts];

    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.partNumber || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.supplier || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [parts, activeCategory, searchQuery, sortConfig]);

  // KPIs
  const totalParts = parts.length;
  const totalValue = parts.reduce((sum, p) => sum + ((Number(p.cost) || 0) * (Number(p.qtyOnHand) || 0)), 0);
  const lowStockCount = parts.filter(p => Number(p.qtyOnHand) < Number(p.minStock)).length;
  const pendingRequestsCount = partRequests.filter(r => r.status === 'pending').length;

  const openAddModal = () => {
    setSelectedPart(null);
    setPartForm({
      partNumber: '',
      category: 'Brakes',
      description: '',
      supplier: '',
      binLocation: '',
      cost: '',
      sellPrice: '',
      markup: '35',
      appliedTierLabel: '',
      minStock: '2',
      maxStock: '10',
      coreCharge: '0',
      initialQty: '5'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (part) => {
    setSelectedPart(part);
    const costNum = parseFloat(part.cost) || 0;
    const calc = calculateMarkupAndSellPrice(costNum);
    setPartForm({
      partNumber: part.partNumber || '',
      category: part.category || 'Brakes',
      description: part.description || '',
      supplier: part.supplier || '',
      binLocation: part.binLocation || '',
      cost: part.cost?.toString() || '',
      sellPrice: part.sellPrice?.toString() || '',
      markup: part.markup ? part.markup.toString() : calc.markup.toString(),
      appliedTierLabel: calc.matchedTier ? (calc.matchedTier.label || formatTierBracket(calc.matchedTier)) : `Fallback (${calc.markup}%)`,
      minStock: part.minStock?.toString() || '2',
      maxStock: part.maxStock?.toString() || '10',
      coreCharge: part.coreCharge?.toString() || '0',
      initialQty: part.qtyOnHand?.toString() || '0'
    });
    setIsEditModalOpen(true);
  };

  const handlePartCostChange = (costVal) => {
    const c = parseFloat(costVal) || 0;
    if (costVal === '' || c <= 0) {
      setPartForm(prev => ({ ...prev, cost: costVal, sellPrice: '', appliedTierLabel: '', markup: '' }));
      return;
    }
    const calc = calculateMarkupAndSellPrice(c);
    setPartForm(prev => ({
      ...prev,
      cost: costVal,
      sellPrice: calc.sellPrice.toFixed(2),
      markup: calc.markup.toString(),
      appliedTierLabel: calc.matchedTier ? (calc.matchedTier.label || formatTierBracket(calc.matchedTier)) : `Fallback (${calc.markup}%)`
    }));
  };

  const handlePartSellPriceChange = (sellVal) => {
    const sell = parseFloat(sellVal) || 0;
    const cost = parseFloat(partForm.cost) || 0;
    const markup = cost > 0 ? (((sell - cost) / cost) * 100).toFixed(0) : '35';
    setPartForm(prev => ({
      ...prev,
      sellPrice: sellVal,
      markup,
      appliedTierLabel: 'Manual Override'
    }));
  };

  const handleReceiveCostChange = (costVal) => {
    const c = parseFloat(costVal) || 0;
    if (costVal === '' || c <= 0) {
      setReceiveForm(prev => ({ ...prev, cost: costVal, sellPrice: '', tierLabel: '' }));
      return;
    }
    const calc = calculateMarkupAndSellPrice(c);
    setReceiveForm(prev => ({
      ...prev,
      cost: costVal,
      sellPrice: calc.sellPrice.toFixed(2),
      tierLabel: calc.matchedTier ? (calc.matchedTier.label || formatTierBracket(calc.matchedTier)) : `Fallback (${calc.markup}%)`
    }));
  };

  const openAdjustModal = (part) => {
    setSelectedPart(part);
    setAdjustForm({
      adjustment: '',
      reason: 'Received',
      notes: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleSavePart = async (e) => {
    e.preventDefault();
    try {
      const cost = parseFloat(partForm.cost) || 0;
      const defaultCalc = calculateMarkupAndSellPrice(cost);
      const sell = parseFloat(partForm.sellPrice) || defaultCalc.sellPrice;
      const markup = cost > 0 ? parseFloat((((sell - cost) / cost) * 100).toFixed(1)) : defaultCalc.markup;
      const partNumber = partForm.partNumber?.trim() || `PART-${Date.now().toString().slice(-6)}`;
      const binLocation = partForm.binLocation?.trim() || '-';

      if (isEditModalOpen && selectedPart) {
        // Update part
        const { error } = await supabase
          .from('parts')
          .update({
            part_number: partNumber,
            category: partForm.category,
            description: partForm.description,
            supplier: partForm.supplier,
            bin_location: binLocation,
            cost: cost,
            sell: sell,
            markup: markup,
            min_stock: parseInt(partForm.minStock) || 0,
            max_stock: parseInt(partForm.maxStock) || 0,
            core_charge: parseFloat(partForm.coreCharge) || 0
          })
          .eq('id', selectedPart.id);

        if (error) throw error;
        alert('Part updated successfully!');
      } else {
        // Add new part
        const newId = `PART-${Date.now().toString().slice(-6)}`;
        const { error } = await supabase
          .from('parts')
          .insert([{
            id: newId,
            part_number: partNumber,
            category: partForm.category,
            description: partForm.description,
            supplier: partForm.supplier,
            bin_location: binLocation,
            cost: cost,
            sell: sell,
            markup: markup,
            qty_on_hand: parseInt(partForm.initialQty) || 0,
            min_stock: parseInt(partForm.minStock) || 0,
            max_stock: parseInt(partForm.maxStock) || 0,
            core_charge: parseFloat(partForm.coreCharge) || 0
          }]);

        if (error) throw error;
        alert(`Part ${partNumber} added to inventory!`);
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      fetchPartsAndRequests();
    } catch (err) {
      alert(`Error saving part: ${err.message}`);
    }
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedPart) return;

    try {
      const adj = parseInt(adjustForm.adjustment) || 0;
      const newQty = Math.max(0, (selectedPart.qtyOnHand || 0) + adj);

      const { error } = await supabase
        .from('parts')
        .update({ qty_on_hand: newQty })
        .eq('id', selectedPart.id);

      if (error) throw error;

      alert(`Stock for ${selectedPart.partNumber} adjusted to ${newQty} units!`);
      setIsAdjustModalOpen(false);
      fetchPartsAndRequests();
    } catch (err) {
      alert(`Error adjusting stock: ${err.message}`);
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('part_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;
      fetchPartsAndRequests();
    } catch (err) {
      alert(`Error updating request: ${err.message}`);
    }
  };

  const openReceiveModal = (req) => {
    setSelectedRequest(req);
    const costNum = 45.00;
    const sellNum = (costNum * 1.35).toFixed(2);
    setReceiveForm({
      neededQty: req.quantity || 1,
      receivedQty: req.quantity || 1,
      cost: costNum.toFixed(2),
      sellPrice: sellNum,
      category: 'Engine',
      binLocation: 'A-01',
      supplier: 'FleetPride'
    });
    setIsReceiveModalOpen(true);
  };

  const handleExecuteReceive = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const needed = parseInt(receiveForm.neededQty) || 1;
      const totalRecv = parseInt(receiveForm.receivedQty) || needed;
      const surplus = Math.max(0, totalRecv - needed);
      const cost = parseFloat(receiveForm.cost) || 0;
      const sell = parseFloat(receiveForm.sellPrice) || (cost * 1.35);

      // 1. Allocate to the requested Repair Order
      if (selectedRequest.work_order_id) {
        const { data: woData } = await supabase
          .from('work_orders')
          .select('*')
          .eq('id', selectedRequest.work_order_id)
          .single();

        if (woData) {
          const currentParts = woData.parts || [];
          const cleanParts = currentParts.filter(p => !p.isRequested || p.id !== selectedRequest.id);
          const newPartLine = {
            id: `PART-${Date.now().toString().slice(-4)}`,
            partNumber: selectedRequest.part_number || 'SPEC-ORDER',
            description: selectedRequest.part_name,
            quantity: needed,
            cost: cost,
            sellPrice: sell,
            price: sell
          };

          await supabase
            .from('work_orders')
            .update({
              parts: [...cleanParts, newPartLine],
              status: 'repairing' // Auto-advance from waiting_parts to In Progress!
            })
            .eq('id', selectedRequest.work_order_id);
        }
      }

      // 2. Add surplus to warehouse inventory
      if (surplus > 0) {
        const partNum = selectedRequest.part_number || `P-${Date.now().toString().slice(-4)}`;
        const existingPart = parts.find(p => p.partNumber?.toLowerCase() === partNum.toLowerCase());

        if (existingPart) {
          await supabase
            .from('parts')
            .update({
              qty_on_hand: (existingPart.qtyOnHand || 0) + surplus
            })
            .eq('id', existingPart.id);
        } else {
          await supabase
            .from('parts')
            .insert([{
              id: `PART-${Date.now().toString().slice(-6)}`,
              part_number: partNum,
              category: receiveForm.category || 'Engine',
              description: selectedRequest.part_name,
              supplier: receiveForm.supplier,
              bin_location: receiveForm.binLocation,
              cost: cost,
              sell: sell,
              markup: cost > 0 ? Math.round(((sell - cost) / cost) * 100) : 35,
              qty_on_hand: surplus,
              min_stock: 2,
              max_stock: 10,
              core_charge: 0
            }]);
        }
      }

      // 3. Mark request as received
      await supabase
        .from('part_requests')
        .update({ status: 'received' })
        .eq('id', selectedRequest.id);

      setIsReceiveModalOpen(false);
      setSelectedRequest(null);
      fetchPartsAndRequests();

      alert(`✅ Part received successfully!\n- ${needed} unit(s) allocated to RO #${selectedRequest.work_order_id || selectedRequest.unit_display} (Status moved to In Progress)\n- ${surplus} surplus unit(s) added to warehouse inventory.`);
    } catch (err) {
      alert(`Error processing part receipt: ${err.message}`);
    }
  };

  // ==========================================================
  // AI Supplier Invoice & PDF Scanner Handlers
  // ==========================================================
  const openAiModal = () => {
    setAiInvoiceData(null);
    setAiError(null);
    setIsAiScanning(false);
    setIsAiModalOpen(true);
  };

  const handleAiScanFile = async (file) => {
    if (!file) return;
    setIsAiScanning(true);
    setAiError(null);
    setAiScanStep('Reading supplier document & extracting text...');
    
    try {
      const { tiers, fallbackMarkup } = getSavedMarkupSettings();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tiers', JSON.stringify(tiers));
      formData.append('fallbackMarkup', fallbackMarkup.toString());

      setAiScanStep('Groq AI parsing line items, quantities & unit costs...');
      const res = await fetch('/api/parts/ai-scan', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to scan invoice document');
      }

      setAiInvoiceData(json);
    } catch (err) {
      console.error('AI scan error:', err);
      setAiError(err.message || 'Error analyzing document');
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleAiScanSample = async () => {
    setIsAiScanning(true);
    setAiError(null);
    setAiScanStep('Loading sample FleetPride Heavy Duty invoice...');

    try {
      const { tiers, fallbackMarkup } = getSavedMarkupSettings();
      const sampleText = `
FLEETPRIDE COMMERCIAL PARTS
Invoice Number: FP-2026-98124
Invoice Date: ${new Date().toISOString().split('T')[0]}

Items:
1. Part # FL-2051S - Motorcraft Heavy Duty Oil Filter - 6 units - Line Total $90.00
2. Part # HD-3030-DP - Type 30/30 Air Brake Chamber - 2 units - Line Total $90.00
3. Part # BRK-8921-X - Heavy Duty Brake Shoe Kit - 4 units - Line Total $320.00
4. Part # ROT-T6-5W40 - Shell Rotella T6 5W-40 Synthetic 5Gal - 2 units - Line Total $190.00

Total Invoice: $690.00
      `.trim();

      const formData = new FormData();
      formData.append('text', sampleText);
      formData.append('tiers', JSON.stringify(tiers));
      formData.append('fallbackMarkup', fallbackMarkup.toString());

      setAiScanStep('Groq AI parsing line items, quantities & unit costs...');
      const res = await fetch('/api/parts/ai-scan', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to analyze sample invoice');
      }

      setAiInvoiceData(json);
    } catch (err) {
      console.error('AI sample error:', err);
      setAiError(err.message || 'Error analyzing sample invoice');
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleAiItemChange = (index, field, value) => {
    if (!aiInvoiceData || !aiInvoiceData.items) return;
    const items = [...aiInvoiceData.items];
    const item = { ...items[index] };
    const { tiers, fallbackMarkup } = getSavedMarkupSettings();

    if (field === 'quantity') {
      const q = Math.max(1, parseInt(value) || 1);
      item.quantity = q;
      item.totalCost = +(item.unitCost * q).toFixed(2);
      item.newStock = (item.currentStock || 0) + q;
    } else if (field === 'unitCost') {
      const c = Math.max(0, parseFloat(value) || 0);
      item.unitCost = c;
      item.totalCost = +(c * item.quantity).toFixed(2);
      const calc = calculateMarkupAndSellPrice(c, tiers, fallbackMarkup);
      item.markup = calc.markup;
      item.sellPrice = calc.sellPrice;
      item.profit = calc.profit;
      item.marginPercent = calc.marginPercent;
      item.tierLabel = calc.matchedTier ? (calc.matchedTier.label || formatTierBracket(calc.matchedTier)) : `Fallback (${calc.markup}%)`;
    } else if (field === 'sellPrice') {
      const s = Math.max(0, parseFloat(value) || 0);
      item.sellPrice = s;
      item.markup = item.unitCost > 0 ? Math.round(((s - item.unitCost) / item.unitCost) * 100) : 35;
      item.profit = +(s - item.unitCost).toFixed(2);
      item.tierLabel = 'Manual Override';
    } else {
      item[field] = value;
    }

    items[index] = item;
    setAiInvoiceData({
      ...aiInvoiceData,
      items,
      totalInvoiceAmount: items.reduce((s, it) => s + (parseFloat(it.totalCost) || 0), 0),
      totalPartsCount: items.length,
      totalUnitsCount: items.reduce((s, it) => s + (parseInt(it.quantity) || 0), 0)
    });
  };

  const handleAiDeleteItem = (index) => {
    if (!aiInvoiceData || !aiInvoiceData.items) return;
    const items = aiInvoiceData.items.filter((_, i) => i !== index);
    setAiInvoiceData({
      ...aiInvoiceData,
      items,
      totalInvoiceAmount: items.reduce((s, it) => s + (parseFloat(it.totalCost) || 0), 0),
      totalPartsCount: items.length,
      totalUnitsCount: items.reduce((s, it) => s + (parseInt(it.quantity) || 0), 0)
    });
  };

  const handleAiAddItem = () => {
    if (!aiInvoiceData) return;
    const { tiers, fallbackMarkup } = getSavedMarkupSettings();
    const defaultCost = 45.00;
    const calc = calculateMarkupAndSellPrice(defaultCost, tiers, fallbackMarkup);
    const newItem = {
      id: `new-${Date.now()}`,
      partNumber: `PART-${Date.now().toString().slice(-4)}`,
      description: 'New Replacement Part',
      category: 'Engine',
      quantity: 1,
      unitCost: defaultCost,
      totalCost: defaultCost,
      markup: calc.markup,
      sellPrice: calc.sellPrice,
      profit: calc.profit,
      marginPercent: calc.marginPercent,
      tierLabel: calc.matchedTier ? (calc.matchedTier.label || formatTierBracket(calc.matchedTier)) : `Fallback (${calc.markup}%)`,
      isExisting: false,
      currentStock: 0,
      newStock: 1,
      binLocation: 'A-01'
    };
    const items = [...(aiInvoiceData.items || []), newItem];
    setAiInvoiceData({
      ...aiInvoiceData,
      items,
      totalInvoiceAmount: items.reduce((s, it) => s + (parseFloat(it.totalCost) || 0), 0),
      totalPartsCount: items.length,
      totalUnitsCount: items.reduce((s, it) => s + (parseInt(it.quantity) || 0), 0)
    });
  };

  const handleImportAiParts = async () => {
    if (!aiInvoiceData || !aiInvoiceData.items || aiInvoiceData.items.length === 0) return;
    setIsAiImporting(true);

    try {
      let importedCount = 0;
      let updatedCount = 0;

      for (const item of aiInvoiceData.items) {
        if (item.isExisting && item.id && !item.id.toString().startsWith('new-')) {
          // Update existing part
          const { error } = await supabase
            .from('parts')
            .update({
              qty_on_hand: item.newStock,
              cost: item.unitCost,
              sell: item.sellPrice,
              markup: item.markup,
              supplier: aiInvoiceData.supplier || item.supplier
            })
            .eq('id', item.id);

          if (error) console.warn(`Failed to update part ${item.partNumber}:`, error.message);
          else updatedCount++;
        } else {
          // Insert new part
          const newPartId = `PART-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
          const { error } = await supabase
            .from('parts')
            .insert([{
              id: newPartId,
              part_number: item.partNumber,
              category: item.category || 'Engine',
              description: item.description || 'Commercial Replacement Part',
              supplier: aiInvoiceData.supplier || 'Supplier',
              bin_location: item.binLocation || 'A-01',
              cost: item.unitCost,
              sell: item.sellPrice,
              markup: item.markup,
              qty_on_hand: item.quantity,
              min_stock: 2,
              max_stock: 10,
              core_charge: 0
            }]);

          if (error) console.warn(`Failed to insert new part ${item.partNumber}:`, error.message);
          else importedCount++;
        }
      }

      alert(`✅ Inventory Updated Successfully!\n- ${importedCount} new part(s) added to catalog.\n- ${updatedCount} existing part(s) restocked.`);
      setIsAiModalOpen(false);
      setAiInvoiceData(null);
      fetchPartsAndRequests();
    } catch (err) {
      alert(`Error importing parts to inventory: ${err.message}`);
    } finally {
      setIsAiImporting(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Parts & Inventory</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Manage warehouse inventory, track stock levels, and order parts requested by mechanics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn" 
            onClick={openAiModal}
            style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
              color: 'white', 
              border: 'none',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={18} />
            AI Scan Supplier Invoice / PDF
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={20} />
            Add New Part
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'inventory' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'inventory' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Parts Stock Inventory ({totalParts})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'requests' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'requests' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'requests' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShoppingCart size={16} />
          Mechanic Part Requests
          {pendingRequestsCount > 0 && (
            <span style={{ background: '#ef4444', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.blue}`}>
                <Package size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Total Parts</p>
                <p className={styles.kpiValue}>{isLoading ? '...' : totalParts}</p>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.green}`}>
                <DollarSign size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Total Inventory Value</p>
                <p className={styles.kpiValue}>{isLoading ? '...' : formatCurrency(totalValue)}</p>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.amber}`}>
                <AlertTriangle size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Low Stock Items</p>
                <p className={styles.kpiValue}>{isLoading ? '...' : lowStockCount}</p>
              </div>
            </div>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrapper} ${styles.purple}`}>
                <ShoppingCart size={24} />
              </div>
              <div className={styles.kpiContent}>
                <p className={styles.kpiLabel}>Pending Mechanic Orders</p>
                <p className={styles.kpiValue}>{isLoading ? '...' : pendingRequestsCount}</p>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input
                type="text"
                placeholder="Search part #, description, supplier..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.categoryTabs}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`${styles.categoryTab} ${activeCategory === cat ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableCard}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading parts from Supabase...</div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>Error: {error}</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('partNumber')}>
                      <div className={styles.thContent}>Part # <ArrowUpDown size={14} /></div>
                    </th>
                    <th onClick={() => handleSort('description')}>
                      <div className={styles.thContent}>Description <ArrowUpDown size={14} /></div>
                    </th>
                    <th onClick={() => handleSort('supplier')}>
                      <div className={styles.thContent}>Supplier <ArrowUpDown size={14} /></div>
                    </th>
                    <th onClick={() => handleSort('category')}>
                      <div className={styles.thContent}>Category <ArrowUpDown size={14} /></div>
                    </th>
                    <th onClick={() => handleSort('cost')}>
                      <div className={styles.thContent}>Cost <ArrowUpDown size={14} /></div>
                    </th>
                    <th onClick={() => handleSort('sellPrice')}>
                      <div className={styles.thContent}>Sell Price <ArrowUpDown size={14} /></div>
                    </th>
                    <th onClick={() => handleSort('qtyOnHand')}>
                      <div className={styles.thContent}>Qty on Hand <ArrowUpDown size={14} /></div>
                    </th>
                    <th>Bin Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.length > 0 ? (
                    filteredParts.map(part => (
                      <tr key={part.id}>
                        <td style={{ fontWeight: 'bold' }}>{part.partNumber}</td>
                        <td>{part.description}</td>
                        <td>{part.supplier || '-'}</td>
                        <td><span className={styles.categoryBadge}>{part.category}</span></td>
                        <td>{formatCurrency(part.cost)}</td>
                        <td style={{ fontWeight: 'bold' }}>{formatCurrency(part.sellPrice)}</td>
                        <td>
                          <span className={`${styles.badge} ${part.qtyOnHand < part.minStock ? styles.red : styles.green}`}>
                            {part.qtyOnHand} in stock
                          </span>
                        </td>
                        <td>{part.binLocation}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-outline" onClick={() => openEditModal(part)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                              <Edit size={14} />
                            </button>
                            <button className="btn btn-primary" onClick={() => openAdjustModal(part)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                              <Plus size={14} /> Stock
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                        No parts found in inventory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Mechanic Part Requests Tab */
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>RO / Truck</th>
                <th>Part Requested</th>
                <th>Part # (If Known)</th>
                <th>Qty</th>
                <th>Urgency</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {partRequests.length > 0 ? (
                partRequests.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 'bold' }}>{req.unit_display || req.work_order_id || 'RO'}</td>
                    <td>
                      <div><strong>{req.part_name}</strong></div>
                      {req.notes && <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{req.notes}</div>}
                    </td>
                    <td>{req.part_number || 'To be specified'}</td>
                    <td><strong>{req.quantity}</strong></td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: req.urgency?.includes('Urgent') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: req.urgency?.includes('Urgent') ? '#ef4444' : '#3b82f6'
                      }}>
                        {req.urgency || 'Standard'}
                      </span>
                    </td>
                    <td>{req.requested_by || 'Mechanic'}</td>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: req.status === 'received' ? '#10b981' : req.status === 'ordered' ? '#f59e0b' : '#3b82f6',
                        color: 'white'
                      }}>
                        {(req.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {req.status === 'pending' && (
                          <button className="btn btn-outline" onClick={() => handleUpdateRequestStatus(req.id, 'ordered')} style={{ padding: '4px 8px', fontSize: '12px' }}>
                            Mark Ordered
                          </button>
                        )}
                        {req.status !== 'received' && req.status !== 'cancelled' && (
                          <button className="btn btn-primary" onClick={() => openReceiveModal(req)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#10b981', borderColor: '#10b981' }}>
                            Receive Stock
                          </button>
                        )}
                        {req.status !== 'cancelled' && req.status !== 'received' && (
                          <button className="btn btn-outline" onClick={() => handleUpdateRequestStatus(req.id, 'cancelled')} style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444', borderColor: '#ef4444' }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                    No mechanic part requests yet. When mechanics in the bay need special order parts, they will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Receive Stock & Auto-Allocate Modal */}
      {isReceiveModalOpen && selectedRequest && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.large}`}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Receive Part: {selectedRequest.part_name}</h2>
              <button className={styles.closeBtn} onClick={() => setIsReceiveModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleExecuteReceive}>
              <div className={styles.modalBody}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '13px' }}>
                    🚚 Automated Job & Inventory Allocation:
                  </div>
                  <ul style={{ fontSize: '12px', marginTop: '6px', paddingLeft: '1.2rem', color: 'var(--color-text)' }}>
                    <li><strong>{receiveForm.neededQty} unit(s)</strong> will be allocated immediately to <strong>RO #{selectedRequest.work_order_id || selectedRequest.unit_display}</strong>.</li>
                    <li>RO status will be moved from <em>Waiting Parts</em> back to <strong>In Progress</strong> automatically.</li>
                    <li><strong>{Math.max(0, (parseInt(receiveForm.receivedQty) || 0) - (parseInt(receiveForm.neededQty) || 0))} surplus unit(s)</strong> will be added to warehouse shelf inventory.</li>
                  </ul>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Requested for RO / Unit</label>
                    <input type="text" className={styles.input} value={`${selectedRequest.unit_display || 'RO'} (${selectedRequest.work_order_id || ''})`} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Qty Needed on Truck</label>
                    <input type="number" className={styles.input} value={receiveForm.neededQty} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Total Qty Received from Supplier</label>
                    <input
                      type="number"
                      min={receiveForm.neededQty}
                      className={styles.input}
                      value={receiveForm.receivedQty}
                      onChange={(e) => setReceiveForm({ ...receiveForm, receivedQty: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Supplier / Vendor</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={receiveForm.supplier}
                      onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })}
                      placeholder="e.g. FleetPride / Alliance"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Unit Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={receiveForm.cost}
                      onChange={(e) => handleReceiveCostChange(e.target.value)}
                      required
                    />
                    {receiveForm.tierLabel && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '3px' }}>
                        ⚡ Default Markup: {receiveForm.tierLabel}
                      </span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Billable Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={receiveForm.sellPrice}
                      onChange={(e) => setReceiveForm({ ...receiveForm, sellPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Shelf / Bin Location (for Surplus)</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={receiveForm.binLocation}
                      onChange={(e) => setReceiveForm({ ...receiveForm, binLocation: e.target.value })}
                      placeholder="e.g. B-04-2"
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setIsReceiveModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>
                  Confirm Receipt & Auto-Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedPart && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Adjust Stock: {selectedPart.partNumber}</h2>
              <button className={styles.closeBtn} onClick={() => setIsAdjustModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Current Qty</label>
                    <input type="text" className={styles.input} value={`${selectedPart.qtyOnHand} units`} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Adjustment (+/-)</label>
                    <input
                      type="number"
                      className={styles.input}
                      placeholder="e.g. 5 or -2"
                      value={adjustForm.adjustment}
                      onChange={(e) => setAdjustForm({ ...adjustForm, adjustment: e.target.value })}
                      required
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.full}`}>
                    <label className={styles.label}>Reason</label>
                    <select
                      className={styles.select}
                      value={adjustForm.reason}
                      onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    >
                      <option>Received from Supplier</option>
                      <option>Used on Repair Order</option>
                      <option>Customer Return</option>
                      <option>Damaged / Scrapped</option>
                      <option>Physical Count Adjustment</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.large}`}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{isEditModalOpen ? `Edit Part: ${selectedPart?.partNumber}` : 'Add New Part to Stock'}</h2>
              <button className={styles.closeBtn} onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePart}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Part Number / SKU <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                    <input
                      type="text"
                      className={styles.input}
                      value={partForm.partNumber}
                      onChange={(e) => setPartForm({ ...partForm, partNumber: e.target.value })}
                      placeholder="Auto-generated if blank (e.g. ABP-N42A-4707QP)"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Category</label>
                    <select
                      className={styles.select}
                      value={partForm.category}
                      onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className={`${styles.formGroup} ${styles.full}`}>
                    <label className={styles.label}>Description</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={partForm.description}
                      onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                      required
                      placeholder="e.g. Heavy Duty Q-Plus Brake Shoe Kit"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Supplier / Vendor</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={partForm.supplier}
                      onChange={(e) => setPartForm({ ...partForm, supplier: e.target.value })}
                      placeholder="e.g. Alliance Truck Parts"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Bin / Shelf Location <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Optional)</span></label>
                    <input
                      type="text"
                      className={styles.input}
                      value={partForm.binLocation}
                      onChange={(e) => setPartForm({ ...partForm, binLocation: e.target.value })}
                      placeholder="e.g. A-12-3 (Optional)"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Supplier Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={partForm.cost}
                      onChange={(e) => handlePartCostChange(e.target.value)}
                      required
                      placeholder="45.00"
                    />
                    {partForm.appliedTierLabel && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '3px' }}>
                        ⚡ Applied Tier: {partForm.appliedTierLabel} ({partForm.markup}% Markup)
                      </span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className={styles.label}>Billable Sell Price ($)</label>
                      {partForm.markup && (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                          Markup: {partForm.markup}%
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={partForm.sellPrice}
                      onChange={(e) => handlePartSellPriceChange(e.target.value)}
                      placeholder="65.00"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Min Stock Alert</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={partForm.minStock}
                      onChange={(e) => setPartForm({ ...partForm, minStock: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Max Stock Target</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={partForm.maxStock}
                      onChange={(e) => setPartForm({ ...partForm, maxStock: e.target.value })}
                    />
                  </div>
                  {!isEditModalOpen && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Initial Stock Quantity</label>
                      <input
                        type="number"
                        className={styles.input}
                        value={partForm.initialQty}
                        onChange={(e) => setPartForm({ ...partForm, initialQty: e.target.value })}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {isEditModalOpen ? 'Save Changes' : 'Add Part to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Supplier Invoice & PDF Scanner Modal */}
      {isAiModalOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 1050 }}>
          <div className={styles.aiModalContent}>
            <div className={styles.modalHeader} style={{ background: 'linear-gradient(90deg, #F8FAFC 0%, #EFF6FF 100%)' }}>
              <div className={styles.aiHeaderGradient}>
                <div style={{ background: '#6366f1', color: 'white', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    AI Supplier Invoice & PDF Scanner
                    <span style={{ fontSize: '11px', background: '#EEF2FF', color: '#6366f1', padding: '2px 8px', borderRadius: '12px', border: '1px solid #C7D2FE', fontWeight: 600 }}>
                      Powered by Groq AI
                    </span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Auto-read invoice PDF, compute single unit costs, apply shop tiered markup, and add directly to inventory.
                  </p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => { setIsAiModalOpen(false); setAiInvoiceData(null); }}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody} style={{ padding: '1.25rem' }}>
              {aiError && (
                <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', marginBottom: '1rem', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} />
                  <span>{aiError}</span>
                </div>
              )}

              {/* State 1: Scanning / Radar progress */}
              {isAiScanning && (
                <div className={styles.aiScanningContainer}>
                  <div className={styles.aiRadarPulse}>
                    <Sparkles size={36} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
                      AI Invoice Intelligence at Work
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                      {aiScanStep}
                    </p>
                  </div>
                  <div style={{ width: '220px', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '3px', animation: 'pulse 1.5s infinite' }}></div>
                  </div>
                </div>
              )}

              {/* State 2: Upload Dropzone when no data yet */}
              {!isAiScanning && !aiInvoiceData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div 
                    className={styles.aiDropzone}
                    onClick={() => document.getElementById('ai-file-input')?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleAiScanFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <input 
                      id="ai-file-input"
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg,.txt" 
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleAiScanFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className={styles.aiDropzoneIcon}>
                      <UploadCloud size={28} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>
                        Drag & drop supplier invoice or parts PDF here
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                        Supports PDF packing slips, supplier bills (FleetPride, Napa, Cummins, LKQ), or click to browse
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={20} color="#6366f1" />
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                          Want to test without a physical document?
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                          Simulate an incoming heavy-duty parts delivery from FleetPride Commercial Parts.
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="btn btn-outline" 
                      onClick={handleAiScanSample}
                      style={{ fontSize: '12px', padding: '8px 14px', borderColor: '#C7D2FE', color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Sparkles size={14} style={{ marginRight: '6px' }} />
                      Load Sample Supplier Invoice
                    </button>
                  </div>
                </div>
              )}

              {/* State 3: Parsed Invoice Review Table */}
              {!isAiScanning && aiInvoiceData && (
                <div>
                  {/* Summary Bar */}
                  <div className={styles.aiSummaryBar}>
                    <div className={styles.aiSummaryField}>
                      <label className={styles.aiSummaryLabel}>Supplier / Vendor</label>
                      <input 
                        className={styles.aiSummaryInput}
                        value={aiInvoiceData.supplier || ''}
                        onChange={(e) => setAiInvoiceData({ ...aiInvoiceData, supplier: e.target.value })}
                        placeholder="Supplier Name"
                      />
                    </div>
                    <div className={styles.aiSummaryField}>
                      <label className={styles.aiSummaryLabel}>Invoice / PO #</label>
                      <input 
                        className={styles.aiSummaryInput}
                        value={aiInvoiceData.invoiceNumber || ''}
                        onChange={(e) => setAiInvoiceData({ ...aiInvoiceData, invoiceNumber: e.target.value })}
                        placeholder="Invoice #"
                      />
                    </div>
                    <div className={styles.aiSummaryField}>
                      <label className={styles.aiSummaryLabel}>Document Total</label>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', padding: '6px 0' }}>
                        {formatCurrency(aiInvoiceData.totalInvoiceAmount)}
                      </div>
                    </div>
                    <div className={styles.aiSummaryField}>
                      <label className={styles.aiSummaryLabel}>Total Received</label>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563EB', padding: '6px 0' }}>
                        {aiInvoiceData.totalUnitsCount || aiInvoiceData.items.reduce((s, it) => s + (parseInt(it.quantity) || 0), 0)} units ({aiInvoiceData.items.length} SKUs)
                      </div>
                    </div>
                  </div>

                  {/* Review Table */}
                  <div className={styles.aiTableContainer}>
                    <table className={styles.aiTable}>
                      <thead>
                        <tr>
                          <th style={{ width: '14%' }}>Part # / SKU</th>
                          <th style={{ width: '22%' }}>Description</th>
                          <th style={{ width: '12%' }}>Category</th>
                          <th style={{ width: '7%', textAlign: 'center' }}>Qty</th>
                          <th style={{ width: '10%' }}>Unit Cost ($)</th>
                          <th style={{ width: '13%' }}>Tier Markup</th>
                          <th style={{ width: '10%' }}>Sell Price ($)</th>
                          <th style={{ width: '10%' }}>Inventory Match</th>
                          <th style={{ width: '2%', textAlign: 'center' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiInvoiceData.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td>
                              <input 
                                className={styles.aiInputInline}
                                value={item.partNumber}
                                onChange={(e) => handleAiItemChange(idx, 'partNumber', e.target.value)}
                                style={{ fontWeight: 600, fontFamily: 'monospace' }}
                              />
                            </td>
                            <td>
                              <input 
                                className={styles.aiInputInline}
                                value={item.description}
                                onChange={(e) => handleAiItemChange(idx, 'description', e.target.value)}
                              />
                            </td>
                            <td>
                              <select 
                                className={styles.aiInputInline}
                                value={item.category}
                                onChange={(e) => handleAiItemChange(idx, 'category', e.target.value)}
                              >
                                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input 
                                type="number"
                                min="1"
                                className={styles.aiInputInline}
                                value={item.quantity}
                                onChange={(e) => handleAiItemChange(idx, 'quantity', e.target.value)}
                                style={{ textAlign: 'center', fontWeight: 600 }}
                              />
                            </td>
                            <td>
                              <input 
                                type="number"
                                step="0.01"
                                className={styles.aiInputInline}
                                value={item.unitCost}
                                onChange={(e) => handleAiItemChange(idx, 'unitCost', e.target.value)}
                                style={{ fontWeight: 600 }}
                              />
                            </td>
                            <td>
                              <span className={styles.tierPill} title="Applied tiered bracket markup">
                                ⚡ {item.tierLabel || `${item.markup}%`}
                              </span>
                            </td>
                            <td>
                              <input 
                                type="number"
                                step="0.01"
                                className={styles.aiInputInline}
                                value={item.sellPrice}
                                onChange={(e) => handleAiItemChange(idx, 'sellPrice', e.target.value)}
                                style={{ fontWeight: 700, color: '#16A34A' }}
                              />
                            </td>
                            <td>
                              {item.isExisting ? (
                                <span className={styles.badgeExisting} title={`Currently in warehouse: ${item.currentStock} units`}>
                                  <RefreshCw size={11} />
                                  Update (+{item.quantity})
                                </span>
                              ) : (
                                <span className={styles.badgeNew}>
                                  <Plus size={11} />
                                  New Part
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                type="button"
                                onClick={() => handleAiDeleteItem(idx)}
                                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                                title="Remove line item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={handleAiAddItem}
                      style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer' }}
                    >
                      <Plus size={14} style={{ marginRight: '4px' }} />
                      Add Another Line Item
                    </button>

                    <button 
                      type="button" 
                      onClick={() => setAiInvoiceData(null)}
                      style={{ fontSize: '12px', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Scan a different document
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter} style={{ borderTop: '1px solid #E2E8F0', padding: '1rem 1.5rem', background: '#F8FAFC' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => { setIsAiModalOpen(false); setAiInvoiceData(null); }}
              >
                Cancel
              </button>

              {aiInvoiceData && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleImportAiParts}
                  disabled={isAiImporting || !aiInvoiceData.items || aiInvoiceData.items.length === 0}
                  style={{ 
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    padding: '8px 20px',
                    cursor: 'pointer'
                  }}
                >
                  <Package size={18} />
                  {isAiImporting ? 'Importing Parts...' : `Confirm & Import ${aiInvoiceData.items.length} Parts to Inventory`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

