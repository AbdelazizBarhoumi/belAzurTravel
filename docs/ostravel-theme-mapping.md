# OS-TRAVEL Hotel Theme Mapping

Reference for the `Theme[]` values returned by the OS-TRAVEL Hotel API
(`ListHotel` and `HotelDetail`) and how each maps to this app's hotel filters
and the amenity/SVG icon system.

## Data flow

1. The provider sends a `Theme[]` array on every `ListHotel` item and on
   `HotelDetail` (see `apidocumentation.md` — Glossary "Tag"). Raw values are
   French-language labels such as `Affaires`, `Famille`, `Sport & Loisirs`.
2. `HotelPublisher::themes()` (`app/Services/OsTravel/HotelPublisher.php`)
   resolves them, preferring `ListHotel` (richer) and falling back to
   `HotelDetail`. After the latest fix each value is `trim()`ed so trailing
   spaces from the provider (e.g. `"Réveillon "`, `"Balnéaire "`) are dropped.
   The cleaned list is stored verbatim in `hotels.tags`.
3. `HotelPublisher::deriveFilterBooleans()` lowercases/trims each theme and
   looks it up in `$themeMap`, setting the corresponding `hotels` boolean
   filter column (e.g. `affaires`, `famille`, `sport_loisir`). These columns
   drive the public service filters in `resources/js/data/hotelFilters.ts`.
4. The public hotel card/search matches on `hotels.tags` (text search) and on
   the boolean filter columns.

## Full theme mapping

Raw values below are the actual distinct themes observed in the staged catalog
at the time of writing, with their occurrence count across staged hotels.

| Provider theme | Normalized key | Icon (lucide-react) | Filter boolean | Status |
|---|---|---|---|---|
| `Affaires` | `affaires` | `Briefcase` | `affaires` | mapped |
| `Business` | `business` | `Briefcase` | `affaires` | mapped (unseen) |
| `Famille` | `famille` | `Users` | `famille` | mapped |
| `Family` | `family` | `Users` | `famille` | mapped (unseen) |
| `Voyages de Noces` | `voyages de noces` | `Heart` | `famille` | mapped |
| `Sport` | `sport` | `Dumbbell` | `sport_loisir` | mapped (unseen) |
| `Loisirs` | `loisirs` | `Dumbbell` | `sport_loisir` | mapped (unseen) |
| `Sport & Loisirs` | `sport & loisirs` | `Dumbbell` | `sport_loisir` | **fixed** |
| `Golf` | `golf` | `Flag` | `sport_loisir` | **fixed** |
| `Thalasso` | `thalasso` | `Droplets` | `thalasso_spa` | mapped (unseen) |
| `Spa` | `spa` | `Droplets` | `thalasso_spa` | mapped (unseen) |
| `Thalassothérapie` | `thalassothérapie` | `Droplets` | `thalasso_spa` | **fixed** |
| `Balnéothérapie` | `balnéothérapie` | `Droplet` | `thalasso_spa` | **fixed** |
| `Thermalisme` | `thermalisme` | `Thermometer` | `thalasso_spa` | **fixed** |
| `Bien être` | `bien être` | `Heart` | `thalasso_spa` | **fixed** |
| `Nature` | `nature` | `Compass` | `nature_aventure` | mapped (unseen) |
| `Aventure` | `aventure` | `Compass` | `nature_aventure` | mapped (unseen) |
| `Découverte` | `découverte` | `Compass` | `nature_aventure` | mapped |
| `Randonnée` | `randonnée` | `Footprints` | `nature_aventure` | **fixed** |
| `Montagne` | `montagne` | `Mountain` | `nature_aventure` | **fixed** |
| `Saharien` | `saharien` | `Sun` | `nature_aventure` | **fixed** |
| `Archéologie` | `archéologie` | `Landmark` | `nature_aventure` | **fixed** |
| `Détente` | `détente` | `Sparkles` | `detente` | mapped (unseen) |
| `Charme` | `charme` | `Gem` | `detente` | mapped |
| `Balnéaire` | `balnéaire` | `Waves` | `detente` | mapped |
| `Week-end` | `week-end` | `CalendarDays` | `detente` | **fixed** |
| `Promo` | `promo` | `Tag` | `tarifs_promo` | **fixed** |
| `Tourisme` | `tourisme` | `Map` | — | unmapped (too generic) |
| `Réveillon` | `réveillon` | `PartyPopper` | — | unmapped (seasonal) |
| `Hôtel de Ville` | `hôtel de ville` | `Building2` | — | unmapped (no filter) |
| `Combinées` | `combinées` | `Layers` | — | unmapped (no filter) |

All icons are `lucide-react` names — the same icon family used by the amenity
icon system (`resources/js/components/cards/AmenityIcons.tsx`). `Golf` is
rendered as `Flag` because lucide-react ships no Golf glyph.

## Observed catalog breakdown (raw)

Counts are per distinct provider theme across all staged hotels (both
`ListHotel` and `HotelDetail` payloads).

| Theme | Count |
|---|---|
| `Week-end` | 672 |
| `Tourisme` | 662 |
| `Famille` | 646 |
| `Affaires` | 598 |
| `Voyages de Noces` | 522 |
| `Charme` | 400 |
| `Promo` | 322 |
| `Découverte` | 308 |
| `Bien être` | 284 |
| `Sport & Loisirs` | 282 |
| `Réveillon` | 280 |
| `Balnéaire` | 180 |
| `Hôtel de Ville` | 76 |
| `Saharien` | 28 |
| `Randonnée` | 26 |
| `Thermalisme` | 10 |
| `Montagne` | 10 |
| `Thalassothérapie` | 8 |
| `Golf` | 8 |
| `Balnéothérapie` | 2 |
| `Combinées` | 2 |
| `Archéologie` | 2 |

## Gap analysis (before the fix)

The original `$themeMap` matched on **exact lowercased keys**, so any provider
label that was not literally one of the short keys (`affaires`, `business`,
`famille`, `family`, `voyages de noces`, `sport`, `loisirs`, `thalasso`, `spa`,
`nature`, `aventure`, `découverte`, `détente`, `charme`, `balnéaire`) fell
through and never set a filter column. That silently disabled filtering for a
large share of the catalog:

- `Sport & Loisirs` (282 hotels) — the `&` broke the `sport`/`loisirs` keys.
- `Thalassothérapie` (8), `Balnéothérapie` (2), `Thermalisme` (10),
  `Bien être` (284) — no `thalasso`/`spa` substring match.
- `Golf` (8) — no sport key.
- `Randonnée` (26), `Montagne` (10), `Saharien` (28), `Archéologie` (2) — no
  `nature`/`aventure`/`découverte` key.
- `Week-end` (672) — the most common theme, previously unfilterable.
- `Promo` (322) — never linked to the `tarifs_promo` filter.

`Promo` maps to `tarifs_promo` (the public "Promotional rates" filter) because
the provider uses it as a promotional-tariff marker.

## Keep in mind

- Re-publishing (or daily `HotelDetail` refresh via `refreshDetail`) re-derives
  the booleans from the raw payload and overwrites any manually-set values.
- `Tourisme`, `Réveillon`, `Hôtel de Ville`, `Combinées` intentionally map to
  nothing — no existing filter represents them. They remain visible in
  `hotels.tags` (searchable text) but do not toggle a filter checkbox.
- If the provider ever sends new theme labels, add them to `$themeMap` in
  `HotelPublisher::deriveFilterBooleans()` (lowercased + trimmed key) or they
  will not be filterable.