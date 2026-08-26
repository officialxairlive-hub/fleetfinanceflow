import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { shopSettingsSchema } from "./schemas";
import { isStaffRole } from "./membership.functions";

export type LogoSize = "small" | "medium" | "large";

export const LOGO_SIZE_PX: Record<LogoSize, number> = {
  small: 80,
  medium: 120,
  large: 180,
};

export type SuppliesBase = "labor" | "labor_parts" | "subtotal";

export interface ShopExtraSettings {
  defaultPartMarkupPct?: number;
  defaultLaborRate?: number;
  shopSuppliesPct?: number;
  suppliesBase?: SuppliesBase;
  logoPath?: string | null;
  logoSize?: LogoSize;
}

export function readShopSettings(settings: unknown): ShopExtraSettings {
  if (!settings || typeof settings !== "object") return {};
  const s = settings as Record<string, unknown>;
  return {
    defaultPartMarkupPct: typeof s.defaultPartMarkupPct === "number" ? s.defaultPartMarkupPct : 0,
    defaultLaborRate: typeof s.defaultLaborRate === "number" ? s.defaultLaborRate : 0,
    shopSuppliesPct: typeof s.shopSuppliesPct === "number" ? s.shopSuppliesPct : 0,
    suppliesBase:
      s.suppliesBase === "labor_parts" || s.suppliesBase === "subtotal" ? s.suppliesBase : "labor",
    logoPath: typeof s.logoPath === "string" ? s.logoPath : null,
    logoSize: s.logoSize === "small" || s.logoSize === "large" ? s.logoSize : "medium",
  };
}

export const getShop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single();
    if (error) throw error;
    const extra = readShopSettings(data.settings);
    let logoUrl: string | null = null;
    if (extra.logoPath) {
      const { data: signed } = await context.supabase.storage
        .from("shop-logos")
        .createSignedUrl(extra.logoPath, 60 * 60 * 24 * 7);
      logoUrl = signed?.signedUrl ?? null;
    }
    return { shop: data as Tables<"shops">, logoUrl };
  });

export const updateShop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => shopSettingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Verify staff role
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("shop_id", data.shopId);
    if (roleError) throw roleError;
    if (!roles?.some((r) => isStaffRole(r.role))) {
      throw new Error("Forbidden");
    }

    const { data: updated, error } = await context.supabase
      .from("shops")
      .update({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        default_gst_rate: data.defaultGstRate,
        default_pst_rate: data.defaultPstRate,
        default_supplies_pct: data.shopSuppliesPct,
        settings: {
          defaultPartMarkupPct: data.defaultPartMarkupPct,
          defaultLaborRate: data.defaultLaborRate,
          shopSuppliesPct: data.shopSuppliesPct,
          suppliesBase: data.suppliesBase ?? "labor",
          logoPath: data.logoPath ?? null,
          logoSize: data.logoSize ?? "medium",
        },
      })
      .eq("id", data.shopId)
      .select("*")
      .single();
    if (error || !updated) throw error || new Error("Failed to update shop");
    return { shop: updated as Tables<"shops"> };
  });

export const getConnectedAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("connected_accounts")
      .select("*")
      .eq("shop_id", shopId)
      .maybeSingle();
    if (error) throw error;
    return { account: data as Tables<"connected_accounts"> | null };
  });
