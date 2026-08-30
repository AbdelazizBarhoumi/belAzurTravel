<?php

namespace App\Services\OsTravel;

use App\Models\CategoryType;
use App\Models\EntityCategoryAssignment;
use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Models\User;
use App\Support\CityNames;
use App\Support\CountryNames;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * Turns a staged OS-TRAVEL hotel into a confirmed `hotels` row.
 *
 * Applies the configured markup to compute the public price, produces a
 * collision-safe slug, downloads and deduplicates provider images behind an
 * SSRF guard into local storage, and wires the staging row to the published
 * hotel. The catalog sync stores the search-result image locally in advance
 * (`storeProviderImage`); publish reuses that copy instead of downloading it
 * again, and `refreshDetail` refreshes details and the main photo on each
 * hotel's first daily visit.
 */
class HotelPublisher
{
    public function __construct(private readonly OsTravelClient $client) {}

    /**
     * Publish a staged hotel. `$overrides` may carry `markup_percentage` and
     * `currency`. Provider hotels carry no stored price: their public price is
     * always computed live from `HotelSearch`, so nothing is persisted here.
     *
     * @param  array{markup_percentage?: int|float|string, currency?: string}  $overrides
     */
    public function publish(OsTravelHotel $staged, array $overrides = [], ?User $actor = null): Hotel
    {
        $markupPercentage = (float) ($overrides['markup_percentage'] ?? $staged->markup_percentage ?? config('ostravel.markup.default', 20));
        $currency = (string) ($overrides['currency'] ?? $staged->currency ?? config('ostravel.currency.default', 'TND'));

        $staged->fill([
            'markup_percentage' => $markupPercentage,
            'currency' => $currency,
        ])->save();

        $list = $staged->payload['ListHotel'] ?? [];
        $detail = $staged->payload['HotelDetail'] ?? [];
        $externalId = (string) $staged->external_id;
        $code = 'ostravel-'.$externalId;

        $existing = Hotel::query()->where('code', $code)->first();

        $name = $this->localized(self::cleanText($list['Name'] ?? $detail['Name'] ?? ''));
        $cityName = self::cleanText($list['City']['Name'] ?? $detail['City']['Name'] ?? '');
        $city = CityNames::normalize(['en' => $cityName, 'fr' => $cityName, 'ar' => $cityName])
            ?? $this->localized($cityName);
        $countryName = self::cleanText($this->countryName($list, $detail));
        $country = CountryNames::normalize(['en' => $countryName, 'fr' => $countryName, 'ar' => $countryName])
            ?? $this->localized($countryName);
        $categoryTitle = self::cleanText($list['Category']['Title'] ?? $detail['Category']['Title'] ?? '');
        $stars = $list['Category']['Star'] ?? $detail['Category']['Star'] ?? 0;

        $imageUrl = $list['Image'] ?? $detail['Image'] ?? null;
        // Always store the provider photo locally so the public site never
        // fetches images from the provider at view time. When the catalog sync
        // already downloaded this exact URL, reuse that copy instead of hitting
        // the provider again.
        $image = $imageUrl !== null && $imageUrl !== ''
            && $staged->image_source === $imageUrl
            && $staged->image !== null
            && str_starts_with($staged->image, '/storage/')
                ? $staged->image
                : $this->syncImage($imageUrl, $existing?->image, $existing?->meta['image_hash'] ?? null);

        $slug = $this->resolveSlug($existing, $name['en'] ?? 'hotel', $externalId, $code);

        $meta = $existing?->meta ?? [];
        if ($imageUrl !== null && $imageUrl !== '') {
            $meta['image_hash'] = sha1($imageUrl);
        }

        $mapped = $this->mapDetails($list, $detail, $existing, $externalId);

        $previous = [
            $existing?->image,
            ...($existing?->details['gallery'] ?? []),
        ];

        $hotel = Hotel::updateOrCreate(['code' => $code], array_merge([
            'slug' => $slug,
            'code' => $code,
            'destination_slug' => $existing?->destination_slug,
            'name' => $name,
            'location' => $city,
            'category_key' => $existing?->category_key,
            'category' => $this->localized($categoryTitle),
            'markup_percentage' => $markupPercentage,
            'currency' => $currency,
            'source' => 'ostravel',
            'booking_mode' => 'instant',
            'rating' => (float) ($list['Rating'] ?? $detail['Rating'] ?? 0),
            'stars' => (int) $stars,
            'reviews' => (int) ($list['Reviews'] ?? $detail['Reviews'] ?? 0),
            'image' => $image,
            'tags' => $mapped['themes'],
            'details' => $mapped['details'],
            'meta' => $meta,
        ], $mapped['filter_booleans']));

        // Assign pricing_type category based on the hotel's boarding codes.
        $this->assignPricingType($hotel, $detail['Boarding'] ?? []);

        // Assign feature tags (animation, thalasso, etc.) for the sidebar filter.
        $this->assignFeatures($hotel);

        // `hotel_id` is unique on `os_travel_hotels`, so a published `hotels`
        // row can be wired to exactly one staging row. When the database holds
        // duplicate staging rows for the same external hotel (e.g. produced by
        // an older sync), the later publish would collide with that unique
        // index and abort the whole bulk approval. Retire the redundant row
        // instead: the canonical row already owns this hotel.
        $currentOwner = OsTravelHotel::query()
            ->where('hotel_id', $hotel->id)
            ->where('id', '!=', $staged->id)
            ->first();

        if ($currentOwner !== null && (string) $currentOwner->external_id === $externalId) {
            $staged->delete();

            return $hotel;
        }

        $staged->fill([
            'hotel_id' => $hotel->id,
            'status' => OsTravelHotel::APPROVED,
            'approved_by' => $actor?->id,
            'approved_at' => now(),
        ])->save();

        $this->flushAdminCache('hotels', $slug);

        // The new image/gallery replaced the previous ones; the DB no longer
        // references the old files, so they can be deleted immediately instead
        // of accumulating as orphans.
        $this->deleteReplacedLocalImages($previous, array_merge([$image], $mapped['details']['gallery']));

        return $hotel;
    }

    /**
     * Refresh a staged hotel's HotelDetail from the provider, at most once per
     * day. Safe for concurrent requests (single-flight lock); the first visitor
     * each day triggers the fetch, updates the published `hotels` row (details,
     * filter booleans and the main photo, stored locally), and later visitors
     * reuse the stored data. Provider failures keep existing data and leave
     * `detail_fetched_at` untouched so the next click retries.
     */
    public function refreshDetail(OsTravelHotel $staged): void
    {
        $externalId = (string) $staged->external_id;
        $lock = Cache::lock("ostravel.detail.{$externalId}", 30);

        if (! $lock->get()) {
            return;
        }

        try {
            $staged->refresh();

            if ($staged->detail_fetched_at !== null && $staged->detail_fetched_at->isToday()) {
                return;
            }

            $detail = $this->client->hotelDetail($externalId)['HotelDetail'] ?? [];

            $staged->fill([
                'payload' => array_merge($staged->payload ?? [], ['HotelDetail' => $detail]),
                'detail_fetched_at' => now(),
            ])->save();

            if ($staged->hotel_id !== null) {
                $hotel = Hotel::query()->where('id', $staged->hotel_id)->first();

                if ($hotel !== null) {
                    $list = $staged->payload['ListHotel'] ?? [];
                    $previousImage = $hotel->image;
                    $previousGallery = $hotel->details['gallery'] ?? [];
                    $mapped = $this->mapDetails($list, $detail, $hotel, $externalId);

                    // Refresh the main photo on first visit: download only when
                    // the provider URL changed (converting any legacy proxy URL
                    // to a local file on the way).
                    $meta = $hotel->meta ?? [];
                    $imageUrl = $list['Image'] ?? $detail['Image'] ?? null;
                    $image = $this->syncImage($imageUrl, $hotel->image, $meta['image_hash'] ?? null);

                    if ($imageUrl !== null && $imageUrl !== '') {
                        $meta['image_hash'] = sha1($imageUrl);
                    }

                    $imageChanged = $image !== $previousImage;

                    $hotel->forceFill(array_merge([
                        'image' => $image,
                        'tags' => $mapped['themes'],
                        'details' => $mapped['details'],
                        'meta' => $meta,
                    ], $mapped['filter_booleans']))->save();

                    // Re-assign pricing_type so boarding-code changes are
                    // reflected in the category filter sidebar daily.
                    $this->assignPricingType($hotel, $detail['Boarding'] ?? []);

                    // Re-assign features from tags.
                    $this->assignFeatures($hotel);

                    // The refreshed main image/gallery may have replaced
                    // previously downloaded files; remove the ones no longer
                    // referenced.
                    $this->deleteReplacedLocalImages(
                        array_merge([$previousImage], $previousGallery),
                        array_merge([$image], $mapped['details']['gallery'] ?? [])
                    );

                    $this->flushAdminCache('hotels', $hotel->slug);
                    Cache::forget("hotels.{$hotel->slug}");

                    // Card thumbnails come from the cached index.
                    if ($imageChanged) {
                        Cache::forget('hotels.index');
                    }
                }
            }
        } catch (Throwable $e) {
            Log::warning('OS-TRAVEL detail refresh failed; keeping existing data.', [
                'external_id' => $externalId,
                'error' => $e->getMessage(),
            ]);
        } finally {
            $lock->release();
        }
    }

    /**
     * Build the published `details`/`tags`/filter booleans shared by publish()
     * and refreshDetail() so both stay in sync.
     *
     * @param  array<string, mixed>  $list  Raw ListHotel item.
     * @param  array<string, mixed>  $detail  Raw HotelDetail item.
     * @return array{details: array<string, mixed>, themes: list<string>, filter_booleans: array<string, bool>}
     */
    protected function mapDetails(array $list, array $detail, ?Hotel $existing, string $externalId): array
    {
        $details = $existing?->details ?? [];

        $cityName = self::cleanText($list['City']['Name'] ?? $detail['City']['Name'] ?? '');
        $countryName = self::cleanText($this->countryName($list, $detail));

        [$gallery, $gallerySources] = $this->resolveGallery(
            $detail['Album'] ?? [],
            $details['gallery_sources'] ?? null,
            $details['gallery'] ?? [],
        );

        $details = array_merge($details, [
            'address' => self::cleanText($detail['Adress'] ?? $list['Adress'] ?? $details['address'] ?? ''),
            'phone' => self::cleanText($detail['Phone'] ?? $details['phone'] ?? ''),
            'email' => self::cleanText($detail['Email'] ?? $details['email'] ?? ''),
            'whatsapp' => $details['whatsapp'] ?? '',
            'coordinates' => $this->coordinates($list, $detail) ?? $details['coordinates'] ?? null,
            'check_in_time' => self::cleanText($detail['CheckIn'] ?? $details['check_in_time'] ?? ''),
            'check_out_time' => self::cleanText($detail['CheckOut'] ?? $details['check_out_time'] ?? ''),
            'hotel_type' => self::cleanText($detail['Type'] ?? $details['hotel_type'] ?? ''),
            'note' => self::htmlToText($detail['Note'] ?? $list['Note'] ?? $details['note'] ?? ''),
            'options' => $this->normalizeOptions($detail['Option'] ?? $details['options'] ?? []),
            'boardings' => $this->normalizeBoardings($detail['Boarding'] ?? []),
            'facilities' => $this->normalizeFacilities($detail['Facilitie'] ?? $list['Facilities'] ?? $details['facilities'] ?? []),
            'amenity_tags' => $this->normalizeAmenityTags($detail['Tag'] ?? $details['amenity_tags'] ?? []),
            'short_description' => $this->shortDescription($detail),
            'description' => $this->localized(self::htmlToText($detail['LongDescription'] ?? '')),
            'city' => CityNames::normalize(['en' => $cityName, 'fr' => $cityName, 'ar' => $cityName])
                ?? $this->localized($cityName),
            'country' => CountryNames::normalize(['en' => $countryName, 'fr' => $countryName, 'ar' => $countryName])
                ?? $this->localized($countryName),
            'source' => 'ostravel',
            'provider_hotel_id' => $externalId,
            'gallery' => $gallery,
            'gallery_sources' => $gallerySources,
        ]);

        $themes = $this->themes($list, $detail);

        return [
            'details' => $details,
            'themes' => $themes,
            'filter_booleans' => $this->deriveFilterBooleans($list, $detail, $themes),
        ];
    }

    /**
     * Re-download the gallery only when the provider's Album URLs changed;
     * otherwise reuse the already-downloaded local paths. Provider photos are
     * always stored locally — never kept as remote/proxy URLs.
     *
     * @param  list<array{Url?: string}>  $album
     * @param  list<string>|null  $existingSources
     * @param  list<string>  $existingGallery
     * @return array{0: list<string>, 1: list<string>} [stored paths, source URLs]
     */
    protected function resolveGallery(array $album, ?array $existingSources, array $existingGallery): array
    {
        $sources = array_values(array_filter(array_map(
            fn ($item) => is_array($item) ? (string) ($item['Url'] ?? '') : '',
            $album
        )));

        if ($existingSources !== null && $existingSources === $sources && $sources !== []) {
            return [$existingGallery, $sources];
        }

        return [$this->syncGallery($album), $sources];
    }

    protected function countryName(array $list, array $detail): string
    {
        $country = $list['City']['Country'] ?? $detail['City']['Country'] ?? '';

        return is_array($country) ? ($country['Name'] ?? '') : (string) $country;
    }

    /**
     * Normalize `Localization` into `{latitude, longitude}` floats, or null
     * when the provider didn't report coordinates.
     *
     * @return array{latitude: float, longitude: float}|null
     */
    protected function coordinates(array $list, array $detail): ?array
    {
        $localization = $list['Localization'] ?? $detail['Localization'] ?? null;
        if (! is_array($localization)) {
            return null;
        }

        $latitude = $localization['Latitude'] ?? null;
        $longitude = $localization['Longitude'] ?? null;

        if ($latitude === null || $longitude === null || ! is_numeric($latitude) || ! is_numeric($longitude)) {
            return null;
        }

        return ['latitude' => (float) $latitude, 'longitude' => (float) $longitude];
    }

    /**
     * @param  list<array{Id?: int, Title?: string}>  $options
     * @return list<array{id: int, title: string}>
     */
    protected function normalizeOptions(array $options): array
    {
        $normalized = [];

        foreach ($options as $option) {
            if (! is_array($option)) {
                continue;
            }

            $normalized[] = [
                'id' => (int) ($option['Id'] ?? 0),
                'title' => self::cleanText((string) ($option['Title'] ?? '')),
            ];
        }

        return $normalized;
    }

    /**
     * @param  list<array{Id?: int, Code?: string, Name?: string, Description?: string|null}>  $boardings
     * @return list<array{id: int, code: string, name: string, description: string}>
     */
    protected function normalizeBoardings(array $boardings): array
    {
        $normalized = [];

        foreach ($boardings as $boarding) {
            if (! is_array($boarding)) {
                continue;
            }

            $normalized[] = [
                'id' => (int) ($boarding['Id'] ?? 0),
                'code' => (string) ($boarding['Code'] ?? ''),
                'name' => self::cleanText((string) ($boarding['Name'] ?? '')),
                'description' => self::cleanText((string) ($boarding['Description'] ?? '')),
            ];
        }

        return $normalized;
    }

    /**
     * The provider uses `Facilitie` (singular, detail) and `Facilities`
     * (plural, list). Normalize either into `{title, category}`.
     *
     * @param  list<array{Title?: string, Category?: string}>  $facilities
     * @return list<array{title: string, category: string}>
     */
    protected function normalizeFacilities(array $facilities): array
    {
        $normalized = [];

        foreach ($facilities as $facility) {
            if (! is_array($facility)) {
                continue;
            }

            $normalized[] = [
                'title' => self::cleanText((string) ($facility['Title'] ?? '')),
                'category' => self::cleanText((string) ($facility['Category'] ?? '')),
            ];
        }

        return $normalized;
    }

    /**
     * Normalize the detail's `Tag[]` amenities into `{id, title, image}`,
     * resolving relative image paths against the provider base URL.
     *
     * @param  list<array{Id?: int, Title?: string, Image?: string}>  $tags
     * @return list<array{id: int, title: string, image: string}>
     */
    public function normalizeAmenityTags(array $tags): array
    {
        $normalized = [];

        foreach ($tags as $tag) {
            if (! is_array($tag)) {
                continue;
            }

            $normalized[] = [
                'id' => (int) ($tag['Id'] ?? 0),
                'title' => self::cleanText((string) ($tag['Title'] ?? '')),
                'image' => $this->resolveProviderUrl((string) ($tag['Image'] ?? '')),
            ];
        }

        return $normalized;
    }

    /**
     * Resolve a provider-relative URL (e.g. `uploads/...`) against the base
     * URL, leaving absolute URLs untouched. Empty paths resolve to ''.
     */
    protected function resolveProviderUrl(string $path): string
    {
        $path = trim($path);

        if ($path === '' || preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return rtrim(config('ostravel.base_url'), '/').'/'.ltrim($path, '/');
    }

    /**
     * Resolve the hotel's theme tags, preferring ListHotel (richer) but
     * falling back to HotelDetail when the list item has none.
     *
     * @param  array<string, mixed>  $list
     * @param  array<string, mixed>  $detail
     * @return list<string>
     */
    protected function themes(array $list, array $detail): array
    {
        $themes = $this->cleanThemes($list['Theme'] ?? []);

        if ($themes !== []) {
            return $themes;
        }

        return $this->cleanThemes($detail['Theme'] ?? []);
    }

    /**
     * Normalize a provider `Theme` list: coerce values to strings, trim
     * whitespace (fixtures carry trailing spaces e.g. "Réveillon "), and drop
     * empties.
     *
     * @param  mixed  $themes  Raw provider `Theme` value.
     * @return list<string>
     */
    protected function cleanThemes(mixed $themes): array
    {
        $themes = is_array($themes) ? $themes : [];

        return array_values(array_filter(array_map(
            static fn ($theme) => trim((string) $theme),
            $themes
        )));
    }

    /**
     * Derive the existing `hotels` boolean filter columns from provider data so
     * the public filter UI works for OS-TRAVEL hotels without manual entry.
     *
     * @param  array<string, mixed>  $list  Raw ListHotel item.
     * @param  array<string, mixed>  $detail  Raw HotelDetail item.
     * @param  list<string>  $themes  Resolved theme tags.
     * @return array<string, bool>
     */
    protected function deriveFilterBooleans(array $list, array $detail, array $themes): array
    {
        $themes = array_map(fn ($theme) => trim(strtolower((string) $theme)), $themes);

        $boardingCodes = array_map(
            fn ($boarding) => strtoupper((string) ($boarding['Code'] ?? '')),
            $detail['Boarding'] ?? []
        );

        $stars = (int) ($list['Category']['Star'] ?? $detail['Category']['Star'] ?? 0);

        $themeMap = [
            // Business
            'affaires' => 'affaires',
            'business' => 'affaires',
            // Family
            'famille' => 'famille',
            'family' => 'famille',
            'voyages de noces' => 'famille',
            // Sports & leisure
            'sport' => 'sport_loisir',
            'loisirs' => 'sport_loisir',
            'sport & loisirs' => 'sport_loisir',
            'golf' => 'sport_loisir',
            // Thalasso / spa / wellness
            'thalasso' => 'thalasso_spa',
            'spa' => 'thalasso_spa',
            'thalassothérapie' => 'thalasso_spa',
            'balnéothérapie' => 'thalasso_spa',
            'thermalisme' => 'thalasso_spa',
            'bien être' => 'thalasso_spa',
            // Nature & adventure
            'nature' => 'nature_aventure',
            'aventure' => 'nature_aventure',
            'découverte' => 'nature_aventure',
            'randonnée' => 'nature_aventure',
            'montagne' => 'nature_aventure',
            'saharien' => 'nature_aventure',
            'archéologie' => 'nature_aventure',
            // Relaxation / charm / seaside / short break
            'détente' => 'detente',
            'charme' => 'detente',
            'balnéaire' => 'detente',
            'week-end' => 'detente',
            // Promotional tariffs
            'promo' => 'tarifs_promo',
        ];

        $themeFlags = [];
        foreach ($themes as $theme) {
            $target = $themeMap[$theme] ?? null;
            if ($target !== null) {
                $themeFlags[$target] = true;
            }
        }

        $boardings = [
            'logement_simple' => in_array('LS', $boardingCodes, true),
            'petit_dejeuner' => in_array('LPD', $boardingCodes, true),
            'demi_pension' => in_array('DP', $boardingCodes, true),
            'pension_complete' => in_array('PC', $boardingCodes, true),
        ];

        // Every boolean filter column gets an explicit value so the public
        // filter UI never sees nulls for provider hotels.
        return array_merge([
            'htel_recommande' => false,
            'tarifs_promo' => false,
            'enfant_gratuit' => false,
            'disponible_seulement' => false,
            'annulation_gratuite' => false,
            'logement_simple' => false,
            'petit_dejeuner' => false,
            'demi_pension' => false,
            'pension_complete' => false,
            'categorie_4_etoiles' => $stars >= 4,
            'chambre_double' => false,
            'suite' => false,
            'chambre_standard' => false,
            'suite_junior' => false,
            'thalasso_spa' => false,
            'nature_aventure' => false,
            'famille' => false,
            'affaires' => false,
            'sport_loisir' => false,
            'detente' => false,
        ], $boardings, $themeFlags);
    }

    /**
     * Create EntityCategoryAssignment records for pricing_type based on the
     * hotel's boarding codes from the provider.
     *
     * @param  list<array{Code?: string}>  $boardings
     */
    public function assignPricingType(Hotel $hotel, array $boardings): void
    {
        $type = CategoryType::where('entity_type', 'hotels')
            ->where('key', 'pricing_type')
            ->first();

        if (! $type) {
            return;
        }

        $boardingCodes = array_map(
            fn ($b) => strtoupper((string) ($b['Code'] ?? '')),
            $boardings,
        );

        // Map provider boarding codes to pricing_type value keys.
        $codeToPricingKey = [
            // Core types
            'LS'  => 'room-only',
            'LPD' => 'bed-breakfast',
            'LPD+'=> 'bed-breakfast',
            'LB'  => 'bed-breakfast',
            'DP'  => 'half-board',
            'DP+' => 'half-board-plus',
            'DPP' => 'half-board-plus',
            '50'  => 'half-board-plus',
            'PC'  => 'full-board',
            'PC+' => 'full-board-plus',
            'PCP' => 'full-board-plus',
            'ALL' => 'all-inclusive',
            'Al +' => 'all-inclusive',
            'SALL'=> 'soft-all-inclusive',
            'ALLS+'=> 'soft-all-inclusive',
            'UA'  => 'ultra-all-inclusive',
            'UAI' => 'ultra-all-inclusive',
            'UAIS'=> 'ultra-all-inclusive-soft',
            'ALS' => 'ultra-all-inclusive-soft',
            'UASD'=> 'ultra-ai-soft-drink',
            'ETS' => 'entry-only',
            'DU'  => 'day-use',
            // Special event / zone codes → map to base type
            'ArXML'=> 'room-only',
            'ZA'  => 'room-only',
            'ZB'  => 'room-only',
            'ZC'  => 'room-only',
            'ZD'  => 'room-only',
            'ZVIP'=> 'room-only',
            'DP31'=> 'half-board',
            'PC+31'=> 'full-board',
            'AS'  => 'half-board',
            'P+'  => 'full-board-plus',
            'A22' => 'soft-all-inclusive',
            'STVD'=> 'half-board',
            'STVAI'=> 'soft-all-inclusive',
            'STVA'=> 'all-inclusive',
            // Legacy codes
            'AI'  => 'all-inclusive',
            'HB'  => 'half-board',
            'BB'  => 'bed-breakfast',
            'RO'  => 'room-only',
        ];

        $pricingKeys = array_unique(array_filter(array_map(
            fn ($code) => $codeToPricingKey[$code] ?? null,
            $boardingCodes,
        )));

        // Delete old pricing_type assignments for this hotel before inserting
        // new ones. This ensures removed boarding codes are reflected and
        // prevents the old updateOrCreate from overwriting (unique constraint
        // on entity_type+entity_id+category_type_id kept only one row).
        EntityCategoryAssignment::where('entity_type', 'hotels')
            ->where('entity_id', $hotel->id)
            ->where('category_type_id', $type->id)
            ->delete();

        foreach ($pricingKeys as $key) {
            $value = $type->values()->where('key', $key)->first();
            if (! $value) {
                continue;
            }

            EntityCategoryAssignment::create([
                'entity_type' => 'hotels',
                'entity_id' => $hotel->id,
                'category_type_id' => $type->id,
                'category_value_id' => $value->id,
            ]);
        }

        Cache::forget('hotels.index');
    }

    /**
     * Assign "features" category values from the hotel's amenity tags.
     *
     * Tags come from the provider's HotelDetail Tag[] field and are stored
     * in hotel.details.amenity_tags as {id, title, image}. This method maps
     * tag titles to category_value keys and writes entity_category_assignments.
     */
    public function assignFeatures(Hotel $hotel): void
    {
        $type = CategoryType::where('entity_type', 'hotels')
            ->where('key', 'features')
            ->first();

        if (! $type) {
            return;
        }

        $tags = $hotel->details['amenity_tags'] ?? [];

        // Map provider tag titles → category_value keys.
        $tagToFeatureKey = [
            'Pieds dans l\'eau'    => 'pied-dans-leau',
            'Animation'            => 'animation',
            'Couple & Famille seulement' => 'couple-famille',
            'Bon rapport qualité prix' => 'bon-rapport',
            'Burkini autorisé'     => 'burkini-autorise',
            'Wifi gratuit'         => 'wifi-gratuit',
            'Burkini non autorisé' => 'burkini-non-autorise',
            'Toboggan'             => 'toboggan',
            'Luxe et calme'        => 'luxe-calme',
            'Vue sur la ville'     => 'vue-ville',
            'Aire de jeux pour enfants' => 'aire-jeux',
            'Plage privé'          => 'plage-privee',
            'En face de la mer'    => 'en-face-mer',
            'Centre Thalasso'      => 'centre-thalasso',
            'terrain football'     => 'terrain-football',
            'Emplacement stratégique' => 'emplacement',
            'Court de tennis'      => 'court-tennis',
            'Congress center'      => 'congress',
            'Padel'                => 'padel',
        ];

        $featureKeys = [];
        foreach ($tags as $tag) {
            $title = trim((string) ($tag['title'] ?? ''));
            if (isset($tagToFeatureKey[$title])) {
                $featureKeys[] = $tagToFeatureKey[$title];
            }
        }

        $featureKeys = array_unique($featureKeys);

        EntityCategoryAssignment::where('entity_type', 'hotels')
            ->where('entity_id', $hotel->id)
            ->where('category_type_id', $type->id)
            ->delete();

        foreach ($featureKeys as $key) {
            $value = $type->values()->where('key', $key)->first();
            if (! $value) {
                continue;
            }

            EntityCategoryAssignment::create([
                'entity_type' => 'hotels',
                'entity_id' => $hotel->id,
                'category_type_id' => $type->id,
                'category_value_id' => $value->id,
            ]);
        }
    }

    protected function localized(string $value): array
    {
        return ['en' => $value, 'fr' => $value, 'ar' => $value];
    }

    protected function stripHtml(string $html): string
    {
        return trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    /**
     * Decode HTML entities and strip tags from a provider text field,
     * collapsing whitespace onto a single line.
     */
    public static function cleanText(string $text): string
    {
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim((string) preg_replace('/\s+/u', ' ', $text));
    }

    /**
     * Convert provider HTML (e.g. LongDescription with <p> blocks) to plain
     * text, preserving paragraph and line breaks for frontend rendering.
     */
    public static function htmlToText(string $html): string
    {
        $text = (string) preg_replace(
            ['#<\s*br\s*/?\s*>#i', '#</\s*(?:p|div|li|h[1-6])\s*>#i'],
            "\n",
            $html
        );
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = (string) preg_replace("/\n{3,}/", "\n\n", $text);

        return trim($text);
    }

    /**
     * Extract the provider short description (HTML) and convert to plain text.
     */
    private function shortDescription(array $detail): ?string
    {
        $raw = $detail['LongDescription'] ?? $detail['ShortDescription'] ?? $detail['HotelDescription'] ?? null;

        if ($raw === null || (string) $raw === '') {
            return null;
        }

        $text = self::htmlToText((string) $raw);
        $text = implode("\n", array_map('trim', explode("\n", $text)));

        return $text === '' ? null : $text;
    }

    protected function resolveSlug(?Hotel $existing, string $name, string $externalId, string $code): string
    {
        if ($existing !== null && $existing->slug !== null && $existing->slug !== '') {
            return $existing->slug;
        }

        $base = Str::slug($name) ?: 'hotel';
        $slug = $base;

        if (Hotel::query()->where('slug', $slug)->where('code', '!=', $code)->exists()) {
            $slug = $base.'-'.$externalId;
        }

        return $slug;
    }

    /**
     * Download and store the provider image when its URL hash changed. Falls
     * back to the existing local file, then to the remote URL on failure, and
     * refuses to fetch private/loopback/link-local hosts.
     */
    protected function syncImage(?string $url, ?string $existingImage, ?string $existingHash): ?string
    {
        if ($url === null || $url === '') {
            return $existingImage;
        }

        $hash = sha1($url);

        if ($hash === $existingHash && $existingImage !== null && $existingImage !== '' && str_starts_with($existingImage, '/storage/')) {
            return $existingImage;
        }

        return $this->storeProviderImage($url) ?: ($existingImage ?: $url);
    }

    /**
     * Download a provider image into local storage behind the SSRF guard.
     * Returns the stored `/storage/...` path, or null when the URL is rejected
     * or the download fails (the caller decides what to keep).
     */
    public function storeProviderImage(string $url): ?string
    {
        if ($url === '' || ! $this->isSafeImageUrl($url)) {
            Log::warning('OS-TRAVEL image URL rejected by SSRF guard; not storing.', ['url' => $url]);

            return null;
        }

        try {
            $response = Http::timeout(30)->get($url);
            if ($response->ok()) {
                return $this->storeImage($response->body(), $this->extensionFromUrl($url));
            }
        } catch (Throwable $e) {
            Log::warning('OS-TRAVEL image download failed; not storing.', ['url' => $url, 'error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * @param  list<array{Url?: string}>  $album
     * @return list<string>
     */
    protected function syncGallery(array $album): array
    {
        $downloaded = [];

        foreach ($album as $item) {
            $url = $item['Url'] ?? null;
            if ($url === null || $url === '') {
                continue;
            }

            $path = $this->storeProviderImage($url);

            $downloaded[] = $path ?? $url;
        }

        return array_values(array_unique($downloaded));
    }

    protected function storeImage(string $contents, string $extension): string
    {
        $folder = 'uploads/hotels';
        File::ensureDirectoryExists(storage_path("app/public/{$folder}"));
        $filename = Str::lower(Str::random(32)).'.'.$extension;
        Storage::disk('public')->put("{$folder}/{$filename}", $contents);

        return "/storage/{$folder}/{$filename}";
    }

    /**
     * Delete local hotel image files that were replaced by a re-publish or a
     * detail refresh. Values in `$current` (the files the hotel references
     * now) are never touched, and remote/proxy URLs are not candidates.
     *
     * @param  list<mixed>  $previous  Previously referenced image values.
     * @param  list<mixed>  $current  Currently referenced image values.
     */
    protected function deleteReplacedLocalImages(array $previous, array $current): void
    {
        $current = array_flip(array_values(array_filter(array_map(
            fn (mixed $value) => is_string($value) ? $value : '',
            $current
        ))));

        foreach ($previous as $path) {
            if (! is_string($path) || $path === '' || isset($current[$path])) {
                continue;
            }

            $this->deleteLocalImage($path);
        }
    }

    /**
     * Delete a single stored hotel image file when it is a local
     * `/storage/uploads/hotels/*` upload (only top-level files, never the
     * `rooms/` subfolder, never remote/proxy URLs).
     */
    protected function deleteLocalImage(?string $path): void
    {
        if ($path === null || ! preg_match('#^/storage/uploads/hotels/[^/]+\.(?:jpg|jpeg|png|webp|gif)$#i', $path)) {
            return;
        }

        $relative = substr($path, strlen('/storage/'));

        if (Storage::disk('public')->exists($relative)) {
            Storage::disk('public')->delete($relative);
        }
    }

    protected function extensionFromUrl(string $url): string
    {
        $extension = pathinfo(parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION);

        return in_array(strtolower($extension), ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)
            ? strtolower($extension)
            : 'jpg';
    }

    /**
     * Basic SSRF guard: scheme must be http/https and the resolved host must
     * not be a private, loopback, or link-local address.
     */
    protected function isSafeImageUrl(string $url): bool
    {
        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            return false;
        }

        if (! in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower($parts['host']);
        $ip = filter_var($host, FILTER_VALIDATE_IP);

        if ($ip === false) {
            $resolved = gethostbyname($host);
            if ($resolved === $host || filter_var($resolved, FILTER_VALIDATE_IP) === false) {
                return false;
            }
            $ip = $resolved;
        }

        return ! $this->isPrivateAddress($ip);
    }

    protected function isPrivateAddress(string $ip): bool
    {
        $ip = strtolower(trim($ip));

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $long = ip2long($ip);
            if ($long === false) {
                return true;
            }

            $ranges = [
                ['0.0.0.0', 8],
                ['10.0.0.0', 8],
                ['100.64.0.0', 10],
                ['127.0.0.0', 8],
                ['169.254.0.0', 16],
                ['172.16.0.0', 12],
                ['192.0.0.0', 24],
                ['192.168.0.0', 16],
                ['198.18.0.0', 15],
            ];

            foreach ($ranges as [$network, $prefix]) {
                $mask = ($prefix === 0) ? 0 : (-1 << (32 - $prefix)) & 0xFFFFFFFF;
                if (($long & $mask) === (ip2long($network) & $mask)) {
                    return true;
                }
            }

            return false;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            return $ip === '::1'
                || $ip === '::'
                || str_starts_with($ip, 'fc') || str_starts_with($ip, 'fd')
                || str_starts_with($ip, 'fe8') || str_starts_with($ip, 'fe9')
                || str_starts_with($ip, 'fea') || str_starts_with($ip, 'feb');
        }

        return true;
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("entity.{$type}.index");
        Cache::forget("{$type}.index");
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
            Cache::forget("{$type}.{$identifier}");
        }
    }
}
