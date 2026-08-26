import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  getReceivables,
  deleteInvoice,
  updateInvoiceStatus,
  sendPaymentReminder,
  recordPayment,
} from "@/lib/invoices.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { Eye, BellRing, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoices/")({
  head: () => ({
    meta: [
      { title: "Invoices & Payment Status — RepairShop Billing" },
      {
        name: "description",
        content: "Track paid, unpaid, and overdue invoices with quick-action payment reminders.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(receivablesQuery(context.activeShop.id));
  },
  component: InvoicesPage,
});

function receivablesQuery(shopId: string) {
  return queryOptions({
    queryKey: ["receivables", shopId],
    queryFn: () => getReceivables({ data: shopId }),
  });
}

type Filter = "all" | "unpaid" | "overdue" | "paid" | "draft";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unpaid", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
  { key: "draft", label: "Drafts" },
];

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  unpaid: "default",
  partial: "default",
  paid: "secondary",
  overdue: "destructive",
  cancelled: "outline",
};

function InvoicesPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(receivablesQuery(activeShop.id));
  const deleteFn = useServerFn(deleteInvoice);
  const statusFn = useServerFn(updateInvoiceStatus);
  const reminderFn = useServerFn(sendPaymentReminder);
  const paymentFn = useServerFn(recordPayment);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [payTarget, setPayTarget] = useState<{
    id: string;
    number: string;
    balance: number;
  } | null>(null);

  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["receivables", activeShop.id] }),
      qc.invalidateQueries({ queryKey: ["invoices", activeShop.id] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.invoices.filter((inv) => {
      const status = inv.payment_status;
      if (filter === "unpaid" && !["unpaid", "partial", "overdue"].includes(status)) return false;
      if (filter === "overdue" && status !== "overdue") return false;
      if (filter === "paid" && status !== "paid") return false;
      if (filter === "draft" && status !== "draft") return false;
      if (!term) return true;
      const haystack = [
        inv.invoice_number,
        inv.customer?.name,
        inv.unit?.unit_number,
        inv.unit?.nickname,
        inv.unit?.vin,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [data.invoices, filter, search]);

  const remind = async (id: string) => {
    try {
      const res = await reminderFn({ data: { invoiceId: id } });
      await invalidate();
      toast.success(
        res.emailed
          ? "Reminder emailed to the customer"
          : "Reminder flagged in the customer portal",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reminder");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Payment status tracker and receivables aging.
          </p>
        </div>
        <Button asChild>
          <Link to="/invoices/new">New invoice</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Outstanding" value={formatCurrency(data.summary.outstanding)} />
        <Stat label="Overdue" value={formatCurrency(data.summary.overdue)} tone="danger" />
        <Stat label="Unpaid invoices" value={String(data.summary.unpaidCount)} />
        <Stat label="Paid invoices" value={String(data.summary.paidCount)} />
      </div>

      <Card className="border-border bg-card">
        <CardContent className="flex flex-wrap gap-4 p-4 text-sm">
          {Object.entries(data.summary.aging).map(([bucket, amount]) => (
            <div key={bucket} className="min-w-24">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {bucket === "current" ? "Current" : `${bucket} days`}
              </div>
              <div className="tabular-nums font-medium">{formatCurrency(amount)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search number, customer, unit, VIN…"
          className="sm:max-w-xs"
        />
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    No invoices match this filter.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.customer?.name || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {inv.unit
                      ? [
                          inv.unit.unit_number ? `#${inv.unit.unit_number}` : null,
                          inv.unit.nickname,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "—"
                      : "—"}
                    {inv.unit?.vin && (
                      <div className="text-xs text-muted-foreground">VIN {inv.unit.vin}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {inv.due_date || "—"}
                    {inv.days_overdue > 0 && (
                      <div className="text-xs text-destructive">{inv.days_overdue} days late</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(inv.total ?? 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(inv.amount_paid)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatCurrency(inv.balance_due)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor[inv.payment_status] ?? "outline"}>
                      {inv.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {inv.last_reminder_at
                      ? `${inv.last_reminder_at.slice(0, 10)} (${inv.reminder_count})`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-1 whitespace-nowrap">
                    <Button asChild variant="outline" size="sm" title="View invoice">
                      <Link to="/invoices/$id" params={{ id: inv.id }}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {inv.payment_status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          statusFn({ data: { id: inv.id, status: "sent" } }).then(invalidate)
                        }
                      >
                        Send
                      </Button>
                    )}
                    {inv.balance_due > 0 && inv.payment_status !== "draft" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Record payment"
                          onClick={() =>
                            setPayTarget({
                              id: inv.id,
                              number: inv.invoice_number,
                              balance: inv.balance_due,
                            })
                          }
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Send payment reminder"
                          onClick={() => remind(inv.id)}
                        >
                          <BellRing className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFn({ data: inv.id }).then(invalidate)}
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

      <RecordPaymentDialog
        target={payTarget}
        onOpenChange={(open) => !open && setPayTarget(null)}
        onSubmit={async (values) => {
          if (!payTarget) return;
          await paymentFn({ data: { invoiceId: payTarget.id, ...values } });
          await invalidate();
          setPayTarget(null);
          toast.success("Payment recorded");
        }}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div
          className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "danger" ? "text-destructive" : "text-foreground"}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecordPaymentDialog({
  target,
  onOpenChange,
  onSubmit,
}: {
  target: { id: string; number: string; balance: number } | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    amount: number;
    method: "cash" | "cheque" | "etransfer" | "card" | "other";
    reference: string;
    paidAt: string;
  }) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "cheque" | "etransfer" | "card" | "other">(
    "etransfer",
  );
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const open = !!target;
  const value = amount === "" ? (target?.balance ?? 0) : Number(amount);

  const submit = async () => {
    if (!target || !(value > 0)) return;
    setSaving(true);
    try {
      await onSubmit({ amount: value, method, reference, paidAt });
      setAmount("");
      setReference("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment {target ? `— ${target.number}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              placeholder={target ? target.balance.toFixed(2) : "0.00"}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Balance due {formatCurrency(target?.balance ?? 0)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="etransfer">E-transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Cheque #, confirmation code…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !(value > 0)}>
            {saving ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
