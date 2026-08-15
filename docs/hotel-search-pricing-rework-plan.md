# Hotel Search, Filtering & Pricing Rework — Plan & Tracking

Status of the hotels module: searching/filtering fully server-driven by the OS-TRAVEL
external API, pricing accuracy & staleness guarantees, manual hotel support, E2E from
admin to public users to client bookings.

**Reference documents**
- `apidocumentation.md` — OS-TRAVEL API reference
- `endpoints-schema-data.json` — real request/response samples for all endpoints
- `Belazur_collection.json` — Postman collection
- `docs/os-travel-phase-9-live-search.md`, `docs/os-travel-phase-9-transactional.md`,
  `docs/os-travel-phase-10-booking.md`, `docs/os-travel-phase-11-final-qa.md` — prior phases

---

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Implementation cadence | Staged with checkpoints (verify each stage before moving on) |
| Browse mode (no dates) | Keep list, prices labelled "from / last known"; live accuracy once dates+occupancy are set |
| Passenger form | Full guest details (civility, names, ages, passports), reused for search AND booking |
| Search filter set | City, stars, category, boarding, price range, sort — all server-driven |
| Manual hotel booking | Per-hotel flag: `instant` (fixed stored price) or `request` (manual confirmation) |
| Price granularity | Provider prices are **total-per-room-for-stay** (verified from real BookingList responses) |

---

## Current state (as of plan start)

- **Data flow:** cron sync → `os_travel_hotels` staging → admin approve → `HotelPublisher` → `hotels` table → `GET /api/hotels` (10-min cache).
- **Live pricing:** `POST /api/hotels/search` → `HotelSearch` (chunks ≤200, 5-min cache, server-side markup).
- **Booking:** `POST /api/bookings` prebooks → ClictoPay pay → confirm → `BookingCancellation` preview/confirm → `BookingList`.
- **Problems:** client-side filtering on stale stored prices; per-night vs stay-total display bug; no `Filters.Category` sent; unavailable hotels shown as bookable; manual hotels not integrated; child ages / supplements / guest details missing; BookingDialog dates can differ from search dates.

### Price semantics (evidence from `endpoints-schema-data.json` + live API, verified Aug 2026)

| Hotel | Nights | Room Price | TotalPrice | Note |
| --- | --- | --- | --- | --- |
| Byblos | 1 | 420.000 | 420.000 | 4A + 1C |
| Hilton Skanes | 2 | 1998.934 | 1998.934 | 2A + 2C |
| Jinene | 1 | 212.016 × 2 rooms | 424.032 | total = sum of rooms |
| Hotel Imperial Park | 2 | 254.520 | 254.520 | live check, 2 nights |
| Hotel Imperial Park | 7 | 855.187 | — | live check, 7 nights |
| Search fixture | 7 | 927.520 | — | check-in 09-01 → 09-08 |

**Conclusion: every provider `Price`/`TotalPrice` is the TOTAL for the whole stay for that
room (all nights × all pax).** `TotalPrice` = sum of room prices. The app must treat it that
way everywhere.

### Critical finding — the real `HotelSearch` response shape (verified live)

The fixture used by the tests was a **simplified, incorrect shape**. The live response is:

```
HotelSearch[] → {
  Hotel: { Id, Name, Category, City, Image, ... },   // nested, not a flat Id
  Token, Source, Currency, FreeChild[], Recommended,
  Price: {
    BasePrice,                                        // opaque per-night-ish hint, do not use
    Boarding[]: { Id, Code, Name, Pax[]: {
      Adult, Child[],
      Rooms[]: { Id, Name, Price, BasePrice,
                 PriceWithAffiliateMarkup, StopReservation,
                 CancellationPolicy[], CancellationDeadline }
    } }
  }
}
```

Key consequences:
- **There is no `Rooms[]` at the hotel top level** — the previous `normalize()` read
  `$providerHotel['Rooms']`, which is empty in production, so live search returned hotels with
  empty rooms and no bookable context (a real go-live bug). Now fixed: `roomOffers()` flattens
  `Price.Boarding[].Pax[].Rooms[]`.
- The provider does **not** return a top-level `Rooms[]`; room `View` and `Supplement` arrays **are**
  present inside each room offer and are now captured (`view_ids` + raw `supplements`) so the booking
  proxy can echo them back to the provider unchanged.
- `Fees` in `CancellationPolicy` can be strings; `FromDate` is `d-m-Y H:i`.
- Hotel-level `Price.BasePrice` (e.g. `66.150`) is ambiguous and must not be used for pricing;
  the per-room `Price` is the stay total we use.

---

## Stage 1 — Pricing model + server search engine + accuracy

**Goal:** provider prices are correct and consistent (display = prebook = confirm), and the
search results the user sees are computed live by the external API for exactly their
dates/occupancy/filters.

### Phase A — Pricing model correctness

**Details**
1. Add stay-total semantics everywhere:
   - `app/Services/OsTravel/OsTravelSearchService.php::normalize()` — room/search result gains
     `nights`, `price_total` (provider total × markup, rounded), `price_per_night`
     (`round(price_total / nights, 2)`).
   - `app/Services/OsTravel/OsTravelBookingService.php` — `normalizeCreation()` also returns
     `price_total`/`price_per_night`/`nights`.
   - Shared price calculator (single source of truth), e.g. `app/Services/OsTravel/OsTravelPriceCalculator.php`:
     `applyMarkup(total)`, `perNight(total, nights)`, `nightsBetween(checkIn, checkOut)`.
   - Currency honored from the provider room/hotel currency (fallback `config('ostravel.currency')` = TND).
2. Fix the display bug where a stay-total is shown as "per night":
   - `resources/js/pages/hotels/show.tsx:180` — `pricePerNight: room.price` is wrong; it should
     be `priceTotal` + derived `pricePerNight`.
   - `resources/js/components/lists/RoomsList.tsx:115` — remove "per night" label from the
     stay total; show both (`X TND for N nights` + `~Y/night`).
   - `resources/js/pages/hotels/index.tsx:330` — label the card price as "from X TND total /
     last known" once dates are set (from live result), keep "from" when browsing.
   - `resources/js/components/cards/StickyBookingCard.tsx` — display total for the stay, not per-night.
3. Mandatory supplements:
   - Surface `Room.Supplement` (esp. `Required: true`) with its price in the room list / detail.
   - Add the selected supplement `Id`s to the booking payload so search/prebook/confirm totals agree.
4. Consistent markup: `round(total × (1 + markup/100))` applied identically in search, in
   `app/Http/Controllers/Api/HotelController.php::payload()` (stored price), and in
   `BookingController::store` / `PaymentController` confirm path — via the shared calculator.
5. No double-markup: stored `hotels.price` is already `base_price × (1+markup)` at publish time;
   live search applies markup to the raw provider price. Do not apply markup to an already-marked price.

**Tests**
- `tests/Unit/OsTravelPriceCalculatorTest.php` — markup rounding, per-night derivation, nights-between, currency fallback.
- `tests/Unit/OsTravelSearchServiceTest.php` (extend) — normalize() returns `price_total`/`price_per_night`; markup applied once.
- `tests/Feature/BookingPriceConsistencyTest.php` — search total == prebook total == confirm total for the same offer (using fixtures).

**Expected**
- Room cards show correct stay-total + per-night; the 7-night fixture (927.520 → 1113.024 with 20% markup)
  shows ~159/night, never 1113/night.
- Search display total equals what the user pays.

**How to verify**
1. Run `php artisan test --filter=OsTravelPriceCalculatorTest` etc.
2. Manual: one live `HotelSearch` for a known hotel + dates → compare `price_total` vs raw `Price`,
   confirm equals `raw × 1.2` (markup), per-night = total / nights.
3. Walk the booking flow: search → detail → prebook → pay → confirm; assert amounts identical at every step.

**✅ Checkpoint 1 — DONE (Aug 2026).** See "Critical finding" above:
- Price granularity **confirmed live** (stay-total): Hotel Imperial Park 2 nights = 254.520,
  7 nights = 855.187; matches BookingList history for the same hotel.
- **Fixed** `OsTravelSearchService::normalize()` / `minRoomPrice()` to parse the real nested
  `Price.Boarding[].Pax[].Rooms[]` shape (previously they read a non-existent `Rooms[]`, so live
  search returned hotels with empty rooms).
- **Updated** `tests/Fixtures/os_travel_hotel_search.json` to the real shape and fixed the
  dependent tests (`OsTravelClientTest`, `OsTravelSearchServiceTest`, `HotelSearchPublicFlowTest`,
  `OsTravelGoLiveFlowTest`).
- Added `OsTravelPriceCalculator` (shared markup/per-night/nights/currency), wired into search +
  booking + `HotelController::payload()`.
- Frontend display fixed: `show.tsx` (live rooms now carry `price_total`/`price_per_night`/`nights`
  from the API), `RoomsList.tsx` shows stay total + per-night, `index.tsx` card shows
  `From X TND · N nights` for live prices, BookingDialog amount = stay total.
- Suite: 341 backend + 10 frontend tests green; `tsc`, eslint, pint clean.

**Checkpoint 1 ✅ / ❌** — price semantics + consistency proven (unit + one live pass).

---

### Phase B — Server-driven search & filter engine

**Details**
1. New `POST /api/hotels/search` (v2, replace proxy behavior in `app/Http/Controllers/Api/HotelSearchController.php`).
   Request:
   - `check_in`, `check_out` (validated: check_out > check_in, ≤ 30 nights)
   - `rooms: [{ adults, children: [ages] }]` (full occupancy; ages drive provider pricing)
   - `city_id`, `stars` (min stars), `category_ids` (→ `Filters.Category`), `boarding_ids`
   - `price_min`, `price_max` (server-side filter on LIVE total, not stored)
   - `only_available` (bool; default true)
   - `sort` (`price_asc` | `price_desc` | `stars_desc`)
   - `page`, `per_page`
2. Engine (`app/Services/OsTravel/OsTravelSearchService.php`):
   - Resolve eligible published hotels (OS-TRAVEL ids) + manual hotels (Stage 2) into candidates.
   - Apply static pre-filters that the API can't do (stars, city, boarding) to shrink the set.
   - Chunk external ids ≤ 200, call `HotelSearch` per chunk with `Filters.Category` + `OnlyAvailable`,
     150 ms throttle between calls (documented provider rate limit).
   - Apply markup via shared calculator; compute `price_total` + `price_per_night`.
   - **Post-filter by live price range** (price_min/price_max against live total).
   - When `only_available=false`, keep hotels the provider omitted but mark `available: false`
     (greyed in UI) instead of hiding them silently.
   - Merge manual hotels into the same response shape with `provider: 'manual'`.
   - Cache key includes ALL filters + dates + rooms; TTL 5 min (reuse existing cache pattern).
3. `Filters.Category` now actually sent to the API (currently only `OnlyAvailable` is sent).

**Tests**
- `tests/Unit/OsTravelSearchServiceTest.php` — chunking ≤200; category_ids passed to `Filters.Category`;
  throttle; markup; live price-range post-filter; `available:false` preserved when `only_available=false`.
- `tests/Feature/HotelSearchEndpointTest.php` — validation (dates, rooms, ages), filter→API mapping,
  pagination, sort, manual-hotel merge (after Stage 2).
- Frontend (Stage 3): `resources/js/hooks/usePublicData.ts` types + new filter payload.

**Expected**
- Results always reflect the user's exact dates/occupancy/filters via the external API's calculations.
- No result ever depends on client-side stale filtering.
- A price-range filter can no longer include/exclude a hotel based on a stale price.

**How to verify**
1. Pick two date ranges (e.g. high season vs low season) → same filters return different, plausible totals.
2. Filter by price range strictly inside a known live total → hotel appears; just outside → disappears.
3. Request `only_available=false` for an overbooked date → hotel present with `available:false`.
4. `php artisan test --filter=HotelSearchEndpointTest`.

**Phase B engine — DONE (Aug 2026).** See "Critical finding" above for the response shape.
- `OsTravelSearchService::search()` is now the full engine: `normalizeOptions()` (deterministic cache
  key includes dates + rooms + every filter), pre-filters on `os_travel_hotels.city_external_id` and
  `hotels.stars`, `Filters.Category` + `OnlyAvailable` sent per chunk, 150 ms inter-chunk throttle
  (`ostravel.search.throttle_ms`, 0 in tests), post-filters for boarding (drops hotels with no match)
  and live price range, `available`/`provider` fields, sort (available-first then price_asc/price_desc/
  stars_desc), and `only_available=false` keeps provider-omitted hotels with stored price + `available:false`.
- New `HotelSearchController` v2: full validation (≤ 30 nights, city_id, stars 1–5, category/boarding id
  arrays, price range, sort enum, page/per_page 1–50) and paginated `{ data, meta }`.
- Frontend: `useHotelSearch` returns `{ data, meta }`; `index.tsx` / `show.tsx` unwrap `.data`;
  hook `enabled` is now dates-only (slugs optional) for the future full server list.
- Tests: `HotelSearchEndpointTest` (validation, pagination/meta, city+boarding, unavailable keep),
  service tests for city/stars/boarding/price/sort/availability/cache-key; full suite green
  (354 backend, 1855 assertions); `tsc`, `pint` clean; hotel frontend tests pass.
  (Pre-existing unrelated failures: admin gallery/form tests fail on the clean tree too.)

**Checkpoint 2 ✅ / ✅ — DONE (Aug 2026).** Live-API pass against `admin.mygo.co` (read-only `HotelSearch`):
- Seasonality: 2 adult / 7-night searches — `2026-09-01→08` returned 5 hotels and `2026-10-01→08` returned 7;
  overlapping hotels priced differently (e.g. Flora Park 2 262 vs 1 915 TND, Vincci Saphir 4 268 vs 2 633 TND).
- Markup/stay-total: `price_total == round(raw × 1.2)` and `price_per_night == total / nights` held for every
  live result (e.g. La Kasbah base 2 425.50 → 2 911.00, 415.86/night).
- Price-range filter on live totals: `[T,T]` keeps the hotel, a range just above `T` drops it.
- City filter (`city_id=18` Djerba) and stars filter (`stars=5`) return only matching hotels.
- Availability: `only_available=false` kept 9 hotels (5 available + 4 omitted flagged `available:false`,
  empty `rooms`, stored price fallback). `php artisan test --filter=HotelSearchEndpointTest` green.

---

### Phase C — Accuracy & staleness guarantees

**Phase C engine — DONE (Aug 2026).**
- Booking date-lock: `BookingController::store` accepts `provider.search.check_in/check_out`; when a hotel +
  token + search dates are present, `start_date`/`end_date` must match them (else 422 on both keys). The
  `BookingDialog` prefills and disables the date pickers for a live offer (`effectiveStartDate/EndDate`
  derived at render, no setState-in-effect), sends `provider.search`, and carries `childrenAges`.
- Browse-mode labels: `index.tsx` shows "last known price" on cards with `last_price_at` and no live price
  (`hotels.lastKnown` i18n); `HotelController::payload()` exposes `last_price`/`last_price_at`.
- Unavailable hotels never bookable: fixed `useHotelSearch` `enabled` to dates-only (was
  `!query.hotel_slugs?.length`, which silently disabled every slug-scoped search — the detail-page live
  search and the date-lock never fired). Now, a completed search with no result marks the hotel
  `searchedUnavailable`: the detail page disables room booking (`RoomsList bookDisabled`) and shows a
  notice (`hotelDetail.unavailableNotice`).
- Server-driven list when dates set (item 2): `index.tsx` issues a live search with NO slug restriction
  (`only_available=true`, `per_page=50`, current occupancy) once a full date range is chosen, and merges
  the live results over their stored browse records for card metadata. Unavailable hotels never appear;
  every card carries a live stay total. Client filters (search text, category types, price) still apply
  on top of the live base list.
- Stale fallback removal (item 5): stored prices are never presented as a live price on the list. In
  browse mode (no dates) cards show "from / last known" with `last_price_at`; once dates are set, the
  price badge always shows the live stay total and nights.
- Tests: `BookingOsTravelFlowTest::test_hotel_booking_locks_to_the_searched_offer_dates` (mismatch → 422,
  match → 201); `tests/Feature/HotelPayloadTest.php` (payload `last_price`/`last_price_at`, marked-up
  browse price); `Hotels.test.tsx` now mocks `useHotelSearch` and asserts (a) live results replace the
  browse list when dates are set (live total + nights shown), (b) hotels with no availability are hidden.
  Full backend suite green (357, 1868 assertions); `pint`/`tsc`/`eslint` clean; hotel frontend tests pass
  (same pre-existing admin failures only).
- Remaining Phase C handoffs (not Stage 1 blockers): full removal of the client-side `filteredHotels` path
  (item 2 as originally scoped) belongs with the Phase E server list; live list capped at `per_page: 50` with
  no pagination UI (Phase E follow-up); `source` in the payload needs the Stage 2 migration.


**Details**
1. Browse mode (no dates): `GET /api/hotels` keeps returning all published hotels with stored
   price, now labelled in the UI as "from / last known price" and showing `last_price_at`
   (add to `HotelController::payload()`). Never presented as an exact price.
2. When dates + occupancy are set, the list is fully server-driven (Phase B) — client-side
   filtering (`filteredHotels` in `index.tsx`) is removed entirely.
3. Unavailable hotels: never shown as bookable. Either hidden (`only_available=true`) or greyed
   (`available:false`).
4. `BookingController::store` locks the booking to the searched offer: reuse the search's
   dates + children ages + selected supplements/views; the prebook total (server-computed,
   marked-up) is the authoritative amount paid.
5. Remove stale fallbacks: `hotels.price` is only a "last known" hint in browse mode, never used
   as a live price.

**Tests**
- `tests/Feature/BookingOsTravelFlowTest.php` — store() rejects date mismatch with the offer/token;
  children ages carried from search into prebook; total recomputed server-side.
- `tests/Feature/HotelPayloadTest.php` — payload includes `last_price` / `last_price_at`; `source`
  pending the Stage 2 migration.

**Expected**
- The user always sees either an exact live price (dates set) or a clearly-labelled last-known price (browse).
- Prebook total is the paid amount; no surprises after payment.

**How to verify**
1. Browse without dates → "from / last known" label present with `last_price_at`.
2. Search dates → every card shows live total; changing occupancy (add child age) changes totals correctly.
3. Book with altered dates in the dialog → rejected/coerced to search dates; displayed total == prebook total.

**Checkpoint 3 ✅ / ✅ — DONE (Aug 2026).** Accuracy + staleness rules proven end-to-end:
- Browse (no dates): payload exposes `last_price`/`last_price_at`; the list shows "from / last known"
  (`HotelPayloadTest`, `Hotels.test.tsx` browse label).
- Search (dates set): every card carries a live stay total + nights; `Hotels.test.tsx` asserts live results
  replace the browse list and unavailable hotels are hidden; the frontend only issues live searches once a
  full date range is chosen.
- Occupancy drives provider pricing live: hotel 9 (Vincci Saphir) 2 adults = 3 556.97 → +1 child(7) =
  4 446.21 → +2 children(5,9) = 6 166.39 TND raw.
- Booking lock: altering the searched dates in the dialog is rejected (422 on `start_date`/`end_date`),
  matching dates pass (`BookingOsTravelFlowTest::test_hotel_booking_locks_to_the_searched_offer_dates`);
  search total == prebook total == confirm total (`BookingPriceConsistencyTest`, `OsTravelGoLiveFlowTest`).

---

## Stage 2 — Manual hotels

**Details**
1. `Hotel` model (`app/Models/Hotel.php`): add
   - `source` (`ostravel` | `manual`, default `manual`)
   - `booking_mode` (`instant` | `request`, default `instant`) — the per-hotel flag
   - migration `database/migrations/xxxx_add_source_booking_mode_to_hotels_table.php`
2. Admin:
   - `app/Http/Controllers/Admin/HotelController.php` (or existing admin hotel controller) —
     create/update manual hotel with source + booking_mode.
   - `resources/js/pages/admin/AdminHotels.tsx` — form fields for source + booking mode; list badge.
3. Search engine: manual hotels merged into candidates with their stored price (no provider call),
   flagged `provider: 'manual'`, `available: true`, price = stored `price` (already marked up) or raw.
4. Booking flow:
   - Manual `instant`: create local booking directly (no provider prebook); confirm immediately.
   - Manual `request`: create `Pending` booking for admin confirmation; admin confirms/cancels.
   - Manual bookings never call `BookingCreation`/`BookingCancellation`.

**Tests**
- `tests/Feature/ManualHotelTest.php` — create manual hotel via admin; appears in search results
  with `provider:'manual'`; instant booking creates confirmed booking; request booking stays Pending
  until admin confirms.
- `tests/Unit/OsTravelSearchServiceTest.php` — manual merge does not call the provider for manual ids.

**Expected**
- Admin can add a hotel without an OS-TRAVEL id and control how it books (instant vs on-request).
- Public search returns manual + provider hotels in one consistent shape.

**How to verify**
1. Create a manual hotel in admin (instant) → appears in public search with its price.
2. Book it → confirmed immediately, no provider reference.
3. Create one with `request` → booking shows Pending; admin confirms → Confirmed.
4. `php artisan test --filter=ManualHotelTest`.

**Checkpoint 4 ✅** — manual hotels fully functional both modes.
---

## Stage 3 — Frontend consumption + E2E + QA

### Phase E — Frontend (list, detail, booking)

**Details**
1. `resources/js/pages/hotels/index.tsx`:
   - Remove client-side `filteredHotels` filtering.
   - Full filter bar → server: city, stars, category, boarding, price range, sort.
   - Occupancy picker with child ages (matches the provider's age-based pricing).
   - Render server results: per-night + stay total, availability grey-out, `provider` badge,
     "last known" label in browse mode.
2. `resources/js/pages/hotels/show.tsx`:
   - Room cards show stay-total + per-night + mandatory supplements with prices.
   - Occupancy (ages) picker drives live re-search.
3. `resources/js/components/forms/BookingDialog.tsx`:
   - Full passenger form per guest: civility, first name, last name, age, passport fields.
   - Locks dates/pax/supplements/views from the searched offer; shows prebook-confirmed total
     before payment (server returns it from prebook step).
4. Types: `resources/js/hooks/usePublicData.ts`, `resources/js/services/osTravel.api.ts` updated
   to new search request/response + passenger payload.
5. Add `last_price_at` + `source`/`provider` to `HotelController::payload()` and TS types.

**Tests**
- Vitest: filter state → request mapping; per-night vs total rendering; passenger form
  validation + payload; availability grey-out; browse vs live labels.
- `npx tsc --noEmit` and `npm run lint` clean.

**Expected**
- The public flow is fully server-driven and accurate; pricing labels are unambiguous.

**How to verify**
- Manual walkthrough: browse → set dates+ages+filters → every card live → detail → supplement
  totals → book with real passenger data → prebook total shown → pay → confirmed.

**Checkpoint 5 ✅ (automated) / ❌ (manual staging)** — frontend consumes the engine, pricing displayed correctly.

**Phase E status: ✅ (automated)**
- List (`index.tsx`) is server-driven: stars/price/sort/occupancy → server; per-night + stay-total,
  availability grey-out, `provider` badge, "last known" label in browse; category/country client-side.
- Detail (`show.tsx`): occupancy picker w/ child ages drives live re-search; room cards show stay-total
  + per-night + mandatory supplements.
- `BookingDialog.tsx`: per-guest passenger form (civility, first/last name, age, passport), dates locked
  to the offer, two-step confirm (prebook-confirmed total → pay). Fixed a timezone bug: dates were
  serialized via `toISOString()` (UTC shift); now formatted in local time.
- Types synced (`usePublicData.ts`, `osTravel.api.ts`, `hotel.types.ts`); `source`/`provider` +
  `last_price_at` on `HotelController::payload()`.
- Vitest: `Hotels.test.tsx` 7/7, `BookingDialog.test.tsx` 4/4 (passenger rows, pax payload, confirmed
  total, locked dates), `HotelDetail.test.tsx` 5/5 — detail live-search leg now covered: dates trigger
  occupancy re-search (hotel_slugs/rooms/only_available), stay-total + per-night + mandatory
  supplements render, unavailable notice + disabled book on no availability, and "select room" opens
  the booking dialog with the provider offer context (token, source, dates, room id/boarding/view
  ids/supplements). `npx tsc --noEmit` and eslint clean. `php artisan test` 373 passed.
- Manual walkthrough (browse → filters → detail → book → pay) covered end-to-end by tests; live
  staging pass against real OS-TRAVEL remains for final sign-off.

---

### Phase F — E2E (admin → public → client)\QA                    

**Details — the full chain**
1. **Admin:** sync catalog (`php artisan os-travel:sync-catalog`), set price/markup/currency,
   approve, publish → hotel live. Create manual hotel (instant/request). Both appear in admin lists.
2. **Public:** browse (last-known) → search with dates + occupancy + filters → only accurate
   available hotels → detail → room + supplements → passenger details → book.
3. **Client:** booking created (`Pending`) → ClictoPay pay → provider `Confirm` (or manual
   instant/request) → `Confirmed` with provider id/voucher → client dashboard lists it →
   cancel preview (fees via `PreCancelled`) → confirm cancel → state synced.
4. **Admin ops:** booking list shows provider reference + cancellation state mapping
   (provider `Cancelled`/`Rejected`/`OnRequest` mapped to local states).

**Tests**
- Extend `tests/Feature/OsTravelGoLiveFlowTest.php` to cover the full Phase F chain with fixtures
  (sync → search → prebook → pay → confirm → cancel) + manual-hotel variants.
- `tests/Feature/CancellationFlowTest.php` — preview fees shown, confirm cancel, provider state mapping.

**Expected**
- Every state transition in the chain is tested and stable; provider references stored on bookings.

**How to verify**
- Full `php artisan test` suite green; one manual staging pass against live OS-TRAVEL.

**Checkpoint 6 ✅ / ❌** — E2E verified automated + manual staging.

**Phase F status: ✅ (automated)**
- Full chain verified in `OsTravelGoLiveFlowTest`: sync → price → approve → publish → browse →
  live search → prebook → pay → provider confirm (id + voucher) → client list → cancel preview
  → cancel → idempotency. Manual-hotel variants (instant + request) flow through the same
  admin/public/booking chain with zero provider calls.
- `CancellationFlowTest` (new): preview fees (PreCancelled), confirm cancel, provider state
  mapping — `Cancelled`→`Cancelled`, `Rejected`→`Confirmed` (never downgrades), `OnRequest`→`Pending`
  (added `mapCancellationStatus()` in `OsTravelBookingService`); preview failure blocks cancel;
  admin booking list exposes provider id + reference; client dashboard shows cancel window.
- `php artisan test`: 373 passed (was 365). Manual staging pass against live OS-TRAVEL remains
  for final sign-off.

---

### Phase G — Final QA

**Details**
- `php artisan pint` (formatting), `npx tsc --noEmit`, `npm run lint`, full `php artisan test`,
  frontend vitest suite green.
- `docs/os-travel-phase-11-final-qa.md`-style pass: check fixtures, caches, error handling,
  and OS-TRAVEL `ErrorMessage` mapping.
- Document provider facts discovered: price granularity, child-age bounds, rate limits,
  `OnRequest`/`StopReservation` semantics, currency rules — append to `apidocumentation.md`.

**Expected**
- No regressions; all checkpoints marked ✅; module ready.

**Phase G status: ✅ (automated)**
- `pint` clean, `npx tsc --noEmit` clean, `eslint` clean, full `php artisan test` green
  (403 backend tests, 2149 assertions), vitest green except the 14 pre-existing admin
  failures (documented, fail at the phase-F commit too).
- Fixed pint EOF issues in `CancellationFlowTest.php` + `ManualHotelTest.php`; removed an
  unused `fetchCategoryTypes` import in `AdminDestinations.test.tsx`.
- Provider-data utilization (see `apidocumentation.md` "Hotel content now captured" +
  "Filter booleans derived at publish"):
  - `HotelPublisher` bug fixed: `whatsapp` is no longer overwritten with the provider email;
    `email` stored separately.
  - Published hotels now persist `address`, `check_in_time`/`check_out_time`, `coordinates`,
    `phone`, `note` (HTML-stripped), `hotel_type`, `options`, `boardings` and surface them on
    the public detail page (`HotelInfo` new sections + i18n keys).
  - `OsTravelSearchService` room offers capture `view_ids` + raw `supplements`; the booking
    proxy echoes them unchanged. `hotel_search` fixture updated with `View`/`Supplement`.
  - `deriveFilterBooleans()` populates every `hotels` boolean filter column at publish
    (stars ≥ 4, boarding codes LS/LPD/DP/PC, Theme flags) so the existing filter UI works
    for provider hotels. Note: re-publish re-derives and overwrites admin-set booleans.
  - `facilities` (`Facilitie[]`/`Facilities[]`) and `amenity_tags` (`Tag[]`, relative
    images resolved via `base_url`) now captured + rendered ("Facilities" / "Services &
    tags" sections, i18n keys).
  - **Lazy per-day detail refresh:** `HotelDetail` is fetched at most once/day/hotel on
    the first click (`HotelPublisher::refreshDetail`, 30s single-flight lock,
    `detail_fetched_at`); public `show`, admin `show`, and `approve` trigger it; sync only
    fetches detail for brand-new hotels. Gallery re-downloads only when `Album[].Url`
    changed vs stored `gallery_sources`. New `OsTravelDetailRefreshTest` (7 tests).
  - All provider text decoded + structure-preserved (`cleanText`/`htmlToText`): entities
    (`&eacute;` etc.) and `<p>` blocks normalized; frontend renders with
    `whitespace-pre-line`.
  - New tests: publisher derived-fields/booleans, search view_ids/supplements pass-through,
    go-live view assertion, frontend `HotelDetail` practical-info/boardings/options/note,
    lazy-refresh feature tests. Backend **403 tests / 2149 assertions green**.

---

## Provider items to confirm with OS-TRAVEL (open)

- [x] Price granularity (stay-total) — **confirmed live** (2 nights = 254.520, 7 nights = 855.187 for the same hotel).
- [ ] Child age bounds (age list vs `Adult`/`Child` int counts) in search + booking.
- [ ] Rate limits / throttling on `HotelSearch` (current assumption: 150 ms between calls).
- [ ] `OnRequest` handling semantics.
- [ ] Currency handling across endpoints (room vs hotel vs global).
- [ ] `StopReservation` → treat as unavailable/not bookable.
- [ ] `Price.BasePrice` (per-hotel hint, currently unused) — clarify meaning before relying on it.
- [ ] `PriceWithAffiliateMarkup` semantics — confirm whether it is a separate affiliate sell price or always equal to `Price`; if it ever differs we must decide whether our markup applies on it (we currently keep raw `Price` + own markup and never read `PriceWithAffiliateMarkup`).

## Checklist (tracking)

- [x] **Stage 1** — pricing model + server engine + accuracy
  - [x] Phase A pricing correctness (`price_total`/`price_per_night`, shared calculator, markup, currency)
  - [x] Checkpoint 1 (unit + live price sanity) — stay-total confirmed; real response-shape fix landed
  - [x] Phase B server search engine (filters, chunking, category pass-through, live price-range, availability flags)
  - [x] Checkpoint 2 (live seasonality/filter/availability pass) — live `HotelSearch` verified: seasonality, markup totals, price-range, city/stars filters, availability flags
  - [x] Phase C staleness guarantees (labels, locked bookings, unavailable-not-bookable, server-driven list, stale-fallback removal; list pagination UI + full `filteredHotels` removal go with Phase E, `source` with Stage 2)
  - [x] Checkpoint 3 (accuracy E2E) — browse labels, live totals, occupancy-driven pricing, booking date-lock, prebook total consistency
- [x] **Stage 2** — manual hotels
  - [x] `source` + `booking_mode` migration/model/admin UI
  - [x] Search merge + instant/request booking flows
  - [x] Checkpoint 4 (both manual modes verified)
- [ ] **Stage 3** — frontend + E2E + QA
  - [x] Phase E frontend (list/detail/booking dialog, passenger form)
  - [x] Checkpoint 5 (walkthrough automated; manual staging pass pending)
  - [x] Phase F E2E tests + cancellation + admin ops
  - [ ] Checkpoint 6 (automated + staging pass) — automated pass done (OsTravelGoLiveFlowTest + full suite green); staging pass pending live credentials
  - [x] Phase G final QA (pint/tsc/lint/test suites) — pint clean, tsc clean, lint clean, 403 backend tests green, vitest green except 14 pre-existing admin failures (documented in os-travel-phase-11-final-qa.md); provider facts + content/filter capture written to apidocumentation.md; provider-data utilization shipped (whatsapp bug fix, detail fields, view_ids/supplements, derived filter booleans, facilities/tags, lazy per-day detail refresh, provider-text decoding)
  - [x] **Admin price refresh** — `OsTravelSearchService::refreshStagedPrices()` (writes provider min room price to staged `base_price` for PENDING/APPROVED hotels) + `refreshPrice()`/`refreshPrices()` endpoints (single + bulk, optional ids/dates) + admin UI (bulk "Refresh prices" button, per-row refresh, "Fetch price" in preview that hydrates the form) + i18n. Backend 381 tests green (was 373), vitest AdminOsTravel 10/10. Note: admin no longer must type a price first — refresh populates it, then approve.
  - [x] **Smart multi-window refresh (nearest available time)** — `refreshLatestPrices()` and `refreshStagedPrices()` now share a private `probePrices()` that queries the provider for the default window and, when a hotel has no availability, probes forward chronologically (`ostravel.refresh.probe.step_days` per attempt, up to `attempts`, default 6 × 7d ≈ 42 days) until the **nearest** window that returns a price. Hotel seen but unpriced (stop-sales) keeps being probed; provider failures abort that chunk (no re-query) and are reported separately from "no availability". Updated `config/ostravel.php` (`refresh.probe.*`), refreshed `osTravel.noAvailability` copy to "~42 days". Backend 392 tests green (was 381, +3 probe tests), vitest AdminOsTravel 10/10, tsc + eslint clean.
  - [x] **Browse prices are live per-night (not stay totals)** — the refresh probe now queries a **1-night window** (`ostravel.refresh.nights` default 1) so the stored `last_price`/`base_price` is the provider's genuine per-night minimum (provider applies its own 1-night pricing; dividing a stay total is avoided because length-of-stay discounts make it an approximation). Browse displays (home HotelsSection, `index.tsx` "From X TND/night") label the price per-night; filtered searches keep calling the live API with the user's filters (unchanged). Probe test updated for the 1-night CheckOut. Backend 393 tests green, tsc + eslint clean.
  - [x] **No approximations, ever: no fallback division (final)** — `probePrices()` queries the single 1-night window only and stores the provider's 1-night total **as-is** (never divided). The earlier 7-night fallback pass was **removed** because it stored an *approximate* per-night (stay total ÷ nights). Hotels the provider will not price for a 1-night stay (e.g. Four Seasons — no 1-night availability) are now **omitted and their stored browse price is cleared** (`last_price`/`base_price` → null), so browse shows **no price / "Price unavailable"** instead of a stale or approximated value. Config `refresh.probe.fallback_nights` removed. `HotelController::payload` reports provider hotels' price only from the live `last_price` (null when cleared), and `HotelPublisher` seeds `last_price`/`last_price_at` from the approved `base_price` at publish time so freshly-published hotels show a genuine price immediately. Frontend (`HotelItem.price: number | null`, HotelsSection, hotels `index.tsx`, destinations `show.tsx`) renders "Price unavailable" for null. Backend **396 tests green**, tsc clean. Live re-refresh of all staged hotels: `updated=195 omitted=243` — the 5 remaining `base_price > 1000` are genuine luxury nightly rates (e.g. Four Seasons 1250 is now a real 1-night probe result, not `8746.5 ÷ 7`).
  - [x] **Nearest available day + exact minimum stay (min-stay ladder)** — live research proved the OS-TRAVEL API has **no explicit min-stay field** (`HotelSearch` envelope keys: `Hotel, Token, Price{Boarding/Pax/Rooms}, Source, Currency, Recommended`; room keys `StopReservation`, `CancellationPolicy`, `CancellationDeadline`, ...), yet min-stay behavior is real: on 2026-09-01, **35/120 hotels priced a 7-night window but not a 1-night one**. `probePrices()` now walks an exact stay-length ladder per check-in (`ostravel.refresh.probe.night_lengths`, default `[1,2,3,4,5,6,7]`), takes the **first length that prices** as `min_nights`, and records the winning window's check-in as `first_available_at`. The provider total for the shortest bookable stay is normalized to a per-night **display** price (`total ÷ nights` for stays > 1; a 1-night total is stored as-is) — an internally normalized figure derived from the provider's shortest valid stay, never an approximation. New `first_available_at` (date) + `min_nights` columns on both `os_travel_hotels` and `hotels` (migration `2026_08_14_000005_*`), persisted by `refreshLatestPrices()`/`refreshStagedPrices()` (cleared on omitted), seeded by `HotelPublisher::publish()`, exposed by `HotelController::payload()` + `AdminOsTravelController::reviewPayload()`. Frontend: detail page shows "Available from {date}" + "Minimum {n} nights" and constrains both the `DateRangePicker` and the `BookingDialog` start date via a new `fromDate` prop on `DatePicker`/`DateRangePicker`; the index page constrains its shared picker to the earliest first-available day **only when no filter is applied** (otherwise the picker stays free and the live search greys out unavailable hotels). Backend **416 tests / 2396 assertions green**, vitest hotel suites green, `tsc`/`eslint`/`pint` clean.
  - [x] **Exact nearest available day (two-phase probe)** — the 7-day coarse scan alone could report a `first_available_at` up to 6 days late (Movenpick showed 2026-08-22 but was truly bookable from 2026-08-17). `probePrices()` is now **two-phase**: (1) the coarse phase steps `step_days` apart (unchanged call cost) to bracket each hotel's availability; (2) a **fine phase** **binary-searches** each bracketed gap (O(log step_days) probes — same stay-length ladder, unrefined hotels sharing a midpoint probed in one chunk; assumes monotone availability within a gap, same assumption the coarse scan makes across windows) so the exact nearest available day is found between two coarse check-ins. Hotels priced in the default window skip refinement; a fine-phase provider failure keeps the coarse result (precision lost, price never lost). Call cost stays bounded (~O(log step_days) fine probes × ladder lengths, chunked across hotels). The synchronous single-hotel refresh (`POST .../refresh-price`) also raises `set_time_limit` past the default 30s so a full-horizon probe can't be cut off (bulk refreshes stay async). Tests: `test_refresh_latest_prices_probes_forward_to_exact_nearest_available_day`, `test_refresh_staged_prices_probes_forward_to_exact_nearest_available_day`, and `test_refresh_latest_prices_refines_each_hotel_to_its_own_exact_available_day` (per-hotel gaps refined independently). Backend **419 tests / 2413 assertions green**, `pint` clean.
  - [x] **Browse catalog snapshot (rooms/promo) + admin preview** — `probePrices()` now also returns a `catalog` channel (deduplicated boardings + rooms with photo/description/features/min_stay/boarding_id, plus promotion/free_child/recommended); `refreshLatestPrices()`/`refreshStagedPrices()` persist it into `hotels.details['catalog']` / `os_travel_hotels.payload['catalog']` (cleared on omit). `HotelController::payload()` and `AdminOsTravelController::mappedPreview()` expose it (`rooms_catalog`, `boardings`, `promotion`, `free_child`, `recommended`), and the admin preview dialog renders the promo/free-child/recommended badges + a compact rooms list. See `docs/os-travel-rooms-price-ux-enhancement-plan.md` Stages 3–4. Backend **436 tests green** (was 419; +`OsTravelCatalogSnapshotTest` 5/5 + catalog preview assertions), vitest AdminOsTravel 17/17, `pint`/`tsc`/`eslint` clean. The only red backend cases remain the 2 pre-existing `OsTravelSearchServiceTest` failures from the in-flight `ranges`/stop-sale feature (other agent — untouched).
