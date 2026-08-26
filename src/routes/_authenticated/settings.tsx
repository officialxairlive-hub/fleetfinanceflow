import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  getShop,
  updateShop,
  getConnectedAccount,
  readShopSettings,
  LOGO_SIZE_PX,
  type LogoSize,
  type SuppliesBase,
} from "@/lib/settings.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RepairShop Billing" },
      {
        name: "description",
        content: "Configure shop details, tax rates, and payment integration.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(shopQuery(context.activeShop.id));
    await context.queryClient.ensureQueryData(accountQuery(context.activeShop.id));
  },
  component: SettingsPage,
});

function shopQuery(shopId: string) {
  return queryOptions({ queryKey: ["shop", shopId], queryFn: () => getShop({ data: shopId }) });
}
function accountQuery(shopId: string) {
  return queryOptions({
    queryKey: ["connected-account", shopId],
    queryFn: () => getConnectedAccount({ data: shopId }),
  });
}

function SettingsPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const qc = useQueryClient();
  const { data: shopData } = useSuspenseQuery(shopQuery(activeShop.id));
  const { data: accountData } = useSuspenseQuery(accountQuery(activeShop.id));
  const updateFn = useServerFn(updateShop);
  const shop = shopData.shop;
  const extra = readShopSettings(shop.settings);
  const logoUrl = shopData.logoUrl;
  const [form, setForm] = useState({
    name: shop.name,
    email: shop.email || "",
    phone: shop.phone || "",
    address: shop.address || "",
    defaultGstRate: String((shop.default_gst_rate ?? 0) * 100),
    defaultPstRate: String((shop.default_pst_rate ?? 0) * 100),
    defaultPartMarkupPct: String(extra.defaultPartMarkupPct ?? 0),
    defaultLaborRate: String(extra.defaultLaborRate ?? 0),
    shopSuppliesPct: String((extra.shopSuppliesPct ?? 0) * 100),
    suppliesBase: (extra.suppliesBase ?? "labor") as SuppliesBase,
    logoPath: extra.logoPath ?? "",
    logoSize: (extra.logoSize ?? "medium") as LogoSize,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const e = readShopSettings(shop.settings);
    setForm({
      name: shop.name,
      email: shop.email || "",
      phone: shop.phone || "",
      address: shop.address || "",
      defaultGstRate: String((shop.default_gst_rate ?? 0) * 100),
      defaultPstRate: String((shop.default_pst_rate ?? 0) * 100),
      defaultPartMarkupPct: String(e.defaultPartMarkupPct ?? 0),
      defaultLaborRate: String(e.defaultLaborRate ?? 0),
      shopSuppliesPct: String((e.shopSuppliesPct ?? 0) * 100),
      suppliesBase: (e.suppliesBase ?? "labor") as SuppliesBase,
      logoPath: e.logoPath ?? "",
      logoSize: (e.logoSize ?? "medium") as LogoSize,
    });
  }, [shop]);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${activeShop.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("shop-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      // Remove previous logo if present
      if (form.logoPath && form.logoPath !== path) {
        await supabase.storage.from("shop-logos").remove([form.logoPath]);
      }
      await updateFn({
        data: {
          shopId: activeShop.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          defaultGstRate: (Number(form.defaultGstRate) || 0) / 100,
          defaultPstRate: (Number(form.defaultPstRate) || 0) / 100,
          defaultPartMarkupPct: Number(form.defaultPartMarkupPct) || 0,
          defaultLaborRate: Number(form.defaultLaborRate) || 0,
          shopSuppliesPct: (Number(form.shopSuppliesPct) || 0) / 100,
          suppliesBase: form.suppliesBase,
          logoPath: path,
          logoSize: form.logoSize,
        },
      });
      setForm((f) => ({ ...f, logoPath: path }));
      qc.invalidateQueries({ queryKey: ["shop", activeShop.id] });
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    setUploading(true);
    try {
      if (form.logoPath) {
        await supabase.storage.from("shop-logos").remove([form.logoPath]);
      }
      await updateFn({
        data: {
          shopId: activeShop.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          defaultGstRate: (Number(form.defaultGstRate) || 0) / 100,
          defaultPstRate: (Number(form.defaultPstRate) || 0) / 100,
          defaultPartMarkupPct: Number(form.defaultPartMarkupPct) || 0,
          defaultLaborRate: Number(form.defaultLaborRate) || 0,
          shopSuppliesPct: (Number(form.shopSuppliesPct) || 0) / 100,
          suppliesBase: form.suppliesBase,
          logoPath: null,
          logoSize: form.logoSize,
        },
      });
      setForm((f) => ({ ...f, logoPath: "" }));
      qc.invalidateQueries({ queryKey: ["shop", activeShop.id] });
      toast.success("Logo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFn({
        data: {
          shopId: activeShop.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          defaultGstRate: (Number(form.defaultGstRate) || 0) / 100,
          defaultPstRate: (Number(form.defaultPstRate) || 0) / 100,
          defaultPartMarkupPct: Number(form.defaultPartMarkupPct) || 0,
          defaultLaborRate: Number(form.defaultLaborRate) || 0,
          shopSuppliesPct: (Number(form.shopSuppliesPct) || 0) / 100,
          suppliesBase: form.suppliesBase,
          logoPath: form.logoPath || null,
          logoSize: form.logoSize,
        },
      });
      toast.success("Shop settings saved");
      qc.invalidateQueries({ queryKey: ["shop", activeShop.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Shop details</CardTitle>
          <CardDescription>Displayed on invoices and estimates.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Shop logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Shop logo"
                    style={{
                      maxWidth: LOGO_SIZE_PX[form.logoSize],
                      maxHeight: LOGO_SIZE_PX[form.logoSize],
                    }}
                    className="object-contain rounded border border-border bg-background"
                  />
                ) : (
                  <div className="h-20 w-20 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                    No logo
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                      e.target.value = "";
                    }}
                  />
                  {form.logoPath && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={handleLogoRemove}
                    >
                      Remove logo
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG, or WebP. Shown next to your shop details on invoices, estimates, and
                work orders.
              </p>
              <div className="space-y-2 pt-2">
                <Label>Logo size</Label>
                <RadioGroup
                  value={form.logoSize}
                  onValueChange={(v) => setForm({ ...form, logoSize: v as LogoSize })}
                  className="flex gap-4"
                >
                  {(["small", "medium", "large"] as LogoSize[]).map((sz) => (
                    <div key={sz} className="flex items-center gap-2">
                      <RadioGroupItem value={sz} id={`logo-size-${sz}`} />
                      <Label htmlFor={`logo-size-${sz}`} className="capitalize font-normal">
                        {sz}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({LOGO_SIZE_PX[sz]}px)
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Applies to invoices, estimates, and work orders. Save to apply.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Shop name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Default GST (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.defaultGstRate}
                  onChange={(e) => setForm({ ...form, defaultGstRate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Default PST (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.defaultPstRate}
                  onChange={(e) => setForm({ ...form, defaultPstRate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-border">
              <div className="space-y-2">
                <Label>Default Part Markup (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.defaultPartMarkupPct}
                  onChange={(e) => setForm({ ...form, defaultPartMarkupPct: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Shop Labor Rate ($/hr)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.defaultLaborRate}
                  onChange={(e) => setForm({ ...form, defaultLaborRate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Shop Supplies (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.shopSuppliesPct}
                    onChange={(e) => setForm({ ...form, shopSuppliesPct: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-2">
                    {["0", "2", "3", "5"].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        size="sm"
                        variant={form.shopSuppliesPct === preset ? "default" : "outline"}
                        onClick={() => setForm({ ...form, shopSuppliesPct: preset })}
                      >
                        {preset}%
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set to 0% to remove shop supplies from new work orders entirely.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Charge shop supplies on</Label>
                  <Select
                    value={form.suppliesBase}
                    onValueChange={(v) => setForm({ ...form, suppliesBase: v as SuppliesBase })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="labor">Labor total only</SelectItem>
                      <SelectItem value="labor_parts">Labor + parts</SelectItem>
                      <SelectItem value="subtotal">Full subtotal</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Shop supplies are always a percentage fee in the invoice summary, never a line
                    item.
                  </p>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Online payments</CardTitle>
          <CardDescription>
            Connect your Stripe account to accept online invoice payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {accountData.account?.status === "active" ? (
            <p className="text-sm text-foreground">Stripe account connected.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Stripe Connect integration coming soon. Invoices can still be marked paid manually.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
