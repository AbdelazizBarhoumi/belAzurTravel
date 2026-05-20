# Deal Entity Analysis Report

## Overview
This document analyzes the `Deal` entity implementation in the `belAzurTravel` application, covering database schema, model definition, and API interaction consistency.

## 1. Database Schema (`deals` table)
Defined in `database/migrations/2026_05_13_011000_create_catalog_tables.php`.

| Column | Type | Nullable | Notes |
| :--- | :--- | :--- | :--- |
| id | bigint | No | Primary Key |
| slug | string | No | Unique |
| title | json | No | |
| description | json | Yes | |
| discount | json | Yes | |
| expires | json | Yes | |
| category | json | Yes | |
| details | json | Yes | |
| timestamps | timestamps | No | |

## 2. Model Definition (`App\Models\Deal`)
Defined in `app/Models/Deal.php`.

- **Fillable Attributes:** `slug`, `title`, `description`, `discount`, `expires`, `category_key`, `category`, `details`.
- **Casts:** Maps `title`, `description`, `discount`, `expires`, `category`, `details` to `array`.

### Inconsistencies & Observations
1. **Model Fillable Mismatch:** The model has `category_key` in `$fillable`, but this column does not exist in the `deals` database migration.
2. **Data Structure:** Unlike the `Hotel` entity, `Deal` makes better use of top-level JSON columns (`title`, `description`, `discount`, `expires`, `category`). However, it still holds a `details` JSON column which is currently unused/empty for text-only deals.
3. **Data Redundancy:** The `AdminDealController` handles localization by flattening values, but because these are all stored as JSON in the database, querying a specific deal by a specific locale string is not natively supported by SQL without JSON functions.

## 3. API Interaction (`AdminDealController`)
- **Payload Mapping:** The `adminPayload` method uses `flatLocalized` to expose JSON fields as flat keys (e.g., `title`, `title_en`, `title_fr`, `title_ar`).
- **Input Handling:** The `attributes` method forces a strict requirement for `title` in all languages (`title_en`, `title_fr`, `title_ar`) but leaves others as optional.
- **Cache Management:** Implements cache flushing for both admin and public API endpoints, which is good practice.

## Summary of Findings
- **Data Integrity:** Generally consistent, but the `category_key` in the model's `$fillable` is dead code as it doesn't exist in the migration.
- **Recommendations:**
    - Clean up the `Deal` model: remove `category_key` from `$fillable`.
    - Evaluate if the `details` JSON column is actually needed if deals are intended to be "text-only" as per the controller comment. If unused, consider removing it in a migration to simplify the schema.
    - Consistency: Ensure public API retrieval (likely in `DealController`) matches the schema defined in the migration and handled by the admin controller.
