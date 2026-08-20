# Hotel Booking Journey — Audit & Improvement Plan

**Status:** Audited · Plan approved (build mode)

This document tracks the end-to-end user/client journey from clicking a hotel
through to final approval, the gaps found during the UI/UX audit, and the
implementation plan with checkable status.

---

## 1. Current journey (verified end-to-end)

| # | Step | Where | What happens |
|---|------|-------|--------------|
| 1 | Homepage search | `components/ui/SearchWidget.tsx` | Destination, country, dates, guests (+ room type / stars) → redirects to `/hotels?q=&country=&from=&to=&guests=&cat=&stars=` |
| 2 | Hotels list | `pages/hotels/index.tsx` | Reads URL params → builds live query → `POST /api/hotels/search` (debounced 600ms). Backend `OsTravelSearchService` resolves published hotels → OS-TRAVEL `HotelSearch` (chunks of ≤200) → applies markup → filters/sorts. Cards show total + per-night price only after a live search. |
| 3 | Hotel detail | `pages/hotels/show.tsx` | User re-enters dates + occupancy → clicks "Check availability" → live rooms returned (id, boarding, price, token, source, supplements, cancellation policy, stop-sales, on-request). `RoomRatesTable` shows bookable rooms with badges → "Reserve". |
| 4 | Booking dialog | `components/forms/BookingDialog.tsx` | Not logged in → `/login?redirect=...`. Pre-fills name/email, locks dates to the searched offer, one passenger row per adult/child, options chips, notes → `POST /api/bookings`. |
| 5 | Booking creation | `app/Http/Controllers/Api/BookingController.php:store` | Validates → finds hotel → promo checks. Provider-linked: `buildHotelBooking` + **PreBook** (`BookingCreation` with `PreBooking=true`) to verify availability + final price; context stored in `provider_payload`. Booking created **`Pending`**, `expires_at` = +72h (site setting), audit logged, admins notified. Dialog shows "Request submitted / Estimated total". |
| 6 | Admin approval | `BookingController.php:approve` | Provider hotel: **re-prebook** (stale token → stays Pending, client re-searches) → **Confirm** (`BookingCreation`). Provider `Validated` → `Pending → Approved → Confirmed`; provider `OnRequest` → stays **`Approved`**. Manual hotel: `Pending → Approved → Confirmed` atomically. Client + admins notified, audit logged. |
| 7 | Client outcome | `pages/dashboards/Client.tsx` | Status badges. Pending → decision-window banner (`expires_at`). Rejected/Cancelled → reason banner. Confirmed → `VoucherCard` (provider ref + room breakdown). **Approved → bare badge only.** `NotificationBell` polls and deep-links to `/client/bookings/:id`. |
| 8 | Expiry | `app/Console/Commands/ExpireBookings.php` | Command exists but is **not scheduled** — pending bookings never auto-expire in practice. |

### Status machine (`app/Enums/BookingStatus.php`)
`Pending → Approved → Confirmed` · `Pending → Rejected / Cancelled / Expired` · `Approved → Confirmed / Rejected / Cancelled` · `Confirmed → Cancelled / Completed`. Terminal: Rejected, Cancelled, Expired, Completed.

---

## 2. Gaps found (UI/UX, prioritized)

### Blocking — break or contradict the journey
- [ ] **G1 · Payment is a dead end.** `PaymentController` only accepts `Pending` bookings and flips them to `Confirmed` on success; the BookingDialog explicitly skips payment and admin approval already Confirms bookings → no client can ever pay; client Payments tab has no pay button.
- [ ] **G2 · No client booking detail view.** `/client/bookings/:id` renders the same dashboard (no `useParams`); notifications deep-link there but nothing shows a full breakdown / voucher / cancellation policy / audit.

### High — confusing or silently broken
- [ ] **G3 · Search context lost list → detail.** Cards link to `/hotels/:slug` with no `?from&to&guests`; detail page never reads URL params → user re-enters everything.
- [ ] **G4 · `Approved` invisible to the client** — no "awaiting provider confirmation", no next-step CTA.
- [ ] **G5 · No booking expiry enforcement** (`bookings:expire` unscheduled).
- [ ] **G6 · Admin can't see provider data when approving** — queue omits `provider_payload`/prebook/voucher reference.
- [ ] **G7 · AdminBookings silently no-ops** (StatusSelect toasts success for Pending/Approved/Expired/Completed but does nothing; delete button is a fake success toast).
- [ ] **G8 · Live search errors swallowed** — list shows endless skeletons; detail page is a blank screen while loading (`show.tsx:298-300`).

### Medium — polish
- [ ] **G9 · No price pre-search** (browse mode shows "Check availability"; `hotels.priceFrom` unused; home carousel links without dates).
- [ ] **G10 · No pagination** (hardcoded `per_page: 50`).
- [ ] **G11 · List filter bar never writes back to the URL** (refresh loses state).
- [ ] **G12 · Only total guests travel in the URL** — child ages lost.
- [ ] **G13 · Cancel gives no toast feedback.**
- [ ] **G14 · Admin dashboard recent-bookings colors mislabel** Approved/Expired/Completed as destructive red.

### Low — cleanup
- [ ] **G15 · Dead code:** `HotelSummary.tsx`, `hotelinfotemp.tsx`, unused `getClientBookings`, unused `initiatePayment`, ~10 dead payment i18n keys.
- [ ] **G16 · Favorites not tracked server-side** (only `call`/`whatsapp` interactions exist).

---

## 3. Decisions (confirmed)

1. **Payment → keep out-of-band.** Admin/ops handle payment via the provider. Remove dead payment UI + pay-gate conflicts; document as a future phase.
2. **Search context → preserve it.** Pass `?from&to&guests&rooms&children` on the card link; detail page pre-fills + auto-runs "Check availability" on arrival.
3. **Booking detail view → build it.** Dedicated `/client/bookings/:id` page with full per-booking breakdown.

---

## 4. Implementation plan

### Phase 1 — Preserve search context (G3, part of G8) ✅
- [x] `pages/hotels/index.tsx` — card `<Link>` appends `?from&to&guests&children` from current `dateRange`/`occupancy` when present; list also parses the `children` param (round-trip).
- [x] `pages/hotels/show.tsx` — reads params, pre-fills `dateRange` + `occupancy` (rooms/adults/childAges), auto-runs availability once on mount when a valid window exists; lone check-in defaults check-out to +1 night.
- [x] `pages/hotels/show.tsx` — replaced blank `null` loading with a skeleton layout.
- [x] `pages/hotels/show.tsx` — `handleSearchRedirect` now forwards `rooms`/`children` too.

### Phase 2 — Client booking detail page (G2, G4) ✅
- [x] New `pages/dashboards/BookingDetail.tsx` wired at `/client/bookings/:id` in `app.tsx`.
- [x] Consume existing `getBooking(id)` (`resources/js/api/booking.api.ts:94`, now typed `BookingDetailRow`).
- [x] Show: status + decision window (Pending) / reasons (Rejected/Cancelled), item, dates, passengers, price breakdown from `provider_prebook`, `VoucherCard` (Confirmed), cancellation policy, Cancel action.
- [x] Fix notification deep-link target resolution (`BookingStatusNotification` already points to `/client/bookings/:id`).
- [x] Dashboard booking cards now link to the detail page (Details button).

### Phase 3 — Make `Approved` meaningful (G4) ✅
- [x] `pages/dashboards/Client.tsx` — add "awaiting provider confirmation" banner on Approved cards (mirror Pending decision-window banner).
- [x] Same treatment on the new booking detail page.

### Phase 4 — Enforce booking expiry (G5) ✅
- [x] Schedule `bookings:expire` in `bootstrap/app.php` via `->withSchedule()` (e.g. every 5 minutes).
- [x] Actually already scheduled hourly in `routes/console.php:19-22`; changed to `->everyFiveMinutes()` so expired bookings transition within ~5 min of the 72h TTL instead of up to an hour late.

### Phase 5 — Admin-side truth & honesty (G6, G7, G14) ✅
- [x] Include `provider_prebook`/voucher breakdown in `AdminQueueController` response + `QueueBooking` type; show in admin queue booking drawer (provider ref + rooms/nights/boarding/total table).
- [x] `pages/admin/AdminBookings.tsx` — StatusSelect now only offers valid transitions per current status (Pending→Approved/Rejected/Cancelled, Approved→Confirmed/Rejected/Cancelled, Confirmed→Cancelled); disabled for terminal statuses; fake delete button removed (column dropped).
- [x] `pages/admin/index.tsx:261-273` — fix status colors (full 7-status map instead of Confirmed/Pending/else-destructive).

### Phase 6 — Kill silent failures (G8)
- [ ] `pages/hotels/index.tsx` — on search `isError`, render error + retry block instead of endless skeletons.
- [ ] `pages/hotels/show.tsx` — surface `useHotelSearch` errors.

### Phase 7 — Payment out-of-band cleanup (G1, G15)
- [ ] Remove unused `initiatePayment`/`retryPayment` client exports (`api/payment.api.ts`).
- [ ] Remove `PaymentResult` retry button + dead i18n keys (`payment.payNow/processing/redirecting/initError`, `booking.confirmedPay`).
- [ ] Keep backend `PaymentController` + callback route intact (future phase); document offline payment flow.

### Phase 8 — Low-priority polish (G9–G13, G15, G16)
- [ ] Browse-mode "From X TND/night" using `hotels.priceFrom`.
- [ ] Pagination via existing `meta`.
- [ ] List filter-bar URL write-back.
- [ ] Child ages encoded in URL (`children=5,8`).
- [ ] Cancel success toast.
- [ ] Dead-code sweep: `HotelSummary.tsx`, `hotelinfotemp.tsx`, unused `getClientBookings` (used by Phase 2).
- [ ] (Optional) `favorite` interaction server tracking.

---

## 5. Verification

- Frontend: `npm run types`, `npm run lint`, `npm run build`.
- Backend: `php artisan` (config clear / migrate as needed), manual flow test.
- Manual check: search → detail (context preserved) → reserve → submit → admin approve → client Confirmed + voucher → notification deep-link → booking detail page.

---

## 6. Status log

| Date | Status | Notes |
|------|--------|-------|
| 2026-08-20 | Audited · plan approved | Journey documented, 16 gaps recorded, 8 phases planned. |
| 2026-08-20 | Phase 1 done | Search context preserved list→detail; detail auto-searches + skeleton loading. |
| 2026-08-21 | Phase 2 done | Client booking detail page at `/client/bookings/:id` (status banners, passengers, price breakdown, voucher, cancellation policy, cancel); dashboard cards link to it. `tsc` + `eslint` pass. |
| 2026-08-21 | Phase 3 done | "Awaiting provider confirmation" banner on Approved cards (dashboard + detail). `tsc` + `eslint` pass. |
| 2026-08-21 | Phase 4 done | `bookings:expire` was already scheduled hourly (`routes/console.php`); tightened to `everyFiveMinutes()` so bookings expire within ~5 min past the 72h TTL. `schedule:list` confirms single entry. |
| 2026-08-21 | Phase 5 done | Admin queue drawer shows provider prebook breakdown + provider ref; AdminBookings StatusSelect restricted to valid transitions + fake delete removed; admin dashboard status colors fixed. `tsc` + `php -l` pass. |