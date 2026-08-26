import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listReminders,
  createReminder,
  deleteReminder,
  updateReminderStatus,
} from "@/lib/reminders.functions";
import { listUnits } from "@/lib/units.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — RepairShop Billing" },
      { name: "description", content: "Preventive maintenance and MVI reminders." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(remindersQuery(context.activeShop.id));
    await context.queryClient.ensureQueryData(unitsQuery(context.activeShop.id));
  },
  component: RemindersPage,
});

function remindersQuery(shopId: string) {
  return queryOptions({
    queryKey: ["reminders", shopId],
    queryFn: () => listReminders({ data: shopId }),
  });
}
function unitsQuery(shopId: string) {
  return queryOptions({ queryKey: ["units", shopId], queryFn: () => listUnits({ data: shopId }) });
}

function RemindersPage() {
  const activeShop = Route.useRouteContext({ select: (s) => s.activeShop });
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(remindersQuery(activeShop.id));
  const { data: units } = useSuspenseQuery(unitsQuery(activeShop.id));
  const createFn = useServerFn(createReminder);
  const deleteFn = useServerFn(deleteReminder);
  const updateFn = useServerFn(updateReminderStatus);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    unitId: "",
    reminderType: "pm" as "pm" | "mvi",
    dueDate: "",
    dueOdometer: "",
    notes: "",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["reminders", activeShop.id] });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFn({
      data: {
        shopId: activeShop.id,
        unitId: form.unitId,
        reminderType: form.reminderType,
        dueDate: form.dueDate,
        dueOdometer: Number(form.dueOdometer) || 0,
        notes: form.notes,
      },
    });
    setOpen(false);
    setForm({ unitId: "", reminderType: "pm", dueDate: "", dueOdometer: "", notes: "" });
    invalidate();
  };

  const isOverdue = (dueDate: string | null) => dueDate && new Date(dueDate) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Reminders</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add reminder</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>New reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={form.unitId} onValueChange={(v) => setForm({ ...form, unitId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nickname ||
                          `${u.make ?? ""} ${u.model ?? ""}`.trim() ||
                          u.license_plate ||
                          "Unit"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.reminderType}
                    onValueChange={(v) => setForm({ ...form, reminderType: v as "pm" | "mvi" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pm">Preventive maintenance</SelectItem>
                      <SelectItem value="mvi">Motor vehicle inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due odometer</Label>
                <Input
                  type="number"
                  value={form.dueOdometer}
                  onChange={(e) => setForm({ ...form, dueOdometer: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Create reminder
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reminders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No reminders yet.
                  </TableCell>
                </TableRow>
              )}
              {data.reminders.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.unit?.nickname || "—"}</TableCell>
                  <TableCell>{r.unit?.customer?.name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.reminder_type === "pm" ? "PM" : "MVI"}</Badge>
                  </TableCell>
                  <TableCell>{r.due_date || "—"}</TableCell>
                  <TableCell>
                    {r.status === "completed" ? (
                      <Badge variant="secondary">Completed</Badge>
                    ) : isOverdue(r.due_date) ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge>Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {r.status !== "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateFn({ data: { id: r.id, status: "completed" } }).then(invalidate)
                        }
                      >
                        Mark done
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFn({ data: r.id }).then(invalidate)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
