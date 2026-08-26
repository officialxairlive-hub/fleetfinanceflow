import { z } from "zod";

export const customerSchema = z.object({
  shopId: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  billingAddress: z.string().max(500).optional().or(z.literal("")),
  gstExempt: z.boolean().optional().default(false),
  pstExempt: z.boolean().optional().default(false),
  gstRate: z.number().min(0).max(1).nullable().optional(),
  pstRate: z.number().min(0).max(1).nullable().optional(),
  gstNumber: z.string().max(60).optional().or(z.literal("")),
  pstNumber: z.string().max(60).optional().or(z.literal("")),
  laborRate: z.number().min(0).nullable().optional(),
  partsMarkupPct: z.number().min(0).max(10).nullable().optional(),
});

export const unitSchema = z.object({
  shopId: z.string().uuid(),
  customerId: z.string().uuid(),
  unitNumber: z.string().max(60).optional().or(z.literal("")),
  nickname: z.string().max(120).optional().or(z.literal("")),
  vin: z.string().max(40).optional().or(z.literal("")),
  make: z.string().max(80).optional().or(z.literal("")),
  model: z.string().max(80).optional().or(z.literal("")),
  year: z.number().int().min(1900).max(9999).optional().or(z.literal(0)),
  licensePlate: z.string().max(40).optional().or(z.literal("")),
  unitType: z.string().max(40).optional().or(z.literal("")),
  currentOdometer: z.number().min(0).optional().or(z.literal(0)),
});

export const serviceSchema = z.object({
  shopId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  laborRate: z.number().min(0).default(0),
  estimatedHours: z.number().min(0).default(0),
  active: z.boolean().default(true),
});

export const partSchema = z.object({
  shopId: z.string().uuid(),
  name: z.string().min(1).max(200),
  sku: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  cost: z.number().min(0).default(0),
  retailPrice: z.number().min(0).default(0),
  quantityOnHand: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
  supplier: z.string().max(200).optional().or(z.literal("")),
  markupPct: z.number().min(0).default(0),
  active: z.boolean().default(true),
});

export const invoiceItemSchema = z.object({
  itemType: z.enum(["labor", "part", "service", "fee"]),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  markupPct: z.number().min(0).default(0),
  hours: z.number().min(0).nullable().optional(),
  technician: z.string().max(120).nullable().optional(),
  gstTaxable: z.boolean().nullable().optional(),
  pstTaxable: z.boolean().nullable().optional(),
  partId: z.string().uuid().optional().or(z.literal("")),
  serviceId: z.string().uuid().optional().or(z.literal("")),
});

export const invoiceSchema = z.object({
  shopId: z.string().uuid(),
  customerId: z.string().uuid(),
  unitId: z.string().uuid().optional().or(z.literal("")),
  invoiceNumber: z.string().min(1).max(50),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  workStatus: z
    .enum(["received", "diagnosing", "awaiting_parts", "in_progress", "ready", "delivered"])
    .default("received"),
  issueDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  odometer: z.number().min(0).nullable().optional(),
  gstRate: z.number().min(0).max(1).default(0),
  pstRate: z.number().min(0).max(1).default(0),
  suppliesPct: z.number().min(0).max(1).default(0),
  suppliesCap: z.number().min(0).nullable().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).default([]),
});

export const estimateItemSchema = invoiceItemSchema;

export const estimateSchema = z.object({
  shopId: z.string().uuid(),
  customerId: z.string().uuid(),
  unitId: z.string().uuid().optional().or(z.literal("")),
  estimateNumber: z.string().min(1).max(50),
  status: z.enum(["draft", "sent", "approved", "declined", "converted"]).default("draft"),
  issueDate: z.string().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  odometer: z.number().min(0).nullable().optional(),
  gstRate: z.number().min(0).max(1).default(0),
  pstRate: z.number().min(0).max(1).default(0),
  suppliesPct: z.number().min(0).max(1).default(0),
  suppliesCap: z.number().min(0).nullable().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(estimateItemSchema).default([]),
});

export const reminderSchema = z.object({
  shopId: z.string().uuid(),
  unitId: z.string().uuid(),
  reminderType: z.enum(["pm", "mvi"]),
  dueDate: z.string().optional().or(z.literal("")),
  dueOdometer: z.number().min(0).optional().or(z.literal(0)),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const complaintSchema = z.object({
  shopId: z.string().uuid(),
  unitId: z.string().uuid(),
  customerId: z.string().uuid(),
  description: z.string().min(1).max(2000),
});

export const paymentIntentSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const shopSettingsSchema = z.object({
  shopId: z.string().uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  defaultGstRate: z.number().min(0).max(1).default(0),
  defaultPstRate: z.number().min(0).max(1).default(0),
  defaultPartMarkupPct: z.number().min(0).max(1000).default(0),
  defaultLaborRate: z.number().min(0).default(0),
  shopSuppliesPct: z.number().min(0).max(1).default(0),
  suppliesBase: z.enum(["labor", "labor_parts", "subtotal"]).default("labor"),
  logoPath: z.string().max(500).nullable().optional(),
  logoSize: z.enum(["small", "medium", "large"]).default("medium"),
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["cash", "cheque", "etransfer", "card", "other"]).default("other"),
  reference: z.string().max(120).optional().or(z.literal("")),
  paidAt: z.string().optional().or(z.literal("")),
});

export const repairUpdateSchema = z.object({
  invoiceId: z.string().uuid(),
  workStatus: z.enum([
    "received",
    "diagnosing",
    "awaiting_parts",
    "in_progress",
    "ready",
    "delivered",
  ]),
  note: z.string().max(1000).optional().or(z.literal("")),
});

export const paymentReminderSchema = z.object({
  invoiceId: z.string().uuid(),
  message: z.string().max(1000).optional().or(z.literal("")),
});

export const invoiceEmailSchema = z.object({
  invoiceId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  invoiceUrl: z.string().max(500).optional().or(z.literal("")),
});
