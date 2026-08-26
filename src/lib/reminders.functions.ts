import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";
import { reminderSchema } from "./schemas";

export const listReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("reminders")
      .select("*, unit:unit_id(nickname, customer:customer_id(name))")
      .eq("shop_id", shopId)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return {
      reminders: (data ?? []) as (Tables<"reminders"> & {
        unit: { nickname: string | null; customer: { name: string } | null } | null;
      })[],
    };
  });

export const createReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reminderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("reminders")
      .insert({
        shop_id: data.shopId,
        unit_id: data.unitId,
        reminder_type: data.reminderType,
        due_date: data.dueDate || null,
        due_odometer: data.dueOdometer || null,
        notes: data.notes || null,
      })
      .select("*")
      .single();
    if (error || !inserted) throw error || new Error("Failed to create reminder");
    return { reminder: inserted as Tables<"reminders"> };
  });

export const updateReminderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    const update: Partial<Tables<"reminders">> = { status: data.status };
    if (data.status === "completed") {
      update.completed_at = new Date().toISOString();
    }
    const { error } = await context.supabase.from("reminders").update(update).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase.from("reminders").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });
