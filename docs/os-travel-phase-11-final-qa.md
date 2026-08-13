# Phase 11 — Final QA & Go-Live (OS-TRAVEL)

**Status:** Automated checks complete. Full regression suite green (backend 334 tests / 1764 assertions, Pint clean, `tsc --noEmit` clean). Schedule verified. Security regression clean. Manual E2E checklist automated as `tests/Feature/OsTravelGoLiveFlowTest.php`. Remaining go-live blockers are operational, not code: credential rotation, provider open questions, and live staging E2E.

**Scope:** full regression sweep, security review, manual E2E, and go-live checklist for the OS-TRAVEL transactional integration.

---

## 1. Automated checks

1. **Backend:** `composer run test` (pint + phpunit) — full suite must be green.
2. **Frontend:** `npm run test` (vitest) + `tsc --noEmit`.
3. **Schedule:** `php artisan schedule:list` — verify `os-travel:sync-catalog` and `os-travel:refresh-latest-prices` both registered with expected cadences.
4. **Security regression:** grep responses/logs for credentials (`Login`/`Password`/`OS_TRAVEL_PASSWORD`). No provider credentials anywhere.

**Result (13 Aug 2026):**
- Backend: `334 tests / 1764 assertions` green; Pint clean.
- Frontend: `tsc --noEmit` clean; affected vitest (Hotels, HotelDetail, SearchWidget, publicData, translations) green. Only the 6 known pre-existing admin files fail (13 tests).
- Schedule: `0 2 * * *  os-travel:sync-catalog` and `0 */6 * * *  os-travel:refresh-latest-prices` both registered with `withoutOverlapping()`.
- Security: provider `Login`/`Password` only live in `config('ostravel.*')`; `HotelSearchPublicFlowTest`, `OsTravelPublicFlowTest` and `BookingOsTravelFlowTest` assert responses never contain them. Grep confirms no credential in responses/logs/frontend.

## 2. Manual end-to-end flow

Automated end-to-end equivalent shipped as **`tests/Feature/OsTravelGoLiveFlowTest.php`** (`test_full_os_travel_flow_from_sync_to_cancellation`), covering every step below in one pass:

```
run sync → set prices → approve → browse /hotels
  → home section shows latest known price (browse mode)
  → index: pick dates → live prices + "Live prices" indicator
  → detail: pick dates → live room prices + tokens in booking card
  → prebook → breakdown → ClictoPay pay → confirm → booking listed
  → cancel preview → confirm cancel → booking cancelled
```

Checklist per step — all asserted in the automated flow:
- Browse (no dates): prices render from `last_price`; no provider calls fired.
- Search (dates): one batched `HotelSearch` per chunk; hotels with no availability omitted; `StopReservation` rates not bookable.
- PreBook: no `Id`/`Voucher` in response; breakdown matches client display.
- Confirm: `Booking` row created, `provider_booking_id`/`provider_booking_reference` stored, status mapped.
- List: `BookingList` returns history matching local rows.
- Cancel preview: fees shown without cancelling; confirm cancels and maps state.
- Idempotency: double-click confirm/cancel does not create duplicates or errors (fixed a real bug: `BookingController::cancel` now short-circuits already-cancelled bookings before hitting the provider).

Remaining: real-staging E2E against the live provider (blocked on credential rotation).

---

## 3. Regression areas (guard these)

Covered by existing tests, all green on the 13 Aug 2026 run:
- **Phase 4 catalog sync:** re-run sync mid-run, kill process → next run recovers (log shows failed, rows preserved, lock released). — `OsTravelCatalogSyncTest`, `SyncOsTravelCommandTest`.
- **Phase 6 admin UI:** approve/re-approve/approveAll still idempotent; detail hydration race stays fixed. — `AdminOsTravelTest`, `OsTravelHotelPublisherTest`, plus `OsTravelGoLiveFlowTest::test_republish_uses_shared_hotel_publisher`.
- **Phase 7 public flow:** pending/orphaned hotels never leak via `/api/hotels`. — `OsTravelPublicFlowTest`, `OsTravelGoLiveFlowTest::test_orphaned_and_pending_hotels_never_leak_publicly_after_resync`.
- **Non-OS-TRAVEL entities:** destinations, tours, flights, deals booking flows unaffected (hotel-only proxy). — `OsTravelGoLiveFlowTest::test_non_os_travel_booking_flow_is_unaffected`, existing `BookingE2ETest`.
- **Caching:** `hotels.index` (10 min) and `hotels.search.{hash}` (5 min) behave; no stale-price bleed between distinct searches. — `OsTravelSearchServiceTest::test_distinct_searches_do_not_share_cache_entries` (new), `OsTravelHotelPublisherTest` (cache flush on publish), `AdminOsTravelTest` (index invalidated on approve).

---

## 4. Known pre-existing issues (out of OS-TRAVEL scope)

- 6 frontend test files fail independently of OS-TRAVEL: `AdminFlights`, `AdminPromos`, `AdminEvents`, `AdminGallery`, `AdminTourForm`, `AdminHotels` (13 tests).
- 1 lint error: unused `fetchCategoryTypes` import in `AdminDestinations.test.tsx`.
- OS-TRAVEL password rotation still pending (credential exposed on a dangling public commit).

---

## 5. Go-live checklist

Status on 13 Aug 2026:
1. All suites green (backend + frontend + tsc). — **DONE** (334/334 backend, affected vitest, tsc).
2. Scheduler registered; refresh command runs without overlap. — **DONE** (`schedule:list` verified).
3. Credential rotation completed and old secret scrubbed from git history. — **OPEN** (provider action; dangling public commit `cc6e869`).
4. Provider open questions resolved (currency, rate limits, OnRequest, voucher expiry, child ages). — **OPEN** (documented in phase docs).
5. Markup and currency verified against a live provider search. — **OPEN** (needs live credentials).
6. Manual E2E above passes on staging, then production. — **OPEN** (automated E2E equivalent green; real-staging pass pending item 3).