# Car Entity Analysis

## Overview
The `Car` entity represents vehicles available for booking within the application. It is managed via `App\Models\Car` and stored in the `cars` table.

## Database Schema (Summary)
The `cars` table was created in `2026_05_13_011000_create_catalog_tables.php` and later modified in `2026_05_19_151622_add_category_key_to_catalog_tables.php`.

| Column | Type | Nullable | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `id` | No | Primary Key |
| `slug` | `string` | No | Unique |
| `category_key` | `string` | Yes | Added 2026-05-19 |
| `name` | `json` | No | Localized |
| `category` | `json` | Yes | Localized |
| `price` | `integer` | No | `unsignedInteger` |
| `seats` | `integer` | No | `unsignedTinyInteger` |
| `fuel` | `json` | Yes | Localized |
| `transmission` | `json` | Yes | Localized |
| `image` | `string` | No | Path to image |
| `details` | `json` | Yes | Stores additional data |
| `created_at` | `timestamp`| Yes | |
| `updated_at` | `timestamp`| Yes | |

## Model Definition (`App\Models\Car`)
- **Fillable:** `['slug', 'name', 'category_key', 'category', 'price', 'seats', 'fuel', 'transmission', 'image', 'details']`
- **Casts:**
    - `name`, `category`, `fuel`, `transmission`, `details`: `array`
    - `price`, `seats`: `integer`

## Observations & Potential Inconsistencies

1. **Model Fillable vs. Schema**:
    - The model includes `category_key` in `$fillable`, which matches the schema update.
    - `seats` and `price` are cast as `integer`. This is consistent with `unsignedTinyInteger` and `unsignedInteger`.

2. **Localization**:
    - The schema defines `name`, `category`, `fuel`, and `transmission` as `json`. This is intended for localized data.
    - Application code (e.g., `AdminCarController`) assumes a structure like `['en' => ..., 'fr' => ..., 'ar' => ...]`.

3. **Inconsistency Risk**:
    - `AdminCarController` handles `name` localization manually via `$this->localized(...)`.
    - `AdminCarsTest` shows `category` being stored as an array of locales, but `category_key` is also present. Ensure that `category` (the array) and `category_key` remain synchronized if the app logic relies on both.

4. **Image Handling**:
    - `image` is a simple `string` in both the DB and the model. This assumes a single primary image.
    - `details` contains a `gallery` array (referenced in `AdminCarsTest`), which is an unconventional split between a primary `image` field and a `details->gallery` array. This could lead to synchronization issues if an image is removed from the gallery but remains as the primary `image`.

5. **Frontend/Backend Sync**:
    - The admin UI for `AdminCars` interacts with the `cars` API.
    - The test `AdminCarsTest` validates data structure, but verify that the frontend `AdminCars` component correctly handles the expected JSON structures for `details`, `category`, `fuel`, etc.
