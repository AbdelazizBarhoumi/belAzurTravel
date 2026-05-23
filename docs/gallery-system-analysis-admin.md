# Admin Gallery System Analysis

This document analyzes the consistency of the admin-facing gallery system and compares it with the underlying database schema and the `GalleryImage` model.

## 1. Analysis of the Admin Implementation (`AdminGallery.tsx`)

- **State Management:** Uses `useAdminStore` to fetch gallery data from the local store.
- **Frontend Fields:** The `fields` constant defines:
    - `title`: `i18n` (Multi-language title)
    - `category`: `select`
    - `image`: `image`
- **Data Structure:** The component consumes `AdminGalleryItem` from `@/types/admin`.
- **Inconsistencies:** The admin UI appears to be working with an `AdminGalleryItem` that includes `title` and `category` fields, which do **not** exist in the `GalleryImage` model or the `gallery_images` database table.

## 2. Inconsistency Audit

| Feature             | `GalleryImage` Model / DB | Admin UI (`AdminGallery.tsx`) | Status                            |
| :------------------ | :------------------------ | :---------------------------- | :-------------------------------- |
| `url` / `image`     | `url` (string)            | `image` (string/file)         | Inconsistent key name             |
| `caption` / `title` | `caption` (json)          | `title` (i18n)                | Inconsistent key name & structure |
| `sort_order`        | `sort_order` (int)        | N/A                           | Missing in UI                     |
| `category`          | N/A                       | `category` (string)           | Missing in DB/Model               |

## 3. Observations & Recommendations

- **Critical Discrepancy:** The Admin gallery system in the frontend is disconnected from the actual backend gallery implementation. The admin page is using a completely different data schema (`AdminGalleryItem`) compared to the `GalleryImage` model used for the public gallery.
- **Backend/Frontend Mismatch:** The `AdminGallery.tsx` component needs to be refactored to consume the actual `GalleryImage` API (or a corresponding admin endpoint for `GalleryImage` entities).
- **Missing Migration:** The database needs to be updated if the admin features (categories and titles) are intended to be supported. Alternatively, the UI should be updated to align with the existing `GalleryImage` model (caption, sort_order).

**Action Items:**

1. Determine if `GalleryImage` should be expanded to support `title` (or `caption`) and `category`.
2. Update `GalleryImage` model and migration if necessary.
3. Refactor `AdminGallery.tsx` to use the actual `GalleryImage` API instead of the generic `useAdminStore`.
