'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from './parts.module.css';
import { supabase } from '../../lib/supabaseClient';
import { Search, Plus, Package, DollarSign, AlertTriangle, ArrowUpDown, Edit, History, X, ChevronUp, ChevronDown } from 'lucide-react';

const CATEGORIES = ['All', 'Brakes', 'Engine', 'Drivetrain', 'Air System', 'Suspension', 'HVAC', 'Fluids', 'Filters'];

export default function PartsPage() {
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'partNumber', direction: 'asc' });

  useEffect(() => {
    async function fetchParts() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('parts')
          .select('*')
          .order('part_number', { ascending: true });
          
        if (error) throw error;
        
        // Map snake_case from DB to camelCase used by component
        const mappedParts = (data || []).map(p => ({
          ...p,
          partNumber: p.part_number,
          qtyOnHand: p.qty_on_hand,
          minStock: p.min_stock,
          maxStock: p.min_stock * 2, // approximation for UI since it's not in DB
          coreCharge: p.core_charge,
          sellPrice: p.price,
          binLocation: p.location || '-'
        }));
        
        setParts(mappedParts);
      } catch (err) {
        console.error("Error fetching parts:", err);
        setError(err.message || 'Failed to fetch data from Supabase');
      } finally {
        setIsLoading(false);
      }
    }
    fetchParts();
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

    // Filter by Category
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.partNumber.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.supplier || '').toLowerCase().includes(q)
      );
    }

    // Sort
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
  const coreChargeCount = parts.filter(p => Number(p.coreCharge) > 0).length;

  const openEditModal = (part) => {
    setSelectedPart(part);
    setIsEditModalOpen(true);
  };

  const openAdjustModal = (part) => {
    setSelectedPart(part);
    setIsAdjustModalOpen(true);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Parts & Inventory</h1>
        <button className="btn btn-primary" onClick={() => { setSelectedPart(null); setIsAddModalOpen(true); }}>
          <Plus size={20} />
          Add New Part
        </button>
      </header>

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
          <div className={`${styles.kpiIconWrapper} ${styles.red}`}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Low Stock Items</p>
            <p className={styles.kpiValue}>{isLoading ? '...' : lowStockCount}</p>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.orange}`}>
            <ArrowUpDown size={24} />
          </div>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Items with Core Charges</p>
            <p className={styles.kpiValue}>{isLoading ? '...' : coreChargeCount}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controlsContainer}>
        <div className={styles.searchBar}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Search parts by #, description, or supplier..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.categoryTabs}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              className={`${styles.tabBtn} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} onClick={() => handleSort('partNumber')}>
                  <div className={styles.thContent}>Part Info {sortConfig.key === 'partNumber' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null}</div>
                </th>
                <th className={styles.th} onClick={() => handleSort('supplier')}>
                  <div className={styles.thContent}>Supplier {sortConfig.key === 'supplier' ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : null}</div>
                </th>
                <th className={styles.th} onClick={() => handleSort('category')}>Category</th>
                <th className={styles.th} onClick={() => handleSort('cost')}>Cost</th>
                <th className={styles.th} onClick={() => handleSort('sellPrice')}>Sell Price</th>
                <th className={styles.th}>Markup</th>
                <th className={styles.th} onClick={() => handleSort('qtyOnHand')}>Stock</th>
                <th className={styles.th}>Min/Max</th>
                <th className={styles.th} onClick={() => handleSort('binLocation')}>Bin Loc</th>
                <th className={styles.th}>Core</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="11" className={styles.td} style={{ textAlign: 'center', padding: '2rem' }}>Loading data from Supabase...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="11" className={styles.td} style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                    <strong>Data fetch failed:</strong> {error}
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan="11" className={styles.td} style={{ textAlign: 'center', padding: '2rem' }}>
                    No parts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredParts.map(part => (
                  <tr key={part.id || part.partNumber} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.partInfo}>
                        <span className={styles.partNumber}>
                          {part.partNumber}
                          <span style={{marginLeft:'8px', fontSize:'9px', background:'var(--color-primary)', color:'white', padding:'2px 5px', borderRadius:'10px'}}>SUPABASE</span>
                        </span>
                        <span className={styles.partDesc}>{part.description}</span>
                      </div>
                    </td>
                    <td className={styles.td}>{part.supplier}</td>
                    <td className={styles.td}>{part.category}</td>
                    <td className={styles.td}>{formatCurrency(part.cost)}</td>
                    <td className={styles.td}>{formatCurrency(part.sellPrice)}</td>
                    <td className={styles.td}>{Math.round((((part.sellPrice || 0) - (part.cost || 0)) / (part.cost || 1)) * 100)}%</td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${part.qtyOnHand < part.minStock ? styles.red : styles.green}`}>
                        {part.qtyOnHand}
                      </span>
                    </td>
                    <td className={styles.td}>{part.minStock} / {part.maxStock}</td>
                    <td className={styles.td}>{part.binLocation}</td>
                    <td className={styles.td}>
                      {part.coreCharge > 0 ? (
                        <span className={`${styles.badge} ${styles.gray}`}>{formatCurrency(part.coreCharge)}</span>
                      ) : '-'}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        <button className={`${styles.actionBtn} ${styles.edit}`} onClick={() => openEditModal(part)} title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.adjust}`} onClick={() => openAdjustModal(part)} title="Adjust Stock">
                          <Plus size={16} />
                        </button>
                        <button className={styles.actionBtn} title="History">
                          <History size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className={styles.mobileList}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading data from Supabase...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}><strong>Error:</strong> {error}</div>
          ) : (
            filteredParts.map(part => (
              <div key={part.id || part.partNumber} className={styles.mobileCard}>
                <div className={styles.mobileCardHeader}>
                  <div className={styles.partInfo}>
                    <span className={styles.partNumber}>
                      {part.partNumber}
                      <span style={{marginLeft:'8px', fontSize:'9px', background:'var(--color-primary)', color:'white', padding:'2px 5px', borderRadius:'10px'}}>SUPABASE</span>
                    </span>
                    <span className={styles.partDesc}>{part.description}</span>
                  </div>
                  <span className={`${styles.badge} ${part.qtyOnHand < part.minStock ? styles.red : styles.green}`}>
                    Qty: {part.qtyOnHand}
                  </span>
                </div>
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileDataGroup}>
                    <span className={styles.mobileDataLabel}>Category</span>
                    <span className={styles.mobileDataValue}>{part.category}</span>
                  </div>
                  <div className={styles.mobileDataGroup}>
                    <span className={styles.mobileDataLabel}>Bin Loc</span>
                    <span className={styles.mobileDataValue}>{part.binLocation}</span>
                  </div>
                  <div className={styles.mobileDataGroup}>
                    <span className={styles.mobileDataLabel}>Cost</span>
                    <span className={styles.mobileDataValue}>{formatCurrency(part.cost)}</span>
                  </div>
                  <div className={styles.mobileDataGroup}>
                    <span className={styles.mobileDataLabel}>Sell</span>
                    <span className={styles.mobileDataValue}>{formatCurrency(part.sellPrice)}</span>
                  </div>
                </div>
                <div className={styles.mobileCardFooter}>
                  <button className={`btn btn-outline`} onClick={() => openEditModal(part)} style={{display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: 'var(--text-sm)'}}>
                    <Edit size={14} /> Edit
                  </button>
                  <button className={`btn btn-outline`} onClick={() => openAdjustModal(part)} style={{display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: 'var(--text-sm)'}}>
                    <Plus size={14} /> Adjust
                  </button>
                </div>
              </div>
            ))
          )}
          {!isLoading && !error && filteredParts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              No parts found matching your filters.
            </div>
          )}
        </div>
      </div>

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
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Current Qty</label>
                  <input type="text" className={styles.input} value={selectedPart.qtyOnHand} disabled />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Adjustment (+/-)</label>
                  <input type="number" className={styles.input} placeholder="e.g. 5 or -2" />
                </div>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Reason</label>
                  <select className={styles.select}>
                    <option>Received</option>
                    <option>Used on WO</option>
                    <option>Return</option>
                    <option>Damaged</option>
                    <option>Count Adjustment</option>
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Notes</label>
                  <input type="text" className={styles.input} placeholder="Optional notes" />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-outline" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setIsAdjustModalOpen(false)}>Save Adjustment</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.large}`}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{isEditModalOpen ? 'Edit Part' : 'Add New Part'}</h2>
              <button className={styles.closeBtn} onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Part Number</label>
                  <input type="text" className={styles.input} defaultValue={selectedPart?.partNumber || ''} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <select className={styles.select} defaultValue={selectedPart?.category || 'Brakes'}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.full}`}>
                  <label className={styles.label}>Description</label>
                  <input type="text" className={styles.input} defaultValue={selectedPart?.description || ''} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Supplier</label>
                  <input type="text" className={styles.input} defaultValue={selectedPart?.supplier || ''} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Bin Location</label>
                  <input type="text" className={styles.input} defaultValue={selectedPart?.binLocation || ''} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cost</label>
                  <input type="number" step="0.01" className={styles.input} defaultValue={selectedPart?.cost || ''} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Sell Price</label>
                  <input type="number" step="0.01" className={styles.input} defaultValue={selectedPart?.sellPrice || ''} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Min Stock</label>
                  <input type="number" className={styles.input} defaultValue={selectedPart?.minStock || ''} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Stock</label>
                  <input type="number" className={styles.input} defaultValue={selectedPart?.maxStock || ''} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Core Charge</label>
                  <input type="number" step="0.01" className={styles.input} defaultValue={selectedPart?.coreCharge || 0} />
                </div>
                {!isEditModalOpen && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Initial Qty</label>
                    <input type="number" className={styles.input} defaultValue="0" />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                {isEditModalOpen ? 'Save Changes' : 'Add Part'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
