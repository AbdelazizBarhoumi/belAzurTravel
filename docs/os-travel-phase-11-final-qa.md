# Phase 11 — Final QA & Go-Live (OS-TRAVEL)

**Status:** Not started — depends on Phase 9 (live search) and Phase 10 (booking proxy) being shipped.

**Scope:** full regression sweep, security review, manual E2E, and go-live checklist for the OS-TRAVEL transactional integration.

---

## 1. Automated checks

1. **Backend:** `composer run test` (pint + phpunit) — full suite must be green.
2. **Frontend:** `npm run test` (vitest) + `tsc --noEmit`.
3. **Schedule:** `php artisan schedule:list` — verify `os-travel:sync-catalog` and `os-travel:refresh-latest-prices` both registered with expected cadences.
4. **Security regression:** grep responses/logs for credentials (`Login`/`Password`/`OS_TRAVEL_PASSWORD`). No provider credentials anywhere.

---

## 2. Manual end-to-end flow

```
run sync → set prices → approve → browse /hotels
  → home section shows latest known price (browse mode)
  → index: pick dates → live prices + "Live prices" indicator
  → detail: pick dates → live room prices + tokens in booking card
  → prebook → breakdown → ClictoPay pay → confirm → booking listed
  → cancel preview → confirm cancel → booking cancelled
```

Checklist per step:
- Browse (no dates): prices render from `last_price`; no provider calls fired.
- Search (dates): one batched `HotelSearch` per chunk; hotels with no availability omitted; `StopReservation` rates not bookable.
- PreBook: no `Id`/`Voucher` in response; breakdown matches client display.
- Confirm: `Booking` row created, `provider_booking_id`/`provider_booking_reference` stored, status mapped.
- List: `BookingList` returns history matching local rows.
- Cancel preview: fees shown without cancelling; confirm cancels and maps state.
- Idempotency: double-click confirm/cancel does not create duplicates or errors.

---

## 3. Regression areas (guard these)

- **Phase 4 catalog sync:** re-run sync mid-run, kill process → next run recovers (log shows failed, rows preserved, lock released).
- **Phase 6 admin UI:** approve/re-approve/approveAll still idempotent; detail hydration race stays fixed.
- **Phase 7 public flow:** pending/orphaned hotels never leak via `/api/hotels`.
- **Non-OS-TRAVEL entities:** destinations, tours, flights, deals booking flows unaffected (hotel-only proxy).
- **Caching:** `hotels.index` (10 min) and `hotels.search.{hash}` (5 min) behave; no stale-price bleed between distinct searches.

---

## 4. Known pre-existing issues (out of OS-TRAVEL scope)

- 6 frontend test files fail independently of OS-TRAVEL: `AdminFlights`, `AdminPromos`, `AdminEvents`, `AdminGallery`, `AdminTourForm`, `AdminHotels` (13 tests).
- 1 lint error: unused `fetchCategoryTypes` import in `AdminDestinations.test.tsx`.
- OS-TRAVEL password rotation still pending (credential exposed on a dangling public commit).

---

## 5. Go-live checklist

1. All suites green (backend + frontend + tsc).
2. Scheduler registered; refresh command runs without overlap.
3. Credential rotation completed and old secret scrubbed from git history.
4. Provider open questions resolved (currency, rate limits, OnRequest, voucher expiry, child ages).
5. Markup and currency verified against a live provider search.
6. Manual E2E above passes on staging, then production.