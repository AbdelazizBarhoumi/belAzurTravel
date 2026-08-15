# OS-TRAVEL API Maximization: Hotel Rooms, Price & Availability UX — Plan & Tracking

Status of the hotels module enhancement: surface the maximum of the OS-TRAVEL
`HotelSearch` response on the hotel show page, add a boarding switcher, fix
room imagery/currency/badges, and persist a browse-mode room/boarding/promo
catalog so price & availability are honest without a live call.

**Reference documents**
- `apidocumentation.md` — OS-TRAVEL API reference (response shapes)
- `endpoints-schema-data.json` — real request/response samples
- `docs/hotel-search-pricing-rework-plan.md` — prior stages (A–G), pricing semantics locked
- `docs/os-travel-phase-9-live-search.md`, `docs/os-travel-phase-9-transactional.md`,
  `docs/os-travel-phase-10-booking.md`, `docs/os-travel-phase-11-final-qa.md` — prior phases

---

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Implementation cadence | Staged with checkpoints (verify each stage before moving on) |
| Scope | Full: live-data normalization + browse snapshot persistence + admin preview |
| Boarding UX | Boarding tabs on the show page (default = cheapest boarding) |
| Price source of truth | Raw `Room.Price` + our own markup via `OsTravelPriceCalculator` (never double-markup) |
| Browse snapshot storage | Reuse existing JSON columns: `hotels.details['catalog']` + `os_travel_hotels.payload['catalog']` (no migration) |
| Snapshot cadence | Written by the scheduled `os-travel:refresh-latest-prices` (and admin `refresh-prices`); backfill once after deploy |
| Room imagery | Provider `Room.Photo` when present → graceful placeholder (never a broken `<img>`) |
| Room photo exposure | **Encrypted proxy** (`/api/hotels/images/{token}` via `OsTravelImageProxy`) — the public response/markup never exposes the provider host (existing credential-leak guard) |
| `PriceWithAffiliateMarkup` | Do not use for pricing (keep raw `Price` + own markup); add to open-items for OS-TRAVEL confirmation |

---

## Current state (verified Aug 2026)

- **E2E flow is solid:** catalog sync → `os_travel_hotels` staging → admin approve →
  `HotelPublisher` → `hotels` → browse payload (`GET /api/hotels`, 10-min cache);
  live `POST /api/hotels/search` → `OsTravelSearchService` → detail rooms →
  `PreBook`/`Confirm` booking; scheduled `refreshLatestPrices`/`refreshStagedPrices`.
  Backend 419 tests / 2413 assertions green; `pint`/`tsc`/`eslint` clean.

### Data the provider sends that the pipeline currently DROPS

Verified by grepping `app/` (zero production references except test fixtures):

| Level | Field | Sample | Current handling |
| --- | --- | --- | --- |
| Hotel | `Promotion.{Title,Description,Rate}` | `Rate: "29.00"` | dropped |
| Hotel | `FreeChild[].{Order,Age}` | `[{Order:1, Age:5}]` | dropped |
| Hotel | `Recommended` | `0`/`1` | dropped |
| Hotel | `ShortDescription` / `HotelDescription` | HTML | dropped (only `LongDescription` stored) |
| Room | `Photo` | `null` (may be a URL) | dropped |
| Room | `Description` | `""` | dropped |
| Room | `Icones` | `[null]` (may be items) | dropped |
| Room | `NotRefundable` | `true` | dropped |
| Room | `CancellationDeadline` | `"16/08/2026 00:00"` | dropped |
| Room | `Retrocession` | `"29/08/2026"` | dropped (admin-only info) |
| Room | `PriceWithAffiliateMarkup` | `= Price` | dropped (pricing stays raw `Price` + own markup) |

### UI defects found on the show page

1. **Broken room image** — live rooms carry `images: []`; `RoomsList` renders
   `<img src={undefined}>` (`resources/js/components/lists/RoomsList.tsx:83`).
2. **No boarding selector** — the provider prices every room per boarding
   (fixture: Double Standard = 927 TND `LPD` vs 1080 TND `DP`), yet all offers are
   dumped as separate flat cards (`show.tsx` builds `displayRooms` without grouping).
3. **Hardcoded currency `TND`** — `show.tsx:403,513` (`StickyBookingCard currency`) and
   `RoomsList.tsx:174`, despite `liveHotel.currency`.
4. **Missing room badges** — `NotRefundable`, `CancellationDeadline`, `OnRequest` not surfaced.
5. **Sticky card shows a price while unavailable** — no "no availability for these dates" state.
6. **Browse mode (no dates) has no rooms/boardings/promo** — the scheduled refresh
   (`probePrices` base phase) receives the full offer set and discards everything but the price.

---

## Stage 1 — Backend normalization: capture the full provider payload

**Goal:** the live search response carries every usable provider field, so the
frontend can render rooms/prices/availability honestly.

### Phase A — Room & hotel field capture in `OsTravelSearchService`

**Details**
1. `app/Services/OsTravel/OsTravelSearchService.php`:
- `roomOffers()`: also capture
      - `photo` (`Room.Photo`, resolve provider-relative URL like `HotelPublisher::resolveProviderUrl`)
      - `description` (`Room.Description`)
      - `icones` (normalized list of non-empty strings from `Room.Icones`)
      - `not_refundable` (`Room.NotRefundable`)
      - `cancellation_deadline` (`Room.CancellationDeadline` parsed via `parseProviderDate`)
      - `retrocession` (`Room.Retrocession`, raw — admin-only)
    - `normalize()`: map each offer onto the room result as
      `image` / `description` / `features` (from `icones`) / `not_refundable` /
      `cancellation_deadline` / `retrocession`. `image` is emitted through
      `OsTravelImageProxy::publicUrl()` (encrypted, URL-safe token) so the public
      JSON/markup never leaks the provider host; a `GET /api/hotels/images/{token}`
      endpoint decrypts, SSRF-guards, fetches and streams the photo server-side.
    - Hotel-level: add `promotion` (`{title, description, rate}`), `free_child`
      (list of ages), `recommended` (bool) and `short_description` onto the result
      from the provider envelope — surfaced in `basePayload()` too.
    - Keep the pricing source of truth unchanged (`Room.Price` → `applyMarkup`).
2. TypeScript types:
   - `resources/js/api/osTravel.api.ts` — extend `OsTravelSearchRoomResult` and
     `OsTravelSearchResult` with the new fields.
   - `resources/js/hooks/usePublicData.ts` — extend `HotelSearchResult`/`rooms` mirror.

**Tests**
- `tests/Unit/OsTravelSearchServiceTest.php` (extend): `roomOffers()`/`normalize()`
  capture `photo`, `description`, `features` from icones, `not_refundable`,
  `cancellation_deadline`; hotel result carries `promotion`, `free_child`,
  `recommended`, `short_description`.
- `tests/Feature/HotelImageProxyTest.php` (new): proxy round-trips a provider image,
  rejects private hosts and tampered tokens, and 404s on upstream failure.
- `tests/Fixtures/os_travel_hotel_search.json` — add the new fields to a fixture
  room/hotel so assertions cover them.

**Expected**
- Live search responses carry room photos, descriptions, feature icons, refund
  status, cancellation deadlines, hotel promo/free-child/recommended/short-description.

**How to verify**
1. `php artisan test --filter=OsTravelSearchServiceTest`.
2. One live `HotelSearch` for a known hotel → confirm the new fields appear in the JSON.

**Checkpoint 1 ✅** — normalization surfaces the full provider payload.

---

## Stage 2 — Show-page rooms + price/availability UX

**Goal:** the hotel show page shows rooms by boarding with honest prices,
correct currency, useful badges, and clear availability states.

### Phase B — Boarding tabs + room rendering

**Details**
1. `resources/js/pages/hotels/show.tsx`:
   - Add `selectedBoarding` state; group `liveRooms` by `boarding_id`/`boarding_name`.
   - Render a boarding tab selector (defaults to the cheapest boarding by
     min `price_total`). Selecting a tab filters `displayRooms`.
   - Static admin rooms (no boarding) merge by name under every tab as metadata
     fallback; when no live search, show static rooms + a hint to pick dates.
   - `toRoomView`: `images` falls back to `room.photo`.
   - Currency: `const currency = liveHotel?.currency ?? detail.currency ?? 'TND';`
     pass to `StickyBookingCard` (both) and `RoomsList`.
   - Sticky card price area: when `searchedUnavailable`, render the
     "no availability for these dates" state instead of the price.
2. `resources/js/components/lists/RoomsList.tsx`:
   - Accept a `currency` prop (remove hardcoded `TND`).
   - Render a graceful placeholder block (hotel image / icon) when `images` is empty.
   - Badges: `NotRefundable` → red "Non-refundable"; `CancellationDeadline` →
     "Free cancellation until {date}"; keep On-Request / Min-stay / Stop-sale.
3. `resources/js/components/cards/StickyBookingCard.tsx` — no change needed beyond
   the caller passing the right currency (verify).

**Tests**
- `resources/js/test/HotelDetail.test.tsx` (extend): boarding tabs render and filter;
  promo/free-child/recommended badges; non-refundable/deadline badges; room photo
  fallback; currency from the live result; unavailable sticky state.
- `resources/js/test/Hotels.test.tsx` (extend): promo/free-child badges on cards.

**Expected**
- Room cards are grouped by boarding, show real per-boarding totals, never a broken
  image, correct currency, and honest refund/cancellation info.
- The user is told exactly when a hotel has no availability for the searched dates.

**How to verify**
1. `npx vitest run HotelDetail.test.tsx Hotels.test.tsx`.
2. Manual: open a provider hotel → set dates → switch boardings → totals update;
   pick an unavailable window → sticky card shows the unavailable state.

**Checkpoint 2 ✅** — show-page rooms/pricing UX shipped.

**Phase B — DONE (Aug 2026).** `show.tsx` groups live rooms by
`boarding_id`/`boarding_name` into a boarding tab selector that defaults to the
cheapest boarding (min `price_total`) and filters the displayed rooms; static
admin rooms merge by name as metadata fallback and a "pick dates" hint shows
when no live search has run. Room imagery falls back to the live provider photo
(`room.image` proxy URL) when no static image exists, and `RoomsList` renders a
muted placeholder instead of a broken image. Currency is now
`liveHotel?.currency ?? detail.currency ?? 'TND'` (with `currency` added to
`HotelDetailLookupData`) and flows to both sticky cards and every room price.
`RoomsList` accepts a `currency` prop and adds badges: red
"Non-refundable" (`not_refundable`), green "Free cancellation until {date}"
(`cancellation_deadline`), alongside the existing On-Request / Min-stay /
Stop-sale. When `searchedUnavailable`, both sticky cards hide the price and
show the "Indisponible pour ces dates" badge; hotel cards render promo
(`promotion.title`) and free-child (`free_child`) badges in live mode. i18n keys
added (fr/ar/en). Tests: `HotelDetail.test.tsx` 12/12 (boarding tabs + filter,
promo/free-child/recommended, non-refundable/deadline, photo fallback,
live currency, unavailable sticky), `Hotels.test.tsx` 8/8 (promo/free-child
cards), `tsc` + `eslint` clean. Only pre-existing unrelated `AdminHotels`
failures remain in the suite.

---

## Stage 3 — Persist a browse catalog (rooms/boardings/promo)

**Goal:** browse mode (no dates) and the pre-search detail page show
"rooms from X/night · All-inclusive · -29%" from a stored snapshot — never a
fabricated or stale number.

### Phase C — Capture + persist the offer catalog during refresh

**Details**
1. `app/Services/OsTravel/OsTravelSearchService.php`:
   - `probePrices()` base phase already parses `roomOffers()` per hotel — also
     build a normalized `catalog` per hotel: `boardings` (id/code/name),
     `rooms` (name, photo, description, icones/features, min_stay), `promotion`,
     `free_child`, `recommended`. Return it as a third channel alongside `prices`.
   - `refreshLatestPrices()`: write `details['catalog']` (+ `promotion`,
     `free_child`, `recommended`) onto the linked `hotels` row.
   - `refreshStagedPrices()`: persist the same catalog onto the staging row
     `payload['catalog']` so the admin preview can show it before publish.
2. `app/Http/Controllers/Api/HotelController.php`:
   - `payload()`: expose `rooms_catalog`, `promotion`, `free_child`, `recommended`
     from `details` (browse + pre-search detail read path).

**Tests**
- New `tests/Feature/OsTravelCatalogSnapshotTest.php`:
  - `refreshLatestPrices()` persists `details.catalog` (boardings, rooms,
    promotion, free_child, recommended) on the linked hotel.
  - `refreshStagedPrices()` persists `payload.catalog` on the staging row.
  - `HotelController::payload()` exposes the new keys.
- Extend `HotelPayloadTest` if needed.

**Expected**
- After one scheduled refresh (or one admin "Refresh prices"), browse cards and
  the pre-search detail page show room/boarding/promo data with no live call.

**How to verify**
1. `php artisan test --filter=OsTravelCatalogSnapshotTest`.
2. Run `php artisan os-travel:refresh-latest-prices` on a sample hotel → confirm
   `hotels.details` gains `catalog`; public `GET /api/hotels/{slug}` returns it.

**Checkpoint 3 ✅** — browse snapshot persisted and exposed.

**Done (Aug 2026):** `probePrices()` now returns a third `catalog` channel
(keyed by external id) built by `catalogOf()` — deduplicated `boardings`
(id/code/name) and `rooms` (name, `photo` via `OsTravelImageProxy::publicUrl`,
description, `features` from `Icones`, `min_stay`, `boarding_id`) plus hotel
`promotion`/`free_child`/`recommended`. `refreshLatestPrices()` merges it into
`hotels.details['catalog']` (and clears it when the hotel is omitted);
`refreshStagedPrices()` writes the same into `os_travel_hotels.payload['catalog']`.
`HotelController::payload()` exposes `rooms_catalog`, `promotion`, `free_child`,
`recommended` with safe empty defaults. Tests: new
`tests/Feature/OsTravelCatalogSnapshotTest.php` 5/5 (refresh latest persists
catalog + clears on omit, refresh staged persists on payload, payload exposes
keys, payload defaults when no catalog). `OsTravelSearchServiceTest` +
`HotelPayloadTest` otherwise green; the only `OsTravelSearchServiceTest`
failures are 2 pre-existing ones from the in-flight `ranges`/stop-sale feature
(other agent) — untouched. `pint` clean on changed files.

---

## Stage 4 — Admin preview: promo + rooms

**Goal:** admins see exactly what ships to the public — promo, free-child,
recommended, and the room catalog — before approving.

### Phase D — Admin preview payload + UI

**Details**
1. `app/Http/Controllers/Api/AdminOsTravelController.php`:
   - `mappedPreview()` / `reviewPayload()`: surface `promotion`, `free_child`,
     `recommended`, and `rooms_catalog` from the staging `payload['catalog']`
     (populated by `refreshStagedPrices`).
2. `resources/js/pages/admin/AdminOsTravel.tsx`:
   - Preview dialog: render a promo/free-child/recommended line and a compact
     rooms list (name, photo or placeholder, min-stay, cheapest boarding label).
   - Add i18n keys (`osTravel.promotion`, `osTravel.freeChild`, `osTravel.roomsCatalog`,
     etc.) in `resources/js/i18n/translations.ts`.

**Tests**
- `tests/Feature/AdminOsTravelTest.php` (extend): preview payload includes the new keys.
- `resources/js/test/AdminOsTravel.test.tsx` (extend): promo + rooms render in the dialog.

**Expected**
- The admin preview is a faithful, complete preview of the public hotel page.

**How to verify**
1. `php artisan test --filter=AdminOsTravelTest`.
2. `npx vitest run AdminOsTravel.test.tsx`.
3. Manual: refresh a staged hotel → open preview → promo/rooms visible.

**Checkpoint 4 ✅ / ❌** — admin preview surfaces promo + rooms.

---

## Stage 5 — E2E / QA

**Details**
- `php artisan pint`, `npx tsc --noEmit`, `npm run lint`, full `php artisan test`,
  full frontend vitest suite green.
- Backfill browse catalog in the deployed environment: trigger one
  `php artisan os-travel:refresh-latest-prices` run (scheduled cadence already exists).
- Update `docs/hotel-search-pricing-rework-plan.md` checklist + open-items
  (`PriceWithAffiliateMarkup` confirmation).

**Expected**
- No regressions; all checkpoints marked ✅; the module uses the maximum of the
  provider response on the show page with honest price & availability.

**How to verify**
- Full suites green; one manual staging pass against live OS-TRAVEL
  (browse → dates → boarding switch → book).

**Checkpoint 5 ✅ / ❌** — E2E verified automated + manual staging.

---

## Provider items to confirm with OS-TRAVEL (open)

- [ ] `PriceWithAffiliateMarkup` semantics — confirm whether it is a separate affiliate sell price
      or always equal to `Price`; if it ever differs we must decide whether our markup applies on it.
- [ ] `Room.Photo` availability — confirm whether any hotel actually returns room photos in `HotelSearch`.
- [ ] `Room.Icones` shape — confirm the item format when non-null.
- [ ] `Retrocession` meaning — confirm it is a commission/retrocession date (admin-only).

## Checklist (tracking)

- [x] **Stage 1 — backend normalization**
  - [x] Phase A room/hotel field capture (`OsTravelSearchService` + TS types + fixture + image proxy)
  - [x] Checkpoint 1 (unit + live pass)
- [x] **Stage 2 — show-page rooms + price/availability UX**
  - [x] Phase B boarding tabs, room imagery fallback, currency, badges, unavailable sticky state
  - [x] Checkpoint 2 (vitest + manual)
- [ ] **Stage 3 — browse catalog persistence**
  - [x] Phase C `probePrices` catalog capture + `refreshLatestPrices`/`refreshStagedPrices` persist + `HotelController::payload` expose
  - [x] Checkpoint 3 (feature test + one refresh run)
- [ ] **Stage 4 — admin preview**
  - [ ] Phase D `AdminOsTravelController` preview keys + `AdminOsTravel.tsx` rooms/promo UI + i18n
  - [ ] Checkpoint 4 (backend + vitest)
- [ ] **Stage 5 — E2E / QA**
  - [ ] pint / tsc / eslint / full test suites green
  - [ ] Browse catalog backfilled in the deployed environment
  - [ ] Checkpoint 5 (automated + manual staging pass)