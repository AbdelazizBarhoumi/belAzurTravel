# Flight Admin Entity Analysis Report

This report documents the architectural and implementation analysis of the `Flight` entity within the admin sections of the application.

## 1. Management Logic (`app/Http/Controllers/Api/AdminFlightController.php`)
- **Index:** `Flight::query()->oldest('id')->get()->map(...)`
- **Create:** `Flight::create($this->attributes($request))`
- **Update:** `Flight::query()->findOrFail($id)`
- **Delete:** `Flight::query()->findOrFail($id)`
- **Cache Invalidation:** Calls `flushAdminCache('flights', $item->code ?? null)`. 
  - `flushAdminCache` clears `admin.entity.flights` and attempts to clear specific flight caches.
  - Inconsistency: The public cache `entity.flights.index` is not consistently flushed by all admin actions.

## 2. Identified Inconsistencies
- **Inconsistent Invalidation:** The admin controller's cache invalidation logic is fragmented. It clears admin caches but often misses the public-facing cache (`entity.flights.index`), leading to stale data on the public site after admin updates.
- **Payload Structure:** `adminPayload` method creates a different response structure than the public `payload` method in `FlightController`.
- **Attribute Handling:** Admin methods often rely on `attributes()` mapping which may drift from the model's fillable attributes if the DB changes.

## 3. Recommended Actions
- **Standardize Payload:** Use a shared Resource or Transformer class to ensure the API response structure is consistent between public and admin routes.
- **Unify Cache Strategy:** Implement a centralized cache manager that automatically invalidates both public and admin caches whenever a `Flight` entity is modified.
