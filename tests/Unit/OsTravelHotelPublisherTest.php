<?php

namespace Tests\Unit;

use App\Models\Hotel;
use App\Models\OsTravelHotel;
use App\Services\OsTravel\HotelPublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InteractsWithOsTravel;
use Tests\TestCase;

class OsTravelHotelPublisherTest extends TestCase
{
    use InteractsWithOsTravel;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpOsTravelConfig();
        Storage::fake('public');
        Http::fake([
            'https://admin.mygo.co/file_manager/*' => Http::response('image-bytes'),
        ]);
    }

    private function stagedHotel(int $id = 178, string $name = 'Cap Bon Kelibia Beach Hotel & Spa'): OsTravelHotel
    {
        $detail = $this->osTravelFixture('hotel_detail');

        return OsTravelHotel::create([
            'external_id' => (string) $id,
            'payload' => [
                'ListHotel' => $this->osTravelHotelItem($id, $name),
                'HotelDetail' => $detail['HotelDetail'],
            ],
            'payload_hash' => str_repeat('a', 64),
            'name' => $name,
            'city_external_id' => '12',
            'city_name' => 'Kelibia',
            'category_title' => '4 étoiles',
            'stars' => 4,
            'image' => 'https://admin.mygo.co/file_manager/source/photos/test.jpg',
            'status' => OsTravelHotel::PENDING,
            'last_synced_at' => now(),
        ]);
    }

    public function test_publish_maps_staged_hotel_into_hotels_row(): void
    {
        $staged = $this->stagedHotel();

        $hotel = app(HotelPublisher::class)->publish($staged);

        $this->assertSame('ostravel-178', $hotel->code);
        $this->assertSame('cap-bon-kelibia-beach-hotel-spa', $hotel->slug);
        $this->assertSame([
            'en' => 'Cap Bon Kelibia Beach Hotel & Spa',
            'fr' => 'Cap Bon Kelibia Beach Hotel & Spa',
            'ar' => 'Cap Bon Kelibia Beach Hotel & Spa',
        ], $hotel->name);
        $this->assertSame(['en' => 'Kelibia', 'fr' => 'Kelibia', 'ar' => 'Kelibia'], $hotel->location);
        $this->assertSame(4, $hotel->stars);
        $this->assertSame('20.00', (string) $hotel->markup_percentage);
        $this->assertSame('TND', $hotel->currency);
        // Provider hotels carry no stored price: the public price is always
        // resolved live from HotelSearch, so publish leaves price/base_price null.
        $this->assertNull($hotel->price);
        $this->assertNull($hotel->base_price);
        $this->assertSame('ostravel', $hotel->details['source']);
        $this->assertSame('178', $hotel->details['provider_hotel_id']);
        $this->assertSame('tunsi.reservations@sheratonhotels.com', $hotel->details['email']);
        $this->assertSame('', $hotel->details['whatsapp']);
        $this->assertSame('14h', $hotel->details['check_in_time']);
        $this->assertSame('12h', $hotel->details['check_out_time']);
        $this->assertSame(['latitude' => 10.161106, 'longitude' => 36.831512], $hotel->details['coordinates']);
        $this->assertSame('Hôtel', $hotel->details['hotel_type']);
        $this->assertStringContainsString('taxe de séjour', $hotel->details['note']);
        // LongDescription HTML entities + <p> blocks decoded with structure kept.
        $description = $hotel->details['description']['fr'];
        $this->assertStringContainsString('Le Sheraton Tunis Hotel & Towers surplombe toute la ville de Tunis.', $description);
        $this->assertStringContainsString("Il dispose d'un spa de luxe", $description);
        $this->assertStringContainsString('élégamment décorée', $description);
        $this->assertStringContainsString("\n", $description);
        $this->assertStringNotContainsString('<p>', $description);
        $this->assertStringNotContainsString('&eacute;', $description);
        $this->assertCount(6, $hotel->details['options']);
        $this->assertSame(['Affaires'], $hotel->tags);
        $this->assertCount(4, $hotel->details['boardings']);
        // Facilities from detail `Facilitie`.
        $this->assertSame('Spa et bien-être', $hotel->details['facilities'][0]['title']);
        $this->assertSame('Bien-être', $hotel->details['facilities'][0]['category']);
        // Amenity tags from detail `Tag`, relative image resolved via base_url.
        $this->assertSame('Wifi gratuit', $hotel->details['amenity_tags'][0]['title']);
        $this->assertSame(
            'https://admin.mygo.co/uploads/d0be1cace167bc758be36b3bbe3c10eee507485f.jpeg',
            $hotel->details['amenity_tags'][0]['image']
        );
        $this->assertSame(sha1('https://admin.mygo.co/file_manager/source/photos/test.jpg'), $hotel->meta['image_hash']);
        $this->assertStringStartsWith('/storage/uploads/hotels/', $hotel->image);
        $this->assertNotEmpty($hotel->details['gallery']);
    }

    public function test_publish_derives_filter_booleans_from_provider_data(): void
    {
        $staged = $this->stagedHotel();

        $hotel = app(HotelPublisher::class)->publish($staged);

        // Boardings from HotelDetail: LS/LPD/DP/PC.
        $this->assertTrue($hotel->logement_simple);
        $this->assertTrue($hotel->petit_dejeuner);
        $this->assertTrue($hotel->demi_pension);
        $this->assertTrue($hotel->pension_complete);
        // Stars 4 from the fixture.
        $this->assertTrue($hotel->categorie_4_etoiles);
        // Theme "Affaires" from HotelDetail.
        $this->assertTrue($hotel->affaires);
        $this->assertFalse($hotel->famille);
        $this->assertFalse($hotel->thalasso_spa);
    }

    public function test_publish_maps_extended_provider_themes_and_trims_tags(): void
    {
        $staged = $this->stagedHotel();

        $payload = $staged->payload;
        $payload['ListHotel']['Theme'] = [
            'Affaires',
            'Voyages de Noces',
            'Sport & Loisirs',
            'Golf',
            'Thalassothérapie',
            'Balnéothérapie',
            'Thermalisme',
            'Bien être',
            'Randonnée',
            'Montagne',
            'Saharien',
            'Archéologie',
            'Week-end',
            'Promo',
            'Charme',
            'Découverte',
            'Balnéaire ',
            'Réveillon ',
            'Tourisme',
            'Hôtel de Ville',
            'Combinées',
        ];
        $staged->payload = $payload;
        $staged->save();

        $hotel = app(HotelPublisher::class)->publish($staged->refresh());

        $this->assertTrue($hotel->affaires);
        $this->assertTrue($hotel->famille);
        $this->assertTrue($hotel->sport_loisir);
        $this->assertTrue($hotel->thalasso_spa);
        $this->assertTrue($hotel->nature_aventure);
        $this->assertTrue($hotel->detente);
        $this->assertTrue($hotel->tarifs_promo);

        // Provider trailing whitespace is trimmed in stored tags.
        $this->assertContains('Balnéaire', $hotel->tags);
        $this->assertContains('Réveillon', $hotel->tags);
        $this->assertNotContains('Balnéaire ', $hotel->tags);
        $this->assertNotContains('Réveillon ', $hotel->tags);
    }

    public function test_republish_updates_in_place_without_duplicating(): void
    {
        $staged = $this->stagedHotel();

        $first = app(HotelPublisher::class)->publish($staged);
        $second = app(HotelPublisher::class)->publish($staged->refresh());

        $this->assertSame(1, Hotel::count());
        $this->assertSame($first->id, $second->id);
        // Re-publish updates the same row: slug, tags and details are kept,
        // nothing is duplicated, and no stored price is carried.
        $this->assertSame($first->slug, $second->slug);
        $this->assertSame($first->tags, $second->tags);
        $this->assertSame($first->details, $second->details);
        // The price column defaults to 0 and base_price stays null on the row;
        // neither carries a real stored price for provider hotels.
        $this->assertSame(0, (int) $second->price);
        $this->assertSame(0, (int) $second->base_price);
    }

    public function test_publish_uses_markup_override_and_currency_override(): void
    {
        $staged = $this->stagedHotel();

        $hotel = app(HotelPublisher::class)->publish($staged, [
            'markup_percentage' => 15,
            'currency' => 'EUR',
        ]);

        $this->assertSame('15.00', (string) $hotel->markup_percentage);
        $this->assertSame('EUR', $hotel->currency);
        $this->assertNull($hotel->price);

        $staged->refresh();
        $this->assertSame('15.00', (string) $staged->markup_percentage);
        $this->assertSame('EUR', $staged->currency);
    }

    public function test_publish_flushes_entity_and_admin_hotel_cache(): void
    {
        foreach ([
            'admin.entity.hotels',
            'entity.hotels.index',
            'hotels.index',
            'entity.hotels.cap-bon-kelibia-beach-hotel-spa',
            'hotels.cap-bon-kelibia-beach-hotel-spa',
        ] as $key) {
            Cache::put($key, 'stale', 60);
        }

        app(HotelPublisher::class)->publish($this->stagedHotel());

        foreach ([
            'admin.entity.hotels',
            'entity.hotels.index',
            'hotels.index',
            'entity.hotels.cap-bon-kelibia-beach-hotel-spa',
            'hotels.cap-bon-kelibia-beach-hotel-spa',
        ] as $key) {
            $this->assertFalse(Cache::has($key));
        }
    }

    public function test_publish_succeeds_without_base_price(): void
    {
        $staged = $this->stagedHotel();

        $hotel = app(HotelPublisher::class)->publish($staged);

        $this->assertSame(1, Hotel::count());
        // No base price is required anymore: the published hotel carries no
        // stored price, only the markup and currency, and the staging row is
        // approved.
        $this->assertNull($hotel->price);
        $this->assertNull($hotel->base_price);
        $this->assertSame('20.00', (string) $hotel->markup_percentage);
        $this->assertSame('TND', $hotel->currency);
        $this->assertSame(OsTravelHotel::APPROVED, $staged->fresh()->status);
    }
}
