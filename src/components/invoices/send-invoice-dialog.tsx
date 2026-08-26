import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendInvoiceByEmail } from "@/lib/invoices.functions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  defaultEmail: string;
  invoiceNumber: string;
  shopName: string;
  total: string;
  previewUrl: string;
  onSent?: () => Promise<unknown> | void;
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
  defaultEmail,
  invoiceNumber,
  shopName,
  total,
  previewUrl,
  onSent,
}: Props) {
  const sendFn = useServerFn(sendInvoiceByEmail);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState(`Invoice ${invoiceNumber} from ${shopName}`);
  const [message, setMessage] = useState(
    `Hello,\n\nPlease find your invoice ${invoiceNumber} for ${total} below.\n\nView invoice: ${previewUrl}\n\nThank you,\n${shopName}`,
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setEmail(defaultEmail);
  }, [open, defaultEmail]);

  const openMailClient = () => {
    const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = url;
  };

  const handleSend = async () => {
    if (!email) {
      toast.error("Recipient email is required");
      return;
    }
    setSending(true);
    try {
      const res = await sendFn({
        data: { invoiceId, to: email, subject, message, invoiceUrl: previewUrl },
      });
      await onSent?.();
      if (res.emailed) {
        toast.success(`Invoice ${invoiceNumber} emailed to ${email}`);
        onOpenChange(false);
      } else if (!res.configured) {
        toast.warning(
          "Email service isn't connected yet — add your Resend API key in Settings → Secrets. Opening your mail app instead; the send was logged on the invoice.",
        );
        openMailClient();
        onOpenChange(false);
      } else {
        toast.error(
          res.error || "The email provider rejected this message. It's logged on the invoice.",
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!sending ? onOpenChange(o) : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send invoice</DialogTitle>
          <DialogDescription>
            Review the recipient, subject and message. The invoice link is included and the send is
            logged on the invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Emails are delivered through Resend. To send from your own shop address, verify your
            domain with Resend and set <code className="font-mono">RESEND_FROM_EMAIL</code> in your
            project secrets — until then messages come from the default Resend sender.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-1 h-4 w-4" />
            )}
            {sending ? "Sending…" : "Send email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
