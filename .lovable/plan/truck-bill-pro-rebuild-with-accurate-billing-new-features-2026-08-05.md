# Truck Bill Pro — rebuild with accurate billing + new features

## What this is

Bring the uploaded Truck Bill Pro codebase into this project as the starting base, rewrite all money math so it is provably correct, then add the four requested feature areas.

## Phase 1 — Import the base

- Enable Lovable Cloud (database, auth, storage, server functions) and apply the uploaded database migrations: shops, customers, units (trucks), services, parts, invoices + invoice items, estimates + estimate items, payments, reminders, complaints, roles.
- Bring over the staff app (dashboard, customers, units, parts, services, estimates, invoices, reminders, reports, settings), the existing customer portal shell, and the design system.
- Reconcile the uploaded code with this project's current framework version (a few server-function and validation APIs changed names) so everything builds cleanly.
- Set up email/password + Google sign-in, with shop staff and customer roles kept in a separate roles table.

## Phase 2 — Correct the money math (the core rewrite)

One shared calculation module becomes the single source of truth, used by the invoice builder, the estimate builder, the saved invoice, the printed/emailed copy, the portal, and every dashboard metric. No screen recalculates totals its own way.

Rules to be implemented:

- Line totals: quantity x unit price, parts marked up by their markup percent, rounded to the cent per line — never on the running total.
- Labor: hours x labor rate, tracked separately from parts.
- Shop supplies fee: a percentage of parts + labor subtotal (per-shop default, overridable per invoice), with an optional maximum cap.
- Taxes (BC-style): GST applies to labor + parts + fees. PST applies to parts + fees only — labor is PST-exempt. Rates are per-shop defaults, overridable per invoice, and stored on each invoice so a historical invoice never changes when rates change.
- Rounding: all amounts computed in cents, half-up rounding, so subtotal + fees + GST + PST always equals the stored total to the penny.
- Balance due: total minus the sum of successful payments. Partial payments supported.

Dashboard and reports get rewritten on the same basis:

- Revenue = payments actually received in the period (by payment date), not invoice status, so partial payments and refunds are counted correctly.
- Outstanding = sum of remaining balances across unpaid/partially paid/overdue invoices, never negative.
- Overdue = unpaid balance with a due date in the past.
- Separate breakdowns for labor revenue, parts revenue, fees, and tax collected (tax is shown as collected-on-behalf, not revenue).
- Month buckets use the shop's local dates, so "this month" is not off by a timezone.

A set of automated tests locks in these rules with worked examples (mixed labor/parts invoices, capped supplies fee, PST-exempt labor, partial payments, rounding edge cases).

## Phase 3 — Truck & fleet details on every bill

- Unit record: unit number, VIN (validated 17 characters), year/make/model, plate, unit type, current odometer.
- Each invoice and estimate captures the unit plus the odometer reading at time of service, and prints unit number + VIN + mileage in the header.
- Fleet view per customer: all units, last service date, last odometer, open balance per unit, lifetime spend per unit.

## Phase 4 — Itemized billing

- Invoice builder groups charges into jobs (complaint / cause / correction) with three clearly separated charge types: Labor (hours x rate, technician optional), Parts (pulled from inventory with part number, quantity, cost, markup), and Shop fees.
- Invoice summary shows Labor total, Parts total, Shop supplies, GST, PST, Total, Payments, Balance due as distinct lines.
- Selecting a part decrements inventory on invoice finalization and respects low-stock alerts.

## Phase 5 — Payment status tracker

- Invoice status derived from real balances: Draft, Sent, Partially paid, Paid, Overdue, Void.
- Invoice list with filters and tabs for Paid / Unpaid / Overdue / All, plus customer, unit, date-range, and aging buckets (0-30 / 31-60 / 61-90 / 90+).
- Quick actions per row: record a manual payment, copy a pay link, and send a payment reminder email to the customer (also logged and flagged in the portal).
- Aging summary card at the top: total outstanding by bucket.

## Phase 6 — Customer portal

Fleet-owner login at `/portal`:

- Overview: total balance due, overdue amount, open repair orders, next PM/inspection due.
- Repair updates: current work orders per unit with status and job notes as the shop updates them.
- Billing history: all invoices with itemized detail, downloadable/printable copies, payment history.
- Pay online for outstanding invoices.
- Fleet list with VIN, unit number, mileage, and service history per truck.
- Submit and track driver complaints.

## Technical notes

- Stack stays TanStack Start + Lovable Cloud. Reads use route loaders priming TanStack Query; all writes and money math run in server functions with row-level security scoped by shop, so a shop only ever sees its own data and a customer only their own invoices/units.
- Calculations live in one pure module (`src/lib/billing/calc.ts`) with cent-based integer math plus a Postgres check that stored invoice totals match their line items.
- Online payments keep the uploaded approach: Stripe Connect, so each shop is paid into its own Stripe account. This needs your Stripe platform secret key, Connect client ID, and webhook secret — I'll ask for those securely when I reach that step, after the payment endpoints exist.
- Reminder emails need a sender domain you own; I'll walk you through that setup when we get to Phase 5. Until it's verified, reminders are logged and shown in the portal.

## Sequencing

Phases 1-2 first (import + correct math, with tests), then 3-5 (fleet details, itemization, payment tracker), then 6 (portal) and payments/email setup.
