import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listCustomers,
  createCustomer,
  deleteCustomer,
  updateCustomer,
  listCustomerStats,
} from "@/lib/customers.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { Pencil, Search, Plus, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/invoices.utils";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers — RepairShop Billing" },
      { name: "description", content: "Manage your truck repair shop customers." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(customersQueryOptions(context.activeShop.id));
    await context.queryClient.ensureQueryData(statsQueryOptions(context.activeShop.id));
  },
  component: CustomersPage,
});

function customersQueryOptions(shopId: string) {
  return queryOptions({
    queryKey: ["customers", shopId],
    queryFn: () => listCustomers({ data: shopId }),
  });
}

function statsQueryOptions(shopId: string) {
  return queryOptions({
    queryKey: ["customer-stats", shopId],
    queryFn: () => listCustomerStats({ data: shopId }),
  });
}

function CustomersPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, refetch } = useSuspenseQuery(customersQueryOptions(activeShop.id));
  const { data: statsData } = useSuspenseQuery(statsQueryOptions(activeShop.id));
  const [search, setSearch] = useState("");
  const createFn = useServerFn(createCustomer);
  const deleteFn = useServerFn(deleteCustomer);
  const updateFn = useServerFn(updateCustomer);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"customers"> | null>(null);
  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    company: "",
    billingAddress: "",
    gstExempt: false,
    pstExempt: false,
    gstRatePct: "" as string,
    pstRatePct: "" as string,
    gstNumber: "",
    pstNumber: "",
    laborRate: "" as string,
    partsMarkupPct: "" as string,
  };
  const [form, setForm] = useState(emptyForm);

  const statsById = new Map(statsData.stats.map((s) => [s.customerId, s]));
  const emptyStat = {
    units: 0,
    openBalance: 0,
    lastJob: null as string | null,
    totalInvoices: 0,
    totalServiceOrders: 0,
  };
  const customers = data.customers;
  const q = search.trim().toLowerCase();
  const filtered = q
    ? customers.filter((c) =>
        [c.name, c.company, c.phone, c.email].some((v) => (v ?? "").toLowerCase().includes(q)),
      )
    : customers;
  const totalAR = statsData.stats.reduce((s, x) => s + x.openBalance, 0);
  const now = new Date();
  const newThisMonth = customers.filter((c) => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const topCustomers = [...customers]
    .map((c) => ({ c, s: statsById.get(c.id) ?? emptyStat }))
    .sort((a, b) => b.s.totalServiceOrders - a.s.totalServiceOrders)
    .slice(0, 3);
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (c: Tables<"customers">) => {
    setEditing(c);
    setForm({
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      company: c.company ?? "",
      billingAddress: c.billing_address ?? "",
      gstExempt: !!c.gst_exempt,
      pstExempt: !!c.pst_exempt,
      gstRatePct: c.gst_rate == null ? "" : (Number(c.gst_rate) * 100).toString(),
      pstRatePct: c.pst_rate == null ? "" : (Number(c.pst_rate) * 100).toString(),
      gstNumber: c.gst_number ?? "",
      pstNumber: c.pst_number ?? "",
      laborRate: c.labor_rate == null ? "" : String(c.labor_rate),
      partsMarkupPct:
        c.parts_markup_pct == null ? "" : (Number(c.parts_markup_pct) * 100).toString(),
    });
    setOpen(true);
  };

  const toPayload = () => ({
    name: form.name,
    email: form.email,
    phone: form.phone,
    company: form.company,
    billingAddress: form.billingAddress,
    gstExempt: form.gstExempt,
    pstExempt: form.pstExempt,
    gstRate: form.gstRatePct === "" ? null : Number(form.gstRatePct) / 100,
    pstRate: form.pstRatePct === "" ? null : Number(form.pstRatePct) / 100,
    gstNumber: form.gstNumber,
    pstNumber: form.pstNumber,
    laborRate: form.laborRate === "" ? null : Number(form.laborRate),
    partsMarkupPct: form.partsMarkupPct === "" ? null : Number(form.partsMarkupPct) / 100,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload();
    if (editing) {
      await updateFn({ data: { id: editing.id, shopId: activeShop.id, ...payload } });
    } else {
      await createFn({ data: { shopId: activeShop.id, ...payload } });
    }
    setOpen(false);
    setForm(emptyForm);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["customers", activeShop.id] });
    refetch();
  };

  const handleDelete = async (id: string) => {
    await deleteFn({ data: id });
    queryClient.invalidateQueries({ queryKey: ["customers", activeShop.id] });
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Active accounts, A/R, and service order activity
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) {
              setEditing(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" />
              Add customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Billing address</Label>
                  <Input
                    id="address"
                    value={form.billingAddress}
                    onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                  />
                </div>
              </div>

              <div className="rounded-md border border-border p-4 space-y-4">
                <div className="text-sm font-medium text-foreground">Tax settings</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                    <div>
                      <Label className="text-sm">GST exempt</Label>
                      <p className="text-xs text-muted-foreground">No GST charged.</p>
                    </div>
                    <Switch
                      checked={form.gstExempt}
                      onCheckedChange={(v) => setForm({ ...form, gstExempt: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                    <div>
                      <Label className="text-sm">PST exempt</Label>
                      <p className="text-xs text-muted-foreground">No PST charged.</p>
                    </div>
                    <Switch
                      checked={form.pstExempt}
                      onCheckedChange={(v) => setForm({ ...form, pstExempt: v })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstRatePct">GST rate override (%)</Label>
                    <Input
                      id="gstRatePct"
                      type="number"
                      step="0.01"
                      placeholder="Uses shop default"
                      disabled={form.gstExempt}
                      value={form.gstRatePct}
                      onChange={(e) => setForm({ ...form, gstRatePct: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pstRatePct">PST rate override (%)</Label>
                    <Input
                      id="pstRatePct"
                      type="number"
                      step="0.01"
                      placeholder="Uses shop default"
                      disabled={form.pstExempt}
                      value={form.pstRatePct}
                      onChange={(e) => setForm({ ...form, pstRatePct: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">Customer GST number</Label>
                    <Input
                      id="gstNumber"
                      value={form.gstNumber}
                      onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pstNumber">Customer PST number</Label>
                    <Input
                      id="pstNumber"
                      value={form.pstNumber}
                      onChange={(e) => setForm({ ...form, pstNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border p-4 space-y-4">
                <div className="text-sm font-medium text-foreground">Rate overrides</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="laborRate">Labor rate ($/hr)</Label>
                    <Input
                      id="laborRate"
                      type="number"
                      step="0.01"
                      placeholder="Uses shop default"
                      value={form.laborRate}
                      onChange={(e) => setForm({ ...form, laborRate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partsMarkupPct">Parts markup (%)</Label>
                    <Input
                      id="partsMarkupPct"
                      type="number"
                      step="0.01"
                      placeholder="Uses shop default"
                      value={form.partsMarkupPct}
                      onChange={(e) => setForm({ ...form, partsMarkupPct: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editing ? "Save changes" : "Create customer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="py-6 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active customers
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground">{customers.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="py-6 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total A/R
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground">{formatCurrency(totalAR)}</div>
            <div className="mt-1 text-xs text-muted-foreground">Open balances company-wide</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="py-6 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              New this month
            </div>
            <div className="mt-2 text-3xl font-bold text-foreground">{newThisMonth}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Customer records created this month
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="py-6">
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">Top customers</div>
              <div className="text-xs text-muted-foreground">Ranked by service orders</div>
            </div>
            <ol className="mt-3 space-y-1 text-sm">
              {topCustomers.length === 0 && (
                <li className="text-center text-muted-foreground text-xs">No activity yet</li>
              )}
              {topCustomers.map(({ c, s }, i) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    <span className="text-muted-foreground mr-1">{i + 1}.</span>
                    <Link
                      to="/customers/$id"
                      params={{ id: c.id }}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {s.totalServiceOrders} service order{s.totalServiceOrders === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by company or phone..."
              className="pl-9 bg-muted/40 border-0"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
            <div>
              <div className="text-sm font-medium text-foreground">
                Directory · {customers.length} active
              </div>
              <div className="text-xs text-muted-foreground">Sorted A–Z by company name.</div>
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {filtered.length} of {customers.length}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="text-right">Open balance</TableHead>
                <TableHead>Last job</TableHead>
                <TableHead className="text-right">Total invoices</TableHead>
                <TableHead className="text-right">Total service orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {customers.length === 0 ? "No customers yet." : "No matching customers."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((c) => {
                const s = statsById.get(c.id) ?? emptyStat;
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => navigate({ to: "/customers/$id", params: { id: c.id } })}
                  >
                    <TableCell className="font-medium">
                      <Link to="/customers/$id" params={{ id: c.id }} className="hover:underline">
                        {c.company || c.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.units}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${s.openBalance > 0 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {formatCurrency(s.openBalance)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(s.lastJob)}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.totalInvoices}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s.totalServiceOrders}
                    </TableCell>
                    <TableCell
                      className="text-right space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild variant="outline" size="sm">
                        <Link to="/customers/$id" params={{ id: c.id }}>
                          View
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
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
