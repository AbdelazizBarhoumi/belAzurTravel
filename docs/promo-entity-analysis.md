# Promo Entity Analysis

This document analyzes the `Promo` entity across the database, backend, and frontend.

## 1. Database Schema (`database/migrations/2026_05_13_011000_create_catalog_tables.php`)

The `promos` table structure:

- `id`: id
- `code`: string (unique)
- `title`: json
- `discount`: json
- `description`: json (nullable)
- `expires`: json (nullable)
- `color`: string
- `details`: json (nullable)
- `created_at`, `updated_at`

## 2. Model Definition (`app/Models/Promo.php`)

The model uses `$casts` to handle JSON fields:

- `title`: array
- `discount`: array
- `description`: array
- `expires`: array
- `details`: array

Note: `details` in DB is `json` and cast to `array` in Model, but `details` is NOT explicitly in `$fillable` array as a string? Wait, looking at the code:
`protected $fillable = ['code', 'title', 'discount', 'description', 'expires', 'color', 'details'];`
Actually, `details` IS in `$fillable`.

## 3. Frontend TypeScript Type (`resources/js/types/public/promo.types.ts`)

The `PromoItem` interface:

```typescript
export interface PromoItem {
    code: string;
    title: LocalizedText;
    description: LocalizedText;
    discount: LocalizedText;
    color?: string;
    expires?: LocalizedText;
    eligibility: LocalizedText[];
    howToUse?: LocalizedText[];
    terms: LocalizedText[];
    gallery?: string[];
}
```

## 4. Inconsistencies & Findings

1.  **Field Storage Strategy:** The database structure relies heavily on a `details` JSON column to store fields that are not part of the top-level schema (`eligibility`, `howToUse`, `terms`, `gallery`, `usage_limit`, `per_user_limit`, `applicable_to`, `active`). While this allows flexibility, it means these fields are not directly queryable or indexable via SQL.
2.  **Controller Responsibility:** `AdminPromoController` acts as a transformer between the flat request/response format (needed for forms) and the nested JSON structure stored in `details`. This logic is tightly coupled and complex, particularly in `buildLocalizedList`.
3.  **Frontend/Backend Alignment:** The frontend `PromoItem` type and the backend `AdminPromoController` payloads are synchronized through manual field mapping. This is prone to drift if the `PromoItem` type is updated without corresponding changes in `AdminPromoController::adminPayload` or the `attributes` parsing method.

## 5. Recommendation

- **Maintain Current Structure:** Given the current implementation in `AdminPromoController`, continue using the `details` JSON column for secondary fields, but add documentation to `Promo.php` clarifying its structure.
- **Type Safety:** Consider centralizing the definition of the "Promo Details" schema so it can be shared or better enforced between backend transformation logic and the frontend `PromoItem` interface.
- **Validation:** Ensure that future changes to `PromoItem` are proactively reflected in the `attributes` validation rules and `adminPayload` mapping in `AdminPromoController`.
