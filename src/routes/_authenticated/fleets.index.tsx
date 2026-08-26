import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/customers.functions";
import { listUnits } from "@/lib/units.functions";
import { listInvoices } from "@/lib/invoices.functions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/invoices.utils";
import { Truck, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/fleets/")({
  head: () => ({
    meta: [
      { title: "Fleets — RepairShop Billing" },
      { name: "description", content: "Customer fleet overview." },
    ],
  }),
  loader: async ({ context }) => {
    const shopId = context.activeShop.id;
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["customers", shopId],
        queryFn: () => listCustomers({ data: shopId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["units", shopId],
        queryFn: () => listUnits({ data: shopId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["invoices", shopId],
        queryFn: () => listInvoices({ data: shopId }),
      }),
    ]);
  },
  component: FleetsPage,
});

function FleetsPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const shopId = activeShop.id;
  const { data: customers } = useSuspenseQuery(
    queryOptions({
      queryKey: ["customers", shopId],
      queryFn: () => listCustomers({ data: shopId }),
    }),
  );
  const { data: units } = useSuspenseQuery(
    queryOptions({ queryKey: ["units", shopId], queryFn: () => listUnits({ data: shopId }) }),
  );
  const { data: invoices } = useSuspenseQuery(
    queryOptions({ queryKey: ["invoices", shopId], queryFn: () => listInvoices({ data: shopId }) }),
  );

  const rows = customers.customers.map((c) => {
    const custUnits = units.units.filter((u) => u.customer_id === c.id);
    const custInvoices = invoices.invoices.filter((i) => i.customer_id === c.id);
    const openCount = custInvoices.filter(
      (i) => i.status !== "paid" && i.status !== "cancelled",
    ).length;
    const lifetime = custInvoices.reduce((s, i) => s + Number(i.total ?? 0), 0);
    return {
      customer: c,
      unitCount: custUnits.length,
      openCount,
      invoiceCount: custInvoices.length,
      lifetime,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Fleets</h1>
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Open invoices</TableHead>
                <TableHead className="text-right">Total invoices</TableHead>
                <TableHead className="text-right">Lifetime value</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No customers yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.customer.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/fleets/$customerId"
                      params={{ customerId: r.customer.id }}
                      className="hover:underline"
                    >
                      {r.customer.name}
                    </Link>
                    {r.customer.company && (
                      <div className="text-xs text-muted-foreground">{r.customer.company}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Truck className="h-3.5 w-3.5" />
                      {r.unitCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{r.openCount}</TableCell>
                  <TableCell className="text-right">{r.invoiceCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(r.lifetime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/fleets/$customerId"
                      params={{ customerId: r.customer.id }}
                      className="text-muted-foreground hover:text-foreground inline-flex items-center"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
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
