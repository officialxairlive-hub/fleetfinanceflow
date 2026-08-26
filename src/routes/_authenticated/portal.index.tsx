import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPortalOverview } from "@/lib/portal.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/invoices.utils";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({
    meta: [
      { title: "Customer Portal — RepairShop Billing" },
      {
        name: "description",
        content: "Track repair progress, pending balances, and your fleet in one place.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(overviewQuery(context.activeShop.id));
  },
  component: PortalHome,
});

function overviewQuery(shopId: string) {
  return queryOptions({
    queryKey: ["portal", "overview", shopId],
    queryFn: () => getPortalOverview({ data: shopId }),
  });
}

function PortalHome() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const { data } = useSuspenseQuery(overviewQuery(activeShop.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome, {data.customer.name}</h1>
        <p className="text-muted-foreground">
          Your repairs, balances, and fleet with {activeShop.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending balance" value={formatCurrency(data.summary.outstanding)} />
        <Stat label="Overdue" value={formatCurrency(data.summary.overdue)} tone="danger" />
        <Stat label="In the shop" value={String(data.summary.inShopCount)} />
        <Stat label="Your units" value={String(data.summary.unitCount)} />
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Active repairs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.activeWork.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing in the shop right now.</p>
          )}
          {data.activeWork.map((inv) => (
            <div
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
            >
              <div>
                <div className="font-medium">{inv.invoice_number}</div>
                <div className="text-xs text-muted-foreground">
                  {[
                    inv.unit?.unit_number ? `#${inv.unit.unit_number}` : null,
                    inv.unit?.nickname,
                    inv.unit?.vin ? `VIN ${inv.unit.vin}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No unit"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize">
                  {(inv.work_status ?? "received").replace("_", " ")}
                </Badge>
                <span className="tabular-nums text-sm">{formatCurrency(inv.balance_due)} due</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Latest updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.updates.length === 0 && (
            <p className="text-muted-foreground">No repair updates yet.</p>
          )}
          {data.updates.slice(0, 8).map((u) => (
            <div key={u.id} className="border-b border-border pb-2 last:border-0">
              <span className="text-muted-foreground">{(u.created_at ?? "").slice(0, 10)} · </span>
              <span className="font-medium">{u.invoice?.invoice_number ?? "Work order"}</span>
              <span className="capitalize text-muted-foreground">
                {" "}
                · {(u.work_status ?? "").replace("_", " ")}
              </span>
              {u.note && <div className="text-muted-foreground">{u.note}</div>}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/portal/invoices">Billing history</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/portal/units">My fleet</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/portal/complaints">Submit complaint</Link>
        </Button>
      </div>
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
