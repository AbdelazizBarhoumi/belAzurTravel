<?php

namespace Tests\Feature;

use App\Models\OsTravelHotel;
use App\Models\OsTravelReference;
use App\Models\OsTravelSync;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OsTravelSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_migrations_create_syncs_table(): void
    {
        $columns = [
            'id', 'batch', 'status', 'started_at', 'finished_at',
            'countries_count', 'cities_count', 'hotels_count', 'details_count',
            'orphaned_count', 'reactivated_count', 'error',
            'created_at', 'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('os_travel_syncs', $column),
                "Missing column {$column} on os_travel_syncs."
            );
        }
    }

    public function test_migrations_create_reference_table(): void
    {
        $columns = [
            'id', 'type', 'external_id', 'code', 'name', 'payload', 'sync_id',
            'created_at', 'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('os_travel_reference', $column),
                "Missing column {$column} on os_travel_reference."
            );
        }
    }

    public function test_migrations_create_hotels_table(): void
    {
        $columns = [
            'id', 'external_id', 'sync_id', 'payload', 'payload_hash',
            'name', 'city_external_id', 'city_name', 'category_title', 'stars', 'image',
            'status', 'hotel_id', 'base_price', 'markup_percentage', 'currency',
            'approved_by', 'approved_at', 'rejected_at', 'last_synced_at',
            'created_at', 'updated_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('os_travel_hotels', $column),
                "Missing column {$column} on os_travel_hotels."
            );
        }
    }

    public function test_unique_type_and_external_id_rejects_duplicate_reference(): void
    {
        OsTravelReference::create([
            'type' => OsTravelReference::TYPE_COUNTRY,
            'external_id' => '219',
            'name' => 'Tunisie',
            'payload' => ['Id' => 219, 'Code' => 'tn', 'Name' => 'Tunisie'],
        ]);

        $this->expectException(QueryException::class);

        OsTravelReference::create([
            'type' => OsTravelReference::TYPE_COUNTRY,
            'external_id' => '219',
            'name' => 'Duplicate',
            'payload' => ['Id' => 219],
        ]);
    }

    public function test_unique_external_id_rejects_duplicate_hotel(): void
    {
        OsTravelHotel::create($this->hotelData());

        $this->expectException(QueryException::class);

        OsTravelHotel::create($this->hotelData());
    }

    public function test_reference_payload_is_casted_to_array(): void
    {
        $payload = ['Id' => 219, 'Code' => 'tn', 'Name' => 'Tunisie'];

        $reference = OsTravelReference::create([
            'type' => OsTravelReference::TYPE_COUNTRY,
            'external_id' => '219',
            'name' => 'Tunisie',
            'payload' => $payload,
        ]);

        $this->assertIsArray($reference->payload);
        $this->assertSame('tn', $reference->payload['Code']);
        $this->assertSame($payload, OsTravelReference::find($reference->id)->payload);
    }

    public function test_hotel_payload_is_casted_to_array(): void
    {
        $payload = ['ListHotel' => [['Id' => 178, 'Name' => 'Cap Bon']]];

        $hotel = OsTravelHotel::create(array_merge($this->hotelData(), ['payload' => $payload]));

        $this->assertIsArray($hotel->payload);
        $this->assertSame('Cap Bon', $hotel->payload['ListHotel'][0]['Name']);
    }

    public function test_hotel_defaults_status_to_pending_and_currency_to_tnd(): void
    {
        $hotel = OsTravelHotel::create($this->hotelData());

        $this->assertSame(OsTravelHotel::PENDING, $hotel->fresh()->status);
        $this->assertSame('TND', $hotel->fresh()->currency);
    }

    public function test_hotel_relations_resolve(): void
    {
        $sync = OsTravelSync::create(['batch' => 'batch-1']);

        $hotel = OsTravelHotel::create(array_merge($this->hotelData(), ['sync_id' => $sync->id]));

        $this->assertTrue($hotel->sync->is($sync));
        $this->assertTrue($sync->hotels()->first()->is($hotel));

        $reference = OsTravelReference::create([
            'type' => OsTravelReference::TYPE_CITY,
            'external_id' => '12',
            'name' => 'Kelibia',
            'payload' => ['Id' => 12],
            'sync_id' => $sync->id,
        ]);

        $this->assertTrue($reference->sync->is($sync));
        $this->assertCount(1, $sync->references);
    }

    private function hotelData(): array
    {
        return [
            'external_id' => '178',
            'payload_hash' => str_repeat('a', 64),
            'payload' => ['ListHotel' => [['Id' => 178, 'Name' => 'Cap Bon']]],
            'name' => 'Cap Bon',
            'city_external_id' => '12',
        ];
    }
}
