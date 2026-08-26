import {
  calculateBilling,
  lineTotal,
  type BillingLine,
  type BillingTaxConfig,
  type BillingTotals,
} from "./billing/calc";

export {
  formatCurrency,
  formatPercent,
  computeInvoiceBalance,
  sumSettledPayments,
} from "./billing/calc";

export interface LineItemInput {
  item_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  markup_pct?: number | null;
  hours?: number | null;
  technician?: string | null;
  gst_taxable?: boolean | null;
  pst_taxable?: boolean | null;
  part_id?: string | null;
  service_id?: string | null;
}

function toBillingLine(item: LineItemInput): BillingLine {
  return {
    itemType: item.item_type,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    markupPct: item.markup_pct ?? 0,
    gstTaxable: item.gst_taxable ?? null,
    pstTaxable: item.pst_taxable ?? null,
  };
}

export function calculateLineTotal(item: LineItemInput): number {
  return lineTotal(toBillingLine(item));
}

/** Authoritative totals for an invoice or estimate. Delegates to billing/calc. */
export function calculateTotals(
  items: LineItemInput[],
  gstRate: number,
  pstRate: number,
  suppliesPct: number = 0,
  options: Omit<BillingTaxConfig, "gstRate" | "pstRate" | "suppliesPct"> = {},
): BillingTotals {
  return calculateBilling(items.map(toBillingLine), {
    gstRate,
    pstRate,
    suppliesPct,
    ...options,
  });
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${random}`;
}

export function generateEstimateNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EST-${date}-${random}`;
}

export interface ClientLineItemInput {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  markupPct: number;
  hours?: number | null;
  technician?: string | null;
  gstTaxable?: boolean | null;
  pstTaxable?: boolean | null;
  partId?: string | null;
  serviceId?: string | null;
}

export function mapLineItemInput(item: ClientLineItemInput): LineItemInput {
  return {
    item_type: item.itemType,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    markup_pct: item.markupPct,
    hours: item.hours ?? null,
    technician: item.technician || null,
    gst_taxable: item.gstTaxable ?? null,
    pst_taxable: item.pstTaxable ?? null,
    part_id: item.partId || null,
    service_id: item.serviceId || null,
  };
}

export const ITEM_TYPE_LABELS: Record<string, string> = {
  labor: "Labor",
  service: "Labor",
  part: "Parts",
  fee: "Shop fees",
};

// ---------- Job encoding / decoding ----------
//
// The builder groups line items into "jobs". At save time each item's
// description is prefixed with `[Job Name] ` and per-job complaint/correction
// text is appended to the invoice notes inside a delimited block so the
// preview can reconstruct the job breakdown.

export const JOB_BLOCK_START = "===JOB DETAILS===";

export interface JobMeta {
  name: string;
  complaint: string;
  correction: string;
}

export function encodeJobsToNotes(userNotes: string, jobs: JobMeta[]): string {
  const meaningful = jobs.filter((j) => j.name.trim() || j.complaint.trim() || j.correction.trim());
  const base = userNotes.trim();
  if (meaningful.length === 0) return base;
  const block = meaningful
    .map((j) => {
      const lines = [`[${j.name.trim() || "Job"}]`];
      if (j.complaint.trim()) lines.push(`Complaint: ${j.complaint.trim()}`);
      if (j.correction.trim()) lines.push(`Correction: ${j.correction.trim()}`);
      return lines.join("\n");
    })
    .join("\n\n");
  return [base, `${JOB_BLOCK_START}\n${block}`].filter(Boolean).join("\n\n");
}

export function parseJobsFromNotes(notes: string | null | undefined): {
  userNotes: string;
  jobs: JobMeta[];
} {
  if (!notes) return { userNotes: "", jobs: [] };
  const idx = notes.indexOf(JOB_BLOCK_START);
  if (idx === -1) return { userNotes: notes, jobs: [] };
  const userNotes = notes.slice(0, idx).trim();
  const block = notes.slice(idx + JOB_BLOCK_START.length).trim();
  const jobs: JobMeta[] = [];
  // Split on blank lines between job entries.
  for (const chunk of block.split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    const header = lines[0].match(/^\[(.+)\]$/);
    const name = header ? header[1] : lines[0];
    let complaint = "";
    let correction = "";
    for (const l of lines.slice(header ? 1 : 0)) {
      if (/^complaint\s*:/i.test(l)) complaint = l.replace(/^complaint\s*:\s*/i, "");
      else if (/^correction\s*:/i.test(l)) correction = l.replace(/^correction\s*:\s*/i, "");
    }
    jobs.push({ name, complaint, correction });
  }
  return { userNotes, jobs };
}

export function stripJobPrefix(description: string): { jobName: string | null; text: string } {
  const m = description.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!m) return { jobName: null, text: description };
  return { jobName: m[1].trim(), text: m[2].trim() };
}

export interface JobGroup<T> {
  name: string;
  complaint: string;
  correction: string;
  items: T[];
}

/**
 * Group flat line items back into jobs using the `[Job Name]` prefix on each
 * item description together with the complaint/correction metadata parsed
 * from the notes block. Items whose prefix does not match any known job — or
 * that have no prefix at all — fall into an "Other" group at the end.
 */
export function groupItemsByJob<T extends { description: string }>(
  items: T[],
  jobs: JobMeta[],
): JobGroup<T>[] {
  const groups = new Map<string, JobGroup<T>>();
  for (const j of jobs) {
    groups.set(j.name, {
      name: j.name,
      complaint: j.complaint,
      correction: j.correction,
      items: [],
    });
  }
  const other: JobGroup<T> = { name: "Other charges", complaint: "", correction: "", items: [] };
  for (const it of items) {
    const { jobName, text } = stripJobPrefix(it.description);
    const cleaned = { ...it, description: text || it.description } as T;
    if (jobName && groups.has(jobName)) {
      groups.get(jobName)!.items.push(cleaned);
    } else if (jobName) {
      // Prefix present but the job wasn't in notes — synthesize a group.
      if (!groups.has(jobName))
        groups.set(jobName, { name: jobName, complaint: "", correction: "", items: [] });
      groups.get(jobName)!.items.push(cleaned);
    } else {
      other.items.push(cleaned);
    }
  }
  const list = Array.from(groups.values());
  if (other.items.length) list.push(other);
  return list;
}
