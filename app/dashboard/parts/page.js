'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './parts.module.css';
import { supabase } from '../../lib/supabaseClient';
import { Search, Plus, Package, DollarSign, AlertTriangle, ArrowUpDown, Edit, History, X, ChevronUp, ChevronDown, CheckCircle, Clock, ShoppingCart } from 'lucide-react';

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
      minStock: '2',
      maxStock: '10',
      coreCharge: '0',
      initialQty: '5'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (part) => {
    setSelectedPart(part);
    setPartForm({
      partNumber: part.partNumber || '',
      category: part.category || 'Brakes',
      description: part.description || '',
      supplier: part.supplier || '',
      binLocation: part.binLocation || '',
      cost: part.cost?.toString() || '',
      sellPrice: part.sellPrice?.toString() || '',
      minStock: part.minStock?.toString() || '2',
      maxStock: part.maxStock?.toString() || '10',
      coreCharge: part.coreCharge?.toString() || '0',
      initialQty: part.qtyOnHand?.toString() || '0'
    });
    setIsEditModalOpen(true);
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
      const sell = parseFloat(partForm.sellPrice) || (cost * 1.3);
      const markup = cost > 0 ? ((sell - cost) / cost) * 100 : 30;
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
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={20} />
          Add New Part
        </button>
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
                      onChange={(e) => {
                        const c = parseFloat(e.target.value) || 0;
                        setReceiveForm({ ...receiveForm, cost: e.target.value, sellPrice: (c * 1.35).toFixed(2) });
                      }}
                      required
                    />
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
                    <label className={styles.label}>Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={partForm.cost}
                      onChange={(e) => {
                        const c = parseFloat(e.target.value) || 0;
                        setPartForm({ ...partForm, cost: e.target.value, sellPrice: (c * 1.35).toFixed(2) });
                      }}
                      required
                      placeholder="45.00"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Sell Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={styles.input}
                      value={partForm.sellPrice}
                      onChange={(e) => setPartForm({ ...partForm, sellPrice: e.target.value })}
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
    </div>
  );
}
