<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use App\Models\Car;
use App\Models\Category;
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
        $t = fn (string $en, ?string $fr = null, ?string $ar = null): array => [
            'en' => $en,
            'fr' => $fr ?? $en,
            'ar' => $ar ?? $en,
        ];

        // 1. Seed Categories
        $categories = [
            'destinations' => [
                ['key' => 'beach', 'name' => $t('Beach', 'Plage', 'شاطئ')],
                ['key' => 'city', 'name' => $t('City', 'Ville', 'مدينة')],
                ['key' => 'nature', 'name' => $t('Nature', 'Nature', 'طبيعة')],
                ['key' => 'luxury', 'name' => $t('Luxury', 'Luxe', 'فاخر')],
                ['key' => 'adventure', 'name' => $t('Adventure', 'Aventure', 'مغامرة')],
            ],
            'hotels' => [
                ['key' => 'luxury', 'name' => $t('Luxury', 'Luxe', 'فاخر')],
                ['key' => 'boutique', 'name' => $t('Boutique', 'Boutique', 'بوتيك')],
                ['key' => 'resort', 'name' => $t('Resort', 'Complexe', 'منتجع')],
                ['key' => 'family', 'name' => $t('Family Friendly', 'Pour Familles', 'مناسب للعائلات')],
                ['key' => 'budget', 'name' => $t('Budget', 'Économique', 'اقتصادي')],
            ],
            'tours' => [
                ['key' => 'cultural', 'name' => $t('Cultural', 'Culturel', 'ثقافي')],
                ['key' => 'adventure', 'name' => $t('Adventure', 'Aventure', 'مغامرة')],
                ['key' => 'relaxation', 'name' => $t('Relaxation', 'Détente', 'استرخاء')],
                ['key' => 'wildlife', 'name' => $t('Wildlife', 'Vie Sauvage', 'الحياة البرية')],
            ],
            'cars' => [
                ['key' => 'luxury', 'name' => $t('Luxury', 'Luxe', 'فاخر')],
                ['key' => 'suv', 'name' => $t('SUV', 'SUV', 'سيارة دفع رباعي')],
                ['key' => 'electric', 'name' => $t('Electric', 'Électrique', 'كهربائية')],
                ['key' => 'economy', 'name' => $t('Economy', 'Économique', 'اقتصادية')],
            ],
            'events' => [
                ['key' => 'festival', 'name' => $t('Festival', 'Festival', 'مهرجان')],
                ['key' => 'concert', 'name' => $t('Concert', 'Concert', 'حفل موسيقي')],
                ['key' => 'sports', 'name' => $t('Sports', 'Sports', 'رياضة')],
                ['key' => 'exhibition', 'name' => $t('Exhibition', 'Exposition', 'معرض')],
            ],
            'deals' => [
                ['key' => 'last-minute', 'name' => $t('Last Minute', 'Dernière Minute', 'آخر لحظة')],
                ['key' => 'early-bird', 'name' => $t('Early Bird', 'Réservation Anticipée', 'حجز مبكر')],
                ['key' => 'seasonal', 'name' => $t('Seasonal', 'Saisonnier', 'موسمي')],
                ['key' => 'honeymoon', 'name' => $t('Honeymoon', 'Lune de Miel', 'شهر العسل')],
            ],
            'blog' => [
                ['key' => 'tips', 'name' => $t('Travel Tips', 'Conseils de Voyage', 'نصائح سفر')],
                ['key' => 'guides', 'name' => $t('Guides', 'Guides', 'أدلة')],
                ['key' => 'news', 'name' => $t('News', 'Actualités', 'أخبار')],
                ['key' => 'stories', 'name' => $t('Stories', 'Histoires', 'قصص')],
            ],
        ];

        foreach ($categories as $type => $list) {
            foreach ($list as $cat) {
                Category::query()->updateOrCreate(
                    ['entity_type' => $type, 'key' => $cat['key']],
                    ['name' => $cat['name']]
                );
            }
        }

        // 2. Seed Site Settings
        $siteSettings = [
            'company_name' => 'BelAzurTravel',
            'email' => 'hello@voyageur.com',
            'phone' => '+1 (555) 123-4567',
            'whatsapp' => '15551234567',
            'address' => '123 Travel St, NY 10001',
            'plus_code' => '8FVC9G8F+5V',
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
                    'body' => $t('Standard terms of use for BelAzurTravel services.', 'Conditions d’utilisation standard.', 'شروط الاستخدام القياسية.'),
                ],
                [
                    'title' => $t('Privacy Policy', 'Politique de confidentialité', 'سياسة الخصوصية'),
                    'body' => $t('We value your privacy. Your data is handled securely.', 'Nous accordons de l’importance à votre vie privée.', 'نحن نقدر خصوصيتك.'),
                ],
            ],
            'hours' => [
                ['dayKey' => 'footer.monfri', 'value' => '09:00 – 19:00'],
                ['dayKey' => 'footer.sat', 'value' => '10:00 – 17:00'],
                ['dayKey' => 'footer.sun', 'value' => 'footer.closed'],
            ],
            'content' => [
                'nav' => [
                    'settings' => [
                        'header' => [
                            ['pageKey' => 'destinations', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'top', 'items' => [
                                ['label' => 'Categories', 'mode' => 'categories', 'value' => '']
                            ]],
                            ['pageKey' => 'hotels', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'top', 'items' => [
                                ['label' => 'Categories', 'mode' => 'categories', 'value' => '']
                            ]],
                            ['pageKey' => 'tours', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'top', 'items' => [
                                ['label' => 'Categories', 'mode' => 'categories', 'value' => '']
                            ]],
                            ['pageKey' => 'deals', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'top', 'items' => [
                                ['label' => 'Categories', 'mode' => 'categories', 'value' => '']
                            ]],
                            ['pageKey' => 'blog', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'top', 'items' => [
                                ['label' => 'Categories', 'mode' => 'categories', 'value' => '']
                            ]],
                            ['pageKey' => 'cars', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'more', 'items' => [
                                ['label' => 'Categories', 'mode' => 'categories', 'value' => '']
                            ]],
                            ['pageKey' => 'events', 'enabled' => true, 'isDropdown' => true, 'linkSelf' => true, 'placement' => 'more', 'items' => [
                                ['label' => 'Categories', 'mode' => 'categories', 'value' => '']
                            ]],
                            ['pageKey' => 'flights', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
                            ['pageKey' => 'promos', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
                            ['pageKey' => 'gallery', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'top', 'items' => []],
                            ['pageKey' => 'team', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
                            ['pageKey' => 'legal', 'enabled' => true, 'isDropdown' => false, 'linkSelf' => true, 'placement' => 'more', 'items' => []],
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

        // 3. Seed Gallery
        foreach ([
            ['/images/destination-santorini.jpg', $t('Santorini Bliss')],
            ['/images/destination-bali.jpg', $t('Bali Spirit')],
            ['/images/destination-paris.jpg', $t('Parisian Nights')],
            ['/images/destination-dubai.jpg', $t('Dubai Skyline')],
            ['/images/hero-travel.jpg', $t('World Awaits')],
        ] as $i => [$url, $caption]) {
            GalleryImage::query()->updateOrCreate(['url' => $url], [
                'caption' => $caption,
            ]);
        }

        // 4. Seed Destinations
        foreach ([
            ['santorini', $t('Santorini'), $t('Greece'), 'beach', 1299, 4.9, '/images/destination-santorini.jpg'],
            ['bali', $t('Bali'), $t('Indonesia'), 'nature', 899, 4.8, '/images/destination-bali.jpg'],
            ['paris', $t('Paris'), $t('France'), 'city', 1499, 4.9, '/images/destination-paris.jpg'],
            ['dubai', $t('Dubai'), $t('UAE'), 'luxury', 1199, 4.7, '/images/destination-dubai.jpg'],
        ] as [$slug, $name, $country, $catKey, $price, $rating, $image]) {
            Destination::query()->updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'country' => $country,
                'category_key' => $catKey,
                'price' => $price,
                'rating' => $rating,
                'image' => $image,
                'description' => $t('Experience the beauty of ' . $slug),
                'details' => ['gallery' => [$image], 'about' => $t('About ' . $slug)],
            ]);
        }

        // 5. Seed Hotels
        foreach ([
            ['sunset-resort', 'santorini', 'luxury', $t('Luxury'), $t('Sunset Resort'), 350, 5],
            ['jungle-villas', 'bali', 'resort', $t('Resort'), $t('Jungle Villas'), 200, 4],
            ['city-palace', 'paris', 'boutique', $t('Boutique'), $t('City Palace'), 400, 4],
            ['desert-mirage', 'dubai', 'luxury', $t('Luxury'), $t('Desert Mirage'), 300, 5],
        ] as [$slug, $dest, $catKey, $catName, $name, $price, $stars]) {
            Hotel::query()->updateOrCreate(['slug' => $slug], [
                'code' => strtoupper($slug),
                'destination_slug' => $dest,
                'name' => $name,
                'location' => $t($dest . ', World'),
                'category_key' => $catKey,
                'category' => json_encode($catName),
                'price' => $price,
                'rating' => 4.5,
                'stars' => $stars,
                'reviews' => rand(50, 500),
                'image' => "/images/destination-{$dest}.jpg",
                'amenities' => ['wifi', 'parking', 'pool'],
                'tags' => [$catKey],
                'details' => ['images' => ["/images/destination-{$dest}.jpg"]],
            ]);
        }

        // 6. Seed Tours
        foreach ([
            ['aegean-cruise', 'cultural', $t('Cultural'), $t('Aegean Cruise'), 1500, '/images/destination-santorini.jpg'],
            ['bali-trekking', 'adventure', $t('Adventure'), $t('Bali Trekking'), 800, '/images/destination-bali.jpg'],
            ['louvre-private', 'cultural', $t('Cultural'), $t('Louvre Private Tour'), 300, '/images/destination-paris.jpg'],
        ] as [$slug, $catKey, $catName, $name, $price, $image]) {
            Tour::query()->updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'location' => $t('Various'),
                'category_key' => $catKey,
                'category' => json_encode($catName),
                'price' => $price,
                'rating' => 4.9,
                'image' => $image,
                'duration' => $t('5 Days'),
                'description' => $t('Amazing tour experience'),
            ]);
        }

        // 7. Seed Cars
        foreach ([
            ['mercedes-s-class', 'luxury', $t('Luxury'), $t('Mercedes S-Class'), 250, '/images/destination-paris.jpg'],
            ['land-rover-vogue', 'suv', $t('SUV'), $t('Range Rover Vogue'), 300, '/images/destination-dubai.jpg'],
            ['tesla-model-s', 'electric', $t('Electric'), $t('Tesla Model S'), 200, '/images/hero-travel.jpg'],
        ] as [$slug, $catKey, $catName, $name, $price, $image]) {
            Car::query()->updateOrCreate(['slug' => $slug], [
                'name' => $name,
                'category_key' => $catKey,
                'category' => json_encode($catName),
                'price' => $price,
                'seats' => 5,
                'fuel' => $t('Premium'),
                'transmission' => $t('Automatic'),
                'image' => $image,
            ]);
        }

        // 8. Seed Events
        foreach ([
            ['tomorrowland', 'festival', $t('Festival'), $t('Tomorrowland'), 500, '/images/hero-travel.jpg'],
            ['world-cup', 'sports', $t('Sports'), $t('World Cup Final'), 1500, '/images/destination-dubai.jpg'],
        ] as [$slug, $catKey, $catName, $title, $price, $image]) {
            Event::query()->updateOrCreate(['slug' => $slug], [
                'title' => $title,
                'location' => $t('Global'),
                'date' => $t('Summer 2026'),
                'category_key' => $catKey,
                'category' => json_encode($catName),
                'price' => $price,
                'image' => $image,
                'description' => $t('Be part of the legend.'),
            ]);
        }

        // 9. Seed Deals
        foreach ([
            ['santorini-summer', 'seasonal', $t('Seasonal'), $t('Santorini Summer Deal'), $t('30% OFF')],
            ['last-call-paris', 'last-minute', $t('Last Minute'), $t('Last Call: Paris'), $t('50% OFF')],
        ] as [$slug, $catKey, $catName, $title, $discount]) {
            Deal::query()->updateOrCreate(['slug' => $slug], [
                'title' => $title,
                'description' => $t('Limited time offer'),
                'discount' => $discount,
                'expires' => $t('Next week'),
                'category_key' => $catKey,
                'category' => $catName,
            ]);
        }

        // 10. Seed Blog
        foreach ([
            ['top-10-beaches', 'tips', $t('Travel Tips'), $t('Top 10 Hidden Beaches'), '/images/destination-santorini.jpg'],
            ['packing-guide', 'guides', $t('Guides'), $t('The Ultimate Packing Guide'), '/images/destination-bali.jpg'],
        ] as [$slug, $catKey, $catName, $title, $image]) {
            BlogPost::query()->updateOrCreate(['slug' => $slug], [
                'title' => $title,
                'excerpt' => $t('Everything you need to know.'),
                'date' => 'May 20, 2026',
                'category_key' => $catKey,
                'category' => $catName,
                'image' => $image,
                'content' => $t('Full article content here.'),
            ]);
        }
    }
}
