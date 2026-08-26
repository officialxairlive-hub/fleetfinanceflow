import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { createCustomer } from "@/lib/customers.functions";
import { createUnit } from "@/lib/units.functions";
import { toast } from "sonner";
import {
  formatCurrency,
  calculateTotals,
  mapLineItemInput,
  encodeJobsToNotes,
} from "@/lib/invoices.utils";
import { Switch } from "@/components/ui/switch";
import type { SuppliesBase } from "@/lib/billing/calc";
import { Trash2, Plus, Wrench, ChevronDown, ChevronRight, UserPlus, Truck } from "lucide-react";

export interface BuilderItem {
  itemType: "labor" | "part" | "service" | "fee";
  description: string;
  quantity: number;
  unitPrice: number;
  markupPct: number;
  hours?: number | null;
  technician?: string | null;
  partId?: string;
  serviceId?: string;
}

export interface BuilderJob {
  id: string;
  name: string;
  complaint: string;
  correction: string;
  items: BuilderItem[];
  collapsed?: boolean;
}

export interface BuilderData {
  customerId: string;
  unitId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  odometer: number | null;
  gstRate: number;
  pstRate: number;
  suppliesPct: number;
  notes: string;
  items: BuilderItem[];
}

interface Props {
  customers: {
    id: string;
    name: string;
    gst_exempt?: boolean | null;
    pst_exempt?: boolean | null;
    gst_rate?: number | string | null;
    pst_rate?: number | string | null;
    labor_rate?: number | string | null;
    parts_markup_pct?: number | string | null;
  }[];
  units: {
    id: string;
    unit_number?: string | null;
    nickname: string | null;
    customer_id: string;
    make: string | null;
    model: string | null;
    vin?: string | null;
    license_plate: string | null;
    current_odometer?: number | null;
  }[];
  services: { id: string; name: string; labor_rate: number | null }[];
  parts: { id: string; name: string; retail_price: number | null; markup_pct: number | null }[];
  defaultGstRate: number;
  defaultPstRate: number;
  defaultPartMarkupPct?: number;
  defaultLaborRate?: number;
  shopSuppliesPct?: number;
  suppliesBase?: SuppliesBase;
  shopId: string;
  defaultNumber: string;
  numberLabel: string;
  submitLabel: string;
  onSubmit: (data: BuilderData) => Promise<void>;
}

const makeJob = (name = "Job 1"): BuilderJob => ({
  id: crypto.randomUUID(),
  name,
  complaint: "",
  correction: "",
  items: [],
  collapsed: false,
});

export function InvoiceBuilder({
  customers,
  units,
  services,
  parts,
  defaultGstRate,
  defaultPstRate,
  defaultPartMarkupPct = 0,
  defaultLaborRate = 0,
  shopSuppliesPct = 0,
  suppliesBase = "labor",
  shopId,
  defaultNumber,
  numberLabel,
  submitLabel,
  onSubmit,
}: Props) {
  const [customerId, setCustomerId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(defaultNumber);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [odometer, setOdometer] = useState<string>("");
  const [gstRate, setGstRate] = useState(defaultGstRate);
  const [pstRate, setPstRate] = useState(defaultPstRate);
  const [suppliesPct, setSuppliesPct] = useState(shopSuppliesPct);
  const [suppliesEnabled, setSuppliesEnabled] = useState(shopSuppliesPct > 0);
  const effectiveSuppliesPct = suppliesEnabled ? suppliesPct : 0;
  const [notes, setNotes] = useState("");
  const [jobs, setJobs] = useState<BuilderJob[]>(() => [makeJob("Job 1")]);
  const [submitting, setSubmitting] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const qc = useQueryClient();
  const createCustomerFn = useServerFn(createCustomer);
  const createUnitFn = useServerFn(createUnit);

  const filteredUnits = useMemo(
    () => units.filter((u) => !customerId || u.customer_id === customerId),
    [units, customerId],
  );

  // Effective (customer-override aware) labor rate and parts markup.
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  );
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const selectedUnit = useMemo(() => units.find((u) => u.id === unitId), [units, unitId]);
  const effectiveLaborRate = num(selectedCustomer?.labor_rate) ?? defaultLaborRate;
  const effectivePartMarkup = num(selectedCustomer?.parts_markup_pct) ?? defaultPartMarkupPct;

  // When customer changes, apply their tax overrides (or shop defaults).
  const applyCustomerDefaults = (c: Props["customers"][number] | undefined) => {
    const gExempt = !!c?.gst_exempt;
    const pExempt = !!c?.pst_exempt;
    const gOverride = num(c?.gst_rate);
    const pOverride = num(c?.pst_rate);
    setGstRate(gExempt ? 0 : (gOverride ?? defaultGstRate));
    setPstRate(pExempt ? 0 : (pOverride ?? defaultPstRate));
  };

  const allItems = useMemo(() => jobs.flatMap((j) => j.items), [jobs]);
  // One authoritative calculation: the shared billing engine does line
  // rounding, category buckets, shop supplies and per-line tax bases.
  const totals = useMemo(
    () =>
      calculateTotals(allItems.map(mapLineItemInput), gstRate, pstRate, effectiveSuppliesPct, {
        suppliesBase,
      }),
    [allItems, gstRate, pstRate, effectiveSuppliesPct, suppliesBase],
  );
  const itemsSubtotal = totals.laborTotal + totals.partsTotal + totals.feesTotal;
  const suppliesAmount = totals.suppliesAmount;
  const gstAmount = totals.gstAmount;
  const pstAmount = totals.pstAmount;
  const grandTotal = totals.total;

  // Per-job subtotals for the sidebar breakdown.
  const jobSubtotals = useMemo(
    () => jobs.map((j) => calculateTotals(j.items.map(mapLineItemInput), 0, 0).subtotal),
    [jobs],
  );

  const updateJob = (jid: string, patch: Partial<BuilderJob>) =>
    setJobs((js) => js.map((j) => (j.id === jid ? { ...j, ...patch } : j)));

  const addJob = () => setJobs((js) => [...js, makeJob(`Job ${js.length + 1}`)]);

  const removeJob = (jid: string) =>
    setJobs((js) => (js.length === 1 ? js : js.filter((j) => j.id !== jid)));

  const addItem = (jid: string, type: BuilderItem["itemType"]) => {
    const defaults: BuilderItem = {
      itemType: type,
      description: type === "fee" ? "Shop fee" : "",
      quantity: 1,
      unitPrice: type === "labor" ? effectiveLaborRate : 0,
      markupPct: type === "part" ? effectivePartMarkup : 0,
      hours: type === "labor" ? 1 : null,
      technician: null,
    };
    setJobs((js) => js.map((j) => (j.id === jid ? { ...j, items: [...j.items, defaults] } : j)));
  };

  const updateItem = (jid: string, i: number, patch: Partial<BuilderItem>) =>
    setJobs((js) =>
      js.map((j) =>
        j.id === jid
          ? { ...j, items: j.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }
          : j,
      ),
    );

  const removeItem = (jid: string, i: number) =>
    setJobs((js) =>
      js.map((j) => (j.id === jid ? { ...j, items: j.items.filter((_, idx) => idx !== i) } : j)),
    );

  const selectService = (jid: string, i: number, serviceId: string) => {
    const s = services.find((x) => x.id === serviceId);
    if (s) updateItem(jid, i, { serviceId, description: s.name, unitPrice: s.labor_rate ?? 0 });
  };
  const selectPart = (jid: string, i: number, partId: string) => {
    const p = parts.find((x) => x.id === partId);
    if (p)
      updateItem(jid, i, {
        partId,
        description: p.name,
        unitPrice: p.retail_price ?? 0,
        markupPct: p.markup_pct ?? 0,
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Flatten jobs into line items, prefixing description with the job name.
      // Append job descriptions to notes so the extra context is preserved.
      const flatItems: BuilderItem[] = jobs.flatMap((j) => {
        const prefix = j.name.trim() ? `[${j.name.trim()}] ` : "";
        return j.items.map((it) => ({
          ...it,
          description: `${prefix}${it.description}`.trim(),
        }));
      });
      const combinedNotes = encodeJobsToNotes(
        notes,
        jobs.map((j) => ({ name: j.name, complaint: j.complaint, correction: j.correction })),
      );
      await onSubmit({
        customerId,
        unitId,
        invoiceNumber,
        issueDate,
        dueDate,
        odometer: odometer === "" ? null : Number(odometer),
        gstRate,
        pstRate,
        suppliesPct: effectiveSuppliesPct,
        notes: combinedNotes,
        items: flatItems,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!customerId && allItems.length > 0;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Main column: header + jobs */}
      <div className="space-y-6 min-w-0 lg:order-2">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">
              Ticket details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer</Label>
                <div className="flex gap-2">
                  <Select
                    value={customerId}
                    onValueChange={(v) => {
                      setCustomerId(v);
                      setUnitId("");
                      applyCustomerDefaults(customers.find((c) => c.id === v));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setCustomerDialogOpen(true)}
                    title="Add new customer"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedCustomer && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCustomer.gst_exempt
                      ? "GST exempt"
                      : `GST ${(gstRate * 100).toFixed(2)}%`}
                    {" · "}
                    {selectedCustomer.pst_exempt
                      ? "PST exempt"
                      : `PST ${(pstRate * 100).toFixed(2)}%`}
                    {" · Labor "}${effectiveLaborRate.toFixed(2)}/hr
                    {" · Parts markup "}
                    {(effectivePartMarkup * 100).toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <div className="flex gap-2">
                  <Select value={unitId} onValueChange={setUnitId} disabled={!customerId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {[
                            u.unit_number ? `#${u.unit_number}` : null,
                            u.nickname ||
                              `${u.make ?? ""} ${u.model ?? ""}`.trim() ||
                              u.license_plate ||
                              "Unit",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setUnitDialogOpen(true)}
                    disabled={!customerId}
                    title="Add new unit"
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                </div>
                {selectedUnit && (
                  <p className="text-xs text-muted-foreground">
                    {selectedUnit.vin ? `VIN ${selectedUnit.vin}` : "No VIN on file"}
                    {selectedUnit.license_plate ? ` · Plate ${selectedUnit.license_plate}` : ""}
                    {selectedUnit.current_odometer
                      ? ` · Last odometer ${selectedUnit.current_odometer.toLocaleString()}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Odometer / mileage at service</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder={
                    selectedUnit?.current_odometer
                      ? String(selectedUnit.current_odometer)
                      : "e.g. 412500"
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{numberLabel}</Label>
                <Input
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Issue date</Label>
                  <Input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {jobs.map((job, jIdx) => (
          <Card key={job.id} className="border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => updateJob(job.id, { collapsed: !job.collapsed })}
              >
                {job.collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Wrench className="h-4 w-4 text-primary shrink-0" />
              <Input
                value={job.name}
                onChange={(e) => updateJob(job.id, { name: e.target.value })}
                placeholder={`Job ${jIdx + 1} name (e.g. Front brake replacement)`}
                className="h-8 flex-1 bg-background font-medium"
              />
              <div className="text-sm font-medium text-muted-foreground tabular-nums shrink-0">
                {formatCurrency(jobSubtotals[jIdx] ?? 0)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => removeJob(job.id)}
                disabled={jobs.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {!job.collapsed && (
              <CardContent className="p-0">
                <div className="p-4 border-b border-border">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Customer complaint / concern
                    </Label>
                    <Textarea
                      value={job.complaint}
                      onChange={(e) => updateJob(job.id, { complaint: e.target.value })}
                      placeholder="What is the customer reporting? (e.g. Front brakes squealing when stopping)"
                      rows={2}
                      className="mt-1 resize-none"
                    />
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <div className="min-w-[820px]">
                    <div
                      className="grid items-center gap-2 border-b border-border bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      style={{
                        gridTemplateColumns: "100px minmax(0,1fr) 72px 104px 88px 104px 40px",
                      }}
                    >
                      <div>Type</div>
                      <div>Description</div>
                      <div className="text-right">Qty</div>
                      <div className="text-right">Unit price</div>
                      <div className="text-right">Markup %</div>
                      <div className="text-right">Line total</div>
                      <div />
                    </div>
                    {job.items.length === 0 && (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        No labor, parts, or services on this job yet.
                      </div>
                    )}
                    {job.items.map((item, i) => {
                      const globalIdx =
                        jobs.slice(0, jIdx).reduce((n, j) => n + j.items.length, 0) + i;
                      return (
                        <div
                          key={i}
                          className="grid items-start gap-2 border-b border-border px-3 py-2"
                          style={{
                            gridTemplateColumns: "100px minmax(0,1fr) 72px 104px 88px 104px 40px",
                          }}
                        >
                          <div>
                            <Select
                              value={item.itemType}
                              onValueChange={(v) =>
                                updateItem(job.id, i, { itemType: v as BuilderItem["itemType"] })
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="labor">Labor</SelectItem>
                                <SelectItem value="part">Part</SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="min-w-0 space-y-2">
                            {item.itemType === "part" && (
                              <Select
                                value={item.partId ?? ""}
                                onValueChange={(v) => selectPart(job.id, i, v)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pick a part…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {parts.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {item.itemType === "service" && (
                              <Select
                                value={item.serviceId ?? ""}
                                onValueChange={(v) => selectService(job.id, i, v)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pick a service…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <Input
                              value={item.description}
                              placeholder="Description"
                              className="w-full"
                              onChange={(e) =>
                                updateItem(job.id, i, { description: e.target.value })
                              }
                              required
                            />
                            {(item.itemType === "labor" || item.itemType === "service") && (
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  value={item.hours ?? ""}
                                  placeholder="Hours"
                                  onChange={(e) => {
                                    const hours =
                                      e.target.value === "" ? null : Number(e.target.value);
                                    updateItem(job.id, i, {
                                      hours,
                                      quantity: hours ?? item.quantity,
                                    });
                                  }}
                                />
                                <Input
                                  value={item.technician ?? ""}
                                  placeholder="Technician"
                                  onChange={(e) =>
                                    updateItem(job.id, i, { technician: e.target.value })
                                  }
                                />
                              </div>
                            )}
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            className="text-right"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(job.id, i, { quantity: Number(e.target.value) || 0 })
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            className="text-right"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(job.id, i, { unitPrice: Number(e.target.value) || 0 })
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            className="text-right"
                            value={item.markupPct}
                            onChange={(e) =>
                              updateItem(job.id, i, { markupPct: Number(e.target.value) || 0 })
                            }
                          />
                          <div className="pt-2 text-right text-sm font-medium tabular-nums">
                            {formatCurrency(totals.lineTotals[globalIdx] ?? 0)}
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(job.id, i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border p-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(job.id, "labor")}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Labor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(job.id, "part")}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Part
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(job.id, "service")}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Service
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addJob} className="w-full border-dashed">
          <Plus className="mr-2 h-4 w-4" />
          Add another job
        </Button>

        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-2">
            <Label>Invoice notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Anything else the customer should see on the invoice…"
            />
          </CardContent>
        </Card>
      </div>

      {/* Sticky summary sidebar (left) */}
      <div className="lg:sticky lg:top-4 h-fit space-y-4 lg:order-1">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.map((j, i) => (
              <Row
                key={j.id}
                label={j.name || `Job ${i + 1}`}
                value={formatCurrency(jobSubtotals[i] ?? 0)}
              />
            ))}
            <div className="border-t border-border pt-2 space-y-1">
              <Row label="Labor" value={formatCurrency(totals.laborTotal)} />
              <Row label="Parts" value={formatCurrency(totals.partsTotal)} />
              {totals.feesTotal > 0 && (
                <Row label="Shop fees" value={formatCurrency(totals.feesTotal)} />
              )}
              <Row label="Subtotal" value={formatCurrency(itemsSubtotal)} />
              {effectiveSuppliesPct > 0 && suppliesAmount > 0 && (
                <Row
                  label={`Shop supplies (${(effectiveSuppliesPct * 100).toFixed(2)}% of ${suppliesBaseLabel(suppliesBase)})`}
                  value={formatCurrency(suppliesAmount)}
                />
              )}
              <Row
                label={`GST (${(gstRate * 100).toFixed(2)}%)`}
                value={formatCurrency(gstAmount)}
              />
              <Row
                label={`PST (${(pstRate * 100).toFixed(2)}%)`}
                value={formatCurrency(pstAmount)}
              />
            </div>
            <div className="border-t border-border pt-2">
              <Row label="Total" value={formatCurrency(grandTotal)} bold />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rates</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">GST %</Label>
              <Input
                type="number"
                step="0.01"
                value={(gstRate * 100).toFixed(2)}
                onChange={(e) => setGstRate((Number(e.target.value) || 0) / 100)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">PST %</Label>
              <Input
                type="number"
                step="0.01"
                value={(pstRate * 100).toFixed(2)}
                onChange={(e) => setPstRate((Number(e.target.value) || 0) / 100)}
              />
            </div>
            <div className="col-span-2 space-y-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Shop supplies</Label>
                <Switch checked={suppliesEnabled} onCheckedChange={setSuppliesEnabled} />
              </div>
              {suppliesEnabled && (
                <>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(suppliesPct * 100).toFixed(2)}
                    onChange={(e) => setSuppliesPct(Math.max(Number(e.target.value) || 0, 0) / 100)}
                  />
                  <div className="flex flex-wrap gap-1">
                    {[0.02, 0.03, 0.05].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant={Math.abs(suppliesPct - preset) < 1e-9 ? "default" : "outline"}
                        className="h-7 px-2 text-xs"
                        onClick={() => setSuppliesPct(preset)}
                      >
                        {(preset * 100).toFixed(0)}%
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Charged on {suppliesBaseLabel(suppliesBase)}. Shop default{" "}
                    {(shopSuppliesPct * 100).toFixed(2)}%.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={submitting || !canSubmit} className="w-full" size="lg">
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>

      <NewCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onCreate={async (values) => {
          const res = await createCustomerFn({ data: { shopId, ...values } });
          await qc.invalidateQueries({ queryKey: ["customers", shopId] });
          setCustomerId(res.customer.id);
          setUnitId("");
          toast.success("Customer added");
        }}
      />
      <NewUnitDialog
        open={unitDialogOpen}
        onOpenChange={setUnitDialogOpen}
        onCreate={async (values) => {
          if (!customerId) return;
          const res = await createUnitFn({ data: { shopId, customerId, ...values } });
          await qc.invalidateQueries({ queryKey: ["units", shopId] });
          setUnitId(res.unit.id);
          toast.success("Unit added");
        }}
      />
    </form>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-2 ${bold ? "text-lg font-semibold text-foreground" : "text-sm text-muted-foreground"}`}
    >
      <span className="truncate">{label}</span>
      <span className="tabular-nums shrink-0">{value}</span>
    </div>
  );
}

interface NewCustomerValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  billingAddress: string;
}

function NewCustomerDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (values: NewCustomerValues) => Promise<void>;
}) {
  const [values, setValues] = useState<NewCustomerValues>({
    name: "",
    email: "",
    phone: "",
    company: "",
    billingAddress: "",
  });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!values.name.trim()) return;
    setSaving(true);
    try {
      await onCreate(values);
      setValues({ name: "", email: "", phone: "", company: "", billingAddress: "" });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add customer");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={values.phone}
                onChange={(e) => setValues({ ...values, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Company</Label>
            <Input
              value={values.company}
              onChange={(e) => setValues({ ...values, company: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Billing address</Label>
            <Textarea
              rows={2}
              value={values.billingAddress}
              onChange={(e) => setValues({ ...values, billingAddress: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={saving || !values.name.trim()}>
            {saving ? "Adding..." : "Add customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NewUnitValues {
  unitNumber: string;
  currentOdometer: number;
  nickname: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  unitType: string;
}

function NewUnitDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (values: NewUnitValues) => Promise<void>;
}) {
  const [values, setValues] = useState<NewUnitValues>({
    unitNumber: "",
    currentOdometer: 0,
    nickname: "",
    make: "",
    model: "",
    year: 0,
    vin: "",
    licensePlate: "",
    unitType: "",
  });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      await onCreate(values);
      setValues({
        unitNumber: "",
        currentOdometer: 0,
        nickname: "",
        make: "",
        model: "",
        year: 0,
        vin: "",
        licensePlate: "",
        unitType: "",
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add unit");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Unit number</Label>
              <Input
                value={values.unitNumber}
                onChange={(e) => setValues({ ...values, unitNumber: e.target.value })}
                placeholder="104"
              />
            </div>
            <div className="space-y-1">
              <Label>Odometer</Label>
              <Input
                type="number"
                value={values.currentOdometer || ""}
                onChange={(e) =>
                  setValues({ ...values, currentOdometer: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Nickname</Label>
            <Input
              value={values.nickname}
              onChange={(e) => setValues({ ...values, nickname: e.target.value })}
              placeholder="Truck 12"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Make</Label>
              <Input
                value={values.make}
                onChange={(e) => setValues({ ...values, make: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Model</Label>
              <Input
                value={values.model}
                onChange={(e) => setValues({ ...values, model: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input
                type="number"
                value={values.year || ""}
                onChange={(e) => setValues({ ...values, year: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label>License plate</Label>
              <Input
                value={values.licensePlate}
                onChange={(e) => setValues({ ...values, licensePlate: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>VIN</Label>
              <Input
                value={values.vin}
                onChange={(e) => setValues({ ...values, vin: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Unit type</Label>
              <Input
                value={values.unitType}
                onChange={(e) => setValues({ ...values, unitType: e.target.value })}
                placeholder="Truck, Trailer…"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? "Adding..." : "Add unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function suppliesBaseLabel(base: SuppliesBase): string {
  if (base === "labor_parts") return "labor + parts";
  if (base === "subtotal") return "subtotal";
  return "labor";
}
