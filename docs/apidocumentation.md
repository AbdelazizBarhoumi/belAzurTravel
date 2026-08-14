# OS-TRAVEL Provider API — Discovered Facts & Assumptions

Reference for the OS-TRAVEL Hotel API integration. Facts confirmed live are
marked **confirmed**; items needing provider clarification are marked
**open**. Endpoint shapes are documented in the phase docs
(`docs/os-travel-phase-9-*.md`, `docs/os-travel-phase-10-booking.md`).

## Envelope & transport

- Every call POSTs `/api/hotel/{Endpoint}` with a nested `Credential` object
  (`Login`/`Password`) merged with endpoint payload keys. Credentials are
  server-side only; never returned to the frontend.
- Response envelope: `{ <Endpoint>: [...], CountResults, ErrorMessage, ... }`.
  `ErrorMessage` is an empty array/object on success and either a string, a
  list of messages, or a `{ Code, Description }` object on failure
  (`OsTravelClient::flattenError`).
- Transport: JSON, 30s timeout, retry 3× with 100ms sleep on `429/5xx` plus
  connection failures (`config('ostravel.retry')`). Non-success HTTP or a
  non-empty `ErrorMessage` throws `OsTravelApiException` (endpoint, HTTP code,
  provider `Code`, and the raw envelope for audit).

## Price granularity (confirmed)

- Provider prices are **total-per-room-for-the-stay** (not per night). Verified
  live for the same hotel: 2 nights = 254.520, 7 nights = 855.187.
- Public price = `round(provider total × (1 + markup_percentage / 100))`;
  `price_per_night` is derived (`total / nights`). Markup default 20%
  (`config('ostravel.markup.default')`), overridable per hotel at approve time.
- `Price.BasePrice` (a per-hotel hint) is currently unused — **open** to
  clarify meaning before relying on it.
- `PriceWithAffiliateMarkup` (per-room, what the provider charges us) is
  received but not relied on; the local `markup_percentage` is applied to
  `Price`. **open** — confirm the two never diverge.

## Currency (open)

- `Currency` is read from the provider `HotelSearch`/`HotelDetail` envelope per
  hotel; fallback to `hotels.currency` (default `TND`). The interaction between
  room-level, hotel-level and global currency is **open** for provider
  clarification.

## Hotel content now captured

When a staged hotel is published (`HotelPublisher::publish`), the following
provider data is persisted into `hotels.details` and surfaced on the public
hotel page (`HotelInfo`):

- `Localization`/`City`/`Country` → `address` (from `HotelDetail`), `city`/
  `country`.
- `CheckIn`/`CheckOut` → `check_in_time`/`check_out_time` (shown as arrival/
  departure times).
- `Longitude`/`Latitude` → `coordinates` `{latitude, longitude}` (not yet
  mapped to a map component — **open**: wire into a map).
- `Email`/`Phone` → `email`/`phone`; `whatsapp` is no longer overwritten with
  the provider email (bug fixed) — it is preserved from the existing local
  row. `Note` → `note` (HTML stripped), shown at the bottom of the page.
- `Type` → `hotel_type` (e.g. `Hôtel`).
- `Option[]` → `options` `[{id, title}]` ("Available options" chips).
- `Boarding[]` (per-hotel) → `boardings` `[{id, code, name, description}]`
  ("Meal plans").
- `Facilitie[]` (detail, provider's singular spelling) / `Facilities[]` (list)
  → `facilities` `[{title, category}]` ("Facilities" chips).
- `Tag[]` (detail-only) → `amenity_tags` `[{id, title, image}]` ("Services &
  tags"); relative `Image` paths are resolved against
  `config('ostravel.base_url')`.
- `Theme[]` → `tags` (preferring `ListHotel`, falling back to `HotelDetail`).

All provider text is normalized before storage/rendering
(`HotelPublisher::cleanText` / `htmlToText`): HTML entities such as `&eacute;`,
`&#39;`, `&agrave;` are decoded, tags are stripped, and description/note
paragraph breaks are preserved (rendered with `whitespace-pre-line` on the
frontend).

## Lazy per-day HotelDetail refresh

`HotelDetail` is fetched at most **once per day per hotel**, lazily, on the
first click — never in bulk:

- `OsTravelCatalogSync::enrichDetails()` only fetches `HotelDetail` for
  brand-new hotels (whose staged payload has none). Known hotels are skipped.
- First admin-or-public visit each day triggers the fetch
  (`HotelPublisher::refreshDetail`), guarded by a 30s single-flight
  `Cache::lock("ostravel.detail.{externalId}")` so concurrent requests don't
  pile up. Public `GET /api/hotels/{slug}` and admin
  `GET /api/admin/os-travel/hotels/{id}` both trigger it; `approve` refreshes
  before publishing.
- The staged `os_travel_hotels.detail_fetched_at` timestamp is set on success;
  later same-day visits are cache hits with **zero** provider calls. Unclicked
  hotels are never refreshed. On provider failure the timestamp is left
  untouched so the next click retries, and existing data is preserved.
- Gallery re-download: the album is only re-fetched when the provider's
  `Album[].Url` list changed vs the stored `details.gallery_sources`;
  otherwise the already-downloaded local files are reused.

Search-time room data (`OsTravelSearchService`): `View` → `view_ids` and
`Supplement[]` → `supplements` (raw provider shape, echoed back to the provider
on booking so nothing is lost; the frontend normalizes for display).

## Filter booleans derived at publish

The existing `hotels` boolean filter columns (used by the public search UI)
are now populated automatically at publish time (`deriveFilterBooleans`):

- `categorie_4_etoiles` — `Category.Star >= 4`.
- `logement_simple` (LS), `petit_dejeuner` (LPD), `demi_pension` (DP),
  `pension_complete` (PC) from `Boarding[].Code`.
- Theme flags — `affaires` (Affaires/Business), `famille` (Famille/Family/
  Voyages de noces), `sport_loisir` (Sport/Loisirs), `thalasso_spa`
  (Thalasso/Spa), `nature_aventure` (Nature/Aventure/Découverte), `detente`
  (Détente/Charme/Balnéaire).
- All other filter columns are set to `false` so the UI never sees nulls.
  Note: re-publishing a hotel re-derives these and overwrites any admin-set
  values.

## Rate limits (assumption)

- Assumed 150ms between `HotelSearch` chunk calls
  (`config('ostravel.search.throttle_ms')`, 0 in tests). Same cadence between
  `HotelDetail` calls during catalog sync
  (`config('ostravel.sync.throttle_ms')`). Max requests/minute for
  `HotelSearch` and the booking endpoints is **open** (drives refresh cadence
  and chunk throttle).

## Availability & booking gates

- `StopReservation=true` → rate is in stop-sales: treated as unavailable and
  **not bookable** (excluded from min-price, excluded from bookable rooms).
- `OnRequest` booking state → mapped to local `Pending`; whether it eventually
  transitions to `Validated` (webhook vs polling `BookingList`) is **open**.
- Cancellation has two gates: local `cancellation_closed` (≥ 24h before
  `start_date`) and the provider `CancellationPolicy` (provider-side). A 409 or
  penalty mismatch surfaces the provider `Description` to the user.

## Booking status mapping

| OS-TRAVEL `State` | Local `Booking.status` |
|---|---|
| `OnRequest` | `Pending` |
| `Validated` | `Confirmed` |
| `Cancelled` | `Cancelled` |
| `Rejected` | `Confirmed` (never downgrades) |

Confirm/cancel are idempotent: confirm with an existing `provider_booking_id`
returns the existing booking; cancel on an already-cancelled booking is a no-op.

## Open items (need provider clarification)

- Child age bounds: `Child[].Age` accepted as `int|string`; valid ranges per
  boarding type unknown. Frontend currently sends placeholder children (age 8,
  "Child N Traveler") as a simplification.
- Rate limits per endpoint (see above).
- `OnRequest` transition mechanics (webhook vs poll).
- `Voucher.Url` expiry — should it be downloaded/stored locally?
- Room vs hotel vs global currency precedence.
- Meaning of `Price.BasePrice`.