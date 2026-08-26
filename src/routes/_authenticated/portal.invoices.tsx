import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPortalInvoices } from "@/lib/portal.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, ITEM_TYPE_LABELS } from "@/lib/invoices.utils";

export const Route = createFileRoute("/_authenticated/portal/invoices")({
  head: () => ({
    meta: [
      { title: "Billing History — RepairShop Billing" },
      { name: "description", content: "Your invoices, itemized charges, payments, and balances." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(portalInvoicesQuery(context.activeShop.id));
  },
  component: PortalInvoices,
});

function portalInvoicesQuery(shopId: string) {
  return queryOptions({
    queryKey: ["portal", "invoices", shopId],
    queryFn: () => getPortalInvoices({ data: shopId }),
  });
}

type Filter = "all" | "unpaid" | "overdue" | "paid";

function PortalInvoices() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const { data } = useSuspenseQuery(portalInvoicesQuery(activeShop.id));
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = data.invoices.filter((inv) => {
    if (filter === "unpaid") return ["unpaid", "partial", "overdue"].includes(inv.payment_status);
    if (filter === "overdue") return inv.payment_status === "overdue";
    if (filter === "paid") return inv.payment_status === "paid";
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Billing history</h1>
      <div className="flex flex-wrap gap-2">
        {(["all", "unpaid", "overdue", "paid"] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No invoices here.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((inv) => (
                <>
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell className="text-sm">
                      {[
                        inv.unit?.unit_number ? `#${inv.unit.unit_number}` : null,
                        inv.unit?.nickname,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                      {inv.unit?.vin && (
                        <div className="text-xs text-muted-foreground">VIN {inv.unit.vin}</div>
                      )}
                    </TableCell>
                    <TableCell>{inv.issue_date || "—"}</TableCell>
                    <TableCell>{inv.due_date || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(inv.total ?? 0)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(inv.balance_due)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.payment_status === "paid"
                            ? "secondary"
                            : inv.payment_status === "overdue"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {inv.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpenId(openId === inv.id ? null : inv.id)}
                      >
                        {openId === inv.id ? "Hide" : "Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {openId === inv.id && (
                    <TableRow key={`${inv.id}-detail`}>
                      <TableCell colSpan={8} className="bg-muted/30">
                        <div className="grid gap-6 py-2 md:grid-cols-2">
                          <div className="space-y-1 text-sm">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                              Itemized charges
                            </div>
                            {(inv.items ?? []).map((it) => (
                              <div key={it.id} className="flex justify-between gap-3">
                                <span>
                                  <span className="text-muted-foreground">
                                    {ITEM_TYPE_LABELS[it.item_type] ?? it.item_type} ·{" "}
                                  </span>
                                  {it.description}
                                  {it.hours ? (
                                    <span className="text-muted-foreground"> ({it.hours} hrs)</span>
                                  ) : null}
                                </span>
                                <span className="tabular-nums">
                                  {formatCurrency(Number(it.line_total ?? 0))}
                                </span>
                              </div>
                            ))}
                            <div className="mt-2 space-y-1 border-t border-border pt-2">
                              <Line label="Labor" value={inv.labor_total} />
                              <Line label="Parts" value={inv.parts_total} />
                              <Line
                                label="Shop fees"
                                value={
                                  Number(inv.fees_total ?? 0) + Number(inv.supplies_amount ?? 0)
                                }
                              />
                              <Line label="GST" value={inv.gst_amount} />
                              <Line label="PST" value={inv.pst_amount} />
                              <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span className="tabular-nums">
                                  {formatCurrency(inv.total ?? 0)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="tabular-nums">
                                  {formatCurrency(inv.amount_paid)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                              Repair updates
                            </div>
                            {(inv.repair_updates ?? []).length === 0 && (
                              <p className="text-muted-foreground">No updates posted.</p>
                            )}
                            {(inv.repair_updates ?? []).map((u) => (
                              <div key={u.id}>
                                <span className="text-muted-foreground">
                                  {(u.created_at ?? "").slice(0, 10)} ·{" "}
                                </span>
                                <span className="capitalize">
                                  {(u.work_status ?? "").replace("_", " ")}
                                </span>
                                {u.note && <div className="text-muted-foreground">{u.note}</div>}
                              </div>
                            ))}
                            {(inv.payment_reminders ?? []).length > 0 && (
                              <div className="rounded-md border border-border p-2">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Payment reminders
                                </div>
                                {(inv.payment_reminders ?? []).map((r, i) => (
                                  <div key={i} className="text-muted-foreground">
                                    {(r.sent_at ?? "").slice(0, 10)} — {r.message}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Line({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{formatCurrency(Number(value ?? 0))}</span>
    </div>
  );
}
