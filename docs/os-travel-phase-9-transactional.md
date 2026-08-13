# Phase 9 — Transactional Integration (OS-TRAVEL)

**Status:** Ready to build — all endpoint names, payloads, and fixture shapes confirmed from provider docs.

**Build order:** **Track B (search proxy) → Track C (booking proxy)**.  
> **Note:** There is no separate "rate refresh" endpoint. Live rates come exclusively from `HotelSearch`. Track A from the original spec is merged into Track B — the search step both finds availability AND returns prices.

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
| Separate rate endpoint (`HotelRate`, `PriceList`) exists for Track A | **No such endpoint.** Live rates are returned **only** inside `HotelSearch` responses. |
| `HotelDetail` contains pricing | **No.** `HotelDetail` returns description, photos, facilities, boardings — **no prices.** |
| `ListHotel` contains pricing | **No.** `ListHotel` is static catalog only. |

**Implication:** You cannot refresh `base_price` independently of a user search. The price is contextual to dates + occupancy. Therefore:
- **Track A (rate refresh) is REMOVED.**
- **Track B (search proxy) now handles both availability AND pricing.**
- The `base_price` stored in `hotels` from Phase 4 is a **catalog placeholder** (admin-set or last-seen price). Live search results override it for display, but the stored `base_price` is NOT auto-updated by search.
- If you want a "last known price" display on the hotel list page, cache the most recent `HotelSearch` result per hotel (short TTL, e.g., 5 min).

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
- **Never** persist live prices into `hotels.base_price` (see §5.2.5) — live prices are contextual; only admin-approved base prices are stored.
- `Token`/`Source` are returned to the client (needed for the booking step); the `Credential` object is never exposed.

### 3.3 Public surface → data path

| Surface | Source | With dates selected |
|---|---|---|
| Home `HotelsSection.tsx` | `GET /api/hotels` (browse) | n/a — browse only |
| Index `hotels/index.tsx` | `GET /api/hotels` (browse); auto-triggers live search when a full date range is chosen | live prices overlaid, "Live prices" indicator |
| Detail `hotels/show.tsx` | `GET /api/hotels/{slug}` (browse) | single-hotel search → live room prices + tokens into booking card |
| Related `destinations/show.tsx` | `GET /api/hotels` (browse) | n/a — browse only |

---

## 4. Confirmed endpoint reference

All endpoints: `POST [BASE_URL]/api/hotel/{Endpoint}` with `Content-Type: application/json`.

| Endpoint | Purpose | Request body keys | Response envelope key |
|---|---|---|---|
| `ListCountry` | Static countries | `Credential` | `ListCountry` |
| `ListCity` | Static cities by country | `Credential`, `Country` | `ListCity` |
| `ListBoarding` | Static meal plans | `Credential` | `ListBoarding` |
| `ListCategorie` | Static star categories | `Credential` | `ListCategorie` |
| `ListCurrency` | Static currencies | `Credential` | `ListCurrency` |
| `ListHotel` | Static hotel catalog by city | `Credential`, `City` | `ListHotel` |
| `HotelDetail` | Static hotel details | `Credential`, `Hotel` | `HotelDetail` |
| `HotelSearch` | **Live availability + rates** | `Credential`, `SearchDetails` | `HotelSearch` |
| `BookingCreation` | PreBook or Confirm | `Credential`, `HotelBooking` | `BookingCreation` |
| `BookingCancellation` | Preview or Confirm cancel | `Credential`, `Booking`, `PreCancelled` | `BookingCancellation` |
| `BookingList` | Reservation history | `Credential`, `Filters`, `Paginator` | `BookingList` |

---

## 5. Track B — `OsTravelSearchService` proxy (availability + pricing)

### 5.1 Requirements

**Endpoint:** `POST /api/hotel/HotelSearch`

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
- `Token` and `Source` are **required** for `BookingCreation`.
- `Prices` are **decimal strings** (e.g., `"927.520"`) — cast to float before math.
- `StopReservation=true` means the rate is in stop-sales; **do not allow booking**.

### 5.2 Server-side proxy design

**Public route:** `POST /api/hotels/search` (or `GET /api/hotels/{slug}/availability`)

**What the client sends:**
```json
{
  "check_in": "2026-09-01",
  "check_out": "2026-09-05",
  "city_id": 10,
  "rooms": [
    { "adults": 2, "children": [5, 8] }
  ],
  "category_ids": [],
  "only_available": true
}
```

**What your backend does:**
1. Validate dates, occupancy, city.
2. Look up `PUBLISHED` hotels in that city from `os_travel_hotels` (joined to `hotels`).
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

**Security:** `Token` and `Source` are returned to the client **because the client needs them for the booking step**. This is acceptable — they are session-scoped search tokens, not API credentials. However, **never return the `Credential` object or `Login`/`Password`.**

### 5.3 Files to create / modify

| File | Action |
|---|---|
| `app/Services/OsTravel/OsTravelClient.php` | Add `hotelSearch(array $searchDetails): array` |
| `app/Services/OsTravel/OsTravelSearchService.php` | New — orchestrates chunking, markup, normalization, caching |
| `app/Http/Controllers/Api/HotelSearchController.php` | New — public route handler |
| `routes/api.php` | Add `POST /api/hotels/search` under public routes |
| `tests/Unit/OsTravelSearchServiceTest.php` | `Http::fake` with `os_travel_hotel_search.json` fixture |
| `tests/Feature/HotelSearchPublicFlowTest.php` | End-to-end: pending hotels excluded, markup applied, tokens present |

---

## 6. Track C — Booking proxy

### 6.1 Two-step booking flow (PreBook → Confirm)

**Step 1 — PreBook:** `BookingCreation` with `PreBooking=true`
- Verifies price and availability without saving.
- Response has same structure as confirm but **no `Id` or `Voucher`**.
- Use this to show the user a final price breakdown before payment.

**Step 2 — Confirm:** `BookingCreation` without `PreBooking`
- Creates the actual reservation.
- Returns `Id` (provider booking ID), `Voucher`, `State`.

**Request shape (from fixture `os_travel_booking_creation_prebook.json`):**
```json
{
  "Credential": { "Login": "...", "Password": "..." },
  "HotelBooking": {
    "City": 10,
    "Hotel": 100,
    "CheckIn": "2026-09-01",
    "CheckOut": "2026-09-05",
    "Source": "OS-TRAVEL-DIRECT",
    "Token": "eyJ0b2tlbiI6...",
    "PreBooking": true,
    "Comment": "Pre-booking verification",
    "Rooms": [
      {
        "Id": 500,
        "Boarding": 2,
        "View": [1],
        "Supplement": [],
        "Pax": {
          "Adult": [
            {"Civility": "Mr", "Name": "John", "Surname": "Doe", "Holder": true},
            {"Civility": "Mrs", "Name": "Jane", "Surname": "Doe", "Holder": false}
          ],
          "Child": [
            {"Name": "Alice", "Surname": "Doe", "Age": 5}
          ]
        }
      }
    ]
  }
}
```

**Confirm response shape (from fixture `os_travel_booking_creation_confirm.json`):**
```json
{
  "BookingCreation": {
    "Id": 98765,
    "OnRequest": false,
    "State": "Validated",
    "Hotel": 100,
    "City": 10,
    "CheckIn": "2026-09-01",
    "CheckOut": "2026-09-05",
    "Rooms": [...],
    "TotalPrice": "927.520",
    "Currency": "TND",
    "Voucher": {"Num": "VOUCH-98765", "Url": "https://vouchers.os-travel.com/98765.pdf"},
    "CancellationPolicy": [...],
    "Created": "2026-08-12 10:10:15",
    "Validated": "2026-08-12 10:10:20"
  },
  "ErrorMessage": {},
  "Timing": {...},
  "Ip": "..."
}
```

### 6.2 Cancellation flow (Preview → Confirm)

**Preview:** `BookingCancellation` with `PreCancelled=true`
- Returns fees without cancelling.
- Use this to show the user what they'll lose before they confirm.

**Confirm:** `BookingCancellation` without `PreCancelled`
- Actually cancels. Returns `State: "Cancelled"`.

### 6.3 BookingList

- Returns reservation history with the same structure as `BookingCreation`.
- Use `Filters` (by booking id, hotel, date range) and `Paginator`.

### 6.4 Integration with existing `Booking` / `Payment` flow

```
User selects room → PreBook (server) → Show breakdown → User pays (ClictoPay)
    → Confirm (server) → Create Booking row → Store provider_booking_id
```

**`Booking` model additions:**
- `provider_booking_id` (string, nullable) — the OS-TRAVEL `Id` (e.g., `98765`).
- `provider_booking_reference` (string, nullable) — `Voucher.Num`.
- `provider_payload` (json, nullable) — full `BookingCreation` response for audit.

**Status mapping:**

| OS-TRAVEL `State` | Your `Booking.status` | Notes |
|---|---|---|
| `OnRequest` | `Pending` | Awaiting hotel confirmation |
| `Validated` | `Confirmed` | Booking is live |
| `Cancelled` | `Cancelled` | Cancellation completed |

**Cancellation window:**
- Your existing `cancellation_closed` (≥ 24h before `start_date`) is the **client-side gate**.
- OS-TRAVEL's `CancellationPolicy` is the **provider-side gate**. Both must pass.
- If OS-TRAVEL returns a 409 or penalty mismatch on cancellation, show the provider's `Description` to the user.

### 6.5 Files to create / modify

| File | Action |
|---|---|
| `app/Services/OsTravel/OsTravelClient.php` | Add `bookingCreation()`, `bookingCancellation()`, `bookingList()` |
| `app/Services/OsTravel/OsTravelBookingService.php` | New — PreBook→Confirm, Preview→Cancel, status mapping, idempotency |
| `app/Http/Controllers/Api/BookingController.php` | Modify `store()`/`cancel()` to proxy through `OsTravelBookingService` for `type=hotel` |
| `database/migrations/...add_provider_columns_to_bookings.php` | Add `provider_booking_id`, `provider_booking_reference`, `provider_payload` |
| `tests/Unit/OsTravelBookingServiceTest.php` | PreBook, Confirm, Cancel, idempotency, status mapping |
| `tests/Feature/BookingOsTravelFlowTest.php` | End-to-end: search → prebook → confirm → cancel |

---

## 7. Fixture inventory (all confirmed from docs)

| Fixture file | Models | Used in |
|---|---|---|
| `os_travel_list_country.json` | `ListCountry` | Catalog sync tests |
| `os_travel_list_city.json` | `ListCity` | Catalog sync tests |
| `os_travel_list_boarding.json` | `ListBoarding` | Catalog sync tests |
| `os_travel_list_categorie.json` | `ListCategorie` | Catalog sync tests |
| `os_travel_list_currency.json` | `ListCurrency` | Catalog sync tests |
| `os_travel_list_hotel.json` | `ListHotel` | Catalog sync tests |
| `os_travel_hotel_detail.json` | `HotelDetail` | Catalog sync + publisher tests |
| `os_travel_hotel_search.json` | `HotelSearch` | **Track B tests** |
| `os_travel_booking_creation_prebook.json` | `BookingCreation` (PreBooking=true) | **Track C tests** |
| `os_travel_booking_creation_confirm.json` | `BookingCreation` (confirm) | **Track C tests** |
| `os_travel_booking_cancellation_preview.json` | `BookingCancellation` (PreCancelled=true) | **Track C tests** |
| `os_travel_booking_cancellation_confirm.json` | `BookingCancellation` (confirm) | **Track C tests** |
| `os_travel_booking_list.json` | `BookingList` | **Track C tests** |
| `os_travel_error_invalid_credentials.json` | Error envelope | All exception-path tests |

---

## 8. Open questions (still need provider clarification)

1. **Currency:** Does `HotelSearch` always return `TND`, or can it return `EUR`/`USD` based on partner config? If multi-currency, where is the conversion rate sourced?
2. **Rate limits:** What is the max requests/minute for `HotelSearch` and `BookingCreation`?
3. **OnRequest bookings:** If `State` is `OnRequest` (not `Validated`), does the booking eventually transition to `Validated`? Is there a webhook or must we poll `BookingList`?
4. **Voucher expiry:** Does the `Voucher.Url` expire? Should we download and store it locally?
5. **Child age rules:** Are there max/min child ages per boarding type? The docs show `Child[].Age` as `int|string` — what are the valid ranges?

---

## 9. Build order (revised)

1. **Track B:**
   - Extend `OsTravelClient` with `hotelSearch()`.
   - Create `OsTravelSearchService` (chunking, markup, normalization, caching).
   - Create `HotelSearchController` + route.
   - Tests: `OsTravelSearchServiceTest`, `HotelSearchPublicFlowTest`.

2. **Track C:**
   - Extend `OsTravelClient` with `bookingCreation()`, `bookingCancellation()`, `bookingList()`.
   - Create `OsTravelBookingService` (PreBook→Confirm, Preview→Cancel, idempotency).
   - Add provider columns to `bookings` table.
   - Modify `BookingController` for hotel-type bookings.
   - Tests: `OsTravelBookingServiceTest`, `BookingOsTravelFlowTest`.

3. **Final QA:**
   - Full backend suite (`composer run test`), Pint.
   - Manual: search → select room → prebook → pay → confirm → list → cancel.
