import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getInvoice } from "@/lib/invoices.functions";
import { getShop, readShopSettings, LOGO_SIZE_PX } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, parseJobsFromNotes, groupItemsByJob } from "@/lib/invoices.utils";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { addRepairUpdate, recordPayment, sendPaymentReminder } from "@/lib/invoices.functions";
import { RecordPaymentDialog } from "./invoices.index";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BellRing, DollarSign } from "lucide-react";
import { ArrowLeft, Printer } from "lucide-react";
import { Mail } from "lucide-react";
import { useState } from "react";
import { SendInvoiceDialog } from "@/components/invoices/send-invoice-dialog";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Invoice ${params.id.slice(0, 8)} — Preview` },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["invoice", params.id],
        queryFn: () => getInvoice({ data: params.id }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["shop", context.activeShop.id],
        queryFn: () => getShop({ data: context.activeShop.id }),
      }),
    ]);
  },
  component: InvoicePreview,
});

function InvoicePreview() {
  const { id } = Route.useParams();
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const { data } = useSuspenseQuery(
    queryOptions({ queryKey: ["invoice", id], queryFn: () => getInvoice({ data: id }) }),
  );
  const { data: shopData } = useSuspenseQuery(
    queryOptions({
      queryKey: ["shop", activeShop.id],
      queryFn: () => getShop({ data: activeShop.id }),
    }),
  );
  const inv = data.invoice;
  const shop = shopData.shop;
  const logoUrl = shopData.logoUrl;
  const logoSize = LOGO_SIZE_PX[readShopSettings(shop.settings).logoSize ?? "medium"];
  const { userNotes, jobs } = parseJobsFromNotes(inv.notes);
  const jobGroups = groupItemsByJob(inv.items, jobs);
  const [sendOpen, setSendOpen] = useState(false);
  const qc = useQueryClient();
  const payFn = useServerFn(recordPayment);
  const reminderFn = useServerFn(sendPaymentReminder);
  const updateFn = useServerFn(addRepairUpdate);
  const [payOpen, setPayOpen] = useState(false);
  const [workStatus, setWorkStatus] = useState(inv.work_status ?? "received");
  const [updateNote, setUpdateNote] = useState("");
  const payments = (inv.payments ?? []).filter((p) =>
    ["succeeded", "paid", "completed"].includes((p.status ?? "").toLowerCase()),
  );
  const balance = data.balance;
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["invoice", id] }),
      qc.invalidateQueries({ queryKey: ["receivables", activeShop.id] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/invoices">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to invoices
          </Link>
        </Button>
        <div className="flex gap-2">
          {balance.balanceDue > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPayOpen(true)}>
                <DollarSign className="mr-1 h-4 w-4" />
                Record payment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await reminderFn({ data: { invoiceId: id } });
                    await refresh();
                    toast.success(
                      res.emailed ? "Reminder emailed" : "Reminder flagged in the portal",
                    );
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to send reminder");
                  }
                }}
              >
                <BellRing className="mr-1 h-4 w-4" />
                Send reminder
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setSendOpen(true)}>
            <Mail className="mr-1 h-4 w-4" />
            Send invoice
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card mx-auto max-w-3xl print:border-0 print:shadow-none">
        <CardContent className="p-8 space-y-8">
          <header className="flex justify-between items-start gap-6">
            <div>
              <div className="text-2xl font-semibold uppercase text-muted-foreground">Invoice</div>
              <div className="text-lg font-medium">{inv.invoice_number}</div>
              <Badge className="mt-1" variant="outline">
                {inv.status}
              </Badge>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={`${shop.name} logo`}
                  style={{ maxWidth: logoSize, maxHeight: logoSize }}
                  className="object-contain rounded"
                />
              )}
              <div>
                <h1 className="text-xl font-semibold text-foreground">{shop.name}</h1>
                {shop.address && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {shop.address}
                  </p>
                )}
                {shop.email && <p className="text-sm text-muted-foreground">{shop.email}</p>}
                {shop.phone && <p className="text-sm text-muted-foreground">{shop.phone}</p>}
              </div>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Bill to
              </div>
              <div className="font-medium text-foreground">{inv.customer?.name || "—"}</div>
              {inv.customer?.company && <div>{inv.customer.company}</div>}
              {inv.customer?.email && (
                <div className="text-muted-foreground">{inv.customer.email}</div>
              )}
              {inv.customer?.phone && (
                <div className="text-muted-foreground">{inv.customer.phone}</div>
              )}
              {inv.customer?.billing_address && (
                <div className="text-muted-foreground whitespace-pre-line">
                  {inv.customer.billing_address}
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              {inv.issue_date && (
                <div>
                  <span className="text-muted-foreground">Issued:</span> {inv.issue_date}
                </div>
              )}
              {inv.due_date && (
                <div>
                  <span className="text-muted-foreground">Due:</span> {inv.due_date}
                </div>
              )}
              {inv.unit && (
                <>
                  <div>
                    <span className="text-muted-foreground">Unit:</span>{" "}
                    {[
                      inv.unit_number_snapshot || inv.unit.unit_number
                        ? `#${inv.unit_number_snapshot || inv.unit.unit_number}`
                        : null,
                      inv.unit.nickname ||
                        `${inv.unit.make ?? ""} ${inv.unit.model ?? ""}`.trim() ||
                        inv.unit.license_plate,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                  {(inv.vin_snapshot || inv.unit.vin) && (
                    <div>
                      <span className="text-muted-foreground">VIN:</span>{" "}
                      {inv.vin_snapshot || inv.unit.vin}
                    </div>
                  )}
                  {inv.unit.license_plate && (
                    <div>
                      <span className="text-muted-foreground">Plate:</span> {inv.unit.license_plate}
                    </div>
                  )}
                </>
              )}
              {inv.odometer != null && (
                <div>
                  <span className="text-muted-foreground">Odometer:</span>{" "}
                  {Number(inv.odometer).toLocaleString()}
                </div>
              )}
            </div>
          </section>

          {inv.items.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 text-sm">No items</div>
          ) : (
            <div className="space-y-6">
              {jobGroups.map((group, gi) => {
                if (group.items.length === 0) return null;
                if (group.name === "Other charges") return null;
                const subtotal = group.items.reduce((s, it) => s + Number(it.line_total ?? 0), 0);
                return (
                  <section key={gi} className="border border-border rounded-md overflow-hidden">
                    <div className="bg-muted/40 px-4 py-3">
                      <h2 className="text-base font-semibold text-foreground leading-snug">
                        {group.complaint || group.name}
                      </h2>
                      {!group.complaint && group.name && (
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mt-1">
                          {group.name}
                        </p>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20 shrink-0">Type</TableHead>
                          <TableHead className="w-full">Description</TableHead>
                          <TableHead className="text-right w-16 shrink-0">Qty</TableHead>
                          <TableHead className="text-right w-24 shrink-0">Unit price</TableHead>
                          <TableHead className="text-right w-24 shrink-0">Line total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((it) => (
                          <TableRow key={it.id}>
                            <TableCell className="capitalize text-muted-foreground w-20 shrink-0">
                              {it.item_type}
                            </TableCell>
                            <TableCell className="w-full">{it.description}</TableCell>
                            <TableCell className="text-right tabular-nums w-16 shrink-0">
                              {it.quantity}
                            </TableCell>
                            <TableCell className="text-right tabular-nums w-24 shrink-0">
                              {formatCurrency(it.unit_price ?? 0)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums w-24 shrink-0">
                              {formatCurrency(it.line_total ?? 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end border-t border-border bg-muted/20 px-4 py-2 text-sm">
                      <span className="text-muted-foreground mr-3">Job subtotal</span>
                      <span className="tabular-nums font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <section className="flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <Row label="Labor" value={formatCurrency(inv.labor_total ?? 0)} subtle />
              <Row label="Parts" value={formatCurrency(inv.parts_total ?? 0)} subtle />
              {(inv.fees_total ?? 0) > 0 && (
                <Row label="Shop fees" value={formatCurrency(inv.fees_total ?? 0)} subtle />
              )}
              <Row label="Subtotal" value={formatCurrency(inv.subtotal ?? 0)} />
              <Row
                label={`Shop Supplies (${((inv.supplies_pct ?? 0) * 100).toFixed(2)}%)`}
                value={formatCurrency(inv.supplies_amount ?? 0)}
                subtle
              />
              <Row
                label={`GST (${((inv.gst_rate ?? 0) * 100).toFixed(2)}%)`}
                value={formatCurrency(inv.gst_amount ?? 0)}
              />
              <Row
                label={`PST (${((inv.pst_rate ?? 0) * 100).toFixed(2)}%)`}
                value={formatCurrency(inv.pst_amount ?? 0)}
              />
              <div className="border-t border-border pt-2 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(inv.total ?? 0)}</span>
              </div>
            </div>
          </section>

          <section className="grid gap-4 print:hidden sm:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Payments</div>
              <div className="mt-2 space-y-1 text-sm">
                {payments.length === 0 && (
                  <p className="text-muted-foreground">No payments recorded.</p>
                )}
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">
                      {(p.paid_at ?? "").slice(0, 10)} · {p.method ?? "other"}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </span>
                    <span className="tabular-nums">{formatCurrency(Number(p.amount ?? 0))}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
                  <span>Balance due</span>
                  <span className="tabular-nums">{formatCurrency(balance.balanceDue)}</span>
                </div>
                {balance.daysOverdue > 0 && (
                  <p className="text-xs text-destructive">{balance.daysOverdue} days overdue</p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-border p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Repair status
              </div>
              <div className="mt-2 space-y-2">
                <Select value={workStatus} onValueChange={setWorkStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="diagnosing">Diagnosing</SelectItem>
                    <SelectItem value="awaiting_parts">Awaiting parts</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="ready">Ready for pickup</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Label className="text-xs">Update the customer sees</Label>
                  <Textarea
                    rows={2}
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="Parts ordered, ETA Thursday…"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await updateFn({
                        data: {
                          invoiceId: id,
                          workStatus: workStatus as "received",
                          note: updateNote,
                        },
                      });
                      setUpdateNote("");
                      await refresh();
                      toast.success("Repair update posted");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to post update");
                    }
                  }}
                >
                  Post update
                </Button>
                <div className="space-y-1 pt-2 text-sm">
                  {(inv.repair_updates ?? []).map((u) => (
                    <div key={u.id} className="border-t border-border pt-1">
                      <span className="text-muted-foreground">
                        {(u.created_at ?? "").slice(0, 10)} ·{" "}
                      </span>
                      <span className="capitalize">{(u.work_status ?? "").replace("_", " ")}</span>
                      {u.note && <div className="text-muted-foreground">{u.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {(inv.payment_reminders ?? []).length > 0 && (
            <section className="print:hidden">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Delivery &amp; reminder log
              </div>
              <div className="space-y-1 text-sm">
                {[...(inv.payment_reminders ?? [])]
                  .sort((a, b) => (b.sent_at ?? "").localeCompare(a.sent_at ?? ""))
                  .map((r) => (
                    <div key={r.id} className="border-t border-border pt-1">
                      <span className="text-muted-foreground">
                        {(r.sent_at ?? "").slice(0, 10)} · {r.channel} · {r.status} —{" "}
                      </span>
                      <span>{r.message}</span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {inv.sent_at && (
            <p className="text-xs text-muted-foreground print:hidden">
              Invoice emailed on {new Date(inv.sent_at).toLocaleString()}
            </p>
          )}

          {userNotes && (
            <section>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Notes
              </div>
              <p className="text-sm whitespace-pre-line text-foreground">{userNotes}</p>
            </section>
          )}
        </CardContent>
      </Card>
      <RecordPaymentDialog
        target={payOpen ? { id, number: inv.invoice_number, balance: balance.balanceDue } : null}
        onOpenChange={(o) => setPayOpen(o)}
        onSubmit={async (values) => {
          await payFn({ data: { invoiceId: id, ...values } });
          await refresh();
          setPayOpen(false);
          toast.success("Payment recorded");
        }}
      />
      <SendInvoiceDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        invoiceId={id}
        defaultEmail={inv.customer?.email || ""}
        invoiceNumber={inv.invoice_number}
        shopName={shop.name}
        total={formatCurrency(inv.total ?? 0)}
        previewUrl={typeof window !== "undefined" ? window.location.href : ""}
        onSent={refresh}
      />
    </div>
  );
}

function Row({ label, value, subtle }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div
      className={`flex justify-between ${subtle ? "text-xs text-muted-foreground/80" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}
