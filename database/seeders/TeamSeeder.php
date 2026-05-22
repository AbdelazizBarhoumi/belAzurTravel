<?php

namespace Database\Seeders;

use App\Models\Team;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Team::create([
            'name' => ['en' => 'Amina', 'fr' => 'Amina', 'ar' => 'أمينة'],
            'role' => ['en' => 'Travel Advisor', 'fr' => 'Conseillère en voyages', 'ar' => 'مستشارة سفر'],
            'bio' => [
                'en' => 'Designs tailor-made escapes with a focus on luxury and comfort.',
                'fr' => 'Conçoit des escapades sur mesure avec un accent sur le luxe et le confort.',
                'ar' => 'تصمم رحلات مخصصة مع التركيز على الفخامة والراحة.',
            ],
            'image_path' => 'images/hero-travel.jpg',
        ]);

        Team::create([
            'name' => ['en' => 'Youssef', 'fr' => 'Youssef', 'ar' => 'يوسف'],
            'role' => ['en' => 'Operations Lead', 'fr' => 'Responsable des opérations', 'ar' => 'مدير العمليات'],
            'bio' => [
                'en' => 'Coordinates logistics so every trip runs smoothly.',
                'fr' => 'Coordonne la logistique pour que chaque voyage se déroule sans encombre.',
                'ar' => 'ينسق الخدمات اللوجستية لضمان سير كل رحلة بسلاسة.',
            ],
            'image_path' => 'images/destination-santorini.jpg',
        ]);

        Team::create([
            'name' => ['en' => 'Sara', 'fr' => 'Sara', 'ar' => 'سارة'],
            'role' => ['en' => 'Destination Specialist', 'fr' => 'Spécialiste de la destination', 'ar' => 'متخصصة في الوجهات'],
            'bio' => [
                'en' => 'Knows hidden gems, local culture, and the best places to stay.',
                'fr' => 'Connaît les joyaux cachés, la culture locale et les meilleurs endroits où séjourner.',
                'ar' => 'تعرف الجواهر المخفية والثقافة المحلية وأفضل أماكن الإقامة.',
            ],
            'image_path' => 'images/destination-bali.jpg',
        ]);
    }
}
