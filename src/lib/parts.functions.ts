import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { partSchema } from "./schemas";

export const listParts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("parts")
      .select("*")
      .eq("shop_id", shopId)
      .order("name", { ascending: true });
    if (error) throw error;
    return { parts: (data ?? []) as Tables<"parts">[] };
  });

export const getPart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { data, error } = await context.supabase.from("parts").select("*").eq("id", id).single();
    if (error) throw error;
    return { part: data as Tables<"parts"> };
  });

export const createPart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => partSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("parts")
      .insert({
        shop_id: data.shopId,
        name: data.name,
        sku: data.sku || null,
        description: data.description || null,
        cost: data.cost,
        retail_price: data.retailPrice,
        quantity_on_hand: data.quantityOnHand,
        reorder_level: data.reorderLevel,
        supplier: data.supplier || null,
        markup_pct: data.markupPct,
        active: data.active,
      })
      .select("*")
      .single();
    if (error || !inserted) throw error || new Error("Failed to create part");
    return { part: inserted as Tables<"parts"> };
  });

export const updatePart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string } & Record<string, unknown>) => {
    const parsed = partSchema.partial().parse(data);
    return { id: data.id, ...parsed };
  })
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const updateData: Partial<Tables<"parts">> = {
      name: rest.name,
      sku: rest.sku || null,
      description: rest.description || null,
      cost: rest.cost,
      retail_price: rest.retailPrice,
      quantity_on_hand: rest.quantityOnHand,
      reorder_level: rest.reorderLevel,
      supplier: rest.supplier || null,
      markup_pct: rest.markupPct,
      active: rest.active,
    };
    const { data: updated, error } = await context.supabase
      .from("parts")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !updated) throw error || new Error("Failed to update part");
    return { part: updated as Tables<"parts"> };
  });

export const deletePart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase.from("parts").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });
