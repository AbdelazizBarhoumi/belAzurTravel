# Flight Entity Analysis Report

## 1. Overview
This report documents the architectural and implementation analysis of the `Flight` entity within the application.

## 2. Database Schema (`database/migrations/2026_05_13_011040_create_flights_table.php`)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | `id` (bigint) | Primary Key |
| `code` | `string` | Unique |
| `airline` | `json` | Localized data |
| `from` | `string` | |
| `to` | `json` | Localized data |
| `duration` | `json` | Localized data |
| `price` | `unsignedInteger` | Default: 0 |
| `stops` | `json` | Localized data |
| `departure` | `string` | |
| `arrival` | `string` | |
| `details` | `json` | Stores extra dynamic attributes |
| `timestamps` | `timestamps` | |

## 3. Eloquent Model (`app/Models/Flight.php`)
- `fillable`: `['code', 'airline', 'from', 'to', 'duration', 'price', 'stops', 'departure', 'arrival', 'details']`
- `casts`: `['airline' => 'array', 'to' => 'array', 'duration' => 'array', 'stops' => 'array', 'details' => 'array', 'price' => 'integer']`

## 4. Implementation Analysis
### 4.1. Retrieval Logic (`app/Http/Controllers/Api/FlightController.php`)
- **ID Inconsistency:** The public `payload` method maps `id` to the database record `id`, which differs from other entities in the system that often use `code` or a unique slug as the primary API identifier.
- **Cache Inconsistency:** Caches at `entity.flights.index` and `entity.flights.{$code}`.

### 4.2. Management Logic (`app/Http/Controllers/Api/AdminFlightController.php`)
- **Cache Inconsistency:** Uses `admin.entity.flights` and `entity.flights.index`. The `flushAdminCache` method invalidates `entity.flights.index` and `entity.flights.{$code}` but fails to clear `admin.entity.flights`.
- **Schema vs Logic Inconsistency:** The application heavily relies on a `details` JSON column. While flexible, it makes querying specific attributes (like seats, aircraft, or baggage) inefficient and complicates data integrity at the database level.

## 5. Summary of Identified Issues
1. **Cache Mismatches:** `AdminFlightController` and `FlightController` use incompatible keys, leading to stale data.
2. **Dynamic Data Risks:** Excessive use of the `details` JSON column without a formal schema definition within the database.
3. **API ID Inconsistency:** Public API exposes database `id`, while internal logic often references `code` for operations.

## 6. Recommendations
1. **Unify Cache Strategy:** Define a shared service or trait for cache key generation and invalidation to be used by both `FlightController` and `AdminFlightController`.
2. **Formalize Schema:** Move commonly used fields from the `details` JSON column into explicit database columns for better querying and performance.
3. **Consistency:** Ensure that the API ID exposure is consistent across all public endpoints (recommending `code` over database `id`).
