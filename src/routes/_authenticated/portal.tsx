import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/portal")({
  beforeLoad: ({ context }) => {
    if (!context.isCustomer) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
