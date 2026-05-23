# Flight Public Entity Analysis Report

This report documents the architectural and implementation analysis of the `Flight` entity within the public-facing sections of the application.

## 1. Database Schema (`database/migrations/2026_05_13_011040_create_flights_table.php`)

- **Table:** `flights`
- **Primary Key:** `id` (bigint)
- **Columns:**
    - `code` (string, unique)
    - `airline` (json)
    - `from` (string)
    - `to` (json)
    - `duration` (json)
    - `price` (unsignedInteger, default: 0)
    - `stops` (json)
    - `departure` (string)
    - `arrival` (string)
    - `details` (json, nullable)
    - `created_at`, `updated_at`

## 2. Eloquent Model (`app/Models/Flight.php`)

- **Fillable:** `['code', 'airline', 'from', 'to', 'duration', 'price', 'stops', 'departure', 'arrival', 'details']`
- **Casts:**
    - `airline`, `to`, `duration`, `stops`, `details` -> `array`
    - `price` -> `integer`

## 3. Retrieval Logic (`app/Http/Controllers/Api/FlightController.php`)

- **Index Endpoint:** `Flight::query()->oldest('id')->get()->map(...)`
- **Show Endpoint:** `Flight::query()->where('code', $code)->firstOrFail()`
- **Cache Keys:**
    - `entity.flights.index`
    - `entity.flights.{$code}`

## 4. Identified Inconsistencies

- **Frontend/Backend Key Mismatches:** Public API returns `code` as the primary identifier, but `AdminFlightController` and some parts of the frontend refer to it loosely as `id` or `code` depending on context.
- **Cache Mismatches:** `AdminFlightController` and `FlightController` use different cache strategies. `AdminFlightController` caches in `admin.entity.flights` while public uses `entity.flights.index`.
- **Typing Inconsistencies:** The DB uses `json` for fields like `to` and `airline`, but frontend `FlightItem` (to be verified) might expect different structures.
