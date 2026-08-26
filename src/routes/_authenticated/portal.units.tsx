import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPortalUnits } from "@/lib/portal.functions";
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

export const Route = createFileRoute("/_authenticated/portal/units")({
  head: () => ({
    meta: [
      { title: "My Fleet — RepairShop Billing" },
      {
        name: "description",
        content: "VINs, unit numbers, and mileage for every truck and trailer on file.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(portalUnitsQuery(context.activeShop.id));
  },
  component: PortalUnits,
});

function portalUnitsQuery(shopId: string) {
  return queryOptions({
    queryKey: ["portal", "units", shopId],
    queryFn: () => getPortalUnits({ data: shopId }),
  });
}

function PortalUnits() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const { data } = useSuspenseQuery(portalUnitsQuery(activeShop.id));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">My fleet</h1>
      <Card className="border-border bg-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit #</TableHead>
                <TableHead>Nickname</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead className="text-right">Odometer</TableHead>
                <TableHead>Last service</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.units.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No units on file.
                  </TableCell>
                </TableRow>
              )}
              {data.units.map((u) => {
                const history = data.invoices.filter((i) => i.unit_id === u.id);
                const last = history[0];
                const lastOdo = history.find((i) => i.odometer != null)?.odometer;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.unit_number || "—"}</TableCell>
                    <TableCell>{u.nickname || "—"}</TableCell>
                    <TableCell>{[u.make, u.model].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell>{u.year || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{u.vin || "—"}</TableCell>
                    <TableCell>{u.license_plate || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(u.current_odometer ?? lastOdo) != null
                        ? Number(u.current_odometer ?? lastOdo).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {last ? (
                        <>
                          <div>{last.issue_date || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {last.invoice_number} · {formatCurrency(Number(last.total ?? 0))}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
