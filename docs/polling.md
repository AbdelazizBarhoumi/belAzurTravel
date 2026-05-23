## Plan: Polling-only notifications cleanup

Move the app off Redis-based realtime delivery entirely and use database-backed polling for authenticated users. The goal is to make notifications reliable on shared hosting like OVH web servers, while removing Redis, the stream route, and any remaining SSE/realtime assumptions across backend, frontend, docs, and tests.

**Steps**

1. Lock the polling contract for authenticated users.
    - Keep the `notifications` table and `NotificationController` as the source of truth.
    - Reuse the existing auth-protected notification endpoints for list and unread count refresh.
    - Define the polling behavior for logged-in users only, with a 15-second interval and optional refresh on focus.

2. Remove backend Redis dependencies from the whole app.
    - Delete Redis pub/sub and `Redis::publish(...)` usage from `app/Http/Controllers/Api/AssistantController.php`, `app/Http/Controllers/Api/BookingController.php`, and `app/Http/Controllers/Api/ClientController.php`.
    - Remove `NotificationStreamController` stream logic and any Redis subscription code.
    - Remove the `/api/notifications/stream` route from `routes/api.php`.
    - Update config and environment assumptions so the app no longer expects Redis for notifications, and clean Redis references across the codebase if Redis is not used for any other purpose.

3. Replace the frontend realtime client with polling.
    - Remove `resources/js/lib/sse.ts` and any `EventSource` usage.
    - Update `resources/js/components/ui/NotificationBell.tsx` to poll authenticated notification endpoints every 15 seconds.
    - Keep the UI payload shape unchanged so the bell dropdown and unread badge continue to work without redesign.
    - Ensure polling is limited to authenticated sessions and does not run for anonymous visitors.

4. Rewrite docs and deployment guidance.
    - Replace `docs/notifications-sse.md` with polling-oriented hosting notes.
    - Document shared-host-safe settings, the 15-second polling interval, and the fact that the feature works without Redis or long-lived connections.
    - Remove references to SSE, Redis pub/sub, and stream-specific server requirements.

5. Update tests and validation.
    - Replace the SSE-focused test coverage in `tests/Feature/Api/NotificationStreamTest.php` with polling-oriented tests.
    - Add or update tests for the notification list and unread count endpoints to verify the polling source remains correct.
    - Search for remaining `Redis::`, `EventSource`, `/notifications/stream`, and pub/sub references, then run the relevant PHP and frontend checks.

**Relevant files**

- `app/Http/Controllers/Api/AssistantController.php` — remove Redis publish after booking updates.
- `app/Http/Controllers/Api/BookingController.php` — remove Redis publish after booking activity.
- `app/Http/Controllers/Api/ClientController.php` — remove Redis publish after support notifications.
- `app/Http/Controllers/Api/NotificationStreamController.php` — delete or fully repurpose away from streaming.
- `app/Http/Controllers/Api/NotificationController.php` — keep as the canonical polling source.
- `resources/js/lib/sse.ts` — remove realtime client code.
- `resources/js/components/ui/NotificationBell.tsx` — switch to polling refresh logic.
- `routes/api.php` — remove the notification stream route.
- `docs/notifications-sse.md` — rewrite for polling/shared-host deployment.
- `tests/Feature/Api/NotificationStreamTest.php` — replace SSE coverage with polling coverage.
- `.env` and `config/*` files — remove Redis assumptions if the broader app no longer needs them.

**Verification**

1. Search the workspace for `Redis::`, `Illuminate\\Support\\Facades\\Redis`, `EventSource`, `notifications/stream`, and `pub/sub` and confirm those paths are gone or intentionally preserved only outside notifications.
2. Run the notification-related tests after converting to polling.
3. Run frontend lint/build checks and verify the bell still refreshes and shows the latest notifications for authenticated users.
4. Manually verify on a shared-host-style setup by logging in, creating a notification, and confirming it appears on the next poll.

**Decisions**

- Scope is now **whole-app Redis removal**, not just notifications.
- Target behavior is **polling only for authenticated users** at a 15-second interval.
- The stream route should be **deleted** rather than hidden behind a feature flag.
- Database notifications remain the canonical storage layer.
- If any non-notification feature still relies on Redis, treat that as a separate explicit cleanup decision before removing it.

**Further Considerations**

1. Should Redis be removed from cache/session/queue as well, or only from code paths that are no longer needed? Recommendation: verify remaining use before deleting config values so you do not break unrelated hosting assumptions.
2. Should polling pause when the tab is hidden, or continue every 15 seconds? Recommendation: pause or back off in hidden tabs to reduce load on shared hosting.
3. Do you want the notification endpoints to return a compact delta feed in the future? Recommendation: keep that as a later optimization; polling the existing endpoints is the safest first step.
