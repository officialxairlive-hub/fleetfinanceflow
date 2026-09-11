'use client';

import { Plus, Search, Eye, Send, CheckCircle, Printer, X, Receipt, Mail, Paperclip, RotateCcw } from 'lucide-react';
import styles from './invoices.module.css';

export default function InvoicesList() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  const [invoices, setInvoices] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Invoice Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState('');
  const [savingInvoice, setSavingInvoice] = useState(false);

  // Email confirmation modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedInvoiceForEmail, setSelectedInvoiceForEmail] = useState(null);
  const [emailForm, setEmailForm] = useState({
    to: '',
    ccShop: true,
    additionalCc: '',
    subject: '',
    message: ''
  });

  const [shop, setShop] = useState({
    companyName: 'Road Ready',
    phone: '(604) 555-0100',
    email: 'service@roadreadyrepair.ca'
  });

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const [invRes, woRes, custRes] = await Promise.all([
        supabase.from('invoices').select('*, customers(company)').order('created_at', { ascending: false }),
        supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('company')
      ]);
        
      if (invRes.error) throw invRes.error;
      setInvoices(invRes.data || []);
      setWorkOrders(woRes.data || []);
      setCustomers(custRes.data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.message || 'Failed to fetch data from Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    // Fetch latest shop info
    if (typeof window !== 'undefined') {
      const localShop = localStorage.getItem('shop_info');
      if (localShop) {
        try {
          const s = JSON.parse(localShop);
          setShop(prev => ({
            ...prev,
            companyName: s.companyName || prev.companyName,
            phone: s.phone || prev.phone,
            email: s.email || prev.email
          }));
        } catch (_) {}
      }
    }

    async function fetchShop() {
      try {
        const res = await fetch('/api/settings/shop');
        if (res.ok) {
          const data = await res.json();
          if (data.shopInfo) {
            setShop(prev => ({
              ...prev,
              companyName: data.shopInfo.companyName || prev.companyName,
              phone: data.shopInfo.phone || prev.phone,
              email: data.shopInfo.email || prev.email
            }));
          }
        }
      } catch (_) {}
    }
    fetchShop();
  }, []);

  const handleUpdateStatus = async (inv, newStatus) => {
    const isPaid = newStatus === 'paid';
    const today = new Date().toISOString().split('T')[0];
    const originalStatus = inv.status;
    const originalPaidDate = inv.paid_date;
    
    // Optimistic update
    setInvoices(prev => prev.map(item => item.id === inv.id ? { 
      ...item, 
      status: newStatus, 
      paid_date: isPaid ? today : null 
    } : item));

    try {
      const { error: invErr } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus, 
          paid_date: isPaid ? today : null 
        })
        .eq('id', inv.id);

      if (invErr) throw invErr;

      // Sync linked work order status
      if (inv.work_order_id) {
        const woStatus = isPaid ? 'paid' : (newStatus === 'sent' ? 'invoiced' : 'invoiced');
        await supabase
          .from('work_orders')
          .update({ status: woStatus })
          .eq('id', inv.work_order_id);
      }
    } catch (err) {
      alert(`Error updating invoice status: ${err.message}`);
      setInvoices(prev => prev.map(item => item.id === inv.id ? { 
        ...item, 
        status: originalStatus, 
        paid_date: originalPaidDate 
      } : item));
    }
  };

  const openEmailModal = (inv) => {
    setSelectedInvoiceForEmail(inv);
    const cust = customers.find(c => c.id === inv.customer_id) || inv.customers;
    const custEmail = cust?.email || '';
    const custName = cust?.company || 'Valued Customer';
    const totalFormatted = Number(inv.total || 0).toFixed(2);
    const dueDateFormatted = inv.due_date || 'N/A';
    const portalUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/portal/${inv.work_order_id || (inv.id.startsWith('INV-') ? `WO-${inv.id.replace('INV-', '')}` : inv.id)}`
      : `https://www.fleetfinanceflow.com/portal/${inv.id}`;

    const defaultMsg = `Hi ${custName},

Please find attached Invoice #${inv.id} for completed fleet repair services.

Invoice Summary:
• Invoice #: ${inv.id}
• Total Amount: $${totalFormatted} CAD
• Due Date: ${dueDateFormatted}

You can view the full itemized invoice and pay online using our secure customer portal:
${portalUrl}

Thank you for choosing ${shop.companyName}!

${shop.companyName}
Phone: ${shop.phone}
Email: ${shop.email}`;

    setEmailForm({
      to: custEmail,
      ccShop: true,
      additionalCc: '',
      subject: `Invoice #${inv.id} from ${shop.companyName} ($${totalFormatted} CAD)`,
      message: defaultMsg
    });
    setShowEmailModal(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForEmail) return;
    if (!emailForm.to.trim()) {
      alert('Please enter a recipient email address.');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceForEmail.id,
          to: emailForm.to.trim(),
          ccShop: emailForm.ccShop,
          shopEmail: shop.email,
          additionalCc: emailForm.additionalCc.trim(),
          subject: emailForm.subject,
          message: emailForm.message
        })
      });

      // Optimistic update local state & Supabase
      setInvoices(prev => prev.map(item => item.id === selectedInvoiceForEmail.id ? { ...item, status: 'sent' } : item));
      await supabase.from('invoices').update({ status: 'sent' }).eq('id', selectedInvoiceForEmail.id);

      setShowEmailModal(false);
      alert(`✅ Invoice #${selectedInvoiceForEmail.id} emailed successfully to ${emailForm.to}${emailForm.ccShop ? ` (CC: ${shop.email})` : ''}!`);
    } catch (err) {
      alert(`Error sending invoice email: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCreateInvoiceFromWO = async (e) => {
    e.preventDefault();
    if (!selectedWoId) {
      alert('Please select a work order to invoice.');
      return;
    }

    setSavingInvoice(true);
    try {
      const wo = workOrders.find(w => w.id === selectedWoId);
      const invId = `INV-${wo.id.replace('WO-', '')}`;
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];

      const labourList = wo.labour || [];
      const partsList = wo.parts || [];
      const labourTotal = labourList.reduce((sum, l) => sum + ((parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0)), 0);
      const partsTotal = partsList.reduce((sum, p) => sum + ((parseFloat(p.quantity || p.qty) || 0) * (parseFloat(p.sellPrice || p.price || p.sell) || 0)), 0);
      const shopSupplies = Math.min((labourTotal + partsTotal) * 0.05, 50);
      const subtotal = labourTotal + partsTotal + shopSupplies;
      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      const { error: insertErr } = await supabase
        .from('invoices')
        .upsert([{
          id: invId,
          customer_id: wo.customer_id,
          work_order_id: wo.id,
          total: total,
          tax_amount: tax,
          labour_total: labourTotal,
          parts_total: partsTotal,
          shop_supplies: shopSupplies,
          status: 'draft',
          issue_date: today,
          due_date: dueDate,
          notes: `[Diagnostic Report] Fault: ${wo.complaint || 'N/A'} | Cause: ${wo.cause || 'N/A'} | Correction: ${wo.correction || 'N/A'}`
        }]);

      if (insertErr) throw insertErr;

      await supabase.from('work_orders').update({ status: 'invoiced' }).eq('id', wo.id);

      alert(`✅ Invoice #${invId} created successfully!`);
      setShowCreateModal(false);
      setSelectedWoId('');
      fetchInvoices();
    } catch (err) {
      alert(`Error creating invoice: ${err.message}`);
    } finally {
      setSavingInvoice(false);
    }
  };

  // Calculate KPIs
  const totalOutstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'draft').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const paidThisMonth = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const avgInvoice = invoices.length ? invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0) / invoices.length : 0;

  const filteredInvoices = invoices.filter(inv => {
    if (filter !== 'All' && inv.status?.toLowerCase() !== filter.toLowerCase()) return false;
    if (search) {
      const s = search.toLowerCase();
      const companyName = inv.customers?.company || '';
      return inv.id?.toLowerCase().includes(s) || companyName.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices & Billing</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '4px 0 0' }}>
            Generate invoices, track receivables, record payments, and manage shop revenue in CAD
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Total Outstanding (CAD)</div>
          <div className={styles.kpiValue}>${isLoading ? '...' : totalOutstanding.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Overdue Amount (CAD)</div>
          <div className={`${styles.kpiValue} ${styles.danger}`}>${isLoading ? '...' : overdueAmount.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Paid / Collected (CAD)</div>
          <div className={styles.kpiValue} style={{ color: '#10b981' }}>${isLoading ? '...' : paidThisMonth.toFixed(2)}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Average Invoice (CAD)</div>
          <div className={styles.kpiValue}>${isLoading ? '...' : avgInvoice.toFixed(2)}</div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          {['All', 'Draft', 'Sent', 'Paid', 'Overdue'].map(tab => (
            <button 
              key={tab}
              className={`${styles.tab} ${filter === tab ? styles.active : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by INV# or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div style={{overflowX: 'auto'}}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>INV#</th>
                <th>Customer</th>
                <th>Amount ($ CAD)</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading data from Supabase...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
                    <strong>Data fetch failed:</strong> {error}
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className={inv.status === 'overdue' ? styles.overdue : ''}>
                    <td><strong>{inv.id}</strong></td>
                    <td>
                      {inv.customers?.company || 'Fleet Customer'}
                      <span style={{marginLeft:'8px', fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'2px 6px', borderRadius:'12px'}}>SUPABASE</span>
                    </td>
                    <td><strong>${Number(inv.total || 0).toFixed(2)}</strong></td>
                    <td>
                      <select
                        className={`${styles.statusSelect} ${styles[inv.status || 'draft']}`}
                        value={inv.status || 'draft'}
                        onChange={(e) => handleUpdateStatus(inv, e.target.value)}
                        title="Click to change invoice status"
                      >
                        <option value="draft">Draft (Unpaid)</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </td>
                    <td>{inv.issue_date || '-'}</td>
                    <td>{inv.due_date || '-'}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/dashboard/invoices/${inv.id}`} className={styles.iconBtn} title="View Invoice">
                          <Eye size={18} />
                        </Link>
                        <button className={styles.iconBtn} title="Print Invoice" onClick={() => window.print()}>
                          <Printer size={18} />
                        </button>
                        <button className={styles.iconBtn} title="Email Invoice / Receipt" onClick={() => openEmailModal(inv)}>
                          <Send size={18} />
                        </button>
                        {inv.status === 'paid' ? (
                          <button 
                            className={`${styles.statusActionBtn} ${styles.reverseBtn}`}
                            title="Undo / Reverse to Unpaid"
                            onClick={() => handleUpdateStatus(inv, 'draft')}
                          >
                            <RotateCcw size={13} />
                            <span>Unpaid</span>
                          </button>
                        ) : (
                          <button 
                            className={`${styles.statusActionBtn} ${styles.markPaidBtn}`}
                            title="Mark as Paid"
                            onClick={() => handleUpdateStatus(inv, 'paid')}
                          >
                            <CheckCircle size={13} />
                            <span>Mark Paid</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Invoice Confirmation Modal */}
      {showEmailModal && selectedInvoiceForEmail && (
        <div className={styles.modalOverlay}>
          <div className={styles.emailModalContent}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px' }}>Send Invoice #{selectedInvoiceForEmail.id}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Confirm recipient email & optional shop CC</span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowEmailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendEmail}>
              {/* Recipient Customer Email */}
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Recipient Customer Email *</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {selectedInvoiceForEmail.customers?.company || 'Fleet Customer'}
                  </span>
                </label>
                <input 
                  type="email" 
                  value={emailForm.to}
                  onChange={e => setEmailForm({ ...emailForm, to: e.target.value })}
                  placeholder="customer@email.com"
                  required
                  autoFocus
                />
              </div>

              {/* CC Shop Email Checkbox */}
              <div className={styles.formGroup} style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  <input 
                    type="checkbox" 
                    checked={emailForm.ccShop}
                    onChange={e => setEmailForm({ ...emailForm, ccShop: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                  />
                  <span>CC Your Shop Email: <strong style={{ color: 'var(--color-primary)' }}>{shop.email || 'service@roadreadyrepair.ca'}</strong></span>
                </label>
              </div>

              {/* Additional CCs */}
              <div className={styles.formGroup}>
                <label>Additional CC Email(s) <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>(optional, comma separated)</span></label>
                <input 
                  type="text" 
                  value={emailForm.additionalCc}
                  onChange={e => setEmailForm({ ...emailForm, additionalCc: e.target.value })}
                  placeholder="e.g. accounting@fleetcompany.com, manager@shop.com"
                />
              </div>

              {/* Subject */}
              <div className={styles.formGroup}>
                <label>Email Subject *</label>
                <input 
                  type="text" 
                  value={emailForm.subject}
                  onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                  required
                />
              </div>

              {/* Message Body */}
              <div className={styles.formGroup}>
                <label>Email Message</label>
                <textarea 
                  value={emailForm.message}
                  onChange={e => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={6}
                  style={{ resize: 'vertical', fontSize: '13px', lineHeight: 1.5 }}
                />
              </div>

              {/* Attached Assets Notice */}
              <div className={styles.emailAttachmentBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Paperclip size={14} color="var(--color-primary)" />
                  <span>Attached: <strong>Invoice_{selectedInvoiceForEmail.id}.pdf</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>✓ Customer Portal Link Active</span>
                </div>
              </div>

              <div className={styles.modalActions} style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEmailModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={sendingEmail} style={{ gap: '6px' }}>
                  <Send size={16} /> {sendingEmail ? 'Sending Email...' : 'Send Invoice Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={20} color="var(--color-primary)" />
                Create Invoice from Work Order
              </h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceFromWO}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  Select Completed / Active Work Order *
                </label>
                <select
                  required
                  value={selectedWoId}
                  onChange={(e) => setSelectedWoId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                >
                  <option value="">Choose Work Order...</option>
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} - {wo.customer_name || 'Customer'} ({wo.unit_display || 'Unit'}) · ${Number(wo.estimated_cost || 0).toFixed(2)} CAD [{wo.status}]
                    </option>
                  ))}
                </select>

                {(() => {
                  const selWo = workOrders.find(w => w.id === selectedWoId);
                  if (!selWo) return null;
                  return (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📋 Included Diagnostic Report (The 3 C's):</span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong style={{ color: '#ef4444' }}>Fault:</strong> {selWo.complaint || 'Diagnostic service evaluation'}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong style={{ color: '#f59e0b' }}>Cause:</strong> {selWo.cause || 'Mechanical wear and teardown diagnostics'}
                      </div>
                      <div>
                        <strong style={{ color: '#10b981' }}>Correction:</strong> {selWo.correction || 'Parts replaced, labor performed, road tested OK'}
                      </div>
                    </div>
                  );
                })()}

                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  This will generate a formal invoice matching the labor lines, parts, shop supplies, taxes, and diagnostic report (Fault, Cause, Correction).
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingInvoice}>
                  {savingInvoice ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
