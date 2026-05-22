<?php

namespace Tests\Feature;

use App\Models\Car;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminCarsTest extends TestCase
{
    use RefreshDatabase;

    private function seedCarCategories(): void
    {
        Category::query()->create([
            'entity_type' => 'cars',
            'key' => 'electric',
            'name' => ['en' => 'Electric', 'fr' => 'Électrique', 'ar' => 'كهربائي'],
        ]);

        Category::query()->create([
            'entity_type' => 'cars',
            'key' => 'luxury',
            'name' => ['en' => 'Luxury', 'fr' => 'Luxe', 'ar' => 'فاخرة'],
        ]);
    }

    public function test_admin_can_create_car_with_detail_sections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->seedCarCategories();

        $payload = [
            'name_en' => 'Tesla Model 3',
            'name_fr' => 'Tesla Model 3',
            'name_ar' => 'تسلا موديل 3',
            'category_key' => 'electric',
            'price' => 80,
            'seats' => 5,
            'fuel_en' => 'Electric',
            'fuel_fr' => 'Électrique',
            'fuel_ar' => 'كهربائي',
            'transmission_en' => 'Automatic',
            'transmission_fr' => 'Automatique',
            'transmission_ar' => 'أوتوماتيكي',
            'description_en' => 'Premium electric vehicle',
            'description_fr' => 'Véhicule électrique premium',
            'description_ar' => 'مركبة كهربائية فاخرة',
            'gallery' => "/images/tesla1.jpg\n/images/tesla2.jpg",
            'features' => [
                ['name' => ['en' => 'Fast charging', 'fr' => 'Charge rapide', 'ar' => 'شحن سريع']],
                ['name' => ['en' => 'Auto-pilot', 'fr' => 'Auto-pilote', 'ar' => 'الطيار الآلي']],
            ],
            'policy' => [
                ['name' => ['en' => 'Age 21+', 'fr' => 'Âge 21+', 'ar' => 'العمر 21+']],
            ],
        ];

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/cars', $payload);

        $response->assertCreated()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'category_key',
                    'name_en',
                    'category_en',
                    'price',
                    'seats',
                    'fuel_en',
                    'transmission_en',
                    'description_en',
                    'gallery',
                    'features',
                    'policy',
                ],
            ]);

        $car = Car::latest()->first();
        $this->assertNotNull($car);
        $this->assertEquals('Tesla Model 3', $car->name['en']);
        $this->assertSame('electric', $car->category_key);
        $this->assertEquals(['en' => 'Electric', 'fr' => 'Électrique', 'ar' => 'كهربائي'], $car->category);
        $this->assertEquals(80, $car->price);
        $this->assertEquals(5, $car->seats);

        // Verify detail sections
        $this->assertIsArray($car->details['gallery']);
        $this->assertCount(2, $car->details['gallery']);
        $this->assertContains('/images/tesla1.jpg', $car->details['gallery']);
        $this->assertContains('/images/tesla2.jpg', $car->details['gallery']);

        $this->assertIsArray($car->details['features']);
        $this->assertCount(2, $car->details['features']);
        $this->assertEquals('Fast charging', $car->details['features'][0]['name']['en']);

        $this->assertIsArray($car->details['policy']);
        $this->assertCount(1, $car->details['policy']);
        $this->assertEquals('Age 21+', $car->details['policy'][0]['name']['en']);
    }

    public function test_admin_can_update_car_detail_sections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->seedCarCategories();
        $car = Car::factory()->create([
            'category_key' => 'electric',
            'category' => ['en' => 'Electric', 'fr' => 'Électrique', 'ar' => 'كهربائي'],
            'details' => [
                'gallery' => ['/old1.jpg', '/old2.jpg'],
                'features' => [['name' => ['en' => 'Old feature', 'fr' => 'Old feature', 'ar' => 'Old feature']]],
                'policy' => [['name' => ['en' => 'Old policy', 'fr' => 'Old policy', 'ar' => 'Old policy']]],
            ],
        ]);

        $payload = [
            'name_en' => 'Updated Car',
            'name_fr' => 'Voiture Mise à Jour',
            'name_ar' => 'سيارة محدثة',
            'category_key' => 'luxury',
            'price' => 150,
            'seats' => 5,
            'fuel_en' => 'Petrol',
            'fuel_fr' => 'Essence',
            'fuel_ar' => 'بنزين',
            'transmission_en' => 'Manual',
            'transmission_fr' => 'Manuelle',
            'transmission_ar' => 'يدوي',
            'description_en' => 'Updated description',
            'description_fr' => 'Description mise à jour',
            'description_ar' => 'وصف محدث',
            'gallery' => "/images/new1.jpg\n/images/new2.jpg\n/images/new3.jpg",
            'features' => [
                ['name' => ['en' => 'New feature 1', 'fr' => 'New feature 1', 'ar' => 'New feature 1']],
                ['name' => ['en' => 'New feature 2', 'fr' => 'New feature 2', 'ar' => 'New feature 2']],
            ],
            'policy' => [
                ['name' => ['en' => 'New policy 1', 'fr' => 'New policy 1', 'ar' => 'New policy 1']],
            ],
        ];

        $response = $this->actingAs($admin)
            ->putJson("/api/admin/cars/{$car->id}", $payload);

        $response->assertOk();

        $car->refresh();
        $this->assertEquals('Updated Car', $car->name['en']);
    $this->assertSame('luxury', $car->category_key);
        $this->assertEquals(150, $car->price);

        // Verify detail sections updated
        $this->assertCount(3, $car->details['gallery']);
        $this->assertContains('/images/new1.jpg', $car->details['gallery']);

        $this->assertCount(2, $car->details['features']);
        $this->assertEquals('New feature 1', $car->details['features'][0]['name']['en']);

        $this->assertCount(1, $car->details['policy']);
        $this->assertEquals('New policy 1', $car->details['policy'][0]['name']['en']);
    }

    public function test_admin_can_retrieve_car_with_detail_sections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->seedCarCategories();
        $car = Car::factory()->create([
            'category_key' => 'luxury',
            'name' => ['en' => 'Mercedes', 'fr' => 'Mercedes', 'ar' => 'مرسيدس'],
            'category' => ['en' => 'Luxury', 'fr' => 'Luxe', 'ar' => 'فاخرة'],
            'details' => [
                'description' => ['en' => 'Premium sedan', 'fr' => 'Berline premium', 'ar' => 'سيدان فاخر'],
                'gallery' => ['/images/merc1.jpg', '/images/merc2.jpg'],
                'features' => [
                    ['name' => ['en' => 'Leather seats', 'fr' => 'Leather seats', 'ar' => 'Leather seats']],
                ],
                'policy' => [
                    ['name' => ['en' => 'Age 25+', 'fr' => 'Age 25+', 'ar' => 'Age 25+']],
                ],
            ],
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/api/admin/cars/{$car->id}");

        $response->assertOk()
            ->assertJson([
                'data' => [
                    'id' => (string) $car->id,
                    'category_key' => 'luxury',
                    'name_en' => 'Mercedes',
                    'category_en' => 'Luxury',
                    'description_en' => 'Premium sedan',
                    'gallery' => ['/images/merc1.jpg', '/images/merc2.jpg'],
                    'features' => [['name' => ['en' => 'Leather seats', 'fr' => 'Leather seats', 'ar' => 'Leather seats']]],
                    'policy' => [['name' => ['en' => 'Age 25+', 'fr' => 'Age 25+', 'ar' => 'Age 25+']]],
                ],
            ]);
    }

    public function test_admin_can_list_cars_with_detail_sections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->seedCarCategories();
        Car::factory()->count(3)->create([
            'category_key' => 'luxury',
            'category' => ['en' => 'Luxury', 'fr' => 'Luxe', 'ar' => 'فاخرة'],
            'details' => [
                'gallery' => ['/img1.jpg'],
                'features' => [['name' => ['en' => 'Feature A', 'fr' => 'Feature A', 'ar' => 'Feature A']]],
                'policy' => [['name' => ['en' => 'Policy A', 'fr' => 'Policy A', 'ar' => 'Policy A']]],
            ],
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/cars');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'category_key',
                        'name_en',
                        'gallery',
                        'features',
                        'policy',
                    ],
                ],
            ]);

        $this->assertCount(3, $response['data']);
    }

    public function test_admin_can_list_cars_when_category_is_stored_as_json_string(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->seedCarCategories();
        $car = Car::factory()->create([
            'category_key' => 'luxury',
            'category' => ['en' => 'Luxury', 'fr' => 'Luxe', 'ar' => 'فاخرة'],
        ]);

        DB::table('cars')
            ->where('id', $car->id)
            ->update(['category' => '{"en":"Luxury","fr":"Luxe","ar":"فاخرة"}']);

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/cars');

        $response->assertOk()
            ->assertJsonFragment([
                'id' => (string) $car->id,
                'category_key' => 'luxury',
                'category' => 'Luxury',
                'category_fr' => 'Luxe',
                'category_ar' => 'فاخرة',
                'category_en' => 'Luxury',
            ]);
    }

    public function test_admin_partial_update_preserves_existing_details(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $car = Car::factory()->create([
            'details' => [
                'gallery' => ['/old.jpg'],
                'features' => [['name' => ['en' => 'Existing feature', 'fr' => 'Existing feature', 'ar' => 'Existing feature']]],
                'policy' => [['name' => ['en' => 'Existing policy', 'fr' => 'Existing policy', 'ar' => 'Existing policy']]],
            ],
        ]);

        // Only update price and gallery, keep features and policy
        $payload = [
            'price' => 200,
            'gallery' => "/images/new1.jpg\n/images/new2.jpg",
        ];

        $response = $this->actingAs($admin)
            ->putJson("/api/admin/cars/{$car->id}", $payload);

        $response->assertOk();

        $car->refresh();
        $this->assertEquals(200, $car->price);
        $this->assertCount(2, $car->details['gallery']);
        $this->assertContains('/images/new1.jpg', $car->details['gallery']);

        // Features and policy should be preserved
        $this->assertCount(1, $car->details['features']);
        $this->assertEquals('Existing feature', $car->details['features'][0]['name']['en']);
        $this->assertCount(1, $car->details['policy']);
    }

    public function test_admin_create_and_update_invalidate_public_car_cache(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $car = Car::factory()->create([
            'slug' => 'cache-test-car',
        ]);

        Cache::spy();

        $createPayload = [
            'name_en' => 'Cache Test Car',
            'name_fr' => 'Cache Test Car',
            'name_ar' => 'Cache Test Car',
            'category_en' => 'Luxury',
            'category_fr' => 'Luxury',
            'category_ar' => 'Luxury',
            'price' => 100,
            'seats' => 4,
            'fuel_en' => 'Petrol',
            'fuel_fr' => 'Petrol',
            'fuel_ar' => 'Petrol',
            'transmission_en' => 'Automatic',
            'transmission_fr' => 'Automatic',
            'transmission_ar' => 'Automatic',
        ];

        $this->actingAs($admin)
            ->postJson('/api/admin/cars', $createPayload)
            ->assertCreated();

        Cache::shouldHaveReceived('forget')->with('admin.entity.cars');
        Cache::shouldHaveReceived('forget')->with('cars.index');

        $this->actingAs($admin)
            ->putJson("/api/admin/cars/{$car->id}", [
                'name_en' => 'Cache Test Car Updated',
            ])
            ->assertOk();

        Cache::shouldHaveReceived('forget')->with('cars.cache-test-car');
    }
}
