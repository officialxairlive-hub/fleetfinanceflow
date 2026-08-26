import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import {
  computeInvoiceBalance,
  centsToDollars,
  dollarsToCents,
  type PaymentStatus,
} from "./billing/calc";

export interface PortalInvoice extends Tables<"invoices"> {
  unit: Pick<
    Tables<"units">,
    "unit_number" | "nickname" | "vin" | "make" | "model" | "year" | "license_plate"
  > | null;
  payments: Tables<"payments">[] | null;
  items?: Tables<"invoice_items">[];
  repair_updates?: Tables<"repair_updates">[];
  payment_reminders?: Tables<"payment_reminders">[];
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  days_overdue: number;
}

async function requireCustomer(
  context: {
    supabase: { from: (t: string) => any };
    userId: string;
  },
  shopId: string,
) {
  const { data, error } = await context.supabase
    .from("customers")
    .select("*")
    .eq("shop_id", shopId)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No customer account is linked to this login.");
  return data as Tables<"customers">;
}

function decorate<T extends Tables<"invoices"> & { payments?: Tables<"payments">[] | null }>(
  row: T,
) {
  const balance = computeInvoiceBalance(row, row.payments ?? []);
  return {
    ...row,
    amount_paid: balance.amountPaid,
    balance_due: balance.balanceDue,
    payment_status: balance.status,
    days_overdue: balance.daysOverdue,
  };
}

/** Everything the portal landing page needs in one round trip. */
export const getPortalOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const customer = await requireCustomer(context, shopId);

    const [invoicesRes, unitsRes, updatesRes] = await Promise.all([
      context.supabase
        .from("invoices")
        .select(
          "*, unit:unit_id(unit_number, nickname, vin, make, model, year, license_plate), payments(*)",
        )
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("units")
        .select("*")
        .eq("customer_id", customer.id)
        .order("unit_number", { ascending: true }),
      context.supabase
        .from("repair_updates")
        .select("*, invoice:invoice_id(invoice_number, customer_id, unit_id)")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    if (invoicesRes.error) throw invoicesRes.error;
    if (unitsRes.error) throw unitsRes.error;
    if (updatesRes.error) throw updatesRes.error;

    const invoices = ((invoicesRes.data ?? []) as unknown as PortalInvoice[]).map(decorate);
    const billable = invoices.filter(
      (i) => !["draft", "cancelled", "void"].includes(i.payment_status),
    );

    const outstandingCents = billable.reduce((s, i) => s + dollarsToCents(i.balance_due), 0);
    const overdueCents = billable
      .filter((i) => i.payment_status === "overdue")
      .reduce((s, i) => s + dollarsToCents(i.balance_due), 0);
    const lifetimeCents = invoices.reduce((s, i) => s + dollarsToCents(i.amount_paid), 0);

    const activeWork = invoices.filter(
      (i) =>
        i.work_status !== "delivered" &&
        !["cancelled", "void"].includes((i.status ?? "").toLowerCase()),
    );

    return {
      customer,
      invoices,
      units: (unitsRes.data ?? []) as Tables<"units">[],
      updates: (updatesRes.data ?? []) as (Tables<"repair_updates"> & {
        invoice: { invoice_number: string; customer_id: string; unit_id: string | null } | null;
      })[],
      activeWork,
      summary: {
        outstanding: centsToDollars(outstandingCents),
        overdue: centsToDollars(overdueCents),
        lifetimePaid: centsToDollars(lifetimeCents),
        openCount: billable.filter((i) => i.balance_due > 0).length,
        unitCount: (unitsRes.data ?? []).length,
        inShopCount: activeWork.length,
      },
    };
  });

/** Full billing history with itemization for the portal invoice list. */
export const getPortalInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const customer = await requireCustomer(context, shopId);
    const { data, error } = await context.supabase
      .from("invoices")
      .select(
        "*, unit:unit_id(unit_number, nickname, vin, make, model, year, license_plate), payments(*), items:invoice_items(*), repair_updates(*), payment_reminders(sent_at, message, status)",
      )
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const invoices = ((data ?? []) as unknown as PortalInvoice[]).map((row) => {
      const decorated = decorate(row);
      decorated.items = [...(row.items ?? [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );
      decorated.repair_updates = [...(row.repair_updates ?? [])].sort((a, b) =>
        (b.created_at ?? "").localeCompare(a.created_at ?? ""),
      );
      return decorated;
    });

    return { customer, invoices };
  });

export const getPortalUnits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const customer = await requireCustomer(context, shopId);
    const [unitsRes, invoicesRes, remindersRes] = await Promise.all([
      context.supabase
        .from("units")
        .select("*")
        .eq("customer_id", customer.id)
        .order("unit_number", { ascending: true }),
      context.supabase
        .from("invoices")
        .select(
          "id, unit_id, invoice_number, issue_date, total, odometer, work_status, status, payments(amount, status)",
        )
        .eq("customer_id", customer.id)
        .order("issue_date", { ascending: false }),
      context.supabase.from("reminders").select("*").eq("shop_id", shopId).eq("status", "pending"),
    ]);
    if (unitsRes.error) throw unitsRes.error;
    if (invoicesRes.error) throw invoicesRes.error;
    if (remindersRes.error) throw remindersRes.error;

    return {
      customer,
      units: (unitsRes.data ?? []) as Tables<"units">[],
      invoices: (invoicesRes.data ?? []) as unknown as (Tables<"invoices"> & {
        payments: { amount: number | null; status: string | null }[] | null;
      })[],
      reminders: (remindersRes.data ?? []) as Tables<"reminders">[],
    };
  });
