<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['entity_type' => 'hotels', 'key' => 'luxury', 'name' => ['en' => 'Luxury', 'fr' => 'Luxe', 'ar' => 'فاخر']],
            ['entity_type' => 'hotels', 'key' => 'resort', 'name' => ['en' => 'Resort', 'fr' => 'Resort', 'ar' => 'منتجع']],
            ['entity_type' => 'hotels', 'key' => 'beach', 'name' => ['en' => 'Beach Resort', 'fr' => 'Hôtel de plage', 'ar' => 'منتجع شاطئي']],
            ['entity_type' => 'hotels', 'key' => 'family', 'name' => ['en' => 'Family Resort', 'fr' => 'Hôtel familial', 'ar' => 'منتجع عائلي']],
            ['entity_type' => 'tours', 'key' => 'religious', 'name' => ['en' => 'Religious Tour', 'fr' => 'Voyage religieux', 'ar' => 'رحلة دينية']],
            ['entity_type' => 'tours', 'key' => 'adventure', 'name' => ['en' => 'Adventure Tour', 'fr' => 'Circuit aventure', 'ar' => 'رحلة مغامرة']],
            ['entity_type' => 'tours', 'key' => 'city', 'name' => ['en' => 'City Tour', 'fr' => 'Voyage urbain', 'ar' => 'جولة مدينة']],
        ] as $row) {
            Category::query()->updateOrCreate(
                [
                    'entity_type' => $row['entity_type'],
                    'key' => $row['key'],
                ],
                [
                    'name' => $row['name'],
                ],
            );
        }
    }
}
