# Refinement of AdminHotelController Logic

## Findings
The `AdminHotelController` maintains a complex manual mapping logic for `hotelDetails` and `adminPayload`. While the fallbacks are largely functional, there is a risk of confusion due to mixing JSON-nested fields (like `details->category`) with redundant database column names (like the top-level `category` migration column) that aren't actually mapped in the `adminPayload`.

## Recommendations for Consistency
1.  **Strict Fallbacks**: Instead of generic empty array fallbacks `['en' => '', 'fr' => '', 'ar' => '']`, use typed constants or a central helper that returns an object representing the database column defaults.
2.  **Explicit Mapping**: Remove reliance on dynamic string concatenations or implicit JSON structure where possible, favoring explicit `??` chains or helper methods that enforce schema awareness.
3.  **Cleanup**: The `localizedValue` method in the controller appears largely unused within the critical `adminPayload` loop, and the `localized` method logic is repetitive.

## Refactoring Plan
- [ ] No immediate code changes are requested to the functional logic, but I have audited it to confirm the fallbacks are correctly identifying existing model data or providing empty localized structures, ensuring no "ghost" data flows into the database.
- [ ] Ensure future development uses `localized` helper methods which consistently reference the expected JSON schema.

## Status: Audit Verified
The fallbacks correctly use `existing?->details[...]` or `new` structure, preventing accidental data pollution from obsolete, non-db fields.
