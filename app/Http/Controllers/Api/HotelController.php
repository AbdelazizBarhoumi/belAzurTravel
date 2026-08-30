<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\HotelPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

class HotelController extends Controller
{
    use HandlesAdminMedia;

    public function __construct(
        private readonly HotelPublisher $publisher,
    ) {}

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'hotels.index',
            now()->addMinutes(10),
            function () {
                $tomorrow = Carbon::tomorrow()->toDateString();

                return Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities', 'categoryAssignments.categoryType', 'categoryAssignments.categoryValue', 'dailyPrices' => fn ($q) => $q->where('date', $tomorrow)])->oldest('id')->get()->map(
                    fn (Hotel $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $tomorrow = Carbon::tomorrow()->toDateString();
        $item = Hotel::query()->with(['rooms.featureItems', 'rooms.imageItems', 'amenities', 'categoryAssignments.categoryType', 'categoryAssignments.categoryValue', 'dailyPrices' => fn ($q) => $q->where('date', $tomorrow)])->where('slug', $slug)->firstOrFail();

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
            function () use ($item) {
                $fresh = $item->fresh(['rooms.featureItems', 'rooms.imageItems', 'amenities', 'categoryAssignments.categoryType', 'categoryAssignments.categoryValue']);
                $tomorrow = Carbon::tomorrow()->toDateString();
                $fresh->load(['dailyPrices' => fn ($q) => $q->where('date', $tomorrow)]);

                return $this->payload($fresh);
            }
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

        if ($item->isProviderLinked()) {
            // Provider-linked hotels: use tomorrow's stored price if available,
            // otherwise fall back to null (live search will provide it).
            $dailyPrice = $item->dailyPrices->first();
            $price = $dailyPrice?->price ?? null;
            $basePrice = $dailyPrice?->base_price ?? null;
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
            'category_assignments' => collect($item->categoryAssignments ?? [])->groupBy(
                fn ($a) => $a->categoryType->key
            )->mapWithKeys(
                fn ($group, $key) => [$key => $group->pluck('categoryValue.key')->values()->toArray()]
            )->toArray(),
            'price' => $price,
            'base_price' => $basePrice,
            'markup_percentage' => $item->markup_percentage,
            'currency' => $item->currency,
            'source' => $item->source,
            'provider' => $item->isProviderLinked() ? 'ostravel' : 'manual',
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
            'short_description' => $details['short_description'] ?? null,
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
        ];
    }
}
