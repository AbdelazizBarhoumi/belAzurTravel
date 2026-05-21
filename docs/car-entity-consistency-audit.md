# Car Entity Consistency Audit (Public)

## Overview
This audit examines the consistency of the `Car` entity between the database, backend controller (`CarController`), and public API response.

## Database Schema (`database/migrations/2026_05_13_011030_create_cars_table.php`)
- `slug`: `string` (unique)
- `category_key`: `string` (nullable, indexed)
- `name`: `json`
- `category`: `json` (nullable)
- `price`: `unsignedInteger` (default 0)
- `seats`: `unsignedTinyInteger` (default 0)
- `fuel`: `json` (nullable)
- `transmission`: `json` (nullable)
- `image`: `string`
- `details`: `json` (nullable)
- `timestamps`: Yes

## Backend Model (`app/Models/Car.php`)
- `fillable`: `['slug', 'name', 'category_key', 'category', 'price', 'seats', 'fuel', 'transmission', 'image', 'details']`
- `casts`: 
    - `name`, `category`, `fuel`, `transmission`, `details` -> `array`
    - `price`, `seats` -> `integer`

## Public Controller (`app/Http/Controllers/Api/CarController.php`)
- `index()`: Returns mapped payload, cached for 10 mins.
- `show($slug)`: Returns mapped payload, cached for 10 mins.
- `payload()` function mapping:
    - `slug` -> `slug`
    - `name` -> `name`
    - `category_key` -> `category_key`
    - `category` -> `category`
    - `price` -> `price`
    - `seats` -> `seats`
    - `fuel` -> `fuel`
    - `transmission` -> `transmission`
    - `image` -> `image`
    - `gallery` -> `details['gallery'] ?? []`
    - `description` -> `details['description'] ?? null`
    - `features` -> `details['features'] ?? []`
    - `policy` -> `details['policy'] ?? []`

## Inconsistencies / Observations
1. **Schema vs Model vs Controller**: The data types and structure are largely consistent. The controller handles the `details` JSON extraction correctly into the flat JSON API structure.
2. **Details Structure**: The `details` column is used as a flexible storage for `gallery`, `description`, `features`, and `policy`. This is acceptable but requires consistent handling in the frontend.
3. **Caching**: Both `index` and `show` use a 10-minute cache with the same keys, which is fine for performance.

## Status
- **Schema/Model**: Consistent.
- **Backend Flow**: Consistent.
- **Recommendations**: Ensure the `details` JSON structure remains consistent across all records (e.g., ensuring `gallery`, `features`, and `policy` are always initialized to avoid runtime issues).
