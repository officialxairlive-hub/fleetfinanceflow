import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getUserMemberships, linkCustomerByEmail } from "@/lib/membership.functions";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }

    let memberships = (await getUserMemberships()).memberships;
    if (memberships.length === 0) {
      const linkResult = await linkCustomerByEmail();
      if (linkResult.linked) {
        memberships = (await getUserMemberships()).memberships;
      }
    }

    if (memberships.length === 0) {
      throw redirect({ to: "/onboarding" });
    }

    const activeShop = memberships[0].shop;
    const isCustomer = memberships.every((m) => m.role === "customer");
    return { user: data.user, memberships, activeShop, isCustomer };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const context = Route.useRouteContext({
    select: (s) => ({ activeShop: s.activeShop, isCustomer: s.isCustomer }),
  });

  return (
    <DashboardShell shopName={context.activeShop.name} isCustomer={context.isCustomer}>
      <Outlet />
    </DashboardShell>
  );
}
