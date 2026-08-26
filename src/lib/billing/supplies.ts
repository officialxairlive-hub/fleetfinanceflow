import type { SuppliesBase } from "./calc";

/** Reads the shop's configured shop-supplies base from its settings jsonb. */
export function parseSuppliesBase(settings: unknown): SuppliesBase {
  if (!settings || typeof settings !== "object") return "labor";
  const v = (settings as Record<string, unknown>).suppliesBase;
  return v === "labor_parts" || v === "subtotal" ? v : "labor";
}

export async function fetchSuppliesBase(
  supabase: { from: (t: string) => any },
  shopId: string | null | undefined,
): Promise<SuppliesBase> {
  if (!shopId) return "labor";
  const { data } = await supabase.from("shops").select("settings").eq("id", shopId).maybeSingle();
  return parseSuppliesBase(data?.settings);
}
