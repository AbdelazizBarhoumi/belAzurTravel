<?php

namespace Tests\Feature;

use App\Models\Visa;
use Database\Seeders\VisaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VisaCatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_country_is_seeded_and_existing_rows_are_kept(): void
    {
        Visa::query()->create([
            'code' => 'FR', 'name' => ['fr' => 'France'], 'flag' => 'FR',
            'processing' => ['fr' => '8 jours'], 'price' => 999, 'is_active' => false,
        ]);

        $this->seed(VisaSeeder::class);
        $this->seed(VisaSeeder::class);

        $this->assertSame(250, Visa::query()->count());
        $this->assertSame(999, Visa::query()->where('code', 'FR')->value('price'));
        $this->assertFalse((bool) Visa::query()->where('code', 'FR')->value('is_active'));

        $japan = Visa::query()->where('code', 'JP')->first();
        $this->assertTrue($japan->is_active);
        $this->assertSame('JP', $japan->flag);

        $peru = Visa::query()->where('code', 'PE')->first();
        $this->assertFalse($peru->is_active);
        $this->assertSame('Pérou', $peru->name['fr']);

        // Only the active ones are public.
        $this->getJson('/api/visas')->assertOk()->assertJsonMissing(['code' => 'PE']);
    }
}
