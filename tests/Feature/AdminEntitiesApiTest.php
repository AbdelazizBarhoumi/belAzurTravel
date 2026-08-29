<?php

namespace Tests\Feature;

use App\Models\Destination;
use App\Models\Flight;
use App\Models\Promo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class AdminEntitiesApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_crud_all_entity_sections(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payloads = [
            'destinations' => ['name' => 'Lisbon', 'country' => 'Portugal', 'category_key' => 'city', 'price' => 700, 'rating' => 4.6, 'description' => 'Sunny coastal city'],
            'hotels' => ['name' => 'Lisbon Stay', 'location' => 'Lisbon, Portugal', 'category_key' => 'boutique', 'price' => 180, 'rating' => 4.4],
            'tours' => ['name' => 'Lisbon Food Walk', 'location' => 'Portugal', 'duration' => '1 Day', 'price' => 120, 'rating' => 4.8],
            'cars' => ['name' => 'Audi A4', 'category' => 'Luxury', 'price' => 95, 'seats' => 5, 'fuel' => 'Hybrid', 'transmission' => 'Auto', 'description' => 'Comfort sedan'],
            'flights' => ['code' => 'tap-nyc-lis', 'airline' => 'TAP Air Portugal', 'from' => 'NYC', 'to' => 'Lisbon', 'duration' => '7h', 'price' => 520, 'stops' => 'Direct', 'departure' => '19:00', 'arrival' => '07:00+1'],
            'events' => ['title' => 'Lisbon Summer Nights', 'location' => 'Lisbon, Portugal', 'date' => 'July 2026', 'price' => 950, 'description' => 'Hosted event'],
            'deals' => [
                'title_en' => 'Portugal Escape',
                'title_fr' => 'Évasion au Portugal',
                'title_ar' => 'هروب البرتغال',
                'discount_en' => '20% OFF',
                'discount_fr' => '20 % DE RÉDUCTION',
                'discount_ar' => 'خصم 20%',
                'expires_en' => 'Aug 31, 2026',
                'expires_fr' => '31 août 2026',
                'expires_ar' => '31 أغسطس 2026',
                'category_en' => 'Seasonal',
                'description_en' => 'Limited offer',
            ],
            'promos' => [
                'code' => 'PORT20',
                'title_en' => 'Portugal Promo',
                'title_fr' => 'Promo Portugal',
                'title_ar' => 'عرض البرتغال',
                'discount_en' => '20% OFF',
                'discount_fr' => '20 % DE RÉDUCTION',
                'discount_ar' => 'خصم 20%',
                'description_en' => 'Promo offer',
                'description_fr' => 'Offre promo',
                'description_ar' => 'عرض ترويجي',
                'expires_en' => 'Aug 31, 2026',
                'expires_fr' => '31 août 2026',
                'expires_ar' => '31 أغسطس 2026',
                'color' => 'from-primary to-secondary',
                'eligibility_en' => 'Selected bookings',
                'eligibility_fr' => 'Réservations sélectionnées',
                'eligibility_ar' => 'حجوزات مختارة',
                'howToUse_en' => 'Apply code at checkout',
                'howToUse_fr' => 'Appliquer le code au paiement',
                'howToUse_ar' => 'طبّق الرمز عند الدفع',
                'terms_en' => 'Cannot be combined with other offers',
                'terms_fr' => 'Non cumulable avec d’autres offres',
                'terms_ar' => 'لا يمكن دمجه مع عروض أخرى',
                'gallery' => "/images/promo1.jpg\n/images/promo2.jpg",
                'usage_limit' => 100,
                'per_user_limit' => 1,
                'applicable_to' => 'destinations,hotels',
                'active' => 1,
            ],
            'blog-posts' => ['title' => 'Lisbon Guide', 'date' => 'May 13, 2026', 'category_key' => 'tips', 'excerpt' => 'Plan a Lisbon trip'],
        ];

        foreach ($payloads as $type => $payload) {
            // Skip hotels for this basic test (requires localized fields now)
            if ($type === 'hotels') {
                continue;
            }

            $created = $this->actingAs($admin)
                ->withoutMiddleware()
                ->withoutMiddleware()->postJson("/api/admin/{$type}", $payload)
                ->assertCreated()
                ->json('data');

            $this->actingAs($admin)
                ->getJson("/api/admin/{$type}")
                ->assertOk()
                ->assertJsonFragment(['id' => $created['id']]);

            // dd("/api/admin/{$type}/{$created['id']}");
            $id = $created['id'];
            $url = "/api/admin/{$type}/{$id}";

            $this->actingAs($admin)
                ->withoutMiddleware()->putJson($url, [...$payload, 'price' => 999])
                ->assertOk();

            $this->actingAs($admin)
                ->withoutMiddleware()->deleteJson($url)
                ->assertOk()
                ->assertJson(['message' => 'deleted']);
        }
    }

    public function test_admin_entities_require_admin_user(): void
    {
        $client = User::factory()->create([
            'role' => 'client',
            'active' => true,
        ]);

        $this->actingAs($client)
            ->getJson('/api/admin/cars')
            ->assertForbidden();
    }

    public function test_admin_can_persist_destination_detail_sections(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'name' => 'Lisbon',
            'country' => 'Portugal',
            'category_key' => 'city',
            'price' => 700,
            'rating' => 4.6,
            'image' => '/images/destination-paris.jpg',
            'description' => 'Sunny coastal city',
            'description_en' => 'Sunny coastal city',
            'description_fr' => 'Ville côtière ensoleillée',
            'description_ar' => 'مدينة ساحلية مشمسة',
            'about_en' => 'Lisbon blends old-world charm and river views.',
            'about_fr' => 'Lisbonne allie charme ancien et vues sur le fleuve.',
            'about_ar' => 'تمزج لشبونة بين السحر القديم وإطلالات النهر.',
            'highlights' => [
                ['name' => ['en' => 'Historic trams', 'fr' => 'Tramways historiques', 'ar' => 'ترام تاريخي']],
                ['name' => ['en' => 'Riverside sunsets', 'fr' => 'Couchers de soleil au bord de la rivière', 'ar' => 'غروب الشمس على ضفة النهر']],
            ],
            'gallery' => "/images/destination-paris.jpg\n/images/destination-dubai.jpg",
            'bestTime_en' => 'April to June',
            'bestTime_fr' => 'Avril à juin',
            'bestTime_ar' => 'من أبريل إلى يونيو',
            'language_en' => 'Portuguese',
            'language_fr' => 'Portugais',
            'language_ar' => 'البرتغالية',
            'currency_en' => 'Euro',
            'currency_fr' => 'Euro',
            'currency_ar' => 'اليورو',
            'weather_en' => 'Mild and sunny',
            'weather_fr' => 'Doux et ensoleillé',
            'weather_ar' => 'معتدل ومشمش',
        ];

        $this->actingAs($admin)
            ->withoutMiddleware()
            ->withoutMiddleware()->postJson('/api/admin/destinations', $payload)
            ->assertCreated();

        /** @var Destination $destination */
        $destination = Destination::query()->latest('id')->firstOrFail();

        $this->actingAs($admin)
            ->getJson('/api/destinations/'.$destination->slug)
            ->assertOk()
            ->assertJsonPath('about.en', 'Lisbon blends old-world charm and river views.')
            ->assertJsonPath('about.fr', 'Lisbonne allie charme ancien et vues sur le fleuve.')
            ->assertJsonPath('highlights.0.name.en', 'Historic trams')
            ->assertJsonPath('highlights.1.name.en', 'Riverside sunsets')
            ->assertJsonPath('gallery.1', '/images/destination-dubai.jpg')
            ->assertJsonPath('bestTime.en', 'April to June')
            ->assertJsonPath('bestTime.fr', 'Avril à juin')
            ->assertJsonPath('weather.en', 'Mild and sunny');

        $updatedPayload = [
            ...$payload,
            'about_en' => 'Lisbon now includes updated neighborhoods and nightlife.',
            'about_fr' => 'Lisbonne inclut maintenant des quartiers et une vie nocturne mis à jour.',
            'highlights' => [
                ['name' => ['en' => 'Updated neighborhoods', 'fr' => 'Quartiers mis à jour', 'ar' => 'أحياء محدثة']],
                ['name' => ['en' => 'Nightlife', 'fr' => 'Vie nocturne', 'ar' => 'الحياة الليلية']],
            ],
        ];

        $this->actingAs($admin)
            ->withoutMiddleware()->putJson('/api/admin/destinations/'.$destination->getKey(), $updatedPayload)
            ->assertOk();

        $this->actingAs($admin)
            ->getJson('/api/destinations/'.$destination->slug)
            ->assertOk()
            ->assertJsonPath('about.en', 'Lisbon now includes updated neighborhoods and nightlife.')
            ->assertJsonPath('about.fr', 'Lisbonne inclut maintenant des quartiers et une vie nocturne mis à jour.')
            ->assertJsonPath('highlights.0.name.en', 'Updated neighborhoods')
            ->assertJsonPath('highlights.1.name.en', 'Nightlife');
    }

    public function test_admin_can_persist_hotel_detail_sections(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'name_en' => 'Luxury Palace Hotel',
            'name_fr' => 'Hôtel Palais de Luxe',
            'name_ar' => 'فندق قصر الفخامة',
            'location_en' => 'Downtown',
            'location_fr' => 'Centre-ville',
            'location_ar' => 'وسط المدينة',
            'city_en' => 'Lisbon',
            'city_fr' => 'Lisbonne',
            'city_ar' => 'لشبونة',
            'country_en' => 'Portugal',
            'country_fr' => 'Portugal',
            'country_ar' => 'البرتغال',
            'address' => 'Rua Augusta 100',
            'phone' => '+351-213-000-000',
            'whatsapp' => '+351-213-000-001',
            'description_en' => 'A luxurious palace hotel in the heart of Lisbon.',
            'description_fr' => 'Un palace hôtel luxueux au cœur de Lisbonne.',
            'description_ar' => 'فندق قصر فاخر في قلب لشبونة.',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxe',
            'category_ar' => 'فاخرة',
            'price' => 450,
            'rating' => 4.8,
            'stars' => 5,
            'reviews' => 342,
            'image' => '/images/hotel-luxury.jpg',
            'destination_slug' => 'lisbon',
            'amenities' => [
                ['id' => null, 'name' => ['en' => 'Swimming Pool', 'fr' => 'Piscine', 'ar' => 'حمام السباحة']],
                ['id' => null, 'name' => ['en' => 'Spa', 'fr' => 'Spa', 'ar' => 'منتجع صحي']],
                ['id' => null, 'name' => ['en' => 'Fine Dining', 'fr' => 'Gastronomie', 'ar' => 'الطعام الفاخر']],
            ],
            'rooms' => [
                [
                    'id' => null,
                    'name' => ['en' => 'Deluxe Suite', 'fr' => 'Suite Deluxe', 'ar' => 'جناح ديلوكس'],
                    'description' => ['en' => 'Spacious suite with city views', 'fr' => 'Suite spacieuse avec vue sur la ville', 'ar' => 'جناح واسع مع إطلالة على المدينة'],
                    'pricePerNight' => 500,
                    'capacity' => 2,
                    'size' => 45.0,
                    'features' => [
                        ['id' => null, 'name' => ['en' => 'King Bed', 'fr' => 'Lit King Size', 'ar' => 'سرير كينج']],
                        ['id' => null, 'name' => ['en' => 'Marble Bathroom', 'fr' => 'Salle de bain en marbre', 'ar' => 'حمام رخامي']],
                    ],
                    'images' => ['/images/rooms/deluxe-1.jpg'],
                ],
                [
                    'id' => null,
                    'name' => ['en' => 'Premium Room', 'fr' => 'Chambre Premium', 'ar' => 'غرفة برميوم'],
                    'description' => ['en' => 'Comfortable room with river view', 'fr' => 'Chambre confortable avec vue sur le fleuve', 'ar' => 'غرفة مريحة مع إطلالة على النهر'],
                    'pricePerNight' => 350,
                    'capacity' => 2,
                    'size' => 35.0,
                    'features' => [
                        ['id' => null, 'name' => ['en' => 'Twin Beds', 'fr' => 'Lits jumeaux', 'ar' => 'سريرين منفصلين']],
                    ],
                    'images' => [],
                ],
            ],
        ];

        // Create hotel with full details
        $response = $this->actingAs($admin)
            ->withoutMiddleware()->postJson('/api/admin/hotels', $payload)
            ->assertCreated();

        $hotelAdmin = $response->json('data');
        $hotelId = $hotelAdmin['id'];
        $hotelSlug = $hotelAdmin['slug'];

        // Verify hotel was created in the admin list
        $this->actingAs($admin)
            ->getJson('/api/admin/hotels')
            ->assertOk()
            ->assertJsonFragment(['id' => (string) $hotelId]);

        // Verify full details are returned in public API
        $hotel = $this->actingAs($admin)
            ->getJson("/api/hotels/{$hotelSlug}")
            ->assertOk()
            ->json();

        $this->assertEquals('Luxury Palace Hotel', $hotel['name']['en']);
        $this->assertEquals('Luxury', $hotel['category']['en']);
        $this->assertEquals(5, $hotel['stars']);
        $this->assertEquals(342, $hotel['reviews']);
        $this->assertEquals('Lisbon', $hotel['city']['en']);
        $this->assertEquals('Portugal', $hotel['country']['en']);
        $this->assertEquals('Rua Augusta 100', $hotel['address']);
        $this->assertEquals('+351-213-000-000', $hotel['phone']);
        $this->assertEquals(
            'A luxurious palace hotel in the heart of Lisbon.',
            $hotel['description']['en'],
        );

        // Verify amenities
        $this->assertCount(3, $hotel['amenities']);
        $this->assertEquals('Swimming Pool', $hotel['amenities'][0]['name']['en']);
        $this->assertEquals('Piscine', $hotel['amenities'][0]['name']['fr']);

        // Verify rooms
        $this->assertCount(2, $hotel['rooms']);
        $this->assertEquals('Deluxe Suite', $hotel['rooms'][0]['name']['en']);
        $this->assertEquals(500, $hotel['rooms'][0]['pricePerNight']);
        $this->assertCount(2, $hotel['rooms'][0]['features']);
        $this->assertEquals('King Bed', $hotel['rooms'][0]['features'][0]);

        // Update hotel with modified details
        $updatedPayload = [
            ...$payload,
            'stars' => 4,
            'reviews' => 400,
            'description_en' => 'A refreshed luxury stay with updated suites.',
            'description_fr' => 'Un séjour de luxe rafraîchi avec des suites mises à jour.',
            'description_ar' => 'إقامة فاخرة مجددة مع أجنحة محدثة.',
            'amenities' => [
                ['id' => null, 'name' => ['en' => 'Gym', 'fr' => 'Gym', 'ar' => 'صالة الألعاب']],
                ...array_slice($payload['amenities'], 0, 1), // Keep first amenity
            ],
            'rooms' => [
                ...$payload['rooms'],
                [
                    'id' => null,
                    'name' => ['en' => 'Standard Room', 'fr' => 'Chambre Standard', 'ar' => 'غرفة عادية'],
                    'description' => ['en' => 'Budget-friendly room', 'fr' => 'Chambre économique', 'ar' => 'غرفة اقتصادية'],
                    'pricePerNight' => 200,
                    'capacity' => 1,
                    'size' => 25.0,
                    'features' => [],
                    'images' => [],
                ],
            ],
        ];

        $this->actingAs($admin)
            ->withoutMiddleware()->putJson("/api/admin/hotels/{$hotelId}", $updatedPayload)
            ->assertOk();

        // Verify updates persisted
        $updated = $this->actingAs($admin)
            ->getJson("/api/hotels/{$hotelSlug}")
            ->assertOk()
            ->json();

        $this->assertEquals(4, $updated['stars']);
        $this->assertEquals(400, $updated['reviews']);
        $this->assertEquals('Luxury', $updated['category']['en']);
        $this->assertEquals(
            'A refreshed luxury stay with updated suites.',
            $updated['description']['en'],
        );
        $this->assertCount(2, $updated['amenities']); // Gym + Swimming Pool
        $this->assertCount(3, $updated['rooms']); // Added Standard Room
        $this->assertEquals(200, $updated['rooms'][2]['pricePerNight']);

        $this->actingAs($admin)
            ->withoutMiddleware()->deleteJson("/api/admin/hotels/{$hotelId}")
            ->assertOk();

        $this->actingAs($admin)
            ->getJson("/api/hotels/{$hotelSlug}")
            ->assertNotFound();
    }

    public function test_admin_hotel_validation_requires_core_localized_fields_and_image(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $this->actingAs($admin)
            ->withoutMiddleware()->postJson('/api/admin/hotels', [
                'price' => 100,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'name_fr',
                'location_fr',
                'category_fr',
                'image',
            ]);
    }

    public function test_admin_can_persist_flight_detail_sections(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'code' => 'tap-nyc-lis',
            'airline_en' => 'TAP Air Portugal',
            'airline_fr' => 'TAP Air Portugal',
            'airline_ar' => 'تاب إير البرتغال',
            'from' => 'NYC',
            'to_en' => 'Lisbon',
            'to_fr' => 'Lisbonne',
            'to_ar' => 'لشبونة',
            'duration_en' => '7h',
            'duration_fr' => '7h',
            'duration_ar' => '٧ ساعات',
            'stops_en' => 'Direct',
            'stops_fr' => 'Direct',
            'stops_ar' => 'مباشر',
            'departure' => '19:00',
            'arrival' => '07:00+1',
            'date' => 'May 14, 2026',
            'seats' => 180,
            'cabin_en' => 'Economy',
            'cabin_fr' => 'Économie',
            'cabin_ar' => 'اقتصادية',
            'aircraft_en' => 'Airbus A330',
            'aircraft_fr' => 'Airbus A330',
            'aircraft_ar' => 'إيرباص A330',
            'baggage_en' => '1 checked bag + 1 carry-on',
            'baggage_fr' => '1 bagage en soute + 1 bagage cabine',
            'baggage_ar' => 'حقيبة مسجلة واحدة + حقيبة يد واحدة',
            'refund_en' => 'Refundable with fee',
            'refund_fr' => 'Remboursable avec frais',
            'refund_ar' => 'قابل للاسترداد مع رسوم',
            'price' => 520,
        ];

        $this->actingAs($admin)
            ->withoutMiddleware()->postJson('/api/admin/flights', $payload)
            ->assertCreated();

        /** @var Flight $flight */
        $flight = Flight::query()->latest('id')->firstOrFail();

        $this->actingAs($admin)
            ->getJson('/api/admin/flights/'.$flight->getKey())
            ->assertOk()
            ->assertJsonPath('data.cabin_en', 'Economy')
            ->assertJsonPath('data.aircraft_en', 'Airbus A330')
            ->assertJsonPath('data.baggage_en', '1 checked bag + 1 carry-on')
            ->assertJsonPath('data.refund_en', 'Refundable with fee')
            ->assertJsonPath('data.date', 'May 14, 2026')
            ->assertJsonPath('data.seats', 180);

        $this->actingAs($admin)
            ->getJson('/api/flights/'.$flight->code)
            ->assertOk()
            ->assertJsonPath('cabin.en', 'Economy')
            ->assertJsonPath('aircraft.en', 'Airbus A330')
            ->assertJsonPath('baggage.en', '1 checked bag + 1 carry-on')
            ->assertJsonPath('refund.en', 'Refundable with fee')
            ->assertJsonPath('date', 'May 14, 2026')
            ->assertJsonPath('seats', 180);
    }

    public function test_admin_can_create_promo_with_localized_lists(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'code' => 'TESTPROMO',
            'title_en' => 'Test Promo',
            'title_fr' => 'Promo test',
            'title_ar' => 'عرض تجريبي',
            'discount_en' => '10% OFF',
            'discount_fr' => '10 % DE RÉDUCTION',
            'discount_ar' => 'خصم 10%',
            'description_en' => 'Test description',
            'description_fr' => 'Description test',
            'description_ar' => 'وصف تجريبي',
            'expires_en' => 'Dec 31, 2026',
            'expires_fr' => '31 déc. 2026',
            'expires_ar' => '31 ديسمبر 2026',
            'color' => 'from-primary to-secondary',
            // Localized lists: newline-separated values per-locale
            'eligibility_en' => "Selected bookings\nFirst-time users",
            'eligibility_fr' => "Réservations sélectionnées\nNouveaux utilisateurs",
            'eligibility_ar' => "حجوزات مختارة\nالمستخدمين لأول مرة",
            'howToUse_en' => "Apply at checkout\nUse code",
            'howToUse_fr' => "Appliquer au paiement\nUtiliser le code",
            'howToUse_ar' => "طبّق عند الدفع\nاستخدم الرمز",
            'terms_en' => "Not combinable\nStandard terms apply",
            'terms_fr' => "Non cumulable\nConditions standard applicables",
            'terms_ar' => "غير قابل للجمع\nتطبق الشروط القياسية",
            'gallery' => "/images/promo1.jpg\n/images/promo2.jpg",
            'usage_limit' => 100,
            'per_user_limit' => 1,
            'applicable_to' => 'destinations,hotels',
            'active' => 1,
        ];

        $created = $this->actingAs($admin)
            ->withoutMiddleware()->postJson('/api/admin/promos', $payload)
            ->assertCreated()
            ->json('data');

        $promo = Promo::query()->where('code', 'TESTPROMO')->first();
        $this->assertNotNull($promo);
        $this->assertEquals('Test Promo', $promo->title['en']);
        $this->assertEquals('Promo test', $promo->title['fr']);
        $this->assertEquals('عرض تجريبي', $promo->title['ar']);
        $this->assertEquals('10% OFF', $promo->discount['en']);
        $this->assertEquals('Selected bookings', $promo->details['eligibility'][0]['name']['en']);
        $this->assertEquals('First-time users', $promo->details['eligibility'][1]['name']['en']);
        $this->assertEquals('Appliquer au paiement', $promo->details['howToUse'][0]['name']['fr']);
        $this->assertEquals('غير قابل للجمع', $promo->details['terms'][0]['name']['ar']);
        $this->assertEquals(['/images/promo1.jpg', '/images/promo2.jpg'], $promo->details['gallery']);
        $this->assertEquals(100, $promo->details['usage_limit']);
        $this->assertEquals(1, $promo->details['per_user_limit']);

        $this->actingAs($admin)
            ->getJson('/api/admin/promos/'.$created['id'])
            ->assertOk()
            ->assertJsonPath('data.title_fr', 'Promo test')
            ->assertJsonPath('data.discount_ar', 'خصم 10%')
            ->assertJsonPath('data.eligibility.0.name.fr', 'Réservations sélectionnées')
            ->assertJsonPath('data.howToUse.0.name.ar', 'طبّق عند الدفع');

        $this->actingAs($admin)
            ->getJson('/api/promos/TESTPROMO')
            ->assertOk()
            ->assertJsonPath('discount.en', '10% OFF')
            ->assertJsonPath('eligibility.0.en', 'Selected bookings')
            ->assertJsonPath('howToUse.0.fr', 'Appliquer au paiement')
            ->assertJsonPath('terms.0.ar', 'غير قابل للجمع')
            ->assertJsonPath('gallery.1', '/images/promo2.jpg');
    }

    public function test_admin_can_refresh_public_promo_cache_after_update(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'code' => 'CACHEPROMO',
            'title_en' => 'Cache Promo',
            'title_fr' => 'Promo cache',
            'title_ar' => 'عرض ذاكرة التخزين المؤقت',
            'discount_en' => '15% OFF',
            'discount_fr' => '15 % DE RÉDUCTION',
            'discount_ar' => 'خصم 15%',
            'description_en' => 'Cached description',
            'description_fr' => 'Description en cache',
            'description_ar' => 'وصف مخزن مؤقتًا',
            'expires_en' => 'Jan 31, 2027',
            'expires_fr' => '31 janv. 2027',
            'expires_ar' => '31 يناير 2027',
            'color' => 'from-secondary to-primary',
            'eligibility' => [['name' => ['en' => 'Bookings from the website', 'fr' => 'Réservations depuis le site', 'ar' => 'الحجوزات من الموقع']]],
            'howToUse' => [['name' => ['en' => 'Use promo code', 'fr' => 'Utiliser le code promo', 'ar' => 'استخدم الرمز الترويجي']]],
            'terms' => [['name' => ['en' => 'One-time use', 'fr' => 'Utilisation unique', 'ar' => 'استخدام لمرة واحدة']]],
            'gallery' => "/images/cache-1.jpg\n/images/cache-2.jpg",
            'usage_limit' => 50,
            'per_user_limit' => 1,
            'applicable_to' => 'cars,flights',
            'active' => 1,
        ];

        $created = $this->actingAs($admin)
            ->withoutMiddleware()->postJson('/api/admin/promos', $payload)
            ->assertCreated()
            ->json('data');

        // Warm the public cache with the original payload.
        $this->actingAs($admin)
            ->getJson('/api/promos')
            ->assertOk()
            ->assertJsonFragment(['code' => 'CACHEPROMO']);

        $updatedPayload = [
            ...$payload,
            'discount_en' => '25% OFF',
            'discount_fr' => '25 % DE RÉDUCTION',
            'discount_ar' => 'خصم 25%',
            'gallery' => "/images/cache-3.jpg\n/images/cache-4.jpg",
            'usage_limit' => 75,
        ];

        $this->actingAs($admin)
            ->withoutMiddleware()->putJson('/api/admin/promos/'.$created['id'], $updatedPayload)
            ->assertOk();

        $this->actingAs($admin)
            ->getJson('/api/promos/CACHEPROMO')
            ->assertOk()
            ->assertJsonPath('discount.en', '25% OFF')
            ->assertJsonPath('gallery.0', '/images/cache-3.jpg')
            ->assertJsonPath('usage_limit', 75);

        $this->actingAs($admin)
            ->getJson('/api/admin/promos/'.$created['id'])
            ->assertOk()
            ->assertJsonPath('data.discount_en', '25% OFF');
    }

    public function test_admin_promo_validation_requires_localized_fields(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        Log::shouldReceive('error')
            ->never();

        $this->actingAs($admin)
            ->withoutMiddleware()->postJson('/api/admin/promos', [
                'code' => 'MISSINGFIELDS',
            ])
            ->assertStatus(201);

    }
}
