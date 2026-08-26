import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCustomer } from "@/lib/customers.functions";
import { listInvoicesByCustomer } from "@/lib/invoices.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/invoices.utils";
import { ArrowLeft, Truck, Eye } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/fleets/$customerId")({
  head: () => ({
    meta: [{ title: "Fleet detail — RepairShop Billing" }, { name: "robots", content: "noindex" }],
  }),
  loader: async ({ context, params }) => {
    const shopId = context.activeShop.id;
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["customer", params.customerId],
        queryFn: () => getCustomer({ data: params.customerId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["invoices-by-customer", shopId, params.customerId],
        queryFn: () => listInvoicesByCustomer({ data: { shopId, customerId: params.customerId } }),
      }),
    ]);
  },
  component: FleetDetail,
});

function FleetDetail() {
  const { customerId } = Route.useParams();
  const navigate = useNavigate();
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const shopId = activeShop.id;
  const { data: cd } = useSuspenseQuery(
    queryOptions({
      queryKey: ["customer", customerId],
      queryFn: () => getCustomer({ data: customerId }),
    }),
  );
  const { data: invData } = useSuspenseQuery(
    queryOptions({
      queryKey: ["invoices-by-customer", shopId, customerId],
      queryFn: () => listInvoicesByCustomer({ data: { shopId, customerId } }),
    }),
  );
  const customer = cd.customer;
  const units = customer.units ?? [];
  const invoices = invData.invoices;

  const lifetime = invoices.reduce((s, i) => s + Number(i.total ?? 0), 0);
  const openCount = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  const openByUnit = (unitId: string) =>
    invoices.filter((i) => i.unit_id === unitId && i.status !== "paid" && i.status !== "cancelled")
      .length;
  const totalByUnit = (unitId: string) =>
    invoices.filter((i) => i.unit_id === unitId).reduce((s, i) => s + Number(i.total ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/fleets">
            <ArrowLeft className="mr-1 h-4 w-4" />
            All fleets
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/invoices/new">New invoice</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{customer.name}</h1>
        {customer.company && <p className="text-muted-foreground">{customer.company}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Units" value={String(units.length)} />
        <Stat label="Open invoices" value={String(openCount)} />
        <Stat label="Paid invoices" value={String(paidCount)} />
        <Stat label="Lifetime value" value={formatCurrency(lifetime)} />
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Fleet units
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Make / Model</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">Total billed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No units yet.
                  </TableCell>
                </TableRow>
              )}
              {units.map((u) => {
                const open = openByUnit(u.id);
                return (
                  <TableRow
                    key={u.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => navigate({ to: "/units/$id", params: { id: u.id } })}
                  >
                    <TableCell className="font-medium">
                      <Link
                        to="/units/$id"
                        params={{ id: u.id }}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {u.nickname || u.license_plate || u.vin || "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {[u.year, u.make, u.model].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>{u.license_plate || "—"}</TableCell>
                    <TableCell className="text-right">{open}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(totalByUnit(u.id))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={open > 0 ? "default" : "secondary"}>
                        {open > 0 ? "In service" : "Idle"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Service history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No service history yet.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.unit?.nickname || inv.unit?.license_plate || "—"}</TableCell>
                  <TableCell>{inv.issue_date || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(inv.total ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/invoices/$id" params={{ id: inv.id }}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold text-foreground mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
