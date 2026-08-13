<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Amenity;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HotelController extends Controller
{
    use HandlesAdminMedia;

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

        return response()->json(Cache::remember(
            "hotels.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
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
            'price' => $item->price,
            'base_price' => $item->base_price,
            'markup_percentage' => $item->markup_percentage,
            'currency' => $item->currency,
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
            'whatsapp' => $details['whatsapp'] ?? '',
        ];
    }
}
