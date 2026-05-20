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
1.  **Missing Fields in Database/Model:** The frontend `PromoItem` expects fields (`eligibility`, `howToUse`, `terms`, `gallery`) that are completely missing from the database migration and the Model. These appear to be expected in the frontend but not stored in the backend database.
2.  **Field Mapping:** The database has a `details` JSON field, which might be intended to hold some of the extra data (like `eligibility`, `terms`), but this structure is not enforced or mapped in the Model.
3.  **Data Retrieval:** The `getPromos` and `findPromoByCode` API methods fetch from `/api/promos`. If the backend just returns the Eloquent model result, the frontend will be missing `eligibility`, `howToUse`, `terms`, and `gallery` unless the API controller is specifically transforming the data.

## 5. Recommendation
- Audit `AdminPromoController` to see how it handles these extra fields (if it's using the `details` JSON field to store them).
- Align the `Promo` database schema (or the `details` JSON structure) with the frontend `PromoItem` interface to ensure data integrity.
