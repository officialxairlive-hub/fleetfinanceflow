/**
 * Server-only notification helpers.
 *
 * Email is delivered through Resend (via the Lovable connector gateway).
 * Payment reminders always land in the customer portal (a `payment_reminders`
 * row); emailing is best-effort on top of that. When Resend isn't connected
 * yet these helpers raise `EMAIL_NOT_CONFIGURED` so callers can fall back to
 * portal-only / mail-client behaviour instead of failing the action.
 */

export const EMAIL_NOT_CONFIGURED = "EMAIL_NOT_CONFIGURED";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const DEFAULT_FROM = "onboarding@resend.dev";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#111827;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function wrap(title: string, bodyHtml: string, footer?: string) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:19px;color:#111827;">${escapeHtml(title)}</h1>
    ${bodyHtml}
    ${footer ? `<p style="margin:22px 0 0;font-size:12px;color:#6b7280;">${escapeHtml(footer)}</p>` : ""}
  </div>
</body></html>`;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string | null;
  fromName?: string;
}

async function sendEmail({ to, subject, html, replyTo, fromName }: SendArgs) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) throw new Error(EMAIL_NOT_CONFIGURED);

  const fromAddress = process.env["RESEND_FROM_EMAIL"] || DEFAULT_FROM;
  const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[resend] send failed [${response.status}]: ${body}`);
    let detail = body;
    try {
      const parsed = JSON.parse(body) as { message?: string; error?: string };
      detail = parsed.message || parsed.error || body;
    } catch {
      /* keep raw body */
    }
    throw new Error(detail || `Email provider returned ${response.status}`);
  }

  const result = (await response.json()) as { id?: string };
  return { sent: true, id: result.id ?? null };
}

export interface ReminderEmailInput {
  to: string;
  customerName: string;
  shopName: string;
  invoiceNumber: string;
  balanceDue: number;
  daysOverdue: number;
  message: string;
  replyTo?: string | null;
}

export async function sendReminderEmail(input: ReminderEmailInput) {
  const overdue =
    input.daysOverdue > 0
      ? `<p style="margin:0 0 14px;font-size:15px;color:#b91c1c;">This invoice is ${input.daysOverdue} day(s) past due.</p>`
      : "";
  const html = wrap(
    `Payment reminder — Invoice ${input.invoiceNumber}`,
    `${paragraphs(`Hi ${input.customerName},`)}${paragraphs(input.message)}${overdue}
     <p style="margin:0 0 14px;font-size:15px;color:#111827;"><strong>Balance due: $${input.balanceDue.toFixed(
       2,
     )}</strong></p>`,
    `Sent by ${input.shopName}.`,
  );

  return sendEmail({
    to: input.to,
    subject: `Payment reminder — Invoice ${input.invoiceNumber}`,
    html,
    fromName: input.shopName,
    replyTo: input.replyTo ?? null,
  });
}

export interface InvoiceEmailInput {
  to: string;
  subject: string;
  message: string;
  customerName: string;
  shopName: string;
  invoiceNumber: string;
  total: number;
  invoiceUrl: string;
  replyTo?: string | null;
}

export async function sendInvoiceEmail(input: InvoiceEmailInput) {
  const cta = input.invoiceUrl
    ? `<p style="margin:18px 0;"><a href="${escapeHtml(input.invoiceUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:14px;">View invoice ${escapeHtml(
        input.invoiceNumber,
      )}</a></p>`
    : "";
  const html = wrap(
    `Invoice ${input.invoiceNumber} from ${input.shopName}`,
    `${paragraphs(input.message)}
     <p style="margin:0 0 6px;font-size:15px;color:#111827;"><strong>Total: $${input.total.toFixed(
       2,
     )}</strong></p>${cta}`,
    `Sent by ${input.shopName}.`,
  );

  return sendEmail({
    to: input.to,
    subject: input.subject,
    html,
    fromName: input.shopName,
    replyTo: input.replyTo ?? null,
  });
}
