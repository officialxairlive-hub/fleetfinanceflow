import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getUnit } from "@/lib/units.functions";
import { listInvoicesByUnit } from "@/lib/invoices.functions";
import { listEstimatesByUnit } from "@/lib/estimates.functions";
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
import { ArrowLeft, Eye, FileText, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/units/$id")({
  head: () => ({
    meta: [{ title: "Unit details — RepairShop Billing" }, { name: "robots", content: "noindex" }],
  }),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["unit", params.id],
        queryFn: () => getUnit({ data: params.id }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["invoices-by-unit", params.id],
        queryFn: () => listInvoicesByUnit({ data: params.id }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["estimates-by-unit", params.id],
        queryFn: () => listEstimatesByUnit({ data: params.id }),
      }),
    ]);
  },
  component: UnitDetail,
});

function UnitDetail() {
  const { id } = Route.useParams();
  const { data: ud } = useSuspenseQuery(
    queryOptions({ queryKey: ["unit", id], queryFn: () => getUnit({ data: id }) }),
  );
  const { data: invData } = useSuspenseQuery(
    queryOptions({
      queryKey: ["invoices-by-unit", id],
      queryFn: () => listInvoicesByUnit({ data: id }),
    }),
  );
  const { data: estData } = useSuspenseQuery(
    queryOptions({
      queryKey: ["estimates-by-unit", id],
      queryFn: () => listEstimatesByUnit({ data: id }),
    }),
  );
  const unit = ud.unit;
  const invoices = invData.invoices;
  const estimates = estData.estimates;

  const backTo = unit.customer_id
    ? { to: "/customers/$id", params: { id: unit.customer_id } }
    : { to: "/units" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          {unit.customer_id ? (
            <Link to="/customers/$id" params={{ id: unit.customer_id }}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to customer
            </Link>
          ) : (
            <Link to="/units">
              <ArrowLeft className="mr-1 h-4 w-4" />
              All units
            </Link>
          )}
        </Button>
        <Button asChild size="sm">
          <Link to="/invoices/new">New invoice</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {unit.nickname || unit.license_plate || unit.vin || "Unit"}
        </h1>
        {unit.customer && (
          <p className="text-muted-foreground">
            <Link to="/customers/$id" params={{ id: unit.customer.id }} className="hover:underline">
              {unit.customer.name}
            </Link>
          </p>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Unit details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-sm">
          <Detail label="Type" value={unit.unit_type} />
          <Detail label="Year" value={unit.year ? String(unit.year) : null} />
          <Detail label="Make" value={unit.make} />
          <Detail label="Model" value={unit.model} />
          <Detail label="VIN" value={unit.vin} />
          <Detail label="License plate" value={unit.license_plate} />
          <Detail
            label="Odometer"
            value={unit.current_odometer ? String(unit.current_odometer) : null}
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No invoices for this unit.
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

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Work orders
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work order</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No work orders for this unit.
                  </TableCell>
                </TableRow>
              )}
              {estimates.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">
                    <Link to="/estimates/$id" params={{ id: e.id }} className="hover:underline">
                      {e.estimate_number}
                    </Link>
                  </TableCell>
                  <TableCell>{e.issue_date || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(e.total ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/estimates/$id" params={{ id: e.id }}>
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

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-foreground mt-0.5">{value || "—"}</div>
    </div>
  );
}
