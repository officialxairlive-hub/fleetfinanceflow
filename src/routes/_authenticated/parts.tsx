import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listParts, createPart, deletePart } from "@/lib/parts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/invoices.utils";

export const Route = createFileRoute("/_authenticated/parts")({
  head: () => ({
    meta: [
      { title: "Parts & Inventory — RepairShop Billing" },
      { name: "description", content: "Track parts inventory, cost, retail, and markup." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(partsQueryOptions(context.activeShop.id));
  },
  component: PartsPage,
});

function partsQueryOptions(shopId: string) {
  return queryOptions({ queryKey: ["parts", shopId], queryFn: () => listParts({ data: shopId }) });
}

function PartsPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(partsQueryOptions(activeShop.id));
  const createFn = useServerFn(createPart);
  const deleteFn = useServerFn(deletePart);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    supplier: "",
    cost: "",
    retailPrice: "",
    quantityOnHand: "",
    reorderLevel: "",
    markupPct: "",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["parts", activeShop.id] });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFn({
      data: {
        shopId: activeShop.id,
        name: form.name,
        sku: form.sku,
        supplier: form.supplier,
        cost: Number(form.cost) || 0,
        retailPrice: Number(form.retailPrice) || 0,
        quantityOnHand: Number(form.quantityOnHand) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
        markupPct: Number(form.markupPct) || 0,
        active: true,
      },
    });
    setOpen(false);
    setForm({
      name: "",
      sku: "",
      supplier: "",
      cost: "",
      retailPrice: "",
      quantityOnHand: "",
      reorderLevel: "",
      markupPct: "",
    });
    invalidate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Parts & Inventory</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add part</Button>
          </DialogTrigger>
          <DialogContent className="bg-card max-w-lg">
            <DialogHeader>
              <DialogTitle>New part</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>SKU</Label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Supplier</Label>
                  <Input
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Markup %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.markupPct}
                    onChange={(e) => setForm({ ...form, markupPct: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Retail price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.retailPrice}
                    onChange={(e) => setForm({ ...form, retailPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Qty on hand</Label>
                  <Input
                    type="number"
                    value={form.quantityOnHand}
                    onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Reorder level</Label>
                  <Input
                    type="number"
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create part
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
                <TableHead>SKU</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Retail</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.parts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No parts yet.
                  </TableCell>
                </TableRow>
              )}
              {data.parts.map((p) => {
                const low = (p.quantity_on_hand ?? 0) <= (p.reorder_level ?? 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.sku || "—"}</TableCell>
                    <TableCell>{formatCurrency(p.cost ?? 0)}</TableCell>
                    <TableCell>{formatCurrency(p.retail_price ?? 0)}</TableCell>
                    <TableCell>{p.quantity_on_hand ?? 0}</TableCell>
                    <TableCell>
                      {low ? (
                        <Badge variant="destructive">Low stock</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFn({ data: p.id }).then(invalidate)}
                      >
                        Delete
                      </Button>
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
