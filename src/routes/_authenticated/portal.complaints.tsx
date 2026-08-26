import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listComplaints, createComplaint } from "@/lib/complaints.functions";
import { listUnits } from "@/lib/units.functions";
import { listCustomers } from "@/lib/customers.functions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal/complaints")({
  head: () => ({
    meta: [
      { title: "Submit Complaint — RepairShop Billing" },
      { name: "description", content: "Report an issue with your unit." },
    ],
  }),
  loader: async ({ context }) => {
    const shopId = context.activeShop.id;
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["complaints", shopId],
        queryFn: () => listComplaints({ data: shopId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["units", shopId],
        queryFn: () => listUnits({ data: shopId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["customers", shopId],
        queryFn: () => listCustomers({ data: shopId }),
      }),
    ]);
  },
  component: PortalComplaints,
});

function PortalComplaints() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const shopId = activeShop.id;
  const qc = useQueryClient();
  const { data: complaints } = useSuspenseQuery(
    queryOptions({
      queryKey: ["complaints", shopId],
      queryFn: () => listComplaints({ data: shopId }),
    }),
  );
  const { data: units } = useSuspenseQuery(
    queryOptions({ queryKey: ["units", shopId], queryFn: () => listUnits({ data: shopId }) }),
  );
  const { data: customers } = useSuspenseQuery(
    queryOptions({
      queryKey: ["customers", shopId],
      queryFn: () => listCustomers({ data: shopId }),
    }),
  );
  const createFn = useServerFn(createComplaint);
  const [form, setForm] = useState({ unitId: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const myCustomerId = customers.customers[0]?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCustomerId) {
      toast.error("Customer record not found");
      return;
    }
    setSubmitting(true);
    try {
      await createFn({
        data: {
          shopId,
          unitId: form.unitId,
          customerId: myCustomerId,
          description: form.description,
        },
      });
      toast.success("Complaint submitted");
      setForm({ unitId: "", description: "" });
      qc.invalidateQueries({ queryKey: ["complaints", shopId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground">Driver complaint form</h1>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Report an issue</CardTitle>
          <CardDescription>Tell us what's wrong with your truck or trailer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unitId} onValueChange={(v) => setForm({ ...form, unitId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nickname ||
                        `${u.make ?? ""} ${u.model ?? ""}`.trim() ||
                        u.license_plate ||
                        "Unit"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Describe the issue</Label>
              <Textarea
                required
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What happened? When did it start? Any warning lights?"
              />
            </div>
            <Button type="submit" disabled={submitting || !form.unitId}>
              {submitting ? "Submitting..." : "Submit complaint"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Your previous complaints</h2>
        <Card className="border-border bg-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.complaints.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No complaints yet.
                    </TableCell>
                  </TableRow>
                )}
                {complaints.complaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.reported_at ? new Date(c.reported_at).toLocaleDateString() : "—"}
                    </TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
