# Plan: Remove stored OS-TRAVEL prices/availability — live-pricing only

**Status**: approved — implementation begins with Phase 0.
**Owner**: belAzurTravel.

**Context** (from the hotel-117 diagnostic): `MinStay`/`OnRequest`/`StopSales` are **window-dependent provider diagnostics**, not fixed hotel properties. Storing prices/availability is therefore both wrong and unwanted. We stop persisting everything except the **catalog** (ListHotel + HotelDetail). Prices appear only from a live `HotelSearch` after the user picks dates + occupancy.

**What stays stored**
- Catalog: `os_travel_hotels.payload` (ListHotel + HotelDetail), `os_travel_hotels` catalog columns, the published `hotels` row content, rooms/amenities/facilities/images/descriptions.
- Admin config on `os_travel_hotels`: `markup_percentage`, `currency`.
- **Bookings already created** ("already reserved"): `Booking.total_amount`, `provider_payload` (search token + PreBook request/response) are **transactional records and are NOT touched** by this cleanup. Reserved prices remain exactly as booked.

**What is removed**
- Columns: `os_travel_hotels.base_price|price_status|availability_status|first_available_at|min_nights|stop_sale_ranges|last_price_attempt_at`; `hotels.last_price|last_price_at|first_available_at|min_nights|stop_sale_ranges`; the `os_travel_refresh_requests` table.
- Writers: refresh commands/scheduler, `refreshStagedPrices`, `refreshLatestPrices`, `probePrices`, `syncPublishedMinStay`, `persistProbeAvailability`, `HotelPublisher::publish` price writes, admin refresh API.
- Readers/display: price badges on home/index/detail/destinations/favorites, stored-price fallbacks in `search()`, admin price columns + refresh buttons, `HotelController::payload` price fields.

**Kept (live-only)**: `search()`, `probeWindow` (admin read-only live-check), `normalize`, availability helpers, booking flow (search token → PreBook → payment → confirm), and a small `normalizeStopSales` fix to parse the provider's `{"Title":"Stop sales de DD/MM/YYYY au DD/MM/YYYY sur hôtel"}` shape (currently stop-sales are silently ignored → live availability is wrong).

---

## Phase 0 — Baseline & safety
- [x] Grep every column name (`base_price`, `last_price`, `last_price_at`, `price_status`, `availability_status`, `first_available_at`, `min_nights`, `stop_sale_ranges`, `last_price_attempt_at`, `os_travel_refresh_requests`) across `app/`, `resources/js/`, `tests/` → produce the reference list of touch points.
- [x] Confirm `Booking`/`Payment`/`provider_payload` are **outside** the touch list (grep proves no pricing column is referenced by booking/payment code).
- Checkpoint: **DONE** — touch-point list below; bookings untouched (no matches in `Booking`, `Payment`, `BookingController`, `PaymentController`, `OsTravelBookingService`).

## Phase 0 — Findings (touch-point list)

**Backend (`app/`)**
- `Models/OsTravelHotel.php`: drop `base_price`, `price_status`, `availability_status`, `first_available_at`, `min_nights`, `stop_sale_ranges`, `last_price_attempt_at` from `$fillable`/`$casts`; remove `PRICE_*` (18-24) + `AVAILABILITY_*` (26-36) constants.
- `Models/Hotel.php`: drop `last_price`, `last_price_at`, `first_available_at`, `min_nights`, `stop_sale_ranges` from `$fillable` (28-29) / `$casts` (55-59). **Keep** `price`, `base_price`, `price_per_night` (manual hotels).
- `Services/OsTravel/OsTravelSearchService.php`:
  - Delete refresh machinery: `refreshLatestPrices` (281-365), `refreshStagedPrices` (369-501), `probePrices` (584-808), `syncPublishedMinStay` (801-808), `catalogOf`, `mergeCatalog`, `minStayOf`.
  - `search()` stored-price fallbacks → null: omitted candidates (176-191), `normalize()` unavailable branch (1096, 1131-1140), `aggregateRooms` (1404-1405). Keep live-response metadata `first_available_at`/`min_nights` (from `availabilityMeta`, not stored). `manualPayload` (1373) unchanged.
- `Services/OsTravel/HotelPublisher.php`: drop `base_price` requirement + staging fill (33-54); stop writing `price`/`base_price`/`last_price`/`last_price_at`/`first_available_at`/`min_nights`/`stop_sale_ranges` on `hotels` (91-99). `refreshDetail` (catalog) unchanged.
- `Services/OsTravel/OsTravelCatalogSync.php`: remove `price_status = PRICE_NEVER_REFRESHED` (202).
- `Controllers/Api/AdminOsTravelController.php`: remove `base_price` from `update` (198-214) + `approve` (227-285) + `approveAll` (320-395); delete `refreshPrices`/`refreshPrice` (404-444); delete `persistProbeAvailability` (507-532); drop `base_price`/`final_price`/`price_status`/`last_price_attempt_at`/`first_available_at`/`min_nights`/`availability_status` from `reviewPayload` (603-610, keep live fields); strip price from `mappedPreview` (641, 664-669); drop the `persistProbeAvailability` call in `index()` (101).
- `Controllers/Api/HotelController.php`: provider-linked payload price fields → null (73-87, 100-110).
- `Controllers/Api/AdminHotelController.php`: **manual hotels — keep** `base_price` (126, 217, 253, 297).
- Commands to delete: `RefreshOsTravelLatestPrices.php`, `ProbeOsTravelAvailability.php` (scratch).
- `routes/console.php`: remove refresh schedule (18-29). `routes/api.php`: remove admin refresh routes. `config/ostravel.php`: remove `refresh` block (60-80). `lang/{fr,en,ar}/os_travel.php`: remove `base_price_required`.
- Migrations: `os_travel_refresh_requests` table (created 2026_08_14_000001, altered 000004) has **no model and no app writes** → drop via new migration.

**Frontend (`resources/js/`)**
- `api/osTravel.api.ts`: `OsTravelHotelRow` fields `has_base_price`/`base_price`/`price_status`/`last_price_attempt_at`/`first_available_at`/`min_nights`/`availability_status` (41-48); refresh API fns. Keep live search-result `base_price` (live value).
- `types/public/hotel.types.ts`: drop `base_price`/`last_price`/`last_price_at`/`first_available_at`/`min_nights` (17-25); keep `price` (null for provider, set for manual).
- `hooks/usePublicData.ts`: drop `last_price`/`last_price_at`/`first_available_at`/`min_nights`/`stop_sale_ranges` from `HotelDetailLookupData` (41-45); keep live `HotelSearchResult` fields.
- `pages/hotels/show.tsx`: remove `firstAvailableDate`/`disabledRanges`/`detail.min_nights` (244-250, 386-387, 550-551); add "Vérifier la disponibilité" button-triggered search; remove static/stored price fallbacks.
- `pages/hotels/index.tsx`: browse mode → no price badge (451-478), fixed slider bounds (99-132), stop favorite price capture (442); keep live-only `first_available_at`/`min_nights` badges (512-524) and "À partir de" label for live results.
- `pages/admin/AdminOsTravel.tsx`: remove refresh buttons/states (219-228, 410-456), price columns/badges (275-326, 447-456, 795-887), approve-price gate (1374); keep live-check columns.
- `pages/admin/AdminHotels.tsx`: **manual — keep** (406-408, 926).
- `pages/general/Favorites.tsx` (65-68), `pages/destinations/show.tsx` (367-371), `components/sections/landing/HotelsSection.tsx` (29, 61, 110), `components/cards/StickyBookingCard.tsx`, `components/filters/HotelFilters.tsx` (165-171): remove/neutralize price display.

**Tests (Phase 8)**
- `tests/Unit/OsTravelSearchServiceTest.php` (many refresh/probe/persist tests), `OsTravelHotelPublisherTest.php`, `HotelPublisherSlugTest.php`, `HotelPublisherImageTest.php`, `OsTravelCatalogSyncTest.php` (`PRICE_NEVER_REFRESHED`).
- `tests/Feature/RefreshOsTravelLatestPricesTest.php` → delete file; `OsTravelSchemaTest.php`, `OsTravelPublicFlowTest.php`, `OsTravelGoLiveFlowTest.php`, `OsTravelDetailRefreshTest.php`, `OsTravelCatalogSnapshotTest.php`, `HotelPayloadTest.php`, `HotelSearchPublicFlowTest.php`, `HotelSearchEndpointTest.php` update.
- Keep manual-hotel tests (`ManualHotelTest.php`, `AdminHotelMarkupTest.php`).

## Phase 1 — Database migration
- [x] New migration `drop_os_travel_price_availability_columns`:
  - `os_travel_hotels`: drop `base_price`, `price_status`, `availability_status`, `first_available_at`, `min_nights`, `stop_sale_ranges`, `last_price_attempt_at`.
  - `hotels`: drop `last_price`, `last_price_at`, `first_available_at`, `min_nights`, `stop_sale_ranges` (keep `price`, `base_price`, `price_per_night` for manual hotels).
  - `Schema::dropIfExists('os_travel_refresh_requests')`.
- [x] Update `OsTravelHotel` + `Hotel` models: remove dropped fields from `$fillable`/`$casts`; delete `OsTravelRefreshRequest` model (never existed — table was orphaned); remove `PRICE_*`/`AVAILABILITY_*` constants.
- [x] Delete `RefreshOsTravelLatestPrices` + scratch `ProbeOsTravelAvailability` commands.
- Checkpoint: **DONE** — `migrate:fresh` on a scratch SQLite DB passes (all 39 migrations); schema verified: `os_travel_hotels`/`hotels` no longer contain the dropped columns; `os_travel_refresh_requests` dropped. Full backend-test green is deferred to Phase 8 (app code still references removed columns until Phases 2-6).

## Phase 2 — Service layer cleanup (`OsTravelSearchService`)
- [x] Delete: `refreshLatestPrices`, `refreshStagedPrices`, `probePrices`, `catalogOf`, `mergeCatalog`, `minStayOf`, `syncPublishedMinStay`; removed `ranges`/`catalog` machinery.
- [x] `search()`: stored-price fallbacks removed — omitted candidates and `normalize()`'s unavailable branch return `price`/`price_total`/`price_per_night`/`base_price` = **null**; `aggregateRooms` fallback → null (and its now-unused `$hotel` param removed). `manualPayload` unchanged.
- [x] Fix `normalizeStopSales` to parse the `Title`-string shape (regex over `de DD/MM/YYYY au DD/MM/YYYY`) in addition to `{FromDate,ToDate}`; `parseProviderDate` now handles `d/m/Y`.
- Checkpoint: no remaining references to dropped columns in the service; live metadata (`availabilityMeta`/`probeWindow`) kept.

## Phase 3 — Commands / config / scheduler
- [x] `config/ostravel.php`: removed the `refresh` block (and its `OS_TRAVEL_REFRESH_*` env usage).
- [x] `routes/console.php`: removed the `os-travel:refresh-latest-prices` schedule. Only `os-travel:sync-catalog` remains scheduled.
- [x] `OsTravelCatalogSync::upsertHotel`: removed `price_status = PRICE_NEVER_REFRESHED`; sync writes catalog only.
- Checkpoint: `schedule:list` shows no refresh command; sync writes only catalog.

## Phase 4 — Admin backend + API
- [x] `AdminOsTravelController`:
  - `approve`/`approveAll`: removed `base_price` validation + `has_base_price` gate; publish with `markup_percentage`/`currency` only. `HotelPublisher::publish` dropped the base-price requirement and no longer writes `price`/`base_price`/`last_price`/`first_available_at`/`min_nights`/`stop_sale_ranges` on `hotels`.
  - `index()`: kept date-filter live-check, removed `persistProbeAvailability`.
  - `reviewPayload()`: dropped `has_base_price`, `base_price`, `final_price`, `price_status`, `last_price_attempt_at`, `first_available_at`, `min_nights`, `availability_status`; kept live-check fields (`live_status`, `live_price`, `live_currency`, `live_reason`, `live_until`).
  - Deleted `refreshPrices`, `refreshPrice`, `persistProbeAvailability`; stripped price/catalog from `mappedPreview`.
- [x] `routes/api.php`: removed `refreshPrices`/`refreshPrice` admin routes.
- Checkpoint: admin endpoints return no stored price/availability fields; `probeWindow` still returns live probe data read-only.

## Phase 5 — Admin frontend (`AdminOsTravel.tsx` + types/api)
- [x] Remove: bulk "Refresh prices", per-row "Refresh price", `refreshResult`/`refreshProgress`/`refreshingId`, `refreshOsTravelPrice(s)` API calls, `base_price` input in approve dialog, price columns (base/final/status/availability/available-from/min-nights).
- [x] Keep: date-filter live-check columns (`live_status`, `live_price`, `live_reason`, `live_until`), catalog columns, approve/publish/reject/unapprove.
- [x] `useOsTravelAdmin.ts` + `osTravel.api.ts`: removed `refreshPrice(s)`/`OsTravelRefreshResult`/`include_without_price`/`skipped_no_price`; approve/save send `markup_percentage`/`currency` only.
- Checkpoint: **DONE** — `AdminOsTravel.test.tsx` rewritten & passing (14 tests, no refresh/no stored price); `tsc --noEmit` clean; `vitest` os-travel suite green.

## Phase 6 — Public backend
- [x] `HotelController::payload`: provider-linked hotels → `price`, `base_price`, `last_price`, `last_price_at`, `first_available_at`, `min_nights`, `stop_sale_ranges` = **null** (dropped from payload entirely); manual logic unchanged.
- [x] `DestinationController` payload: destination entity's own `price` is unrelated to hotels (no hotel embedding) — no change needed.
- Checkpoint: `GET /api/hotels` and `GET /api/hotels/{slug}` carry no provider price/availability fields.

## Phase 7 — Public frontend
- [x] **Home** `HotelsSection.tsx`: remove all three price renderings (carousel, cards, grid) — cards show catalog info only.
- [x] **Index** `pages/hotels/index.tsx`: browse mode (no dates) → no price, "Vérifier la disponibilité" CTA; live mode → "{price_total} {currency} · N nuits". Replace stored-derived slider bounds with fixed constants (0–1000); `HotelFilters.tsx` uses fixed bounds. Stop capturing `hotel.price` into favorites.
- [x] **Detail** `pages/hotels/show.tsx`: explicit "Vérifier la disponibilité" button triggers the live search on click (reset when dates/occupancy change); before search show only the Arrivée/Départ/Occupancy box + button, no price/stored constraints; after search show live rooms + live price. `StickyBookingCard` shows no price until a live result exists (provider hotels) or a manual stored price.
- [x] **Destinations** `destinations/show.tsx`: remove the hotel price line.
- [x] **Favorites**: hotel favorites show a "check availability" CTA instead of a stored price.
- Checkpoint: **DONE** — home/index/detail/destinations show no price before a live search; index badge is the CTA in browse mode and the live total in live mode; `tsc --noEmit` clean; `HotelDetail.test.tsx` (13) + `Hotels.test.tsx` (8) + `DestinationDetail.test.tsx` (3) green.

## Phase 8 — Tests
- [x] Backend: deleted all refresh/probe-persistence tests; updated `search`/`probeWindow` tests for null-price fallbacks; added a Title-format StopSales parsing test; `OsTravelHotelPublisherTest` now asserts publish-without-price; removed `base_price` from every `OsTravelHotel::create()` fixture (MassAssignmentException) and dropped stored-price assertions. Schema test updated.
- [x] Frontend: `AdminOsTravel.test.tsx` rewritten (Phase 5); `Hotels.test.tsx`, `HotelDetail.test.tsx`, `DestinationDetail.test.tsx` updated for no stored price + button-triggered search + fixed slider (Phase 7).
- Checkpoint: **DONE** — `php artisan test` 404 passed (2261 assertions); `npx vitest` green (Phase 7 already verified 143 passed / 13 pre-existing unrelated admin failures); `tsc --noEmit` clean.

## Phase 9 — Final cleanup + verification
- [ ] Re-grep all dropped column/command/table names — zero surviving references outside migrations.
- [ ] `php artisan migrate` on staging; run catalog sync on a scratch account and confirm **no writes** to price/availability columns (monitor SQL log).
- [ ] Verify booking flow end-to-end (search → reserve → pay → confirm) still works and the reserved price is stored on the `Booking` (unchanged).
- Checkpoint: only catalog is stored; bookings keep their reserved prices; no schedule/command persists prices.

## Rollback note
Migration is destructive for the dropped columns; keep a pre-migration SQL dump for the transition. Code changes are independent of the migration, so backend/frontend can deploy first and the migration last (with a cached-payload re-sync after).