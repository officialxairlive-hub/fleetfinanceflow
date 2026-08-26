import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listUnits, createUnit, deleteUnit } from "@/lib/units.functions";
import { listCustomers } from "@/lib/customers.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Eye, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/units")({
  head: () => ({
    meta: [
      { title: "Units — RepairShop Billing" },
      { name: "description", content: "Manage customer trucks and trailers." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(unitsQueryOptions(context.activeShop.id));
    await context.queryClient.ensureQueryData(customersQueryOptions(context.activeShop.id));
  },
  component: UnitsPage,
});

function unitsQueryOptions(shopId: string) {
  return queryOptions({ queryKey: ["units", shopId], queryFn: () => listUnits({ data: shopId }) });
}
function customersQueryOptions(shopId: string) {
  return queryOptions({
    queryKey: ["customers", shopId],
    queryFn: () => listCustomers({ data: shopId }),
  });
}

function UnitsPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const { data: units, refetch } = useSuspenseQuery(unitsQueryOptions(activeShop.id));
  const { data: customers } = useSuspenseQuery(customersQueryOptions(activeShop.id));
  const createFn = useServerFn(createUnit);
  const deleteFn = useServerFn(deleteUnit);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    nickname: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    licensePlate: "",
    unitType: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFn({
      data: {
        shopId: activeShop.id,
        customerId: form.customerId,
        nickname: form.nickname,
        make: form.make,
        model: form.model,
        year: Number(form.year) || 0,
        vin: form.vin,
        licensePlate: form.licensePlate,
        unitType: form.unitType,
      },
    });
    setOpen(false);
    setForm({
      customerId: "",
      nickname: "",
      make: "",
      model: "",
      year: "",
      vin: "",
      licensePlate: "",
      unitType: "",
    });
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Units</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add unit</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>New unit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={form.customerId}
                  onValueChange={(v) => setForm({ ...form, customerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nickname</Label>
                  <Input
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit type</Label>
                  <Input
                    value={form.unitType}
                    onChange={(e) => setForm({ ...form, unitType: e.target.value })}
                    placeholder="Truck, trailer"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input
                    value={form.make}
                    onChange={(e) => setForm({ ...form, make: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>VIN</Label>
                  <Input
                    value={form.vin}
                    onChange={(e) => setForm({ ...form, vin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>License plate</Label>
                  <Input
                    value={form.licensePlate}
                    onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create unit
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {units.units.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            No units yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {units.units.map((u) => (
            <Card
              key={u.id}
              className="border-border bg-card overflow-hidden p-0 gap-0 transition-shadow hover:shadow-md"
            >
              <div className="relative flex h-32 items-center justify-center bg-muted/40">
                <Truck className="h-9 w-9 text-muted-foreground/60" />
                {u.unit_type && (
                  <Badge variant="secondary" className="absolute right-2 top-2 capitalize">
                    {u.unit_type}
                  </Badge>
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Unit
                  </div>
                  <Link
                    to="/units/$id"
                    params={{ id: u.id }}
                    className="block text-lg font-semibold text-foreground hover:underline"
                  >
                    {u.nickname || u.license_plate || u.vin || "Unit"}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {[u.year, u.make, u.model].filter(Boolean).join(" ") || "—"}
                  </div>
                </div>
                <div className="border-t border-border pt-3 text-sm">
                  <div className="text-foreground">{u.customer?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    Plate: {u.license_plate || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">VIN: {u.vin || "—"}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/units/$id" params={{ id: u.id }}>
                      <Eye className="mr-1 h-4 w-4" />
                      View Unit
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/invoices/new">
                      <FileText className="mr-1 h-4 w-4" />
                      New Invoice
                    </Link>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => deleteFn({ data: u.id }).then(() => refetch())}
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
