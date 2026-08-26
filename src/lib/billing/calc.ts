/**
 * Single source of truth for every money calculation in the app.
 *
 * Rules
 * -----
 * 1. All arithmetic happens in integer cents. Floating point dollars are only
 *    ever produced at the very end (`centsToDollars`) so no rounding drift can
 *    accumulate across lines, subtotals, taxes and totals.
 * 2. Each line is rounded to the cent once (half-up), then summed. That means
 *    the printed line totals always add up exactly to the printed subtotal.
 * 3. Category buckets: labor (labor + service lines), parts (part lines),
 *    fees (explicit fee lines). Shop supplies are computed separately and are
 *    never mixed into the fee bucket entered by the user.
 * 4. Tax bases are computed per line from the line's own taxable flags, so a
 *    BC-style shop (GST on everything, PST on parts + fees only) is just the
 *    default flag set, not a hardcoded rule.
 */

export type BillingItemType = "labor" | "service" | "part" | "fee";

export interface BillingLine {
  itemType: BillingItemType | string;
  /** Hours for labor, unit count for parts, always 1 for a flat fee. */
  quantity: number;
  unitPrice: number;
  /** Percent, e.g. 35 means +35%. Applied to parts (and anything else set). */
  markupPct?: number | null;
  /** Defaults: true for every line type. */
  gstTaxable?: boolean | null;
  /** Defaults: false for labor/service, true for parts/fees. */
  pstTaxable?: boolean | null;
}

/** What the shop supplies percentage is charged on. */
export type SuppliesBase = "labor" | "labor_parts" | "subtotal";

export interface BillingTaxConfig {
  gstRate: number;
  pstRate: number;
  /** Percent charged as shop supplies, e.g. 0.05 = 5%. 0 disables the charge. */
  suppliesPct?: number | null;
  /** Which bucket the supplies percent applies to. Defaults to labor only. */
  suppliesBase?: SuppliesBase | null;
  /** Optional dollar ceiling on the shop supplies charge. */
  suppliesCap?: number | null;
  gstExempt?: boolean | null;
  pstExempt?: boolean | null;
  /** Shop supplies inherit these; defaults GST yes / PST yes. */
  suppliesGstTaxable?: boolean | null;
  suppliesPstTaxable?: boolean | null;
}

export interface BillingTotals {
  lineTotals: number[];
  laborTotal: number;
  partsTotal: number;
  feesTotal: number;
  suppliesAmount: number;
  /** labor + parts + fees + supplies */
  subtotal: number;
  gstRate: number;
  pstRate: number;
  gstAmount: number;
  pstAmount: number;
  taxTotal: number;
  total: number;
  /** Same numbers in integer cents, for callers that keep chaining math. */
  cents: {
    lineTotals: number[];
    labor: number;
    parts: number;
    fees: number;
    supplies: number;
    subtotal: number;
    gst: number;
    pst: number;
    total: number;
  };
}

/** Half-up rounding that is stable for the classic 1.005 / 8.575 cases. */
export function roundCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const scaled = value * 1000;
  const rounded = Math.round(scaled) / 1000;
  return Math.sign(rounded) * Math.round(Math.abs(rounded));
}

export function dollarsToCents(amount: number | string | null | undefined): number {
  const n = typeof amount === "string" ? Number.parseFloat(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return roundCents(n * 100);
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function normalizeItemType(itemType: string): BillingItemType {
  if (itemType === "part" || itemType === "parts") return "part";
  if (itemType === "fee" || itemType === "supplies" || itemType === "shop_fee") return "fee";
  if (itemType === "service") return "service";
  return "labor";
}

export function defaultGstTaxable(_itemType: string): boolean {
  return true;
}

/** Labor is PST-exempt in BC-style provinces; parts and shop fees are not. */
export function defaultPstTaxable(itemType: string): boolean {
  const t = normalizeItemType(itemType);
  return t === "part" || t === "fee";
}

/** Line total in cents: quantity x unit price, plus markup, rounded once. */
export function lineTotalCents(line: BillingLine): number {
  const qty = Number.isFinite(line.quantity) ? line.quantity : 0;
  const price = Number.isFinite(line.unitPrice) ? line.unitPrice : 0;
  const markup = line.markupPct && Number.isFinite(line.markupPct) ? line.markupPct : 0;
  return roundCents(qty * price * (1 + markup / 100) * 100);
}

export function lineTotal(line: BillingLine): number {
  return centsToDollars(lineTotalCents(line));
}

export function calculateBilling(lines: BillingLine[], config: BillingTaxConfig): BillingTotals {
  const gstRate = config.gstExempt ? 0 : clampRate(config.gstRate);
  const pstRate = config.pstExempt ? 0 : clampRate(config.pstRate);

  const lineCents = lines.map(lineTotalCents);

  let labor = 0;
  let parts = 0;
  let fees = 0;
  let gstBase = 0;
  let pstBase = 0;

  lines.forEach((line, i) => {
    const cents = lineCents[i] ?? 0;
    const type = normalizeItemType(line.itemType);
    if (type === "part") parts += cents;
    else if (type === "fee") fees += cents;
    else labor += cents;

    const gstTaxable = line.gstTaxable ?? defaultGstTaxable(line.itemType);
    const pstTaxable = line.pstTaxable ?? defaultPstTaxable(line.itemType);
    if (gstTaxable) gstBase += cents;
    if (pstTaxable) pstBase += cents;
  });

  // Shop supplies: a percentage fee, never a line item. Base is configurable:
  // labor only (default), labor + parts, or the whole item subtotal.
  const suppliesPct = clampRate(config.suppliesPct ?? 0);
  const suppliesBase =
    config.suppliesBase === "labor_parts"
      ? labor + parts
      : config.suppliesBase === "subtotal"
        ? labor + parts + fees
        : labor;
  let supplies = suppliesPct > 0 ? roundCents(suppliesBase * suppliesPct) : 0;
  const capCents = config.suppliesCap == null ? null : dollarsToCents(config.suppliesCap);
  if (capCents != null && capCents >= 0 && supplies > capCents) supplies = capCents;

  if (supplies > 0) {
    if (config.suppliesGstTaxable ?? true) gstBase += supplies;
    if (config.suppliesPstTaxable ?? true) pstBase += supplies;
  }

  const subtotal = labor + parts + fees + supplies;
  const gst = roundCents(gstBase * gstRate);
  const pst = roundCents(pstBase * pstRate);
  const total = subtotal + gst + pst;

  return {
    lineTotals: lineCents.map(centsToDollars),
    laborTotal: centsToDollars(labor),
    partsTotal: centsToDollars(parts),
    feesTotal: centsToDollars(fees),
    suppliesAmount: centsToDollars(supplies),
    subtotal: centsToDollars(subtotal),
    gstRate,
    pstRate,
    gstAmount: centsToDollars(gst),
    pstAmount: centsToDollars(pst),
    taxTotal: centsToDollars(gst + pst),
    total: centsToDollars(total),
    cents: {
      lineTotals: lineCents,
      labor,
      parts,
      fees,
      supplies,
      subtotal,
      gst,
      pst,
      total,
    },
  };
}

function clampRate(rate: number | null | undefined): number {
  const n = Number(rate ?? 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  // Rates are stored as fractions (0.05 = 5%). Tolerate a percent slipping in.
  return n > 1 ? n / 100 : n;
}

// ---------------- balances / payment status ----------------

export const PAID_PAYMENT_STATUSES = ["succeeded", "paid", "completed"] as const;

export function isSettledPayment(status: string | null | undefined): boolean {
  return PAID_PAYMENT_STATUSES.includes(
    (status ?? "").toLowerCase() as (typeof PAID_PAYMENT_STATUSES)[number],
  );
}

export type PaymentStatus =
  "draft" | "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled" | "void";

export interface InvoiceBalance {
  amountPaid: number;
  balanceDue: number;
  status: PaymentStatus;
  daysOverdue: number;
  agingBucket: "current" | "1-30" | "31-60" | "61-90" | "90+";
}

export function sumSettledPayments(
  payments: { amount: number | string | null; status: string | null }[] | null | undefined,
): number {
  const cents = (payments ?? [])
    .filter((p) => isSettledPayment(p.status))
    .reduce((sum, p) => sum + dollarsToCents(p.amount), 0);
  return centsToDollars(cents);
}

export function computeInvoiceBalance(
  invoice: {
    total: number | string | null;
    status: string | null;
    due_date?: string | null;
  },
  payments: { amount: number | string | null; status: string | null }[] | null | undefined,
  today: Date = new Date(),
): InvoiceBalance {
  const totalCents = dollarsToCents(invoice.total);
  const paidCents = dollarsToCents(sumSettledPayments(payments));
  const balanceCents = totalCents - paidCents;
  const raw = (invoice.status ?? "").toLowerCase();

  let status: PaymentStatus;
  if (raw === "draft" || raw === "cancelled" || raw === "void") {
    status = raw as PaymentStatus;
  } else if (balanceCents <= 0) {
    status = "paid";
  } else if (paidCents > 0) {
    status = "partially_paid";
  } else {
    status = "unpaid";
  }

  const daysOverdue = overdueDays(invoice.due_date, today);
  if ((status === "unpaid" || status === "partially_paid") && daysOverdue > 0) {
    status = "overdue";
  }

  return {
    amountPaid: centsToDollars(paidCents),
    balanceDue: centsToDollars(Math.max(balanceCents, 0)),
    status,
    daysOverdue,
    agingBucket: agingBucket(daysOverdue),
  };
}

export function overdueDays(dueDate: string | null | undefined, today: Date = new Date()): number {
  if (!dueDate) return 0;
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(due.getTime())) return 0;
  const nowUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const diff = Math.floor((nowUtc - due.getTime()) / 86_400_000);
  return diff > 0 ? diff : 0;
}

export function agingBucket(daysOverdue: number): InvoiceBalance["agingBucket"] {
  if (daysOverdue <= 0) return "current";
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

export function formatCurrency(amount: number | string | null | undefined): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    centsToDollars(dollarsToCents(amount)),
  );
}

export function formatPercent(rate: number | null | undefined): string {
  const n = Number(rate ?? 0);
  const pct = n > 1 ? n : n * 100;
  return `${Number(pct.toFixed(3))}%`;
}
