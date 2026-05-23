# Plan: Unifying Contact Configuration and Admin Consistency

## Goal

Establish a single, consistent source of truth for "Contact" information that is shared between the Public site, Admin dashboard, and Database, removing hardcoded defaults and ensuring data integrity.

## Strategy

1.  **Define Schema (Backend & Frontend):**
    - Create a structured `Contact` object in the database and frontend.
    - Standardize the `contact` settings structure to include `title`, `description`, `kicker`, etc.
2.  **Remove Controller Fallbacks:**
    - Refactor `SiteSettingsController` to remove hardcoded `contact` defaults.
    - Ensure the public site gracefully handles empty state (UI-side) instead of injecting defaults.
3.  **Update Admin Dashboard:**
    - Expose all configurable "Contact" fields (title, description, etc.) to the `AdminSiteSettings` form.
    - Implement validation on the backend to match the new schema.
4.  **Synchronization:**
    - Ensure admin updates persist to the structured database object, which the frontend `SiteSettings` API fetches.

## Implementation Steps

1.  **Update Database/Seeder:** Update `EntitySeeder` to include a default, valid `contact` object so the DB is the source of truth, not the controller.
2.  **Refactor Controller:** Remove the `if (!isset($content['contact']))` block in `SiteSettingsController::hydrateResponseDefaults`.
3.  **Update Frontend API:** Add `contact` fields to the `AdminSiteSettings` component form.
4.  **Add Backend Validation:** Add validation logic in the `SiteSettingsController::update` method to enforce structure.
5.  **Verify:** Confirm the admin panel updates the database and the public site reflects the DB values.
