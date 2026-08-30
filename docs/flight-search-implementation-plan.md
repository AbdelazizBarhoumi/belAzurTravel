# Flight Search System — E2E Implementation Plan

## Decision Summary

| Decision | Choice | Implementation |
|----------|--------|----------------|
| Multi-city | `flight_segments` table | Parent `flights` + child `flight_segments` |
| Booking | Pass search state via URL params | `tripType`, `passengers`, `cabinClass` in URL + `details` JSON |
| Flexibility | Client-side date filtering | ±N days applied to stored `date_from`/`date_to` |
| Airport storage | IATA codes everywhere | `from = "TUN"`, `to = "CDG"` (not city names) |
| Search state | URL params | Survives refresh, shareable, debuggable |
| Filtering | Client-side now, server-side-ready | Frontend filters `useFlights()` results; backend accepts params for future |

---

## Phase 1: Database & Backend

### 1.1 Migration — new columns + flight_segments table

- [x] Add `trip_type` string (nullable) to `flights`
- [x] Add `direct_only` boolean (default false) to `flights`
- [x] Add `baggage_included` boolean (default false) to `flights`
- [x] Create `flight_segments` table with: `id`, `flight_id` (FK), `segment_order`, `from_airport` (IATA), `to_airport` (IATA), `departure_time`, `arrival_time`, `date`, `duration`, timestamps
- [x] Data migration: normalize existing `flights.to` from localized JSON to IATA codes

### 1.2 Flight Model

- [x] Add `trip_type`, `direct_only`, `baggage_included` to `$fillable`
- [x] Add casts for `direct_only`, `baggage_included`
- [x] Add `segments()` hasMany relationship

### 1.3 FlightSegment Model (new)

- [x] Create model with `$fillable`, `$casts`, `flight()` belongsTo

### 1.4 AdminFlightController

- [x] Add `trip_type`, `direct_only`, `baggage_included` to validation + attributes
- [x] Normalize `from`/`to` to IATA codes (strip "City (IATA)" format)
- [x] Handle `segments` array: sync FlightSegment records for multi-city
- [x] Include new fields + segments in `adminPayload()`

### 1.5 Public FlightController

- [x] Add query param filtering: `from`, `to`, `tripType`, `directOnly`, `baggageIncluded`, `cabinClass`, `departureDate`, `returnDate`, `passengers`, `flexibility`
- [x] Skip cache when filters are present
- [x] Include `segments` in payload
- [x] Normalize `from`/`to` to IATA in response

---

## Phase 2: Admin Flight Form

### 2.1 adminSelectOptions.ts

- [x] Add `FLIGHT_TRIP_TYPES` localized options

### 2.2 FlightItem types

- [x] Add `trip_type`, `direct_only`, `baggage_included` to `FlightItem`
- [x] Add `FlightSegment` interface
- [x] Change `to` from `LocalizedText` to `string` (IATA code)

### 2.3 AdminFlights.tsx

- [x] Normalize `from`/`to` Select values to IATA codes
- [x] Add "Flight Configuration" section: trip type select, direct toggle, baggage toggle
- [ ] Add segments editor for multi-city (from/to/date/time per segment)
- [x] Update validation to require `trip_type`

---

## Phase 3: New Reusable Components

### 3.1 AirportAutocomplete

- [x] Combobox using `cmdk` — filter by IATA/city/country
- [x] Store and return IATA code
- [x] Match existing form field styling

### 3.2 PassengerCabinPicker

- [x] Popover with adults/children/infants counters + cabin class radios
- [x] Summary on trigger: "2 adultes, 1 enfant, Affaires"
- [x] RTL support

### 3.3 FlightSearchWidget

- [x] Trip type radio buttons (Aller/Retour, Aller simple, Multi destination)
- [x] AirportAutocomplete for departure + destination
- [x] Date pickers (return hides for one-way)
- [x] PassengerCabinPicker
- [x] Flexibility dropdown (exact, ±1, ±2, ±3 days)
- [x] Direct flights toggle
- [x] With baggage toggle
- [x] Multi-city segment management
- [x] Serialize to URL params on submit

### 3.4 SearchWidget integration

- [x] Replace flights tab content with FlightSearchWidget
- [x] onSearch navigates to `/flights` with serialized params

---

## Phase 4: Flights List Page

- [x] Add compact FlightSearchWidget header, pre-filled from URL params
- [x] Add direct-only toggle filter
- [x] Add with-baggage toggle filter
- [ ] Add flexibility dropdown filter
- [x] Update client-side filtering logic for new filters
- [x] Normalize `to` field usage (IATA → display name)
- [x] Display trip type, direct, baggage badges on flight cards

---

## Phase 5: Flight Detail Page

- [x] Resolve IATA codes to display names via `getAirportByIata()`
- [x] Show trip type, direct, baggage badges
- [x] Multi-city segment display (timeline/rows)
- [x] Pass URL search params to StickyBookingCard

---

## Phase 6: Booking Integration

- [x] StickyBookingCard: accept flight search props
- [x] BookingDialog: receive flight search state, pre-fill summary, generate guest rows
- [x] Include `tripType`, `passengers`, `cabinClass` in booking payload `details`
- [ ] Backend: validate flight-specific booking fields

---

## Phase 7: i18n

- [x] Add all new translation keys (search.fields.departure, search.fields.directFlights, etc.)

---

## Phase 8: Tests

- [ ] Update SearchWidget.test.tsx
- [ ] Update AdminFlights.test.tsx
- [ ] Update FlightDetail.test.tsx
- [ ] New FlightSearch.test.tsx

---

## Files Modified

| File | Action |
|------|--------|
| `database/migrations/2026_08_30_000000_...php` | **New** |
| `app/Models/Flight.php` | **Edit** |
| `app/Models/FlightSegment.php` | **New** |
| `app/Http/Controllers/AdminFlightController.php` | **Edit** |
| `app/Http/Controllers/Api/FlightController.php` | **Edit** |
| `app/Http/Controllers/Api/BookingController.php` | **Edit** |
| `resources/js/types/public/flight.types.ts` | **Edit** |
| `resources/js/data/adminSelectOptions.ts` | **Edit** |
| `resources/js/data/airports.ts` | **Edit** |
| `resources/js/pages/admin/AdminFlights.tsx` | **Edit** |
| `resources/js/components/ui/AirportAutocomplete.tsx` | **New** |
| `resources/js/components/ui/PassengerCabinPicker.tsx` | **New** |
| `resources/js/components/ui/FlightSearchWidget.tsx` | **New** |
| `resources/js/components/ui/SearchWidget.tsx` | **Edit** |
| `resources/js/pages/flights/index.tsx` | **Edit** |
| `resources/js/pages/flights/show.tsx` | **Edit** |
| `resources/js/components/cards/StickyBookingCard.tsx` | **Edit** |
| `resources/js/components/forms/BookingDialog.tsx` | **Edit** |
| `resources/js/i18n/translations.ts` | **Edit** |
| `resources/js/test/SearchWidget.test.tsx` | **Edit** |
| `resources/js/test/AdminFlights.test.tsx` | **Edit** |
| `resources/js/test/FlightDetail.test.tsx` | **Edit** |
| `resources/js/test/FlightSearch.test.tsx` | **New** |
