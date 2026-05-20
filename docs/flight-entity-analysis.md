# Flight Entity Analysis Report

## 1. Overview
This report documents the architectural and implementation analysis of the `Flight` entity within the application.

## 2. Database Schema (`database/migrations/2026_05_13_011000_create_catalog_tables.php`)
The `flights` table structure is defined as follows:

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
- Uses caching for performance.
- The `payload` method maps the database entity to a JSON response, but it strangely sets `'id' => $item->code` instead of the database ID.

### 4.2. Management Logic (`app/Http/Controllers/Api/AdminFlightController.php`)
- **Schema vs Logic Inconsistency**: The database schema does not explicitly contain columns for fields like `seats`, `cabin`, `aircraft`, `baggage`, `refund`, or `date`. These are handled dynamically via the `details` JSON column.
- **Form validation**: Validates fields like `airline_en`, `airline_fr`, `airline_ar` etc., and transforms them into JSON structures before saving to the DB.
- **Cache Management**: Improper invalidation for `FlightController`. `FlightController` caches at `flights.index` and `flights.{$code}`, while `AdminFlightController` flushes `entity.flights.index` and `entity.flights.{$identifier}`. These keys do not match, leading to stale cache issues.

## 5. Summary of Findings
- **Stale Cache:** `AdminFlightController` and `FlightController` use different cache keys for the same entity data.
- **Database Schema Complexity:** Relying heavily on a `details` JSON column for entity attributes makes data querying and validation more complex than if they were defined as columns in the migrations.
- **API Response Inconsistency:** The public `FlightController::index` returns the entity `code` as the `id`, whereas the `AdminFlightController` returns the database `id` as string.
