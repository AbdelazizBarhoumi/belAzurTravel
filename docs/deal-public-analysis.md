# Public Deal Entity Analysis

## Overview

The public Deal entity is retrieved via `App\Http\Controllers\Api\DealController`. It provides a read-only JSON API for public consumption, cached for 10 minutes.

## Data Structure (Database vs. API)

| Database Column      | API Field             | Consistency Check                            |
| :------------------- | :-------------------- | :------------------------------------------- |
| `slug`               | `slug`                | Consistent                                   |
| `title` (json)       | `title`               | Consistent (returns localized array)         |
| `description` (json) | `description`         | Consistent (returns localized array)         |
| `discount` (json)    | `discount`            | Consistent (returns localized array)         |
| `expires` (json)     | `expires`             | Consistent (returns localized array)         |
| `category` (json)    | `category`            | Consistent (returns localized array)         |
| `details` (json)     | `highlights`, `terms` | Consistent mapping from `details` JSON field |

## Observations & Inconsistencies

- **Redundancy:** The `Deal` model has both `category_key` in the database and a `category` JSON field. The API exclusively uses the `category` JSON field.
- **Complexity:** The API returns localized arrays for most fields (`title`, `description`, etc.), which is correct for localization, but the client must be prepared to handle this structure.
- **Cache Management:** The `DealController` uses `deals.index` and `deals.{$slug}` for caching. These are invalidated by `AdminDealController`.

## Proposed Actions

1. Confirm if `category_key` is necessary. If not, consider deprecation.
2. Ensure consistent handling of localized fields across all controllers.
