import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { customerSchema } from "./schemas";

export const listCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("customers")
      .select("*")
      .eq("shop_id", shopId)
      .order("name", { ascending: true });
    if (error) throw error;
    return { customers: (data ?? []) as Tables<"customers">[] };
  });

export const getCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { data, error } = await context.supabase
      .from("customers")
      .select("*, units(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { customer: data as Tables<"customers"> & { units: Tables<"units">[] } };
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => customerSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("customers")
      .insert({
        shop_id: data.shopId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        billing_address: data.billingAddress || null,
        gst_exempt: data.gstExempt ?? false,
        pst_exempt: data.pstExempt ?? false,
        gst_rate: data.gstRate ?? null,
        pst_rate: data.pstRate ?? null,
        gst_number: data.gstNumber || null,
        pst_number: data.pstNumber || null,
        labor_rate: data.laborRate ?? null,
        parts_markup_pct: data.partsMarkupPct ?? null,
      })
      .select("*")
      .single();
    if (error || !inserted) throw error || new Error("Failed to create customer");
    return { customer: inserted as Tables<"customers"> };
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string } & Record<string, unknown>) => {
    const parsed = customerSchema.partial().parse(data);
    return { id: data.id, ...parsed };
  })
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const updateData: Partial<Tables<"customers">> = {
      name: rest.name,
      email: rest.email || null,
      phone: rest.phone || null,
      company: rest.company || null,
      billing_address: rest.billingAddress || null,
      gst_exempt: rest.gstExempt ?? false,
      pst_exempt: rest.pstExempt ?? false,
      gst_rate: rest.gstRate ?? null,
      pst_rate: rest.pstRate ?? null,
      gst_number: rest.gstNumber || null,
      pst_number: rest.pstNumber || null,
      labor_rate: rest.laborRate ?? null,
      parts_markup_pct: rest.partsMarkupPct ?? null,
    };
    const { data: updated, error } = await context.supabase
      .from("customers")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !updated) throw error || new Error("Failed to update customer");
    return { customer: updated as Tables<"customers"> };
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export type CustomerStat = {
  customerId: string;
  units: number;
  openBalance: number;
  lastJob: string | null;
  totalInvoices: number;
  totalServiceOrders: number;
};

const OPEN_STATUSES = ["sent", "overdue", "unpaid", "partially_paid"];

export const listCustomerStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const [unitsRes, invRes, estRes] = await Promise.all([
      context.supabase.from("units").select("id, customer_id").eq("shop_id", shopId),
      context.supabase
        .from("invoices")
        .select("id, customer_id, total, status, issue_date")
        .eq("shop_id", shopId),
      context.supabase
        .from("estimates")
        .select("id, customer_id, issue_date")
        .eq("shop_id", shopId),
    ]);
    if (unitsRes.error) throw unitsRes.error;
    if (invRes.error) throw invRes.error;
    if (estRes.error) throw estRes.error;

    const map = new Map<string, CustomerStat>();
    const get = (id: string | null) => {
      if (!id) return null;
      let s = map.get(id);
      if (!s) {
        s = {
          customerId: id,
          units: 0,
          openBalance: 0,
          lastJob: null,
          totalInvoices: 0,
          totalServiceOrders: 0,
        };
        map.set(id, s);
      }
      return s;
    };
    for (const u of unitsRes.data ?? []) {
      const s = get(u.customer_id);
      if (s) s.units += 1;
    }
    for (const inv of invRes.data ?? []) {
      const s = get(inv.customer_id);
      if (!s) continue;
      s.totalInvoices += 1;
      if (OPEN_STATUSES.includes(String(inv.status))) s.openBalance += Number(inv.total ?? 0);
      if (inv.issue_date && (!s.lastJob || inv.issue_date > s.lastJob)) s.lastJob = inv.issue_date;
    }
    for (const e of estRes.data ?? []) {
      const s = get(e.customer_id);
      if (!s) continue;
      s.totalServiceOrders += 1;
      if (e.issue_date && (!s.lastJob || e.issue_date > s.lastJob)) s.lastJob = e.issue_date;
    }
    return { stats: Array.from(map.values()) };
  });
