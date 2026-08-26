import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Truck,
  Wrench,
  Package,
  FileText,
  ClipboardList,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  CircleDollarSign,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  shopName: string;
  isCustomer?: boolean;
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function StaffNav({ activePath }: { activePath: string }) {
  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/fleets", label: "Fleets", icon: Truck },
    { to: "/units", label: "Units", icon: Truck },
    { to: "/services", label: "Services", icon: Wrench },
    { to: "/parts", label: "Parts", icon: Package },
    { to: "/invoices", label: "Invoices", icon: FileText },
    { to: "/estimates", label: "Estimates", icon: ClipboardList },
    { to: "/reminders", label: "Reminders", icon: Bell },
    { to: "/complaints", label: "Complaints", icon: MessageSquare },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {links.map((link) => (
        <NavItem key={link.to} {...link} active={activePath.startsWith(link.to)} />
      ))}
    </nav>
  );
}

function CustomerNav({ activePath }: { activePath: string }) {
  const links = [
    { to: "/portal", label: "Portal", icon: LayoutDashboard },
    { to: "/portal/invoices", label: "Invoices", icon: FileText },
    { to: "/portal/units", label: "Units", icon: Truck },
    { to: "/portal/complaints", label: "Complaints", icon: MessageSquare },
  ];

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {links.map((link) => (
        <NavItem key={link.to} {...link} active={activePath.startsWith(link.to)} />
      ))}
    </nav>
  );
}

export function DashboardShell({ children, shopName, isCustomer }: DashboardShellProps) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <span className="truncate">{shopName || "RepairShop"}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          {isCustomer ? <CustomerNav activePath={pathname} /> : <StaffNav activePath={pathname} />}
        </div>
        <div className="border-t border-border p-4">
          <div className="mb-2 text-xs text-muted-foreground truncate">
            {user?.email ?? "Signed in"}
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b border-border px-4">
                <span className="font-semibold text-foreground">{shopName || "RepairShop"}</span>
              </div>
              <div className="py-4">
                {isCustomer ? (
                  <CustomerNav activePath={pathname} />
                ) : (
                  <StaffNav activePath={pathname} />
                )}
              </div>
              <div className="border-t border-border p-4">
                <div className="mb-2 text-xs text-muted-foreground truncate">
                  {user?.email ?? "Signed in"}
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <span className="truncate">{shopName || "RepairShop"}</span>
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
