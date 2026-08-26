import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { complaintSchema } from "./schemas";

export const listComplaints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("complaints")
      .select("*, unit:unit_id(nickname), customer:customer_id(name)")
      .eq("shop_id", shopId)
      .order("reported_at", { ascending: false });
    if (error) throw error;
    return {
      complaints: (data ?? []) as (Tables<"complaints"> & {
        unit: { nickname: string | null } | null;
        customer: { name: string } | null;
      })[],
    };
  });

export const createComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => complaintSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("complaints")
      .insert({
        shop_id: data.shopId,
        unit_id: data.unitId,
        customer_id: data.customerId,
        description: data.description,
      })
      .select("*")
      .single();
    if (error || !inserted) throw error || new Error("Failed to create complaint");
    return { complaint: inserted as Tables<"complaints"> };
  });

export const updateComplaintStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    const update: Partial<Tables<"complaints">> = { status: data.status };
    if (data.status === "resolved") {
      update.resolved_at = new Date().toISOString();
    }
    const { error } = await context.supabase.from("complaints").update(update).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
