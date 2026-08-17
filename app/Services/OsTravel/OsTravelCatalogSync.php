<?php

namespace App\Services\OsTravel;

use App\Models\OsTravelHotel;
use App\Models\OsTravelReference;
use App\Models\OsTravelSync;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Pulls the OS-TRAVEL catalog into staging tables.
 *
 * Runs are single-flight (Cache lock), idempotent across re-syncs, never flip
 * approved/published hotels back to pending, reactivate orphaned hotels that
 * reappear, and mark missing pending/approved hotels as orphaned.
 */
class OsTravelCatalogSync
{
    private OsTravelSync $sync;

    private int $countriesCount = 0;

    private int $citiesCount = 0;

    private int $hotelsCount = 0;

    private int $detailsCount = 0;

    private int $orphanedCount = 0;

    private int $reactivatedCount = 0;

    /** @var list<int> */
    private array $cityIds = [];

    /** @var list<array{external_id: string, id: int}> */
    private array $changedHotels = [];

    /** @var callable(string):void|null */
    private $reporter = null;

    public function __construct(private OsTravelClient $client) {}

    /**
     * Attach a callback that receives each progress line (prefixed with a
     * timestamp) as the sync runs. Useful to stream step-by-step output to a
     * console while the run executes.
     *
     * @param  callable(string):void|null  $reporter
     */
    public function report(?callable $reporter): static
    {
        $this->reporter = $reporter;

        return $this;
    }

    /**
     * Emit a timestamped progress line to the attached reporter and to the
     * application log, so every phase of a run is visible after the fact.
     *
     * @param  array<string, mixed>  $context
     */
    protected function note(string $message, array $context = []): void
    {
        $line = '['.now()->format('Y-m-d H:i:s').'] '.$message;

        if ($this->reporter !== null) {
            ($this->reporter)($line);
        }

        Log::info('OS-TRAVEL catalog sync: '.$message, $context);
    }

    /**
     * Runs a single catalog sync. Returns null when another run holds the
     * single-flight lock (a no-op, no sync row created).
     */
    public function sync(): ?OsTravelSync
    {
        $lock = Cache::lock('os-travel-sync', config('ostravel.sync.lock_ttl_minutes') * 60);

        if (! $lock->get()) {
            Log::info('OS-TRAVEL catalog sync skipped: another run is still in progress.');

            return null;
        }

        try {
            return $this->run();
        } finally {
            $lock->release();
        }
    }

    protected function run(): OsTravelSync
    {
        $this->resetCounters();

        $this->sync = OsTravelSync::create([
            'batch' => (string) Str::uuid(),
            'status' => OsTravelSync::RUNNING,
            'started_at' => now(),
        ]);

        $this->note("sync started (batch {$this->sync->batch})");

        try {
            $countryIds = $this->syncCountries();
            $this->note('countries synced: '.count($countryIds));

            $this->syncCities($this->selectedCountryIds($countryIds));
            $this->note('cities synced: '.$this->citiesCount);

            $boardings = $this->client->listBoardings()['ListBoarding'] ?? [];
            $this->note('ListBoarding returned '.count($boardings).' items');
            $this->syncReferences(OsTravelReference::TYPE_BOARDING, $boardings);

            $categories = $this->client->listCategories()['ListCategorie'] ?? [];
            $this->note('ListCategorie returned '.count($categories).' items');
            $this->syncReferences(OsTravelReference::TYPE_CATEGORY, $categories);

            $currencies = $this->client->listCurrencies()['ListCurrency'] ?? [];
            $this->note('ListCurrency returned '.count($currencies).' items');
            $this->syncReferences(OsTravelReference::TYPE_CURRENCY, $currencies);

            $this->syncHotels();
            $this->note('hotels synced: '.$this->hotelsCount);

            $this->enrichDetails();
            $this->note('hotel details fetched: '.$this->detailsCount);

            $this->detectOrphans();
            $this->note('orphans detected: '.$this->orphanedCount);

            return $this->finishSuccess();
        } catch (Throwable $e) {
            $this->fail($e);

            throw $e;
        }
    }

    /**
     * @return list<string> All country Ids returned by the API.
     */
    protected function syncCountries(): array
    {
        $this->note('calling ListCountry');
        $data = $this->client->listCountries();

        $ids = [];
        foreach ($data['ListCountry'] ?? [] as $item) {
            $this->upsertReference(OsTravelReference::TYPE_COUNTRY, $item);
            $ids[] = (string) ($item['Id'] ?? '');
        }

        $this->countriesCount = count($ids);

        $this->note("ListCountry returned {$this->countriesCount} countries");

        return $ids;
    }

    /**
     * @param  list<string>  $countryIds
     */
    protected function syncCities(array $countryIds): void
    {
        $this->cityIds = [];

        foreach ($countryIds as $countryId) {
            $this->note("calling ListCity for country={$countryId}");
            $data = $this->client->listCities($countryId);

            foreach ($data['ListCity'] ?? [] as $item) {
                $this->upsertReference(OsTravelReference::TYPE_CITY, $item);
                $this->cityIds[] = (string) ($item['Id'] ?? '');
            }
        }

        $this->citiesCount = count($this->cityIds);

        $this->note("ListCity complete: {$this->citiesCount} cities");
    }

    /**
     * @param  list<mixed>  $items
     */
    protected function syncReferences(string $type, array $items): void
    {
        foreach ($items as $item) {
            $this->upsertReference($type, $item);
        }
    }

    protected function upsertReference(string $type, array $item): void
    {
        $externalId = (string) ($item['Id'] ?? $item['Code'] ?? '');
        if ($externalId === '') {
            return;
        }

        OsTravelReference::updateOrCreate(
            ['type' => $type, 'external_id' => $externalId],
            [
                'code' => $item['Code'] ?? null,
                'name' => $item['Name'] ?? null,
                'payload' => $item,
                'sync_id' => $this->sync->id,
            ]
        );
    }

    protected function syncHotels(): void
    {
        foreach ($this->cityIds as $cityId) {
            $page = 1;

            do {
                $this->note("calling ListHotel city={$cityId} page={$page}");
                $response = $this->client->listHotels($cityId, $page === 1 ? null : $page);
                $this->upsertHotelPage($cityId, $response);
                $page++;
            } while ($this->hasMorePages($response));
        }
    }

    protected function upsertHotelPage(string $cityId, array $response): void
    {
        foreach ($response['ListHotel'] ?? [] as $item) {
            $this->upsertHotel($cityId, $item);
        }
    }

    /**
     * Probe for pagination metadata. The current API does not paginate
     * ListHotel; if it ever reports `Page`/`TotalPages`, the loop continues.
     */
    protected function hasMorePages(array $response): bool
    {
        $page = $response['Page'] ?? null;
        $totalPages = $response['TotalPages'] ?? null;

        return is_numeric($page) && is_numeric($totalPages) && (int) $page < (int) $totalPages;
    }

    protected function upsertHotel(string $cityId, array $item): void
    {
        $externalId = (string) ($item['Id'] ?? '');
        if ($externalId === '') {
            return;
        }

        $hash = sha1(json_encode($item));
        $hotel = OsTravelHotel::firstOrNew(['external_id' => $externalId]);

        if (! $hotel->exists) {
            $hotel->status = OsTravelHotel::PENDING;
        } elseif ($hotel->status === OsTravelHotel::ORPHANED) {
            $this->reactivate($hotel);
        }

        $changed = ! $hotel->exists || $hotel->payload_hash !== $hash;

        $city = $item['City'] ?? [];
        $country = is_array($city) ? ($city['Country'] ?? []) : [];

        $hotel->fill([
            'sync_id' => $this->sync->id,
            'payload' => ['ListHotel' => $item],
            'payload_hash' => $hash,
            'name' => $item['Name'] ?? '',
            'city_external_id' => $cityId,
            'city_name' => is_array($city) ? ($city['Name'] ?? null) : null,
            'country_external_id' => is_array($country) && isset($country['Id']) ? (string) $country['Id'] : null,
            'country_name' => is_array($country) ? ($country['Name'] ?? null) : null,
            'category_title' => $item['Category']['Title'] ?? null,
            'stars' => $item['Category']['Star'] ?? null,
            'image' => $item['Image'] ?? null,
            'last_synced_at' => now(),
        ]);

        $hotel->save();

        $this->hotelsCount++;

        if ($changed) {
            $this->changedHotels[] = ['external_id' => $externalId, 'id' => (int) $hotel->id];
        }
    }

    protected function reactivate(OsTravelHotel $hotel): void
    {
$restoreStatus = in_array($hotel->prior_status, [OsTravelHotel::APPROVED, OsTravelHotel::REJECTED], true)
    ? $hotel->prior_status
    : OsTravelHotel::PENDING;

        $hotel->status = $restoreStatus;
        $hotel->prior_status = null;

        $this->reactivatedCount++;

        Log::info('OS-TRAVEL orphaned hotel reactivated after reappearing in sync', [
            'external_id' => $hotel->external_id,
            'restored_status' => $restoreStatus,
        ]);
    }

    /**
     * Enrich hotels that have never had their HotelDetail fetched (brand-new
     * hotels). Known hotels — including changed ones — are refreshed lazily by
     * the first public/admin click each day (HotelPublisher::refreshDetail).
     */
    protected function enrichDetails(): void
    {
        $total = count($this->changedHotels);
        $index = 0;

        foreach ($this->changedHotels as $entry) {
            $hotel = OsTravelHotel::find($entry['id']);

            if ($hotel !== null && ! empty($hotel->payload['HotelDetail'])) {
                continue;
            }

            if ($this->detailsCount > 0) {
                usleep(config('ostravel.sync.throttle_ms') * 1000);
            }

            $index++;
            $this->note("calling HotelDetail external={$entry['external_id']} (".$index.'/'.$total.')');
            $detail = $this->client->hotelDetail($entry['external_id']);

            if ($hotel !== null) {
                $hotel->payload = array_merge($hotel->payload ?? [], ['HotelDetail' => $detail['HotelDetail'] ?? []]);
                $hotel->save();
            }

            $this->detailsCount++;
        }
    }

    protected function detectOrphans(): void
    {
        $this->note('detecting orphaned hotels');
        $missing = OsTravelHotel::where('last_synced_at', '<', $this->sync->started_at)->get();

        foreach ($missing as $hotel) {
            if (in_array($hotel->status, [OsTravelHotel::PENDING, OsTravelHotel::APPROVED, OsTravelHotel::REJECTED], true)) {
                $hotel->update([
                    'status' => OsTravelHotel::ORPHANED,
                    'prior_status' => $hotel->status,
                ]);
                $this->orphanedCount++;
            } elseif ($hotel->hotel_id !== null) {
                Log::warning('OS-TRAVEL live hotel missing from latest sync; admin review required.', [
                    'external_id' => $hotel->external_id,
                    'hotel_id' => $hotel->hotel_id,
                ]);
            }
        }
    }

    protected function finishSuccess(): OsTravelSync
    {
        $this->sync->update([
            'status' => OsTravelSync::SUCCESS,
            'finished_at' => now(),
            'countries_count' => $this->countriesCount,
            'cities_count' => $this->citiesCount,
            'hotels_count' => $this->hotelsCount,
            'details_count' => $this->detailsCount,
            'orphaned_count' => $this->orphanedCount,
            'reactivated_count' => $this->reactivatedCount,
        ]);

        $this->note(
            'sync finished: countries='.$this->countriesCount
            .', cities='.$this->citiesCount
            .', hotels='.$this->hotelsCount
            .', details='.$this->detailsCount
            .', orphaned='.$this->orphanedCount
            .', reactivated='.$this->reactivatedCount
        );

        foreach (['admin.entity.hotels', 'entity.hotels.index', 'hotels.index'] as $key) {
            Cache::forget($key);
        }

        return $this->sync->fresh();
    }

    protected function fail(Throwable $e): void
    {
        $this->sync->update([
            'status' => OsTravelSync::FAILED,
            'finished_at' => now(),
            'error' => $e->getMessage(),
        ]);

        $this->note('sync failed: '.$e->getMessage());

        Log::error('OS-TRAVEL catalog sync failed', [
            'sync_id' => $this->sync->id,
            'error' => $e->getMessage(),
        ]);
    }

    /**
     * @param  list<string>  $allCountryIds
     * @return list<string>
     */
    protected function selectedCountryIds(array $allCountryIds): array
    {
        $configured = array_values(array_filter(
            config('ostravel.sync.countries', []),
            fn ($id) => $id !== ''
        ));

        return $configured !== [] ? $configured : $allCountryIds;
    }

    protected function resetCounters(): void
    {
        $this->countriesCount = 0;
        $this->citiesCount = 0;
        $this->hotelsCount = 0;
        $this->detailsCount = 0;
        $this->orphanedCount = 0;
        $this->reactivatedCount = 0;
        $this->cityIds = [];
        $this->changedHotels = [];
    }
}
