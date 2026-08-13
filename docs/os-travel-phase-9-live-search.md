# Phase 9 — Live Search & Pricing (Track B)

**Status:** Ready to build — all endpoint names, payloads, and fixture shapes confirmed from provider docs.

**Scope:** scheduled latest-price refresh (browse mode) + live search proxy (`HotelSearch`) + frontend wiring. Booking (Track C) is deferred to Phase 10.

---

## 1. Context and security invariants (unchanged from Phases 0–8)

1. **All OS-TRAVEL calls happen server-side.** The client sends dates, occupancy, and booking intent — never credentials or tokens.
2. **All calls go through the `OsTravelClient` pattern** (envelope decode, retry on transient statuses, `OsTravelApiException` on failure).
3. **Markup is applied server-side.** Public price is always `(int) round(base_price * (1 + markup_percentage / 100))`.
4. **No provider credentials in logs or responses** — only ids, statuses, and sanitized error messages.
5. **Transactional failures map to friendly admin/client errors**, not raw provider payloads.

---

## 2. Critical finding from provider docs

| Original assumption | Confirmed reality |
|---|---|
| Separate rate endpoint (`HotelRate`, `PriceList`) exists | **No such endpoint.** Live rates are returned **only** inside `HotelSearch` responses. |
| `HotelDetail` contains pricing | **No.** `HotelDetail` returns description, photos, facilities, boardings — **no prices.** |
| `ListHotel` contains pricing | **No.** `ListHotel` is static catalog only. |

**Implication:** You cannot refresh `base_price` independently of a user search. The price is contextual to dates + occupancy. Therefore:

- There is **no separate rate refresh endpoint** — the search step both finds availability AND returns prices.
- The `base_price` stored in `hotels` from Phase 4 is a **catalog placeholder** (admin-set or last-seen price). Live search results override it for display, but the stored `base_price` is NOT auto-updated by search.

---

## 3. Price retrieval strategy (how prices reach public pages)

**Constraint:** `ListHotel` and `HotelDetail` contain no prices. Prices exist only inside `HotelSearch` responses, which require dates + occupancy. Therefore the frontend **never runs a per-hotel provider call**.

**Rule:** batch the *visible set* (chunked into groups of ≤ 200 ids, one `HotelSearch` per chunk), and never call the provider at all until the user searches with dates.

Two display modes:

| Mode | Trigger | What runs | Price shown |
|---|---|---|---|
| **Browse** (home section, index page, related hotels, detail page) | No dates selected | Scheduled command `os-travel:refresh-latest-prices` runs batched `HotelSearch` for **all published** OS-TRAVEL hotels (chunks ≤ 200) and stores the result | Latest known price merged into `GET /api/hotels` payload — **no provider call per page view** |
| **Live search** (Track B) | Dates + occupancy set | `POST /api/hotels/search` — server maps visible hotel slugs → `external_id`s, chunks ≤ 200, one batch | Live minimum room price per hotel + rooms with `token`/`source` |

### 3.1 Browse mode — scheduled latest-price refresh

- New scheduled command `os-travel:refresh-latest-prices`, cadence from `config('ostravel.refresh.schedule')` (default every 6h, `withoutOverlapping` + `onOneServer`).
- Default search params: `check_in = +1 day`, `check_out = +8 days`, 1 room / 2 adults, `OnlyAvailable=true`.
- For each returned hotel, store the minimum available (`stop_reservation=false`) room price in new `hotels.last_price` / `hotels.last_price_at` columns.
- Hotels omitted by the search (no availability that window) **keep their previous `last_price`** — a stale-but-known value is better than nothing.
- Fault-tolerant per chunk: try/catch + `Log::warning`, matching the `approveAll` pattern.
- `HotelController::payload()`: when `last_price` is present, display `price = round(last_price * (1 + markup_percentage / 100))` and also expose `last_price` + `last_price_at`. Non-OS-TRAVEL hotels (null `last_price`) keep today's behavior.

### 3.2 Live search mode — `POST /api/hotels/search`

- Server validates dates/occupancy, resolves `hotel_slugs` → `external_id`s (all published if omitted), chunks ≤ 200, calls `HotelSearch` (throttle 150ms between chunks).
- Per returned hotel: take the minimum `stop_reservation=false` room price, apply markup, normalize into `HotelController::payload()` shape + `rooms[]` with `token`, `source`, `boarding`, `cancellation_policy`, `stop_reservation`.
- Cache per-query results 5 minutes (`hotels.search.{hash}`) to reduce provider load.
- **Never** persist live prices into `hotels.base_price` — live prices are contextual; only admin-approved base prices are stored.
- `Token`/`Source` are returned to the client (needed for the booking step); the `Credential` object is never exposed.

### 3.3 Public surface → data path

| Surface | Source | With dates selected |
|---|---|---|
| Home `HotelsSection.tsx` | `GET /api/hotels` (browse) | n/a — browse only |
| Index `hotels/index.tsx` | `GET /api/hotels` (browse); auto-triggers live search when a full date range is chosen | live prices overlaid, "Live prices" indicator |
| Detail `hotels/show.tsx` | `GET /api/hotels/{slug}` (browse) | single-hotel search → live room prices + tokens into booking card |
| Related `destinations/show.tsx` | `GET /api/hotels` (browse) | n/a — browse only |

---

## 4. Confirmed endpoint reference (this phase)

All endpoints: `POST [BASE_URL]/api/hotel/{Endpoint}` with `Content-Type: application/json`.

| Endpoint | Purpose | Request body keys | Response envelope key |
|---|---|---|---|
| `ListCurrency` | Static currencies | `Credential` | `ListCurrency` |
| `HotelSearch` | **Live availability + rates** | `Credential`, `SearchDetails` | `HotelSearch` |

---

## 5. Track B — `OsTravelSearchService` proxy (availability + pricing)

### 5.1 Requirements

**Provider endpoint:** `POST /api/hotel/HotelSearch`

**Request shape (from docs):**
```json
{
  "Credential": { "Login": "...", "Password": "..." },
  "SearchDetails": {
    "BookingDetails": {
      "CheckIn": "2026-09-01",
      "CheckOut": "2026-09-05",
      "Hotels": [100, 101, 102]
    },
    "Filters": {
      "Category": [],
      "OnlyAvailable": true
    },
    "Rooms": [
      { "Adult": 2, "Child": [5, 8] }
    ]
  }
}
```

**Response shape (from fixture `os_travel_hotel_search.json`):**
```json
{
  "HotelSearch": [
    {
      "Id": 100,
      "Name": "Hotel Royal Tunis",
      "Token": "eyJ0b2tlbiI6...",
      "Source": "OS-TRAVEL-DIRECT",
      "Rooms": [
        {
          "Id": 500,
          "Name": "Deluxe Double",
          "Boarding": {"Id": 2, "Code": "LPD", "Name": "..."},
          "View": [{"Id": 1, "Name": "City View"}],
          "Supplement": [],
          "Price": "927.520",
          "Currency": "TND",
          "StopReservation": false,
          "CancellationPolicy": [...]
        }
      ]
    }
  ],
  "CountResults": 1,
  "ErrorMessage": {},
  "Timing": {...},
  "Ip": "..."
}
```

**Key constraints from docs:**
- Max **200 hotel Ids** per request.
- Hotels with no availability are **omitted** (not returned as empty).
- `Token` and `Source` are **required** for `BookingCreation` (Phase 10).
- `Prices` are **decimal strings** (e.g., `"927.520"`) — cast to float before math.
- `StopReservation=true` means the rate is in stop-sales; **do not allow booking**.

### 5.2 Server-side proxy design

**Public route:** `POST /api/hotels/search`

**What the client sends:**
```json
{
  "check_in": "2026-09-01",
  "check_out": "2026-09-05",
  "city_id": 10,
  "hotel_slugs": ["hotel-royal-tunis-100"],
  "rooms": [
    { "adults": 2, "children": [5, 8] }
  ],
  "category_ids": [],
  "only_available": true
}
```

**What the backend does:**
1. Validate dates, occupancy, city.
2. Resolve `hotel_slugs` → `external_id`s from `os_travel_hotels` (status = `published`); if omitted, all published hotels for `city_id`.
3. Chunk hotel IDs into groups of ≤ 200.
4. Call `HotelSearch` for each chunk (throttle 150ms between chunks if multiple).
5. For each returned hotel:
   - Match against `os_travel_hotels.external_id` where `status = 'published'`.
   - Apply markup: `display_price = round(floatval(provider_price) * (1 + markup_percentage / 100))`.
   - **Do NOT store the live price back to `hotels.base_price`.** Live prices are contextual; only admin-approved base prices are persisted.
6. Normalize into `HotelController::payload()` shape + `rooms[]` with `token`, `source`, `boarding`, `cancellation_policy`, `stop_reservation`.
7. Cache per-query results for **5 minutes** (`hotels.search.{hash}`) to reduce API load.

**What the client receives:**
```json
{
  "data": [
    {
      "id": 100,
      "slug": "hotel-royal-tunis-100",
      "name": {"en": "Hotel Royal Tunis", "fr": "Hotel Royal Tunis", "ar": "..."},
      "stars": 4,
      "image": "...",
      "location": {"en": "Tunis", "fr": "Tunis", "ar": "..."},
      "price": 1113,          // 927.520 * 1.20 = 1113.024 → 1113
      "base_price": 927.52,   // raw provider price (for transparency)
      "markup_percentage": 20,
      "currency": "TND",
      "rooms": [
        {
          "id": 500,
          "name": "Deluxe Double",
          "boarding": "LPD",
          "boarding_name": "Logement Petit Déjeuner",
          "price": 1113,
          "base_price": 927.52,
          "token": "eyJ0b2tlbiI6...",
          "source": "OS-TRAVEL-DIRECT",
          "stop_reservation": false,
          "cancellation_policy": [
            {
              "fees": 185.50,
              "type": "PERCENT",
              "nature": "BEFORE_ARRIVAL",
              "description": "Free cancellation until 48h before check-in. 20% fee after.",
              "from_date": "2026-09-01 00:00"
            }
          ],
          "supplements": [],
          "view": "City View"
        }
      ]
    }
  ]
}
```

**Security:** `Token` and `Source` are returned to the client **because the client needs them for the booking step** (Phase 10). This is acceptable — they are session-scoped search tokens, not API credentials. However, **never return the `Credential` object or `Login`/`Password`.**

### 5.3 Frontend wiring

- `resources/js/api/osTravel.api.ts` (or `entities.api.ts`): `searchHotels()` + response types.
- `resources/js/types/public/hotel.types.ts`: optional `last_price` / `last_price_at` fields.
- `resources/js/hooks/usePublicData.ts`: `useHotelSearch({ check_in, check_out, guests, hotel_slugs })` — react-query, `enabled` only when a full date range exists, 5-min stale time.
- `resources/js/pages/hotels/index.tsx`: **auto-trigger on dates** — when `dateRange.from && dateRange.to` → call search with `filteredHotels` slugs; overlay live prices onto cards + subtle "Live prices for selected dates" indicator; stored prices remain fallback while loading.
- `resources/js/pages/hotels/show.tsx`: when dates are set, single-hotel search feeds live room `pricePerNight` + tokens into `StickyBookingCard`/`BookingDialog` (tokens ready for Phase 10 prebook). No dates → scheduled latest price.

---

## 6. Files to create / modify (Phase 9)

| File | Action |
|---|---|
| `database/migrations/*_add_last_price_to_hotels_table.php` | Add `last_price` (decimal 10,2, nullable) + `last_price_at` (timestamp, nullable) to `hotels` |
| `app/Console/Commands/RefreshOsTravelLatestPrices.php` | New — batched `HotelSearch` for all published hotels, stores min available price as `last_price` |
| `routes/console.php` | Register refresh command on `config('ostravel.refresh.schedule')` |
| `config/ostravel.php` | Add `refresh.schedule` block (default every 6h) |
| `app/Http/Controllers/Api/HotelController.php` | `payload()`: merge `last_price`-derived display price + expose `last_price`/`last_price_at` |
| `app/Services/OsTravel/OsTravelClient.php` | Add `hotelSearch(array $searchDetails): array` |
| `app/Services/OsTravel/OsTravelSearchService.php` | New — orchestrates chunking, markup, normalization, caching |
| `app/Http/Controllers/Api/HotelSearchController.php` | New — public route handler |
| `routes/api.php` | Add `POST /api/hotels/search` under public routes |
| `resources/js/api/osTravel.api.ts`, `hooks/usePublicData.ts`, `pages/hotels/index.tsx`, `pages/hotels/show.tsx`, `types/public/hotel.types.ts` | Frontend wiring (see 5.3) |
| `tests/Unit/OsTravelSearchServiceTest.php` | `Http::fake` with `os_travel_hotel_search.json` fixture |
| `tests/Feature/HotelSearchPublicFlowTest.php` | End-to-end: pending hotels excluded, markup applied, tokens present |
| `tests/Feature/RefreshOsTravelLatestPricesTest.php` | Batches, stores `last_price`, keeps value when omitted, markup math, idempotent |

---

## 7. Fixture inventory (this phase)

| Fixture file | Models | Used in |
|---|---|---|
| `os_travel_list_currency.json` | `ListCurrency` | Refresh command sanity checks |
| `os_travel_hotel_search.json` | `HotelSearch` | Search service + refresh tests |
| `os_travel_error_invalid_credentials.json` | Error envelope | Exception-path tests |

---

## 8. Open questions (this phase — need provider clarification)

1. **Currency:** Does `HotelSearch` always return `TND`, or can it return `EUR`/`USD` based on partner config? If multi-currency, where is the conversion rate sourced?
2. **Rate limits:** What is the max requests/minute for `HotelSearch`? (Drives refresh cadence + chunk throttle.)
3. **Child age rules:** Are there max/min child ages per boarding type? The docs show `Child[].Age` as `int|string` — what are the valid ranges?

---

## 9. Build order (Track B)

1. Migration: `last_price` / `last_price_at` on `hotels`.
2. `OsTravelClient::hotelSearch()`.
3. `RefreshOsTravelLatestPrices` command + `refresh.schedule` config + `routes/console.php`.
4. `HotelController::payload()` merge.
5. `OsTravelSearchService` (chunking, markup, normalization, caching).
6. `HotelSearchController` + `POST /api/hotels/search` route.
7. Frontend: `searchHotels()`, `useHotelSearch`, index auto-trigger, detail live prices.
8. Tests: `OsTravelSearchServiceTest`, `HotelSearchPublicFlowTest`, `RefreshOsTravelLatestPricesTest`.

**Done when:** full backend suite green, Pint clean, `tsc --noEmit` clean, browse shows latest known prices, date searches return live prices + tokens.
