# Promo Admin Flow Analysis

## 1. Overview
This document analyzes the Admin-facing E2E flow for the `Promo` entity. Unlike the public flow, the admin flow handles flat-field form transformation to/from the nested database structure.

## 2. Admin API Controller (`Api\AdminPromoController.php`)
- `attributes()`: Performs complex validation and transformation.
- `adminPayload()`: Performs inverse transformation (nested JSON to flat structure with `_en`, `_fr`, `_ar` suffixes).

## 3. Data Transformation Audit
- **Transformation Logic:**
  - `adminPayload()` manually creates flat keys (e.g., `title_en`, `title_fr`) for primary fields.
  - Lists (`eligibility`, `terms`, `howToUse`) are imploded by newline for form editing.
  - The `details` column serves as the source of truth for structured metadata, while primary columns hold core JSON values.

## 4. Audit of Consistency
- **Transformation Overhead:** The admin flow is much heavier than the public flow due to the need to support legacy form input formats.
- **Key Sync:** `attributes()` and `adminPayload()` are tightly coupled. If a new field is added to the `Promo` model, both methods must be updated manually.
- **Type/Structure Mismatch:** The admin interface uses flat keys, while the public interface uses nested objects (`LocalizedText`).

## 5. Identified Inconsistencies & Recommendations
- **Maintainability Risk:** The manual mapping in `adminPayload` is brittle. If the number of localized fields increases, this controller will grow excessively.
- **Recommendation:** Refactor `attributes` and `adminPayload` to use a consistent `LocalizedField` transformer or trait that handles both flat-to-nested and nested-to-flat conversion automatically for all Promo localized fields.
- **Validation:** Validation rules currently explicitly list every field. A more dynamic approach would be safer for future field additions.
