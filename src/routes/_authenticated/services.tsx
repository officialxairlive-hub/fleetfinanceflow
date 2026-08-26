import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listServices, createService, deleteService } from "@/lib/services.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/invoices.utils";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({
    meta: [
      { title: "Services — RepairShop Billing" },
      { name: "description", content: "Manage your shop's service catalog and labor rates." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(servicesQueryOptions(context.activeShop.id));
  },
  component: ServicesPage,
});

function servicesQueryOptions(shopId: string) {
  return queryOptions({
    queryKey: ["services", shopId],
    queryFn: () => listServices({ data: shopId }),
  });
}

function ServicesPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(servicesQueryOptions(activeShop.id));
  const createFn = useServerFn(createService);
  const deleteFn = useServerFn(deleteService);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    laborRate: "",
    estimatedHours: "",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["services", activeShop.id] });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFn({
      data: {
        shopId: activeShop.id,
        name: form.name,
        description: form.description,
        laborRate: Number(form.laborRate) || 0,
        estimatedHours: Number(form.estimatedHours) || 0,
        active: true,
      },
    });
    setOpen(false);
    setForm({ name: "", description: "", laborRate: "", estimatedHours: "" });
    invalidate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Services</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add service</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>New service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Labor rate ($/hr)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.laborRate}
                    onChange={(e) => setForm({ ...form, laborRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated hours</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={form.estimatedHours}
                    onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create service
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Labor rate</TableHead>
                <TableHead>Est. hours</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No services yet.
                  </TableCell>
                </TableRow>
              )}
              {data.services.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{formatCurrency(s.labor_rate ?? 0)}</TableCell>
                  <TableCell>{s.estimated_hours ?? 0}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {s.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFn({ data: s.id }).then(invalidate)}
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
