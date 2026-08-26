import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getDashboardStats, getRevenueChart } from "@/lib/dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/invoices.utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — RepairShop Billing" },
      { name: "description", content: "Revenue reports and key shop metrics." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(statsQuery(context.activeShop.id));
    await context.queryClient.ensureQueryData(chartQuery(context.activeShop.id));
  },
  component: ReportsPage,
});

function statsQuery(shopId: string) {
  return queryOptions({
    queryKey: ["stats", shopId],
    queryFn: () => getDashboardStats({ data: shopId }),
  });
}
function chartQuery(shopId: string) {
  return queryOptions({
    queryKey: ["revenue-chart", shopId],
    queryFn: () => getRevenueChart({ data: shopId }),
  });
}

function ReportsPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const { data: stats } = useSuspenseQuery(statsQuery(activeShop.id));
  const { data: chart } = useSuspenseQuery(chartQuery(activeShop.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue this month" value={formatCurrency(stats.revenueThisMonth)} />
        <StatCard label="Outstanding" value={formatCurrency(stats.outstandingAmount)} />
        <StatCard label="Open invoices" value={String(stats.openInvoiceCount)} />
        <StatCard label="Customers" value={String(stats.customerCount)} />
      </div>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Revenue — last 6 months</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
