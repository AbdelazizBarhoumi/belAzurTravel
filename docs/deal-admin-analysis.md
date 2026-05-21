# Admin Deal Entity Analysis

## Overview
The admin Deal entity is managed via `App\Http\Controllers\Api\AdminDealController`. It provides full CRUD operations, with cache invalidation handled upon data mutation.

## Data Mapping & Transformation

| API Input (Request) | Database Field | Transformation Logic |
| :--- | :--- | :--- |
| `title_en`, `title_fr`, `title_ar` | `title` | Localized mapping |
| `description_en`, `description_fr`, `description_ar` | `description` | Localized mapping |
| `discount_en`, `discount_fr`, `discount_ar` | `discount` | Localized mapping |
| `expires_en`, `expires_fr`, `expires_ar` | `expires` | Localized mapping |
| `category_en`, `category_fr`, `category_ar` | `category` | Localized mapping |
| `highlights`, `terms` | `details` | JSON array mapping |

## Observations & Inconsistencies
- **Contract Strictness:** The admin API forces per-locale fields for `title`, but treats others as optional.
- **Cache Invalidation:** The `flushAdminCache` method correctly clears both public and admin caches, but is manually invoked, making it prone to omission in future updates.
- **Payload Flattening:** `adminPayload` flattens the localized fields back into `key`, `key_en`, `key_fr`, `key_ar` for the frontend.
- **Database Divergence:** The admin API does not touch the `category_key` database column, which is inconsistent with public-facing entity management elsewhere.

## Proposed Actions
1. Standardize cache flushing logic into a trait if other entities use similar patterns.
2. Evaluate if `category_key` should be populated/updated via the admin API.
3. Validate the `adminPayload` flattening against the expected frontend structure to ensure no data loss during serialization.
