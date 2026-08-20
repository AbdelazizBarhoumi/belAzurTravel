# Bel Azur Travel — Client Journey & Demand Approval Pipeline Plan

> Status: **Proposed — pending sign-off on flagged decisions (see bottom).**
> Scope decision summary (from product owner): Demand = **booking approval pipeline**; payment **excluded for now** (reservation → admin → manual); scope = **full journey rework**; notifications = **polling is fine**; email events wanted = confirmed/voucher, approved→pay-later, cancellation+refund, trip reminders, admin daily digest, marketing (deferred).

## 1. Scope

**In scope (this plan):** the full journey *except payment* — reservation → admin approval/rejection → confirm → notifications → emails → trip reminders → admin daily digest → unified admin queue → audit trail. Rich booking states. i18n (en/fr/ar) + RTL.

**Explicitly OUT of scope (deferred by owner):** ClictoPay, payment initiation, refunds via gateway, marketing/newsletter automation. Existing payment code stays but is **not** extended and no longer auto-fabricates "paid" records on admin confirm.

## 2. Target journey (canonical flow)

```
Client sees hotel  →  searches live  →  selects offer  →  reserves (creates booking)
   →  ADMIN notified (bell + digest)
   →  Admin reviews in unified Queue → Approve / Reject(with reason) / Cancel
   →  Approve: provider confirm (if OS-TRAVEL) → booking Confirmed
   →  Client notified (bell + email "Reservation confirmed" + voucher)
   →  Reject: booking Rejected → client notified (bell + email w/ reason)
   →  Later: client cancels (24h rule) or admin cancels → notified both sides
   →  Trip reminder email N days before check-in
   →  Daily admin digest summarizes the day's activity
```

## 3. State machine

Replaces the 3 raw string statuses (`Pending` / `Confirmed` / `Cancelled`).

```
pending → approved → confirmed   ·or·   rejected   ·or·   cancelled   ·or·   expired
```

| Status | Meaning |
|---|---|
| `pending` | Submitted, awaits admin review. Default on create for **all** types now. |
| `approved` | Admin accepted the demand. Provider confirm fires here for OS-TRAVEL hotels. |
| `confirmed` | Fully secured; voucher available. Set atomically on approve for now (payment deferred). |
| `rejected` | Admin declined with a required reason. |
| `cancelled` | By client or admin, with penalty/reason surfaced. |
| `expired` | Auto-transition from `pending` after a configurable TTL (provider prebook tokens are time-limited). |

Transitions are guarded (no illegal jumps), logged to a new `booking_audits` table (actor, action, from→to, notes, timestamp), and visible in admin + client views.

## 4. Phases & checkpoints

### Phase 0 — Foundation: schema, status model, audit

**Objective:** stable data layer before any behavior changes.

- Migration: introduce a `BookingStatus` class / PHP enum with `allowedTransitions()` state machine (keep the string column for compatibility).
- New table `booking_audits` (booking_id, actor_id, actor_role, action, from_status, to_status, notes, created_at).
- New `BookingAudit` model + `log()` helper used by all transitions.
- Add `rejected_at`, `expires_at`, `reject_reason`, `cancel_reason` columns to `bookings`.
- Site settings: `booking_expiry_hours` (default e.g. 72), `trip_reminder_days` (default 3), `digest_time`.
- Update seeders/factories/tests referencing old statuses.

**Checkpoint (exit criteria):** migrations run clean on a fresh DB; `BookingStatus` unit tests pass for all legal/illegal transitions; audit rows created on every manual status write; `php artisan test` + `npm run types` green.

### Phase 1 — Backend approval flow

**Objective:** every reservation lands `pending`; admin approve/reject drive the pipeline.

- `BookingController::store`: all types default `pending`; keep provider **prebook** at reserve (locks price/offer); **remove** instant-auto-confirm for manual hotels and **remove** `recordPayment()` fabrication on confirm (no fake "paid").
- New/refactored admin actions in `BookingController` (or a new `AdminBookingWorkflowController`):
  - `approve()` — validates state is `pending`; sets `approved` → `confirmed`; for OS-TRAVEL calls `OsTravelBookingService->confirm()` using the stored `provider_payload`; on provider failure → stays `pending` with admin-visible error + notify "re-search needed".
  - `reject()` — requires reason; sets `rejected` + `rejected_at`.
  - `cancel()` / `adminCancel()` — as today but with reason + audit + no fabricated payment.
- Expiry command `bookings:expire` (scheduled hourly) — pending past TTL → `expired` + client notification.
- Notifications: `booking.submitted` (→ admins), `booking.approved` / `booking.rejected` / `booking.expired` (→ client). New notification classes (or extended payloads on the existing `BookingActivityNotification` / `BookingStatusNotification`).
- Provider token staleness: on approve, re-run prebook to re-verify; fail gracefully (reject with "offer expired, please re-search" surfaced to admin, client stays pending).

**Checkpoint:** a reservation for hotel/tour/flight/car/destination all end `pending`; admin approve confirms + fires provider confirm for OS-TRAVEL; reject requires reason; audit rows show each transition; expiry job works via tinker; tests cover approve/reject/cancel/expire paths.

### Phase 2 — Admin unified "Needs action" queue

**Objective:** one place to deal with everything.

- New `/admin/queue` page (`AdminQueue.tsx`): consolidated, filterable list of bookings, complaints, support inquiries, refund requests that need action. Priority sorting (high → old → near-trip), status badges, per-row quick actions (approve/reject/cancel, reply, resolve, set refund), drill-in detail drawer.
- Queue counts feed nav badges on the existing admin sidebar + `NotificationBell`.
- Booking detail view gains an **Audit timeline** (from `booking_audits`).
- AdminBookings keeps full list but links into the queue for workflow actions.

**Checkpoint:** an admin can handle the entire "reserve → approve → notify → reply/resolve → refund" lifecycle from the queue without leaving the page; unread/actionable counts are correct; audit timeline renders; mobile layout works (RTL too).

### Phase 3 — Client experience

**Objective:** the client always knows where their demand stands.

- Post-reserve confirmation screen in `BookingDialog` → "Request submitted — you'll be notified once confirmed" (replaces the pay-now screen).
- Client dashboard bookings tab: richer status badges (Pending/Approved/Confirmed/Rejected/Cancelled/Expired), reject reason + cancellation reason display, "Pending" shows estimated decision window, cancel gated by the 24h rule (keep existing `can_cancel`).
- Voucher card on confirmed bookings (provider reference + payload summary, printable).
- `NotificationsPage` client layout: subscription-style event feed, mark-all-read, unread counts (keep polling).

**Checkpoint:** full client journey walkthrough works end-to-end in en/fr/ar + RTL; statuses render correctly in every state; voucher displays; cancel flow notifies client + admin.

### Phase 4 — Mails & notifications

**Objective:** transactional emails for every journey event (existing 6 templates → extend family).

New/updated Blade templates under `resources/views/emails/`:
- `booking-approved` (reservation confirmed + voucher summary + item details) — replaces the misuse of `payment-success`.
- `booking-rejected` (reason, what to do next).
- `booking-cancelled` (client + admin variants, penalty note).
- `booking-expired` (offer expired, re-search CTA).
- `trip-reminder` (N days before check-in, booking summary).
- `admin-digest` (daily: new demands, approvals, complaints, refunds, revenue-less activity).
- Localized greeting/intro/closing reuse the existing `layouts/base`; add `$subject` support.
- Wire all notification classes to mail when SMTP configured (pattern already exists).

**Checkpoint:** every state transition produces the correct email + in-app notification; templates render in all 3 languages; a seeded demo booking triggers the full email chain in a local mail sink (e.g. Mailpit) with zero HTML errors.

### Phase 5 — Scheduled jobs, tests & hardening

**Objective:** production-ready automation + regression safety.

- `app/Console/Commands`: `bookings:expire`, `send:trip-reminders`, `send:admin-digest` — all `schedule()`-registered.
- Feature tests: full journey (reserve→approve→confirm→reject→cancel→expire), provider confirm mocking, queue counts, audit integrity.
- Component tests (vitest) for queue, client status cards, voucher, notification feed.
- i18n audit: all new UI strings in `lang/` (en/fr/ar) + frontend i18n keys; RTL pass.
- Prettier/eslint/pint/tsc/phpunit all green; `npm run build` clean.

**Checkpoint:** `php artisan test` + `npm run test` + `npm run types` + `npm run build` all pass; scheduled commands verified via `php artisan schedule:list` and manual runs on seeded data; journey demo video-ready.

## 5. Flagged decisions (need sign-off)

1. **Instant manual hotels lose auto-confirm.** "All types go through admin" means a client booking an instant manual hotel now waits for admin approval. That is a behavior change from today. Confirm intended.
2. **Approved == Confirmed for now.** Approve + confirm are collapsed into one admin action (payment isn't in play). The two states exist in the model so future "pay after approval" is a small change. If two explicit clicks are preferred, say so.
3. **Provider token staleness.** Prebook tokens expire provider-side. If a client's demand sits too long, approval may fail on re-prebook → admin sees "offer expired", client stays pending and must re-search. Recommended expiry TTL (Phase 0) short (≤72h) for provider hotels specifically.
4. **No fake "paid" records.** Today `confirm()`/`recordPayment()` fabricate paid payments. This plan removes that — there will be no payment rows until the gateway is reintroduced.
5. **Marketing/newsletter** (wanted by owner, listed as an email event) is deferred past Phase 5 — it is not part of the journey pipeline.

## 6. Current-state reference (as mapped from the codebase)

| Journey step | Existing implementation |
|---|---|
| Seeing the hotel | `pages/hotels/index.tsx` + `pages/hotels/show.tsx` (gallery, amenities, rooms) |
| The fetching | `POST /api/hotels/search` → `OsTravelSearchService` (live OS-TRAVEL, live prices, caching) |
| The selecting | `RoomRatesTable`, `OccupancyPicker`, per-offer rates (boarding/supplements/cancellation) |
| The reserve | `components/forms/BookingDialog.tsx` → `BookingController::store` (provider prebook; instant manual auto-confirms) |
| Admin notification | `BookingActivityNotification` + bell (polled); `SupportInquiryNotification`, `ComplaintNotification` |
| Admin dealing with it | `AdminBookings` (confirm/cancel), `AdminComplaints` (reply/resolve/refund), no unified queue |
| Mails & notifications | 6 Blade templates under `resources/views/emails/`; DB notifications via `app/Notifications/` |