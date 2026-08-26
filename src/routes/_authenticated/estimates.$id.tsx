import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEstimate, convertEstimateToInvoice } from "@/lib/estimates.functions";
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
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/estimates/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Work Order ${params.id.slice(0, 8)} — Preview` },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["estimate", params.id],
        queryFn: () => getEstimate({ data: params.id }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["shop", context.activeShop.id],
        queryFn: () => getShop({ data: context.activeShop.id }),
      }),
    ]);
  },
  component: EstimatePreview,
});

function EstimatePreview() {
  const { id } = Route.useParams();
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const convertFn = useServerFn(convertEstimateToInvoice);
  const { data } = useSuspenseQuery(
    queryOptions({ queryKey: ["estimate", id], queryFn: () => getEstimate({ data: id }) }),
  );
  const { data: shopData } = useSuspenseQuery(
    queryOptions({
      queryKey: ["shop", activeShop.id],
      queryFn: () => getShop({ data: activeShop.id }),
    }),
  );
  const est = data.estimate;
  const shop = shopData.shop;
  const logoUrl = shopData.logoUrl;
  const logoSize = LOGO_SIZE_PX[readShopSettings(shop.settings).logoSize ?? "medium"];
  const { userNotes, jobs } = parseJobsFromNotes(est.notes);
  const jobGroups = groupItemsByJob(est.items, jobs);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/estimates">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to work orders
          </Link>
        </Button>
        <div className="flex gap-2">
          {est.status !== "converted" && (
            <Button
              size="sm"
              onClick={async () => {
                try {
                  const res = await convertFn({ data: est.id });
                  toast.success("Invoice created");
                  qc.invalidateQueries({ queryKey: ["estimates", activeShop.id] });
                  qc.invalidateQueries({ queryKey: ["invoices", activeShop.id] });
                  navigate({ to: "/invoices/$id", params: { id: res.invoice.id } });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed");
                }
              }}
            >
              <FileText className="mr-1 h-4 w-4" />
              Create invoice
            </Button>
          )}
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
              <div className="text-2xl font-semibold uppercase text-muted-foreground">
                Work Order
              </div>
              <div className="text-lg font-medium">{est.estimate_number}</div>
              <Badge className="mt-1" variant="outline">
                {est.status}
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
                Customer
              </div>
              <div className="font-medium text-foreground">{est.customer?.name || "—"}</div>
              {est.customer?.company && <div>{est.customer.company}</div>}
              {est.customer?.email && (
                <div className="text-muted-foreground">{est.customer.email}</div>
              )}
              {est.customer?.phone && (
                <div className="text-muted-foreground">{est.customer.phone}</div>
              )}
              {est.customer?.billing_address && (
                <div className="text-muted-foreground whitespace-pre-line">
                  {est.customer.billing_address}
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              {est.issue_date && (
                <div>
                  <span className="text-muted-foreground">Issued:</span> {est.issue_date}
                </div>
              )}
              {est.due_date && (
                <div>
                  <span className="text-muted-foreground">Due:</span> {est.due_date}
                </div>
              )}
              {est.unit && (
                <div>
                  <span className="text-muted-foreground">Unit:</span>{" "}
                  {est.unit.nickname ||
                    `${est.unit.make ?? ""} ${est.unit.model ?? ""}`.trim() ||
                    est.unit.license_plate ||
                    "—"}
                </div>
              )}
            </div>
          </section>

          {est.items.length === 0 ? (
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
              <Row label="Subtotal" value={formatCurrency(est.subtotal ?? 0)} />
              <Row
                label={`Shop Supplies (${((est.supplies_pct ?? 0) * 100).toFixed(2)}%)`}
                value={formatCurrency(est.supplies_amount ?? 0)}
                subtle
              />
              <Row
                label={`GST (${((est.gst_rate ?? 0) * 100).toFixed(2)}%)`}
                value={formatCurrency(est.gst_amount ?? 0)}
              />
              <Row
                label={`PST (${((est.pst_rate ?? 0) * 100).toFixed(2)}%)`}
                value={formatCurrency(est.pst_amount ?? 0)}
              />
              <div className="border-t border-border pt-2 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(est.total ?? 0)}</span>
              </div>
            </div>
          </section>

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
