<?php

namespace Database\Seeders;

use App\Models\Amenity;
use App\Models\BlogPost;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CategoryType;
use App\Models\CategoryValue;
use App\Models\Complaint;
use App\Models\Deal;
use App\Models\Destination;
use App\Models\EntityCategoryAssignment;
use App\Models\Event;
use App\Models\Flight;
use App\Models\GalleryImage;
use App\Models\Hotel;
use App\Models\HotelRoom;
use App\Models\Partner;
use App\Models\Promo;
use App\Models\SiteSetting;
use App\Models\SupportInquiry;
use App\Models\Team;
use App\Models\Tour;
use App\Models\Travel;
use App\Models\User;
use App\Models\Visa;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class TestDataSeeder extends Seeder
{
    private function loc(string $en, ?string $fr = null, ?string $ar = null): array
    {
        return [
            'en' => $en,
            'fr' => $fr ?? $en,
            'ar' => $ar ?? $en,
        ];
    }

    private function img(string $id, int $w = 800, int $h = 500): string
    {
        return "https://images.unsplash.com/{$id}?w={$w}&h={$h}&fit=crop&q=80";
    }

    public function run(): void
    {
        $this->seedCategoryTypesAndValues();
        $this->seedAmenities();
        $this->seedDestinations();
        $this->seedHotels();
        $this->seedTours();
        $this->seedTravels();
        $this->seedCars();
        $this->seedFlights();
        $this->seedEvents();
        $this->seedDeals();
        $this->seedBlogPosts();
        $this->seedPromos();
        $this->seedVisas();
        $this->seedTeams();
        $this->seedPartners();
        $this->seedGalleryImages();
        $this->seedSiteSettings();
        $this->seedUsers();
        $this->seedBookings();
        $this->seedSupportInquiries();
        $this->seedComplaints();
        $this->seedFilterBooleans();
        $this->clearCaches();
    }

    // ─── Category Types & Values ───────────────────────────────────────

    private function seedCategoryTypesAndValues(): void
    {
        $types = [
            // Hotels
            ['entity_type' => 'hotels', 'key' => 'pricing_type', 'label' => $this->loc('Pricing Type', 'Type de tarif', 'نوع التسعير'), 'filter_style' => 'pills', 'locked' => true, 'values' => [
                ['key' => 'all-inclusive', 'name' => $this->loc('All Inclusive', 'Tout inclus', 'شامل كل شيء')],
                ['key' => 'half-board', 'name' => $this->loc('Half Board', 'Demi pension', 'إجازة نصف')],
                ['key' => 'bed-breakfast', 'name' => $this->loc('Bed & Breakfast', 'Petit déjeuner inclus', 'فطور')],
                ['key' => 'room-only', 'name' => $this->loc('Room Only', 'Chambre seulement', 'غرفة فقط')],
            ]],
            // Tours
            ['entity_type' => 'tours', 'key' => 'pricing_type', 'label' => $this->loc('Pricing Type', 'Type de tarif', 'نوع التسعير'), 'filter_style' => 'pills', 'locked' => true, 'values' => [
                ['key' => 'per-person', 'name' => $this->loc('Per Person', 'Par personne', 'لكل فرد')],
                ['key' => 'per-group', 'name' => $this->loc('Per Group', 'Par groupe', 'للمجموعة')],
            ]],
            // Travels
            ['entity_type' => 'travels', 'key' => 'pricing_type', 'label' => $this->loc('Pricing Type', 'Type de tarif', 'نوع التسعير'), 'filter_style' => 'pills', 'locked' => true, 'values' => [
                ['key' => 'per-person', 'name' => $this->loc('Per Person', 'Par personne', 'لكل فرد')],
                ['key' => 'per-group', 'name' => $this->loc('Per Group', 'Par groupe', 'للمجموعة')],
            ]],
            // Destinations
            ['entity_type' => 'destinations', 'key' => 'region', 'label' => $this->loc('Region', 'Région', 'المنطقة'), 'filter_style' => 'pills', 'values' => [
                ['key' => 'north-africa', 'name' => $this->loc('North Africa', 'Afrique du Nord', 'شمال أفريقيا')],
                ['key' => 'middle-east', 'name' => $this->loc('Middle East', 'Moyen-Orient', 'الشرق الأوسط')],
                ['key' => 'europe', 'name' => $this->loc('Europe', 'Europe', 'أوروبا')],
                ['key' => 'asia', 'name' => $this->loc('Asia', 'Asie', 'آسيا')],
                ['key' => 'africa', 'name' => $this->loc('Africa', 'Afrique', 'أفريقيا')],
            ]],
            // Cars
            ['entity_type' => 'cars', 'key' => 'transmission_type', 'label' => $this->loc('Transmission', 'Transmission', 'ناقل الحركة'), 'filter_style' => 'pills', 'values' => [
                ['key' => 'automatic', 'name' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك')],
                ['key' => 'manual', 'name' => $this->loc('Manual', 'Manuelle', 'يدوي')],
            ]],
            // Events
            ['entity_type' => 'events', 'key' => 'event_type', 'label' => $this->loc('Event Type', "Type d'événement", 'نوع الحدث'), 'filter_style' => 'pills', 'values' => [
                ['key' => 'cultural', 'name' => $this->loc('Cultural', 'Culturel', 'ثقافي')],
                ['key' => 'festival', 'name' => $this->loc('Festival', 'Festival', 'مهرجان')],
                ['key' => 'sport', 'name' => $this->loc('Sport', 'Sport', 'رياضي')],
            ]],
            // Deals
            ['entity_type' => 'deals', 'key' => 'deal_type', 'label' => $this->loc('Deal Type', 'Type de offre', 'نوع العرض'), 'filter_style' => 'pills', 'values' => [
                ['key' => 'flash-sale', 'name' => $this->loc('Flash Sale', 'Vente flash', 'تخفيض سريع')],
                ['key' => 'seasonal', 'name' => $this->loc('Seasonal', 'Saisonnier', 'موسمي')],
                ['key' => 'bundle', 'name' => $this->loc('Bundle', 'Pack', 'حزمة')],
            ]],
            // Blog
            ['entity_type' => 'blog', 'key' => 'blog_category', 'label' => $this->loc('Category', 'Catégorie', 'الفئة'), 'filter_style' => 'pills', 'values' => [
                ['key' => 'travel-tips', 'name' => $this->loc('Travel Tips', 'Conseils voyage', 'نصائح السفر')],
                ['key' => 'destination-guide', 'name' => $this->loc('Destination Guide', 'Guide destination', 'دليل الوجهة')],
                ['key' => 'news', 'name' => $this->loc('News', 'Actualités', 'أخبار')],
            ]],
        ];

        foreach ($types as $typeData) {
            $values = $typeData['values'] ?? [];
            unset($typeData['values']);

            $type = CategoryType::updateOrCreate(
                ['entity_type' => $typeData['entity_type'], 'key' => $typeData['key']],
                $typeData
            );

            foreach ($values as $valueData) {
                CategoryValue::updateOrCreate(
                    ['category_type_id' => $type->id, 'key' => $valueData['key']],
                    $valueData
                );
            }
        }
    }

    // ─── Amenities ─────────────────────────────────────────────────────

    private function seedAmenities(): void
    {
        $amenities = [
            ['name' => $this->loc('Swimming Pool', 'Piscine', 'مسبح'), 'icon' => 'pool'],
            ['name' => $this->loc('Spa & Wellness', 'Spa & Bien-être', 'سبا وعافية'), 'icon' => 'pool'],
            ['name' => $this->loc('Fitness Center', 'Salle de sport', 'صالة رياضية'), 'icon' => 'gym'],
            ['name' => $this->loc('Restaurant', 'Restaurant', 'مطعم'), 'icon' => 'restaurant'],
            ['name' => $this->loc('Free WiFi', 'WiFi gratuit', 'واي فاي مجاني'), 'icon' => 'wifi'],
            ['name' => $this->loc('Private Beach', 'Plage privée', 'شاطئ خاص'), 'icon' => 'pool'],
            ['name' => $this->loc('Bar & Lounge', 'Bar & Salon', 'بار وصالة'), 'icon' => 'restaurant'],
            ['name' => $this->loc('Sauna', 'Sauna', 'ساونا'), 'icon' => 'gym'],
            ['name' => $this->loc('Kids Club', 'Club enfants', 'نادي الأطفال'), 'icon' => 'group'],
            ['name' => $this->loc('Free Parking', 'Parking gratuit', 'موقف مجاني'), 'icon' => 'car'],
            ['name' => $this->loc('Tennis Court', 'Court de tennis', 'ملعب تنس'), 'icon' => 'gym'],
            ['name' => $this->loc('Golf Course', 'Golf', 'ملعب غولف'), 'icon' => 'gym'],
            ['name' => $this->loc('Water Sports', 'Sports nautiques', 'رياضات مائية'), 'icon' => 'pool'],
            ['name' => $this->loc('Airport Shuttle', 'Navette aéroport', 'خدمة نقل المطار'), 'icon' => 'car'],
            ['name' => $this->loc('Room Service', 'Room service', 'خدمة الغرف'), 'icon' => 'restaurant'],
        ];

        foreach ($amenities as $amenity) {
            Amenity::updateOrCreate($amenity);
        }
    }

    // ─── Destinations ──────────────────────────────────────────────────

    private function seedDestinations(): void
    {
        $destinations = [
            ['slug' => 'hammamet', 'category_key' => 'north-africa', 'price' => 890, 'rating' => 4.5,
                'name' => $this->loc('Hammamet', 'Hammamet', 'الحمامات'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc('A beautiful coastal city known for its sandy beaches and historic medina.', 'Une magnifique ville côtière connue pour ses plages de sable et sa médina historique.', 'مدينة ساحلية جميلة تشتهر بشواطئها الرملية ومدينتها القديمة.'),
                'image' => $this->img('photo-1565711561500-49678a10a63f', 800, 500),
            ],
            ['slug' => 'sousse', 'category_key' => 'north-africa', 'price' => 780, 'rating' => 4.3,
                'name' => $this->loc('Sousse', 'Sousse', 'سوسة'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc('A vibrant city with a UNESCO-listed medina and beautiful coastline.', 'Une ville dynamique avec une médina classée à l\'UNESCO et une belle côte.', 'مدينة نابضة بالحياة بمدينة عتيقة مدرجة في قائمة اليونسكو وساحل جميل.'),
                'image' => $this->img('photo-1570077188670-e3a8d69ac5ff', 800, 500),
            ],
            ['slug' => 'djerba', 'category_key' => 'north-africa', 'price' => 950, 'rating' => 4.6,
                'name' => $this->loc('Djerba', 'Djerba', 'جربة'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc('An island paradise with pristine beaches and unique Berber culture.', 'Un paradis insulaire avec des plages préservées et une culture berbère unique.', 'جنة جزيرة بشواطئ بكر وثقافة أمازيغية فريدة.'),
                'image' => $this->img('photo-1507525428034-b723cf961d3e', 800, 500),
            ],
            ['slug' => 'tunis', 'category_key' => 'north-africa', 'price' => 720, 'rating' => 4.2,
                'name' => $this->loc('Tunis', 'Tunis', 'تونس العاصمة'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc('The capital city blending modernity with ancient Carthage ruins.', 'La capitale mêlant modernité et ruines de l\'ancienne Carthage.', 'العاصمة التي تمزج بين الحداثة وأطلال قرطاج القديمة.'),
                'image' => $this->img('photo-1555993539-1732b0258235', 800, 500),
            ],
            ['slug' => 'istanbul', 'category_key' => 'middle-east', 'price' => 1690, 'rating' => 4.8,
                'name' => $this->loc('Istanbul', 'Istanbul', 'إسطنبول'),
                'country' => $this->loc('Turkey', 'Turquie', 'تركيا'),
                'description' => $this->loc('The magical city straddling two continents with rich history.', 'La ville magique qui s\'étend sur deux continents avec une riche histoire.', 'مدينة ساحرة تمتد على قارتين بتاريخ غني.'),
                'image' => $this->img('photo-1524231757912-21f4fe3a7200', 800, 500),
            ],
            ['slug' => 'dubai', 'category_key' => 'middle-east', 'price' => 2490, 'rating' => 4.9,
                'name' => $this->loc('Dubai', 'Dubaï', 'دبي'),
                'country' => $this->loc('UAE', 'EAU', 'الإمارات'),
                'description' => $this->loc('A futuristic city of gold with world-class attractions.', 'Une ville futuriste dorée avec des attractions de classe mondiale.', 'مدينة مستقبلية ذهبية مع معالم عالمية.'),
                'image' => $this->img('photo-1512453979798-5ea266f8880c', 800, 500),
            ],
            ['slug' => 'marrakech', 'category_key' => 'africa', 'price' => 1250, 'rating' => 4.6,
                'name' => $this->loc('Marrakech', 'Marrakech', 'مراكش'),
                'country' => $this->loc('Morocco', 'Maroc', 'المغرب'),
                'description' => $this->loc('The red city of Morocco with vibrant souks and palaces.', 'La ville rouge du Maroc avec des souks animés et des palais.', 'المدينة الحمراء في المغرب مع أسواق نابضة بالحياة وقصور.'),
                'image' => $this->img('photo-1518730518541-d0843268c287', 800, 500),
            ],
            ['slug' => 'paris', 'category_key' => 'europe', 'price' => 1890, 'rating' => 4.7,
                'name' => $this->loc('Paris', 'Paris', 'باريس'),
                'country' => $this->loc('France', 'France', 'فرنسا'),
                'description' => $this->loc('The city of light and love with iconic landmarks.', 'La ville lumière et de l\'amour avec des monuments emblématiques.', 'مدينة النور والحب مع معالم أيقونية.'),
                'image' => $this->img('photo-1502602898657-3e91760cbb34', 800, 500),
            ],
            ['slug' => 'bali', 'category_key' => 'asia', 'price' => 2190, 'rating' => 4.8,
                'name' => $this->loc('Bali', 'Bali', 'بالي'),
                'country' => $this->loc('Indonesia', 'Indonésie', 'إندونيسيا'),
                'description' => $this->loc('Tropical paradise with temples, rice terraces, and stunning beaches.', 'Paradis tropical avec temples, rizières et plages magnifiques.', 'جنة استوائية مع معالم وحقول أرز وشواطئ خلابة.'),
                'image' => $this->img('photo-1537996194471-e657df975ab4', 800, 500),
            ],
            ['slug' => 'bangkok', 'category_key' => 'asia', 'price' => 1590, 'rating' => 4.5,
                'name' => $this->loc('Bangkok', 'Bangkok', 'بانكوك'),
                'country' => $this->loc('Thailand', 'Thaïlande', 'تايلاند'),
                'description' => $this->loc('A vibrant city of golden temples and amazing street food.', 'Une ville dynamique de temples dorés et de street food incroyable.', 'مدينة نابضة بالحياة بالمعابد الذهبية وطعام الشارع المذهل.'),
                'image' => $this->img('photo-1508009603885-50cf7c579365', 800, 500),
            ],
            ['slug' => 'cairo', 'category_key' => 'africa', 'price' => 1150, 'rating' => 4.4,
                'name' => $this->loc('Cairo', 'Le Caire', 'القاهرة'),
                'country' => $this->loc('Egypt', 'Égypte', 'مصر'),
                'description' => $this->loc('Home to the Great Pyramids and ancient Egyptian wonders.', 'Foyer des grandes pyramides et des merveilles de l\'Égypte ancienne.', 'موطن الأهرامات العظمى وعجائب مصر القديمة.'),
                'image' => $this->img('photo-1572252009286-268acec5ca0a', 800, 500),
            ],
            ['slug' => 'zanzibar', 'category_key' => 'africa', 'price' => 1850, 'rating' => 4.7,
                'name' => $this->loc('Zanzibar', 'Zanzibar', 'زنجبار'),
                'country' => $this->loc('Tanzania', 'Tanzanie', 'تنزانيا'),
                'description' => $this->loc('An exotic island with turquoise waters and spice markets.', 'Une île exotique avec des eaux turquoise et des marchés aux épices.', 'جزيرة استوائية بمياه فيروزية وأسواق التوابل.'),
                'image' => $this->img('photo-1590524366949-0942b6d7e45e', 800, 500),
            ],
        ];

        foreach ($destinations as $data) {
            Destination::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }

    // ─── Hotels ────────────────────────────────────────────────────────

    private function seedHotels(): void
    {
        $base = '/storage/uploads/hotels';

        $hotels = [
            [
                'slug' => 'hotel-badira', 'code' => 'hotel-badira-001', 'destination_slug' => 'hammamet',
                'name' => $this->loc('La Badira Adult Only', 'La Badira Adult Only', 'لا باديرا للبالغين فقط'),
                'location' => $this->loc('Hammamet Nord', 'Hammamet Nord', 'الحمامات الشمالية'),
                'category_key' => 'luxury', 'category' => $this->loc('Luxury', 'Luxe', 'فاخر'),
                'price' => 280, 'rating' => 5.0, 'stars' => 5, 'reviews' => 286,
                'image' => $base.'/badira1.webp', 'tags' => ['luxury', 'spa', 'beach'],
                'details' => ['gallery' => [$base.'/badira1.webp', $base.'/badira2.webp', $base.'/badira3.webp', $base.'/badira5.webp'], 'city' => $this->loc('Hammamet', 'Hammamet', 'الحمامات'), 'country' => $this->loc('Tunisia', 'Tunisie', 'تونس')],
                'amenities' => ['pool', 'spa', 'gym'],
                'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true, 'categorie_4_etoiles' => true, 'suite' => true,
                'rooms' => [
                    ['name_en' => 'Superior Sea View', 'name_fr' => 'Supérieure Vue Mer', 'name_ar' => 'غرفة سوبيريور بإطلالة على البحر', 'description_en' => 'Open-space room with panoramic sea view.', 'description_fr' => 'Chambre open-space avec vue panoramique sur la mer.', 'description_ar' => 'غرفة مفتوحة مع إطلالة بانورامية على البحر.', 'price_per_night' => 280, 'capacity' => 2, 'images' => [$base.'/badira2.webp', $base.'/badira3.webp']],
                    ['name_en' => 'Suite with Private Pool', 'name_fr' => 'Suite avec Piscine Privée', 'name_ar' => 'جناح مع مسبح خاص', 'description_en' => 'Exclusive suite with private pool and luxury bathroom.', 'description_fr' => 'Suite exclusive avec piscine privée et salle de bain luxueuse.', 'description_ar' => 'جناح حصري مع مسبح خاص وحمام فاخر.', 'price_per_night' => 650, 'capacity' => 2, 'images' => [$base.'/badira3.webp', $base.'/badira5.webp']],
                ],
            ],
            [
                'slug' => 'hotel-iberostar', 'code' => 'hotel-iberostar-001', 'destination_slug' => 'hammamet',
                'name' => $this->loc('Iberostar Waves Averroes', 'Iberostar Waves Averroes', 'إيبيروستار ويڤز أفيروز'),
                'location' => $this->loc('Yasmine Hammamet', 'Yasmine Hammamet', 'ياسمين الحمامات'),
                'category_key' => 'resort', 'category' => $this->loc('Resort', 'Resort', 'منتجع'),
                'price' => 195, 'rating' => 5.0, 'stars' => 5, 'reviews' => 412,
                'image' => $base.'/iberostar1.webp', 'tags' => ['family', 'spa', 'all-inclusive'],
                'details' => ['gallery' => [$base.'/iberostar1.webp', $base.'/iberostar2.webp', $base.'/iberostar3.webp'], 'city' => $this->loc('Yasmine Hammamet', 'Yasmine Hammamet', 'ياسمين الحمامات'), 'country' => $this->loc('Tunisia', 'Tunisie', 'تونس')],
                'amenities' => ['pool', 'spa', 'gym', 'beach'],
                'htel_recommande' => true, 'enfant_gratuit' => true, 'famille' => true, 'sport_loisir' => true, 'chambre_double' => true,
                'rooms' => [
                    ['name_en' => 'Double Garden View', 'name_fr' => 'Double Vue Jardin', 'name_ar' => 'غرفة مزدوجة بإطلالة على الحديقة', 'description_en' => 'Double room with garden view.', 'description_fr' => 'Chambre double avec vue jardin.', 'description_ar' => 'غرفة مزدوجة مع إطلالة على الحديقة.', 'price_per_night' => 195, 'capacity' => 2, 'images' => [$base.'/iberostar2.webp', $base.'/iberostar3.webp']],
                    ['name_en' => 'Sea View Suite', 'name_fr' => 'Suite Vue Mer', 'name_ar' => 'جناح مطل على البحر', 'description_en' => 'Spacious suite with sea view.', 'description_fr' => 'Suite spacieuse avec vue sur la mer.', 'description_ar' => 'جناح واسع بإطلالة على البحر.', 'price_per_night' => 390, 'capacity' => 3, 'images' => [$base.'/iberostar1.webp', $base.'/iberostar3.webp']],
                ],
            ],
            [
                'slug' => 'hotel-concorde', 'code' => 'hotel-concorde-001', 'destination_slug' => 'sousse',
                'name' => $this->loc('Barcelo Concorde Green Park', 'Barcelo Concorde Green Park', 'بارسيلو كونكورد غرين بارك'),
                'location' => $this->loc('Port El Kantaoui', 'Port El Kantaoui', 'ميناء القنطاوي'),
                'category_key' => 'beach', 'category' => $this->loc('Beach Resort', 'Hôtel de plage', 'منتجع شاطئي'),
                'price' => 220, 'rating' => 5.0, 'stars' => 5, 'reviews' => 351,
                'image' => $base.'/concorde1.webp', 'tags' => ['beach', 'family', 'pool'],
                'details' => ['gallery' => [$base.'/concorde1.webp', $base.'/concorde2.webp', $base.'/concorde3.webp'], 'city' => $this->loc('Sousse', 'Sousse', 'سوسة'), 'country' => $this->loc('Tunisia', 'Tunisie', 'تونس')],
                'amenities' => ['pool', 'beach', 'gym', 'restaurant'],
                'htel_recommande' => true, 'enfant_gratuit' => true, 'demi_pension' => true, 'famille' => true, 'sport_loisir' => true, 'chambre_double' => true,
                'rooms' => [
                    ['name_en' => 'Standard Sea View', 'name_fr' => 'Standard Vue Mer', 'name_ar' => 'غرفة قياسية بإطلالة على البحر', 'description_en' => 'Luxury room with sea-view balcony.', 'description_fr' => 'Chambre luxueuse avec balcon vue mer.', 'description_ar' => 'غرفة فاخرة مع شرفة مطلة على البحر.', 'price_per_night' => 220, 'capacity' => 2, 'images' => [$base.'/concorde2.webp', $base.'/concorde3.webp']],
                    ['name_en' => 'Family Suite', 'name_fr' => 'Suite Familiale', 'name_ar' => 'جناح عائلي', 'description_en' => 'Family suite with seating area.', 'description_fr' => 'Suite familiale avec coin salon.', 'description_ar' => 'جناح عائلي مع ركن جلوس.', 'price_per_night' => 420, 'capacity' => 4, 'images' => [$base.'/concorde1.webp', $base.'/concorde3.webp']],
                ],
            ],
            [
                'slug' => 'hotel-occidental', 'code' => 'hotel-occidental-001', 'destination_slug' => 'sousse',
                'name' => $this->loc('Occidental Sousse Marhaba', 'Occidental Sousse Marhaba', 'أوكسيدنتال سوسة مرحبا'),
                'location' => $this->loc('Zone Touristique, Sousse', 'Zone Touristique, Sousse', 'المنطقة السياحية، سوسة'),
                'category_key' => 'family', 'category' => $this->loc('Family Resort', 'Hôtel familial', 'منتجع عائلي'),
                'price' => 140, 'rating' => 4.0, 'stars' => 4, 'reviews' => 248,
                'image' => $base.'/occidental1.webp', 'tags' => ['family', 'wellness', 'waterpark'],
                'details' => ['gallery' => [$base.'/occidental1.webp', $base.'/occidental2.webp', $base.'/occidental3.webp', $base.'/occidental4.webp'], 'city' => $this->loc('Sousse', 'Sousse', 'سوسة'), 'country' => $this->loc('Tunisia', 'Tunisie', 'تونس')],
                'amenities' => ['pool', 'gym', 'kids_club', 'parking'],
                'tarifs_promo' => true, 'enfant_gratuit' => true, 'famille' => true, 'logement_simple' => true, 'chambre_standard' => true, 'chambre_double' => true,
                'rooms' => [
                    ['name_en' => 'Standard Room', 'name_fr' => 'Chambre Standard', 'name_ar' => 'غرفة قياسية', 'description_en' => 'Spacious room with tropical garden view.', 'description_fr' => 'Chambre spacieuse avec vue jardin tropical.', 'description_ar' => 'غرفة فسيحة مع إطلالة على حديقة استوائية.', 'price_per_night' => 140, 'capacity' => 2, 'images' => [$base.'/occidental2.webp', $base.'/occidental3.webp']],
                    ['name_en' => 'Family Room', 'name_fr' => 'Chambre Familiale', 'name_ar' => 'غرفة عائلية', 'description_en' => 'Large family room with extra beds.', 'description_fr' => 'Grande chambre pour familles avec lits supplémentaires.', 'description_ar' => 'غرفة عائلية واسعة مع أسرّة إضافية.', 'price_per_night' => 210, 'capacity' => 4, 'images' => [$base.'/occidental3.webp', $base.'/occidental4.webp']],
                ],
            ],
            // Additional hotels using Unsplash
            ...$this->getUnsplashHotels(),
        ];

        foreach ($hotels as $data) {
            $amenityNames = $data['amenities'] ?? [];
            $roomsData = $data['rooms'] ?? [];
            unset($data['amenities'], $data['rooms']);

            $hotel = Hotel::updateOrCreate(['slug' => $data['slug']], $data);

            // Sync amenities
            $amenityIds = Amenity::whereIn('name->en', [
                'Swimming Pool', 'Spa & Wellness', 'Fitness Center', 'Private Beach',
                'Kids Club', 'Free Parking', 'Restaurant',
            ])->pluck('id')->toArray();
            $hotel->amenities()->sync($amenityIds);

            // Create rooms
            foreach ($roomsData as $roomData) {
                $roomImages = $roomData['images'] ?? [];
                unset($roomData['images']);

                $room = HotelRoom::updateOrCreate(
                    ['hotel_id' => $hotel->id, 'name_en' => $roomData['name_en']],
                    $roomData
                );

                $room->featureItems()->delete();
                $room->imageItems()->delete();
                foreach ($roomImages as $idx => $path) {
                    $room->imageItems()->create(['path' => $path, 'sort_order' => $idx]);
                }
            }

            // Category assignment
            $this->assignCategory('hotels', $hotel->id, $data['category_key'] ?? null);
        }
    }

    private function getUnsplashHotels(): array
    {
        return [
            [
                'slug' => 'hotel-tunis-palace', 'code' => 'hotel-tunis-palace-001', 'destination_slug' => 'tunis',
                'name' => $this->loc('Tunis Palace Hotel', 'Hôtel Tunis Palace', 'فندق قصر تونس'),
                'location' => $this->loc('La Marsa, Tunis', 'La Marsa, Tunis', ' المرسى، تونس'),
                'category_key' => 'luxury', 'category' => $this->loc('Luxury', 'Luxe', 'فاخر'),
                'price' => 250, 'rating' => 4.5, 'stars' => 5, 'reviews' => 189,
                'image' => $this->img('photo-1566073771259-6a8506099945', 800, 500),
                'tags' => ['luxury', 'sea-view', 'spa'],
                'details' => ['gallery' => [$this->img('photo-1566073771259-6a8506099945', 800, 500), $this->img('photo-1582719508461-905c673771fd', 800, 500)], 'city' => $this->loc('Tunis', 'Tunis', 'تونس'), 'country' => $this->loc('Tunisia', 'Tunisie', 'تونس')],
                'amenities' => ['pool', 'spa', 'gym', 'beach'],
                'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true, 'categorie_4_etoiles' => true, 'suite' => true,
                'rooms' => [
                    ['name_en' => 'Deluxe Room', 'name_fr' => 'Chambre Deluxe', 'name_ar' => 'غرفة ديلوكس', 'description_en' => 'Elegant room with sea view.', 'description_fr' => 'Chambre élégante avec vue mer.', 'description_ar' => 'غرفة أنيقة مع إطلالة على البحر.', 'price_per_night' => 250, 'capacity' => 2, 'images' => [$this->img('photo-1582719508461-905c673771fd', 800, 500)]],
                ],
            ],
            [
                'slug' => 'hotel-djerba-mediterranean', 'code' => 'hotel-djerba-med-001', 'destination_slug' => 'djerba',
                'name' => $this->loc('Djerba Mediterranean Resort', 'Resort Méditerranée Djerba', 'منتجع جربة المتوسطي'),
                'location' => $this->loc('Midoun, Djerba', 'Midoun, Djerba', 'ميدون، جربة'),
                'category_key' => 'resort', 'category' => $this->loc('Resort', 'Resort', 'منتجع'),
                'price' => 180, 'rating' => 4.4, 'stars' => 4, 'reviews' => 320,
                'image' => $this->img('photo-1520250497591-112f2f40a3f4', 800, 500),
                'tags' => ['beach', 'family', 'pool'],
                'details' => ['gallery' => [$this->img('photo-1520250497591-112f2f40a3f4', 800, 500), $this->img('photo-1551882547-ff40c63fe5fa', 800, 500)], 'city' => $this->loc('Djerba', 'Djerba', 'جربة'), 'country' => $this->loc('Tunisia', 'Tunisie', 'تونس')],
                'amenities' => ['pool', 'beach', 'restaurant', 'parking'],
                'rooms' => [
                    ['name_en' => 'Garden View Room', 'name_fr' => 'Chambre Vue Jardin', 'name_ar' => 'غرفة بإطلالة على الحديقة', 'description_en' => 'Comfortable room with garden view.', 'description_fr' => 'Chambre confortable avec vue jardin.', 'description_ar' => 'غرفة مريحة مع إطلالة على الحديقة.', 'price_per_night' => 180, 'capacity' => 2, 'images' => [$this->img('photo-1551882547-ff40c63fe5fa', 800, 500)]],
                ],
            ],
            [
                'slug' => 'hotel-istanbul-grand', 'code' => 'hotel-istanbul-grand-001', 'destination_slug' => 'istanbul',
                'name' => $this->loc('Istanbul Grand Bazaar Hotel', 'Hôtel Grand Bazar Istanbul', 'فندق البازار الكبير إسطنبول'),
                'location' => $this->loc('Fatih, Istanbul', 'Fatih, Istanbul', 'فاتح، إسطنبول'),
                'category_key' => 'luxury', 'category' => $this->loc('Luxury', 'Luxe', 'فاخر'),
                'price' => 320, 'rating' => 4.7, 'stars' => 5, 'reviews' => 567,
                'image' => $this->img('photo-1542314831-068cd1dbfeeb', 800, 500),
                'tags' => ['luxury', 'historic', 'spa'],
                'details' => ['gallery' => [$this->img('photo-1542314831-068cd1dbfeeb', 800, 500), $this->img('photo-1578683010236-d716f9a3f461', 800, 500)], 'city' => $this->loc('Istanbul', 'Istanbul', 'إسطنبول'), 'country' => $this->loc('Turkey', 'Turquie', 'تركيا')],
                'amenities' => ['pool', 'spa', 'gym', 'restaurant'],
                'rooms' => [
                    ['name_en' => 'Heritage Suite', 'name_fr' => 'Suite Héritage', 'name_ar' => 'جناح التراث', 'description_en' => 'Luxurious suite with Bosphorus view.', 'description_fr' => 'Suite luxueuse avec vue sur le Bosphore.', 'description_ar' => 'جناح فاخر مع إطلالة على البوسفور.', 'price_per_night' => 320, 'capacity' => 2, 'images' => [$this->img('photo-1578683010236-d716f9a3f461', 800, 500)]],
                ],
            ],
            [
                'slug' => 'hotel-dubai-marina', 'code' => 'hotel-dubai-marina-001', 'destination_slug' => 'dubai',
                'name' => $this->loc('Dubai Marina Resort & Spa', 'Resort & Spa Dubaï Marina', 'منتجع وسبا دبي مارينا'),
                'location' => $this->loc('Dubai Marina, Dubai', 'Dubai Marina, Dubaï', 'دبي مارينا، دبي'),
                'category_key' => 'luxury', 'category' => $this->loc('Luxury', 'Luxe', 'فاخر'),
                'price' => 450, 'rating' => 4.9, 'stars' => 5, 'reviews' => 892,
                'image' => $this->img('photo-1582719478250-c89cae4dc85b', 800, 500),
                'tags' => ['luxury', 'spa', 'pool'],
                'details' => ['gallery' => [$this->img('photo-1582719478250-c89cae4dc85b', 800, 500), $this->img('photo-1564501049412-61c2a3083791', 800, 500)], 'city' => $this->loc('Dubai', 'Dubaï', 'دبي'), 'country' => $this->loc('UAE', 'EAU', 'الإمارات')],
                'amenities' => ['pool', 'spa', 'gym', 'beach'],
                'rooms' => [
                    ['name_en' => 'Marina View Suite', 'name_fr' => 'Suite Vue Marina', 'name_ar' => 'جناح بإطلالة على المارينا', 'description_en' => 'Premium suite with marina skyline view.', 'description_fr' => 'Suite premium avec vue sur la skyline.', 'description_ar' => 'جناح فاخر مع إطلالة على أفق المارينا.', 'price_per_night' => 450, 'capacity' => 2, 'images' => [$this->img('photo-1564501049412-61c2a3083791', 800, 500)]],
                ],
            ],
            [
                'slug' => 'hotel-marrakech-riad', 'code' => 'hotel-marrakech-riad-001', 'destination_slug' => 'marrakech',
                'name' => $this->loc('Riad Marrakech Medina', 'Riad Médina Marrakech', 'رياض المدينة مراكش'),
                'location' => $this->loc('Medina, Marrakech', 'Médina, Marrakech', 'المدينة القديمة، مراكش'),
                'category_key' => 'luxury', 'category' => $this->loc('Luxury', 'Luxe', 'فاخر'),
                'price' => 210, 'rating' => 4.6, 'stars' => 4, 'reviews' => 445,
                'image' => $this->img('photo-1571896349842-33c89424de2d', 800, 500),
                'tags' => ['boutique', 'historic', 'spa'],
                'details' => ['gallery' => [$this->img('photo-1571896349842-33c89424de2d', 800, 500), $this->img('photo-1590490360182-c33d57733427', 800, 500)], 'city' => $this->loc('Marrakech', 'Marrakech', 'مراكش'), 'country' => $this->loc('Morocco', 'Maroc', 'المغرب')],
                'amenities' => ['pool', 'spa', 'restaurant'],
                'rooms' => [
                    ['name_en' => 'Traditional Riad Room', 'name_fr' => 'Chambre Riad Traditionnelle', 'name_ar' => 'غرفة رياض تقليدية', 'description_en' => 'Authentic Moroccan room with courtyard.', 'description_fr' => 'Chambre marocaine authentique avec cour.', 'description_ar' => 'غرفة مغربية أصيلة مع فناء.', 'price_per_night' => 210, 'capacity' => 2, 'images' => [$this->img('photo-1590490360182-c33d57733427', 800, 500)]],
                ],
            ],
            [
                'slug' => 'hotel-paris-eiffel', 'code' => 'hotel-paris-eiffel-001', 'destination_slug' => 'paris',
                'name' => $this->loc('Paris Eiffel Tower Hotel', 'Hôtel Tour Eiffel Paris', 'فندق برج إيفل باريس'),
                'location' => $this->loc('Champ de Mars, Paris', 'Champ de Mars, Paris', 'شامب دو مارس، باريس'),
                'category_key' => 'luxury', 'category' => $this->loc('Luxury', 'Luxe', 'فاخر'),
                'price' => 380, 'rating' => 4.8, 'stars' => 5, 'reviews' => 723,
                'image' => $this->img('photo-1551882547-ff40c63fe5fa', 800, 500),
                'tags' => ['luxury', 'eiffel-view', 'spa'],
                'details' => ['gallery' => [$this->img('photo-1551882547-ff40c63fe5fa', 800, 500), $this->img('photo-1564501049412-61c2a3083791', 800, 500)], 'city' => $this->loc('Paris', 'Paris', 'باريس'), 'country' => $this->loc('France', 'France', 'فرنسا')],
                'amenities' => ['spa', 'gym', 'restaurant'],
                'rooms' => [
                    ['name_en' => 'Eiffel View Room', 'name_fr' => 'Chambre Vue Eiffel', 'name_ar' => 'غرفة بإطلالة على إيفل', 'description_en' => 'Room with direct Eiffel Tower view.', 'description_fr' => 'Chambre avec vue directe sur la Tour Eiffel.', 'description_ar' => 'غرفة مع إطلالة مباشرة على برج إيفل.', 'price_per_night' => 380, 'capacity' => 2, 'images' => [$this->img('photo-1564501049412-61c2a3083791', 800, 500)]],
                ],
            ],
            [
                'slug' => 'hotel-bali-ubud', 'code' => 'hotel-bali-ubud-001', 'destination_slug' => 'bali',
                'name' => $this->loc('Bali Ubud Resort', 'Resort Ubud Bali', 'منتجع أوبود بالي'),
                'location' => $this->loc('Ubud, Bali', 'Ubud, Bali', 'أوبود، بالي'),
                'category_key' => 'resort', 'category' => $this->loc('Resort', 'Resort', 'منتجع'),
                'price' => 290, 'rating' => 4.8, 'stars' => 5, 'reviews' => 634,
                'image' => $this->img('photo-1571003123894-1f0594d2b5d9', 800, 500),
                'tags' => ['nature', 'spa', 'pool'],
                'details' => ['gallery' => [$this->img('photo-1571003123894-1f0594d2b5d9', 800, 500), $this->img('photo-1573790387438-4da905039392', 800, 500)], 'city' => $this->loc('Ubud', 'Ubud', 'أوبود'), 'country' => $this->loc('Indonesia', 'Indonésie', 'إندونيسيا')],
                'amenities' => ['pool', 'spa', 'restaurant'],
                'rooms' => [
                    ['name_en' => 'Jungle Villa', 'name_fr' => 'Villa Jungle', 'name_ar' => 'فيلا الغابة', 'description_en' => 'Private villa surrounded by rice terraces.', 'description_fr' => 'Villa privée entourée de rizières.', 'description_ar' => 'فيلا خاصة محاطة بحقول الأرز.', 'price_per_night' => 290, 'capacity' => 2, 'images' => [$this->img('photo-1573790387438-4da905039392', 800, 500)]],
                ],
            ],
            [
                'slug' => 'hotel-cairo-pyramids', 'code' => 'hotel-cairo-pyramids-001', 'destination_slug' => 'cairo',
                'name' => $this->loc('Cairo Pyramids View Hotel', 'Hôtel Vue Pyramides Le Caire', 'فندق إطلالة الأهرامات القاهرة'),
                'location' => $this->loc('Giza, Cairo', 'Giza, Le Caire', 'الجيزة، القاهرة'),
                'category_key' => 'resort', 'category' => $this->loc('Resort', 'Resort', 'منتجع'),
                'price' => 175, 'rating' => 4.3, 'stars' => 4, 'reviews' => 389,
                'image' => $this->img('photo-1572252009286-268acec5ca0a', 800, 500),
                'tags' => ['pyramids-view', 'pool', 'historic'],
                'details' => ['gallery' => [$this->img('photo-1572252009286-268acec5ca0a', 800, 500)], 'city' => $this->loc('Cairo', 'Le Caire', 'القاهرة'), 'country' => $this->loc('Egypt', 'Égypte', 'مصر')],
                'amenities' => ['pool', 'restaurant', 'parking'],
                'rooms' => [
                    ['name_en' => 'Pyramid View Room', 'name_fr' => 'Chambre Vue Pyramides', 'name_ar' => 'غرفة بإطلالة على الأهرامات', 'description_en' => 'Room with stunning pyramid view.', 'description_fr' => 'Chambre avec vue imprenable sur les pyramides.', 'description_ar' => 'غرفة مع إطلالة خلابة على الأهرامات.', 'price_per_night' => 175, 'capacity' => 2, 'images' => [$this->img('photo-1572252009286-268acec5ca0a', 800, 500)]],
                ],
            ],
        ];
    }

    // ─── Tours ─────────────────────────────────────────────────────────

    private function seedTours(): void
    {
        $tours = [
            [
                'slug' => 'tour-omra-2026', 'category_key' => 'per-person',
                'name' => $this->loc('Omra Shawwal 2026', 'Omra Shawwal 2026', 'عمرة شوال 2026'),
                'description' => $this->loc('Special Omra offer — starting from 4,150 TND per person.', 'Offre spéciale Omra – à partir de 4 150 TND par personne.', 'عرض خاص لعمرة ابتداءً من 4150 دينارًا للشخص الواحد.'),
                'location' => $this->loc('Mecca & Medina, Saudi Arabia', 'La Mecque & Médine, Arabie Saoudite', 'مكة والمدينة، المملكة العربية السعودية'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('15 days / 14 nights', '15 jours / 14 nuits', '15 يوم / 14 ليلة'),
                'duration_days' => 15, 'duration_nights' => 14, 'max_group' => 45,
                'price' => 4150, 'rating' => 4.9, 'image' => $this->img('photo-1591825729269-caeb344f6df2'),
                'includes' => ['Visa Omra', 'Round-trip flights', 'Hotel accommodation', 'Transport', 'Guides'],
                'images' => [$this->img('photo-1591825729269-caeb344f6df2')],
                'details' => ['tags' => ['departure-2026-03-29', 'limited-seats']],
            ],
            [
                'slug' => 'tour-sud-tunisie', 'category_key' => 'per-person',
                'name' => $this->loc('Southern Circuit — Douz & Tozeur', 'Circuit Sud — Douz & Tozeur', 'جولة الجنوب — دوز وتوزر'),
                'description' => $this->loc('A magical journey into the Tunisian desert.', 'Découverte magique du désert tunisien.', 'رحلة ساحرة إلى الصحراء التونسية.'),
                'location' => $this->loc('Douz, Tozeur, Tunisia', 'Douz, Tozeur, Tunisie', 'دوز، توزر، تونس'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('4 days / 3 nights', '4 jours / 3 nuits', '4 أيام / 3 ليالٍ'),
                'duration_days' => 4, 'duration_nights' => 3, 'max_group' => 30,
                'price' => 589, 'rating' => 4.7, 'image' => $this->img('photo-1509600110300-21b9d5fedeb7'),
                'includes' => ['Transport', 'Hotel', 'Meals', 'Guide', 'Camel ride'],
                'images' => [$this->img('photo-1509600110300-21b9d5fedeb7')],
                'details' => ['tags' => ['douz', 'tozeur']],
            ],
            [
                'slug' => 'tour-istanbul-2026', 'category_key' => 'per-person',
                'name' => $this->loc('Istanbul 2026', 'Istanbul 2026', 'إسطنبول 2026'),
                'description' => $this->loc('Discover Istanbul — two continents in one city.', 'Découvrez Istanbul – deux continents en une ville.', 'اكتشف إسطنبول — قارتان في مدينة واحدة.'),
                'location' => $this->loc('Istanbul, Turkey', 'Istanbul, Turquie', 'إسطنبول، تركيا'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('7 days / 6 nights', '7 jours / 6 nuits', '7 أيام / 6 ليالٍ'),
                'duration_days' => 7, 'duration_nights' => 6, 'max_group' => 25,
                'price' => 1690, 'rating' => 4.8, 'image' => $this->img('photo-1524231757912-21f4fe3a7200'),
                'includes' => ['Flights', 'Hotel', 'Breakfast', 'Guide'],
                'images' => [$this->img('photo-1524231757912-21f4fe3a7200')],
                'details' => ['tags' => ['hagia-sophia', 'bosphorus']],
            ],
            [
                'slug' => 'tour-djerba-beach', 'category_key' => 'per-group',
                'name' => $this->loc('Djerba Beach Escape', 'Évasion Plage Djerba', 'هروب شاطئ جربة'),
                'description' => $this->loc('Relax on the beautiful beaches of Djerba island.', 'Détendez-vous sur les magnifiques plages de l\'île de Djerba.', 'استرخِ على شواطئ جزيرة جربة الجميلة.'),
                'location' => $this->loc('Djerba, Tunisia', 'Djerba, Tunisie', 'جربة، تونس'),
                'category' => $this->loc('Per Group', 'Par groupe', 'للمجموعة'),
                'duration' => $this->loc('5 days / 4 nights', '5 jours / 4 nuits', '5 أيام / 4 ليالٍ'),
                'duration_days' => 5, 'duration_nights' => 4, 'max_group' => 20,
                'price' => 890, 'rating' => 4.6, 'image' => $this->img('photo-1507525428034-b723cf961d3e'),
                'includes' => ['Transport', 'Hotel', 'Beach activities'],
                'images' => [$this->img('photo-1507525428034-b723cf961d3e')],
            ],
            [
                'slug' => 'tour-marrakech-explorer', 'category_key' => 'per-person',
                'name' => $this->loc('Marrakech Explorer', 'Explorateur Marrakech', 'مستكشف مراكش'),
                'description' => $this->loc('Discover the magic of Marrakech souks and palaces.', 'Découvrez la magie des souks et palais de Marrakech.', 'اكتشف سحر أسواق وقصور مراكش.'),
                'location' => $this->loc('Marrakech, Morocco', 'Marrakech, Maroc', 'مراكش، المغرب'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('6 days / 5 nights', '6 jours / 5 nuits', '6 أيام / 5 ليالٍ'),
                'duration_days' => 6, 'duration_nights' => 5, 'max_group' => 20,
                'price' => 1350, 'rating' => 4.7, 'image' => $this->img('photo-1518730518541-d0843268c287'),
                'includes' => ['Flights', 'Riad accommodation', 'Guided tours', 'Meals'],
                'images' => [$this->img('photo-1518730518541-d0843268c287')],
            ],
            ...$this->getMoreTours(),
        ];

        foreach ($tours as $data) {
            Tour::updateOrCreate(['slug' => $data['slug']], $data);
            $this->assignCategory('tours', Tour::where('slug', $data['slug'])->first()->id, $data['category_key'] ?? null);
        }
    }

    private function getMoreTours(): array
    {
        return [
            [
                'slug' => 'tour-dubai-luxury', 'category_key' => 'per-person',
                'name' => $this->loc('Dubai Luxury Experience', 'Expérience Luxe Dubaï', 'تجربة الفخامة في دبي'),
                'description' => $this->loc('Experience the ultimate luxury in Dubai.', 'Vivez le luxe ultime à Dubaï.', 'استمتع بأقصى درجات الفخامة في دبي.'),
                'location' => $this->loc('Dubai, UAE', 'Dubaï, EAU', 'دبي، الإمارات'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('6 days / 5 nights', '6 jours / 5 nuits', '6 أيام / 5 ليالٍ'),
                'duration_days' => 6, 'duration_nights' => 5, 'max_group' => 15,
                'price' => 2490, 'rating' => 4.9, 'image' => $this->img('photo-1512453979798-5ea266f8880c'),
                'includes' => ['Flights', '5-star hotel', 'Desert safari', 'City tour'],
                'images' => [$this->img('photo-1512453979798-5ea266f8880c')],
            ],
            [
                'slug' => 'tour-paris-romance', 'category_key' => 'per-person',
                'name' => $this->loc('Paris Romance', 'Romance Paris', 'رومانسية باريسية'),
                'description' => $this->loc('Fall in love with the city of light.', 'Enamourez-vous de la ville lumière.', 'قع في حب مدينة النور.'),
                'location' => $this->loc('Paris, France', 'Paris, France', 'باريس، فرنسا'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('5 days / 4 nights', '5 jours / 4 nuits', '5 أيام / 4 ليالٍ'),
                'duration_days' => 5, 'duration_nights' => 4, 'max_group' => 10,
                'price' => 1890, 'rating' => 4.7, 'image' => $this->img('photo-1502602898657-3e91760cbb34'),
                'includes' => ['Flights', 'Hotel', 'Seine cruise', 'Eiffel Tower'],
                'images' => [$this->img('photo-1502602898657-3e91760cbb34')],
            ],
            [
                'slug' => 'tour-bali-adventure', 'category_key' => 'per-person',
                'name' => $this->loc('Bali Adventure', 'Aventure Bali', 'مغامرة بالي'),
                'description' => $this->loc('Explore temples, rice terraces and waterfalls.', 'Explorez temples, rizières et cascades.', 'استكشف المعالم وحقول الأرز والشلالات.'),
                'location' => $this->loc('Bali, Indonesia', 'Bali, Indonésie', 'بالي، إندونيسيا'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('8 days / 7 nights', '8 jours / 7 nuits', '8 أيام / 7 ليالٍ'),
                'duration_days' => 8, 'duration_nights' => 7, 'max_group' => 12,
                'price' => 2190, 'rating' => 4.8, 'image' => $this->img('photo-1537996194471-e657df975ab4'),
                'includes' => ['Flights', 'Resort', 'Tours', 'Meals'],
                'images' => [$this->img('photo-1537996194471-e657df975ab4')],
            ],
            [
                'slug' => 'tour-cairo-pyramids', 'category_key' => 'per-person',
                'name' => $this->loc('Cairo & Pyramids Discovery', 'Découverte Le Caire & Pyramides', 'اكتشف القاهرة والأهرامات'),
                'description' => $this->loc('Ancient wonders of Egypt await you.', 'Les merveilles anciennes de l\'Égypte vous attendent.', 'عجائب مصر القديمة في انتظارك.'),
                'location' => $this->loc('Cairo & Luxor, Egypt', 'Le Caire & Louxor, Égypte', 'القاهرة والأقصر، مصر'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('7 days / 6 nights', '7 jours / 6 nuits', '7 أيام / 6 ليالٍ'),
                'duration_days' => 7, 'duration_nights' => 6, 'max_group' => 20,
                'price' => 1450, 'rating' => 4.6, 'image' => $this->img('photo-1572252009286-268acec5ca0a'),
                'includes' => ['Flights', 'Hotel', 'Nile cruise', 'Guide'],
                'images' => [$this->img('photo-1572252009286-268acec5ca0a')],
            ],
            [
                'slug' => 'tour-tunis-carthage', 'category_key' => 'per-group',
                'name' => $this->loc('Tunis & Carthage Heritage', 'Patrimoine Tunis & Carthage', 'تراث تونس وقرطاج'),
                'description' => $this->loc('Explore the ancient ruins of Carthage.', 'Explorez les ruines de Carthage.', 'استكشف آثار قرطاج القديمة.'),
                'location' => $this->loc('Tunis, Tunisia', 'Tunis, Tunisie', 'تونس العاصمة، تونس'),
                'category' => $this->loc('Per Group', 'Par groupe', 'للمجموعة'),
                'duration' => $this->loc('3 days / 2 nights', '3 jours / 2 nuits', '3 أيام / 2 ليالٍ'),
                'duration_days' => 3, 'duration_nights' => 2, 'max_group' => 35,
                'price' => 450, 'rating' => 4.4, 'image' => $this->img('photo-1555993539-1732b0258235'),
                'includes' => ['Transport', 'Hotel', 'Guide', 'Entrance fees'],
                'images' => [$this->img('photo-1555993539-1732b0258235')],
            ],
        ];
    }

    // ─── Travels ───────────────────────────────────────────────────────

    private function seedTravels(): void
    {
        $travels = [
            [
                'slug' => 'istanbul-cappadocia-discovery', 'category_key' => 'per-group',
                'name' => $this->loc('Istanbul & Cappadocia Discovery', 'Istanbul & Cappadoce Découverte', 'اكتشف إسطنبول وكابادوكيا'),
                'description' => $this->loc('Explore the magic of Istanbul and fairy chimneys of Cappadocia.', 'Explorez la magie d\'Istanbul et les cheminées des fées de Cappadoce.', 'اكتشف سحر إسطنبول والأعمدة السحرية في كابادوكيا.'),
                'location' => $this->loc('Istanbul & Cappadocia, Turkey', 'Istanbul & Cappadoce, Turquie', 'إسطنبول وكابادوكيا، تركيا'),
                'category' => $this->loc('Per Group', 'Par groupe', 'للمجموعة'),
                'duration' => $this->loc('7 days / 6 nights', '7 jours / 6 nuits', '7 أيام / 6 ليالٍ'),
                'duration_days' => 7, 'duration_nights' => 6, 'max_group' => 30,
                'price' => 1890, 'rating' => 4.8, 'image' => $this->img('photo-1524231757912-21f4fe3a7200'),
                'itinerary' => [
                    ['day' => 1, 'title' => $this->loc('Arrival in Istanbul', 'Arrivée à Istanbul', 'الوصول إلى إسطنبول'), 'details' => $this->loc('Airport transfer and hotel check-in', 'Transfert aéroport et installation', 'الانتقال من المطار والتسجيل')],
                    ['day' => 2, 'title' => $this->loc('Istanbul City Tour', 'Visite d\'Istanbul', 'جولة في إسطنبول'), 'details' => $this->loc('Hagia Sophia, Blue Mosque, Grand Bazaar', 'Sainte-Sophie, Mosquée Bleue, Grand Bazar', 'آيا صوفيا، الجامع الأزرق، البازار الكبير')],
                ],
                'includes' => ['Round-trip flights', '6 nights hotel', 'Daily breakfast', 'Professional guide'],
                'images' => [$this->img('photo-1524231757912-21f4fe3a7200')],
            ],
            [
                'slug' => 'dubai-abu-dhabi-luxury', 'category_key' => 'per-group',
                'name' => $this->loc('Dubai & Abu Dhabi Luxury', 'Dubaï & Abu Dhabi Luxe', 'دبي وأبو ظبي الفاخرة'),
                'description' => $this->loc('Ultimate luxury in the UAE.', 'Luxe ultime aux Émirats.', 'أقصى درجات الفخامة في الإمارات.'),
                'location' => $this->loc('Dubai & Abu Dhabi, UAE', 'Dubaï & Abu Dhabi, EAU', 'دبي وأبو ظبي، الإمارات'),
                'category' => $this->loc('Per Group', 'Par groupe', 'للمجموعة'),
                'duration' => $this->loc('6 days / 5 nights', '6 jours / 5 nuits', '6 أيام / 5 ليالٍ'),
                'duration_days' => 6, 'duration_nights' => 5, 'max_group' => 25,
                'price' => 2490, 'rating' => 4.9, 'image' => $this->img('photo-1512453979798-5ea266f8880c'),
                'includes' => ['Flights', '5-star hotel', 'Desert safari', 'Burj Khalifa'],
                'images' => [$this->img('photo-1512453979798-5ea266f8880c')],
            ],
            [
                'slug' => 'antalya-pamukkale-fethiye', 'category_key' => 'per-group',
                'name' => $this->loc('Antalya – Pamukkale – Fethiye', 'Antalya – Pamukkale – Fethiye', 'أنطاليا – باموكالي – فيتحية'),
                'description' => $this->loc('Turquoise coast with ancient ruins.', 'Côte turquoise avec ruines anciennes.', 'الساحل الفيروزي مع الآثار القديمة.'),
                'location' => $this->loc('Antalya, Turkey', 'Antalya, Turquie', 'أنطاليا، تركيا'),
                'category' => $this->loc('Per Group', 'Par groupe', 'للمجموعة'),
                'duration' => $this->loc('7 days / 6 nights', '7 jours / 6 nuits', '7 أيام / 6 ليالٍ'),
                'duration_days' => 7, 'duration_nights' => 6, 'max_group' => 35,
                'price' => 1590, 'rating' => 4.7, 'image' => $this->img('photo-1596395819908-2c9ea3320d7c'),
                'includes' => ['Flights', 'Hotel', 'Excursions', 'Guide'],
                'images' => [$this->img('photo-1596395819908-2c9ea3320d7c')],
            ],
            [
                'slug' => 'kuala-lumpur-bali-eco', 'category_key' => 'per-group',
                'name' => $this->loc('Kuala Lumpur – Bali ECO Pack', 'Kuala Lumpur – Bali Pack ECO', 'كوالالمبور – بالي البيئية'),
                'description' => $this->loc('Eco journey through Southeast Asia.', 'Voyage écologique en Asie du Sud-Est.', 'رحلة صديقة للبيئة عبر جنوب شرق آسيا.'),
                'location' => $this->loc('Malaysia & Indonesia', 'Malaisie & Indonésie', 'ماليزيا وإندونيسيا'),
                'category' => $this->loc('Per Group', 'Par groupe', 'للمجموعة'),
                'duration' => $this->loc('10 days / 8 nights', '10 jours / 8 nuits', '10 أيام / 8 ليالٍ'),
                'duration_days' => 10, 'duration_nights' => 8, 'max_group' => 20,
                'price' => 3290, 'rating' => 4.6, 'image' => $this->img('photo-1537996194471-e657df975ab4'),
                'includes' => ['Flights', 'Eco resort', 'Tours', 'Meals'],
                'images' => [$this->img('photo-1537996194471-e657df975ab4')],
            ],
            [
                'slug' => 'morocco-imperial-cities', 'category_key' => 'per-group',
                'name' => $this->loc('Morocco Imperial Cities', 'Villes Impériales Maroc', 'المدن الإمبراطورية المغربية'),
                'description' => $this->loc('Marrakech, Fes, Rabat and Casablanca.', 'Marrakech, Fès, Rabat et Casablanca.', 'مراكش والرباط وفاس والدار البيضاء.'),
                'location' => $this->loc('Morocco', 'Maroc', 'المغرب'),
                'category' => $this->loc('Per Group', 'Par groupe', 'للمجموعة'),
                'duration' => $this->loc('9 days / 8 nights', '9 jours / 8 nuits', '9 أيام / 8 ليالٍ'),
                'duration_days' => 9, 'duration_nights' => 8, 'max_group' => 25,
                'price' => 1750, 'rating' => 4.7, 'image' => $this->img('photo-1518730518541-d0843268c287'),
                'includes' => ['Flights', 'Hotels', 'Tours', 'Meals'],
                'images' => [$this->img('photo-1518730518541-d0843268c287')],
            ],
            [
                'slug' => 'zanzibar-beach-paradise', 'category_key' => 'per-person',
                'name' => $this->loc('Zanzibar Beach Paradise', 'Paradis Plage Zanzibar', 'جنة شاطئ زنجبار'),
                'description' => $this->loc('Exotic island with turquoise waters.', 'Île exotique avec eaux turquoise.', 'جزيرة استوائية بمياه فيروزية.'),
                'location' => $this->loc('Zanzibar, Tanzania', 'Zanzibar, Tanzanie', 'زنجبار، تنزانيا'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('8 days / 7 nights', '8 jours / 7 nuits', '8 أيام / 7 ليالٍ'),
                'duration_days' => 8, 'duration_nights' => 7, 'max_group' => 15,
                'price' => 1850, 'rating' => 4.7, 'image' => $this->img('photo-1590524366949-0942b6d7e45e'),
                'includes' => ['Flights', 'Beach resort', 'Spice tour', 'Snorkeling'],
                'images' => [$this->img('photo-1590524366949-0942b6d7e45e')],
            ],
            [
                'slug' => 'bangkok-chiang-mai', 'category_key' => 'per-group',
                'name' => $this->loc('Bangkok & Chiang Mai', 'Bangkok & Chiang Mai', 'بانكوك وتشيانغ ماي'),
                'description' => $this->loc('Temple exploration in Thailand.', 'Exploration de temples en Thaïlande.', 'استكشاف المعابد في تايلاند.'),
                'location' => $this->loc('Bangkok & Chiang Mai, Thailand', 'Bangkok & Chiang Mai, Thaïlande', 'بانكوك وتشيانغ ماي، تايلاند'),
                'category' => $this->loc('Per Group', 'Par groupe', 'للمجموعة'),
                'duration' => $this->loc('8 days / 7 nights', '8 jours / 7 nuits', '8 أيام / 7 ليالٍ'),
                'duration_days' => 8, 'duration_nights' => 7, 'max_group' => 20,
                'price' => 1590, 'rating' => 4.6, 'image' => $this->img('photo-1508009603885-50cf7c579365'),
                'includes' => ['Flights', 'Hotels', 'Temple tours', 'Cooking class'],
                'images' => [$this->img('photo-1508009603885-50cf7c579365')],
            ],
            [
                'slug' => 'omra-2026-per-person', 'category_key' => 'per-person',
                'name' => $this->loc('Omra 2026', 'Omra 2026', 'عمرة 2026'),
                'description' => $this->loc('Spiritual journey to Mecca and Medina.', 'Voyage spirituel à La Mecque et Médine.', 'رحلة روحانية إلى مكة والمدينة.'),
                'location' => $this->loc('Mecca & Medina, Saudi Arabia', 'La Mecque & Médine, Arabie Saoudite', 'مكة والمدينة، المملكة العربية السعودية'),
                'category' => $this->loc('Per Person', 'Par personne', 'لكل فرد'),
                'duration' => $this->loc('15 days / 14 nights', '15 jours / 14 nuits', '15 يوم / 14 ليلة'),
                'duration_days' => 15, 'duration_nights' => 14, 'max_group' => 45,
                'price' => 4150, 'rating' => 4.9, 'image' => $this->img('photo-1591825729269-caeb344f6df2'),
                'includes' => ['Visa', 'Flights', 'Hotels', 'Transport', 'Guides'],
                'images' => [$this->img('photo-1591825729269-caeb344f6df2')],
            ],
        ];

        foreach ($travels as $data) {
            Travel::updateOrCreate(['slug' => $data['slug']], $data);
            $this->assignCategory('travels', Travel::where('slug', $data['slug'])->first()->id, $data['category_key'] ?? null);
        }
    }

    // ─── Cars ──────────────────────────────────────────────────────────

    private function seedCars(): void
    {
        $cars = [
            ['slug' => 'car-toyota-yaris', 'category_key' => 'automatic', 'name' => $this->loc('Toyota Yaris', 'Toyota Yaris', 'تويوتا ياريس'), 'category' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'price' => 85, 'seats' => 5, 'fuel' => $this->loc('Petrol', 'Essence', 'بنزين'), 'transmission' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'image' => $this->img('photo-1621007947382-bb3c3994e3fb', 800, 500), 'details' => ['gallery' => [$this->img('photo-1621007947382-bb3c3994e3fb', 800, 500)]]],
            ['slug' => 'car-hyundai-i20', 'category_key' => 'manual', 'name' => $this->loc('Hyundai i20', 'Hyundai i20', 'هيونداي i20'), 'category' => $this->loc('Manual', 'Manuelle', 'يدوي'), 'price' => 65, 'seats' => 5, 'fuel' => $this->loc('Petrol', 'Essence', 'بنزين'), 'transmission' => $this->loc('Manual', 'Manuelle', 'يدوي'), 'image' => $this->img('photo-1605559424843-9e4c228bf1c2', 800, 500), 'details' => ['gallery' => [$this->img('photo-1605559424843-9e4c228bf1c2', 800, 500)]]],
            ['slug' => 'car-mercedes-egl', 'category_key' => 'automatic', 'name' => $this->loc('Mercedes-Benz E-Class', 'Mercedes-Benz Classe E', 'مرسيدس بنز كلاس E'), 'category' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'price' => 180, 'seats' => 5, 'fuel' => $this->loc('Diesel', 'Diesel', 'ديزل'), 'transmission' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'image' => $this->img('photo-1618843479313-40f8afb4b4d8', 800, 500), 'details' => ['gallery' => [$this->img('photo-1618843479313-40f8afb4b4d8', 800, 500)]]],
            ['slug' => 'car-renault-clio', 'category_key' => 'automatic', 'name' => $this->loc('Renault Clio', 'Renault Clio', 'رينو كليو'), 'category' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'price' => 70, 'seats' => 5, 'fuel' => $this->loc('Petrol', 'Essence', 'بنزين'), 'transmission' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'image' => $this->img('photo-1549399542-7e3f8b79c341', 800, 500), 'details' => ['gallery' => [$this->img('photo-1549399542-7e3f8b79c341', 800, 500)]]],
            ['slug' => 'car-volkswagen-golf', 'category_key' => 'automatic', 'name' => $this->loc('Volkswagen Golf', 'Volkswagen Golf', 'فولكس فاجن غولف'), 'category' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'price' => 95, 'seats' => 5, 'fuel' => $this->loc('Diesel', 'Diesel', 'ديزل'), 'transmission' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'image' => $this->img('photo-1583267746897-2cf415887172', 800, 500), 'details' => ['gallery' => [$this->img('photo-1583267746897-2cf415887172', 800, 500)]]],
            ['slug' => 'car-peugeot-208', 'category_key' => 'manual', 'name' => $this->loc('Peugeot 208', 'Peugeot 208', 'بيجو 208'), 'category' => $this->loc('Manual', 'Manuelle', 'يدوي'), 'price' => 55, 'seats' => 5, 'fuel' => $this->loc('Petrol', 'Essence', 'بنزين'), 'transmission' => $this->loc('Manual', 'Manuelle', 'يدوي'), 'image' => $this->img('photo-1609521263047-f8f205293f24', 800, 500), 'details' => ['gallery' => [$this->img('photo-1609521263047-f8f205293f24', 800, 500)]]],
            ['slug' => 'car-honda-civic', 'category_key' => 'automatic', 'name' => $this->loc('Honda Civic', 'Honda Civic', 'هوندا سيفك'), 'category' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'price' => 90, 'seats' => 5, 'fuel' => $this->loc('Petrol', 'Essence', 'بنزين'), 'transmission' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'image' => $this->img('photo-1606611013016-969c19ba27a5', 800, 500), 'details' => ['gallery' => [$this->img('photo-1606611013016-969c19ba27a5', 800, 500)]]],
            ['slug' => 'car-bmw-3series', 'category_key' => 'automatic', 'name' => $this->loc('BMW 3 Series', 'BMW Série 3', 'بي إم دبليو سلسلة 3'), 'category' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'price' => 200, 'seats' => 5, 'fuel' => $this->loc('Petrol', 'Essence', 'بنزين'), 'transmission' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'image' => $this->img('photo-1555215695-3004980ad54e', 800, 500), 'details' => ['gallery' => [$this->img('photo-1555215695-3004980ad54e', 800, 500)]]],
            ['slug' => 'car-dacia-duster', 'category_key' => 'manual', 'name' => $this->loc('Dacia Duster', 'Dacia Duster', 'داسيا داستر'), 'category' => $this->loc('Manual', 'Manuelle', 'يدوي'), 'price' => 75, 'seats' => 5, 'fuel' => $this->loc('Diesel', 'Diesel', 'ديزل'), 'transmission' => $this->loc('Manual', 'Manuelle', 'يدوي'), 'image' => $this->img('photo-1544636331-e26879cd4d9b', 800, 500), 'details' => ['gallery' => [$this->img('photo-1544636331-e26879cd4d9b', 800, 500)]]],
            ['slug' => 'car-fiat-500', 'category_key' => 'automatic', 'name' => $this->loc('Fiat 500', 'Fiat 500', 'فيات 500'), 'category' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'price' => 60, 'seats' => 4, 'fuel' => $this->loc('Petrol', 'Essence', 'بنزين'), 'transmission' => $this->loc('Automatic', 'Automatique', 'أوتوماتيك'), 'image' => $this->img('photo-1568844293986-8d0400f4745b', 800, 500), 'details' => ['gallery' => [$this->img('photo-1568844293986-8d0400f4745b', 800, 500)]]],
        ];

        foreach ($cars as $data) {
            Car::updateOrCreate(['slug' => $data['slug']], $data);
            $this->assignCategory('cars', Car::where('slug', $data['slug'])->first()->id, $data['category_key'] ?? null, 'transmission_type');
        }
    }

    // ─── Flights ───────────────────────────────────────────────────────

    private function seedFlights(): void
    {
        $flights = [
            ['code' => 'TU712', 'airline' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'from' => 'TUN', 'to' => $this->loc('Paris', 'Paris', 'باريس'), 'duration' => $this->loc('2h 30m', '2h 30', '2 ساعة 30'), 'price' => 450, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '08:00', 'arrival' => '11:30', 'image' => $this->img('photo-1436491865332-7a61a109db05', 400, 300)],
            ['code' => 'TU714', 'airline' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'from' => 'TUN', 'to' => $this->loc('Istanbul', 'Istanbul', 'إسطنبول'), 'duration' => $this->loc('3h 15m', '3h 15', '3 ساعات 15'), 'price' => 380, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '14:00', 'arrival' => '18:15', 'image' => $this->img('photo-1540962351504-03099e0a754b', 400, 300)],
            ['code' => 'EK748', 'airline' => $this->loc('Emirates', 'Emirates', 'طيران الإمارات'), 'from' => 'TUN', 'to' => $this->loc('Dubai', 'Dubaï', 'دبي'), 'duration' => $this->loc('5h 45m', '5h 45', '5 ساعات 45'), 'price' => 650, 'stops' => $this->loc('1 stop', '1 escale', 'توقف واحد'), 'departure' => '22:30', 'arrival' => '06:15', 'image' => $this->img('photo-1464037866556-6812c9d1c72e', 400, 300)],
            ['code' => 'TU720', 'airline' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'from' => 'TUN', 'to' => $this->loc('Marrakech', 'Marrakech', 'مراكش'), 'duration' => $this->loc('1h 45m', '1h 45', '1 ساعة 45'), 'price' => 290, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '10:30', 'arrival' => '12:15', 'image' => $this->img('photo-1488085061387-422e29b40080', 400, 300)],
            ['code' => 'TU730', 'airline' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'from' => 'TUN', 'to' => $this->loc('Cairo', 'Le Caire', 'القاهرة'), 'duration' => $this->loc('2h 50m', '2h 50', '2 ساعة 50'), 'price' => 350, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '16:00', 'arrival' => '20:50', 'image' => $this->img('photo-1529074991848-486b7a0b508c', 400, 300)],
            ['code' => 'NB201', 'airline' => $this->loc('Nouvelair', 'Nouvelair', 'نوفل آير'), 'from' => 'TUN', 'to' => $this->loc('Paris', 'Paris', 'باريس'), 'duration' => $this->loc('2h 35m', '2h 35', '2 ساعة 35'), 'price' => 420, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '06:00', 'arrival' => '09:35', 'image' => $this->img('photo-1520250497591-112f2f40a3f4', 400, 300)],
            ['code' => 'TU750', 'airline' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'from' => 'TUN', 'to' => $this->loc('London', 'Londres', 'لندن'), 'duration' => $this->loc('3h 10m', '3h 10', '3 ساعات 10'), 'price' => 520, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '12:00', 'arrival' => '15:10', 'image' => $this->img('photo-1474302770737-173ee21bab63', 400, 300)],
            ['code' => 'EK750', 'airline' => $this->loc('Emirates', 'Emirates', 'طيران الإمارات'), 'from' => 'TUN', 'to' => $this->loc('Bangkok', 'Bangkok', 'بانكوك'), 'duration' => $this->loc('10h 30m', '10h 30', '10 ساعات 30'), 'price' => 890, 'stops' => $this->loc('1 stop', '1 escale', 'توقف واحد'), 'departure' => '21:00', 'arrival' => '13:30', 'image' => $this->img('photo-1508009603885-50cf7c579365', 400, 300)],
            ['code' => 'TU760', 'airline' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'from' => 'TUN', 'to' => $this->loc('Rome', 'Rome', 'روما'), 'duration' => $this->loc('1h 50m', '1h 50', '1 ساعة 50'), 'price' => 310, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '09:00', 'arrival' => '10:50', 'image' => $this->img('photo-1515859005217-8a1f08870f59', 400, 300)],
            ['code' => 'TU770', 'airline' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'from' => 'TUN', 'to' => $this->loc('Geneva', 'Genève', ' جنيف'), 'duration' => $this->loc('2h 15m', '2h 15', '2 ساعة 15'), 'price' => 400, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '13:00', 'arrival' => '15:15', 'image' => $this->img('photo-1476514525535-07fb3b4ae5f1', 400, 300)],
            ['code' => 'TU780', 'airline' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'from' => 'TUN', 'to' => $this->loc('Casablanca', 'Casablanca', 'الدار البيضاء'), 'duration' => $this->loc('1h 40m', '1h 40', '1 ساعة 40'), 'price' => 280, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '11:00', 'arrival' => '12:40', 'image' => $this->img('photo-1547447134-cd3f5c716030', 400, 300)],
            ['code' => 'NB210', 'airline' => $this->loc('Nouvelair', 'Nouvelair', 'نوفل آير'), 'from' => 'TUN', 'to' => $this->loc('Munich', 'Munich', 'ميونخ'), 'duration' => $this->loc('2h 40m', '2h 40', '2 ساعة 40'), 'price' => 440, 'stops' => $this->loc('Direct', 'Direct', 'مباشر'), 'departure' => '07:30', 'arrival' => '10:10', 'image' => $this->img('photo-1488085061387-422e29b40080', 400, 300)],
        ];

        foreach ($flights as $data) {
            Flight::updateOrCreate(['code' => $data['code']], $data);
        }
    }

    // ─── Events ────────────────────────────────────────────────────────

    private function seedEvents(): void
    {
        $events = [
            ['slug' => 'carthage-festival-2026', 'category_key' => 'cultural', 'title' => $this->loc('Carthage International Festival', 'Festival International de Carthage', 'مهرجان قرطاج الدولي'), 'location' => $this->loc('Carthage, Tunisia', 'Carthage, Tunisie', 'قرطاج، تونس'), 'category' => $this->loc('Cultural', 'Culturel', 'ثقافي'), 'date' => $this->loc('July 15 – August 20, 2026', '15 juillet – 20 août 2026', '15 يوليو – 20 أغسطس 2026'), 'price' => 85, 'image' => $this->img('photo-1459749411175-04bf5292ceea', 800, 500), 'description' => $this->loc('World-renowned music and arts festival.', 'Festival de musique et d\'arts mondialement connu.', 'مهرجان موسيقي وفنون عالمي الشهرة.')],
            ['slug' => 'sahara-festival-2026', 'category_key' => 'festival', 'title' => $this->loc('International Sahara Festival', 'Festival International du Sahara', 'مهرجان الصحراء الدولي'), 'location' => $this->loc('Douz, Tunisia', 'Douz, Tunisie', 'دوز، تونس'), 'category' => $this->loc('Festival', 'Festival', 'مهرجان'), 'date' => $this->loc('December 15–20, 2026', '15–20 décembre 2026', '15–20 ديسمبر 2026'), 'price' => 45, 'image' => $this->img('photo-1509600110300-21b9d5fedeb7', 800, 500), 'description' => $this->loc('Celebrate Berber culture in the Sahara desert.', 'Célébrez la culture berbère dans le désert du Sahara.', 'احتفال بالثقافة الأمازيعية في صحراء الكبرى.')],
            ['slug' => 'djerba-golf-open', 'category_key' => 'sport', 'title' => $this->loc('Djerba Golf Open', 'Open Golf Djerba', 'بطولة جربة للغولف'), 'location' => $this->loc('Djerba, Tunisia', 'Djerba, Tunisie', 'جربة، تونس'), 'category' => $this->loc('Sport', 'Sport', 'رياضي'), 'date' => $this->loc('March 10–13, 2026', '10–13 mars 2026', '10–13 مارس 2026'), 'price' => 120, 'image' => $this->img('photo-1535131749006-b7f58c99034b', 800, 500), 'description' => $this->loc('Premier golf tournament on the island.', 'Tournoi de golf principal sur l\'île.', 'بطولة غولف رئيسية على الجزيرة.')],
            ['slug' => 'tunis-food-festival', 'category_key' => 'festival', 'title' => $this->loc('Tunis Food Festival', 'Festival Gastronomique Tunis', 'مهرجان الطعام التونسي'), 'location' => $this->loc('La Marsa, Tunis', 'La Marsa, Tunis', 'المرسى، تونس'), 'category' => $this->loc('Festival', 'Festival', 'مهرجان'), 'date' => $this->loc('September 5–8, 2026', '5–8 septembre 2026', '5–8 سبتمبر 2026'), 'price' => 35, 'image' => $this->img('photo-1555939594-58d7cb561ad1', 800, 500), 'description' => $this->loc('Celebrate Tunisian cuisine.', 'Célébrez la cuisine tunisienne.', 'احتفال بالمطبخ التونسي.')],
            ['slug' => 'sousse-medina-night', 'category_key' => 'cultural', 'title' => $this->loc('Sousse Medina Nights', 'Nuits de la Médina de Sousse', 'ليالي سوسة العتيقة'), 'location' => $this->loc('Medina of Sousse', 'Médina de Sousse', 'مدينة سوسة العتيقة'), 'category' => $this->loc('Cultural', 'Culturel', 'ثقافي'), 'date' => $this->loc('June 1–30, 2026', '1–30 juin 2026', '1–30 يونيو 2026'), 'price' => 25, 'image' => $this->img('photo-1570077188670-e3a8d69ac5ff', 800, 500), 'description' => $this->loc('Nightly cultural performances.', 'Spectacles culturels nocturnes.', 'عروض ثقافية ليلية.')],
            ['slug' => 'hammamet-jazz-festival', 'category_key' => 'cultural', 'title' => $this->loc('Hammamet Jazz Festival', 'Festival Jazz de Hammamet', 'مهرجان الحمامات للجاز'), 'location' => $this->loc('Hammamet', 'Hammamet', 'الحمامات'), 'category' => $this->loc('Cultural', 'Culturel', 'ثقافي'), 'date' => $this->loc('August 10–15, 2026', '10–15 août 2026', '10–15 أغسطس 2026'), 'price' => 55, 'image' => $this->img('photo-1459749411175-04bf5292ceea', 800, 500), 'description' => $this->loc('International jazz artists perform.', 'Artistes de jazz internationaux.', 'فنانون جازيون دوليون.')],
            ['slug' => 'djerba-marathon', 'category_key' => 'sport', 'title' => $this->loc('Djerba Marathon', 'Marathon de Djerba', 'ماراثون جربة'), 'location' => $this->loc('Djerba, Tunisia', 'Djerba, Tunisie', 'جربة، تونس'), 'category' => $this->loc('Sport', 'Sport', 'رياضي'), 'date' => $this->loc('October 20, 2026', '20 octobre 2026', '20 أكتوبر 2026'), 'price' => 40, 'image' => $this->img('photo-1530549387789-4c1017266635', 800, 500), 'description' => $this->loc('Annual marathon around the island.', 'Marathon annuel autour de l\'île.', 'ماراثون سنوي حول الجزيرة.')],
            ['slug' => 'sousse-beach-party', 'category_key' => 'festival', 'title' => $this->loc('Sousse Beach Party', 'Festival Plage Sousse', 'حفل شاطئ سوسة'), 'location' => $this->loc('Sousse Beach', 'Plage de Sousse', 'شاطئ سوسة'), 'category' => $this->loc('Festival', 'Festival', 'مهرجان'), 'date' => $this->loc('July 1–August 31, 2026', '1 juillet – 31 août 2026', '1 يوليو – 31 أغسطس 2026'), 'price' => 30, 'image' => $this->img('photo-1507525428034-b723cf961d3e', 800, 500), 'description' => $this->loc('Summer beach music events.', 'Événements musicaux estivaux.', 'فعاليات موسيقية صيفية.')],
            ['slug' => 'tozeur-oasis-fest', 'category_key' => 'cultural', 'title' => $this->loc('Tozeur Oasis Festival', 'Festival Oasis Tozeur', 'مهرجان واحة توزر'), 'location' => $this->loc('Tozeur, Tunisia', 'Tozeur, Tunisie', 'توزر، تونس'), 'category' => $this->loc('Cultural', 'Culturel', 'ثقافي'), 'date' => $this->loc('November 10–13, 2026', '10–13 novembre 2026', '10–13 نوفمبر 2026'), 'price' => 50, 'image' => $this->img('photo-1509600110300-21b9d5fedeb7', 800, 500), 'description' => $this->loc('Celebrate desert culture.', 'Célébrez la culture du désert.', 'احتفال بثقافة الصحراء.')],
            ['slug' => 'tunis-marathon', 'category_key' => 'sport', 'title' => $this->loc('Tunis Marathon', 'Marathon de Tunis', 'ماراثون تونس'), 'location' => $this->loc('Tunis, Tunisia', 'Tunis, Tunisie', 'تونس العاصمة، تونس'), 'category' => $this->loc('Sport', 'Sport', 'رياضي'), 'date' => $this->loc('May 5, 2026', '5 mai 2026', '5 مايو 2026'), 'price' => 35, 'image' => $this->img('photo-1530549387789-4c1017266635', 800, 500), 'description' => $this->loc('Annual city marathon.', 'Marathon annuel.', 'ماراثون سنوي.')],
        ];

        foreach ($events as $data) {
            Event::updateOrCreate(['slug' => $data['slug']], $data);
            $this->assignCategory('events', Event::where('slug', $data['slug'])->first()->id, $data['category_key'] ?? null, 'event_type');
        }
    }

    // ─── Deals ─────────────────────────────────────────────────────────

    private function seedDeals(): void
    {
        $deals = [
            ['slug' => 'deal-summer-2026', 'category_key' => 'flash-sale', 'title' => $this->loc('Summer Flash Sale', 'Vente Flash Été', 'تخفيض صيفي سريع'), 'description' => $this->loc('Up to 30% off selected hotels.', 'Jusqu\'à 30% de réduction.', 'خصم يصل إلى 30%.'), 'discount' => $this->loc('30% OFF', '30% OFF', 'خصم 30%'), 'expires' => $this->loc('August 31, 2026', '31 août 2026', '31 أغسطس 2026'), 'category' => $this->loc('Flash Sale', 'Vente flash', 'تخفيض سريع'), 'details' => ['min_nights' => 3]],
            ['slug' => 'deal-early-bird', 'category_key' => 'seasonal', 'title' => $this->loc('Early Booking', 'Réservation Anticipée', 'حجز مبكر'), 'description' => $this->loc('Book now for winter and save 20%.', 'Réservez pour l\'hiver et économisez 20%.', 'احجز لشتاء ووفّر 20%.'), 'discount' => $this->loc('20% OFF', '20% OFF', 'خصم 20%'), 'expires' => $this->loc('October 31, 2026', '31 octobre 2026', '31 أكتوبر 2026'), 'category' => $this->loc('Seasonal', 'Saisonnier', 'موسمي'), 'details' => ['travel_period' => 'Nov 2026 – Mar 2027']],
            ['slug' => 'deal-family-pack', 'category_key' => 'bundle', 'title' => $this->loc('Family Bundle', 'Pack Famille', 'حزمة العائلة'), 'description' => $this->loc('Kids stay free.', 'Enfants gratuits.', 'الأطفال مجانًا.'), 'discount' => $this->loc('Kids Stay Free', 'Enfants Gratuit', 'الأطفال مجانًا'), 'expires' => $this->loc('December 31, 2026', '31 décembre 2026', '31 ديسمبر 2026'), 'category' => $this->loc('Bundle', 'Pack', 'حزمة'), 'details' => ['min_adults' => 2]],
            ['slug' => 'deal-honeymoon', 'category_key' => 'seasonal', 'title' => $this->loc('Honeymoon Special', 'Lune de Miel', 'شهر العسل'), 'description' => $this->loc('Romantic getaway with champagne.', 'Escapade romantique avec champagne.', 'هروب رومانسي مع شمبانيا.'), 'discount' => $this->loc('15% OFF + Spa', '15% OFF + Spa', 'خصم 15% + سبا'), 'expires' => $this->loc('December 31, 2026', '31 décembre 2026', '31 ديسمبر 2026'), 'category' => $this->loc('Seasonal', 'Saisonnier', 'موسمي'), 'details' => ['min_nights' => 5]],
            ['slug' => 'deal-weekend', 'category_key' => 'flash-sale', 'title' => $this->loc('Weekend Getaway', 'Évasion Weekend', 'هروب عطلة'), 'description' => $this->loc('2 nights for the price of 1.', '2 nuits au prix d\'1.', 'ليلتان بسعر واحدة.'), 'discount' => $this->loc('BOGO Nights', '2 pour 1', '2 بسعر 1'), 'expires' => $this->loc('September 30, 2026', '30 septembre 2026', '30 سبتمبر 2026'), 'category' => $this->loc('Flash Sale', 'Vente flash', 'تخفيض سريع'), 'details' => ['valid_days' => ['Fri', 'Sat', 'Sun']]],
            ['slug' => 'deal-group', 'category_key' => 'bundle', 'title' => $this->loc('Group Discount', 'Réduction Groupe', 'خصم المجموعة'), 'description' => $this->loc('10+ travelers get 15% off.', '15% pour 10+ voyageurs.', 'خصم 15% لأكثر من 10.'), 'discount' => $this->loc('15% OFF Groups', '15% OFF Groupes', 'خصم 15% للمجموعات'), 'expires' => $this->loc('December 31, 2026', '31 décembre 2026', '31 ديسمبر 2026'), 'category' => $this->loc('Bundle', 'Pack', 'حزمة'), 'details' => ['min_travelers' => 10]],
            ['slug' => 'deal-last-minute', 'category_key' => 'flash-sale', 'title' => $this->loc('Last Minute', 'Dernière Minute', 'اللحظة الأخيرة'), 'description' => $this->loc('Depart within 7 days and save 25%.', 'Partez dans 7 jours, économisez 25%.', 'سافر خلال 7 أيام ووفّر 25%.'), 'discount' => $this->loc('25% OFF', '25% OFF', 'خصم 25%'), 'expires' => $this->loc('July 31, 2026', '31 juillet 2026', '31 يوليو 2026'), 'category' => $this->loc('Flash Sale', 'Vente flash', 'تخفيض سريع'), 'details' => ['departure_within' => '7 days']],
            ['slug' => 'deal-spa', 'category_key' => 'seasonal', 'title' => $this->loc('Spa Package', 'Pack Spa', 'حزمة سبا'), 'description' => $this->loc('Daily spa treatments included.', 'Soins spa quotidiens inclus.', 'علاجات سبا يومية مشمولة.'), 'discount' => $this->loc('Free Spa Day', 'Journée Spa Offerte', 'يوم سبا مجاني'), 'expires' => $this->loc('November 30, 2026', '30 novembre 2026', '30 نوفمبر 2026'), 'category' => $this->loc('Seasonal', 'Saisonnier', 'موسمي'), 'details' => ['min_nights' => 4]],
            ['slug' => 'deal-turkey-honey', 'category_key' => 'bundle', 'title' => $this->loc('Turkey Honeymoon', 'Lune de Miel Turquie', 'شهر عسل تركيا'), 'description' => $this->loc('Romantic Turkey package.', 'Pack Turquie romantique.', 'حزمة تركية رومانسية.'), 'discount' => $this->loc('20% OFF + Upgrade', '20% OFF + Upgrade', 'خصم 20% + ترقية'), 'expires' => $this->loc('December 31, 2026', '31 décembre 2026', '31 ديسمبر 2026'), 'category' => $this->loc('Bundle', 'Pack', 'حزمة'), 'details' => ['destination' => 'Istanbul']],
            ['slug' => 'deal-bali-summer', 'category_key' => 'seasonal', 'title' => $this->loc('Bali Summer Deal', 'Offre Été Bali', 'عرض بالي الصيفي'), 'description' => $this->loc('Escape to Bali this summer.', 'Évadez-vous à Bali.', 'اهرب إلى بالي.'), 'discount' => $this->loc('25% OFF', '25% OFF', 'خصم 25%'), 'expires' => $this->loc('August 31, 2026', '31 août 2026', '31 أغسطس 2026'), 'category' => $this->loc('Seasonal', 'Saisonnier', 'موسمي'), 'details' => ['destination' => 'Bali']],
        ];

        foreach ($deals as $data) {
            Deal::updateOrCreate(['slug' => $data['slug']], $data);
            $this->assignCategory('deals', Deal::where('slug', $data['slug'])->first()->id, $data['category_key'] ?? null, 'deal_type');
        }
    }

    // ─── Blog Posts ────────────────────────────────────────────────────

    private function seedBlogPosts(): void
    {
        $posts = [
            ['slug' => 'best-beaches-tunisia', 'category_key' => 'destination-guide', 'title' => $this->loc('Best Beaches in Tunisia', 'Meilleures Plages de Tunisie', 'أفضل الشواطئ في تونس'), 'excerpt' => $this->loc('Top 10 beaches.', '10 meilleures plages.', 'أفضل 10 شواطئ.'), 'date' => '2026-06-15', 'category' => $this->loc('Destination Guide', 'Guide destination', 'دليل الوجهة'), 'image' => $this->img('photo-1507525428034-b723cf961d3e'), 'content' => $this->loc('Tunisia beaches article.', 'Article plages.', 'مقال الشواطئ.')],
            ['slug' => 'istanbul-travel-guide', 'category_key' => 'destination-guide', 'title' => $this->loc('Istanbul Guide', 'Guide Istanbul', 'دليل إسطنبول'), 'excerpt' => $this->loc('Everything about Istanbul.', 'Tout sur Istanbul.', 'كل شيء عن إسطنبول.'), 'date' => '2026-06-10', 'category' => $this->loc('Destination Guide', 'Guide destination', 'دليل الوجهة'), 'image' => $this->img('photo-1524231757912-21f4fe3a7200'), 'content' => $this->loc('Istanbul guide.', 'Guide Istanbul.', 'دليل إسطنبول.')],
            ['slug' => 'budget-travel-tips', 'category_key' => 'travel-tips', 'title' => $this->loc('Budget Travel Tips', 'Conseils Petit Budget', 'نصائح بميزانية محدودة'), 'excerpt' => $this->loc('Travel without breaking the bank.', 'Voyager sans se ruiner.', 'سافر دون إفلاس.'), 'date' => '2026-06-05', 'category' => $this->loc('Travel Tips', 'Conseils voyage', 'نصائح السفر'), 'image' => $this->img('photo-1488646953014-85cb44e25828'), 'content' => $this->loc('Budget tips.', 'Conseils budget.', 'نصائح.')],
            ['slug' => 'best-hotels-hammamet', 'category_key' => 'destination-guide', 'title' => $this->loc('Best Hotels Hammamet', 'Meilleurs Hôtels Hammamet', 'أفضل فنادق الحمامات'), 'excerpt' => $this->loc('Top Hammamet picks.', 'Meilleurs choix.', 'أفضل الخيارات.'), 'date' => '2026-05-28', 'category' => $this->loc('Destination Guide', 'Guide destination', 'دليل الوجهة'), 'image' => $this->img('photo-1566073771259-6a8506099945'), 'content' => $this->loc('Hammamet hotels.', 'Hôtels Hammamet.', 'فنادق الحمامات.')],
            ['slug' => 'summer-news-2026', 'category_key' => 'news', 'title' => $this->loc('Summer News 2026', 'Actualités Été 2026', 'أخبار صيف 2026'), 'excerpt' => $this->loc('Latest travel updates.', 'Dernières actualités.', 'آخر الأخبار.'), 'date' => '2026-06-20', 'category' => $this->loc('News', 'Actualités', 'أخبار'), 'image' => $this->img('photo-1469854523086-cc02fe5d8800'), 'content' => $this->loc('Travel news.', 'Actualités.', 'أخبار.')],
            ['slug' => 'djerba-hidden-gems', 'category_key' => 'destination-guide', 'title' => $this->loc('Hidden Gems Djerba', 'Joyaux Cachés Djerba', 'جواهر جربة الخفية'), 'excerpt' => $this->loc('Secret spots.', 'Lieux secrets.', 'أماكن سرية.'), 'date' => '2026-05-20', 'category' => $this->loc('Destination Guide', 'Guide destination', 'دليل الوجهة'), 'image' => $this->img('photo-1507525428034-b723cf961d3e'), 'content' => $this->loc('Hidden gems.', 'Joyaux.', 'جواهر.')],
            ['slug' => 'morocco-tips', 'category_key' => 'travel-tips', 'title' => $this->loc('Morocco Tips', 'Conseils Maroc', 'نصائح المغرب'), 'excerpt' => $this->loc('Essential Morocco tips.', 'Conseils essentiels.', 'نصائح أساسية.'), 'date' => '2026-05-15', 'category' => $this->loc('Travel Tips', 'Conseils voyage', 'نصائح السفر'), 'image' => $this->img('photo-1518730518541-d0843268c287'), 'content' => $this->loc('Morocco tips.', 'Conseils Maroc.', 'نصائح.')],
            ['slug' => 'new-flights-2026', 'category_key' => 'news', 'title' => $this->loc('New Flights 2026', 'Nouvelles Liaisons 2026', 'رحلات جديدة 2026'), 'excerpt' => $this->loc('New destinations.', 'Nouvelles destinations.', 'وجهات جديدة.'), 'date' => '2026-06-01', 'category' => $this->loc('News', 'Actualités', 'أخبار'), 'image' => $this->img('photo-1436491865332-7a61a109db05'), 'content' => $this->loc('New flights.', 'Nouvelles liaisons.', 'رحلات جديدة.')],
            ['slug' => 'car-rental-tips', 'category_key' => 'travel-tips', 'title' => $this->loc('Car Rental Guide', 'Guide Location', 'دليل التأجير'), 'excerpt' => $this->loc('Renting in Tunisia.', 'Location en Tunisie.', 'التأجير في تونس.'), 'date' => '2026-05-10', 'category' => $this->loc('Travel Tips', 'Conseils voyage', 'نصائح السفر'), 'image' => $this->img('photo-1621007947382-bb3c3994e3fb'), 'content' => $this->loc('Car rental.', 'Location.', 'التأجير.')],
            ['slug' => 'visa-updates-2026', 'category_key' => 'news', 'title' => $this->loc('Visa Updates 2026', 'Mise à Jour Visa 2026', 'تحديث التأشيرة 2026'), 'excerpt' => $this->loc('Visa requirements.', 'Exigences de visa.', 'متطلبات التأشيرة.'), 'date' => '2026-06-18', 'category' => $this->loc('News', 'Actualités', 'أخبار'), 'image' => $this->img('photo-1488646953014-85cb44e25828'), 'content' => $this->loc('Visa updates.', 'Mise à jour visa.', 'تحديثات.')],
        ];

        foreach ($posts as $data) {
            BlogPost::updateOrCreate(['slug' => $data['slug']], $data);
            $this->assignCategory('blog', BlogPost::where('slug', $data['slug'])->first()->id, $data['category_key'] ?? null, 'blog_category');
        }
    }

    // ─── Promos ────────────────────────────────────────────────────────

    private function seedPromos(): void
    {
        $promos = [
            ['code' => 'SUMMER2026', 'title' => $this->loc('Summer Special', 'Offre Été', 'عرض الصيف'), 'discount' => $this->loc('20% OFF', '20% OFF', 'خصم 20%'), 'description' => $this->loc('20% off summer bookings.', '20% sur réservations estivales.', 'خصم 20% على حجوزات الصيف.'), 'expires' => $this->loc('August 31, 2026', '31 août 2026', '31 أغسطس 2026'), 'color' => '#FF6B35'],
            ['code' => 'FAMILY2026', 'title' => $this->loc('Family Promo', 'Promo Famille', 'عرض العائلة'), 'discount' => $this->loc('Kids Stay Free', 'Enfants Gratuit', 'الأطفال مجانًا'), 'description' => $this->loc('Children under 12 free.', 'Enfants < 12 gratuits.', 'أطفال < 12 مجانًا.'), 'expires' => $this->loc('December 31, 2026', '31 décembre 2026', '31 ديسمبر 2026'), 'color' => '#4ECDC4'],
            ['code' => 'EARLY2026', 'title' => $this->loc('Early Bird', 'Oiseau Matinal', 'حجز مبكر'), 'discount' => $this->loc('15% OFF', '15% OFF', 'خصم 15%'), 'description' => $this->loc('Book 60 days ahead.', 'Réservez 60 jours avant.', 'احجز قبل 60 يومًا.'), 'expires' => $this->loc('October 31, 2026', '31 octobre 2026', '31 أكتوبر 2026'), 'color' => '#45B7D1'],
            ['code' => 'LUXURY2026', 'title' => $this->loc('Luxury Upgrade', 'Surclassement', 'ترقية فاخرة'), 'discount' => $this->loc('Free Upgrade', 'Surclassement Gratuit', 'ترقية مجانية'), 'description' => $this->loc('Free room upgrade.', 'Surclassement gratuit.', 'ترقية مجانية للغرفة.'), 'expires' => $this->loc('December 31, 2026', '31 décembre 2026', '31 ديسمبر 2026'), 'color' => '#96CEB4'],
            ['code' => 'HONEY2026', 'title' => $this->loc('Honeymoon', 'Lune de Miel', 'شهر العسل'), 'discount' => $this->loc('10% OFF + Spa', '10% OFF + Spa', 'خصم 10% + سبا'), 'description' => $this->loc('Romantic getaway.', 'Escapade romantique.', 'هروب رومانسي.'), 'expires' => $this->loc('December 31, 2026', '31 décembre 2026', '31 ديسمبر 2026'), 'color' => '#DDA0DD'],
            ['code' => 'GROUP2026', 'title' => $this->loc('Group Rate', 'Tarif Groupe', 'سعر المجموعة'), 'discount' => $this->loc('15% OFF 10+', '15% OFF 10+', 'خصم 15% لمجموعات 10+'), 'description' => $this->loc('Group rate.', 'Tarif groupe.', 'سعر المجموعات.'), 'expires' => $this->loc('December 31, 2026', '31 décembre 2026', '31 ديسمبر 2026'), 'color' => '#FF8C00'],
            ['code' => 'WEEKEND26', 'title' => $this->loc('Weekend Deal', 'Offre Weekend', 'عرض نهاية الأسبوع'), 'discount' => $this->loc('BOGO Nights', '2 pour 1', '2 بسعر 1'), 'description' => $this->loc('Stay 3, pay 2.', '3 nuits, payez 2.', 'أقم 3، ادفع 2.'), 'expires' => $this->loc('September 30, 2026', '30 septembre 2026', '30 سبتمبر 2026'), 'color' => '#87CEEB'],
            ['code' => 'LASTMIN26', 'title' => $this->loc('Last Minute', 'Dernière Minute', 'اللحظة الأخيرة'), 'discount' => $this->loc('25% OFF', '25% OFF', 'خصم 25%'), 'description' => $this->loc('Depart in 7 days.', 'Partez dans 7 jours.', 'سافر خلال 7 أيام.'), 'expires' => $this->loc('July 31, 2026', '31 juillet 2026', '31 يوليو 2026'), 'color' => '#FF4500'],
            ['code' => 'DUBAI2026', 'title' => $this->loc('Dubai Special', 'Offre Dubaï', 'عرض دبي'), 'discount' => $this->loc('20% OFF Hotels', '20% OFF Hôtels', 'خصم 20% على الفنادق'), 'description' => $this->loc('Dubai rates.', 'Tarifs Dubaï.', 'أسعار دبي.'), 'expires' => $this->loc('November 30, 2026', '30 novembre 2026', '30 نوفمبر 2026'), 'color' => '#FFD700'],
            ['code' => 'OMRA2026', 'title' => $this->loc('Omra Special', 'Offre Omra', 'عرض عمرة'), 'discount' => $this->loc('100 TND OFF', '100 TND OFF', 'خصم 100 دينار'), 'description' => $this->loc('Omra discount.', 'Réduction Omra.', 'خصم على العمر.'), 'expires' => $this->loc('April 30, 2026', '30 avril 2026', '30 أبريل 2026'), 'color' => '#2E8B57'],
        ];

        foreach ($promos as $data) {
            Promo::updateOrCreate(['code' => $data['code']], $data);
        }
    }

    // ─── Visas ─────────────────────────────────────────────────────────

    private function seedVisas(): void
    {
        $visas = [
            ['code' => 'FR', 'flag' => '🇫🇷', 'price' => 280, 'sort_order' => 1, 'name' => $this->loc('France', 'France', 'فرنسا'), 'region' => $this->loc('Europe', 'Europe', 'أوروبا'), 'processing' => $this->loc('10-15 days', '10-15 jours', '10-15 يوم')],
            ['code' => 'IT', 'flag' => '🇮🇹', 'price' => 260, 'sort_order' => 2, 'name' => $this->loc('Italy', 'Italie', 'إيطاليا'), 'region' => $this->loc('Europe', 'Europe', 'أوروبا'), 'processing' => $this->loc('10-15 days', '10-15 jours', '10-15 يوم')],
            ['code' => 'ES', 'flag' => '🇪🇸', 'price' => 260, 'sort_order' => 3, 'name' => $this->loc('Spain', 'Espagne', 'إسبانيا'), 'region' => $this->loc('Europe', 'Europe', 'أوروبا'), 'processing' => $this->loc('12-18 days', '12-18 jours', '12-18 يوم')],
            ['code' => 'DE', 'flag' => '🇩🇪', 'price' => 290, 'sort_order' => 4, 'name' => $this->loc('Germany', 'Allemagne', 'ألمانيا'), 'region' => $this->loc('Europe', 'Europe', 'أوروبا'), 'processing' => $this->loc('10-14 days', '10-14 jours', '10-14 يوم')],
            ['code' => 'GB', 'flag' => '🇬🇧', 'price' => 550, 'sort_order' => 5, 'name' => $this->loc('United Kingdom', 'Royaume-Uni', 'المملكة المتحدة'), 'region' => $this->loc('Europe', 'Europe', 'أوروبا'), 'processing' => $this->loc('15-21 days', '15-21 jours', '15-21 يوم')],
            ['code' => 'US', 'flag' => '🇺🇸', 'price' => 620, 'sort_order' => 6, 'name' => $this->loc('United States', 'États-Unis', 'الولايات المتحدة'), 'region' => $this->loc('America', 'Amérique', 'أمريكا'), 'processing' => $this->loc('30-60 days', '30-60 jours', '30-60 يوم')],
            ['code' => 'CA', 'flag' => '🇨🇦', 'price' => 480, 'sort_order' => 7, 'name' => $this->loc('Canada', 'Canada', 'كندا'), 'region' => $this->loc('America', 'Amérique', 'أمريكا'), 'processing' => $this->loc('20-40 days', '20-40 jours', '20-40 يوم')],
            ['code' => 'AE', 'flag' => '🇦🇪', 'price' => 220, 'sort_order' => 8, 'name' => $this->loc('UAE', 'EAU', 'الإمارات'), 'region' => $this->loc('Middle East', 'Moyen-Orient', 'الشرق الأوسط'), 'processing' => $this->loc('3-5 days', '3-5 jours', '3-5 أيام')],
            ['code' => 'SA', 'flag' => '🇸🇦', 'price' => 340, 'sort_order' => 9, 'name' => $this->loc('Saudi Arabia', 'Arabie Saoudite', 'السعودية'), 'region' => $this->loc('Middle East', 'Moyen-Orient', 'الشرق الأوسط'), 'processing' => $this->loc('5-10 days', '5-10 jours', '5-10 أيام')],
            ['code' => 'TR', 'flag' => '🇹🇷', 'price' => 120, 'sort_order' => 10, 'name' => $this->loc('Turkey', 'Turquie', 'تركيا'), 'region' => $this->loc('Middle East', 'Moyen-Orient', 'الشرق الأوسط'), 'processing' => $this->loc('1-3 days', '1-3 jours', '1-3 أيام')],
            ['code' => 'CN', 'flag' => '🇨🇳', 'price' => 380, 'sort_order' => 11, 'name' => $this->loc('China', 'Chine', 'الصين'), 'region' => $this->loc('Asia', 'Asie', 'آسيا'), 'processing' => $this->loc('10-15 days', '10-15 jours', '10-15 يوم')],
            ['code' => 'JP', 'flag' => '🇯🇵', 'price' => 320, 'sort_order' => 12, 'name' => $this->loc('Japan', 'Japon', 'اليابان'), 'region' => $this->loc('Asia', 'Asie', 'آسيا'), 'processing' => $this->loc('7-10 days', '7-10 jours', '7-10 أيام')],
            ['code' => 'TH', 'flag' => '🇹🇭', 'price' => 240, 'sort_order' => 13, 'name' => $this->loc('Thailand', 'Thaïlande', 'تايلاند'), 'region' => $this->loc('Asia', 'Asie', 'آسيا'), 'processing' => $this->loc('5-8 days', '5-8 jours', '5-8 أيام')],
            ['code' => 'MY', 'flag' => '🇲🇾', 'price' => 210, 'sort_order' => 14, 'name' => $this->loc('Malaysia', 'Malaisie', 'ماليزيا'), 'region' => $this->loc('Asia', 'Asie', 'آسيا'), 'processing' => $this->loc('5-7 days', '5-7 jours', '5-7 أيام')],
            ['code' => 'ID', 'flag' => '🇮🇩', 'price' => 250, 'sort_order' => 15, 'name' => $this->loc('Indonesia', 'Indonésie', 'إندونيسيا'), 'region' => $this->loc('Asia', 'Asie', 'آسيا'), 'processing' => $this->loc('7-10 days', '7-10 jours', '7-10 أيام')],
            ['code' => 'AU', 'flag' => '🇦🇺', 'price' => 580, 'sort_order' => 16, 'name' => $this->loc('Australia', 'Australie', 'أستراليا'), 'region' => $this->loc('Oceania', 'Océanie', 'أوقيانوسيا'), 'processing' => $this->loc('20-30 days', '20-30 jours', '20-30 يوم')],
            ['code' => 'ZA', 'flag' => '🇿🇦', 'price' => 300, 'sort_order' => 17, 'name' => $this->loc('South Africa', 'Afrique du Sud', 'جنوب أفريقيا'), 'region' => $this->loc('Africa', 'Afrique', 'أفريقيا'), 'processing' => $this->loc('10-15 days', '10-15 jours', '10-15 يوم')],
            ['code' => 'EG', 'flag' => '🇪🇬', 'price' => 180, 'sort_order' => 18, 'name' => $this->loc('Egypt', 'Égypte', 'مصر'), 'region' => $this->loc('Africa', 'Afrique', 'أفريقيا'), 'processing' => $this->loc('5-7 days', '5-7 jours', '5-7 أيام')],
        ];

        foreach ($visas as $data) {
            Visa::updateOrCreate(['code' => $data['code']], $data);
        }
    }

    // ─── Teams ─────────────────────────────────────────────────────────

    private function seedTeams(): void
    {
        $teams = [
            ['name' => $this->loc('Ahmed Ben Ali', 'Ahmed Ben Ali', 'أحمد بن علي'), 'role' => $this->loc('CEO & Founder', 'PDG & Fondateur', 'المدير العام والمؤسس'), 'bio' => $this->loc('15+ years of travel experience.', '15+ ans d\'expérience.', 'خبرة تزيد عن 15 عامًا.'), 'image_path' => $this->img('photo-1560250097-0b93528c311a', 400, 400)],
            ['name' => $this->loc('Fatma Mansour', 'Fatma Mansour', 'فاطمة منصور'), 'role' => $this->loc('Travel Director', 'Directrice Voyage', 'مديرة السفر'), 'bio' => $this->loc('Luxury and honeymoon expert.', 'Experte luxe et lune de miel.', 'خبيرة في الفخامة وشهر العسل.'), 'image_path' => $this->img('photo-1573496359142-b8d87734a5a2', 400, 400)],
            ['name' => $this->loc('Mohamed Trabelsi', 'Mohamed Trabelsi', 'محمد الطربلسي'), 'role' => $this->loc('Booking Manager', 'Manager Réservations', 'مدير الحجوزات'), 'bio' => $this->loc('Group and corporate travel.', 'Voyage groupe et affaires.', 'سفر المجموعات والأعمال.'), 'image_path' => $this->img('photo-1472099645785-5658abf4ff4e', 400, 400)],
            ['name' => $this->loc('Amira Bouazizi', 'Amira Bouazizi', 'أميرة بوعزيزي'), 'role' => $this->loc('Customer Relations', 'Relations Client', 'علاقات العملاء'), 'bio' => $this->loc('Exceptional customer service.', 'Service client exceptionnel.', 'خدمة عملاء استثنائية.'), 'image_path' => $this->img('photo-1580489944761-15a19d654956', 400, 400)],
            ['name' => $this->loc('Youssef Khelifi', 'Youssef Khelifi', 'يوسف الخليفي'), 'role' => $this->loc('Marketing Manager', 'Directeur Marketing', 'مدير التسويق'), 'bio' => $this->loc('Digital presence expert.', 'Expert présence digitale.', 'خبير الحضور الرقمي.'), 'image_path' => $this->img('photo-1507003211169-0a1dd7228f2d', 400, 400)],
            ['name' => $this->loc('Nour Sassi', 'Nour Sassi', 'نور ساسي'), 'role' => $this->loc('Tour Guide', 'Guide Touristique', 'مرشد سياحي'), 'bio' => $this->loc('Certified guide for all Tunisia.', 'Guide agréé toute Tunisie.', 'مرشد معتمد لكل تونس.'), 'image_path' => $this->img('photo-1438761681033-6461ffad8d80', 400, 400)],
            ['name' => $this->loc('Karim Jaziri', 'Karim Jaziri', 'كريم الجازري'), 'role' => $this->loc('Events Coordinator', 'Coordinateur Événements', 'منسق الفعاليات'), 'bio' => $this->loc('Festival and event organizer.', 'Organisateur festivals.', 'منظم المهرجانات.'), 'image_path' => $this->img('photo-1500648767791-00dcc994a43e', 400, 400)],
            ['name' => $this->loc('Leila Ben Salah', 'Leila Ben Salah', 'ليلى بن صالح'), 'role' => $this->loc('Visa Specialist', 'Spécialiste Visa', 'متخصصة التأشيرات'), 'bio' => $this->loc('Expert in all visa types.', 'Experte tous types de visa.', 'خبيرة في جميع أنواع التأشيرات.'), 'image_path' => $this->img('photo-1544005313-94ddf0286df2', 400, 400)],
        ];

        foreach ($teams as $data) {
            Team::create($data);
        }
    }

    // ─── Partners ──────────────────────────────────────────────────────

    private function seedPartners(): void
    {
        $partners = [
            ['name' => $this->loc('Tunisair', 'Tunisair', 'الخطوط التونسية'), 'description' => $this->loc('National airline.', 'Compagnie nationale.', 'الخطوط الوطنية.'), 'website' => 'https://www.tunisair.com', 'logo_path' => $this->img('photo-1436491865332-7a61a109db05', 300, 150), 'category' => 'airline'],
            ['name' => $this->loc('Emirates', 'Emirates', 'طيران الإمارات'), 'description' => $this->loc('Premium airline.', 'Compagnie premium.', 'طيران فاخر.'), 'website' => 'https://www.emirates.com', 'logo_path' => $this->img('photo-1464037866556-6812c9d1c72e', 300, 150), 'category' => 'airline'],
            ['name' => $this->loc('Hertz Tunisia', 'Hertz Tunisie', 'هرتز تونس'), 'description' => $this->loc('Car rental leader.', 'Leader location.', 'رائد التأجير.'), 'website' => 'https://www.hertz.com', 'logo_path' => $this->img('photo-1621007947382-bb3c3994e3fb', 300, 150), 'category' => 'car-rental'],
            ['name' => $this->loc('Iberostar Hotels', 'Hôtels Iberostar', 'فنادق إيبيروستار'), 'description' => $this->loc('International hotel chain.', 'Chaîne internationale.', 'سلسلة دولية.'), 'website' => 'https://www.iberostar.com', 'logo_path' => $this->img('photo-1520250497591-112f2f40a3f4', 300, 150), 'category' => 'hotel'],
            ['name' => $this->loc('Marriott Hotels', 'Hôtels Marriott', 'فنادق ماريوت'), 'description' => $this->loc('Global brand.', 'Marque mondiale.', 'علامة عالمية.'), 'website' => 'https://www.marriott.com', 'logo_path' => $this->img('photo-1566073771259-6a8506099945', 300, 150), 'category' => 'hotel'],
            ['name' => $this->loc('Sousse Tourism', 'Tourisme Sousse', 'السياحة بسوسة'), 'description' => $this->loc('Sousse tourism board.', 'Office tourisme Sousse.', 'مكتب السياحة.'), 'website' => null, 'logo_path' => $this->img('photo-1570077188670-e3a8d69ac5ff', 300, 150), 'category' => 'destination'],
            ['name' => $this->loc('Djerba Tourism', 'Tourisme Djerba', 'السياحة بجربة'), 'description' => $this->loc('Djerba tourism.', 'Tourisme Djerba.', 'سياحة جربة.'), 'website' => null, 'logo_path' => $this->img('photo-1507525428034-b723cf961d3e', 300, 150), 'category' => 'destination'],
            ['name' => $this->loc('Nouvelair', 'Nouvelair', 'نوفل آير'), 'description' => $this->loc('Charter airline.', 'Compagnie charter.', 'طيران تشارتر.'), 'website' => 'https://www.nouvelair.com', 'logo_path' => $this->img('photo-1488085061387-422e29b40080', 300, 150), 'category' => 'airline'],
            ['name' => $this->loc('Club Med', 'Club Med', 'كيلب ميد'), 'description' => $this->loc('All-inclusive chain.', 'Chaîne tout inclus.', 'سلسلة شاملة.'), 'website' => 'https://www.clubmed.com', 'logo_path' => $this->img('photo-1571003123894-1f0594d2b5d9', 300, 150), 'category' => 'hotel'],
            ['name' => $this->loc('Qatar Airways', 'Qatar Airways', 'الخطوط القطرية'), 'description' => $this->loc('World-class airline.', 'Compagnie mondiale.', 'طيران عالمي.'), 'website' => 'https://www.qatarairways.com', 'logo_path' => $this->img('photo-1464037866556-6812c9d1c72e', 300, 150), 'category' => 'airline'],
        ];

        foreach ($partners as $data) {
            Partner::create($data);
        }
    }

    // ─── Gallery ───────────────────────────────────────────────────────

    private function seedGalleryImages(): void
    {
        $gallery = [
            ['url' => $this->img('photo-1507525428034-b723cf961d3e', 1200, 800), 'caption' => $this->loc('Djerba waters', 'Eaux de Djerba', 'مياه جربة'), 'title' => $this->loc('Djerba Beach', 'Plage Djerba', 'شاطئ جربة'), 'category' => 'beach'],
            ['url' => $this->img('photo-1524231757912-21f4fe3a7200', 1200, 800), 'caption' => $this->loc('Istanbul sunset', 'Coucher Istanbul', 'غروب إسطنبول'), 'title' => $this->loc('Istanbul', 'Istanbul', 'إسطنبول'), 'category' => 'city'],
            ['url' => $this->img('photo-1518730518541-d0843268c287', 1200, 800), 'caption' => $this->loc('Marrakech souk', 'Souk Marrakech', 'سوق مراكش'), 'title' => $this->loc('Marrakech', 'Marrakech', 'مراكش'), 'category' => 'city'],
            ['url' => $this->img('photo-1537996194471-e657df975ab4', 1200, 800), 'caption' => $this->loc('Bali terraces', 'Rizières Bali', 'حقول بالي'), 'title' => $this->loc('Bali', 'Bali', 'بالي'), 'category' => 'nature'],
            ['url' => $this->img('photo-1572252009286-268acec5ca0a', 1200, 800), 'caption' => $this->loc('Pyramids', 'Pyramides', 'الأهرامات'), 'title' => $this->loc('Cairo', 'Le Caire', 'القاهرة'), 'category' => 'historic'],
            ['url' => $this->img('photo-1512453979798-5ea266f8880c', 1200, 800), 'caption' => $this->loc('Dubai skyline', 'Skyline Dubaï', 'أفق دبي'), 'title' => $this->loc('Dubai', 'Dubaï', 'دبي'), 'category' => 'city'],
            ['url' => $this->img('photo-1596395819908-2c9ea3320d7c', 1200, 800), 'caption' => $this->loc('Pamukkale', 'Pamukkale', 'باموكالي'), 'title' => $this->loc('Pamukkale', 'Pamukkale', 'باموكالي'), 'category' => 'nature'],
            ['url' => $this->img('photo-1502602898657-3e91760cbb34', 1200, 800), 'caption' => $this->loc('Eiffel Tower', 'Tour Eiffel', 'برج إيفل'), 'title' => $this->loc('Paris', 'Paris', 'باريس'), 'category' => 'city'],
            ['url' => $this->img('photo-1591825729269-caeb344f6df2', 1200, 800), 'caption' => $this->loc('Holy Kaaba', 'Kaaba', 'الكعبة'), 'title' => $this->loc('Mecca', 'La Mecque', 'مكة'), 'category' => 'religious'],
            ['url' => $this->img('photo-1555993539-1732b0258235', 1200, 800), 'caption' => $this->loc('Carthage ruins', 'Ruines Carthage', 'أطلال قرطاج'), 'title' => $this->loc('Carthage', 'Carthage', 'قرطاج'), 'category' => 'historic'],
            ['url' => $this->img('photo-1509600110300-21b9d5fedeb7', 1200, 800), 'caption' => $this->loc('Sahara dunes', 'Dunes Sahara', 'كثبان الصحراء'), 'title' => $this->loc('Sahara', 'Sahara', 'الصحراء'), 'category' => 'nature'],
            ['url' => $this->img('photo-1565711561500-49678a10a63f', 1200, 800), 'caption' => $this->loc('Hammamet beach', 'Plage Hammamet', 'شاطئ الحمامات'), 'title' => $this->loc('Hammamet', 'Hammamet', 'الحمامات'), 'category' => 'beach'],
        ];

        foreach ($gallery as $data) {
            GalleryImage::create($data);
        }
    }

    // ─── Site Settings ─────────────────────────────────────────────────

    private function seedSiteSettings(): void
    {
        SiteSetting::query()->updateOrCreate(['id' => 1], [
            'company_name' => 'Bel Azur Travel',
            'email' => 'contact@belazurtravel.com',
            'phone' => '+216 23 777 771',
            'whatsapp' => '21623777771',
            'address' => '3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse',
            'year' => 2026,
            'social_links' => [
                ['label' => 'Facebook', 'href' => 'https://facebook.com'],
                ['label' => 'Instagram', 'href' => 'https://instagram.com'],
                ['label' => 'YouTube', 'href' => 'https://youtube.com'],
            ],
            'footer_links' => [
                ['labelKey' => 'nav.hotels', 'href' => '/hotels', 'group' => 'quick'],
                ['labelKey' => 'nav.tours', 'href' => '/tours', 'group' => 'quick'],
                ['labelKey' => 'nav.destinations', 'href' => '/destinations', 'group' => 'quick'],
                ['labelKey' => 'nav.cars', 'href' => '/cars', 'group' => 'quick'],
                ['labelKey' => 'nav.contact', 'href' => '/contact', 'group' => 'support'],
                ['labelKey' => 'nav.legal', 'href' => '/legal', 'group' => 'support'],
                ['labelKey' => 'nav.privacy-policy', 'href' => '/privacy-policy', 'group' => 'support'],
                ['labelKey' => 'nav.purchase-policy', 'href' => '/purchase-policy', 'group' => 'support'],
                ['labelKey' => 'nav.promos', 'href' => '/promos', 'group' => 'support'],
                ['labelKey' => 'nav.team', 'href' => '/team', 'group' => 'support'],
            ],
            'hours' => [
                ['dayKey' => 'footer.mon', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.tue', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.wed', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.thu', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.fri', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.sat', 'ranges' => [['value' => '08:00 - 19:00']], 'closed' => false],
                ['dayKey' => 'footer.sun', 'ranges' => [], 'closed' => true],
            ],
            'content' => $this->buildSiteContent(),
        ]);
    }

    private function buildSiteContent(): array
    {
        return [
            'page_heroes' => [
                'home' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1507525428034-b723cf961d3e', 1600, 900), 'title' => $this->loc('Discover Tunisia', 'Découvrez la Tunisie', 'اكتشف تونس'), 'subtitle' => $this->loc('Beautiful beaches and rich culture', 'Belles plages et riche culture', 'شواطئ جميلة وثقافة غنية')],
                        ['url' => $this->img('photo-1524231757912-21f4fe3a7200', 1600, 900), 'title' => $this->loc('Istanbul Awaits', 'Istanbul vous attend', 'إسطنبول في انتظارك'), 'subtitle' => $this->loc('Two continents, one adventure', 'Deux continents, une aventure', 'قارتان، مغامرة واحدة')],
                        ['url' => $this->img('photo-1512453979798-5ea266f8880c', 1600, 900), 'title' => $this->loc('Dubai Luxury', 'Luxe Dubaï', 'فخامة دبي'), 'subtitle' => $this->loc('Experience the extraordinary', 'Vivez l\'extraordinaire', 'استمتع بالاستثنائي')],
                    ],
                ],
                'hotels' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1566073771259-6a8506099945', 1600, 900), 'title' => $this->loc('Luxury Hotels', 'Hôtels de Luxe', 'فنادق فاخرة'), 'subtitle' => $this->loc('Best stays in Tunisia', 'Meilleurs hébergements en Tunisie', 'أفضل الإقامات في تونس')],
                        ['url' => $this->img('photo-1520250497591-112f2f40a3f4', 1600, 900), 'title' => $this->loc('Beach Resorts', 'Resorts de Plage', 'منتجعات شاطئية'), 'subtitle' => $this->loc('Oceanfront paradise', 'Paradis en bord de mer', 'جنة على شاطئ البحر')],
                    ],
                ],
                'tours' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1509600110300-21b9d5fedeb7', 1600, 900), 'title' => $this->loc('Desert Adventures', 'Aventures Désert', 'مغامرات صحراوية'), 'subtitle' => $this->loc('Explore the Sahara', 'Explorez le Sahara', 'استكشف الصحراء')],
                        ['url' => $this->img('photo-1555993539-1732b0258235', 1600, 900), 'title' => $this->loc('Historic Tunisia', 'Tunisie Historique', 'تونس التاريخية'), 'subtitle' => $this->loc('Ancient Carthage and medinas', 'Carthage antique et médinas', 'قرطاج القديمة والمدن العتيقة')],
                    ],
                ],
                'travels' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1537996194471-e657df975ab4', 1600, 900), 'title' => $this->loc('Bali Paradise', 'Paradis Bali', 'جنة بالي'), 'subtitle' => $this->loc('Temples and rice terraces', 'Temples et rizières', 'معالم وحقول أرز')],
                        ['url' => $this->img('photo-1591825729269-caeb344f6df2', 1600, 900), 'title' => $this->loc('Spiritual Journeys', 'Voyages Spirituels', 'رحلات روحانية'), 'subtitle' => $this->loc('Omra and holy sites', 'Omra et lieux saints', 'عمرة والأماكن المقدسة')],
                    ],
                ],
                'destinations' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1565711561500-49678a10a63f', 1600, 900), 'title' => $this->loc('Hammamet', 'Hammamet', 'الحمامات'), 'subtitle' => $this->loc('Tunisia\'s gem', 'Joyau de la Tunisie', 'جوهرة تونس')],
                        ['url' => $this->img('photo-1518730518541-d0843268c287', 1600, 900), 'title' => $this->loc('Marrakech', 'Marrakech', 'مراكش'), 'subtitle' => $this->loc('The Red City', 'La Ville Rouge', 'المدينة الحمراء')],
                    ],
                ],
                'cars' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1621007947382-bb3c3994e3fb', 1600, 900), 'title' => $this->loc('Car Rental', 'Location de Voiture', 'تأجير سيارات'), 'subtitle' => $this->loc('Explore at your own pace', 'Explorez à votre rythme', 'استكشف بإيقاعك')],
                    ],
                ],
                'flights' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1436491865332-7a61a109db05', 1600, 900), 'title' => $this->loc('Flight Deals', 'Offres de Vol', 'عروض الطيران'), 'subtitle' => $this->loc('Fly to your dream destination', 'Volez vers votre destination', 'سافر إلى وجهتك المفضلة')],
                    ],
                ],
                'events' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1459749411175-04bf5292ceea', 1600, 900), 'title' => $this->loc('Events & Festivals', 'Événements & Festivals', 'فعاليات ومهرجانات'), 'subtitle' => $this->loc('Cultural experiences', 'Expériences culturelles', 'تجارب ثقافية')],
                    ],
                ],
                'deals' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1469854523086-cc02fe5d8800', 1600, 900), 'title' => $this->loc('Special Offers', 'Offres Spéciales', 'عروض خاصة'), 'subtitle' => $this->loc('Save on your next trip', 'Économisez sur votre prochain voyage', 'وفّر في رحلتك القادمة')],
                    ],
                ],
                'blog' => [
                    'interval' => 6000,
                    'images' => [
                        ['url' => $this->img('photo-1488646953014-85cb44e25828', 1600, 900), 'title' => $this->loc('Travel Blog', 'Blog Voyage', 'مدونة السفر'), 'subtitle' => $this->loc('Tips and inspiration', 'Conseils et inspiration', 'نصائح وإلهام')],
                    ],
                ],
            ],
            'landing_video' => ['url' => '/storage/uploads/site/1rE5Aaj7YL9P30iDynq2lagcXyAc8sOeU5e6vsSv.mp4'],
            'landing_sections' => [
                'order' => ['destinations', 'hotels', 'organized', 'tours', 'cars', 'flights', 'events', 'deals', 'blog'],
                'sections' => [
                    'destinations' => ['enabled' => true, 'style' => 'carousel'],
                    'hotels' => ['enabled' => true, 'style' => 'carousel'],
                    'organized' => ['enabled' => true, 'style' => 'carousel'],
                    'tours' => ['enabled' => true, 'style' => 'carousel'],
                    'cars' => ['enabled' => true, 'style' => 'cards'],
                    'flights' => ['enabled' => true, 'style' => 'cards'],
                    'events' => ['enabled' => true, 'style' => 'carousel'],
                    'deals' => ['enabled' => true, 'style' => 'cards'],
                    'blog' => ['enabled' => true, 'style' => 'carousel'],
                ],
            ],
            'footer' => [
                'tagline' => $this->loc('Your trusted travel agency in Tunisia. Unforgettable experiences at the best price.', 'Votre agence de voyage de confiance en Tunisie. Des expériences inoubliables au meilleur prix.', 'وكالة السفر الموثوقة في تونس. تجارب لا تُنسى بأفضل الأسعار.'),
            ],
            'contact' => [
                'kicker' => $this->loc('Contact us', 'Contactez-nous', 'اتصل بنا'),
                'title' => $this->loc('Plan your next trip with Bel Azur Travel', 'Planifiez votre prochain voyage avec Bel Azur Travel', 'خطط لرحلتك القادمة مع بيل أزور ترافل'),
                'description' => $this->loc('Reach our team by phone, email, WhatsApp or by visiting our office in Sousse.', 'Contactez notre équipe par téléphone, e-mail, WhatsApp ou en visitant notre bureau à Sousse.', 'تواصل مع فريقنا عبر الهاتف أو البريد الإلكتروني أو واتساب أو بزيارة مكتبنا في سوسة.'),
                'locationTitle' => $this->loc('Our office', 'Notre agence', 'مكتبنا'),
                'locationSubtitle' => $this->loc('Find us on the map.', 'Retrouvez-nous sur la carte.', 'اعثر علينا على الخريطة.'),
                'socialTitle' => $this->loc('Follow us', 'Suivez-nous', 'تابعنا'),
                'socialDescription' => $this->loc('Stay updated with our latest offers.', 'Restez informé de nos offres.', 'ابقَ على اطلاع بآخر العروض.'),
            ],
            'privacy_policy' => [
                'title' => $this->loc('Privacy Policy', 'Politique de Confidentialité', 'سياسة الخصوصية'),
                'body' => [
                    'format' => 'markdown',
                    'content' => $this->loc(
                        "## 1. Introduction\n\nBel Azur Travel is committed to protecting your privacy.\n\n## 2. Data We Collect\n\n- Account information\n- Booking details\n- Payment information\n\n## 3. How We Use Your Data\n\n- Process bookings\n- Communicate about reservations\n- Improve our services\n\n---\n\n*Last updated: June 2026*",
                        "## 1. Introduction\n\nBel Azur Travel s'engage à protéger votre vie privée.\n\n## 2. Données Collectées\n\n- Informations de compte\n- Détails de réservation\n- Informations de paiement\n\n## 3. Utilisation des Données\n\n- Traitement des réservations\n- Communication\n- Amélioration des services\n\n---\n\n*Dernière mise à jour : Juin 2026*",
                        "## 1. المقدمة\n\nتلتزم بيل أزور للسفر بحماية خصوصيتك.\n\n## 2. البيانات المجمعة\n\n- معلومات الحساب\n- تفاصيل الحجز\n- معلومات الدفع\n\n## 3. استخدام البيانات\n\n- معالجة الحجوزات\n- التواصل\n- تحسين الخدمات\n\n---\n\n*آخر تحديث: يونيو 2026*"
                    ),
                ],
            ],
            'purchase_policy' => [
                'title' => $this->loc('Purchase Policy', "Politique d'Achat", 'سياسة الشراء'),
                'body' => [
                    'format' => 'markdown',
                    'content' => $this->loc(
                        "## 1. Introduction\n\nThis Purchase Policy governs all bookings made through Bel Azur Travel.\n\n## 2. Booking Process\n\n1. Selection\n2. Personal Information\n3. Payment\n4. Confirmation\n\n## 3. Cancellation\n\n- Free cancellation up to 48 hours before check-in\n- 50% refund for cancellations within 48 hours\n\n---\n\n*Last updated: June 2026*",
                        "## 1. Introduction\n\nCette Politique d'Achat régit toutes les réservations effectuées via Bel Azur Travel.\n\n## 2. Processus de Réservation\n\n1. Sélection\n2. Informations Personnelles\n3. Paiement\n4. Confirmation\n\n## 3. Annulation\n\n- Annulation gratuite jusqu'à 48h avant l'arrivée\n- Remboursement de 50% pour annulation sous 48h\n\n---\n\n*Dernière mise à jour : Juin 2026*",
                        "## 1. المقدمة\n\nتحكم سياسة الشراء هذه جميع الحجوزات عبر بيل أزور للسفر.\n\n## 2. عملية الحجز\n\n1. الاختيار\n2. المعلومات الشخصية\n3. الدفع\n4. التأكيد\n\n## 3. الإلغاء\n\n- إلغاء مجاني قبل 48 ساعة\n- استرداد 50% للإلغاء خلال 48 ساعة\n\n---\n\n*آخر تحديث: يونيو 2026*"
                    ),
                ],
            ],
        ];
    }

    // ─── Users ─────────────────────────────────────────────────────────

    private function seedUsers(): void
    {
        $users = [
            ['name' => 'The Owner', 'email' => 'direction@belazurtravel.com', 'role' => 'owner', 'active' => true, 'email_verified_at' => null],
            ['name' => 'Super Admin', 'email' => 'management@belazurtravel.com', 'role' => 'superadmin', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Anna Admin', 'email' => 'contact@belazurtravel.com', 'role' => 'admin', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Sarah Johnson', 'email' => 'booking@belazurtravel.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Mike Chen', 'email' => 'commercial@belazurtravel.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Emma Davis', 'email' => 'noreply@belazurtravel.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Omar Ben Ahmed', 'email' => 'omar@test.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Saliha Mansour', 'email' => 'saliha@test.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Jean-Pierre Dupont', 'email' => 'jeanpierre@test.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Fatima Zahra', 'email' => 'fatima@test.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Marco Rossi', 'email' => 'marco@test.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
            ['name' => 'Yuki Tanaka', 'email' => 'yuki@test.com', 'role' => 'client', 'active' => true, 'email_verified_at' => now()],
        ];

        foreach ($users as $data) {
            $verifiedAt = $data['email_verified_at'];
            unset($data['email_verified_at']);

            $user = User::updateOrCreate(['email' => $data['email']], [
                'name' => $data['name'],
                'password' => 'password',
                'role' => $data['role'],
                'active' => $data['active'],
            ]);

            if ($verifiedAt && !$user->email_verified_at) {
                $user->forceFill(['email_verified_at' => $verifiedAt])->save();
            }
        }
    }

    // ─── Bookings ──────────────────────────────────────────────────────

    private function seedBookings(): void
    {
        $users = User::where('role', 'client')->get();
        if ($users->isEmpty()) {
            return;
        }

        $bookings = [
            ['type' => 'hotel', 'item_slug' => 'hotel-badira', 'start_date' => '2026-07-15', 'end_date' => '2026-07-20', 'total_amount' => 1400, 'status' => 'Confirmed', 'confirmed_at' => now()->subDays(5)],
            ['type' => 'hotel', 'item_slug' => 'hotel-iberostar', 'start_date' => '2026-08-01', 'end_date' => '2026-08-07', 'total_amount' => 1170, 'status' => 'Pending'],
            ['type' => 'tour', 'item_slug' => 'tour-omra-2026', 'start_date' => '2026-09-01', 'end_date' => '2026-09-15', 'total_amount' => 4150, 'status' => 'Confirmed', 'confirmed_at' => now()->subDays(10)],
            ['type' => 'travel', 'item_slug' => 'istanbul-cappadocia-discovery', 'start_date' => '2026-10-10', 'end_date' => '2026-10-17', 'total_amount' => 3780, 'status' => 'Pending'],
            ['type' => 'flight', 'item_slug' => 'TU712', 'start_date' => '2026-07-20', 'end_date' => null, 'total_amount' => 900, 'status' => 'Confirmed', 'confirmed_at' => now()->subDays(3)],
            ['type' => 'car', 'item_slug' => 'car-toyota-yaris', 'start_date' => '2026-07-15', 'end_date' => '2026-07-20', 'total_amount' => 425, 'status' => 'Confirmed', 'confirmed_at' => now()->subDays(2)],
            ['type' => 'hotel', 'item_slug' => 'hotel-concorde', 'start_date' => '2026-06-01', 'end_date' => '2026-06-05', 'total_amount' => 880, 'status' => 'Completed', 'confirmed_at' => now()->subDays(30)],
            ['type' => 'tour', 'item_slug' => 'tour-sud-tunisie', 'start_date' => '2026-05-20', 'end_date' => '2026-05-24', 'total_amount' => 589, 'status' => 'Completed', 'confirmed_at' => now()->subDays(40)],
            ['type' => 'hotel', 'item_slug' => 'hotel-occidental', 'start_date' => '2026-08-10', 'end_date' => '2026-08-14', 'total_amount' => 560, 'status' => 'Cancelled', 'cancelled_at' => now()->subDays(1)],
            ['type' => 'travel', 'item_slug' => 'dubai-abu-dhabi-luxury', 'start_date' => '2026-11-01', 'end_date' => '2026-11-07', 'total_amount' => 4980, 'status' => 'Pending'],
            ['type' => 'flight', 'item_slug' => 'EK748', 'start_date' => '2026-11-01', 'end_date' => null, 'total_amount' => 1300, 'status' => 'Pending'],
            ['type' => 'event', 'item_slug' => 'carthage-festival-2026', 'start_date' => '2026-07-15', 'end_date' => '2026-07-15', 'total_amount' => 170, 'status' => 'Confirmed', 'confirmed_at' => now()->subDays(7)],
        ];

        foreach ($bookings as $idx => $data) {
            $user = $users[$idx % $users->count()];
            Booking::updateOrCreate(
                ['user_id' => $user->id, 'item_slug' => $data['item_slug']],
                array_merge($data, [
                    'client' => ['name' => $user->name, 'email' => $user->email, 'phone' => '+216 ' . rand(20, 99) . ' ' . rand(100, 999) . ' ' . rand(1000, 9999)],
                    'travelers' => [rand(1, 4)],
                ])
            );
        }
    }

    // ─── Support Inquiries ─────────────────────────────────────────────

    private function seedSupportInquiries(): void
    {
        $inquiries = [
            ['status' => 'new', 'priority' => 'high', 'subject' => $this->loc('Booking modification', 'Modification', 'تعديل الحجز'), 'message' => $this->loc('Need to change dates.', 'Changer les dates.', 'تغيير التواريخ.')],
            ['status' => 'in_progress', 'priority' => 'medium', 'subject' => $this->loc('Visa delay', 'Retard visa', 'تأخير التأشيرة'), 'message' => $this->loc('Visa taking too long.', 'Visa prend trop de temps.', 'التأشيرة تستغرق وقتًا.')],
            ['status' => 'resolved', 'priority' => 'low', 'subject' => $this->loc('Hotel feedback', 'Avis hôtel', 'تقييم الفندق'), 'message' => $this->loc('Great hotel!', 'Super hôtel!', 'فندق رائع!'), 'resolved_at' => now()->subDays(2)],
            ['status' => 'new', 'priority' => 'medium', 'subject' => $this->loc('Car rental question', 'Question location', 'سؤال التأجير'), 'message' => $this->loc('Is insurance included?', 'Assurance incluse?', 'هل التأمين مشمول؟')],
            ['status' => 'in_progress', 'priority' => 'high', 'subject' => $this->loc('Flight cancellation', 'Annulation vol', 'إلغاء رحلة'), 'message' => $this->loc('Flight cancelled.', 'Vol annulé.', 'رحلة ملغاة.')],
            ['status' => 'resolved', 'priority' => 'medium', 'subject' => $this->loc('Promo issue', 'Problème promo', 'مشكلة كود'), 'message' => $this->loc('Code not working.', 'Code ne fonctionne pas.', 'الكود لا يعمل.'), 'resolved_at' => now()->subDays(1)],
            ['status' => 'new', 'priority' => 'low', 'subject' => $this->loc('General inquiry', 'Demande générale', 'استفسار عام'), 'message' => $this->loc('Group discounts?', 'Réductions groupe?', 'خصم المجموعات؟')],
            ['status' => 'in_progress', 'priority' => 'medium', 'subject' => $this->loc('Tour modification', 'Modification circuit', 'تعديل الجولة'), 'message' => $this->loc('Add extra day?', 'Ajouter un jour?', 'إضافة يوم؟')],
        ];

        $users = User::where('role', 'client')->get();
        foreach ($inquiries as $idx => $data) {
            $user = $users[$idx % $users->count()] ?? null;
            SupportInquiry::create([
                'user_id' => $user?->id,
                'client' => ['name' => $user->name ?? 'Guest', 'email' => $user->email ?? 'guest@test.com', 'phone' => '+216 20 000 000'],
                'subject' => $data['subject'],
                'message' => $data['message'],
                'status' => $data['status'],
                'priority' => $data['priority'],
                'resolved_at' => $data['resolved_at'] ?? null,
            ]);
        }
    }

    // ─── Complaints ────────────────────────────────────────────────────

    private function seedComplaints(): void
    {
        $complaints = [
            ['type' => 'service', 'status' => 'pending', 'priority' => 'high', 'subject' => $this->loc('Poor service', 'Mauvais service', 'خدمة سيئة'), 'description' => $this->loc('Staff was rude.', 'Personnel impoli.', 'الطاقم كان فظًا.')],
            ['type' => 'billing', 'status' => 'in_progress', 'priority' => 'medium', 'subject' => $this->loc('Double charge', 'Double facturation', 'خصم مزدوج'), 'description' => $this->loc('Charged twice.', 'Facturé deux fois.', 'تم خصم مرتين.')],
            ['type' => 'cancellation', 'status' => 'resolved', 'priority' => 'high', 'subject' => $this->loc('Refund request', 'Remboursement', 'استرداد'), 'description' => $this->loc('Flight cancelled, need refund.', 'Vol annulé, remboursement.', 'رحلة ملغاة، استرداد.'), 'refund_amount' => 900, 'resolved_at' => now()->subDays(3)],
            ['type' => 'quality', 'status' => 'pending', 'priority' => 'medium', 'subject' => $this->loc('Room mismatch', 'Non-conforme', 'عدم مطابقة'), 'description' => $this->loc('Room not as shown.', 'Chambre différente.', 'الغرفة مختلفة.')],
            ['type' => 'service', 'status' => 'in_progress', 'priority' => 'low', 'subject' => $this->loc('Late transfer', 'Transfert retard', 'تأخر النقل'), 'description' => $this->loc('Transfer 2h late.', 'Transfert 2h retard.', 'النقل متأخر ساعتين.')],
            ['type' => 'billing', 'status' => 'pending', 'priority' => 'high', 'subject' => $this->loc('Hidden fees', 'Frais cachés', 'رسوم خفية'), 'description' => $this->loc('Extra charges.', 'Frais supplémentaires.', 'رسوم إضافية.')],
            ['type' => 'cancellation', 'status' => 'resolved', 'priority' => 'medium', 'subject' => $this->loc('Tour refund', 'Remboursement circuit', 'استرداد الجولة'), 'description' => $this->loc('Tour cancelled.', 'Circuit annulé.', 'الجولة ملغاة.'), 'refund_amount' => 589, 'resolved_at' => now()->subDays(5)],
            ['type' => 'quality', 'status' => 'pending', 'priority' => 'low', 'subject' => $this->loc('Food quality', 'Qualité nourriture', 'جودة الطعام'), 'description' => $this->loc('Food below expectations.', 'Nourriture sous attentes.', 'الطعام أقل من المتوقع.')],
        ];

        $users = User::where('role', 'client')->get();
        foreach ($complaints as $idx => $data) {
            $user = $users[$idx % $users->count()] ?? null;
            Complaint::create([
                'user_id' => $user?->id,
                'type' => $data['type'],
                'subject' => $data['subject'],
                'description' => $data['description'],
                'status' => $data['status'],
                'priority' => $data['priority'],
                'refund_amount' => $data['refund_amount'] ?? null,
                'resolved_at' => $data['resolved_at'] ?? null,
            ]);
        }
    }

    // ─── Filter Booleans ───────────────────────────────────────────────

    private function seedFilterBooleans(): void
    {
        // Hotels — set filter booleans based on slug patterns
        Hotel::where('slug', 'hotel-badira')->update([
            'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true,
            'categorie_4_etoiles' => true, 'suite' => true, 'petit_dejeuner' => true,
        ]);
        Hotel::where('slug', 'hotel-iberostar')->update([
            'htel_recommande' => true, 'enfant_gratuit' => true, 'famille' => true,
            'sport_loisir' => true, 'chambre_double' => true, 'petit_dejeuner' => true,
        ]);
        Hotel::where('slug', 'hotel-concorde')->update([
            'htel_recommande' => true, 'enfant_gratuit' => true, 'demi_pension' => true,
            'famille' => true, 'sport_loisir' => true, 'chambre_double' => true,
        ]);
        Hotel::where('slug', 'hotel-occidental')->update([
            'tarifs_promo' => true, 'enfant_gratuit' => true, 'famille' => true,
            'logement_simple' => true, 'chambre_standard' => true, 'chambre_double' => true,
        ]);
        Hotel::where('slug', 'hotel-tunis-palace')->update([
            'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true,
            'categorie_4_etoiles' => true, 'suite' => true, 'petit_dejeuner' => true,
        ]);
        Hotel::where('slug', 'hotel-djerba-mediterranean')->update([
            'enfant_gratuit' => true, 'famille' => true, 'chambre_double' => true,
        ]);
        Hotel::where('slug', 'hotel-istanbul-grand')->update([
            'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true,
            'suite' => true, 'affaires' => true, 'categorie_4_etoiles' => true,
        ]);
        Hotel::where('slug', 'hotel-dubai-marina')->update([
            'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true,
            'suite' => true, 'categorie_4_etoiles' => true, 'petit_dejeuner' => true,
        ]);
        Hotel::where('slug', 'hotel-marrakech-riad')->update([
            'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true,
            'suite' => true,
        ]);
        Hotel::where('slug', 'hotel-paris-eiffel')->update([
            'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true,
            'suite' => true, 'affaires' => true, 'categorie_4_etoiles' => true,
        ]);
        Hotel::where('slug', 'hotel-bali-ubud')->update([
            'htel_recommande' => true, 'thalasso_spa' => true, 'detente' => true,
            'suite' => true, 'nature_aventure' => true,
        ]);
        Hotel::where('slug', 'hotel-cairo-pyramids')->update([
            'famille' => true, 'chambre_double' => true,
        ]);

        // Tours — set filter booleans
        Tour::whereIn('slug', ['tour-omra-2026', 'tour-sud-tunisie', 'tour-djerba-beach', 'tour-tunis-carthage'])->update(['tunisia' => true]);
        Tour::where('slug', 'tour-djerba-beach')->update(['djerba' => true, 'famille' => true]);
        Tour::whereIn('slug', ['tour-sud-tunisie'])->update(['sud_tunisien' => true]);
        Tour::whereIn('slug', ['tour-tunis-carthage'])->update(['nord_tunisien' => true, 'nord' => true]);
        Tour::where('slug', 'tour-istanbul-2026')->update(['tranquille' => true]);
        Tour::where('slug', 'tour-dubai-luxury')->update(['tranquille' => true]);
        Tour::where('slug', 'tour-paris-romance')->update(['tranquille' => true]);
        Tour::where('slug', 'tour-marrakech-explorer')->update(['tranquille' => true]);
        Tour::where('slug', 'tour-bali-adventure')->update(['jeune' => true]);
        Tour::where('slug', 'tour-cairo-pyramids')->update(['tranquille_groupe' => true]);

        // Travels — set filter booleans
        Travel::whereIn('slug', ['istanbul-cappadocia-discovery', 'antalya-pamukkale-fethiye'])->update(['europe' => true]);
        Travel::where('slug', 'istanbul-cappadocia-discovery')->update(['istanbul' => true, 'tranquille' => true]);
        Travel::whereIn('slug', ['dubai-abu-dhabi-luxury', 'kuala-lumpur-bali-eco', 'bangkok-chiang-mai', 'zanzibar-beach-paradise'])->update(['asie' => true]);
        Travel::where('slug', 'morocco-imperial-cities')->update(['afrique_nord' => true, 'tranquille' => true]);
        Travel::where('slug', 'kuala-lumpur-bali-eco')->update(['jeune' => true]);
        Travel::where('slug', 'bangkok-chiang-mai')->update(['jeune' => true]);
        Travel::where('slug', 'omra-2026-per-person')->update(['tranquille' => true]);
    }

    // ─── Helpers ───────────────────────────────────────────────────────

    private function assignCategory(string $entityType, int $entityId, ?string $categoryKey, string $categoryTypeKey = 'pricing_type'): void
    {
        if (! $categoryKey) {
            return;
        }

        $type = CategoryType::where('entity_type', $entityType)->where('key', $categoryTypeKey)->first();
        if (! $type) {
            return;
        }

        $value = $type->values()->where('key', $categoryKey)->first();
        if (! $value) {
            return;
        }

        EntityCategoryAssignment::updateOrCreate(
            ['entity_type' => $entityType, 'entity_id' => $entityId, 'category_type_id' => $type->id],
            ['category_value_id' => $value->id]
        );
    }

    private function clearCaches(): void
    {
        $keys = [
            'hotels.index', 'tours.index', 'travels.index', 'destinations.index',
            'cars.index', 'flights.index', 'events.index', 'deals.index',
            'blog.index', 'promos.index', 'visas.index',
            'site-settings:en', 'site-settings:fr', 'site-settings:ar',
            'site_settings_nav',
        ];

        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }
}
