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
- The provider does **not** return `View` or `Supplement` in `HotelSearch` — bookings send empty
  `view_ids`/`supplements`.
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

**Checkpoint 2 ✅ / ❌** — server search engine verified against live API for seasonality, filters, availability.

---

### Phase C — Accuracy & staleness guarantees

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
- `tests/Feature/BookingControllerTest.php` — store() rejects date mismatch with the offer/token;
  children ages carried from search into prebook; total recomputed server-side.
- `tests/Feature/HotelControllerTest.php` — payload includes `last_price_at` + `source`.

**Expected**
- The user always sees either an exact live price (dates set) or a clearly-labelled last-known price (browse).
- Prebook total is the paid amount; no surprises after payment.

**How to verify**
1. Browse without dates → "from / last known" label present with `last_price_at`.
2. Search dates → every card shows live total; changing occupancy (add child age) changes totals correctly.
3. Book with altered dates in the dialog → rejected/coerced to search dates; displayed total == prebook total.

**Checkpoint 3 ✅ / ❌** — accuracy + staleness rules proven end-to-end.

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

**Checkpoint 4 ✅ / ❌** — manual hotels fully functional both modes.

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

**Checkpoint 5 ✅ / ❌** — frontend consumes the engine, pricing displayed correctly.

---

### Phase F — E2E (admin → public → client)

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

---

## Provider items to confirm with OS-TRAVEL (open)

- [x] Price granularity (stay-total) — **confirmed live** (2 nights = 254.520, 7 nights = 855.187 for the same hotel).
- [ ] Child age bounds (age list vs `Adult`/`Child` int counts) in search + booking.
- [ ] Rate limits / throttling on `HotelSearch` (current assumption: 150 ms between calls).
- [ ] `OnRequest` handling semantics.
- [ ] Currency handling across endpoints (room vs hotel vs global).
- [ ] `StopReservation` → treat as unavailable/not bookable.
- [ ] `Price.BasePrice` (per-hotel hint, currently unused) — clarify meaning before relying on it.

## Checklist (tracking)

- [ ] **Stage 1** — pricing model + server engine + accuracy
  - [x] Phase A pricing correctness (`price_total`/`price_per_night`, shared calculator, markup, currency)
  - [x] Checkpoint 1 (unit + live price sanity) — stay-total confirmed; real response-shape fix landed
  - [ ] Phase B server search engine (filters, chunking, category pass-through, live price-range, availability flags)
  - [ ] Checkpoint 2 (live seasonality/filter/availability pass)
  - [ ] Phase C staleness guarantees (labels, locked bookings, no stale fallbacks)
  - [ ] Checkpoint 3 (accuracy E2E)
  - [ ] Phase B server search engine (filters, chunking, category pass-through, live price-range, availability flags)
  - [ ] Checkpoint 2 (live seasonality/filter/availability pass)
  - [ ] Phase C staleness guarantees (labels, locked bookings, no stale fallbacks)
  - [ ] Checkpoint 3 (accuracy E2E)
- [ ] **Stage 2** — manual hotels
  - [ ] `source` + `booking_mode` migration/model/admin UI
  - [ ] Search merge + instant/request booking flows
  - [ ] Checkpoint 4 (both manual modes verified)
- [ ] **Stage 3** — frontend + E2E + QA
  - [ ] Phase E frontend (list/detail/booking dialog, passenger form)
  - [ ] Checkpoint 5 (manual walkthrough)
  - [ ] Phase F E2E tests + cancellation + admin ops
  - [ ] Checkpoint 6 (automated + staging pass)
  - [ ] Phase G final QA (pint/tsc/lint/test suites)
