# Phase 10 — Booking Proxy (Track C)

**Status:** Ready to build — all endpoint names, payloads, and fixture shapes confirmed from provider docs.

**Scope:** `BookingCreation` (PreBook → Confirm), `BookingCancellation` (Preview → Confirm), `BookingList`, provider columns on `bookings`, integration with the existing `Booking` / `Payment` (ClictoPay) flow. Requires Phase 9 live search (tokens/sources) to be shipped first.

---

## 1. Context and security invariants (unchanged from Phases 0–9)

1. **All OS-TRAVEL calls happen server-side.** The client sends booking intent — never credentials or tokens.
2. **All calls go through the `OsTravelClient` pattern** (envelope decode, retry on transient statuses, `OsTravelApiException` on failure).
3. **Markup is applied server-side.** Public price is always `(int) round(base_price * (1 + markup_percentage / 100))`.
4. **No provider credentials in logs or responses** — only ids, statuses, and sanitized error messages.
5. **Transactional failures map to friendly admin/client errors**, not raw provider payloads.

---

## 2. Prerequisite (from Phase 9)

- `HotelSearch` returns `Token` and `Source` per hotel — these are **required** in `BookingCreation` and must be sent with the booking request.
- Tokens are session-scoped to the search that produced them; a booking must use the token from the same dates/hotel/rooms the user is confirming.

---

## 3. Confirmed endpoint reference (this phase)

All endpoints: `POST [BASE_URL]/api/hotel/{Endpoint}` with `Content-Type: application/json`.

| Endpoint | Purpose | Request body keys | Response envelope key |
|---|---|---|---|
| `BookingCreation` | PreBook or Confirm | `Credential`, `HotelBooking` | `BookingCreation` |
| `BookingCancellation` | Preview or Confirm cancel | `Credential`, `Booking`, `PreCancelled` | `BookingCancellation` |
| `BookingList` | Reservation history | `Credential`, `Filters`, `Paginator` | `BookingList` |

---

## 4. Track C — `OsTravelBookingService` proxy

### 4.1 Two-step booking flow (PreBook → Confirm)

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

### 4.2 Cancellation flow (Preview → Confirm)

**Preview:** `BookingCancellation` with `PreCancelled=true`
- Returns fees without cancelling.
- Use this to show the user what they'll lose before they confirm.

**Confirm:** `BookingCancellation` without `PreCancelled`
- Actually cancels. Returns `State: "Cancelled"`.

### 4.3 BookingList

- Returns reservation history with the same structure as `BookingCreation`.
- Use `Filters` (by booking id, hotel, date range) and `Paginator`.

### 4.4 Integration with existing `Booking` / `Payment` flow

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

**Idempotency:** guard duplicate confirm/cancel — a confirm must not re-create a provider booking if `provider_booking_id` already exists (return existing). A cancel on an already-cancelled booking is a no-op.

---

## 5. Files to create / modify (Phase 10)

| File | Action |
|---|---|
| `app/Services/OsTravel/OsTravelClient.php` | Add `bookingCreation()`, `bookingCancellation()`, `bookingList()` |
| `app/Services/OsTravel/OsTravelBookingService.php` | New — PreBook→Confirm, Preview→Cancel, status mapping, idempotency |
| `app/Http/Controllers/Api/BookingController.php` | Modify `store()`/`cancel()` to proxy through `OsTravelBookingService` for `type=hotel` |
| `database/migrations/*_add_provider_columns_to_bookings.php` | Add `provider_booking_id`, `provider_booking_reference`, `provider_payload` |
| `tests/Unit/OsTravelBookingServiceTest.php` | PreBook, Confirm, Cancel, idempotency, status mapping |
| `tests/Feature/BookingOsTravelFlowTest.php` | End-to-end: search → prebook → confirm → cancel |

---

## 6. Fixture inventory (this phase)

| Fixture file | Models | Used in |
|---|---|---|
| `os_travel_booking_creation_prebook.json` | `BookingCreation` (PreBooking=true) | PreBook tests |
| `os_travel_booking_creation_confirm.json` | `BookingCreation` (confirm) | Confirm tests |
| `os_travel_booking_cancellation_preview.json` | `BookingCancellation` (PreCancelled=true) | Preview cancel tests |
| `os_travel_booking_cancellation_confirm.json` | `BookingCancellation` (confirm) | Confirm cancel tests |
| `os_travel_booking_list.json` | `BookingList` | History tests |
| `os_travel_error_invalid_credentials.json` | Error envelope | Exception-path tests |

---

## 7. Open questions (this phase — need provider clarification)

1. **Rate limits:** What is the max requests/minute for `BookingCreation` and `BookingCancellation`?
2. **OnRequest bookings:** If `State` is `OnRequest` (not `Validated`), does the booking eventually transition to `Validated`? Is there a webhook or must we poll `BookingList`?
3. **Voucher expiry:** Does the `Voucher.Url` expire? Should we download and store it locally?
4. **Child age rules:** Are there max/min child ages per boarding type? The docs show `Child[].Age` as `int|string` — what are the valid ranges?

---

## 8. Build order (Track C)

1. Migration: provider columns on `bookings`.
2. `OsTravelClient::bookingCreation()`, `bookingCancellation()`, `bookingList()`.
3. `OsTravelBookingService` (PreBook→Confirm, Preview→Cancel, status mapping, idempotency).
4. `BookingController::store()`/`cancel()` proxy for `type=hotel`.
5. Frontend: booking card → prebook breakdown → ClictoPay → confirm; cancellation preview flow.
6. Tests: `OsTravelBookingServiceTest`, `BookingOsTravelFlowTest`.

**Done when:** full backend suite green, Pint clean, `tsc --noEmit` clean, end-to-end search → select room → prebook → pay → confirm → list → cancel works.