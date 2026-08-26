import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createShopSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  defaultGstRate: z.number().min(0).max(1).default(0.05),
  defaultPstRate: z.number().min(0).max(1).default(0.07),
});

export const createShop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => createShopSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: shop, error: shopError } = await supabaseAdmin
      .from("shops")
      .insert({
        name: data.name,
        slug: data.slug,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        default_gst_rate: data.defaultGstRate,
        default_pst_rate: data.defaultPstRate,
      })
      .select("id, name, slug")
      .single();

    if (shopError || !shop) {
      throw new Error(shopError?.message ?? "Failed to create shop");
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: context.userId,
      shop_id: shop.id,
      role: "owner",
    });

    if (roleError) {
      throw new Error(roleError.message);
    }

    return { shop };
  });

export const checkSlugAvailable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((slug: string) => z.string().min(1).max(120).parse(slug))
  .handler(async ({ data: slug }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("shops")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return { available: !data };
  });
