# Data objects and API contract

This document is the backend starter reference for the current frontend mock app.
It tracks the actual static objects, their fields, and the booking API surface so the backend can be implemented without guessing.

## Source files

- `resources/js/data/catalog.ts` — shared lookup helpers for the main mock datasets
- `resources/js/data/*.data.ts` — flights, promos, deals, cars, events
- `resources/js/pages/*` — page-local static datasets
- `resources/js/components/*` — component prop contracts for reusable UI pieces
- `resources/js/api/booking.api.ts` — current booking API client
- `routes/api.php` — backend route expectations

## Public index page filtering contract

The following public listing pages now expose client-side search and filter behavior over the existing mock datasets. The fields below are the canonical searchable/facet fields used by the UI.

- `resources/js/pages/Destinations.tsx` — search by destination name/country, filter by category, sort by featured/price/rating.
- `resources/js/pages/Hotels.tsx` — filter by stars, tags, and price range; query-string driven star defaults remain supported.
- `resources/js/pages/Tours.tsx` — search by tour name/location/duration/description; filter by location and duration.
- `resources/js/pages/Cars.tsx` — search by name/category/fuel/transmission/description/policy/features; filter by category, fuel, transmission, and seats.
- `resources/js/pages/Flights.tsx` — search by airline/route/cabin/stops/aircraft/refund details; filter by airline, stops, and cabin.
- `resources/js/pages/Events.tsx` — search by title/location/date/attendees/description/about; filter by location.
- `resources/js/pages/Promos.tsx` — search by code/title/description/discount/expiry; filter by promo type (percentage vs perk).
- `resources/js/pages/Deals.tsx` — search by title/description/discount/expiry/category; filter by category.
- `resources/js/components/BlogSection.tsx` — search by blog title/excerpt/category; filter by category.

Shared filter UI helpers:

- `resources/js/components/ListFilterBar.tsx` — consistent search field, active result count, and clear-filters action.
- `resources/js/lib/listFilters.ts` — shared string matching helpers for list pages.

## Shared conventions

- `LocalizedText` means `Record<Lang, string>` where `Lang` is the app locale union.
- Locale keys used everywhere: `fr`, `ar`, `en`.
- Required means the field exists in the current mock objects and should be treated as mandatory for the backend contract unless noted otherwise.
- Optional means the field may be omitted by future backend payloads or is not always present in every view.

---

## Shared catalog helpers

`resources/js/data/catalog.ts` exports the lookup and search helpers used by the UI:

- `localizeText(value, lang)`
- `getFlights()` / `findFlightById(id)`
- `getDeals()` / `findDealBySlug(slug)`
- `searchDeals(query, lang)`
- `getCars()` / `findCarBySlug(slug)`
- `getEvents()` / `findEventBySlug(slug)`
- `getPromos()` / `findPromoByCode(code)`

These functions are read-only helpers; they do not mutate data.

---

## Shared mock data schemas

### 1) FlightItem — `resources/js/data/flights.data.ts`

```ts
interface FlightItem {
  id: string;
  airline: LocalizedText;
  from: string;
  to: LocalizedText;
  duration: LocalizedText;
  price: number;
  stops: LocalizedText;
  departure: string;
  arrival: string;
  cabin?: LocalizedText;
  aircraft?: LocalizedText;
  baggage?: LocalizedText;
  refund?: LocalizedText;
}
```

Required:
- `id`
- `airline`
- `from`
- `to`
- `duration`
- `price`
- `stops`
- `departure`
- `arrival`

Optional:
- `cabin`
- `aircraft`
- `baggage`
- `refund`

Notes:
- `departure` and `arrival` are time strings, e.g. `09:45` or `06:15+1`.
- `from` is a plain string, not localized.

### 2) PromoItem — `resources/js/data/promos.data.ts`

```ts
interface PromoItem {
  code: string;
  title: LocalizedText;
  discount: LocalizedText;
  description?: LocalizedText;
  expires?: LocalizedText;
  color: string;
  eligibility?: LocalizedText[];
  howToUse?: LocalizedText[];
  terms?: LocalizedText[];
}
```

Required:
- `code`
- `title`
- `discount`
- `color`

Optional:
- `description`
- `expires`
- `eligibility`
- `howToUse`
- `terms`

Notes:
- `color` is a Tailwind gradient/token string such as `from-primary to-primary/70`.
- Array fields contain localized bullet items.

### 3) DealItem — `resources/js/data/deals.data.ts`

```ts
interface DealItem {
  slug: string;
  title: LocalizedText;
  description?: LocalizedText;
  discount?: LocalizedText;
  expires?: LocalizedText;
  category?: LocalizedText;
  highlights?: LocalizedText[];
  terms?: LocalizedText[];
}
```

Required:
- `slug`
- `title`

Optional:
- `description`
- `discount`
- `expires`
- `category`
- `highlights`
- `terms`

### 4) CarItem — `resources/js/data/cars.data.ts`

```ts
interface CarItem {
  slug: string;
  name: LocalizedText;
  category?: LocalizedText;
  price: number;
  seats: number;
  fuel?: LocalizedText;
  transmission?: LocalizedText;
  image: string;
  gallery?: string[];
  description?: LocalizedText;
  features?: LocalizedText[];
  policy?: LocalizedText[];
}
```

Required:
- `slug`
- `name`
- `price`
- `seats`
- `image`

Optional:
- `category`
- `fuel`
- `transmission`
- `gallery`
- `description`
- `features`
- `policy`

### 5) EventItem — `resources/js/data/events.data.ts`

```ts
interface EventScheduleItem {
  day: LocalizedText;
  activity: LocalizedText;
  details: LocalizedText;
}

interface EventItem {
  slug: string;
  title: LocalizedText;
  location: LocalizedText;
  date: LocalizedText;
  attendees: LocalizedText;
  image: string;
  gallery: string[];
  description: LocalizedText;
  about: LocalizedText;
  price: number;
  schedule: EventScheduleItem[];
}
```

Required:
- all fields above

Notes:
- `schedule` is always an array of day-by-day entries.
- Each schedule item requires `day`, `activity`, and `details`.

---

## Admin store shapes

`resources/js/hooks/useAdminStore.ts` hydrates localized seed data into plain strings for the admin UI.

### AdminDestination

```ts
interface AdminDestination {
  id: string;
  name: string;
  country: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  description: string;
}
```

### AdminHotel

```ts
interface AdminHotel {
  id: string;
  name: string;
  location: string;
  category: string;
  price: number;
  rating: number;
  image: string;
}
```

### AdminTour

```ts
interface AdminTour {
  id: string;
  name: string;
  location: string;
  duration: string;
  price: number;
  rating: number;
  image: string;
}
```

### AdminBooking

```ts
interface AdminBooking {
  id: string;
  client: string;
  type: string;
  item: string;
  date: string;
  amount: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
}
```

### AdminUser

```ts
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin' | 'assistant';
  active: boolean;
  joined: string;
}
```

Notes:
- The seed data is localized first, then hydrated to strings using the active language.
- Admin booking `status` is normalized to a plain string after hydration.

---

## Page-local static datasets

These are still mock objects, but they live inside pages/components instead of `resources/js/data/`.

### Destinations list — `resources/js/pages/Destinations.tsx`

```ts
interface DestinationCard {
  slug: string;
  name: LocalizedText;
  country: LocalizedText;
  image: string;
  rating: number;
  price: number;
  category: 'beach' | 'city' | 'nature' | 'luxury' | 'adventure';
  description: LocalizedText;
}
```

Filter arrays:
- `categories`: `{ value: 'all' | 'beach' | 'city' | 'nature' | 'luxury' | 'adventure'; labelKey: string }[]`
- `SORT_OPTIONS`: `{ value: 'featured' | 'price-asc' | 'price-desc' | 'rating'; labelKey: string }[]`

### Destination detail — `resources/js/pages/DestinationDetail.tsx`

```ts
interface DestinationDetailItem {
  slug: string;
  name: LocalizedText;
  country: LocalizedText;
  image: string;
  gallery: string[];
  rating: number;
  price: number;
  category: LocalizedText;
  description: LocalizedText;
  about: LocalizedText;
  highlights: LocalizedText[];
  bestTime: LocalizedText;
  language: LocalizedText;
  currency: LocalizedText;
  weather: LocalizedText;
}

interface RelatedHotelItem {
  slug: string;
  name: LocalizedText;
  image: string;
  price: number;
  destinationSlug: string;
}

interface RelatedTourItem {
  slug: string;
  name: LocalizedText;
  location: LocalizedText;
  duration: LocalizedText;
  price: number;
  image: string;
}
```

### Hotels list — `resources/js/pages/Hotels.tsx`

```ts
interface HotelCard {
  id: string;
  name: LocalizedText;
  location: LocalizedText;
  price: number;
  rating: number;
  stars: number;
  reviews: number;
  image: string;
  amenities: string[];
  tags: string[];
}

interface HotelTag {
  id: string;
  name: LocalizedText;
}
```

### Hotel detail — `resources/js/pages/HotelDetail.tsx`

```ts
interface HotelAmenity {
  id: string;
  name: LocalizedText;
  icon: LucideIcon;
}

interface HotelRoom {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  pricePerNight: number;
  capacity: number;
  size: number;
  features: LocalizedText[];
  images: string[];
}

interface HotelDetailData {
  id: string;
  name: LocalizedText;
  city: LocalizedText;
  country: LocalizedText;
  location: LocalizedText;
  address: string;
  stars: number;
  rating: number;
  reviews: number;
  phone: string;
  whatsapp: string;
  description: LocalizedText;
  images: string[];
  amenities: HotelAmenity[];
  rooms: HotelRoom[];
}
```

### Tours list — `resources/js/pages/Tours.tsx`

```ts
interface TourCard {
  slug: string;
  name: LocalizedText;
  location: LocalizedText;
  duration: LocalizedText;
  maxGroup: number;
  price: number;
  rating: number;
  image: string;
  description: LocalizedText;
}
```

### Tour detail — `resources/js/pages/TourDetail.tsx`

```ts
interface TourDetailItem {
  slug: string;
  name: LocalizedText | string;
  type: LocalizedText | string;
  location: Array<LocalizedText | string>;
  durationDays: number;
  durationNights: number;
  maxGroup: number;
  pricePerPerson: number;
  rating: number;
  images: string[];
  tags: string[];
  itinerary: Array<{
    day: number;
    title: LocalizedText | string;
    details?: LocalizedText | string;
  }>;
  inclusions?: Array<LocalizedText | string>;
  includes?: Array<LocalizedText | string>;
  excludes?: Array<LocalizedText | string>;
  exclusions?: Array<LocalizedText | string>;
  description: LocalizedText | string;
}
```

Notes:
- The component accepts both `inclusions` and `includes`, and both `excludes` and `exclusions`.
- `details` inside itinerary entries is optional in the component, but present in the current mock data.

### Blog posts — `resources/js/components/BlogSection.tsx` and `resources/js/pages/BlogPostDetail.tsx`

```ts
interface BlogPost {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  date: string;
  category: LocalizedText;
  image: string;
  content?: LocalizedText;
}
```

Notes:
- The list view only uses `slug`, `title`, `excerpt`, `date`, `category`, and `image`.
- The detail page also reads `content`.

### Contact page — `resources/js/pages/Contact.tsx`

```ts
interface ContactMethod {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
}

interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}
```

### Search widget — `resources/js/components/SearchWidget.tsx`

```ts
type SearchTab = 'hotels' | 'tours' | 'flights';

interface ExtraFieldOption {
  value: string;
  labelKey: string;
}

interface ExtraFieldConfig {
  key: string;
  labelKey: string;
  options: ExtraFieldOption[];
}

interface SearchTabConfig {
  titleKey: string;
  buttonKey: string;
  guestLabelKey: string;
  extraFields: ExtraFieldConfig[];
}

interface SearchFormValues {
  destination: string;
  dateRange: DateRange | undefined;
  guests: number;
  extras: Record<string, string>;
}
```

Search tab-specific extra fields:
- hotels: `roomType`, `propertyClass`
- tours: `tourStyle`, `duration`
- flights: `tripType`, `cabinClass`

Default form values are stored in `DEFAULT_FORM_STATE`.

### Sticky booking card — `resources/js/components/StickyBookingCard.tsx`

```ts
type DetailItem = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
};

interface StickyBookingCardProps {
  price?: number;
  minPrice?: number;
  currency?: string;
  priceLabel?: string;
  priceSuffix?: string;
  badge?: string;
  title?: string;
  location?: string | string[];
  description?: string;
  rating?: number;
  reviews?: number;
  ratingMeta?: string;
  details?: DetailItem[];
  detailsLayout?: 'rows' | 'grid3';
  duration?: string;
  maxGroup?: number;
  type?: string;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  tertiaryButtonLabel?: string;
  phoneNumber?: string;
  favoriteItem?: FavoriteItem;
  onBook: () => void;
  onWhatsApp?: () => void;
}
```

### Footer and navbar link sets

`resources/js/components/Footer.tsx`

- `quickLinks`: `{ labelKey: string; href: string }[]`
- `supportLinks`: `{ labelKey: string; href: string }[]`

`resources/js/components/Navbar.tsx`

- `destDropdown.items`: `{ labelKey: string; href: string }[]`
- `hotelDropdown.items`: `{ labelKey: string; href: string }[]`
- `moreDropdown.items`: `{ labelKey: string; href: string }[]`
- `simpleLinks`: `{ labelKey: string; href: string }[]`

### Legal page — `resources/js/pages/Legal.tsx`

```ts
interface LegalSection {
  title: LocalizedText;
  body: LocalizedText;
}
```

### Miscellaneous static lists

`resources/js/pages/DesignTrip.tsx`
- `destinations`, `interests`, `accommodations`, `transports`, `budgets`: `{ id: string; label: string; icon: LucideIcon; desc?: string }[]`
- `steps`: `{ key: string; title: string; subtitle: string; icon: LucideIcon }[]`
- form shape: `{ destinations: string[]; interests: string[]; accommodation: string; transport: string[]; transportSingle: string; startDate: string; endDate: string; travelers: number; budget: string }`

`resources/js/pages/Gallery.tsx`
- `photos: string[]`

`resources/js/pages/Team.tsx`
- `team: { name: string; role: string; image: string; bio: string }[]`

`resources/js/pages/ClientDashboard.tsx`
- `bookings`: `{ id: number; destination: LocalizedText; hotel: LocalizedText; dates: LocalizedText; status: 'confirmed' | 'pending'; statusLabel: LocalizedText; price: string }[]`
- `recommendations`: `{ name: LocalizedText; price: string; rating: number; image: string }[]`
- `sidebarLinks`: `{ icon: LucideIcon; labelKey: string; active?: boolean }[]`

`resources/js/pages/AssistantDashboard.tsx`
- `inquiries`: `{ id: number; client: string; subject: LocalizedText; time: string; status: 'new' | 'in-progress' | 'resolved'; priority: 'high' | 'medium' | 'low' }[]`
- `bookingRequests`: `{ id: string; client: string; destination: LocalizedText; dates: LocalizedText; guests: number; status: 'pending' | 'approved'; statusLabel: LocalizedText }[]`
- `sidebarLinks`: `{ icon: LucideIcon; labelKey: string; active?: boolean }[]`

`resources/js/pages/AdminDashboard.tsx`
- `stats`: `{ labelKey: string; value: string | number; change: string; icon: LucideIcon; color: string }[]`
- `revenueData`: `{ month: string; revenue: number }[]`

`resources/js/pages/admin/AdminReports.tsx`
- `COLORS: string[]`
- `pieData`: `{ name: string; value: number }[]`
- `stats`: `{ label: string; value: string | number; icon: LucideIcon }[]`

`resources/js/pages/admin/AdminBookings.tsx`
- booking row shape:
  - `id: number`
  - `user_id: number | null`
  - `type: string`
  - `items: unknown[]`
  - `created_at: string`
  - `total_amount: number`
  - `status: string`

Example booking row:

```json
{
  "id": 101,
  "user_id": 7,
  "type": "hotel",
  "items": [{ "slug": "sunset-paradise-resort", "qty": 1 }],
  "created_at": "2026-05-13T09:15:00Z",
  "total_amount": 2450,
  "status": "Pending"
}
```

---

## Booking API contract

Current frontend client: `resources/js/api/booking.api.ts`

### Implemented routes from `routes/api.php`

- `GET /api/bookings/{id}` — public read-only booking lookup
- `POST /api/bookings` — authenticated create booking
- `POST /api/bookings/{id}/cancel` — authenticated owner cancellation
- `GET /api/admin/bookings` — admin list
- `POST /api/admin/bookings/{id}/confirm` — admin confirmation

Auth rules in the route file:
- public: `GET /api/bookings/{id}`
- `auth:sanctum`: create and cancel
- `auth:sanctum` + `can:admin`: admin endpoints

### Current client behavior

`createBooking(payload)`
- sends JSON to `POST /api/bookings`
- includes credentials
- redirects to `/login` on `401` or `419`
- throws the server message for other failures

`getBooking(id)`
- fetches `GET /api/bookings/{id}`

`cancelBooking(id)`
- posts to `POST /api/bookings/{id}/cancel`

`getAdminBookings()`
- fetches `GET /api/admin/bookings`

`confirmBooking(id)`
- posts to `POST /api/admin/bookings/{id}/confirm`

### Recommended booking payload for backend implementation

The frontend currently accepts `Record<string, unknown>`, so the backend should standardize it to a real schema.

Required fields:
- `type`: `'destination' | 'hotel' | 'tour' | 'flight' | 'car'`
- `item_id` or `item_slug`: string
- `amount`: number
- `client.name`: string
- `client.email`: string

Conditionally required:
- `start_date`: string in ISO date format when the booked product needs dates
- `end_date`: string in ISO date format when the booked product spans multiple days

Optional:
- `client.phone`
- `travelers`
- `promo_code`
- `notes`
- `payment`

Suggested request body:

```json
{
  "type": "hotel",
  "item_slug": "le-grand-parisien",
  "start_date": "2026-06-15",
  "end_date": "2026-06-18",
  "client": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+441234567890"
  },
  "travelers": [
    { "name": "John Doe", "age": 34 }
  ],
  "amount": 899,
  "promo_code": "SPRING30",
  "notes": "Late check-in requested"
}
```

### Suggested successful response shape

For create/get/cancel/confirm flows, return a booking resource that includes:
- `id`
- `type`
- `item_slug` or `item_id`
- `client`
- `amount`
- `status`
- `created_at`
- any server-computed timestamps such as `cancelled_at` or `confirmed_at`

Suggested create response:

```json
{
  "id": 1234,
  "type": "hotel",
  "item_slug": "le-grand-parisien",
  "start_date": "2026-06-15",
  "end_date": "2026-06-18",
  "client": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+441234567890"
  },
  "amount": 899,
  "status": "Pending",
  "created_at": "2026-05-13T12:34:56Z"
}
```

### Validation and error responses to support

- `422 Unprocessable Entity` — invalid payload
- `401 Unauthorized` — unauthenticated user
- `403 Forbidden` — not the owner or not an admin
- `404 Not Found` — missing booking

Example validation response:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "client.email": ["The client.email must be a valid email address."],
    "start_date": ["The start_date field is required for this booking type."]
  }
}
```

---

## Backend starter notes

If you are building the backend next, this is the minimum contract to keep the UI happy:

- keep the booking routes exactly as declared in `routes/api.php`
- return JSON, not HTML, from the booking controller endpoints
- validate `client` and item identifiers before creating bookings
- preserve the admin booking row shape expected by `AdminBookings`
- keep localized display values separate from the persisted booking record when possible
- if you add new mock fields in the frontend, update this file in the same change

---

## Quick summary

This app is still static/mock-first, but the backend contract is already visible:
- shared datasets live in `resources/js/data/`
- detail pages add richer local mock shapes
- booking API is the only active server contract right now
- `catalog.ts` is the shared lookup helper, not a backend source of truth

If you want, the next best step is to turn the booking contract above into a proper OpenAPI/JSON schema spec.