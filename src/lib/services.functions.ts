import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { serviceSchema } from "./schemas";

export const listServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("services")
      .select("*")
      .eq("shop_id", shopId)
      .order("name", { ascending: true });
    if (error) throw error;
    return { services: (data ?? []) as Tables<"services">[] };
  });

export const getService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { data, error } = await context.supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { service: data as Tables<"services"> };
  });

export const createService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => serviceSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("services")
      .insert({
        shop_id: data.shopId,
        name: data.name,
        description: data.description || null,
        labor_rate: data.laborRate,
        estimated_hours: data.estimatedHours,
        active: data.active,
      })
      .select("*")
      .single();
    if (error || !inserted) throw error || new Error("Failed to create service");
    return { service: inserted as Tables<"services"> };
  });

export const updateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string } & Record<string, unknown>) => {
    const parsed = serviceSchema.partial().parse(data);
    return { id: data.id, ...parsed };
  })
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const updateData: Partial<Tables<"services">> = {
      name: rest.name,
      description: rest.description || null,
      labor_rate: rest.laborRate,
      estimated_hours: rest.estimatedHours,
      active: rest.active,
    };
    const { data: updated, error } = await context.supabase
      .from("services")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !updated) throw error || new Error("Failed to update service");
    return { service: updated as Tables<"services"> };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase.from("services").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });
