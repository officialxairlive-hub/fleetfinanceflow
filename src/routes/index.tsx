import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Package, CreditCard, Users, Wrench, ArrowRight, CheckCircle2, FileText } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fleet Finance Flow — Next-Gen Billing for Modern Fleets" },
      {
        name: "description",
        content:
          "A clean billing platform for modern fleets. Manage customers, units, parts, estimates, invoices, and online payments.",
      },
      { property: "og:title", content: "Fleet Finance Flow — Next-Gen Billing for Modern Fleets" },
      {
        property: "og:description",
        content:
          "A clean billing platform for modern fleets. Manage customers, units, parts, estimates, invoices, and online payments.",
      },
    ],
  }),
  component: LandingPage,
});

function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Row 1 */}
      <rect x="0" y="0" width="30" height="30" rx="8" fill="white" />
      <path d="M15 9v12M9 15h12" stroke="#0D1117" strokeWidth="3.5" strokeLinecap="round" />
      
      <rect x="35" y="0" width="30" height="30" rx="8" fill="white" />
      <path d="M43 15h14" stroke="#0D1117" strokeWidth="3.5" strokeLinecap="round" />
      
      <rect x="70" y="0" width="30" height="30" rx="8" fill="#2563FF" />
      <path d="M78 12h14M78 18h14" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Row 2 */}
      <rect x="0" y="35" width="30" height="30" rx="8" fill="white" />
      <path d="M10 40l10 10M20 40l-10 10" stroke="#0D1117" strokeWidth="3.5" strokeLinecap="round" />
      
      <rect x="35" y="35" width="30" height="30" rx="8" fill="white" />
      <circle cx="50" cy="42" r="2.5" fill="#0D1117" />
      <circle cx="50" cy="58" r="2.5" fill="#0D1117" />
      <path d="M42 50h16" stroke="#0D1117" strokeWidth="3.5" strokeLinecap="round" />
      
      <rect x="70" y="35" width="30" height="30" rx="8" fill="white" />
      <path d="M79 57V43h10M79 50h7" stroke="#0D1117" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Row 3 */}
      <rect x="0" y="70" width="30" height="30" rx="8" fill="white" />
      <path d="M9 92V78h10M9 85h7" stroke="#0D1117" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      
      <rect x="35" y="70" width="30" height="30" rx="8" fill="white" />
      <path d="M44 92V78h10M44 85h7" stroke="#0D1117" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      
      <rect x="70" y="70" width="30" height="30" rx="8" fill="#2563FF" />
      <path d="M79 92V84a6 6 0 0 1 6-6h7" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-3 font-semibold text-xl text-white tracking-tight">
            <Logo className="w-8 h-8" />
            <div className="flex flex-col -gap-1 leading-tight">
              <span>Fleet Finance <span className="text-[#2563FF]">Flow</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-white">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="rounded-full shadow-sm bg-[#2563FF] hover:bg-[#2563FF]/90 text-white transition-all">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-40 lg:pt-48 lg:pb-56 bg-[#0D1117]">
          {/* Subtle geometric grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
            {/* Modern Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#161B22] border border-[#30363D] mb-8">
              <span className="flex h-2 w-2 rounded-full bg-[#2563FF]"></span>
              <span className="text-sm font-medium text-white/90 tracking-wide">Welcome to the new standard in fleet billing</span>
            </div>
            
            <div className="mx-auto max-w-4xl">
              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl text-balance leading-[1.1]">
                Next-Gen Billing for <span className="text-[#2563FF]">Modern Fleets</span>
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-xl text-[#8B949E] sm:text-2xl text-balance font-medium leading-relaxed">
                Streamline operations, manage estimates, and collect online payments with an interface that just makes sense.
              </p>
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto rounded bg-[#2563FF] text-white hover:bg-[#2563FF]/90 h-14 px-10 text-lg font-bold transition-all">
                  <Link to="/auth">
                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded bg-transparent border-[#30363D] text-white hover:bg-[#161B22] hover:text-white h-14 px-10 text-lg font-semibold transition-all">
                  <Link to="/auth">View Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-24 bg-[#0D1117] relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance leading-tight">
                  Everything your shop needs, seamlessly integrated.
                </h2>
                <p className="mt-6 text-lg text-[#8B949E] leading-relaxed">
                  We built Fleet Finance Flow to remove the friction from daily shop management. From the moment a unit rolls in, to the final invoice paid online.
                </p>
                
                <ul className="mt-10 space-y-6">
                  {[
                    "Track customers, trailers, and drivers",
                    "Manage parts inventory and labor rates",
                    "Convert estimates to invoices instantly",
                    "Secure online payments via Stripe"
                  ].map((feature, i) => (
                    <li key={i} className="flex gap-4 items-center group">
                      <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-[#161B22] border border-white/5 text-[#2563FF] group-hover:bg-[#2563FF] group-hover:text-white transition-colors duration-300">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-lg font-medium text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-xl overflow-hidden ring-1 ring-[#30363D]">
                <img 
                  src="/modern_truck_warehouse.jpg" 
                  alt="Modern Fleet Operations" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-[#0A0D12] border-y border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
                Core capabilities
              </h2>
              <p className="mt-4 text-lg text-[#8B949E] text-balance">
                Everything you need to run your shop's billing and operations in one place.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Truck}
                title="Fleet Records"
                description="Log complete service history and maintenance schedules for every vehicle and driver."
              />
              <FeatureCard
                icon={Package}
                title="Parts Inventory"
                description="Monitor stock levels, track supplier costs, and set automatic reorder thresholds."
              />
              <FeatureCard
                icon={Wrench}
                title="Labor Rates"
                description="Standardize your service catalog with fixed hours and preset shop rates."
              />
              <FeatureCard
                icon={FileText}
                title="Invoicing & Billing"
                description="Generate invoices from approved estimates, apply taxes, and monitor accounts receivable."
              />
              <FeatureCard
                icon={CreditCard}
                title="Online Payments"
                description="Process credit cards via Stripe so customers can pay directly from their invoice link."
              />
              <FeatureCard
                icon={Users}
                title="Customer Portal"
                description="Provide clients self-serve access to their repair history and open balances."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-[#2563FF]">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl text-balance">
              Ready to streamline your operations?
            </h2>
            <p className="mt-6 text-xl text-white/90 max-w-2xl mx-auto font-medium">
              Join modern fleets who have transformed their billing and management workflow today.
            </p>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="rounded bg-white text-[#0D1117] hover:bg-white/90 h-14 px-10 text-lg font-bold transition-all">
                <Link to="/auth">Create Your Workspace</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#0D1117] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 font-semibold text-lg text-white">
            <Logo className="w-6 h-6" />
            <span>Fleet Finance Flow</span>
          </div>
          <div className="text-sm text-[#8B949E]">
            © {new Date().getFullYear()} Fleet Finance Flow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-[#30363D] bg-[#161B22] rounded-xl shadow-none">
      <CardContent className="p-8">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded bg-[#21262D] text-[#2563FF]">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
        <p className="mt-3 text-base text-[#8B949E] leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
