import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import {
  invoiceSchema,
  paymentSchema,
  repairUpdateSchema,
  paymentReminderSchema,
  invoiceEmailSchema,
} from "./schemas";
import { parseSuppliesBase } from "./billing/supplies";
import type { SuppliesBase } from "./billing/calc";
import { calculateTotals, generateInvoiceNumber, mapLineItemInput } from "./invoices.utils";
import { computeInvoiceBalance, formatCurrency, type PaymentStatus } from "./billing/calc";

export interface InvoiceWithItems extends Tables<"invoices"> {
  customer: Tables<"customers"> | null;
  unit: Tables<"units"> | null;
  items: Tables<"invoice_items">[];
  payments: Tables<"payments">[];
  repair_updates?: Tables<"repair_updates">[];
  payment_reminders?: Tables<"payment_reminders">[];
}

type PaymentRow = { amount: number | null; status: string | null };

export interface InvoiceListRow extends Tables<"invoices"> {
  customer: { name: string; email: string | null } | null;
  unit: {
    unit_number: string | null;
    nickname: string | null;
    vin: string | null;
    license_plate: string | null;
    make?: string | null;
    model?: string | null;
  } | null;
  payments: PaymentRow[] | null;
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  days_overdue: number;
  aging_bucket: string;
}

function withBalance<T extends Tables<"invoices"> & { payments?: PaymentRow[] | null }>(row: T) {
  const balance = computeInvoiceBalance(row, row.payments ?? []);
  return {
    ...row,
    amount_paid: balance.amountPaid,
    balance_due: balance.balanceDue,
    payment_status: balance.status,
    days_overdue: balance.daysOverdue,
    aging_bucket: balance.agingBucket,
  };
}

export const listInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("invoices")
      .select(
        "*, customer:customer_id(name, email), unit:unit_id(unit_number, nickname, vin, license_plate), payments(amount, status)",
      )
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return {
      invoices: ((data ?? []) as unknown as InvoiceListRow[]).map(withBalance) as InvoiceListRow[],
    };
  });

export const listInvoicesByCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { shopId: string; customerId: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("invoices")
      .select(
        "*, unit:unit_id(unit_number, nickname, make, model, vin, license_plate), payments(amount, status)",
      )
      .eq("shop_id", data.shopId)
      .eq("customer_id", data.customerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return {
      invoices: ((rows ?? []) as unknown as InvoiceListRow[]).map(withBalance) as InvoiceListRow[],
    };
  });

export const listInvoicesByUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((unitId: string) => unitId)
  .handler(async ({ data: unitId, context }) => {
    const { data, error } = await context.supabase
      .from("invoices")
      .select("*, payments(amount, status)")
      .eq("unit_id", unitId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return {
      invoices: ((data ?? []) as unknown as InvoiceListRow[]).map(withBalance) as InvoiceListRow[],
    };
  });

export const getInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { data, error } = await context.supabase
      .from("invoices")
      .select(
        "*, customer:customer_id(*), unit:unit_id(*), items:invoice_items(*), payments:payments(*), repair_updates:repair_updates(*), payment_reminders:payment_reminders(*)",
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    const invoice = data as unknown as InvoiceWithItems;
    invoice.items = [...(invoice.items ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    invoice.repair_updates = [...(invoice.repair_updates ?? [])].sort((a, b) =>
      (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    );
    const balance = computeInvoiceBalance(invoice, invoice.payments ?? []);
    return { invoice, balance };
  });

interface ResolvedTaxContext {
  gstRate: number;
  pstRate: number;
  suppliesPct: number;
  suppliesCap: number | null;
  suppliesBase: SuppliesBase;
}

async function resolveTaxContext(
  supabase: { from: (t: string) => any },
  input: {
    shopId?: string;
    customerId?: string;
    gstRate?: number;
    pstRate?: number;
    suppliesPct?: number;
    suppliesCap?: number | null;
  },
): Promise<ResolvedTaxContext> {
  let gstRate = input.gstRate ?? 0;
  let pstRate = input.pstRate ?? 0;
  let suppliesPct = input.suppliesPct ?? 0;
  let suppliesCap = input.suppliesCap ?? null;
  let suppliesBase: SuppliesBase = "labor";

  if (input.shopId) {
    const { data: shop } = await supabase
      .from("shops")
      .select(
        "default_gst_rate, default_pst_rate, default_supplies_pct, default_supplies_cap, settings",
      )
      .eq("id", input.shopId)
      .maybeSingle();
    if (shop) {
      if (input.gstRate === undefined) gstRate = Number(shop.default_gst_rate ?? 0);
      if (input.pstRate === undefined) pstRate = Number(shop.default_pst_rate ?? 0);
      if (input.suppliesPct === undefined) suppliesPct = Number(shop.default_supplies_pct ?? 0);
      if (input.suppliesCap === undefined || input.suppliesCap === null) {
        suppliesCap = shop.default_supplies_cap == null ? null : Number(shop.default_supplies_cap);
      }
      suppliesBase = parseSuppliesBase(shop.settings);
    }
  }

  // Customer overrides and exemptions always win — they are a legal setting,
  // never something the invoice form should be able to bypass.
  if (input.customerId) {
    const { data: customer } = await supabase
      .from("customers")
      .select("gst_exempt, pst_exempt, gst_rate, pst_rate")
      .eq("id", input.customerId)
      .maybeSingle();
    if (customer) {
      if (customer.gst_rate != null) gstRate = Number(customer.gst_rate);
      if (customer.pst_rate != null) pstRate = Number(customer.pst_rate);
      if (customer.gst_exempt) gstRate = 0;
      if (customer.pst_exempt) pstRate = 0;
    }
  }

  return { gstRate, pstRate, suppliesPct, suppliesCap, suppliesBase };
}

async function unitSnapshot(
  supabase: { from: (t: string) => any },
  unitId: string | null | undefined,
) {
  if (!unitId) return { unit_number_snapshot: null, vin_snapshot: null };
  const { data } = await supabase
    .from("units")
    .select("unit_number, vin")
    .eq("id", unitId)
    .maybeSingle();
  return {
    unit_number_snapshot: data?.unit_number ?? null,
    vin_snapshot: data?.vin ?? null,
  };
}

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => invoiceSchema.parse(data))
  .handler(async ({ data, context }) => {
    const items = data.items.map(mapLineItemInput);
    const tax = await resolveTaxContext(context.supabase, {
      shopId: data.shopId,
      customerId: data.customerId,
      gstRate: data.gstRate,
      pstRate: data.pstRate,
      suppliesPct: data.suppliesPct,
      suppliesCap: data.suppliesCap ?? null,
    });
    const totals = calculateTotals(items, tax.gstRate, tax.pstRate, tax.suppliesPct, {
      suppliesCap: tax.suppliesCap,
      suppliesBase: tax.suppliesBase,
    });
    const snapshot = await unitSnapshot(context.supabase, data.unitId || null);

    const { data: invoice, error: invoiceError } = await context.supabase
      .from("invoices")
      .insert({
        shop_id: data.shopId,
        customer_id: data.customerId,
        unit_id: data.unitId || null,
        invoice_number: data.invoiceNumber || generateInvoiceNumber(),
        status: data.status,
        work_status: data.workStatus ?? "received",
        issue_date: data.issueDate || null,
        due_date: data.dueDate || null,
        odometer: data.odometer ?? null,
        ...snapshot,
        labor_total: totals.laborTotal,
        parts_total: totals.partsTotal,
        fees_total: totals.feesTotal,
        supplies_pct: tax.suppliesPct,
        supplies_cap: tax.suppliesCap,
        supplies_amount: totals.suppliesAmount,
        gst_rate: totals.gstRate,
        pst_rate: totals.pstRate,
        gst_amount: totals.gstAmount,
        pst_amount: totals.pstAmount,
        subtotal: totals.subtotal,
        total: totals.total,
        notes: data.notes || null,
      })
      .select("*")
      .single();

    if (invoiceError || !invoice) throw invoiceError || new Error("Failed to create invoice");

    if (items.length > 0) {
      const { error: itemsError } = await context.supabase
        .from("invoice_items")
        .insert(buildItemRows(invoice.id, items, totals.lineTotals));
      if (itemsError) throw itemsError;
    }

    if (data.unitId && data.odometer != null) {
      await context.supabase
        .from("units")
        .update({ current_odometer: data.odometer })
        .eq("id", data.unitId)
        .lte("current_odometer", data.odometer);
    }

    await context.supabase.from("repair_updates").insert({
      invoice_id: invoice.id,
      work_status: data.workStatus ?? "received",
      note: "Work order opened.",
      created_by: context.userId,
    });

    return { invoice: invoice as Tables<"invoices"> };
  });

function buildItemRows(
  invoiceId: string,
  items: ReturnType<typeof mapLineItemInput>[],
  lineTotals: number[],
) {
  return items.map((item, i) => ({
    invoice_id: invoiceId,
    item_type: item.item_type,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    markup_pct: item.markup_pct ?? 0,
    hours:
      item.item_type === "labor" || item.item_type === "service"
        ? (item.hours ?? item.quantity)
        : null,
    technician: item.technician ?? null,
    gst_taxable: item.gst_taxable ?? true,
    pst_taxable: item.pst_taxable ?? (item.item_type === "part" || item.item_type === "fee"),
    line_total: lineTotals[i] ?? 0,
    sort_order: i,
    part_id: item.part_id || null,
    service_id: item.service_id || null,
  }));
}

export const updateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string } & Record<string, unknown>) => {
    const parsed = invoiceSchema.partial().parse(data);
    return { id: data.id, ...parsed };
  })
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;

    const { data: existing, error: existingError } = await context.supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();
    if (existingError || !existing) throw existingError || new Error("Invoice not found");

    const items = rest.items?.map(mapLineItemInput);
    const unitId = rest.unitId === undefined ? existing.unit_id : rest.unitId || null;

    const tax = await resolveTaxContext(context.supabase, {
      shopId: existing.shop_id,
      customerId: rest.customerId ?? existing.customer_id,
      gstRate: rest.gstRate ?? Number(existing.gst_rate ?? 0),
      pstRate: rest.pstRate ?? Number(existing.pst_rate ?? 0),
      suppliesPct: rest.suppliesPct ?? Number(existing.supplies_pct ?? 0),
      suppliesCap:
        rest.suppliesCap === undefined
          ? existing.supplies_cap == null
            ? null
            : Number(existing.supplies_cap)
          : rest.suppliesCap,
    });

    // Totals are always recomputed from the stored (or incoming) line items so
    // a partial update can never leave stale money on the invoice.
    let effectiveItems = items;
    if (!effectiveItems) {
      const { data: rows, error: rowsError } = await context.supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id)
        .order("sort_order", { ascending: true });
      if (rowsError) throw rowsError;
      effectiveItems = (rows ?? []).map((row) => ({
        item_type: row.item_type,
        description: row.description,
        quantity: Number(row.quantity ?? 0),
        unit_price: Number(row.unit_price ?? 0),
        markup_pct: Number(row.markup_pct ?? 0),
        hours: row.hours == null ? null : Number(row.hours),
        technician: row.technician,
        gst_taxable: row.gst_taxable,
        pst_taxable: row.pst_taxable,
        part_id: row.part_id,
        service_id: row.service_id,
      }));
    }

    const totals = calculateTotals(effectiveItems, tax.gstRate, tax.pstRate, tax.suppliesPct, {
      suppliesCap: tax.suppliesCap,
      suppliesBase: tax.suppliesBase,
    });
    const snapshot = await unitSnapshot(context.supabase, unitId);

    const updateData: TablesUpdate<"invoices"> = {
      unit_id: unitId,
      ...snapshot,
      labor_total: totals.laborTotal,
      parts_total: totals.partsTotal,
      fees_total: totals.feesTotal,
      supplies_pct: tax.suppliesPct,
      supplies_cap: tax.suppliesCap,
      supplies_amount: totals.suppliesAmount,
      gst_rate: totals.gstRate,
      pst_rate: totals.pstRate,
      gst_amount: totals.gstAmount,
      pst_amount: totals.pstAmount,
      subtotal: totals.subtotal,
      total: totals.total,
    };
    if (rest.customerId !== undefined) updateData.customer_id = rest.customerId;
    if (rest.invoiceNumber !== undefined) updateData.invoice_number = rest.invoiceNumber;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.workStatus !== undefined) updateData.work_status = rest.workStatus;
    if (rest.issueDate !== undefined) updateData.issue_date = rest.issueDate || null;
    if (rest.dueDate !== undefined) updateData.due_date = rest.dueDate || null;
    if (rest.odometer !== undefined) updateData.odometer = rest.odometer ?? null;
    if (rest.notes !== undefined) updateData.notes = rest.notes || null;

    const { data: invoice, error } = await context.supabase
      .from("invoices")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !invoice) throw error || new Error("Failed to update invoice");

    if (items) {
      await context.supabase.from("invoice_items").delete().eq("invoice_id", id);
      const { error: itemsError } = await context.supabase
        .from("invoice_items")
        .insert(buildItemRows(id, items, totals.lineTotals));
      if (itemsError) throw itemsError;
    }

    return { invoice: invoice as Tables<"invoices"> };
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase.from("invoices").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    const patch: TablesUpdate<"invoices"> = { status: data.status };
    if (data.status === "sent") patch.sent_at = new Date().toISOString();
    const { error } = await context.supabase.from("invoices").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- repair updates (customer-visible timeline) ----------------

export const addRepairUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => repairUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("repair_updates").insert({
      invoice_id: data.invoiceId,
      work_status: data.workStatus,
      note: data.note || null,
      created_by: context.userId,
    });
    if (error) throw error;
    const { error: invoiceError } = await context.supabase
      .from("invoices")
      .update({ work_status: data.workStatus })
      .eq("id", data.invoiceId);
    if (invoiceError) throw invoiceError;
    return { ok: true };
  });

// ---------------- payments ----------------

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => paymentSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payments").insert({
      invoice_id: data.invoiceId,
      amount: data.amount,
      method: data.method,
      reference: data.reference || null,
      status: "succeeded",
      paid_at: data.paidAt ? new Date(data.paidAt).toISOString() : new Date().toISOString(),
    });
    if (error) throw error;
    await syncInvoicePaidFlag(context.supabase, data.invoiceId);
    return { ok: true };
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; invoiceId: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payments").delete().eq("id", data.id);
    if (error) throw error;
    await syncInvoicePaidFlag(context.supabase, data.invoiceId);
    return { ok: true };
  });

async function syncInvoicePaidFlag(supabase: { from: (t: string) => any }, invoiceId: string) {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("total, status, due_date, payments(amount, status)")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return;
  const balance = computeInvoiceBalance(invoice, invoice.payments ?? []);
  const raw = (invoice.status ?? "").toLowerCase();
  if (raw === "draft" || raw === "cancelled" || raw === "void") return;
  const next =
    balance.status === "paid" ? "paid" : balance.status === "overdue" ? "overdue" : "sent";
  if (next !== raw) {
    await supabase.from("invoices").update({ status: next }).eq("id", invoiceId);
  }
}

// ---------------- payment status tracker + reminders ----------------

export const getReceivables = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("invoices")
      .select(
        "*, customer:customer_id(name, email), unit:unit_id(unit_number, nickname, vin, license_plate), payments(amount, status), payment_reminders(sent_at, channel, status)",
      )
      .eq("shop_id", shopId)
      .order("due_date", { ascending: true, nullsFirst: false });
    if (error) throw error;

    const rows = (
      (data ?? []) as unknown as (InvoiceListRow & {
        payment_reminders: { sent_at: string; channel: string; status: string }[] | null;
      })[]
    ).map((row) => {
      const withBal = withBalance(row);
      const reminders = [...(row.payment_reminders ?? [])].sort((a, b) =>
        b.sent_at.localeCompare(a.sent_at),
      );
      return {
        ...withBal,
        last_reminder_at: reminders[0]?.sent_at ?? null,
        reminder_count: reminders.length,
      };
    });

    const billable = rows.filter((r) => !["draft", "cancelled", "void"].includes(r.payment_status));
    const buckets = { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    for (const r of billable) {
      buckets[r.aging_bucket as keyof typeof buckets] += r.balance_due;
    }

    return {
      invoices: rows,
      summary: {
        outstanding: round2(billable.reduce((s, r) => s + r.balance_due, 0)),
        overdue: round2(
          billable
            .filter((r) => r.payment_status === "overdue")
            .reduce((s, r) => s + r.balance_due, 0),
        ),
        paidCount: rows.filter((r) => r.payment_status === "paid").length,
        unpaidCount: billable.filter((r) => r.payment_status !== "paid").length,
        overdueCount: billable.filter((r) => r.payment_status === "overdue").length,
        aging: Object.fromEntries(
          Object.entries(buckets).map(([k, v]) => [k, round2(v)]),
        ) as Record<string, number>,
      },
    };
  });

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export const sendPaymentReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => paymentReminderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: invoice, error } = await context.supabase
      .from("invoices")
      .select(
        "*, customer:customer_id(name, email), payments(amount, status), shop:shop_id(name, email)",
      )
      .eq("id", data.invoiceId)
      .single();
    if (error || !invoice) throw error || new Error("Invoice not found");

    const balance = computeInvoiceBalance(invoice, (invoice as any).payments ?? []);
    const customer = (invoice as any).customer as { name: string; email: string | null } | null;
    const shopRow = (invoice as any).shop as { name: string; email: string | null } | null;
    const shopName = shopRow?.name ?? "the shop";

    const message =
      data.message ||
      `Invoice ${invoice.invoice_number} has an outstanding balance of ${formatCurrency(
        balance.balanceDue,
      )}${balance.daysOverdue > 0 ? ` and is ${balance.daysOverdue} day(s) past due` : ""}.`;

    let channel = "portal";
    let status = "logged";
    let failure: string | null = null;

    if (customer?.email) {
      try {
        const { sendReminderEmail } = await import("./notifications.server");
        await sendReminderEmail({
          to: customer.email,
          customerName: customer.name,
          shopName,
          invoiceNumber: invoice.invoice_number,
          balanceDue: balance.balanceDue,
          daysOverdue: balance.daysOverdue,
          message,
          replyTo: shopRow?.email ?? null,
        });
        channel = "email";
        status = "sent";
      } catch (e) {
        const reason = e instanceof Error ? e.message : "Email delivery failed";
        if (reason === "EMAIL_NOT_CONFIGURED") {
          // No sender domain yet — the portal flag is still the source of truth.
          channel = "portal";
          status = "logged";
        } else {
          channel = "email";
          status = "failed";
          failure = reason;
        }
      }
    }

    const { error: insertError } = await context.supabase.from("payment_reminders").insert({
      invoice_id: data.invoiceId,
      channel,
      status,
      message: failure ? `${message} (email failed: ${failure})` : message,
      balance_at_send: balance.balanceDue,
      sent_by: context.userId,
    });
    if (insertError) throw insertError;

    return { ok: true, channel, status, emailed: status === "sent" };
  });

/**
 * Emails an invoice to the customer and records an audit entry
 * ("Invoice emailed on <date>") regardless of whether the managed email
 * provider is configured yet, so shops always have a delivery trail.
 */
export const sendInvoiceByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => invoiceEmailSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: invoice, error } = await context.supabase
      .from("invoices")
      .select("*, customer:customer_id(name, email), shop:shop_id(name, email)")
      .eq("id", data.invoiceId)
      .single();
    if (error || !invoice) throw error || new Error("Invoice not found");

    const customerName = ((invoice as any).customer as { name: string } | null)?.name ?? "Customer";
    const shopRow = (invoice as any).shop as { name: string; email: string | null } | null;
    const shopName = shopRow?.name ?? "the shop";

    let emailed = false;
    let failure: string | null = null;
    let configured = true;

    try {
      const { sendInvoiceEmail, EMAIL_NOT_CONFIGURED } = await import("./notifications.server");
      await sendInvoiceEmail({
        to: data.to,
        subject: data.subject,
        message: data.message,
        customerName,
        shopName,
        invoiceNumber: invoice.invoice_number,
        total: Number(invoice.total ?? 0),
        invoiceUrl: data.invoiceUrl || "",
        replyTo: shopRow?.email ?? null,
      });
      emailed = true;
      void EMAIL_NOT_CONFIGURED;
    } catch (e) {
      const reason = e instanceof Error ? e.message : "Email delivery failed";
      if (reason === "EMAIL_NOT_CONFIGURED") configured = false;
      else failure = reason;
    }

    const sentAt = new Date().toISOString();
    const auditNote = emailed
      ? `Invoice emailed to ${data.to} on ${sentAt.slice(0, 10)}`
      : configured
        ? `Invoice email to ${data.to} failed: ${failure}`
        : `Invoice queued for ${data.to} on ${sentAt.slice(0, 10)} — email sending is not set up yet`;

    const { error: logError } = await context.supabase.from("payment_reminders").insert({
      invoice_id: data.invoiceId,
      channel: emailed ? "email" : configured ? "email" : "portal",
      status: emailed ? "sent" : configured ? "failed" : "logged",
      message: `${data.subject} — ${auditNote}`,
      sent_by: context.userId,
      sent_at: sentAt,
    });
    if (logError) throw logError;

    if (emailed) {
      const patch: TablesUpdate<"invoices"> = { sent_at: sentAt };
      if ((invoice.status ?? "draft") === "draft") patch.status = "sent";
      const { error: updateError } = await context.supabase
        .from("invoices")
        .update(patch)
        .eq("id", data.invoiceId);
      if (updateError) throw updateError;
    }

    return { ok: true, emailed, configured, sentAt, error: failure, auditNote };
  });
