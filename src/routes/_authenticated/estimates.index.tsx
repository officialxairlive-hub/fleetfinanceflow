import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEstimates, deleteEstimate, convertEstimateToInvoice } from "@/lib/estimates.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/invoices.utils";
import { Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/estimates/")({
  head: () => ({
    meta: [
      { title: "Estimates — RepairShop Billing" },
      { name: "description", content: "Create and manage repair estimates." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(estimatesQuery(context.activeShop.id));
  },
  component: EstimatesPage,
});

function estimatesQuery(shopId: string) {
  return queryOptions({
    queryKey: ["estimates", shopId],
    queryFn: () => listEstimates({ data: shopId }),
  });
}

function EstimatesPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(estimatesQuery(activeShop.id));
  const deleteFn = useServerFn(deleteEstimate);
  const convertFn = useServerFn(convertEstimateToInvoice);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["estimates", activeShop.id] });
    qc.invalidateQueries({ queryKey: ["invoices", activeShop.id] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Estimates</h1>
        <Button asChild>
          <Link to="/estimates/new">New estimate</Link>
        </Button>
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.estimates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No estimates yet.
                  </TableCell>
                </TableRow>
              )}
              {data.estimates.map((est) => (
                <TableRow key={est.id}>
                  <TableCell className="font-medium">{est.estimate_number}</TableCell>
                  <TableCell>{est.customer?.name || "—"}</TableCell>
                  <TableCell>{est.unit?.nickname || "—"}</TableCell>
                  <TableCell>{est.issue_date || "—"}</TableCell>
                  <TableCell>{formatCurrency(est.total ?? 0)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{est.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button asChild variant="outline" size="sm" title="View work order">
                      <Link to="/estimates/$id" params={{ id: est.id }}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {est.status !== "converted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await convertFn({ data: est.id });
                            toast.success("Converted to invoice");
                            invalidate();
                            navigate({ to: "/invoices/$id", params: { id: res.invoice.id } });
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Failed");
                          }
                        }}
                      >
                        Convert
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFn({ data: est.id }).then(invalidate)}
                    >
                      Delete
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
