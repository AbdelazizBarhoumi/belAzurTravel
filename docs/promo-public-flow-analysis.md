# Promo Public Flow Analysis

## 1. Overview

This document analyzes the public-facing E2E flow for the `Promo` entity, from the database through the API to the frontend consumption.

## 2. Database Schema (Migration: 2026_05_13_011110_create_promos_table.php)

- `code` (string, unique)
- `title` (json)
- `discount` (json)
- `description` (json)
- `expires` (json)
- `color` (string)
- `details` (json: containing lists like eligibility, terms, gallery, usage limits)

## 3. Backend Retrieval (`Api\PromoController.php`)

- `index()`: Returns a cached list. Payload is built via `payload()` which merges top-level fields with `details` JSON contents.
- `show(string $code)`: Returns a cached detail object. Payload is the same as index.

## 4. Frontend Integration (`types/public/promo.types.ts`)

- Interface `PromoItem` defines:
    - `title`, `description`, `discount`, `expires` as `LocalizedText`.
    - `eligibility`, `howToUse`, `terms` as `LocalizedText[]`.
    - `gallery` as `string[]`.

## 5. Audit of Consistency

- **Schema Mapping:** The `payload()` method in `PromoController` flattens the database structure to match the frontend expectations.
- **Type Safety:** The frontend `LocalizedText` (an object `{en: string, fr: string, ar: string}`) aligns perfectly with the JSON columns stored in the database.
- **Data Integrity:** The backend provides `LocalizedText[]` for list fields, correctly serializing the data stored in `details`.

## 6. Identified Inconsistencies

- None found. The public flow is currently clean and well-structured, directly utilizing the JSON schema stored in the DB without unnecessary transformation layers.
