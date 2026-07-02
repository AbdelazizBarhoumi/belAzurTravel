<?php

namespace Database\Seeders;

use App\Models\Visa;
use Illuminate\Database\Seeder;

class VisaSeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            [
                'code' => 'FR', 'flag' => '🇫🇷', 'price' => 280, 'sort_order' => 1,
                'name' => ['en' => 'France', 'fr' => 'France', 'ar' => 'فرنسا'],
                'region' => ['en' => 'Europe', 'fr' => 'Europe', 'ar' => 'أوروبا'],
                'processing' => ['en' => '10-15 days', 'fr' => '10-15 jours', 'ar' => '10-15 يوم'],
            ],
            [
                'code' => 'IT', 'flag' => '🇮🇹', 'price' => 260, 'sort_order' => 2,
                'name' => ['en' => 'Italy', 'fr' => 'Italie', 'ar' => 'إيطاليا'],
                'region' => ['en' => 'Europe', 'fr' => 'Europe', 'ar' => 'أوروبا'],
                'processing' => ['en' => '10-15 days', 'fr' => '10-15 jours', 'ar' => '10-15 يوم'],
            ],
            [
                'code' => 'ES', 'flag' => '🇪🇸', 'price' => 260, 'sort_order' => 3,
                'name' => ['en' => 'Spain', 'fr' => 'Espagne', 'ar' => 'إسبانيا'],
                'region' => ['en' => 'Europe', 'fr' => 'Europe', 'ar' => 'أوروبا'],
                'processing' => ['en' => '12-18 days', 'fr' => '12-18 jours', 'ar' => '12-18 يوم'],
            ],
            [
                'code' => 'DE', 'flag' => '🇩🇪', 'price' => 290, 'sort_order' => 4,
                'name' => ['en' => 'Germany', 'fr' => 'Allemagne', 'ar' => 'ألمانيا'],
                'region' => ['en' => 'Europe', 'fr' => 'Europe', 'ar' => 'أوروبا'],
                'processing' => ['en' => '10-14 days', 'fr' => '10-14 jours', 'ar' => '10-14 يوم'],
            ],
            [
                'code' => 'GB', 'flag' => '🇬🇧', 'price' => 550, 'sort_order' => 5,
                'name' => ['en' => 'United Kingdom', 'fr' => 'Royaume-Uni', 'ar' => 'المملكة المتحدة'],
                'region' => ['en' => 'Europe', 'fr' => 'Europe', 'ar' => 'أوروبا'],
                'processing' => ['en' => '15-21 days', 'fr' => '15-21 jours', 'ar' => '15-21 يوم'],
            ],
            [
                'code' => 'US', 'flag' => '🇺🇸', 'price' => 620, 'sort_order' => 6,
                'name' => ['en' => 'United States', 'fr' => 'États-Unis', 'ar' => 'الولايات المتحدة'],
                'region' => ['en' => 'America', 'fr' => 'Amérique', 'ar' => 'أمريكا'],
                'processing' => ['en' => '30-60 days', 'fr' => '30-60 jours', 'ar' => '30-60 يوم'],
            ],
            [
                'code' => 'CA', 'flag' => '🇨🇦', 'price' => 480, 'sort_order' => 7,
                'name' => ['en' => 'Canada', 'fr' => 'Canada', 'ar' => 'كندا'],
                'region' => ['en' => 'America', 'fr' => 'Amérique', 'ar' => 'أمريكا'],
                'processing' => ['en' => '20-40 days', 'fr' => '20-40 jours', 'ar' => '20-40 يوم'],
            ],
            [
                'code' => 'AE', 'flag' => '🇦🇪', 'price' => 220, 'sort_order' => 8,
                'name' => ['en' => 'United Arab Emirates', 'fr' => 'Émirats Arabes Unis', 'ar' => 'الإمارات العربية المتحدة'],
                'region' => ['en' => 'Middle East', 'fr' => 'Moyen-Orient', 'ar' => 'الشرق الأوسط'],
                'processing' => ['en' => '3-5 days', 'fr' => '3-5 jours', 'ar' => '3-5 أيام'],
            ],
            [
                'code' => 'SA', 'flag' => '🇸🇦', 'price' => 340, 'sort_order' => 9,
                'name' => ['en' => 'Saudi Arabia', 'fr' => 'Arabie Saoudite', 'ar' => 'المملكة العربية السعودية'],
                'region' => ['en' => 'Middle East', 'fr' => 'Moyen-Orient', 'ar' => 'الشرق الأوسط'],
                'processing' => ['en' => '5-10 days', 'fr' => '5-10 jours', 'ar' => '5-10 أيام'],
            ],
            [
                'code' => 'TR', 'flag' => '🇹🇷', 'price' => 120, 'sort_order' => 10,
                'name' => ['en' => 'Turkey', 'fr' => 'Turquie', 'ar' => 'تركيا'],
                'region' => ['en' => 'Middle East', 'fr' => 'Moyen-Orient', 'ar' => 'الشرق الأوسط'],
                'processing' => ['en' => '1-3 days', 'fr' => '1-3 jours', 'ar' => '1-3 أيام'],
            ],
            [
                'code' => 'CN', 'flag' => '🇨🇳', 'price' => 380, 'sort_order' => 11,
                'name' => ['en' => 'China', 'fr' => 'Chine', 'ar' => 'الصين'],
                'region' => ['en' => 'Asia', 'fr' => 'Asie', 'ar' => 'آسيا'],
                'processing' => ['en' => '10-15 days', 'fr' => '10-15 jours', 'ar' => '10-15 يوم'],
            ],
            [
                'code' => 'JP', 'flag' => '🇯🇵', 'price' => 320, 'sort_order' => 12,
                'name' => ['en' => 'Japan', 'fr' => 'Japon', 'ar' => 'اليابان'],
                'region' => ['en' => 'Asia', 'fr' => 'Asie', 'ar' => 'آسيا'],
                'processing' => ['en' => '7-10 days', 'fr' => '7-10 jours', 'ar' => '7-10 أيام'],
            ],
            [
                'code' => 'TH', 'flag' => '🇹🇭', 'price' => 240, 'sort_order' => 13,
                'name' => ['en' => 'Thailand', 'fr' => 'Thaïlande', 'ar' => 'تايلاند'],
                'region' => ['en' => 'Asia', 'fr' => 'Asie', 'ar' => 'آسيا'],
                'processing' => ['en' => '5-8 days', 'fr' => '5-8 jours', 'ar' => '5-8 أيام'],
            ],
            [
                'code' => 'MY', 'flag' => '🇲🇾', 'price' => 210, 'sort_order' => 14,
                'name' => ['en' => 'Malaysia', 'fr' => 'Malaisie', 'ar' => 'ماليزيا'],
                'region' => ['en' => 'Asia', 'fr' => 'Asie', 'ar' => 'آسيا'],
                'processing' => ['en' => '5-7 days', 'fr' => '5-7 jours', 'ar' => '5-7 أيام'],
            ],
            [
                'code' => 'ID', 'flag' => '🇮🇩', 'price' => 250, 'sort_order' => 15,
                'name' => ['en' => 'Indonesia', 'fr' => 'Indonésie', 'ar' => 'إندونيسيا'],
                'region' => ['en' => 'Asia', 'fr' => 'Asie', 'ar' => 'آسيا'],
                'processing' => ['en' => '7-10 days', 'fr' => '7-10 jours', 'ar' => '7-10 أيام'],
            ],
            [
                'code' => 'AU', 'flag' => '🇦🇺', 'price' => 580, 'sort_order' => 16,
                'name' => ['en' => 'Australia', 'fr' => 'Australie', 'ar' => 'أستراليا'],
                'region' => ['en' => 'Oceania', 'fr' => 'Océanie', 'ar' => 'أوقيانوسيا'],
                'processing' => ['en' => '20-30 days', 'fr' => '20-30 jours', 'ar' => '20-30 يوم'],
            ],
            [
                'code' => 'ZA', 'flag' => '🇿🇦', 'price' => 300, 'sort_order' => 17,
                'name' => ['en' => 'South Africa', 'fr' => 'Afrique du Sud', 'ar' => 'جنوب أفريقيا'],
                'region' => ['en' => 'Africa', 'fr' => 'Afrique', 'ar' => 'أفريقيا'],
                'processing' => ['en' => '10-15 days', 'fr' => '10-15 jours', 'ar' => '10-15 يوم'],
            ],
            [
                'code' => 'EG', 'flag' => '🇪🇬', 'price' => 180, 'sort_order' => 18,
                'name' => ['en' => 'Egypt', 'fr' => 'Égypte', 'ar' => 'مصر'],
                'region' => ['en' => 'Africa', 'fr' => 'Afrique', 'ar' => 'أفريقيا'],
                'processing' => ['en' => '5-7 days', 'fr' => '5-7 jours', 'ar' => '5-7 أيام'],
            ],
        ];

        foreach ($countries as $country) {
            Visa::updateOrCreate(
                ['code' => $country['code']],
                $country,
            );
        }
    }
}
