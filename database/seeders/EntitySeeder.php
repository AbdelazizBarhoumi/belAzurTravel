<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use App\Models\Car;
use App\Models\Deal;
use App\Models\Destination;
use App\Models\Event;
use App\Models\Flight;
use App\Models\GalleryImage;
use App\Models\Hotel;
use App\Models\Promo;
use App\Models\SiteSetting;
use App\Models\Tour;
use Illuminate\Database\Seeder;

class EntitySeeder extends Seeder
{
    public function run(): void
    {
        $t = fn (string $en, ?string $fr = null, ?string $ar = null): array => ['fr' => $fr ?? $en, 'ar' => $ar ?? $en, 'en' => $en];

        $siteSettings = [
            'company_name' => 'BelAzurTravel',
            'email' => 'hello@voyageur.com',
            'phone' => '+1 (555) 123-4567',
            'whatsapp' => '15551234567',
            'address' => '123 Travel St, NY 10001',
            'year' => 2026,
            'social_links' => [
                ['label' => 'Facebook', 'href' => 'https://facebook.com'],
                ['label' => 'Instagram', 'href' => 'https://instagram.com'],
                ['label' => 'Twitter', 'href' => 'https://x.com'],
                ['label' => 'LinkedIn', 'href' => 'https://linkedin.com'],
                ['label' => 'YouTube', 'href' => 'https://youtube.com'],
            ],
            'legal_sections' => [
                [
                    'title' => $t('Terms of Use', 'Conditions d’utilisation', 'شروط الاستخدام'),
                    'body' => $t('Standard terms of use for BelAzurTravel services. Accessing our site implies acceptance of these terms.', 'Conditions d’utilisation standard pour les services BelAzurTravel. L’accès à notre site implique l’acceptation de ces conditions.', 'شروط الاستخدام القياسية لخدمات BelAzurTravel. الوصول إلى موقعنا يعني قبول هذه الشروط.'),
                ],
                [
                    'title' => $t('Privacy Policy', 'Politique de confidentialité', 'سياسة الخصوصية'),
                    'body' => $t('We value your privacy. Your data is handled securely and in accordance with global regulations.', 'Nous accordons de l’importance à votre vie privée. Vos données sont traitées en toute sécurité et conformément aux réglementations mondiales.', 'نحن نقدر خصوصيتك. يتم التعامل مع بياناتك بشكل آمن ووفقًا للوائح العالمية.'),
                ],
            ],
            'footer_links' => [
                ['labelKey' => 'nav.destinations', 'href' => '/destinations', 'group' => 'quick'],
                ['labelKey' => 'nav.hotels', 'href' => '/hotels', 'group' => 'quick'],
                ['labelKey' => 'nav.tours', 'href' => '/tours', 'group' => 'quick'],
                ['labelKey' => 'nav.blog', 'href' => '/blog', 'group' => 'quick'],
                ['labelKey' => 'nav.contact', 'href' => '/contact', 'group' => 'quick'],
                ['labelKey' => 'nav.about', 'href' => '/team', 'group' => 'support'],
                ['labelKey' => 'nav.legal', 'href' => '/legal', 'group' => 'support'],
                ['labelKey' => 'nav.gallery', 'href' => '/gallery', 'group' => 'support'],
            ],
            'hours' => [
                ['dayKey' => 'footer.monfri', 'value' => '09:00 – 19:00'],
                ['dayKey' => 'footer.sat', 'value' => '10:00 – 17:00'],
                ['dayKey' => 'footer.sun', 'value' => 'footer.closed'],
            ],
            'content' => [
                'gallery' => [
                    'title' => $t('Photo Gallery', 'Galerie Photos', 'معرض الصور'),
                    'subtitle' => $t('Explore our visual journey around the world.', 'Explorez notre voyage visuel à travers le monde.', 'استكشف رحلتنا البصرية حول العالم.'),
                    'images' => [
                        '/build/assets/dest-santorini.jpg',
                        '/build/assets/dest-bali.jpg',
                        '/build/assets/dest-paris.jpg',
                        '/build/assets/dest-dubai.jpg',
                        '/images/destination-paris.jpg',
                        '/images/destination-dubai.jpg',
                        '/images/hero-travel.jpg',
                        '/images/destination-santorini.jpg',
                        '/images/destination-bali.jpg',
                    ],
                ],
                'contact' => [
                    'title' => $t('Contact Us', 'Contactez-nous', 'اتصل بنا'),
                    'description' => $t('We are here to help you plan your perfect trip.', 'Nous sommes là pour vous aider à planifier votre voyage parfait.', 'نحن هنا لمساعدتك في التخطيط لرحلتك المثالية.'),
                    'kicker' => $t('GET IN TOUCH', 'CONTACTEZ-NOUS', 'اتصل بنا'),
                    'socialTitle' => $t('Follow Us', 'Suivez-nous', 'تابعنا'),
                    'socialDescription' => $t('Stay updated with our latest offers and news.', 'Restez informé de nos dernières offres et nouvelles.', 'ابق على اطلاع بأحدث عروضنا وأخبارنا.'),
                    'locationTitle' => $t('Our Office', 'Notre Bureau', 'مكتبنا'),
                    'locationSubtitle' => $t('Visit us or find us on the map.', 'Visitez-nous ou trouvez-nous sur la carte.', 'زرنا أو ابحث عنا على الخريطة.'),
                    'ctaTitle' => $t('Ready to Travel?', 'Prêt à Voyager ?', 'جاهز للسفر؟'),
                    'ctaDescription' => $t('Contact us today for a free consultation.', 'Contactez-nous dès aujourd’hui pour une consultation gratuite.', 'اتصل بنا اليوم للحصول على استشارة مجانية.'),
                ],
                'legal' => [
                    'title' => $t('Legal Information', 'Informations Légales', 'معلومات قانونية'),
                    'subtitle' => $t('Please read our terms and policies carefully.', 'Veuillez lire attentivement nos conditions et politiques.', 'يرجى قراءة شروطنا وسياساتنا بعناية.'),
                ],
                'footer' => [
                    'tagline' => $t('Your premium travel partner for unforgettable experiences around the world.', 'Votre partenaire voyage premium pour des expériences inoubliables à travers le monde.', 'شريكك المتميز في السفر لتجارب لا تنسى حول العالم.'),
                ],
                'nav' => [
                    'simpleLinks' => [
                        [
                            'type' => 'simple',
                            'label' => $t('Home', 'Accueil', 'الصفحة الرئيسية'),
                            'href' => '/',
                        ],
                        [
                            'type' => 'dropdown',
                            'label' => $t('Explore', 'Explorer', 'استكشف'),
                            'items' => [
                                ['label' => $t('Destinations', 'Destinations', 'الوجهات'), 'href' => '/destinations'],
                                ['label' => $t('Hotels', 'Hôtels', 'الفنادق'), 'href' => '/hotels'],
                                ['label' => $t('Tours', 'Circuits', 'الجولات'), 'href' => '/tours'],
                            ],
                        ],
                        [
                            'type' => 'dropdown',
                            'label' => $t('More', 'Plus', 'المزيد'),
                            'href' => '#',
                            'items' => [
                                ['label' => $t('Blog', 'Blog', 'المدونة'), 'href' => '/blog'],
                                ['label' => $t('Gallery', 'Galerie', 'المعرض'), 'href' => '/gallery'],
                                ['label' => $t('About Us', 'À Propos', 'معلومات عنا'), 'href' => '/team'],
                            ],
                        ],
                        [
                            'type' => 'simple',
                            'label' => $t('Contact', 'Contact', 'اتصل'),
                            'href' => '/contact',
                        ],
                    ],
                    'settings' => [
                        'header' => [
                            ['pageKey' => 'destinations', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'top', 'items' => [
                                ['label' => $t('Beach'), 'mode' => 'filter', 'value' => 'Beach'],
                                ['label' => $t('City'), 'mode' => 'filter', 'value' => 'City'],
                                ['label' => $t('Nature'), 'mode' => 'filter', 'value' => 'Nature'],
                                ['label' => $t('Luxury'), 'mode' => 'filter', 'value' => 'Luxury'],
                            ]],
                            ['pageKey' => 'hotels', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'top', 'items' => [
                                ['label' => $t('Luxury'), 'mode' => 'filter', 'value' => 'Luxury'],
                                ['label' => $t('Boutique'), 'mode' => 'filter', 'value' => 'Boutique'],
                                ['label' => $t('Resorts'), 'mode' => 'filter', 'value' => 'Resorts'],
                            ]],
                            ['pageKey' => 'tours', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'top', 'items' => []],
                            ['pageKey' => 'deals', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'top', 'items' => []],
                            ['pageKey' => 'events', 'enabled' => false, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'top', 'items' => []],
                            ['pageKey' => 'cars', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
                            ['pageKey' => 'flights', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
                            ['pageKey' => 'promos', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
                            ['pageKey' => 'blog', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'top', 'items' => []],
                            ['pageKey' => 'gallery', 'enabled' => false, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'top', 'items' => []],
                            ['pageKey' => 'team', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
                            ['pageKey' => 'legal', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
                            ['pageKey' => 'design-trip', 'enabled' => false, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'top', 'items' => []],
                            ['pageKey' => 'favorites', 'enabled' => false, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'top', 'items' => []],
                        ],
                        'footer' => [
                            ['title' => $t('Quick Links'), 'pageKeys' => ['destinations', 'hotels', 'tours', 'deals']],
                            ['title' => $t('Discover'), 'pageKeys' => ['gallery', 'events', 'blog']],
                            ['title' => $t('Support'), 'pageKeys' => ['team', 'legal', 'promos']],
                        ],
                    ],
                ],
            ],
        ];
        $siteSetting = SiteSetting::query()->first();
        $siteSetting ? $siteSetting->update($siteSettings) : SiteSetting::query()->create($siteSettings);

        foreach ([
            ['/build/assets/dest-santorini.jpg', $t('Santorini Bliss')],
            ['/build/assets/dest-bali.jpg', $t('Bali Spirit')],
            ['/build/assets/dest-paris.jpg', $t('Parisian Nights')],
            ['/build/assets/dest-dubai.jpg', $t('Dubai Skyline')],
            ['/images/destination-paris.jpg', $t('Eiffel View')],
            ['/images/destination-dubai.jpg', $t('Burj Khalifa')],
        ] as $i => [$url, $caption]) {
            GalleryImage::query()->updateOrCreate(['url' => $url], [
                'caption' => $caption,
                'sort_order' => $i,
            ]);
        }

        foreach ([
            ['santorini', $t('Santorini', 'Santorin', 'سانتوريني'), $t('Greece', 'Grèce', 'اليونان'), 'beach', $t('Beach', 'Plage', 'شاطئ'), 1299, 4.9, '/build/assets/dest-santorini.jpg', $t('Iconic whitewashed buildings overlooking the Aegean Sea.'), $t('Santorini delivers postcard sunsets, cliffside villages, and a romantic atmosphere ideal for an unforgettable escape.'), $t('Spring and early summer'), $t('Greek'), $t('Euro'), $t('Mild and sunny climate')],
            ['bali', $t('Bali'), $t('Indonesia', 'Indonésie', 'إندونيسيا'), 'nature', $t('Nature'), 899, 4.8, '/build/assets/dest-bali.jpg', $t('Lush rice terraces, temples, and tropical paradise.'), $t('Bali blends wellness, adventure, and culture in a warm tropical setting that suits couples and families alike.'), $t('May to October'), $t('Indonesian'), $t('Indonesian rupiah'), $t('Warm and tropical')],
            ['paris', $t('Paris'), $t('France'), 'city', $t('City', 'Ville', 'مدينة'), 1499, 4.9, '/build/assets/dest-paris.jpg', $t('The City of Light with world-class art, food, and culture.'), $t('Paris charms with museums, cafes, Seine-side strolls, and timeless elegance.'), $t('April to June'), $t('French'), $t('Euro'), $t('Mild in spring')],
            ['dubai', $t('Dubai', 'Dubaï', 'دبي'), $t('UAE', 'Émirats Arabes Unis', 'الإمارات العربية المتحدة'), 'luxury', $t('Luxury', 'Luxe', 'فاخر'), 1199, 4.7, '/build/assets/dest-dubai.jpg', $t('Futuristic skyline meets desert adventures.'), $t('Dubai combines shopping, beaches, skyline views, and desert escapes in a highly modern destination.'), $t('November to March'), $t('Arabic and English'), $t('UAE dirham'), $t('Hot and dry')],
        ] as [$slug, $name, $country, $categoryKey, $category, $price, $rating, $image, $description, $about, $bestTime, $language, $currency, $weather]) {
            Destination::query()->updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'country' => $country,
                'category_key' => $categoryKey,
                'category' => $category,
                'price' => $price,
                'rating' => $rating,
                'image' => $image,
                'description' => $description,
                'details' => [
                    'gallery' => [$image, '/images/destination-dubai.jpg'],
                    'about' => $about,
                    'highlights' => [$t('Curated local experiences'), $t('Handpicked stays'), $t('Flexible planning')],
                    'bestTime' => $bestTime,
                    'language' => $language,
                    'currency' => $currency,
                    'weather' => $weather,
                ],
            ]);
        }

        foreach ([
            ['sunset-paradise-resort', 'sunset-paradise', 'santorini', $t('Sunset Paradise Resort'), $t('Santorini, Greece'), 320, 4.9, 5, 234, '/images/hero-travel.jpg', ['luxury', 'beach', 'resort']],
            ['ubud-jungle-retreat', 'ubud-jungle', 'bali', $t('Ubud Jungle Retreat'), $t('Bali, Indonesia'), 180, 4.8, 4, 189, '/images/destination-santorini.jpg', ['adventure', 'nature', 'boutique']],
            ['grand-parisien', 'grand-parisien', 'paris', $t('Le Grand Parisien'), $t('Paris, France'), 450, 4.9, 5, 312, '/images/destination-bali.jpg', ['luxury', 'city', 'boutique']],
            ['marina-bay-suites', 'marina-bay', 'dubai', $t('Marina Bay Suites'), $t('Dubai, UAE'), 280, 4.7, 5, 156, '/images/destination-paris.jpg', ['luxury', 'city', 'resort']],
            ['imperial-tokyo-hotel', 'imperial-tokyo', 'tokyo', $t('Imperial Tokyo Hotel'), $t('Tokyo, Japan'), 350, 4.8, 4, 278, '/images/destination-dubai.jpg', ['city', 'family', 'resort']],
        ] as [$slug, $code, $destination, $name, $location, $price, $rating, $stars, $reviews, $image, $tags]) {
            Hotel::query()->updateOrCreate(['slug' => $slug], [
                'code' => $code,
                'destination_slug' => $destination,
                'name' => $name,
                'location' => $location,
                'price' => $price,
                'rating' => $rating,
                'stars' => $stars,
                'reviews' => $reviews,
                'image' => $image,
                'amenities' => ['wifi', 'parking', 'breakfast'],
                'tags' => $tags,
                'details' => ['images' => [$image], 'rooms' => []],
            ]);
        }

        foreach ([
            ['greek-island-hopping', $t('Greek Island Hopping', 'Îles Grecques en Liberté', 'جولة الجزر اليونانية'), $t('Greece'), $t('7 Days'), 7, 6, 12, 2499, 4.9, '/images/hero-travel.jpg', $t('Explore the stunning Cycladic islands with guided tours and free time.')],
            ['bali-cultural-immersion', $t('Bali Cultural Immersion'), $t('Indonesia'), $t('10 Days'), 10, 9, 8, 1899, 4.8, '/images/destination-santorini.jpg', $t('Temples, rice fields, and traditional ceremonies in the heart of Bali.')],
            ['paris-art-gastronomy', $t('Parisian Art & Gastronomy'), $t('France'), $t('5 Days'), 5, 4, 10, 3200, 4.9, '/images/destination-bali.jpg', $t('Private museum tours, cooking classes, and wine tastings.')],
        ] as [$slug, $name, $location, $duration, $days, $nights, $maxGroup, $price, $rating, $image, $description]) {
            Tour::query()->updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'location' => $location,
                'duration' => $duration,
                'duration_days' => $days,
                'duration_nights' => $nights,
                'max_group' => $maxGroup,
                'price' => $price,
                'rating' => $rating,
                'image' => $image,
                'description' => $description,
                'details' => [
                    'type' => $t('Tour'),
                    'images' => [$image],
                    'tags' => ['culture', 'guided'],
                    'itinerary' => [['day' => 1, 'title' => $t('Arrival and welcome'), 'details' => $t('Meet your host and settle in.')]],
                    'inclusions' => [$t('Breakfast'), $t('Local guide')],
                    'excludes' => [$t('International flights'), $t('Travel insurance')],
                ],
            ]);
        }

        foreach ([
            ['mercedes-e-class', $t('Mercedes E-Class'), $t('Luxury'), 120, 5, $t('Hybrid'), $t('Auto'), '/images/destination-paris.jpg'],
            ['bmw-x5-suv', $t('BMW X5 SUV'), $t('SUV'), 150, 7, $t('Diesel'), $t('Auto'), '/images/destination-dubai.jpg'],
            ['tesla-model-3', $t('Tesla Model 3'), $t('Electric'), 130, 5, $t('Electric'), $t('Auto'), '/images/hero-travel.jpg'],
        ] as [$slug, $name, $category, $price, $seats, $fuel, $transmission, $image]) {
            Car::query()->updateOrCreate(['slug' => $slug], compact('name', 'category', 'price', 'seats', 'fuel', 'transmission', 'image') + ['details' => ['gallery' => [$image], 'description' => $t('Premium rental vehicle.'), 'features' => [$t('Insurance included')], 'policy' => [$t('Driver age 25+')]]]);
        }

        foreach ([
            ['emirates-nyc-dxb', $t('Emirates'), 'NYC', $t('Dubai'), $t('12h 30m'), 890, $t('Direct'), '09:45', '06:15+1'],
            ['airfrance-nyc-par', $t('Air France'), 'NYC', $t('Paris'), $t('7h 20m'), 620, $t('Direct'), '20:30', '09:50+1'],
            ['singapore-lax-tyo', $t('Singapore Airlines'), 'LAX', $t('Tokyo'), $t('11h 45m'), 1120, $t('Direct'), '11:00', '16:45+1'],
        ] as [$code, $airline, $from, $to, $duration, $price, $stops, $departure, $arrival]) {
            Flight::query()->updateOrCreate(['code' => $code], compact('airline', 'from', 'to', 'duration', 'price', 'stops', 'departure', 'arrival') + ['details' => ['cabin' => $t('Economy'), 'aircraft' => $t('Boeing 777'), 'baggage' => $t('1 cabin + 1 checked bag'), 'refund' => $t('Fare rules apply')]]);
        }

        foreach ([
            ['cherry-blossom-festival', $t('Cherry Blossom Festival'), $t('Tokyo, Japan'), $t('April 5 - 12, 2026'), 2490, '/images/destination-santorini.jpg'],
            ['la-tomatina', $t('La Tomatina'), $t('Bunol, Spain'), $t('August 26, 2026'), 1790, '/images/destination-bali.jpg'],
            ['northern-lights-retreat', $t('Northern Lights Retreat'), $t('Tromso, Norway'), $t('Feb 15 - 22, 2026'), 2980, '/images/destination-paris.jpg'],
            ['venice-carnival', $t('Carnival of Venice'), $t('Venice, Italy'), $t('Feb 8 - 17, 2026'), 2640, '/images/destination-dubai.jpg'],
        ] as [$slug, $title, $location, $date, $price, $image]) {
            Event::query()->updateOrCreate(['slug' => $slug], ['title' => $title, 'location' => $location, 'date' => $date, 'price' => $price, 'image' => $image, 'description' => $t('Curated travel event.'), 'details' => ['gallery' => [$image], 'about' => $t('A hosted event journey with cultural highlights.'), 'attendees' => $t('24 participants'), 'schedule' => [['day' => $t('Day 1'), 'activity' => $t('Arrival'), 'details' => $t('Welcome and orientation.')]]]]);
        }

        foreach ([
            ['early-bird-summer-2026', $t('Early Bird Summer 2026'), $t('Book your summer getaway before March 31st and save up to 35%.'), $t('35% OFF'), $t('Mar 31, 2026'), $t('Seasonal')],
            ['last-minute-escapes', $t('Last Minute Escapes'), $t('Incredible prices on departures within the next 14 days.'), $t('Up to 50%'), $t('Rolling'), $t('Last minute')],
            ['honeymoon-packages', $t('Honeymoon Packages'), $t('All-inclusive romantic getaways with private touches.'), $t('Free Upgrade'), $t('Dec 31, 2026'), $t('Romance')],
        ] as [$slug, $title, $description, $discount, $expires, $category]) {
            Deal::query()->updateOrCreate(['slug' => $slug], compact('title', 'description', 'discount', 'expires', 'category') + ['details' => ['highlights' => [$t('Flexible dates')], 'terms' => [$t('Subject to availability')]]]);
        }

        foreach ([
            ['SPRING30', $t('Spring Flash Sale'), $t('30% OFF'), $t('On all European destinations booked this month.'), $t('Mar 31, 2026'), 'from-primary to-primary/70'],
            ['LOVE2026', $t('Honeymoon Special'), $t('FREE Suite Upgrade'), $t('Complimentary upgrade and champagne on arrival.'), $t('Dec 31, 2026'), 'from-secondary to-secondary/70'],
            ['GROUP10', $t('Group Adventure'), $t('10% OFF'), $t('Groups of 6+ on any guided tour worldwide.'), $t('Ongoing'), 'from-primary/80 to-secondary'],
        ] as [$code, $title, $discount, $description, $expires, $color]) {
            Promo::query()->updateOrCreate(['code' => $code], compact('title', 'discount', 'description', 'expires', 'color') + ['details' => ['eligibility' => [$t('Selected bookings')], 'howToUse' => [$t('Apply code at checkout')], 'terms' => [$t('Cannot be combined with other offers')]]]);
        }

        foreach ([
            ['southeast-asia-hidden-gems', $t('10 Hidden Gems in Southeast Asia You Must Visit'), $t('Discover lesser-known destinations with extraordinary experiences.'), 'Feb 15, 2026', $t('Adventure'), '/images/hero-travel.jpg'],
            ['budget-travel-europe', $t('The Ultimate Guide to Budget Travel in Europe'), $t('How to explore Europe without breaking the bank.'), 'Feb 10, 2026', $t('Tips'), '/images/destination-santorini.jpg'],
            ['sustainable-travel-2026', $t('Why Sustainable Travel Matters in 2026'), $t('The growing movement toward eco-conscious tourism.'), 'Feb 5, 2026', $t('Sustainability'), '/images/destination-bali.jpg'],
        ] as [$slug, $title, $excerpt, $date, $category, $image]) {
            BlogPost::query()->updateOrCreate(['slug' => $slug], compact('title', 'excerpt', 'date', 'category', 'image') + ['content' => $excerpt]);
        }
    }
}

