# OS-TRAVEL Hotel API Integration Plan (Revised v2)

BelAzurTravel — integrate the OS-TRAVEL hotel catalog beside the existing `hotels` DB with an admin approval gate, then serve confirmed data via the existing public API.

## 0. Decisions locked in

| Decision | Choice |
|---|---|
| Storage | Raw external payloads in **staging tables**; approval **publishes into existing `hotels`** |
| Scope | **Catalog only** (ListCountry/City/Boarding/Categorie/Currency/ListHotel/HotelDetail). Transactional (HotelSearch/Booking*) deferred to Phase 9 |
| Sync trigger | **Scheduled only** (cron via `Schedule::command`), **single-flight** (no overlapping runs) |
| Approval | Per-hotel review + **bulk approve** (publishes lazily, requires staged `base_price`); reject supported |
| Markup | Default **+20%** (`OS_TRAVEL_MARKUP_DEFAULT`); **editable per hotel** |
| Pricing input | `base_price` is set **per hotel on the staging row** (admin input) — never inferred, never defaulted to 0 |
| Currency | Store `currency` on `hotels` (default `TND`) — future-proofs Phase 9 live pricing |
| Slug strategy | Collision-safe: `{slug}-{external_id}` fallback; never overwrite manually-edited slugs on re-publish |
| Image sync | Hash-based dedup; never re-download unchanged URLs; preserve admin overrides; scheme/host validated before fetch |
| Orphan lifecycle | Missing from sync → `orphaned`; reappears in a later sync → reactivated (see Phase 3) |
| Throttling | 150ms delay between `HotelDetail` calls; max 200 hotels per `HotelSearch` respected |

---

## 1. Architecture

```
cron ──▶ SyncOsTravelCatalog (single-flight lock) ──▶ OsTravelClient ──▶ OS-TRAVEL API
              │                     ▲                    │
              ▼                     │                    ▼
     os_travel_syncs / os_travel_reference / os_travel_hotels (status=pending, base_price=null)
              │
        Admin sets base_price per hotel + reviews (AdminOsTravel.tsx) → approve / bulk approve / reject
              │
              ▼  HotelPublisher (+20% markup, hash-based images, collision-safe slug, URL-validated fetch)
        published into `hotels`  (base_price, markup_percentage, currency, price=base*(1+markup/100))
              │
              ▼
   existing HotelController (/api/hotels) + public pages — unchanged
```

- **Never** expose provider credentials, `Token`, `Source`, or staging data to the frontend.
- Static data is cached locally; availability/pricing stays real-time (Phase 9).

## 2. Test stack (existing conventions)

- PHPUnit + `RefreshDatabase` + sqlite `:memory:` (`phpunit.xml`). Feature tests in `tests/Feature/`, unit in `tests/Unit/`. Pattern reference: `tests/Feature/AdminFlightsE2ETest.php`.
- HTTP mocking: `Http::fake()` (Laravel HTTP client).
- Frontend: Vitest + Testing Library (`npm run test`), ESLint (`npm run lint`), TypeScript (`tsc`).
- PHP style: Pint (`composer run test:lint`). Full: `composer run test`.

---

## Phase 0 — Security & configuration prep

**Goal:** remove live credentials from the repo (and its history) and wire env configuration.

**Details:**
1. `Belazur_collection.json` and `endpoints-schema-data.json` contain live creds (`XMLBEL`, password, `admin.mygo.co`).
   - **Treat these as already-burned secrets, not just files to gitignore.** If either file was ever committed with real values, the secret is retrievable from any prior commit (`git show <sha>:path`) even after a "removal" commit — a forward-only gitignore does not fix this.
   - Confirm exposure: `git log --all --follow -- Belazur_collection.json endpoints-schema-data.json`. If any commit predates the cleanup, the credential must be **rotated with OS-TRAVEL** (new login/password issued) regardless of what happens to git history.
   - If the repo has been pushed to any remote (including private), scrub history with `git filter-repo` (preferred) or BFG Repo-Cleaner, then force-push and have all collaborators re-clone. Rotation is mandatory either way; history scrubbing is defense in depth, not a substitute for it.
   - Strip secrets, keep sanitized copies as fixtures under `tests/Fixtures/` (rename to `os_travel_{endpoint}.json`), and **gitignore** the two root JSON files going forward.
2. Add to `.env` / `.env.example`:
   - `OS_TRAVEL_BASE_URL`
   - `OS_TRAVEL_LOGIN`
   - `OS_TRAVEL_PASSWORD`
   - `OS_TRAVEL_MARKUP_DEFAULT=20`
   - `OS_TRAVEL_CURRENCY_DEFAULT=TND`
   - `OS_TRAVEL_SYNC_THROTTLE_MS=150`
   - `OS_TRAVEL_BULK_APPROVE_MAX=50`
   - `OS_TRAVEL_SYNC_LOCK_TTL_MINUTES=180`
3. Add a `config/ostravel.php` with `base_url`, `login`, `password`, `markup.default`, `currency.default`, `sync.throttle_ms`, `sync.bulk_approve_max`, `sync.countries` (empty = all), `sync.interval`, `sync.lock_ttl_minutes`.

**How we test it:**
- Automated: a unit test asserts `config('ostravel.markup.default') === 20`, `config('ostravel.currency.default') === 'TND'`, and keys resolve from env (set via `config()->set`).
- Manual: `git log --all --oneline` / `git grep -iE "OS_TRAVEL_PASSWORD|<OLD_OS_TRAVEL_PASSWORD>"` across **all** refs to confirm no live credential string remains reachable in history; confirm the OS-TRAVEL account was rotated (old login/password rejected by the sandbox/live API); `php artisan config:clear` then tinker `config('ostravel.login')`.

**Done when:** no live secrets reachable in current files **or history**; credentials rotated if ever pushed; `.env.example` documents all `OS_TRAVEL_*` keys; fixtures exist.

---

## Phase 1 — Config + HTTP client (`OsTravelClient`)

**Goal:** thin, testable client for the 7 static endpoints.

**Details:**
- New `app/Services/OsTravel/OsTravelClient.php`:
  - `protected credentialBody(): array` → `['Credential' => ['Login' => config(...), 'Password' => config(...)]]`.
  - Methods: `listCountries()`, `listCities(string $countryId)`, `listBoardings()`, `listCategories()`, `listCurrencies()`, `listHotels(string $cityId)`, `hotelDetail(string $hotelId)`.
  - Each: `Http::baseUrl(config('ostravel.base_url'))->asJson()->post('/api/hotel/{Endpoint}', [...payload, ...credential])`, check HTTP status, throw a typed `OsTravelApiException` on `ErrorMessage` non-empty, return decoded body.
  - Timeout + retry (3, `retryWhen` 429/5xx) via Laravel HTTP client.
  - **Pagination probe:** `listHotels()` returns the raw response so `OsTravelCatalogSync` can detect pagination metadata (e.g., `Page`, `TotalPages`) and loop if present.
- Fixture responses (Phase 0) used for `Http::fake()`.

**How we test it:**
- Automated (`tests/Unit/OsTravelClientTest.php`): for each method, `Http::fake(['*/api/hotel/*' => Http::response($fixture)])`; assert correct URL, method, JSON body contains `Credential.Login/Password`; assert parsed array shape (e.g. `listCountries()` returns items with `Id/Code/Name`); assert `OsTravelApiException` thrown when response contains `ErrorMessage`.
- Manual: temporarily point `OS_TRAVEL_BASE_URL` at sandbox and run a tinker call; confirm creds never logged.

**Done when:** all 7 methods covered by tests; exception path tested; pagination metadata inspected; Pint clean.

---

## Phase 2 — Staging schema + models

**Goal:** persistent raw catalog with review status and orphan tracking.

**Details — migrations:**
1. `2026_08_xx_create_os_travel_syncs_table.php` — `id`, `batch` (string, indexed), `status` (string: `running|success|failed`), `started_at`, `finished_at`, `countries_count`, `cities_count`, `hotels_count`, `details_count`, `orphaned_count`, `reactivated_count`, `error` (text nullable), timestamps.
2. `2026_08_xx_create_os_travel_reference_table.php` — `id`, `type` (string: `country|city|boarding|category|currency`), `external_id` (string), `code` (nullable), `name` (nullable), `payload` (json), `sync_id` (nullable FK), timestamps; **unique(`type`,`external_id`)**.
3. `2026_08_xx_create_os_travel_hotels_table.php` — `id`, `external_id` (string, unique), `sync_id` (nullable FK), `payload` (json, raw ListHotel + enriched HotelDetail), `payload_hash` (string 64, for change detection), `name` (string), `city_external_id` (string, indexed), `city_name` (nullable), `category_title` (nullable), `stars` (nullable tinyint), `image` (nullable), `status` (string default `pending`), `hotel_id` (nullable FK → `hotels.id`), `base_price` (unsignedInteger nullable), `markup_percentage` (decimal 5,2 nullable), `currency` (string 3 default 'TND'), `approved_by` (nullable FK users), `approved_at`, `rejected_at`, `last_synced_at`, timestamps.

**Models:** `OsTravelSync`, `OsTravelReference`, `OsTravelHotel` with `casts` (`payload` → array) and `status` constants (`PENDING/APPROVED/PUBLISHED/REJECTED/ORPHANED`). Relations: `OsTravelHotel::hotel()` → `Hotel`.

**How we test it:**
- Automated: `tests/Feature/OsTravelSchemaTest.php` — `migrate:fresh` runs; assert columns exist via `Schema::hasColumn`; assert unique index rejects duplicate `(type, external_id)` and duplicate `external_id`; model casts JSON.
- Manual: `php artisan migrate:fresh --seed`, inspect tables.

**Done when:** migrations idempotent; tests green.

---

## Phase 3 — Catalog sync service + command + scheduler

**Goal:** pull the catalog into staging on a schedule, without overlapping runs, detect orphans (and reactivations), and throttle detail calls.

**Details:**
- New `app/Services/OsTravel/OsTravelCatalogSync.php`:
  1. Acquire a **single-flight lock** (`Cache::lock('os-travel-sync', config('ostravel.sync.lock_ttl_minutes') * 60)`); if not acquired, log and exit without creating a sync row — a prior run is still in progress.
  2. Create `os_travel_syncs` row (`running`).
  3. `listCountries()` → upsert `os_travel_reference` (`country`).
  4. `listCities()` per configured country (all if none) → upsert (`city`).
  5. `listBoardings()`, `listCategories()`, `listCurrencies()` → upsert.
  6. For each city: `listHotels()` → upsert into `os_travel_hotels`.
     - New hotels are inserted as `pending`.
     - **Never** flip an `approved`/`published` hotel back to `pending` on re-sync — update `payload`/`last_synced_at` only.
     - **Orphan reactivation:** if an existing row is `orphaned` and reappears in this sync, set `status = pending` (if it was never published) or restore its prior post-approval status (`approved`/`published`) if it had one before going orphaned — never silently re-publish without admin awareness; log the reactivation. Increment `reactivated_count`.
     - **Probe pagination metadata; loop if multiple pages.**
  7. For new/changed hotels (compare `payload_hash`): `hotelDetail()` → merge into `payload`.
     - **Throttle:** `usleep(config('ostravel.sync.throttle_ms') * 1000)` between detail calls.
  8. **Orphan detection:** after all cities processed, find `os_travel_hotels` where `last_synced_at < sync.started_at` and status is `pending`/`approved` → mark `orphaned` (record prior status so reactivation in step 6 can restore it). If already `published`, log a warning (do not auto-unpublish; admin decides).
  9. Record counts; set `success`; on exception set `failed` + `error`, rethrow; **always release the lock** (`finally`), even on exception.
- New `app/Console/Commands/SyncOsTravelCatalog.php` — signature `os-travel:sync-catalog`.
- `routes/console.php`:
  ```php
  Schedule::command('os-travel:sync-catalog')
      ->dailyAt('02:00')
      ->withoutOverlapping(config('ostravel.sync.lock_ttl_minutes'))
      ->onOneServer();
  ```
- Cache: on sync, forget `admin.entity.hotels`, `hotels.index`.

**How we test it:**
- Automated: `tests/Unit/OsTravelCatalogSyncTest.php` — `Http::fake()` a full country→city→hotel→detail chain (use fixtures); assert reference rows, hotel rows (`pending`), payload merge, sync log counts/status; simulate API failure mid-chain → sync log `failed`, partial rows preserved, exception propagates, **lock released**; assert a second concurrent invocation while the lock is held exits immediately without creating a sync row; assert an `orphaned` hotel that reappears is reactivated to its prior status and `reactivated_count` increments. `tests/Feature/SyncOsTravelCommandTest.php` — run command via `Artisan::call`, assert `success` exit + rows.
- Manual: on sandbox creds, run `php artisan os-travel:sync-catalog` twice; verify upsert idempotent (no dup `external_id`), `last_synced_at` bumps, approved hotels stay approved, orphaned hotels detected; kick off two overlapping runs manually and confirm the second is a no-op.

**Done when:** command exits 0; log rows correct; idempotent re-runs; overlapping runs prevented; orphan detection and reactivation both work; tests green.

---

## Phase 4 — Publish + mapper + markup

**Goal:** turn a staged hotel into a confirmed `hotels` row with the configured markup, collision-safe slug, and smart images.

**Details — `app/Services/OsTravel/HotelPublisher.php`:**

Mapping from payload → `Hotel`:

| Hotel field | Source |
|---|---|
| `name` (array) | `Name` → all locales (en/fr/ar = name) |
| `location` (array) | `City.Name` → locales |
| `category` (array) | `Category.Title` / `Category.Star` |
| `stars` | `Category.Star` |
| `rating`/`reviews` | payload if present else 0 |
| `image` | `Image` **downloaded & stored** to `storage/app/public/uploads/hotels` (fallback: keep URL) |
| `details.gallery` | `Album[].Url` (downloaded) |
| `details.address/phone/whatsapp` | `Adress`, `Phone`, `Email` |
| `details.city/country/description` | `City`, `Country`, `LongDescription` (locales) |
| `details.source` | `'ostravel'`, `details.provider_hotel_id` = external id |
| `tags` | `Theme[]` |
| `slug`/`code` | `code = ostravel-{external_id}` (unique). Slug: generate from name; if collision, append `-{external_id}`. **Never overwrite a manually-changed slug on re-publish.** |
| `destination_slug` | nullable (unchanged) |
| `currency` | `config('ostravel.currency.default')` or admin override |

**Pricing input (clarified):**
- `base_price` is **not** something `HotelPublisher` invents or defaults. It is an admin-entered value stored on `os_travel_hotels.base_price` **before** the hotel is publishable — set via the single-hotel preview dialog (Phase 6) or a pre-fill step ahead of a bulk approve.
- `HotelPublisher::publish()` requires a non-null `base_price` on the staging row (either already stored, or passed in on a single-hotel approve call, which persists it back to the staging row first). If `base_price` is missing, `publish()` throws rather than silently writing `0`.
- `markup_percentage` = per-hotel override ?? `config('ostravel.markup.default')` (20).
- `price` = `(int) round(base_price * (1 + markup_percentage / 100))`.
- On re-publish, `base_price` carries forward from the existing staging row unless explicitly changed.

Image sync strategy:
- Hash the image URL (`sha1`). Store hash in `hotels.meta['image_hash']`.
- On re-publish: if hash matches existing, skip download. If URL changed or file missing, download new image.
- **Before fetching**, validate each image URL: scheme must be `http`/`https`, and the resolved host must not be a private/loopback/link-local address (basic SSRF guard against a malformed or compromised upstream payload). Reject and log otherwise; fall back to no image / existing local file.
- If download fails, keep existing local file or fallback to remote URL. Log warning.

Publish flow:
1. `Hotel::updateOrCreate(['code' => 'ostravel-{id}'], $mapped)`.
2. Set `os_travel_hotels.hotel_id`, `status = published`, `approved_by/approved_at`.
3. `flushAdminCache('hotels', $slug)`.

**Modify `AdminHotelController`** (attributes + payload): accept `base_price`, `markup_percentage`, `currency`; compute `price` when base+markup present (keep legacy: if `price` sent without base/markup, store as-is). Return `base_price`, `markup_percentage`, `currency`, `price` in `adminPayload`.

**Modify `HotelController::payload`**: also return `base_price`, `markup_percentage`, `currency`.

**Modify `Hotel` model**: add `base_price`, `markup_percentage`, `currency` to `$fillable` + casts.

**Modify `AdminHotels.tsx`**: add `basePrice`, `markupPercentage`, `currency` fields (markup default 20, currency default TND) to the form + `HotelFormValues`.

**How we test it:**
- Automated:
  - `tests/Unit/OsTravelHotelPublisherTest.php` — publish from a fixture payload with `base_price` staged → assert `Hotel` row fields, `code = ostravel-{id}`, `markup_percentage = 20`, `currency = TND`, `price = round(base*1.2)`; override markup (e.g. 15) → price uses 15; re-publish updates in place without duplicating, carrying forward `base_price`; cache keys flushed (assert via `Cache::has` after `Cache::put`); **publish with no `base_price` staged and none passed in throws and does not create/update a `Hotel` row**.
  - `tests/Unit/AdminHotelMarkupTest.php` — admin `PUT /admin/hotels/{id}` with `base_price`+`markup_percentage` computes `price`; with only `price` keeps legacy behavior.
  - `tests/Unit/HotelPublisherSlugTest.php` — duplicate name → unique slug; manual slug override preserved on re-publish.
  - `tests/Unit/HotelPublisherImageTest.php` — same URL hash → skip download; different URL → download; failure → fallback; **URL pointing at a private/loopback host is rejected and does not trigger a fetch**.
- Manual: publish one staged hotel, inspect `hotels` row + public `/api/hotels/{slug}` shows `price`, `base_price`, `markup_percentage`, `currency`.

**Done when:** mapping + markup + slug + image logic covered, including the missing-`base_price` guard and image SSRF guard; both payloads expose the new fields; Pint clean.

---

## Phase 5 — Admin API

**Goal:** admin-only endpoints to review/approve staging data.

**Details — new `app/Http/Controllers/Api/AdminOsTravelController.php`** (routes under existing `role:admin` group in `routes/api.php`):

| Route | Action |
|---|---|
| `GET /admin/os-travel` | last sync status + counts per status |
| `GET /admin/os-travel/hotels?status=&city=` | staged list (review columns, incl. whether `base_price` is set) |
| `GET /admin/os-travel/hotels/{id}` | raw `payload` + mapped preview |
| `PUT /admin/os-travel/hotels/{id}` | body `{ base_price, markup_percentage?, currency? }` → persist onto the staging row **without** publishing (used to pre-fill price ahead of a bulk approve) |
| `POST /admin/os-travel/hotels/{id}/approve` | body `{ base_price?, markup_percentage?, currency? }` (base_price required if not already staged) → publish |
| `POST /admin/os-travel/hotels/approve-all` | body `{ markup_percentage?, currency?, include_without_price?, include_without_image?, status?, city?, country_id?, city_id?, stars?, check_in?, check_out? }` (bulk; publishes every hotel matching the applied admin filters straight into `hotels` in **lazy mode** — proxy image URLs, no image downloads, no provider calls; requires a staged `base_price`, so opted-in no-price hotels report as **failed**; placeholder-image hotels are skipped unless `include_without_image`; already-live rows ignored) |
| `POST /admin/os-travel/hotels/{id}/reject` | set rejected |

Use the existing `role:admin` middleware group; validate with the controller's existing validation style; reuse `flushAdminCache`.

**How we test it:**
- Automated: `tests/Feature/AdminOsTravelTest.php` (mirror `AdminFlightsE2ETest`) —
  - unauthenticated/`client` → 401/403;
  - `PUT` staging price sets `base_price` without publishing;
  - approve single (price already staged) → `os_travel_hotels` published + `hotels` row created + cache flushed + payload returns `base_price`/`markup_percentage`/`currency`;
  - approve single with no price staged and none in the body → 422, nothing published;
  - approve with override markup 15 → price math;
  - bulk approve → publishes only hotels with a staged `base_price`, reports skipped ids (no-price and over-cap) separately, already-published untouched;
  - reject → status rejected, no `hotels` row;
  - preview endpoint returns payload + mapped preview;
  - dashboard endpoint returns counts.
- Manual: as admin, exercise each endpoint in the browser/devtools, including a bulk approve where some staged hotels are missing a price.

**Done when:** full CRUD-approval matrix tested, including the base_price precondition and skip/cap reporting; routes protected.

---

## Phase 6 — Admin frontend page

**Goal:** review + approve UI.

**Details:**
- New `resources/js/pages/admin/AdminOsTravel.tsx` (uses `AdminLayout`, existing UI kit, `useLanguage`):
  - Sync status card (last run, counts, including reactivated).
  - Tabs: Pending / Approved / Published / Rejected / Orphaned.
  - Table with filter (city, stars) and a visual flag on rows missing `base_price`.
  - Preview dialog: localized name, city/country, stars, image gallery, description, boarding; **price section**: base price input + markup % (default 20) + currency dropdown (default TND) + computed final price preview. Saving the dialog without approving persists price via the new `PUT` endpoint.
  - Actions: Approve, Approve All (pending tab, capped warning, **and a pre-flight count of how many will be skipped for missing price**), Reject.
- New API module + hook (e.g. `resources/js/api/osTravel.api.ts` + `hooks/useOsTravelAdmin.ts`) following existing patterns.
- Register route in `resources/js/app.tsx` (`/admin/os-travel`), menu item in `components/layout/AdminLayout.tsx` (icon e.g. `CloudDownload`/`BadgePercent`), translation keys in `i18n/translations`.

**How we test it:**
- Automated: Vitest `resources/js/test/AdminOsTravel.test.tsx` — mock fetch: renders pending list with missing-price flag; opens preview, saves price without approving; approve calls API with base price + markup + currency; shows computed price = base*1.2; bulk approve shows and correctly reports skipped-for-price count and cap; reject; orphaned tab; reactivated indicator; empty state. Follow existing `AdminHotels.test.tsx` patterns.
- Static: `npm run lint`, `npx tsc --noEmit`.
- Manual: run `npm run dev`, log in as admin, review + approve a hotel, confirm it appears on `/hotels` and `/hotels/:slug`.

**Done when:** page functional in 3 languages; vitest + lint + tsc pass.

---

## Phase 7 — Public consumption verification

**Goal:** confirmed hotels flow through the existing public pipeline; pending/orphaned ones never leak.

**Details:** no code changes expected — verify `HotelController` (`/api/hotels`, `/api/hotels/{slug}`, 10-min cache) returns published hotels only (pending/approved/orphaned are only in staging tables).

**How we test it:**
- Automated: `tests/Feature/OsTravelPublicFlowTest.php` — seed a staged (pending) + a published hotel + an orphaned hotel; `GET /api/hotels` returns only the published one with `price`/`base_price`/`markup_percentage`/`currency`; `GET /api/hotels/{slug}` 200 for published, 404 for pending/orphaned; `GET /api/admin/os-travel/hotels` still lists all three.
- Manual: end-to-end — run sync, set price, approve, browse `/hotels` → detail → verify images, gallery, description render; verify no `Token`/`Source`/credentials in any network response.

**Done when:** public contract verified; no data leak; page renders approved hotel.

---

## Phase 8 — Hardening & final QA

**Details:**
- Concurrency: guard double-publish (`hotel_id` unique/lock), idempotent re-approve. (Sync-level overlap protection is handled in Phase 3.)
- Error handling: `OsTravelApiException` mapped to admin-facing friendly errors.
- Logging: log sync failures, orphan/reactivation events via `Log::error`/`Log::info` (no credentials).
- Image download: failure-tolerant (keep URL fallback), rate-limit friendly, SSRF guard enforced (Phase 4).
- Config review: sync interval + country whitelist + bulk cap + throttle + lock TTL from config.
- `.env.example` completeness.

**How we test it:**
- Automated: full suite `composer run test` (pint + phpunit) and `npm run test`; add any missing edge tests (re-approve idempotency, image download fallback with `Http::fake`, orphan detection/reactivation, bulk cap and missing-price skip enforcement).
- Manual: repeat sync → set price → approve → browse cycle; kill sync mid-run → next run recovers (log shows failed, rows preserved, lock released); verify scheduler registered via `php artisan schedule:list`.

**Done when:** all suites green; no security regressions.

---

## Phase 9 — Live search & pricing (Track B) — NOT built now

Document requirements only:
- Full requirements, file map, and build order live in
  `docs/os-travel-phase-9-live-search.md`.
- Scheduled `os-travel:refresh-latest-prices` (browse mode, batched `HotelSearch`) stores `hotels.last_price`.
- `OsTravelSearchService` proxy for `HotelSearch` (server-side; client sends dates/occupancy + visible hotel slugs, never creds/tokens); live prices override stored price for display only.
- Frontend: `useHotelSearch` hook, index auto-trigger on dates, detail live prices + tokens.
- No tests written until this phase is started.

---

## Phase 10 — Booking proxy (Track C) — NOT built now

Document requirements only:
- Full requirements, file map, and build order live in
  `docs/os-travel-phase-10-booking.md`.
- `BookingCreation` (PreBook → Confirm), `BookingCancellation` (Preview → Confirm), `BookingList` proxied via `OsTravelBookingService`; bookings linked to the existing `bookings`/`payments` (ClictoPay) flow.
- Provider columns (`provider_booking_id`, `provider_booking_reference`, `provider_payload`) on `bookings`.
- Verify `BookingController` + `ClictoPayService` integration.
- No tests written until this phase is started.

---

## Phase 11 — Final QA & go-live — NOT built now

- Full regression, security review, manual E2E, and go-live checklist live in
  `docs/os-travel-phase-11-final-qa.md`.

---

## File inventory

**New**
- `config/ostravel.php`
- `app/Services/OsTravel/OsTravelClient.php`, `OsTravelCatalogSync.php`, `HotelPublisher.php`, `Exceptions/OsTravelApiException.php`
- `app/Models/OsTravelSync.php`, `OsTravelReference.php`, `OsTravelHotel.php`
- `app/Console/Commands/SyncOsTravelCatalog.php`
- `app/Http/Controllers/Api/AdminOsTravelController.php`
- `database/migrations/*_create_os_travel_{syncs,reference,hotels}_table.php`
- `resources/js/pages/admin/AdminOsTravel.tsx`, `resources/js/api/osTravel.api.ts`, `hooks/useOsTravelAdmin.ts`
- `tests/Fixtures/os_travel_*.json`, tests listed per phase

**Modified**
- `.env` / `.env.example`, `.gitignore`
- `routes/api.php`, `routes/console.php`
- `app/Models/Hotel.php`, `app/Http/Controllers/Api/HotelController.php`, `AdminHotelController.php`
- `resources/js/pages/admin/AdminHotels.tsx`, `app.tsx`, `components/layout/AdminLayout.tsx`, `i18n/translations`
- Migration adding `base_price` + `markup_percentage` + `currency` to `hotels`

---

## Changelog vs. original plan

1. **Phase 0** — credential exposure now treated as requiring rotation + history scrub, not just a forward-only `.gitignore`.
2. **Phase 3** — added single-flight sync lock (`withoutOverlapping`/`onOneServer`) instead of deferring it to Phase 8; added explicit orphan-reactivation behavior.
3. **Phase 4** — `base_price` is now a required, admin-set staging-row value with an explicit "missing price" guard in `HotelPublisher`, instead of an implicit approval-dialog input; added image URL scheme/host validation before download.
4. **Phase 5** — added a `PUT` staging-price endpoint; `approve-all` no longer takes a body `base_price` applied across the batch — it publishes only hotels with an already-staged price and reports skipped ids (missing price / over cap).
5. **Phase 6** — admin UI reflects the missing-price flag and pre-flight skip count on bulk approve.
6. **Phase 8** — overlap protection moved out to Phase 3; remaining hardening scoped down accordingly.