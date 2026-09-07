'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { shopSettings } from '../../../lib/demoData';
import { Mail, DollarSign, Printer, CheckCircle, X, ArrowLeft, RefreshCw, FileText, Wrench, Package, Send, Paperclip, RotateCcw } from 'lucide-react';
import styles from '../invoices.module.css';

export default function InvoiceDetail() {
  const params = useParams();
  const invoiceId = params.id;
  
  const [shop, setShop] = useState({
    companyName: 'Road Ready',
    ownerName: 'Harman Buttar',
    address: '18983 72a Avenue, Surrey, BC V4N 0B2',
    phone: '(604) 555-0100',
    email: 'service@roadreadyrepair.ca',
    website: 'www.fleetfinanceflow.com',
    taxNumber: 'GST # 783920194 RT0001'
  });

  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [workOrder, setWorkOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Authoritative Line Items and Financial Breakdown from Work Order
  const [breakdown, setBreakdown] = useState({
    labourLines: [],
    partsLines: [],
    labourTotal: 0,
    partsTotal: 0,
    shopSupplies: 0,
    subtotal: 0,
    taxRate: 5,
    taxAmount: 0,
    total: 0
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'Credit Card',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  // Email Confirmation Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({
    to: '',
    ccShop: true,
    additionalCc: '',
    subject: '',
    message: ''
  });

  const [logoUrl, setLogoUrl] = useState(null);
  const [logoPreferences, setLogoPreferences] = useState({
    showLogoOnInvoices: true,
    logoAlignment: 'left',
    logoSize: 'medium'
  });

  // Pure function to calculate exact financials from Work Order (Single Source of Truth)
  function computeFromWO(wo, cust, inv) {
    let labourLines = [];
    let partsLines = [];
    let labourTotal = 0;
    let partsTotal = 0;

    if (wo) {
      labourLines = (wo.labour || []).map(l => {
        const hours = parseFloat(l.hours) || 0;
        const rate = parseFloat(l.rate) || 0;
        return {
          description: l.description || 'Labour Service',
          technician: l.technician || wo.tech_name || 'Shop Tech',
          hours,
          rate,
          total: hours * rate
        };
      });
      labourTotal = labourLines.reduce((sum, l) => sum + l.total, 0);

      partsLines = (wo.parts || []).map(p => {
        const qty = parseFloat(p.quantity || p.qty) || 0;
        const unitPrice = parseFloat(p.sellPrice || p.price || p.sell) || 0;
        return {
          partNumber: p.partNumber || p.part_number || '',
          description: p.description || 'Replacement Part',
          quantity: qty,
          unitPrice,
          total: qty * unitPrice
        };
      });
      partsTotal = partsLines.reduce((sum, p) => sum + p.total, 0);
    } else if (inv) {
      labourTotal = parseFloat(inv.labour_total) || 0;
      partsTotal = parseFloat(inv.parts_total) || 0;
    }

    // Shop Supplies: 5% of (Labour + Parts), capped at $50.00
    const calculatedSupplies = (labourTotal + partsTotal > 0)
      ? Math.min((labourTotal + partsTotal) * 0.05, 50.00)
      : (parseFloat(inv?.shop_supplies) || 0);

    const subtotal = labourTotal + partsTotal + calculatedSupplies;

    // Tax calculation: Standard 5% GST (or 0 if customer is explicitly exempt)
    const isExempt = (cust?.tax_setting || '').toLowerCase() === 'exempt';
    const taxRate = isExempt ? 0 : 5;
    const taxAmount = isExempt ? 0 : (subtotal * 0.05);
    const total = subtotal + taxAmount;

    return {
      labourLines,
      partsLines,
      labourTotal,
      partsTotal,
      shopSupplies: calculatedSupplies,
      subtotal,
      taxRate,
      taxAmount,
      total
    };
  }

  useEffect(() => {
    // 1. Instant check from localStorage
    if (typeof window !== 'undefined') {
      const localLogo = localStorage.getItem('shop_invoice_logo');
      const localPrefs = localStorage.getItem('shop_invoice_preferences');
      const localShop = localStorage.getItem('shop_info');
      if (localLogo) setLogoUrl(localLogo);
      if (localPrefs) {
        try {
          setLogoPreferences(prev => ({ ...prev, ...JSON.parse(localPrefs) }));
        } catch (_) {}
      }
      if (localShop) {
        try {
          const s = JSON.parse(localShop);
          const fullAddr = [s.streetAddress, s.city, s.province, s.postalCode].filter(Boolean).join(', ');
          setShop({
            companyName: s.companyName || 'Road Ready',
            ownerName: s.ownerName || 'Harman Buttar',
            address: fullAddr || s.address || '18983 72a Avenue, Surrey, BC V4N 0B2',
            phone: s.phone || '(604) 555-0100',
            email: s.email || 'service@roadreadyrepair.ca',
            website: s.website || 'www.fleetfinanceflow.com',
            taxNumber: s.taxNumber || 'GST # 783920194 RT0001'
          });
        } catch (_) {}
      }
    }

    // 2. Cloud storage fetch
    async function fetchLogoAndShop() {
      try {
        const res = await fetch('/api/settings/logo');
        if (res.ok) {
          const data = await res.json();
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.preferences) setLogoPreferences(prev => ({ ...prev, ...data.preferences }));
        }
      } catch (err) {
        console.warn('Could not fetch invoice logo:', err);
      }

      try {
        const shopRes = await fetch('/api/settings/shop');
        if (shopRes.ok) {
          const sData = await shopRes.json();
          if (sData.shopInfo) {
            const s = sData.shopInfo;
            const fullAddr = [s.streetAddress, s.city, s.province, s.postalCode].filter(Boolean).join(', ');
            setShop({
              companyName: s.companyName || 'Road Ready',
              ownerName: s.ownerName || 'Harman Buttar',
              address: fullAddr || s.address || '18983 72a Avenue, Surrey, BC V4N 0B2',
              phone: s.phone || '(604) 555-0100',
              email: s.email || 'service@roadreadyrepair.ca',
              website: s.website || 'www.fleetfinanceflow.com',
              taxNumber: s.taxNumber || 'GST # 783920194 RT0001'
            });
            if (typeof window !== 'undefined') {
              localStorage.setItem('shop_info', JSON.stringify(sData.shopInfo));
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch shop info:', err);
      }
    }
    fetchLogoAndShop();
  }, []);

  useEffect(() => {
    async function fetchInvoiceDetails() {
      setIsLoading(true);
      try {
        // 1. Fetch Invoice
        const { data: invData, error: invError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        if (invError) throw invError;

        // 2. Resolve and Fetch Linked Work Order (Single Source of Truth)
        const targetWoId = invData.work_order_id || (invoiceId.startsWith('INV-') ? `WO-${invoiceId.replace('INV-', '')}` : null);
        let loadedWo = null;
        if (targetWoId) {
          const { data: woData } = await supabase
            .from('work_orders')
            .select('*')
            .eq('id', targetWoId)
            .single();
          if (woData) loadedWo = woData;
        }

        // 3. Resolve and Fetch Customer
        const targetCustId = invData.customer_id || loadedWo?.customer_id;
        let loadedCustomer = null;
        if (targetCustId) {
          const { data: custData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', targetCustId)
            .single();
            
          if (custData) {
            loadedCustomer = {
              ...custData,
              companyName: custData.company || custData.company_name,
              contactName: custData.contact || custData.contact_name
            };
          }
        }

        // 4. Compute Exact Financials & Line Items strictly from Work Order
        const comp = computeFromWO(loadedWo, loadedCustomer, invData);

        setWorkOrder(loadedWo);
        setCustomer(loadedCustomer);
        setBreakdown(comp);

        setInvoice({
          ...invData,
          issueDate: invData.issue_date,
          dueDate: invData.due_date,
          amount: comp.total,
          work_order_id: targetWoId || invData.work_order_id
        });
        
        setPaymentForm(prev => ({ ...prev, amount: comp.total }));

        // 5. Automatically keep draft invoice in Supabase synchronized with Work Order
        if (loadedWo && invData.status === 'draft') {
          await supabase.from('invoices').update({
            labour_total: comp.labourTotal,
            parts_total: comp.partsTotal,
            shop_supplies: comp.shopSupplies,
            tax_amount: comp.taxAmount,
            total: comp.total,
            work_order_id: loadedWo.id,
            customer_id: targetCustId || invData.customer_id
          }).eq('id', invoiceId);
        }
      } catch (err) {
        console.error("Error fetching invoice details:", err);
        setError(err.message || 'Failed to load invoice from Supabase.');
      } finally {
        setIsLoading(false);
      }
    }

    if (invoiceId) {
      fetchInvoiceDetails();
    }
  }, [invoiceId]);

  const handleSyncFromWO = async () => {
    if (!workOrder) {
      alert('No linked Work Order found for this invoice.');
      return;
    }
    setIsSyncing(true);
    try {
      const { data: freshWo, error: woErr } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', workOrder.id)
        .single();

      if (woErr) throw woErr;

      const comp = computeFromWO(freshWo, customer, invoice);
      setWorkOrder(freshWo);
      setBreakdown(comp);
      setInvoice(prev => ({ ...prev, amount: comp.total }));
      setPaymentForm(prev => ({ ...prev, amount: comp.total }));

      await supabase.from('invoices').update({
        labour_total: comp.labourTotal,
        parts_total: comp.partsTotal,
        shop_supplies: comp.shopSupplies,
        tax_amount: comp.taxAmount,
        total: comp.total,
        work_order_id: freshWo.id
      }).eq('id', invoiceId);

      alert(`✅ Invoice synchronized with Work Order #${freshWo.id} line items!`);
    } catch (err) {
      alert(`Error syncing: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const openEmailModal = () => {
    const custEmail = customer?.email || '';
    const custName = customer?.contact || customer?.contactName || customer?.company || customer?.companyName || 'Valued Customer';
    const totalFormatted = (breakdown?.total || invoice?.amount || 0).toFixed(2);
    const dueDateFormatted = new Date(invoice?.dueDate || invoice?.due_date || Date.now()).toLocaleDateString();
    const portalUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/portal/${workOrder?.id || invoice?.work_order_id || (invoiceId.startsWith('INV-') ? `WO-${invoiceId.replace('INV-', '')}` : invoiceId)}`
      : `https://www.fleetfinanceflow.com/portal/${invoiceId}`;

    const defaultMsg = `Hi ${custName},

Please find attached Invoice #${invoiceId} for the completed repair work on ${workOrder?.unit_display ? `${workOrder.unit_display}` : 'your fleet unit'}.

Invoice Summary:
• Invoice #: ${invoiceId}
• Work Order #: ${workOrder?.id || invoice?.work_order_id || 'N/A'}
• Total Amount: $${totalFormatted} CAD
• Due Date: ${dueDateFormatted}

You can view the full itemized invoice and pay online using our secure customer portal:
${portalUrl}

Thank you for choosing ${shop.companyName}!

${shop.companyName}
Phone: ${shop.phone}
Email: ${shop.email}
Address: ${shop.address}`;

    setEmailForm({
      to: custEmail,
      ccShop: true,
      additionalCc: '',
      subject: `Invoice #${invoiceId} from ${shop.companyName} ($${totalFormatted} CAD)`,
      message: defaultMsg
    });
    setShowEmailModal(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.to.trim()) {
      alert('Please enter a recipient email address.');
      return;
    }

    setSendingEmail(true);
    try {
      // 1. Call API to register and send dispatch
      const res = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          to: emailForm.to.trim(),
          ccShop: emailForm.ccShop,
          shopEmail: shop.email,
          additionalCc: emailForm.additionalCc.trim(),
          subject: emailForm.subject,
          message: emailForm.message
        })
      });

      // 2. Update local state & Supabase
      setInvoice(prev => ({ ...prev, status: 'sent' }));
      await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId);

      setShowEmailModal(false);
      alert(`✅ Invoice #${invoiceId} emailed successfully to ${emailForm.to}${emailForm.ccShop ? ` (CC: ${shop.email})` : ''}!`);
    } catch (err) {
      alert(`Error sending invoice email: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleUpdateInvoiceStatus = async (newStatus) => {
    const isPaid = newStatus === 'paid';
    const today = new Date().toISOString().split('T')[0];
    const previousStatus = invoice?.status;
    const previousPaidDate = invoice?.paid_date || invoice?.paidDate;

    // Optimistic update
    setInvoice(prev => ({
      ...prev,
      status: newStatus,
      paid_date: isPaid ? today : null,
      paidDate: isPaid ? today : null
    }));

    try {
      const { error: invErr } = await supabase
        .from('invoices')
        .update({
          status: newStatus,
          paid_date: isPaid ? today : null
        })
        .eq('id', invoiceId);

      if (invErr) throw invErr;

      if (invoice?.work_order_id) {
        const woStatus = isPaid ? 'paid' : (newStatus === 'sent' ? 'invoiced' : 'invoiced');
        await supabase
          .from('work_orders')
          .update({ status: woStatus })
          .eq('id', invoice.work_order_id);
      }

      alert(`✅ Invoice #${invoiceId} status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      alert(`Error updating invoice status: ${err.message}`);
      setInvoice(prev => ({
        ...prev,
        status: previousStatus,
        paid_date: previousPaidDate,
        paidDate: previousPaidDate
      }));
    }
  };

  const handleQuickMarkPaid = () => handleUpdateInvoiceStatus('paid');

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const paymentNotes = `Paid via ${paymentForm.method} on ${paymentForm.date}${paymentForm.reference ? ` (Ref: ${paymentForm.reference})` : ''}${paymentForm.notes ? ` - ${paymentForm.notes}` : ''}`;
      
      setInvoice(prev => ({ 
        ...prev, 
        status: 'paid', 
        paid_date: paymentForm.date, 
        paidDate: paymentForm.date,
        notes: prev.notes ? `${prev.notes}\n${paymentNotes}` : paymentNotes 
      }));
      setShowPaymentModal(false);
      
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          paid_date: paymentForm.date,
          notes: invoice?.notes ? `${invoice.notes}\n${paymentNotes}` : paymentNotes 
        })
        .eq('id', invoiceId);
        
      if (error) throw error;

      if (invoice?.work_order_id) {
        await supabase
          .from('work_orders')
          .update({ status: 'paid' })
          .eq('id', invoice.work_order_id);
      }

      alert(`✅ Payment of $${paymentForm.amount} recorded via ${paymentForm.method}!`);
    } catch (err) {
      alert(`Error recording payment: ${err.message}`);
      setInvoice(prev => ({ ...prev, status: 'draft' }));
    }
  };

  if (isLoading) {
    return <div className={styles.container} style={{ padding: '3rem', textAlign: 'center' }}>Loading invoice details...</div>;
  }

  if (error || !invoice) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'red' }}>{error || 'Invoice not found'}</h2>
          <Link href="/dashboard/invoices" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>Back to Invoices</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard/invoices" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', marginBottom: '8px' }}>
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 className={styles.title}>Invoice {invoice.id}</h1>
          <span style={{fontSize:'10px', background:'var(--color-primary)', color:'white', padding:'3px 6px', borderRadius:'10px', alignSelf: 'center'}}>SUPABASE</span>
          {workOrder && (
            <span style={{fontSize:'11px', background:'#EEF2FF', color:'#4F46E5', padding:'3px 8px', borderRadius:'10px', fontWeight: 600}}>
              Source: WO #{workOrder.id}
            </span>
          )}
        </div>
      </div>

      <div className={styles.detailLayout}>
        <div className={styles.invoicePaper}>
          {/* Header */}
          <div className={styles.invHeader} style={{ flexDirection: logoPreferences.logoAlignment === 'right' ? 'row-reverse' : 'row' }}>
            <div className={styles.companyInfoArea}>
              {logoUrl && logoPreferences.showLogoOnInvoices && (
                <div className={styles.invoiceLogoContainer}>
                  <img
                    src={logoUrl}
                    alt="Shop Logo"
                    className={styles.invoiceLogoImg}
                    style={{
                      maxHeight: logoPreferences.logoSize === 'small' ? '50px' : logoPreferences.logoSize === 'large' ? '90px' : '70px'
                    }}
                  />
                </div>
              )}
              <div className={styles.companyInfo}>
                <h2>{shop.companyName}</h2>
                <p>{shop.address}</p>
                <p>{shop.phone} | {shop.email}</p>
                <p>{shop.taxNumber}</p>
              </div>
            </div>
            <div className={styles.invMeta}>
              <h1 className={styles.invTitle}>INVOICE</h1>
              <div className={styles.metaGrid}>
                <div className={styles.metaLabel}>Invoice #:</div>
                <div className={styles.metaValue}>{invoice.id}</div>
                <div className={styles.metaLabel}>Date:</div>
                <div className={styles.metaValue}>{new Date(invoice.issueDate || Date.now()).toLocaleDateString()}</div>
                <div className={styles.metaLabel}>Due Date:</div>
                <div className={styles.metaValue}>{new Date(invoice.dueDate || Date.now()).toLocaleDateString()}</div>
                <div className={styles.metaLabel}>Status:</div>
                <div className={styles.metaValue}>
                  <select
                    className={`${styles.statusSelect} ${styles[invoice.status?.toLowerCase() || 'draft']}`}
                    value={invoice.status?.toLowerCase() || 'draft'}
                    onChange={(e) => handleUpdateInvoiceStatus(e.target.value)}
                    title="Click to change invoice status"
                  >
                    <option value="draft">Draft (Unpaid)</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Customer / Bill To & Work Order Meta */}
          <div className={styles.billToSection}>
            <div className={styles.billTo}>
              <h3>BILL TO</h3>
              <p className={styles.customerName}>{customer?.company || customer?.companyName || workOrder?.customer_name || 'Valued Fleet Customer'}</p>
              <p>{customer?.contact || customer?.contactName || customer?.contact_name || ''}</p>
              <p>{customer?.address || ''}</p>
              <p>{customer?.email || ''}</p>
              <p>{customer?.phone || ''}</p>
              {customer?.tax_setting && (
                <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Tax / PST #: {customer.tax_setting}
                </p>
              )}
            </div>

            {workOrder && (
              <div className={styles.billTo} style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '20px' }}>
                <h3>JOB / WORK ORDER REFERENCE</h3>
                <p style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0' }}>
                  <Link href={`/dashboard/jobs/${workOrder.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                    Work Order #{workOrder.id} ↗
                  </Link>
                </p>
                <p><strong>Unit / Truck:</strong> {workOrder.unit_display || 'N/A'}</p>
                {workOrder.complaint && <p><strong>Complaint:</strong> {workOrder.complaint}</p>}
                {workOrder.correction && <p><strong>Correction:</strong> {workOrder.correction}</p>}
              </div>
            )}
          </div>

          {/* Line Items Table (Authoritative Work Order Items) */}
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Description</th>
                <th className={styles.right} style={{ width: '110px' }}>Qty / Hours</th>
                <th className={styles.right} style={{ width: '130px' }}>Rate / Price</th>
                <th className={styles.right} style={{ width: '140px' }}>Amount ($ CAD)</th>
              </tr>
            </thead>
            <tbody>
              {/* 1. Labour Lines from Work Order */}
              {breakdown.labourLines.length > 0 && breakdown.labourLines.map((l, idx) => (
                <tr key={`labour-${idx}`}>
                  <td>
                    <strong>{l.description}</strong>
                    {l.technician && (
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Technician: {l.technician}
                      </span>
                    )}
                  </td>
                  <td className={styles.right}>{l.hours} hrs</td>
                  <td className={styles.right}>${l.rate.toFixed(2)}</td>
                  <td className={styles.right}><strong>${l.total.toFixed(2)}</strong></td>
                </tr>
              ))}

              {/* 2. Parts Lines from Work Order */}
              {breakdown.partsLines.length > 0 && breakdown.partsLines.map((p, idx) => (
                <tr key={`part-${idx}`}>
                  <td>
                    <strong>{p.description}</strong>
                    {p.partNumber && (
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Part #: {p.partNumber}
                      </span>
                    )}
                  </td>
                  <td className={styles.right}>{p.quantity}</td>
                  <td className={styles.right}>${p.unitPrice.toFixed(2)}</td>
                  <td className={styles.right}><strong>${p.total.toFixed(2)}</strong></td>
                </tr>
              ))}

              {/* 3. Shop Supplies & Environmental Fees */}
              {breakdown.shopSupplies > 0 && (
                <tr>
                  <td>
                    <strong>Shop Supplies & Environmental Recovery</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Consumables, fluid disposal, safety & shop maintenance (5% capped)
                    </span>
                  </td>
                  <td className={styles.right}>1</td>
                  <td className={styles.right}>${breakdown.shopSupplies.toFixed(2)}</td>
                  <td className={styles.right}><strong>${breakdown.shopSupplies.toFixed(2)}</strong></td>
                </tr>
              )}

              {/* Empty state if WO has no lines */}
              {breakdown.labourLines.length === 0 && breakdown.partsLines.length === 0 && breakdown.shopSupplies === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                    No billable items recorded on this work order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals Strictly Recalculated from Line Items */}
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Labour Total</span>
              <span>${breakdown.labourTotal.toFixed(2)}</span>
            </div>
            {breakdown.partsTotal > 0 && (
              <div className={styles.totalRow}>
                <span>Parts & Materials</span>
                <span>${breakdown.partsTotal.toFixed(2)}</span>
              </div>
            )}
            {breakdown.shopSupplies > 0 && (
              <div className={styles.totalRow}>
                <span>Shop Supplies</span>
                <span>${breakdown.shopSupplies.toFixed(2)}</span>
              </div>
            )}
            <div className={styles.totalRow} style={{ fontWeight: 600, borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
              <span>Subtotal</span>
              <span>${breakdown.subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>GST ({breakdown.taxRate}%)</span>
              <span>${breakdown.taxAmount.toFixed(2)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grand}`}>
              <span>TOTAL</span>
              <span>${breakdown.total.toFixed(2)}</span>
            </div>
            {invoice.status === 'paid' && (
              <div className={styles.totalRow} style={{ color: '#166534', fontWeight: 600 }}>
                <span>Amount Paid</span>
                <span>-${breakdown.total.toFixed(2)}</span>
              </div>
            )}
            <div className={styles.totalRow} style={{ fontWeight: 700, fontSize: '16px', color: invoice.status === 'paid' ? '#166534' : 'var(--color-text)' }}>
              <span>Balance Due</span>
              <span>${invoice.status === 'paid' ? '0.00' : breakdown.total.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.notes}>
            <p><strong>Payment Terms:</strong> Net 30</p>
            <p>Please make cheques payable to {shop.companyName}. Thank you for your business!</p>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>Actions</h3>
            {workOrder && (
              <button 
                className="btn btn-outline" 
                style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                onClick={handleSyncFromWO}
                disabled={isSyncing}
                title="Re-pull and recalculate latest labor and parts directly from Work Order"
              >
                <RefreshCw size={18} /> {isSyncing ? 'Syncing...' : 'Sync from Work Order'}
              </button>
            )}
            <button 
              className="btn btn-outline" 
              style={{width: '100%', justifyContent: 'flex-start'}}
              onClick={openEmailModal}
            >
              <Mail size={18} /> Email Invoice
            </button>
            <button 
              className="btn btn-primary" 
              style={{width: '100%', justifyContent: 'flex-start'}}
              onClick={() => setShowPaymentModal(true)}
            >
              <DollarSign size={18} /> Record Payment
            </button>
            <button 
              className="btn btn-outline" 
              style={{width: '100%', justifyContent: 'flex-start'}}
              onClick={() => window.print()}
            >
              <Printer size={18} /> Print PDF
            </button>

            {/* Reversible Paid/Unpaid Action */}
            {invoice.status === 'paid' ? (
              <button 
                className="btn btn-outline" 
                style={{
                  width: '100%', 
                  justifyContent: 'flex-start', 
                  color: '#d97706', 
                  borderColor: '#fde68a',
                  backgroundColor: '#fffbeb'
                }} 
                onClick={() => handleUpdateInvoiceStatus('draft')}
                title="Accidentally marked paid? Click to reverse to Unpaid (Draft)"
              >
                <RotateCcw size={18} /> Reverse to Unpaid (Draft)
              </button>
            ) : (
              <button 
                className="btn btn-outline" 
                style={{
                  width: '100%', 
                  justifyContent: 'flex-start', 
                  color: '#10b981', 
                  borderColor: '#10b981',
                  backgroundColor: '#ecfdf5'
                }} 
                onClick={() => handleUpdateInvoiceStatus('paid')}
              >
                <CheckCircle size={18} /> Mark as Paid
              </button>
            )}

            {/* Quick Status Switcher */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Change Status
              </label>
              <select
                className={`${styles.statusSelect} ${styles[invoice.status?.toLowerCase() || 'draft']}`}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', fontSize: '13px' }}
                value={invoice.status?.toLowerCase() || 'draft'}
                onChange={(e) => handleUpdateInvoiceStatus(e.target.value)}
              >
                <option value="draft">Draft (Unpaid)</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Email Invoice Confirmation Modal */}
      {showEmailModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.emailModalContent}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px' }}>Send Invoice #{invoice.id}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Confirm recipient email & optional shop CC</span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowEmailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendEmail}>
              {/* To Customer */}
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Recipient Customer Email *</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{customer?.company || 'Customer'}</span>
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

              {/* CC Shop Email Checkbox & Custom CC */}
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
                  <span>Attached: <strong>Invoice_{invoice.id}.pdf</strong></span>
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Record Payment</h3>
              <button className={styles.closeBtn} onClick={() => setShowPaymentModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className={styles.formGroup}>
                <label>Amount</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Method</label>
                <select 
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                >
                  <option>Credit Card</option>
                  <option>EFT</option>
                  <option>Cheque</option>
                  <option>Cash</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Date</label>
                <input 
                  type="date" 
                  value={paymentForm.date}
                  onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Reference #</label>
                <input 
                  type="text" 
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})}
                  placeholder="e.g. Cheque #, Trx ID"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Notes (Optional)</label>
                <textarea 
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
