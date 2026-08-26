import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

export interface Membership {
  role: string;
  shop: {
    id: string;
    name: string;
    slug: string;
  };
}

export const getUserMemberships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role, shop:shop_id(id, name, slug)")
      .eq("user_id", context.userId);

    if (error) throw error;
    return { memberships: (data ?? []) as Membership[] };
  });

export type AppRole = "owner" | "admin" | "mechanic" | "customer";

export const isStaffRole = (role: string) =>
  role === "owner" || role === "admin" || role === "mechanic";

export const linkCustomerByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userEmail = (context.claims.email as string | undefined) ?? null;
    if (!userEmail) return { linked: false };

    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id, shop_id")
      .is("user_id", null)
      .eq("email", userEmail)
      .maybeSingle();

    if (!customer) return { linked: false };

    const { error: updateError } = await supabaseAdmin
      .from("customers")
      .update({ user_id: context.userId })
      .eq("id", customer.id);

    if (updateError) return { linked: false };

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: context.userId,
      shop_id: customer.shop_id,
      role: "customer",
    });

    if (roleError) return { linked: false };

    return { linked: true };
  });

export type InvoiceWithItems = Tables<"invoices"> & {
  customer: Tables<"customers"> | null;
  unit: Tables<"units"> | null;
  items: Tables<"invoice_items">[];
};

export type EstimateWithItems = Tables<"estimates"> & {
  customer: Tables<"customers"> | null;
  unit: Tables<"units"> | null;
  items: Tables<"estimate_items">[];
};
