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

## Currency (open)

- `Currency` is read from the provider `HotelSearch`/`HotelDetail` envelope per
  hotel; fallback to `hotels.currency` (default `TND`). The interaction between
  room-level, hotel-level and global currency is **open** for provider
  clarification.

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