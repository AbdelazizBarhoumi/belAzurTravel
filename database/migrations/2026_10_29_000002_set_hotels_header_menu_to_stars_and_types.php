<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The Hotels header menu listed every filter group (stars, room types, meal
 * plans, services, features…). Reduce it to two sub-menus: star ratings and
 * accommodation types. Mirrors HOTELS_MENU_ITEMS in resources/js/lib/nav-config.ts.
 */
return new class extends Migration
{
    public function up(): void
    {
        $stars = ['en' => 'Stars', 'fr' => 'Étoiles', 'ar' => 'النجوم'];
        $types = ['en' => 'Accommodation type', 'fr' => "Type d'hébergement", 'ar' => 'نوع الإقامة'];

        $items = [
            ['label' => $stars, 'mode' => 'filter', 'value' => '', 'children' => [
                ['label' => $stars, 'mode' => 'categories', 'value' => 'static:stars'],
            ]],
            ['label' => $types, 'mode' => 'filter', 'value' => '', 'children' => [
                ['label' => $types, 'mode' => 'categories', 'value' => 'static:accommodation_type'],
            ]],
        ];

        $this->updateHotelsItems(fn () => $items);
    }

    public function down(): void
    {
        $this->updateHotelsItems(fn () => [
            ['label' => ['en' => 'Categories', 'fr' => 'Categories', 'ar' => 'Categories'], 'mode' => 'categories', 'value' => null],
        ]);
    }

    private function updateHotelsItems(Closure $items): void
    {
        $row = DB::table('site_settings')->first();
        if (! $row || ! $row->content) {
            return;
        }

        $content = json_decode($row->content, true);
        $header = $content['nav']['settings']['header'] ?? null;
        if (! is_array($header)) {
            return;
        }

        foreach ($header as $i => $entry) {
            if (($entry['pageKey'] ?? null) === 'hotels') {
                $header[$i]['items'] = $items();
                $header[$i]['isDropdown'] = true;
            }
        }

        $content['nav']['settings']['header'] = $header;
        DB::table('site_settings')->where('id', $row->id)->update([
            'content' => json_encode($content, JSON_UNESCAPED_UNICODE),
        ]);

        foreach (['site-settings', 'site-settings:fr', 'site-settings:en', 'site-settings:ar', 'site_settings_nav'] as $key) {
            Cache::forget($key);
        }
    }
};
