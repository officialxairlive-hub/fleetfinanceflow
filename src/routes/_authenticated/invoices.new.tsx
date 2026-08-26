import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCustomers } from "@/lib/customers.functions";
import { listUnits } from "@/lib/units.functions";
import { listServices } from "@/lib/services.functions";
import { listParts } from "@/lib/parts.functions";
import { getShop } from "@/lib/settings.functions";
import { createInvoice } from "@/lib/invoices.functions";
import { InvoiceBuilder } from "@/components/invoices/invoice-builder";
import { generateInvoiceNumber } from "@/lib/invoices.utils";
import { readShopSettings } from "@/lib/settings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/invoices/new")({
  head: () => ({
    meta: [
      { title: "New Invoice — RepairShop Billing" },
      { name: "description", content: "Create a new invoice." },
    ],
  }),
  loader: async ({ context }) => {
    const shopId = context.activeShop.id;
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["customers", shopId],
        queryFn: () => listCustomers({ data: shopId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["units", shopId],
        queryFn: () => listUnits({ data: shopId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["services", shopId],
        queryFn: () => listServices({ data: shopId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["parts", shopId],
        queryFn: () => listParts({ data: shopId }),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["shop", shopId],
        queryFn: () => getShop({ data: shopId }),
      }),
    ]);
  },
  component: NewInvoicePage,
});

function NewInvoicePage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const navigate = useNavigate();
  const shopId = activeShop.id;
  const { data: customers } = useSuspenseQuery(
    queryOptions({
      queryKey: ["customers", shopId],
      queryFn: () => listCustomers({ data: shopId }),
    }),
  );
  const { data: units } = useSuspenseQuery(
    queryOptions({ queryKey: ["units", shopId], queryFn: () => listUnits({ data: shopId }) }),
  );
  const { data: services } = useSuspenseQuery(
    queryOptions({ queryKey: ["services", shopId], queryFn: () => listServices({ data: shopId }) }),
  );
  const { data: parts } = useSuspenseQuery(
    queryOptions({ queryKey: ["parts", shopId], queryFn: () => listParts({ data: shopId }) }),
  );
  const { data: shopData } = useSuspenseQuery(
    queryOptions({ queryKey: ["shop", shopId], queryFn: () => getShop({ data: shopId }) }),
  );
  const createFn = useServerFn(createInvoice);
  const extra = readShopSettings(shopData.shop.settings);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">New invoice</h1>
      <InvoiceBuilder
        customers={customers.customers}
        units={units.units}
        services={services.services}
        parts={parts.parts}
        shopId={shopId}
        defaultGstRate={shopData.shop.default_gst_rate ?? 0}
        defaultPstRate={shopData.shop.default_pst_rate ?? 0}
        defaultPartMarkupPct={extra.defaultPartMarkupPct ?? 0}
        defaultLaborRate={extra.defaultLaborRate ?? 0}
        shopSuppliesPct={extra.shopSuppliesPct ?? 0}
        suppliesBase={extra.suppliesBase ?? "labor"}
        defaultNumber={generateInvoiceNumber()}
        numberLabel="Invoice number"
        submitLabel="Create invoice"
        onSubmit={async (d) => {
          try {
            const res = await createFn({
              data: {
                shopId,
                customerId: d.customerId,
                unitId: d.unitId,
                invoiceNumber: d.invoiceNumber,
                status: "draft",
                issueDate: d.issueDate,
                dueDate: d.dueDate,
                odometer: d.odometer,
                gstRate: d.gstRate,
                pstRate: d.pstRate,
                suppliesPct: d.suppliesPct,
                notes: d.notes,
                items: d.items.map((i) => ({
                  itemType: i.itemType,
                  description: i.description,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  markupPct: i.markupPct,
                  hours: i.hours ?? null,
                  technician: i.technician ?? null,
                  partId: i.partId,
                  serviceId: i.serviceId,
                })),
              },
            });
            toast.success("Invoice created");
            navigate({ to: "/invoices/$id", params: { id: res.invoice.id } });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create invoice");
          }
        }}
      />
    </div>
  );
}
