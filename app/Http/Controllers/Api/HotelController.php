<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\HotelPublisher;
use App\Services\OsTravel\OsTravelPriceCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HotelController extends Controller
{
    use HandlesAdminMedia;

    public function __construct(
        private readonly OsTravelPriceCalculator $calculator,
        private readonly HotelPublisher $publisher,
    ) {}

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'hotels.index',
            now()->addMinutes(10),
            function () {
                return Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities', 'categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])->oldest('id')->get()->map(
                    fn (Hotel $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities', 'categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])->where('slug', $slug)->firstOrFail();

        // Lazily refresh provider HotelDetail at most once per day: the first
        // visitor each day triggers a single-flight fetch; later visitors hit
        // the cached payload with no provider call. Manual hotels never refresh.
        if ($item->isProviderLinked()) {
            $staged = OsTravelHotel::query()
                ->whereNotNull('hotel_id')
                ->where('hotel_id', $item->id)
                ->first();

            if ($staged !== null) {
                $this->publisher->refreshDetail($staged);
            }
        }

        return response()->json(Cache::remember(
            "hotels.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item->fresh(['rooms.featureItems', 'rooms.imageItems', 'amenities', 'categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))
        ));
    }

    /** @return array<string, mixed> */
    private function payload(Hotel $item): array
    {
        $details = $item->details ?? [];
        $category = $item->category ?? $details['category'] ?? ['en' => '', 'fr' => '', 'ar' => ''];
        if (isset($details['gallery']) && is_array($details['gallery'])) {
            $details['gallery'] = array_map(fn ($img) => $this->normalizeApiOutputPath($img), $details['gallery']);
        }

        $markup = (float) ($item->markup_percentage ?? 0);
        if ($item->isProviderLinked()) {
            // Provider-linked hotels prefer the live per-night price. When the
            // browse refresh found no live 1-night availability we fall back to
            // the approved `base_price` (the same min price the admin sees) so
            // browse never hides a known price.
            $reference = $item->last_price ?? $item->base_price;
            $price = $reference !== null
                ? $this->calculator->applyMarkup($reference, $markup)
                : null;
            $basePrice = $reference;
        } else {
            $price = $item->price;
            $basePrice = $item->base_price;
        }

        return [
            'id' => $item->slug,
            'slug' => $item->slug,
            'destinationSlug' => $item->destination_slug,
            'name' => $item->name,
            'location' => $item->location,
            'category_key' => $item->category_key,
            'category' => $category,
            'category_assignments' => collect($item->categoryAssignments ?? [])->mapWithKeys(
                fn ($a) => [$a->categoryType->key => $a->categoryValue->key]
            )->toArray(),
            'price' => $price,
            'base_price' => $basePrice,
            'markup_percentage' => $item->markup_percentage,
            'currency' => $item->currency,
            'source' => $item->source,
            'provider' => $item->isProviderLinked() ? 'ostravel' : 'manual',
            'last_price' => $item->last_price,
            'last_price_at' => $item->last_price_at,
            'first_available_at' => $item->first_available_at?->toDateString(),
            'min_nights' => $item->min_nights,
            'stop_sale_ranges' => $item->stop_sale_ranges ?? [],
            'rating' => $item->rating,
            'stars' => $item->stars,
            'reviews' => $item->reviews,
            'image' => $this->normalizeApiOutputPath($item->image),
            'gallery' => $details['gallery'] ?? [],
            'amenities' => collect($item->amenities ?? [])->map(fn (Amenity $amenity) => [
                'name' => $amenity->name,
                'icon' => $amenity->icon,
            ])->values(),
            'tags' => $item->tags,
            // Filter fields
            'htel_recommande' => $item->htel_recommande,
            'tarifs_promo' => $item->tarifs_promo,
            'enfant_gratuit' => $item->enfant_gratuit,
            'disponible_seulement' => $item->disponible_seulement,
            'annulation_gratuite' => $item->annulation_gratuite,
            'logement_simple' => $item->logement_simple,
            'petit_dejeuner' => $item->petit_dejeuner,
            'demi_pension' => $item->demi_pension,
            'pension_complete' => $item->pension_complete,
            'categorie_4_etoiles' => $item->categorie_4_etoiles,
            'chambre_double' => $item->chambre_double,
            'suite' => $item->suite,
            'chambre_standard' => $item->chambre_standard,
            'suite_junior' => $item->suite_junior,
            'thalasso_spa' => $item->thalasso_spa,
            'nature_aventure' => $item->nature_aventure,
            'famille' => $item->famille,
            'affaires' => $item->affaires,
            'sport_loisir' => $item->sport_loisir,
            'detente' => $item->detente,
            'rooms' => collect($item->rooms ?? [])->map(fn ($room) => [
                'name' => is_object($room) ? [
                    'en' => $room->name_en ?? '',
                    'fr' => $room->name_fr ?? '',
                    'ar' => $room->name_ar ?? '',
                ] : ($room['name'] ?? []),
                'description' => is_object($room) ? [
                    'en' => $room->description_en ?? '',
                    'fr' => $room->description_fr ?? '',
                    'ar' => $room->description_ar ?? '',
                ] : ($room['description'] ?? []),
                'pricePerNight' => (float) (is_object($room) ? $room->price_per_night : ($room['price_per_night'] ?? 0)),
                'capacity' => (int) (is_object($room) ? $room->capacity : ($room['capacity'] ?? 0)),
                'size' => (float) (is_object($room) ? $room->size : ($room['size'] ?? 0)),
                'features' => is_object($room) ? $room->featureItems->pluck('label')->all() : ($room['features'] ?? []),
                'images' => is_object($room) ? array_map(fn ($img) => $this->normalizeApiOutputPath($img->path), $room->imageItems->all()) : (array) ($room['images'] ?? []),
            ])->values(),
            'city' => $details['city'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'country' => $details['country'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'description' => $details['description'] ?? ['en' => '', 'fr' => '', 'ar' => ''],
            'address' => $details['address'] ?? '',
            'phone' => $details['phone'] ?? '',
            'email' => $details['email'] ?? '',
            'whatsapp' => $details['whatsapp'] ?? '',
            'coordinates' => $details['coordinates'] ?? null,
            'check_in_time' => $details['check_in_time'] ?? '',
            'check_out_time' => $details['check_out_time'] ?? '',
            'hotel_type' => $details['hotel_type'] ?? '',
            'note' => $details['note'] ?? '',
            'options' => $details['options'] ?? [],
            'boardings' => $details['boardings'] ?? [],
            'facilities' => $details['facilities'] ?? [],
            'amenity_tags' => $details['amenity_tags'] ?? [],
            // Browse catalog captured during the price refresh: rooms, boardings
            // and hotel promo metadata rendered with no live call.
            'rooms_catalog' => $details['catalog']['rooms'] ?? [],
            'promotion' => $details['catalog']['promotion'] ?? null,
            'free_child' => $details['catalog']['free_child'] ?? [],
            'recommended' => (bool) ($details['catalog']['recommended'] ?? false),
        ];
    }
}
