# Car Entity Analysis

## Overview

The `Car` entity represents vehicles available for booking within the application. It is managed via `App\Models\Car` and stored in the `cars` table.

## Database Schema (Summary)

The `cars` table was created in `2026_05_13_011030_create_cars_table.php`.

| Column         | Type        | Nullable | Notes                  |
| :------------- | :---------- | :------- | :--------------------- |
| `id`           | `id`        | No       | Primary Key            |
| `slug`         | `string`    | No       | Unique                 |
| `category_key` | `string`    | Yes      | Index                  |
| `name`         | `json`      | No       | Localized              |
| `category`     | `json`      | Yes      | Localized              |
| `price`        | `integer`   | No       | `unsignedInteger`      |
| `seats`        | `integer`   | No       | `unsignedTinyInteger`  |
| `fuel`         | `json`      | Yes      | Localized              |
| `transmission` | `json`      | Yes      | Localized              |
| `image`        | `string`    | No       | Path to image          |
| `details`      | `json`      | Yes      | Stores additional data |
| `created_at`   | `timestamp` | Yes      |                        |
| `updated_at`   | `timestamp` | Yes      |                        |

## Model Definition (`App\Models\Car`)

- **Fillable:** `['slug', 'name', 'category_key', 'category', 'price', 'seats', 'fuel', 'transmission', 'image', 'details']`
- **Casts:**
    - `name`, `category`, `fuel`, `transmission`, `details`: `array`
    - `price`, `seats`: `integer`

## API Usage & Flow

- **Public API (`CarController`):**
    - `index()`: Returns all cars, cached for 10 minutes, with localized payloads.
    - `show(slug)`: Fetches a single car by `slug`, cached for 10 minutes.
- **Admin API (`AdminCarController`):**
    - `index()`: Cached for 5 minutes, returns full payload.
    - `store()`/`update()`: Flushes the `cars` admin cache.
- **Booking API (`BookingController`):**
    - Uses `Car::query()->where('slug', $identifier)` to find a car during the booking flow.

## Observations & Inconsistencies

1. **Localization**: The application relies on JSON columns for localization (`name`, `category`, `fuel`, `transmission`). This requires consistent handling in the frontend and controller. `AdminCarController` currently performs manual localization processing (`$this->localized(...)`).
2. **Image Synchronization**: `image` is a plain string (primary image). There is also a `details->gallery` in the `details` JSON field. If the system logic allows editing individual gallery items, there is a risk that the primary `image` may become out-of-sync if its source is removed from the gallery.
3. **Caching**: Both the public and admin APIs implement caching, which is good for performance but introduces the need to ensure `flushAdminCache` is correctly called in all modification paths.
4. **Data Integrity**: `category_key` is present, but `category` is a JSON array. Logic should ensure these are kept in sync to prevent query results filtering by `category_key` returning items that display an inconsistent `category` value.
5. **Flow Consistency**: The lookup logic in `BookingController` uses `where('slug', $identifier)`, which is consistent with the public API's `CarController` usage.
6. **Frontend Type Mismatch**: The backend `CarController@payload` uses the spread operator for `details` (`...($item->details ?? [])`), merging arbitrary JSON fields directly into the root response object. The frontend `CarItem` interface (in `resources/js/types/public/car.types.ts`) explicitly defines these fields (e.g., `gallery`, `features`, `policy`). This loose coupling means that frontend code may fail if the backend `details` structure evolves without an update to the frontend types, or if `details` is missing expected keys.
