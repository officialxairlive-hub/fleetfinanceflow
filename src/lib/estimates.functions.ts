import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { estimateSchema } from "./schemas";
import { fetchSuppliesBase } from "./billing/supplies";
import {
  calculateTotals,
  generateEstimateNumber,
  generateInvoiceNumber,
  mapLineItemInput,
} from "./invoices.utils";

export interface EstimateWithItems extends Tables<"estimates"> {
  customer: Tables<"customers"> | null;
  unit: Tables<"units"> | null;
  items: Tables<"estimate_items">[];
}

export const listEstimates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((shopId: string) => shopId)
  .handler(async ({ data: shopId, context }) => {
    const { data, error } = await context.supabase
      .from("estimates")
      .select("*, customer:customer_id(name), unit:unit_id(nickname)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return {
      estimates: (data ?? []) as (Tables<"estimates"> & {
        customer: { name: string } | null;
        unit: { nickname: string | null } | null;
      })[],
    };
  });

export const listEstimatesByUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((unitId: string) => unitId)
  .handler(async ({ data: unitId, context }) => {
    const { data, error } = await context.supabase
      .from("estimates")
      .select("*")
      .eq("unit_id", unitId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { estimates: (data ?? []) as Tables<"estimates">[] };
  });

export const getEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { data, error } = await context.supabase
      .from("estimates")
      .select("*, customer:customer_id(*), unit:unit_id(*), items:estimate_items(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { estimate: data as EstimateWithItems };
  });

export const createEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => estimateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const items = data.items.map(mapLineItemInput);
    const suppliesBase = await fetchSuppliesBase(context.supabase, data.shopId);
    const totals = calculateTotals(items, data.gstRate, data.pstRate, data.suppliesPct ?? 0, {
      suppliesCap: data.suppliesCap ?? null,
      suppliesBase,
    });
    const lineTotals = totals.lineTotals;

    const { data: estimate, error } = await context.supabase
      .from("estimates")
      .insert({
        shop_id: data.shopId,
        customer_id: data.customerId,
        unit_id: data.unitId || null,
        estimate_number: data.estimateNumber || generateEstimateNumber(),
        status: data.status,
        issue_date: data.issueDate || null,
        due_date: data.dueDate || null,
        odometer: data.odometer ?? null,
        gst_rate: totals.gstRate,
        pst_rate: totals.pstRate,
        gst_amount: totals.gstAmount,
        pst_amount: totals.pstAmount,
        labor_total: totals.laborTotal,
        parts_total: totals.partsTotal,
        fees_total: totals.feesTotal,
        supplies_pct: data.suppliesPct ?? 0,
        supplies_cap: data.suppliesCap ?? null,
        supplies_amount: totals.suppliesAmount,
        subtotal: totals.subtotal,
        total: totals.total,
        notes: data.notes || null,
      })
      .select("*")
      .single();

    if (error || !estimate) throw error || new Error("Failed to create estimate");

    if (items.length > 0) {
      const itemsToInsert = items.map((item, i) => ({
        estimate_id: estimate.id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        markup_pct: item.markup_pct ?? 0,
        hours:
          item.item_type === "labor" || item.item_type === "service"
            ? (item.hours ?? item.quantity)
            : null,
        technician: item.technician ?? null,
        gst_taxable: item.gst_taxable ?? true,
        pst_taxable: item.pst_taxable ?? (item.item_type === "part" || item.item_type === "fee"),
        line_total: lineTotals[i] ?? 0,
        sort_order: i,
        part_id: item.part_id || null,
        service_id: item.service_id || null,
      }));
      const { error: itemsError } = await context.supabase
        .from("estimate_items")
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }

    return { estimate: estimate as Tables<"estimates"> };
  });

export const updateEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string } & Record<string, unknown>) => {
    const parsed = estimateSchema.partial().parse(data);
    return { id: data.id, ...parsed };
  })
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;

    const { data: existing, error: existingError } = await context.supabase
      .from("estimates")
      .select("*")
      .eq("id", id)
      .single();
    if (existingError || !existing) throw existingError || new Error("Estimate not found");

    const items = rest.items?.map(mapLineItemInput);
    let effectiveItems = items;
    if (!effectiveItems) {
      const { data: rows, error: rowsError } = await context.supabase
        .from("estimate_items")
        .select("*")
        .eq("estimate_id", id)
        .order("sort_order", { ascending: true });
      if (rowsError) throw rowsError;
      effectiveItems = (rows ?? []).map((row) => ({
        item_type: row.item_type,
        description: row.description,
        quantity: Number(row.quantity ?? 0),
        unit_price: Number(row.unit_price ?? 0),
        markup_pct: Number(row.markup_pct ?? 0),
        hours: row.hours == null ? null : Number(row.hours),
        technician: row.technician,
        gst_taxable: row.gst_taxable,
        pst_taxable: row.pst_taxable,
        part_id: row.part_id,
        service_id: row.service_id,
      }));
    }

    const suppliesPct = rest.suppliesPct ?? Number(existing.supplies_pct ?? 0);
    const suppliesCap =
      rest.suppliesCap === undefined
        ? existing.supplies_cap == null
          ? null
          : Number(existing.supplies_cap)
        : rest.suppliesCap;
    const totals = calculateTotals(
      effectiveItems,
      rest.gstRate ?? Number(existing.gst_rate ?? 0),
      rest.pstRate ?? Number(existing.pst_rate ?? 0),
      suppliesPct,
      { suppliesCap, suppliesBase: await fetchSuppliesBase(context.supabase, existing.shop_id) },
    );

    const updateData: TablesUpdate<"estimates"> = {
      gst_rate: totals.gstRate,
      pst_rate: totals.pstRate,
      gst_amount: totals.gstAmount,
      pst_amount: totals.pstAmount,
      labor_total: totals.laborTotal,
      parts_total: totals.partsTotal,
      fees_total: totals.feesTotal,
      supplies_pct: suppliesPct,
      supplies_cap: suppliesCap,
      supplies_amount: totals.suppliesAmount,
      subtotal: totals.subtotal,
      total: totals.total,
    };
    if (rest.customerId !== undefined) updateData.customer_id = rest.customerId;
    if (rest.unitId !== undefined) updateData.unit_id = rest.unitId || null;
    if (rest.estimateNumber !== undefined) updateData.estimate_number = rest.estimateNumber;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.issueDate !== undefined) updateData.issue_date = rest.issueDate || null;
    if (rest.dueDate !== undefined) updateData.due_date = rest.dueDate || null;
    if (rest.odometer !== undefined) updateData.odometer = rest.odometer ?? null;
    if (rest.notes !== undefined) updateData.notes = rest.notes || null;

    const { data: estimate, error } = await context.supabase
      .from("estimates")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !estimate) throw error || new Error("Failed to update estimate");

    if (items) {
      await context.supabase.from("estimate_items").delete().eq("estimate_id", id);
      const itemsToInsert = items.map((item, i) => ({
        estimate_id: id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        markup_pct: item.markup_pct ?? 0,
        hours:
          item.item_type === "labor" || item.item_type === "service"
            ? (item.hours ?? item.quantity)
            : null,
        technician: item.technician ?? null,
        gst_taxable: item.gst_taxable ?? true,
        pst_taxable: item.pst_taxable ?? (item.item_type === "part" || item.item_type === "fee"),
        line_total: totals.lineTotals[i] ?? 0,
        sort_order: i,
        part_id: item.part_id || null,
        service_id: item.service_id || null,
      }));
      const { error: itemsError } = await context.supabase
        .from("estimate_items")
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }

    return { estimate: estimate as Tables<"estimates"> };
  });

export const deleteEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { error } = await context.supabase.from("estimates").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const convertEstimateToInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((id: string) => id)
  .handler(async ({ data: id, context }) => {
    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .select("*, items:estimate_items(*)")
      .eq("id", id)
      .single();
    if (estimateError || !estimate) throw estimateError || new Error("Estimate not found");

    const estimateItems = [...(estimate.items as Tables<"estimate_items">[])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    const converted = calculateTotals(
      estimateItems.map((item) => ({
        item_type: item.item_type,
        description: item.description,
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
        markup_pct: Number(item.markup_pct ?? 0),
        hours: item.hours == null ? null : Number(item.hours),
        technician: item.technician,
        gst_taxable: item.gst_taxable,
        pst_taxable: item.pst_taxable,
        part_id: item.part_id,
        service_id: item.service_id,
      })),
      Number(estimate.gst_rate ?? 0),
      Number(estimate.pst_rate ?? 0),
      Number(estimate.supplies_pct ?? 0),
      {
        suppliesCap: estimate.supplies_cap == null ? null : Number(estimate.supplies_cap),
        suppliesBase: await fetchSuppliesBase(context.supabase, estimate.shop_id),
      },
    );
    const invoiceItems = estimateItems.map((item, i) => ({
      item_type: item.item_type,
      description: item.description,
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price ?? 0,
      markup_pct: item.markup_pct ?? 0,
      hours: item.hours,
      technician: item.technician,
      gst_taxable: item.gst_taxable,
      pst_taxable: item.pst_taxable,
      line_total: converted.lineTotals[i] ?? 0,
      sort_order: i,
      part_id: item.part_id,
      service_id: item.service_id,
    }));

    const { data: invoice, error: invoiceError } = await context.supabase
      .from("invoices")
      .insert({
        shop_id: estimate.shop_id,
        customer_id: estimate.customer_id,
        unit_id: estimate.unit_id,
        invoice_number: generateInvoiceNumber(),
        status: "draft",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: estimate.due_date,
        odometer: estimate.odometer,
        gst_rate: converted.gstRate,
        pst_rate: converted.pstRate,
        gst_amount: converted.gstAmount,
        pst_amount: converted.pstAmount,
        labor_total: converted.laborTotal,
        parts_total: converted.partsTotal,
        fees_total: converted.feesTotal,
        supplies_pct: estimate.supplies_pct ?? 0,
        supplies_cap: estimate.supplies_cap,
        supplies_amount: converted.suppliesAmount,
        subtotal: converted.subtotal,
        total: converted.total,
        notes: estimate.notes,
      })
      .select("*")
      .single();

    if (invoiceError || !invoice) throw invoiceError || new Error("Failed to create invoice");

    if (invoiceItems.length > 0) {
      const itemsToInsert = invoiceItems.map((item) => ({ ...item, invoice_id: invoice.id }));
      const { error: itemsError } = await context.supabase
        .from("invoice_items")
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }

    const { error: updateError } = await context.supabase
      .from("estimates")
      .update({ status: "converted", converted_to_invoice_id: invoice.id })
      .eq("id", id);
    if (updateError) throw updateError;

    return { invoice: invoice as Tables<"invoices"> };
  });
