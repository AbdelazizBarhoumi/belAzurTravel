<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;
use App\Models\Hotel;
use App\Models\HotelRoom;
use App\Models\HotelRoomFeature;
use App\Models\HotelRoomImage;
use App\Models\SiteSetting;
use App\Models\Tour;
use Illuminate\Support\Facades\Cache;

class SeedJsDataSeeder extends Seeder
{
    private function loc(string $en, ?string $fr = null, ?string $ar = null): array
    {
        return [
            'en' => $en,
            'fr' => $fr ?? $en,
            'ar' => $ar ?? $en,
        ];
    }

    private function syncAmenities(Hotel $hotel, array $amenities): void
    {
        $amenityIds = [];

        foreach ($amenities as $amenityName) {
            $amenityIcon = null;

            if (is_array($amenityName)) {
                $amenityIcon = $amenityName['icon'] ?? null;
                $amenityName = $amenityName['name'] ?? null;
            }

            if (is_string($amenityName)) {
                $amenityName = $this->loc($amenityName);
            }

            if (! is_array($amenityName)) {
                continue;
            }

            $amenity = Amenity::query()->updateOrCreate([
                'name' => $amenityName,
            ], [
                'icon' => $amenityIcon,
            ]);

            $amenityIds[] = $amenity->id;
        }

        $hotel->amenities()->sync($amenityIds);
    }

    private function syncRoomMedia(HotelRoom $room, array $features = [], array $images = []): void
    {
        $room->featureItems()->delete();
        $room->imageItems()->delete();

        foreach (array_values($features) as $index => $feature) {
            $room->featureItems()->create([
                'label' => $feature,
                'sort_order' => $index,
            ]);
        }

        foreach (array_values($images) as $index => $image) {
            $room->imageItems()->create([
                'path' => $image,
                'sort_order' => $index,
            ]);
        }
    }

    private function seedSiteSettings(): void
    {
        $siteSettings = [
            'company_name' => 'Bel Azur Travel',
            'email' => 'belazurtravel@gmail.com',
            'phone' => '+216 23 777 771',
            'whatsapp' => '21623777771',
            'address' => '3e étage, imm. Ghannouchi, Trocadero, Senghor, Sousse',
            'plus_code' => null,
            'year' => 2026,
            'social_links' => [
                ['label' => 'Facebook', 'href' => 'https://www.facebook.com/people/BEL-AZUR-Travel/61584269153378/#'],
                ['label' => 'Instagram', 'href' => 'https://www.instagram.com/bel.azur_travel/'],
                ['label' => 'YouTube', 'href' => 'https://www.youtube.com/@BELAZURTRAVEL-TN'],
                ['label' => 'TikTok', 'href' => 'https://www.tiktok.com/@bel.azur.travel'],
            ],
            'legal_sections' => [],
            'footer_links' => [
                ['labelKey' => 'nav.hotels', 'href' => '/hotels', 'group' => 'quick'],
                ['labelKey' => 'nav.tours', 'href' => '/tours', 'group' => 'quick'],
                ['labelKey' => 'nav.destinations', 'href' => '/destinations', 'group' => 'quick'],
                ['labelKey' => 'nav.cars', 'href' => '/cars', 'group' => 'quick'],
                ['labelKey' => 'nav.contact', 'href' => '/contact', 'group' => 'support'],
                ['labelKey' => 'nav.legal', 'href' => '/legal', 'group' => 'support'],
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
            'content' => [
                'footer' => [
                    'tagline' => [
                        'en' => 'Your trusted travel agency in Tunisia. Unforgettable experiences at the best price.',
                        'fr' => 'Votre agence de voyage de confiance en Tunisie. Des expériences inoubliables au meilleur prix.',
                        'ar' => 'وكالة السفر الموثوقة في تونس. تجارب لا تُنسى بأفضل الأسعار.',
                    ],
                ],
                'contact' => [
                    'kicker' => [
                        'en' => 'Contact us',
                        'fr' => 'Contactez-nous',
                        'ar' => 'اتصل بنا',
                    ],
                    'title' => [
                        'en' => 'Plan your next trip with Bel Azur Travel',
                        'fr' => 'Planifiez votre prochain voyage avec Bel Azur Travel',
                        'ar' => 'خطط لرحلتك القادمة مع بيل أزور ترافل',
                    ],
                    'description' => [
                        'en' => 'Reach our team by phone, email, WhatsApp or by visiting our office in Sousse.',
                        'fr' => 'Contactez notre équipe par téléphone, e-mail, WhatsApp ou en visitant notre bureau à Sousse.',
                        'ar' => 'تواصل مع فريقنا عبر الهاتف أو البريد الإلكتروني أو واتساب أو بزيارة مكتبنا في سوسة.',
                    ],
                    'locationTitle' => [
                        'en' => 'Our office',
                        'fr' => 'Notre agence',
                        'ar' => 'مكتبنا',
                    ],
                    'locationSubtitle' => [
                        'en' => 'Find us on the map and send us a message anytime.',
                        'fr' => 'Retrouvez-nous sur la carte et envoyez-nous un message à tout moment.',
                        'ar' => 'اعثر علينا على الخريطة وأرسل لنا رسالة في أي وقت.',
                    ],
                    'socialTitle' => [
                        'en' => 'Follow us',
                        'fr' => 'Suivez-nous',
                        'ar' => 'تابعنا',
                    ],
                    'socialDescription' => [
                        'en' => 'Stay updated with our latest offers and travel inspiration.',
                        'fr' => 'Restez informé de nos meilleures offres et inspirations voyage.',
                        'ar' => 'ابقَ على اطلاع بآخر العروض وإلهام السفر.',
                    ],
                    'ctaTitle' => [
                        'en' => 'Need a custom trip or a quick quote?',
                        'fr' => 'Besoin d’un voyage sur mesure ou d’un devis rapide ?',
                        'ar' => 'هل تحتاج إلى رحلة مخصصة أو عرض سريع؟',
                    ],
                    'ctaDescription' => [
                        'en' => 'Send us a message and we will help you plan it.',
                        'fr' => 'Envoyez-nous un message et nous vous aiderons à le planifier.',
                        'ar' => 'أرسل لنا رسالة وسنساعدك في التخطيط لها.',
                    ],
                ],
            ],
        ];

        SiteSetting::query()->updateOrCreate(['id' => 1], $siteSettings);
    }

    public function run(): void
    {
        $hotelImageBasePath = '/storage/uploads/hotels';

        // La Badira
        $badiraDescFr = "Situé dans un quartier calme de Hammamet, La Badira est un établissement Adult Only 5 étoiles de luxe bénéficiant d'un emplacement stratégique : à 3,4 km de la médina, à 10,6 km de Yasmine Hammamet et à 73 km de l'aéroport de Tunis-Carthage.\n\nL'hôtel propose 120 chambres open-space avec vue sur la mer et 10 suites dont 6 avec piscine privée. Toutes équipées de douche italienne, literie brodée et oreillers de haute qualité.\n\nGastronomie sous la direction du chef exécutif Slim Bettaieb : restaurant de gastronomie tunisienne, restaurant de cuisine internationale, restaurant-grill en bord de plage et salon pour le petit-déjeuner. Deux cafés et deux bars complètent l'offre.\n\nBien-être : piscine intérieure chauffée, spa avec hammams et salle de yoga, salon de coiffure et nail bar, salle de fitness, centre équestre, club de plongée PADI, 3 parcours de golf 18 trous à proximité.";
        $badiraDescEn = "Located in a quiet area of Hammamet, La Badira is an adult-only 5-star luxury hotel, 3.4 km from the medina, 10.6 km from Yasmine Hammamet and 73 km from Tunis-Carthage Airport. It offers 120 open-space rooms with sea views and 10 suites, 6 of them with private pools. The property includes an indoor heated pool, spa with hammams, yoga room, fitness room, equestrian center, PADI dive club and nearby golf courses.";
        $badiraDescAr = "يقع لا باديرا في منطقة هادئة بهامامات، وهو فندق فاخر من فئة 5 نجوم ومخصص للبالغين فقط، على بعد 3.4 كم من المدينة العتيقة، و10.6 كم من ياسمين الحمامات، و73 كم من مطار تونس قرطاج. يضم 120 غرفة مفتوحة على البحر و10 أجنحة، منها 6 بأحواض سباحة خاصة، إضافة إلى مسبح داخلي مدفأ، وسبا مع حمامات تقليدية، وغرفة يوغا، وقاعة لياقة بدنية، ومركز للفروسية، ونادٍ للغوص، وحقول غولف قريبة.";

        $badira = Hotel::updateOrCreate(['slug' => 'hotel-badira'], [
            'code' => 'hotel-badira-001',
            'destination_slug' => 'hammamet',
            'name' => $this->loc('La Badira Adult Only', 'La Badira Adult Only', 'لا باديرا للبالغين فقط'),
            'location' => $this->loc('Route de Nabeul, Hammamet Nord', 'Route de Nabeul, Hammamet Nord', 'طريق نابل، الحمامات الشمالية'),
            'category_key' => 'luxury',
            'category' => $this->loc('Luxury', 'Luxe', 'فاخر'),
            'price' => 280,
            'rating' => 5,
            'stars' => 5,
            'reviews' => 286,
            'image' => $hotelImageBasePath.'/badira1.webp',
            'tags' => ['luxury', 'spa', 'beach'],
            'details' => [
                'gallery' => [
                    $hotelImageBasePath.'/badira1.webp',
                    $hotelImageBasePath.'/badira2.webp',
                    $hotelImageBasePath.'/badira3.webp',
                    $hotelImageBasePath.'/badira5.webp',
                ],
                'city' => $this->loc('Hammamet', 'Hammamet', 'الحمامات'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc($badiraDescEn, $badiraDescFr, $badiraDescAr),
            ],
        ]);

        $this->syncAmenities($badira, [
            ['name' => $this->loc('Indoor heated pool', 'Piscine intérieure chauffée', 'مسبح داخلي مدفأ'), 'icon' => 'pool'],
            ['name' => $this->loc('Spa', 'Spa', 'سبا'), 'icon' => 'pool'],
            ['name' => $this->loc('Yoga room', 'Salle de yoga', 'غرفة يوغا'), 'icon' => 'gym'],
            ['name' => $this->loc('Fitness room', 'Salle de fitness', 'قاعة لياقة بدنية'), 'icon' => 'gym'],
            ['name' => $this->loc('Equestrian center', 'Centre équestre', 'مركز للفروسية'), 'icon' => 'gym'],
            ['name' => $this->loc('PADI dive club', 'Club de plongée PADI', 'نادي الغوص PADI'), 'icon' => 'pool'],
            ['name' => $this->loc('Golf nearby', 'Golf à proximité', 'حقول غولف قريبة'), 'icon' => 'gym'],
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $badira->id,
            'name_en' => 'Chambre Supérieure Vue Mer',
        ], [
            'name_fr' => 'Chambre Supérieure Vue Mer',
            'name_ar' => 'غرفة سوبيريور بإطلالة على البحر',
            'description_en' => 'Open-space room with panoramic sea view, Italian shower, and premium bedding.',
            'description_fr' => 'Chambre open-space avec vue panoramique sur la mer, douche italienne, literie haut de gamme.',
            'description_ar' => 'غرفة مفتوحة المساحة مع إطلالة بانورامية على البحر، ودش إيطالي، ومفروشات فاخرة.',
            'price_per_night' => 280,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($badira->rooms()->where('name_en', 'Chambre Supérieure Vue Mer')->firstOrFail(), [
            'Panoramic sea view',
            'Italian shower',
            'Premium bedding',
        ], [
            $hotelImageBasePath.'/badira2.webp',
            $hotelImageBasePath.'/badira3.webp',
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $badira->id,
            'name_en' => 'Suite avec Piscine Privée',
        ], [
            'name_fr' => 'Suite avec Piscine Privée',
            'name_ar' => 'جناح مع مسبح خاص',
            'description_en' => 'Exclusive suite with private pool, terrace, luxury bathroom and personalised service.',
            'description_fr' => 'Suite exclusive avec piscine privée, terrasse, salle de bain luxueuse et service personnalisé.',
            'description_ar' => 'جناح حصري مع مسبح خاص وتراس وحمام فاخر وخدمة مخصصة.',
            'price_per_night' => 650,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($badira->rooms()->where('name_en', 'Suite avec Piscine Privée')->firstOrFail(), [
            'Private pool',
            'Terrace',
            'Luxury bathroom',
            'Personalised service',
        ], [
            $hotelImageBasePath.'/badira3.webp',
            $hotelImageBasePath.'/badira5.webp',
        ]);

        // Iberostar
        $iberostarDescFr = "Situé à Yasmine Hammamet, à proximité de la Médina et de Carthage Land, l'Iberostar Waves Averroes dispose de 256 chambres (suites, simples et doubles) avec décor élégant et vues sur jardin ou mer.\n\nÉquipements en chambre : climatisation individuelle, salle de bain avec baignoire et bidet, TV satellite, téléphone, sèche-cheveux. Service en chambre 24h/24.\n\nRestauration : Le Laurier (cuisine internationale), L'Olivier Italian Restaurant, snack-bar et épicerie fine.\n\nLoisirs : 2 grandes piscines dont une couverte et une enfants, espace spa avec sauna, hammam et cabines de massage, salle de fitness, terrain de volley, sports nautiques (ski nautique, planche à voile). À proximité : Yasmine Golf et Yasmine Marina. Wi-Fi et parking gratuits.";
        $iberostarDescEn = "Located in Yasmine Hammamet, near the medina and Carthage Land, Iberostar Waves Averroes has 256 rooms, suites, singles and doubles with elegant décor and garden or sea views. Rooms include individual air conditioning, a bathroom with bathtub and bidet, satellite TV, telephone and hairdryer, with 24-hour room service. Dining includes Le Laurier, L'Olivier Italian Restaurant, a snack bar and fine grocery shop. Leisure facilities include two large pools, a spa with sauna, hammam and massage cabins, fitness room, volleyball court and water sports.";
        $iberostarDescAr = "يقع فندق إيبيروستار ويڤز أفيروز في ياسمين الحمامات، بالقرب من المدينة العتيقة وكارطاج لاند. يضم 256 غرفة وجناحًا وغرفًا فردية ومزدوجة بديكور أنيق وإطلالات على الحديقة أو البحر. تشمل المرافق تكييفًا فرديًا وحمامًا مع حوض استحمام وبيديه وتلفازًا فضائيًا وهاتفًا ومجفف شعر، مع خدمة الغرف على مدار الساعة. وتضم المطاعم لو لوريي، ولوفيلييه الإيطالي، وبارًا خفيفًا ومتجرًا فاخرًا. كما تتوفر مسابح ومنتجع صحي وساونا وحمام تقليدي وغرف مساج وقاعة لياقة رياضية ورياضات مائية.";

        $iberostar = Hotel::updateOrCreate(['slug' => 'hotel-iberostar'], [
            'code' => 'hotel-iberostar-001',
            'destination_slug' => 'yasmine-hammamet',
            'name' => $this->loc('Iberostar Waves Averroes', 'Iberostar Waves Averroes', 'إيبيروستار ويڤز أفيروز'),
            'location' => $this->loc('Zone Touristique Yasmine Hammamet', 'Zone Touristique Yasmine Hammamet', 'المنطقة السياحية ياسمين الحمامات'),
            'category_key' => 'resort',
            'category' => $this->loc('Resort', 'Resort', 'منتجع'),
            'price' => 195,
            'rating' => 5,
            'stars' => 5,
            'reviews' => 412,
            'image' => $hotelImageBasePath.'/iberostar1.webp',
            'tags' => ['family', 'spa', 'all-inclusive'],
            'details' => [
                'gallery' => [
                    $hotelImageBasePath.'/iberostar1.webp',
                    $hotelImageBasePath.'/iberostar2.webp',
                    $hotelImageBasePath.'/iberostar3.webp',
                ],
                'city' => $this->loc('Yasmine Hammamet', 'Yasmine Hammamet', 'ياسمين الحمامات'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc($iberostarDescEn, $iberostarDescFr, $iberostarDescAr),
            ],
        ]);

        $this->syncAmenities($iberostar, [
            ['name' => $this->loc('Two large pools', 'Deux grandes piscines', 'مسابح كبيرة'), 'icon' => 'pool'],
            ['name' => $this->loc('Spa', 'Spa', 'سبا'), 'icon' => 'pool'],
            ['name' => $this->loc('Sauna', 'Sauna', 'ساونا'), 'icon' => 'gym'],
            ['name' => $this->loc('Hammam', 'Hammam', 'حمام تقليدي'), 'icon' => 'pool'],
            ['name' => $this->loc('Massage cabins', 'Cabines de massage', 'غرف مساج'), 'icon' => 'gym'],
            ['name' => $this->loc('Fitness room', 'Salle de fitness', 'قاعة لياقة بدنية'), 'icon' => 'gym'],
            ['name' => $this->loc('Water sports', 'Sports nautiques', 'رياضات مائية'), 'icon' => 'pool'],
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $iberostar->id,
            'name_en' => 'Chambre Double Vue Jardin',
        ], [
            'name_fr' => 'Chambre Double Vue Jardin',
            'name_ar' => 'غرفة مزدوجة بإطلالة على الحديقة',
            'description_en' => 'Double room with garden view, air conditioning, satellite TV and 24-hour service.',
            'description_fr' => 'Chambre double avec vue jardin, climatisation, TV satellite, service 24h/24.',
            'description_ar' => 'غرفة مزدوجة مع إطلالة على الحديقة وتكييف وتلفاز فضائي وخدمة على مدار الساعة.',
            'price_per_night' => 195,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($iberostar->rooms()->where('name_en', 'Chambre Double Vue Jardin')->firstOrFail(), [
            'Garden view',
            'Air conditioning',
            'Satellite TV',
            '24-hour room service',
        ], [
            $hotelImageBasePath.'/iberostar2.webp',
            $hotelImageBasePath.'/iberostar3.webp',
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $iberostar->id,
            'name_en' => 'Suite Vue Mer',
        ], [
            'name_fr' => 'Suite Vue Mer',
            'name_ar' => 'جناح مطل على البحر',
            'description_en' => 'Spacious suite with sea view, separate lounge and hydromassage bathtub.',
            'description_fr' => 'Suite spacieuse avec vue sur la mer, salon séparé, baignoire hydromassante.',
            'description_ar' => 'جناح واسع بإطلالة على البحر وصالة منفصلة وحوض استحمام دوّامي.',
            'price_per_night' => 390,
            'capacity' => 3,
        ]);

        $this->syncRoomMedia($iberostar->rooms()->where('name_en', 'Suite Vue Mer')->firstOrFail(), [
            'Sea view',
            'Separate lounge',
            'Hydromassage bathtub',
        ], [
            $hotelImageBasePath.'/iberostar1.webp',
            $hotelImageBasePath.'/iberostar3.webp',
        ]);

        // Concorde
        $concordeDescFr = "Le Barcelo Concorde Green Park Palace est idéalement situé à 5 minutes à pied du Port El Kantaoui et à 10 minutes en voiture de la Médina de Sousse. L'aéroport de Monastir se trouve à 20 km.\n\n452 chambres luxueuses avec balcon ou terrasse (vue mer ou montagne), salle de bain privée avec baignoire/douche, TV écran plat, réfrigérateur, coffre-fort. Suites prestiges avec baignoire hydromassage.\n\n5 restaurants : buffet principal, La Torreta (italien), restaurant piscine, El Jem (arabo-oriental), Le Pêcheur (méditerranéen). Bars avec cocktails locaux et internationaux.\n\nLoisirs : grande piscine extérieure, piscine enfants, piscine couverte chauffée, court de tennis, terrain polyvalent, centre de fitness, mini-club enfants. Wi-Fi et parking gratuits.";
        $concordeDescEn = "Barcelo Concorde Green Park Palace is ideally located 5 minutes on foot from Port El Kantaoui and 10 minutes by car from the Medina of Sousse, with Monastir Airport 20 km away. It offers 452 luxurious rooms with balcony or terrace, sea or mountain views, private bathrooms, flat-screen TVs, refrigerators and safes. There are five restaurants, several bars, outdoor and indoor pools, tennis courts, a fitness center and a kids' club.";
        $concordeDescAr = "يقع بارسيلو كونكورد غرين بارك بالاس في موقع مثالي على بعد 5 دقائق سيرًا من ميناء القنطاوي و10 دقائق بالسيارة من مدينة سوسة العتيقة، بينما يبعد مطار المنستير 20 كم. يضم 452 غرفة فاخرة بشرفات أو تراسات وإطلالات على البحر أو الجبل، وحمامات خاصة وتلفازًا مسطحًا وثلاجة وخزنة. كما يحتوي على خمسة مطاعم وعدة بارات ومسابح داخلية وخارجية وملاعب تنس ومركز لياقة ونادٍ للأطفال.";

        $concorde = Hotel::updateOrCreate(['slug' => 'hotel-concorde'], [
            'code' => 'hotel-concorde-001',
            'destination_slug' => 'sousse',
            'name' => $this->loc('Barcelo Concorde Green Park Palace', 'Barcelo Concorde Green Park Palace', 'بارسيلو كونكورد غرين بارك بالاس'),
            'location' => $this->loc('Port El Kantaoui', 'Port El Kantaoui', 'ميناء القنطاوي'),
            'category_key' => 'beach',
            'category' => $this->loc('Beach Resort', 'Hôtel de plage', 'منتجع شاطئي'),
            'price' => 220,
            'rating' => 5,
            'stars' => 5,
            'reviews' => 351,
            'image' => $hotelImageBasePath.'/concorde1.webp',
            'tags' => ['beach', 'family', 'pool'],
            'details' => [
                'gallery' => [
                    $hotelImageBasePath.'/concorde1.webp',
                    $hotelImageBasePath.'/concorde2.webp',
                    $hotelImageBasePath.'/concorde3.webp',
                ],
                'city' => $this->loc('Sousse', 'Sousse', 'سوسة'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc($concordeDescEn, $concordeDescFr, $concordeDescAr),
            ],
        ]);

        $this->syncAmenities($concorde, [
            ['name' => $this->loc('Outdoor pool', 'Piscine extérieure', 'مسبح خارجي'), 'icon' => 'pool'],
            ['name' => $this->loc('Indoor heated pool', 'Piscine intérieure chauffée', 'مسبح داخلي مدفأ'), 'icon' => 'pool'],
            ['name' => $this->loc('Tennis court', 'Court de tennis', 'ملعب تنس'), 'icon' => 'gym'],
            ['name' => $this->loc('Fitness center', 'Centre de fitness', 'مركز لياقة بدنية'), 'icon' => 'gym'],
            ['name' => $this->loc('Kids club', 'Club enfants', 'نادي للأطفال'), 'icon' => 'group'],
            ['name' => $this->loc('Restaurants and bars', 'Restaurants et bars', 'مطاعم وبارات'), 'icon' => 'restaurant'],
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $concorde->id,
            'name_en' => 'Chambre Standard Vue Mer',
        ], [
            'name_fr' => 'Chambre Standard Vue Mer',
            'name_ar' => 'غرفة قياسية بإطلالة على البحر',
            'description_en' => 'Luxury room with sea-view balcony, flat-screen TV, refrigerator and safe.',
            'description_fr' => 'Chambre luxueuse avec balcon vue mer, TV écran plat, réfrigérateur, coffre-fort.',
            'description_ar' => 'غرفة فاخرة مع شرفة مطلة على البحر وتلفاز مسطح وثلاجة وخزنة.',
            'price_per_night' => 220,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($concorde->rooms()->where('name_en', 'Chambre Standard Vue Mer')->firstOrFail(), [
            'Sea-view balcony',
            'Flat-screen TV',
            'Refrigerator',
            'Safe',
        ], [
            $hotelImageBasePath.'/concorde2.webp',
            $hotelImageBasePath.'/concorde3.webp',
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $concorde->id,
            'name_en' => 'Suite Familiale',
        ], [
            'name_fr' => 'Suite Familiale',
            'name_ar' => 'جناح عائلي',
            'description_en' => 'Family suite with a seating area, sofa bed, dressing room and hydromassage bathtub.',
            'description_fr' => 'Suite familiale avec coin salon canapé-lit, dressing room et baignoire hydromassage.',
            'description_ar' => 'جناح عائلي مع ركن جلوس وأريكة قابلة للتحويل وغرفة ملابس وحوض استحمام دوّامي.',
            'price_per_night' => 420,
            'capacity' => 4,
        ]);

        $this->syncRoomMedia($concorde->rooms()->where('name_en', 'Suite Familiale')->firstOrFail(), [
            'Seating area',
            'Sofa bed',
            'Dressing room',
            'Hydromassage bathtub',
        ], [
            $hotelImageBasePath.'/concorde1.webp',
            $hotelImageBasePath.'/concorde3.webp',
        ]);

        // Occidental
        $occDescFr = "L'Occidental Sousse Marhaba est idéalement situé au cœur de la zone touristique de Sousse, à 20 km de l'aéroport de Monastir et à 40 km de l'aéroport d'Enfidha.\n\n240 chambres spacieuses rénovées en 2018, réparties autour de magnifiques jardins tropicaux, alliant luxe et confort.\n\nRestauration : restaurant buffet cuisine internationale, barbecue au bord de l'eau, bar animé piscine et club de plage.\n\nLoisirs : 2 piscines extérieures (dont une avec toboggans), piscine intérieure, centre de bien-être 300 m² avec sauna et massage, tennis, discothèque, club enfants. Navettes aéroport gratuites, Wi-Fi, accessible en fauteuil roulant.";
        $occDescEn = "Occidental Sousse Marhaba is ideally located in the heart of Sousse's tourist area, 20 km from Monastir Airport and 40 km from Enfidha Airport. It offers 240 spacious rooms renovated in 2018, surrounded by tropical gardens. Dining includes an international buffet, water-side barbecue, pool bar and beach club. Leisure facilities include two outdoor pools, an indoor pool, a wellness center, tennis, a disco and a kids' club.";
        $occDescAr = "يقع أوكسيدنتال سوسة مرحبا في قلب المنطقة السياحية بسوسة، على بعد 20 كم من مطار المنستير و40 كم من مطار النفيضة. يضم 240 غرفة فسيحة تم تجديدها سنة 2018، وتحيط بها حدائق استوائية جميلة. تتوفر مطاعم بنظام البوفيه ومطعم شواء على الماء وبار مسبح ونادٍ شاطئي، إضافة إلى مسابح خارجية وداخلية ومركز عافية ونادٍ للأطفال وخدمة نقل مجانية من وإلى المطار.";

        $occ = Hotel::updateOrCreate(['slug' => 'hotel-occidental'], [
            'code' => 'hotel-occidental-001',
            'destination_slug' => 'sousse',
            'name' => $this->loc('Occidental Sousse Marhaba', 'Occidental Sousse Marhaba', 'أوكسيدنتال سوسة مرحبا'),
            'location' => $this->loc('Zone Touristique, Sousse', 'Zone Touristique, Sousse', 'المنطقة السياحية، سوسة'),
            'category_key' => 'family',
            'category' => $this->loc('Family Resort', 'Hôtel familial', 'منتجع عائلي'),
            'price' => 140,
            'rating' => 4,
            'stars' => 4,
            'reviews' => 248,
            'image' => $hotelImageBasePath.'/occidental1.webp',
            'tags' => ['family', 'wellness', 'waterpark'],
            'details' => [
                'gallery' => [
                    $hotelImageBasePath.'/occidental1.webp',
                    $hotelImageBasePath.'/occidental2.webp',
                    $hotelImageBasePath.'/occidental3.webp',
                    $hotelImageBasePath.'/occidental4.webp',
                ],
                'city' => $this->loc('Sousse', 'Sousse', 'سوسة'),
                'country' => $this->loc('Tunisia', 'Tunisie', 'تونس'),
                'description' => $this->loc($occDescEn, $occDescFr, $occDescAr),
            ],
        ]);

        $this->syncAmenities($occ, [
            ['name' => $this->loc('Outdoor pools', 'Piscines extérieures', 'مسابح خارجية'), 'icon' => 'pool'],
            ['name' => $this->loc('Indoor pool', 'Piscine intérieure', 'مسبح داخلي'), 'icon' => 'pool'],
            ['name' => $this->loc('Wellness center', 'Centre de bien-être', 'مركز عافية'), 'icon' => 'gym'],
            ['name' => $this->loc('Sauna', 'Sauna', 'ساونا'), 'icon' => 'gym'],
            ['name' => $this->loc('Massage', 'Massage', 'مساج'), 'icon' => 'gym'],
            ['name' => $this->loc('Kids club', 'Club enfants', 'نادي للأطفال'), 'icon' => 'group'],
            ['name' => $this->loc('Free airport shuttle', 'Navette aéroport gratuite', 'خدمة نقل مجانية من وإلى المطار'), 'icon' => 'car'],
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $occ->id,
            'name_en' => 'Chambre Standard',
        ], [
            'name_fr' => 'Chambre Standard',
            'name_ar' => 'غرفة قياسية',
            'description_en' => 'Spacious room renovated in 2018, tropical garden, fully modern equipment.',
            'description_fr' => 'Chambre spacieuse rénovée 2018, jardin tropical, tout équipement moderne.',
            'description_ar' => 'غرفة فسيحة تم تجديدها سنة 2018، مطلة على حديقة استوائية ومجهزة بكل المرافق الحديثة.',
            'price_per_night' => 140,
            'capacity' => 2,
        ]);

        $this->syncRoomMedia($occ->rooms()->where('name_en', 'Chambre Standard')->firstOrFail(), [
            'Renovated in 2018',
            'Tropical garden',
            'Modern equipment',
        ], [
            $hotelImageBasePath.'/occidental2.webp',
            $hotelImageBasePath.'/occidental3.webp',
        ]);

        HotelRoom::updateOrCreate([
            'hotel_id' => $occ->id,
            'name_en' => 'Chambre Familiale',
        ], [
            'name_fr' => 'Chambre Familiale',
            'name_ar' => 'غرفة عائلية',
            'description_en' => 'Large family room with extra beds and easy pool access.',
            'description_fr' => 'Grande chambre pour familles avec lits supplémentaires et accès piscine facilité.',
            'description_ar' => 'غرفة عائلية واسعة مع أسرّة إضافية وسهولة الوصول إلى المسبح.',
            'price_per_night' => 210,
            'capacity' => 4,
        ]);

        $this->syncRoomMedia($occ->rooms()->where('name_en', 'Chambre Familiale')->firstOrFail(), [
            'Extra beds',
            'Pool access',
        ], [
            $hotelImageBasePath.'/occidental3.webp',
            $hotelImageBasePath.'/occidental4.webp',
        ]);

        // Tours
        $omraIncludes = [
            'Visa Omra',
            'Billet d\'avion aller-retour',
            'Hébergement La Mecque (proche Haram)',
            'Hébergement Médine (proche Mosquée du Prophète)',
            'Transports bus climatisés',
            'Visites des sites de Médine',
            'Cours religieux quotidiens',
            'Accompagnateurs professionnels',
        ];

        Tour::updateOrCreate(['slug' => 'tour-omra-2026'], [
            'name' => $this->loc('Omra Shawwal 2026', 'Omra Shawwal 2026', 'عمرة شوال 2026'),
            'description' => $this->loc('Special Omra Shawwal 2026 offer — starting from 4,150 TND per person.', 'Offre spéciale Omra Shawwal 2026 – à partir de 4 150 DT par personne.', 'عرض خاص لعمرة شوال 2026 ابتداءً من 4150 دينارًا للشخص الواحد.'),
            'location' => $this->loc('La Mecque & Médine, Saudi Arabia', 'La Mecque & Médine, Arabie Saoudite', 'مكة المكرمة والمدينة المنورة، المملكة العربية السعودية'),
            'category_key' => 'religious',
            'category' => $this->loc('Religious Tour', 'Voyage religieux', 'رحلة دينية'),
            'duration' => $this->loc('15 days / 14 nights', '15 jours / 14 nuits', '15 يوم / 14 ليلة'),
            'duration_days' => 15,
            'duration_nights' => 14,
            'max_group' => 45,
            'price' => 4150,
            'rating' => 4.9,
            'image' => 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80',
            'includes' => $omraIncludes,
            'images' => ['https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80'],
            'details' => [
                'tags' => ['departure-2026-03-29', 'return-2026-04-12', 'limited-seats'],
            ],
        ]);

        Tour::updateOrCreate(['slug' => 'tour-sud-tunisie'], [
            'name' => $this->loc('Southern Circuit — Douz & Tozeur', 'Circuit Sud — Douz & Tozeur', 'جولة الجنوب — دوز وتوزر'),
            'description' => $this->loc('A magical journey into the Tunisian desert: Douz dunes, Tozeur oasis, Chott el-Jérid and Berber villages.', 'Découverte magique du désert tunisien : dunes de Douz, oasis de Tozeur, Chott el-Jérid et villages berbères.', 'رحلة ساحرة إلى الصحراء التونسية: كثبان دوز، واحة توزر، شط الجريد، والقرى الأمازيغية.'),
            'location' => $this->loc('Douz, Tozeur, Sahara – Tunisia', 'Douz, Tozeur, Sahara – Tunisie', 'دوز، توزر، الصحراء – تونس'),
            'category_key' => 'adventure',
            'category' => $this->loc('Adventure Tour', 'Circuit aventure', 'رحلة مغامرة'),
            'duration' => $this->loc('4 days / 3 nights', '4 jours / 3 nuits', '4 أيام / 3 ليالٍ'),
            'duration_days' => 4,
            'duration_nights' => 3,
            'max_group' => 30,
            'price' => 589,
            'rating' => 4.7,
            'image' => 'https://images.unsplash.com/photo-1509600110300-21b9d5fedeb7?w=800&q=80',
            'includes' => ['Transport aller-retour depuis Sousse', 'Hébergement 3 nuits en hôtel', 'Petits-déjeuners et dîners', 'Guide professionnel', 'Balade à dos de chameau', 'Entrées sites touristiques'],
            'images' => ['https://images.unsplash.com/photo-1509600110300-21b9d5fedeb7?w=800&q=80'],
            'details' => [
                'tags' => ['douz', 'tozeur', 'chott-el-jérid'],
            ],
        ]);

        Tour::updateOrCreate(['slug' => 'tour-istanbul-2026'], [
            'name' => $this->loc('Istanbul 2026', 'Istanbul 2026', 'إسطنبول 2026'),
            'description' => $this->loc('Discover Istanbul, the city across two continents: Hagia Sophia, the Blue Mosque, the Grand Bazaar, the Golden Horn and the Bosphorus.', 'Découvrez Istanbul, ville aux deux continents : Sainte-Sophie, la Mosquée Bleue, le Grand Bazar, la Corne d\'Or et le Bosphore.', 'اكتشف إسطنبول، مدينة القارتين: آيا صوفيا، الجامع الأزرق، البازار الكبير، القرن الذهبي، ومضيق البوسفور.'),
            'location' => $this->loc('Istanbul, Turkey', 'Istanbul, Turquie', 'إسطنبول، تركيا'),
            'category_key' => 'city',
            'category' => $this->loc('City Tour', 'Voyage urbain', 'جولة مدينة'),
            'duration' => $this->loc('7 days / 6 nights', '7 jours / 6 nuits', '7 أيام / 6 ليالٍ'),
            'duration_days' => 7,
            'duration_nights' => 6,
            'max_group' => 25,
            'price' => 1690,
            'rating' => 4.8,
            'image' => 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
            'includes' => ['Billet d\'avion aller-retour', 'Hébergement 6 nuits en hôtel 4*', 'Petits-déjeuners inclus', 'Transferts aéroport', 'Visites guidées', 'Guide francophone'],
            'images' => ['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80'],
            'details' => [
                'tags' => ['hagia-sophia', 'blue-mosque', 'bosphorus', 'grand-bazaar'],
            ],
        ]);

        $this->seedSiteSettings();

        Cache::forget('hotels.index');
        Cache::forget('hotels.hotel-badira');
        Cache::forget('hotels.hotel-iberostar');
        Cache::forget('hotels.hotel-concorde');
        Cache::forget('hotels.hotel-occidental');
        Cache::forget('tours.index');
        Cache::forget('tours.tour-omra-2026');
        Cache::forget('tours.tour-sud-tunisie');
        Cache::forget('tours.tour-istanbul-2026');
        Cache::forget('site-settings:en');
        Cache::forget('site-settings:fr');
        Cache::forget('site-settings:ar');
        Cache::forget('site_settings_nav');
    }
}
