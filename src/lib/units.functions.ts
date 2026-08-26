import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { unitSchema } from "./schemas";

export const listUnits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("units")
      .select("*, customer:customer_id(name)")
      .eq("shop_id", shopId)
      .order("unit_number", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { units: (data ?? []) as (Tables<"units"> & { customer: { name: string } | null })[] };
  });

export const getUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { data, error } = await context.supabase
      .from("units")
      .select("*, customer:customer_id(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { unit: data as Tables<"units"> & { customer: Tables<"customers"> | null } };
  });

export const createUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => unitSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("units")
      .insert({
        shop_id: data.shopId,
        customer_id: data.customerId,
        unit_number: data.unitNumber || null,
        nickname: data.nickname || null,
        vin: data.vin || null,
        make: data.make || null,
        model: data.model || null,
        year: data.year || null,
        license_plate: data.licensePlate || null,
        unit_type: data.unitType || null,
        current_odometer: data.currentOdometer || null,
      })
      .select("*")
      .single();
    if (error || !inserted) throw error || new Error("Failed to create unit");
    return { unit: inserted as Tables<"units"> };
  });

export const updateUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string } & Record<string, unknown>) => {
    const parsed = unitSchema.partial().parse(data);
    return { id: data.id, ...parsed };
  })
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const updateData: Partial<Tables<"units">> = {
      customer_id: rest.customerId,
      unit_number: rest.unitNumber || null,
      nickname: rest.nickname || null,
      vin: rest.vin || null,
      make: rest.make || null,
      model: rest.model || null,
      year: rest.year || null,
      license_plate: rest.licensePlate || null,
      unit_type: rest.unitType || null,
      current_odometer: rest.currentOdometer || null,
    };
    const { data: updated, error } = await context.supabase
      .from("units")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !updated) throw error || new Error("Failed to update unit");
    return { unit: updated as Tables<"units"> };
  });

export const deleteUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase.from("units").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });
