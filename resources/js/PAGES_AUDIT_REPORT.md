# Pages Audit Report

Scanned: `resources/js/pages` (May 17, 2026)

Summary

- Total page files found: 50
- No proxy or backup files detected (.bak, ~, .tmp, .old, .orig)
- `admin/` and `auth/` and `settings/` subfolders already exist — good.

Recommendation

Group pages into feature folders where a domain has more than one route or private hooks/components. Keep single-file pages in `pages/` root.

Proposed per-file moves (no files changed yet):

1) Destinations
- `pages/Destinations.tsx` -> `pages/destinations/index.tsx` (route-level)
- `pages/DestinationDetail.tsx` -> `pages/destinations/[slug].tsx` or `pages/destinations/[id].tsx` (detail route)
Reason: multiple destination-related pages; co-locate `useDestinationBySlug` and any private components.

2) Cars
- `pages/Cars.tsx` -> `pages/cars/index.tsx`
- `pages/CarDetail.tsx` -> `pages/cars/[slug].tsx`
Reason: co-locate `useCarBySlug`, `StickyBookingCard` usage, and any car-specific components.

3) Hotels
- `pages/Hotels.tsx` -> `pages/hotels/index.tsx`
- `pages/HotelDetail.tsx` -> `pages/hotels/[slug].tsx`
Reason: domain folder for hotels.

4) Flights
- `pages/Flights.tsx` -> `pages/flights/index.tsx`
- `pages/FlightDetail.tsx` -> `pages/flights/[slug].tsx`

5) Tours
- `pages/Tours.tsx` -> `pages/tours/index.tsx`
- `pages/TourDetail.tsx` -> `pages/tours/[slug].tsx`

6) Deals
- `pages/Deals.tsx` -> `pages/deals/index.tsx`
- `pages/DealDetail.tsx` -> `pages/deals/[slug].tsx`

7) Events
- `pages/Events.tsx` -> `pages/events/index.tsx`
- `pages/EventDetail.tsx` -> `pages/events/[slug].tsx`

8) Promos
- `pages/Promos.tsx` -> `pages/promos/index.tsx`
- `pages/PromoDetail.tsx` -> `pages/promos/[slug].tsx`

9) Blog
- `pages/Blog.tsx` -> `pages/blog/index.tsx`
- `pages/BlogPostDetail.tsx` -> `pages/blog/[slug].tsx`

10) Deals / Admin already separated
- Keep `pages/admin/*` as-is. Consider moving `pages/AdminDashboard.tsx` into `pages/admin/index.tsx` for consistency.

11) Dashboards / Roles
- `pages/AssistantDashboard.tsx` -> `pages/dashboards/assistant.tsx` or `pages/account/assistant.tsx`
- `pages/ClientDashboard.tsx` -> `pages/dashboards/client.tsx`
- `pages/AdminDashboard.tsx` -> `pages/admin/index.tsx` (see above)
Reason: group role dashboards under `dashboards/` or `account/` for clarity.

12) Auth & Settings
- `pages/auth/*` and `pages/settings/*` already under subfolders — keep as-is.

13) Simple root pages (keep in `pages/` root)
- `Index.tsx`, `Contact.tsx`, `Login.tsx`, `Register.tsx`, `NotFound.tsx`, `Legal.tsx`, `Team.tsx`, `NotificationsPage.tsx`, `Favorites.tsx` — remain in `pages/`

14) Other
- `pages/Gallery.tsx` -> if gallery is site-wide keep in root; if it's tied to a domain, move under that domain.
- `pages/DesignTrip.tsx` -> `pages/design-trip/index.tsx` or `pages/tools/design-trip.tsx` depending on semantics.

Per-file move table (source -> suggested target)

- AdminDashboard.tsx -> pages/admin/index.tsx
- AssistantDashboard.tsx -> pages/dashboards/assistant.tsx
- ClientDashboard.tsx -> pages/dashboards/client.tsx
- CarDetail.tsx -> pages/cars/[slug].tsx
- Cars.tsx -> pages/cars/index.tsx
- BlogPostDetail.tsx -> pages/blog/[slug].tsx
- Blog.tsx -> pages/blog/index.tsx
- Destinations.tsx -> pages/destinations/index.tsx
- DestinationDetail.tsx -> pages/destinations/[slug].tsx
- DesignTrip.tsx -> pages/design-trip/index.tsx
- Deals.tsx -> pages/deals/index.tsx
- DealDetail.tsx -> pages/deals/[slug].tsx
- Hotels.tsx -> pages/hotels/index.tsx
- HotelDetail.tsx -> pages/hotels/[slug].tsx
- Flights.tsx -> pages/flights/index.tsx
- FlightDetail.tsx -> pages/flights/[slug].tsx
- Events.tsx -> pages/events/index.tsx
- EventDetail.tsx -> pages/events/[slug].tsx
- Tours.tsx -> pages/tours/index.tsx
- TourDetail.tsx -> pages/tours/[slug].tsx
- Promos.tsx -> pages/promos/index.tsx
- PromoDetail.tsx -> pages/promos/[slug].tsx
- Gallery.tsx -> pages/gallery/index.tsx (optional)
- Index.tsx -> keep
- Login.tsx -> keep
- Register.tsx -> keep
- Contact.tsx -> keep
- NotFound.tsx -> keep
- Favorites.tsx -> keep
- NotificationsPage.tsx -> keep
- Legal.tsx -> keep
- Team.tsx -> keep
- Unauthorized.tsx -> keep
- Design trip & misc -> see above

Notes & next steps

- Many pages import shared hooks from `@/hooks` (e.g., `usePublicData`, `useBlogPostBySlug`). If these hooks are shared across features, keep them in `hooks/`. For page-private hooks, move them into the new feature folder alongside the page.
- After moving files:
  - Run `pnpm tsc --noEmit` and `pnpm lint --fix` and vitest for frontend tests.
  - Update any absolute imports if you add new barrels.

Cleanup report

- No stray backup/proxy files detected in `resources/js/pages`.

If you'd like, I can now produce a per-file migration plan (explicit list with git mv commands) and a small script to update imports, or I can just produce the move commits one-by-one after you approve the plan.