import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeInvoiceBalance, dollarsToCents, centsToDollars } from "./billing/calc";

type PaymentRow = { amount: number | null; status: string | null; paid_at: string | null };

interface InvoiceMetricRow {
  id: string;
  total: number | null;
  subtotal: number | null;
  labor_total: number | null;
  parts_total: number | null;
  fees_total: number | null;
  supplies_amount: number | null;
  gst_amount: number | null;
  pst_amount: number | null;
  status: string | null;
  due_date: string | null;
  issue_date: string | null;
  created_at: string;
  payments: PaymentRow[] | null;
}

const INVOICE_METRIC_COLUMNS =
  "id, total, subtotal, labor_total, parts_total, fees_total, supplies_amount, gst_amount, pst_amount, status, due_date, issue_date, created_at, payments(amount, status, paid_at)";

const NON_BILLABLE = ["draft", "cancelled", "void"];

function monthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function revenueDate(inv: InvoiceMetricRow): string {
  return (inv.issue_date ?? inv.created_at).slice(0, 10);
}

/**
 * Dashboard metrics.
 *
 * Revenue is recognised on issued (non-draft) invoices, net of tax — tax
 * collected is a liability, not revenue. Collections are computed from settled
 * payments. Outstanding is total minus settled payments, never negative.
 */
export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const [
      { count: customerCount, error: customersError },
      { data: invoiceRows, error: invoicesError },
    ] = await Promise.all([
      context.supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
      context.supabase.from("invoices").select(INVOICE_METRIC_COLUMNS).eq("shop_id", shopId),
    ]);
    if (customersError) throw customersError;
    if (invoicesError) throw invoicesError;

    const invoices = (invoiceRows ?? []) as unknown as InvoiceMetricRow[];
    const today = new Date();
    const start = monthStart(today).toISOString().slice(0, 10);

    let outstandingCents = 0;
    let overdueCents = 0;
    let openCount = 0;
    let overdueCount = 0;
    let revenueMonthCents = 0;
    let taxMonthCents = 0;
    let laborMonthCents = 0;
    let partsMonthCents = 0;
    let feesMonthCents = 0;
    let collectedMonthCents = 0;
    let invoicedMonthCents = 0;
    let invoicedMonthCount = 0;

    for (const inv of invoices) {
      const status = (inv.status ?? "").toLowerCase();
      const billable = !NON_BILLABLE.includes(status);
      const balance = computeInvoiceBalance(inv, inv.payments ?? []);

      if (billable) {
        const due = dollarsToCents(balance.balanceDue);
        outstandingCents += due;
        if (due > 0) openCount += 1;
        if (balance.status === "overdue") {
          overdueCents += due;
          overdueCount += 1;
        }

        if (revenueDate(inv) >= start) {
          const tax = dollarsToCents(inv.gst_amount) + dollarsToCents(inv.pst_amount);
          revenueMonthCents += dollarsToCents(inv.total) - tax;
          taxMonthCents += tax;
          laborMonthCents += dollarsToCents(inv.labor_total);
          partsMonthCents += dollarsToCents(inv.parts_total);
          feesMonthCents += dollarsToCents(inv.fees_total) + dollarsToCents(inv.supplies_amount);
          invoicedMonthCents += dollarsToCents(inv.total);
          invoicedMonthCount += 1;
        }
      }

      for (const p of inv.payments ?? []) {
        if (!["succeeded", "paid", "completed"].includes((p.status ?? "").toLowerCase())) continue;
        const when = (p.paid_at ?? "").slice(0, 10);
        if (when && when >= start) collectedMonthCents += dollarsToCents(p.amount);
      }
    }

    const { count: overdueReminderCount, error: remindersError } = await context.supabase
      .from("reminders")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .eq("status", "pending")
      .lte("due_date", today.toISOString().slice(0, 10));
    if (remindersError) throw remindersError;

    return {
      customerCount: customerCount ?? 0,
      openInvoiceCount: openCount,
      overdueInvoiceCount: overdueCount,
      outstandingAmount: centsToDollars(outstandingCents),
      overdueAmount: centsToDollars(overdueCents),
      /** Net of tax, invoices issued this month. */
      revenueThisMonth: centsToDollars(revenueMonthCents),
      taxCollectedThisMonth: centsToDollars(taxMonthCents),
      laborRevenueThisMonth: centsToDollars(laborMonthCents),
      partsRevenueThisMonth: centsToDollars(partsMonthCents),
      feeRevenueThisMonth: centsToDollars(feesMonthCents),
      collectedThisMonth: centsToDollars(collectedMonthCents),
      invoicedThisMonth: centsToDollars(invoicedMonthCents),
      averageInvoiceThisMonth:
        invoicedMonthCount > 0
          ? centsToDollars(Math.round(invoicedMonthCents / invoicedMonthCount))
          : 0,
      overdueReminderCount: overdueReminderCount ?? 0,
    };
  });

export const getRevenueChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const months: { label: string; start: string; end: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      months.push({
        label: d.toISOString().slice(0, 7),
        start: d.toISOString().slice(0, 10),
        end: next.toISOString().slice(0, 10),
      });
    }

    const { data, error } = await context.supabase
      .from("invoices")
      .select(INVOICE_METRIC_COLUMNS)
      .eq("shop_id", shopId)
      .gte("created_at", `${months[0]!.start}T00:00:00Z`);
    if (error) throw error;

    const invoices = (data ?? []) as unknown as InvoiceMetricRow[];

    const results = months.map((m) => {
      let revenue = 0;
      let labor = 0;
      let parts = 0;
      let fees = 0;
      let tax = 0;
      let collected = 0;
      for (const inv of invoices) {
        const status = (inv.status ?? "").toLowerCase();
        if (!NON_BILLABLE.includes(status)) {
          const d = revenueDate(inv);
          if (d >= m.start && d < m.end) {
            const invTax = dollarsToCents(inv.gst_amount) + dollarsToCents(inv.pst_amount);
            revenue += dollarsToCents(inv.total) - invTax;
            labor += dollarsToCents(inv.labor_total);
            parts += dollarsToCents(inv.parts_total);
            fees += dollarsToCents(inv.fees_total) + dollarsToCents(inv.supplies_amount);
            tax += invTax;
          }
        }
        for (const p of inv.payments ?? []) {
          if (!["succeeded", "paid", "completed"].includes((p.status ?? "").toLowerCase()))
            continue;
          const when = (p.paid_at ?? "").slice(0, 10);
          if (when >= m.start && when < m.end) collected += dollarsToCents(p.amount);
        }
      }
      return {
        label: m.label,
        revenue: centsToDollars(revenue),
        labor: centsToDollars(labor),
        parts: centsToDollars(parts),
        fees: centsToDollars(fees),
        tax: centsToDollars(tax),
        collected: centsToDollars(collected),
      };
    });

    return { data: results };
  });
