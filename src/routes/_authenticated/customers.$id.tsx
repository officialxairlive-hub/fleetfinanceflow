import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authenticated/customers/$id")({
  head: () => ({
    meta: [
      { title: "Customer details — RepairShop Billing" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ context, params }) => {
    const shopId = context.activeShop.id;
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["customer", params.id],
        queryFn: () => getCustomer({ data: params.id }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["invoices-by-customer", shopId, params.id],
        queryFn: () => listInvoicesByCustomer({ data: { shopId, customerId: params.id } }),
      }),
    ]);
  },
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const shopId = activeShop.id;
  const { data: cd } = useSuspenseQuery(
    queryOptions({ queryKey: ["customer", id], queryFn: () => getCustomer({ data: id }) }),
  );
  const { data: invData } = useSuspenseQuery(
    queryOptions({
      queryKey: ["invoices-by-customer", shopId, id],
      queryFn: () => listInvoicesByCustomer({ data: { shopId, customerId: id } }),
    }),
  );
  const customer = cd.customer;
  const units = customer.units ?? [];
  const invoices = invData.invoices;

  const totalByUnit = (unitId: string) =>
    invoices.filter((i) => i.unit_id === unitId).reduce((s, i) => s + Number(i.total ?? 0), 0);
  const openByUnit = (unitId: string) =>
    invoices.filter((i) => i.unit_id === unitId && i.status !== "paid" && i.status !== "cancelled")
      .length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/customers">
            <ArrowLeft className="mr-1 h-4 w-4" />
            All customers
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/invoices/new">New invoice</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{customer.name}</h1>
        {customer.company && <p className="text-muted-foreground">{customer.company}</p>}
        <div className="mt-2 text-sm text-muted-foreground space-x-4">
          {customer.email && <span>{customer.email}</span>}
          {customer.phone && <span>{customer.phone}</span>}
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Units ({units.length})
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
                <TableHead />
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
              {units.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => navigate({ to: "/units/$id", params: { id: u.id } })}
                >
                  <TableCell className="font-medium">
                    <Link to="/units/$id" params={{ id: u.id }} className="hover:underline">
                      {u.nickname || u.license_plate || u.vin || "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {[u.year, u.make, u.model].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell>{u.license_plate || "—"}</TableCell>
                  <TableCell className="text-right">{openByUnit(u.id)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(totalByUnit(u.id))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/units/$id" params={{ id: u.id }}>
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

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">All invoices</CardTitle>
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
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <Link to="/invoices/$id" params={{ id: inv.id }} className="hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </TableCell>
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
