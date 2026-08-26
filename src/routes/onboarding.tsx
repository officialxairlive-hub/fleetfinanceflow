import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useServerFn } from "@tanstack/react-start";
import { createShop } from "@/lib/onboarding.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleDollarSign } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Create your shop — RepairShop Billing" },
      { name: "description", content: "Set up your truck repair shop and start billing." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const createShopFn = useServerFn(createShop);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gst, setGst] = useState(5);
  const [pst, setPst] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/auth", replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const slugValue = slug.trim().toLowerCase().replace(/\s+/g, "-");
      await createShopFn({
        data: {
          name: name.trim(),
          slug: slugValue,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          defaultGstRate: gst / 100,
          defaultPstRate: pst / 100,
        },
      });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link to="/" className="mb-8 flex items-center gap-2 text-2xl font-semibold text-foreground">
        <CircleDollarSign className="h-7 w-7 text-primary" />
        RepairShop Billing
      </Link>

      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">Create your shop</CardTitle>
          <CardDescription>
            Tell us about your shop to start managing customers and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Shop name</Label>
              <Input
                id="shop-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Acme Truck Repair"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-slug">Shop URL slug</Label>
              <Input
                id="shop-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
                placeholder="acme-truck-repair"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and dashes only.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shop-email">Email</Label>
                <Input
                  id="shop-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-phone">Phone</Label>
                <Input id="shop-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-address">Address</Label>
              <Input
                id="shop-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gst-rate">Default GST (%)</Label>
                <Input
                  id="gst-rate"
                  type="number"
                  value={gst}
                  onChange={(e) => setGst(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pst-rate">Default PST (%)</Label>
                <Input
                  id="pst-rate"
                  type="number"
                  value={pst}
                  onChange={(e) => setPst(Number(e.target.value))}
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating shop..." : "Create shop"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
