import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listComplaints, updateComplaintStatus } from "@/lib/complaints.functions";
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

export const Route = createFileRoute("/_authenticated/complaints")({
  head: () => ({
    meta: [
      { title: "Complaints — RepairShop Billing" },
      { name: "description", content: "Driver complaint submissions." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(complaintsQuery(context.activeShop.id));
  },
  component: ComplaintsPage,
});

function complaintsQuery(shopId: string) {
  return queryOptions({
    queryKey: ["complaints", shopId],
    queryFn: () => listComplaints({ data: shopId }),
  });
}

function ComplaintsPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(complaintsQuery(activeShop.id));
  const updateFn = useServerFn(updateComplaintStatus);
  const invalidate = () => qc.invalidateQueries({ queryKey: ["complaints", activeShop.id] });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Driver complaints</h1>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reported</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.complaints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No complaints yet.
                  </TableCell>
                </TableRow>
              )}
              {data.complaints.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {c.reported_at ? new Date(c.reported_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>{c.customer?.name || "—"}</TableCell>
                  <TableCell>{c.unit?.nickname || "—"}</TableCell>
                  <TableCell className="max-w-md truncate">{c.description}</TableCell>
                  <TableCell>
                    {c.status === "resolved" ? (
                      <Badge variant="secondary">Resolved</Badge>
                    ) : c.status === "in_progress" ? (
                      <Badge>In progress</Badge>
                    ) : (
                      <Badge variant="outline">Open</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {c.status !== "in_progress" && c.status !== "resolved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateFn({ data: { id: c.id, status: "in_progress" } }).then(invalidate)
                        }
                      >
                        Start
                      </Button>
                    )}
                    {c.status !== "resolved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateFn({ data: { id: c.id, status: "resolved" } }).then(invalidate)
                        }
                      >
                        Resolve
                      </Button>
                    )}
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
