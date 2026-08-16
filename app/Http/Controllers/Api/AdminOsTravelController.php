<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OsTravelHotel;
use App\Models\OsTravelReference;
use App\Models\OsTravelSync;
use App\Services\OsTravel\HotelPublisher;
use App\Services\OsTravel\OsTravelPriceCalculator;
use App\Services\OsTravel\OsTravelSearchService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Admin-only endpoints to review and approve the OS-TRAVEL staging catalog.
 *
 * Approval publishes a staged hotel via HotelPublisher into the `hotels`
 * table; pre-filling a price (PUT) only persists onto the staging row.
 */
class AdminOsTravelController extends Controller
{
    public function __construct(
        private HotelPublisher $publisher,
        private OsTravelSearchService $searchService,
        private OsTravelPriceCalculator $calculator,
    ) {}

    public function dashboard(): JsonResponse
    {
        $lastSync = OsTravelSync::query()->latest('id')->first();

        return response()->json([
            'data' => [
                'last_sync' => $lastSync ? [
                    'id' => (string) $lastSync->id,
                    'batch' => $lastSync->batch,
                    'status' => $lastSync->status,
                    'started_at' => $lastSync->started_at,
                    'finished_at' => $lastSync->finished_at,
                    'error' => $lastSync->error,
                    'countries_count' => $lastSync->countries_count,
                    'cities_count' => $lastSync->cities_count,
                    'hotels_count' => $lastSync->hotels_count,
                    'details_count' => $lastSync->details_count,
                    'orphaned_count' => $lastSync->orphaned_count,
                    'reactivated_count' => $lastSync->reactivated_count,
                ] : null,
                'counts' => [
                    OsTravelHotel::PENDING => OsTravelHotel::query()->where('status', OsTravelHotel::PENDING)->count(),
                    OsTravelHotel::APPROVED => OsTravelHotel::query()->where('status', OsTravelHotel::APPROVED)->count(),
                    OsTravelHotel::REJECTED => OsTravelHotel::query()->where('status', OsTravelHotel::REJECTED)->count(),
                    OsTravelHotel::ORPHANED => OsTravelHotel::query()->where('status', OsTravelHotel::ORPHANED)->count(),
                    'all' => OsTravelHotel::query()->count(),
                ],
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $validStatuses = [OsTravelHotel::PENDING, OsTravelHotel::APPROVED, OsTravelHotel::REJECTED, OsTravelHotel::ORPHANED];

        $data = $request->validate([
            'status' => ['sometimes', 'nullable', 'string', 'in:'.implode(',', $validStatuses)],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'stars' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:7'],
            'check_in' => ['sometimes', 'nullable', 'date'],
            'check_out' => ['sometimes', 'nullable', 'date', 'after_or_equal:check_in'],
        ]);

        $query = OsTravelHotel::query()->with(['hotel', 'approver']);

        $this->applyListFilters($query, $data);

        $hotels = $query->latest('id')->get();

        $live = null;
        $pickedNights = null;
        if (! empty($data['check_in']) && ! empty($data['check_out'])) {
            $live = $this->searchService->probeWindow(
                $hotels->pluck('external_id')->filter()->values()->all(),
                $data['check_in'],
                $data['check_out'],
            );
            $pickedNights = max(
                1,
                Carbon::parse($data['check_out'])->diffInDays(Carbon::parse($data['check_in'])),
            );
        }

        return response()->json([
            'data' => $hotels
                ->map(fn (OsTravelHotel $hotel) => $this->reviewPayload($hotel, $live, $pickedNights))
                ->values(),
        ]);
    }

    /**
     * Apply the shared admin list filters onto a query. `check_in`/`check_out`
     * are intentionally not applied here: they only drive the live price probe.
     *
     * @param  Builder<OsTravelHotel>  $query
     * @param  array<string, mixed>  $data
     */
    private function applyListFilters($query, array $data): void
    {
        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        if (! empty($data['city'])) {
            $query->where('city_name', 'like', '%'.$data['city'].'%');
        }

        if (! empty($data['country_id'])) {
            $query->where('country_external_id', $data['country_id']);
        }

        if (! empty($data['city_id'])) {
            $query->where('city_external_id', $data['city_id']);
        }

        if (! empty($data['stars'])) {
            $query->where('stars', '>=', $data['stars']);
        }
    }

    /**
     * Countries and cities for the admin list filters, sourced from the synced
     * provider reference data (not the ISO country-state-city package).
     */
    public function references(): JsonResponse
    {
        $countries = OsTravelReference::query()
            ->where('type', OsTravelReference::TYPE_COUNTRY)
            ->orderBy('name')
            ->get(['external_id', 'name']);

        $cities = OsTravelReference::query()
            ->where('type', OsTravelReference::TYPE_CITY)
            ->orderBy('name')
            ->get(['external_id', 'name', 'payload']);

        return response()->json([
            'data' => [
                'countries' => $countries->map(fn ($c) => ['id' => $c->external_id, 'name' => $c->name]),
                'cities' => $cities->map(function ($c) {
                    $payload = $c->payload['Country'] ?? [];

                    return [
                        'id' => $c->external_id,
                        'name' => $c->name,
                        'country_id' => isset($payload['Id']) ? (string) $payload['Id'] : null,
                    ];
                }),
            ],
        ]);
    }

    public function show(int|string $id): JsonResponse
    {
        $hotel = OsTravelHotel::query()->with(['hotel', 'approver'])->findOrFail($id);

        // Admin clicking a hotel's details also triggers the once-per-day
        // provider detail refresh (single-flight inside HotelPublisher).
        $this->publisher->refreshDetail($hotel);

        return response()->json([
            'data' => [
                ...$this->reviewPayload($hotel->refresh()),
                'payload' => $hotel->payload,
                'mapped_preview' => $this->mappedPreview($hotel),
            ],
        ]);
    }

    /**
     * Persist a price onto the staging row without publishing it.
     */
    public function update(Request $request, int|string $id): JsonResponse
    {
        $hotel = OsTravelHotel::query()->findOrFail($id);

        $data = $request->validate([
            'markup_percentage' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'nullable', 'string', 'max:3'],
        ]);

        if (! array_key_exists('markup_percentage', $data)
            && ! array_key_exists('currency', $data)) {
            return response()->json(['message' => __('messages.no_change')], 422);
        }

        $hotel->fill([
            'markup_percentage' => $data['markup_percentage'] ?? $hotel->markup_percentage,
            'currency' => $data['currency'] ?? $hotel->currency,
        ])->save();

        return response()->json(['data' => $this->reviewPayload($hotel->refresh())]);
    }

    /**
     * Approve a single staged hotel (publishes it into `hotels`).
     */
    public function approve(Request $request, int|string $id): JsonResponse
    {
        $hotel = OsTravelHotel::query()->findOrFail($id);

        $data = $request->validate([
            'markup_percentage' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'nullable', 'string', 'max:3'],
        ]);

        // Idempotent re-approve: a staging row that already has a linked public
        // `hotels` row returns that hotel without re-publishing (no duplicate
        // hotel, no re-download, no approved_at bump). A row whose linked hotel
        // was deleted (hotel_id nulled by nullOnDelete) falls through and
        // re-publishes.
        if ($hotel->hotel_id !== null) {
            return response()->json([
                'data' => [
                    ...$this->reviewPayload($hotel->refresh()),
                    'hotel' => [
                        'id' => (string) $hotel->hotel->id,
                        'slug' => $hotel->hotel->slug,
                        'markup_percentage' => $hotel->hotel->markup_percentage,
                        'currency' => $hotel->hotel->currency,
                    ],
                ],
            ]);
        }

        try {
            // Fetch provider detail once before publishing so a hotel approved
            // from a never-viewed staging row still publishes rich content.
            $this->publisher->refreshDetail($hotel);
            $published = $this->publisher->publish($hotel, $data, $request->user());
        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'data' => [
                ...$this->reviewPayload($hotel->refresh()),
                'hotel' => [
                    'id' => (string) $published->id,
                    'slug' => $published->slug,
                    'markup_percentage' => $published->markup_percentage,
                    'currency' => $published->currency,
                ],
            ],
        ]);
    }

    /**
     * Bulk approve: publish every hotel matching the currently applied admin
     * filters straight into the public `hotels` table. Publishing runs in
     * `lazy` mode, so it is pure database work — the provider photos are
     * stored as opaque proxy URLs (streamed on-demand through the image proxy)
     * and never downloaded in this request, and the heavy hotel-detail content
     * is fetched lazily by the first public visit
     * (`HotelPublisher::refreshDetail`). By default hotels without an image
     * are skipped; passing `include_without_image` opts them back into the
     * batch. Already-live rows are ignored. A batch-wide `markup_percentage` /
     * `currency` override is applied to every published hotel.
     */
    public function approveAll(Request $request): JsonResponse
    {
        $validStatuses = [OsTravelHotel::PENDING, OsTravelHotel::APPROVED, OsTravelHotel::REJECTED, OsTravelHotel::ORPHANED];

        $data = $request->validate([
            'markup_percentage' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'nullable', 'string', 'max:3'],
            'include_without_image' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'nullable', 'string', 'in:'.implode(',', $validStatuses)],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'stars' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:7'],
            'check_in' => ['sometimes', 'nullable', 'date'],
            'check_out' => ['sometimes', 'nullable', 'date', 'after_or_equal:check_in'],
        ]);

        $includeWithoutImage = (bool) ($data['include_without_image'] ?? false);

        $data['status'] = $data['status'] ?? OsTravelHotel::PENDING;

        $baseQuery = OsTravelHotel::query();
        $this->applyListFilters($baseQuery, $data);

        $pending = (clone $baseQuery)->orderBy('id')->get();

        $withoutImage = $includeWithoutImage
            ? []
            : $pending->filter(fn (OsTravelHotel $hotel) => self::isPlaceholderImageUrl($hotel->image))->pluck('id')
                ->map(fn ($value) => (string) $value)
                ->values()
                ->all();

        $approved = [];
        $failed = [];

        foreach ($pending as $hotel) {
            if (! $includeWithoutImage && self::isPlaceholderImageUrl($hotel->image)) {
                continue;
            }

            // Already-live rows are idempotently re-approvable via `approve`,
            // but bulk approval never touches rows already on the public site.
            if ($hotel->hotel_id !== null) {
                continue;
            }

            $overrides = [];

            if (array_key_exists('markup_percentage', $data)) {
                $overrides['markup_percentage'] = $data['markup_percentage'];
            }

            if (array_key_exists('currency', $data)) {
                $overrides['currency'] = $data['currency'];
            }

            try {
                $this->publisher->publish($hotel, $overrides, $request->user(), true);
                $approved[] = (string) $hotel->id;
            } catch (Throwable $e) {
                Log::warning('OS-TRAVEL bulk approve failed to publish a hotel.', [
                    'external_id' => $hotel->external_id,
                    'error' => $e->getMessage(),
                ]);
                $failed[] = (string) $hotel->id;
            }
        }

        return response()->json([
            'data' => [
                'approved' => $approved,
                'failed' => $failed,
                'skipped_no_image' => $withoutImage,
                'approved_count' => count($approved),
                'failed_count' => count($failed),
                'skipped_no_image_count' => count($withoutImage),
            ],
        ]);
    }

    public function reject(int|string $id): JsonResponse
    {
        $hotel = OsTravelHotel::query()->findOrFail($id);

        if ($hotel->hotel_id !== null) {
            return response()->json(['message' => __('os_travel.cannot_reject_published')], 422);
        }

        $hotel->update([
            'status' => OsTravelHotel::REJECTED,
            'rejected_at' => now(),
        ]);

        return response()->json(['data' => $this->reviewPayload($hotel->refresh())]);
    }

    /**
     * Un-approve a staged hotel, moving it back to the pending review queue.
     *
     * An approved row just clears its approval. A row with a linked public
     * `hotels` row is also un-published: that row is deleted (so it leaves the
     * public site) and the staging row returns to pending. Deleting is safe
     * because the staging row's `hotel_id` is null-on-delete and the publish
     * path re-creates the hotel on the next approve.
     */
    public function unapprove(int|string $id): JsonResponse
    {
        $hotel = OsTravelHotel::query()->findOrFail($id);

        if ($hotel->status !== OsTravelHotel::APPROVED) {
            return response()->json(['message' => __('os_travel.cannot_unapprove')], 422);
        }

        if ($hotel->hotel_id !== null) {
            $hotel->hotel?->delete();
            $hotel->refresh();
        }

        $hotel->update([
            'status' => OsTravelHotel::PENDING,
            'hotel_id' => null,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        return response()->json(['data' => $this->reviewPayload($hotel->refresh())]);
    }

    /**
     * Review columns for the staged list.
     *
     * When a live probe ran, the row carries the probe result for its exact
     * date window: `live_price`/`live_currency` when available, otherwise a
     * `live_status` explaining why not.
     *
     * `final_price` is the sell price: live API price + markup when the probe
     * priced this hotel. It is null when there is no price to mark up.
     *
     * @param  array{prices?: array<string, array{price: float, currency: string}>, unavailable?: array<string, array{reason: string|null, first_available_at: string|null, min_nights: int|null}>, omitted_ids?: list<string>, failed_ids?: list<string>}|null  $live
     * @param  int|null  $pickedNights  Nights spanned by the probed date window.
     */
    private function reviewPayload(OsTravelHotel $hotel, ?array $live = null, ?int $pickedNights = null): array
    {
        $hotel->loadMissing(['hotel', 'approver']);

        $liveStatus = null;
        $livePrice = null;
        $liveCurrency = null;
        $liveReason = null;
        $liveUntil = null;

        if ($live !== null) {
            if (isset($live['prices'][$hotel->external_id])) {
                $livePrice = $live['prices'][$hotel->external_id]['price'];
                $liveCurrency = $live['prices'][$hotel->external_id]['currency'];
                $liveStatus = 'available';
            } elseif (isset($live['unavailable'][$hotel->external_id])) {
                $meta = $live['unavailable'][$hotel->external_id];
                $liveStatus = $meta['reason'] ?? 'no_availability';
                $liveUntil = $meta['first_available_at'];
                $liveReason = $liveStatus === 'min_stay'
                    ? sprintf('picked %d night(s) — minimum stay for these dates is %d', $pickedNights ?? 1, $meta['min_nights'] ?? 1)
                    : ($liveUntil !== null
                        ? sprintf('first available %s (min %d night(s))', $liveUntil, $meta['min_nights'] ?? 1)
                        : 'stop reservation — no reopen date known');
            } elseif (in_array($hotel->external_id, $live['failed_ids'] ?? [], true)) {
                $liveStatus = 'provider_error';
            } else {
                $liveStatus = 'no_availability';
            }
        }

        // Sell price the admin sees: live API price + markup when a date
        // filter probed this hotel. No availability or a provider error leaves
        // it null so the frontend can explain why.
        $markup = (float) ($hotel->markup_percentage ?? config('ostravel.markup.default', 20));
        $finalPrice = null;
        if ($liveStatus === 'available' && $livePrice !== null) {
            $finalPrice = $this->calculator->applyMarkup($livePrice, $markup);
        }

        return [
            'id' => (string) $hotel->id,
            'external_id' => $hotel->external_id,
            'name' => $hotel->name,
            'city_external_id' => $hotel->city_external_id,
            'city_name' => $hotel->city_name,
            'country_external_id' => $hotel->country_external_id,
            'country_name' => $hotel->country_name,
            'category_title' => $hotel->category_title,
            'stars' => $hotel->stars,
            'image' => self::cleanImageUrl($hotel->image),
            'status' => $hotel->status,
            'final_price' => $finalPrice,
            'markup_percentage' => $hotel->markup_percentage,
            'currency' => $hotel->currency,
            'hotel_id' => $hotel->hotel_id !== null ? (string) $hotel->hotel_id : null,
            'hotel_slug' => $hotel->hotel?->slug,
            'approved_by' => $hotel->approver?->name,
            'approved_at' => $hotel->approved_at,
            'rejected_at' => $hotel->rejected_at,
            'last_synced_at' => $hotel->last_synced_at,
            'live_status' => $liveStatus,
            'live_price' => $livePrice,
            'live_currency' => $liveCurrency,
            'live_reason' => $liveReason,
            'live_until' => $liveUntil,
        ];
    }

    /**
     * Mapped preview of the staged payload, mirroring HotelPublisher's mapping.
     */
    private function mappedPreview(OsTravelHotel $hotel): array
    {
        $list = $hotel->payload['ListHotel'] ?? [];
        $detail = $hotel->payload['HotelDetail'] ?? [];

        $country = $list['City']['Country'] ?? $detail['City']['Country'] ?? '';
        if (is_array($country)) {
            $country = $country['Name'] ?? '';
        }

        $markup = $hotel->markup_percentage ?? config('ostravel.markup.default', 20);

        return [
            'name' => HotelPublisher::cleanText($list['Name'] ?? $detail['Name'] ?? ''),
            'city' => HotelPublisher::cleanText($list['City']['Name'] ?? $detail['City']['Name'] ?? ''),
            'country' => HotelPublisher::cleanText((string) $country),
            'stars' => $list['Category']['Star'] ?? $detail['Category']['Star'] ?? 0,
            'category' => HotelPublisher::cleanText($list['Category']['Title'] ?? $detail['Category']['Title'] ?? ''),
            'image' => self::cleanImageUrl($list['Image'] ?? $detail['Image'] ?? null),
            'gallery' => collect($detail['Album'] ?? [])
                ->pluck('Url')
                ->map(fn ($url) => self::cleanImageUrl($url))
                ->filter()
                ->values()
                ->all(),            'description' => HotelPublisher::htmlToText($detail['LongDescription'] ?? ''),
            'themes' => $list['Theme'] ?? $detail['Theme'] ?? [],
            'boarding' => collect($detail['Boarding'] ?? [])
                ->map(fn (array $b) => HotelPublisher::cleanText($b['Name'] ?? ''))
                ->filter()->values()->all(),
            'address' => HotelPublisher::cleanText($detail['Adress'] ?? ''),
            'phone' => HotelPublisher::cleanText($detail['Phone'] ?? ''),
            'email' => HotelPublisher::cleanText($detail['Email'] ?? ''),
            'markup_percentage' => $markup,
            'currency' => $hotel->currency ?? config('ostravel.currency.default', 'TND'),
            'code' => 'ostravel-'.$hotel->external_id,
        ];
    }

    /**
     * True when the image URL is missing or comes from a known placeholder
     * service, so callers can treat the hotel as having no usable picture.
     */
    private static function isPlaceholderImageUrl(mixed $url): bool
    {
        if (! is_string($url) || trim($url) === '') {
            return true;
        }

        $host = parse_url(trim($url), PHP_URL_HOST);

        if (! is_string($host)) {
            return false;
        }

        return in_array(strtolower($host), [
            'via.placeholder.com',
            'placehold.co',
            'placeholdit.co',
            'dummyimage.com',
        ], true);
    }

    /**
     * Drop placeholder/empty image URLs (e.g. faker-generated
     * `via.placeholder.com` fixtures stored in test payloads) so the admin
     * never renders a broken image and the browser never fires a failing GET.
     */
    private static function cleanImageUrl(mixed $url): ?string
    {
        if (self::isPlaceholderImageUrl($url)) {
            return null;
        }

        return is_string($url) ? $url : null;
    }
}
