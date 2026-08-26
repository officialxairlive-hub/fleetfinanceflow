import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats, getRevenueChart } from "@/lib/dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/invoices.utils";
import { Wrench } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RepairShop Billing" },
      {
        name: "description",
        content: "Truck repair shop dashboard with revenue, reminders, and outstanding invoices.",
      },
    ],
  }),
  beforeLoad: ({ context }) => {
    if (context.isCustomer) {
      throw redirect({ to: "/portal" });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(dashboardStatsQueryOptions(context.activeShop.id));
    await context.queryClient.ensureQueryData(revenueChartQueryOptions(context.activeShop.id));
  },
  component: DashboardPage,
});

function dashboardStatsQueryOptions(shopId: string) {
  return queryOptions({
    queryKey: ["dashboard", "stats", shopId],
    queryFn: () => getDashboardStats({ data: shopId }),
  });
}

function revenueChartQueryOptions(shopId: string) {
  return queryOptions({
    queryKey: ["dashboard", "revenue", shopId],
    queryFn: () => getRevenueChart({ data: shopId }),
  });
}

function DashboardPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const { data: stats } = useSuspenseQuery(dashboardStatsQueryOptions(activeShop.id));
  const { data: chart } = useSuspenseQuery(revenueChartQueryOptions(activeShop.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of {activeShop.name}</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/invoices/new" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Create Work Order
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue this month (net of tax)"
          value={formatCurrency(stats.revenueThisMonth)}
        />
        <StatCard title="Collected this month" value={formatCurrency(stats.collectedThisMonth)} />
        <StatCard title="Outstanding" value={formatCurrency(stats.outstandingAmount)} />
        <StatCard title="Overdue" value={formatCurrency(stats.overdueAmount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Labor billed (MTD)" value={formatCurrency(stats.laborRevenueThisMonth)} />
        <StatCard title="Parts billed (MTD)" value={formatCurrency(stats.partsRevenueThisMonth)} />
        <StatCard title="Shop fees (MTD)" value={formatCurrency(stats.feeRevenueThisMonth)} />
        <StatCard title="Tax collected (MTD)" value={formatCurrency(stats.taxCollectedThisMonth)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Customers" value={stats.customerCount} />
        <StatCard title="Open invoices" value={stats.openInvoiceCount} />
        <StatCard title="Overdue invoices" value={stats.overdueInvoiceCount} />
        <StatCard
          title="Average invoice (MTD)"
          value={formatCurrency(stats.averageInvoiceThisMonth)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Revenue (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-foreground">
              {stats.overdueReminderCount}
            </div>
            <p className="text-sm text-muted-foreground">Overdue PM/MVI reminders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
