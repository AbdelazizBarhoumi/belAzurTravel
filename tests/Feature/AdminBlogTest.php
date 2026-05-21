<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBlogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_blog_post_with_sections_and_category_key(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $payload = [
            'title_en' => 'Spring Updates',
            'title_fr' => 'Mises à jour du printemps',
            'title_ar' => 'تحديثات الربيع',
            'excerpt_en' => 'Short summary',
            'excerpt_fr' => 'Résumé court',
            'excerpt_ar' => 'ملخص قصير',
            'category_key' => 'seasonal-spring',
            'category_en' => 'Travel',
            'category_fr' => 'Voyage',
            'category_ar' => 'السفر',
            'date' => 'May 14, 2026',
            'image' => '/images/hero-travel.jpg',
            'content' => [
                'body' => [
                    'en' => 'Main body English',
                    'fr' => 'Corps principal français',
                    'ar' => 'النص الرئيسي العربي',
                ],
                'sections' => [
                    [
                        'id' => 'sec-1',
                        'heading' => [
                            'en' => 'Section 1',
                            'fr' => 'Section 1 FR',
                            'ar' => 'القسم 1',
                        ],
                        'body' => [
                            'en' => 'Details 1',
                            'fr' => 'Détails 1',
                            'ar' => 'تفاصيل 1',
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($user)->postJson('/api/admin/blog-posts', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.category_key', 'seasonal-spring')
            ->assertJsonPath('data.title_en', 'Spring Updates');

        $post = BlogPost::query()->firstOrFail();

        $this->assertSame('seasonal-spring', $post->category_key);
        $this->assertSame('Spring Updates', $post->title['en']);
    }

    public function test_admin_can_update_blog_post_without_corrupting_image_paths(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $post = BlogPost::create([
            'slug' => 'lisbon-guide-1234',
            'title' => ['en' => 'Lisbon Guide', 'fr' => 'Guide de Lisbonne', 'ar' => 'دليل لشبونة'],
            'excerpt' => ['en' => 'Plan a Lisbon trip', 'fr' => 'Planifiez un voyage à Lisbonne', 'ar' => 'خطط لرحلة إلى لشبونة'],
            'date' => 'May 13, 2026',
            'category_key' => 'tips',
            'category' => ['en' => 'Travel Tips', 'fr' => 'Conseils de voyage', 'ar' => 'نصائح السفر'],
            'image' => 'storage/uploads/blog_posts/lisbon-guide.png',
            'content' => [
                'body' => ['en' => 'Existing body', 'fr' => 'Corps existant', 'ar' => 'المحتوى الحالي'],
                'sections' => [],
            ],
        ]);

        $response = $this->actingAs($user)->putJson('/api/admin/blog-posts/'.$post->id, [
            'title_en' => 'Lisbon Guide Updated',
            'title_fr' => 'Guide de Lisbonne mis à jour',
            'title_ar' => 'تم تحديث دليل لشبونة',
            'excerpt_en' => 'Plan a Lisbon trip',
            'excerpt_fr' => 'Planifiez un voyage à Lisbonne',
            'excerpt_ar' => 'خطط لرحلة إلى لشبونة',
            'category_key' => 'tips',
            'category_en' => 'Travel Tips',
            'category_fr' => 'Conseils de voyage',
            'category_ar' => 'نصائح السفر',
            'date' => 'May 13, 2026',
            'image' => 'http://127.0.0.1:8006/storage/uploads/blog_posts/lisbon-guide.png',
            'content' => [
                'body' => [
                    'en' => 'Existing body',
                    'fr' => 'Corps existant',
                    'ar' => 'المحتوى الحالي',
                ],
                'sections' => [],
            ],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.title_en', 'Lisbon Guide Updated');

        $post->refresh();

        $this->assertSame('storage/uploads/blog_posts/lisbon-guide.png', $post->image);
        $this->assertStringNotContainsString('/storage/http://', (string) $response->json('data.image'));
    }

    public function test_admin_blog_updates_invalidate_public_blog_cache(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $post = BlogPost::create([
            'slug' => 'lisbon-guide',
            'title' => ['en' => 'Lisbon Guide', 'fr' => 'Guide de Lisbonne', 'ar' => 'دليل لشبونة'],
            'excerpt' => ['en' => 'Plan a Lisbon trip', 'fr' => 'Planifiez un voyage à Lisbonne', 'ar' => 'خطط لرحلة إلى لشبونة'],
            'date' => 'May 13, 2026',
            'category_key' => 'tips',
            'category' => ['en' => 'Travel Tips', 'fr' => 'Conseils de voyage', 'ar' => 'نصائح السفر'],
            'image' => 'uploads/blog_posts/lisbon-guide.png',
            'content' => ['body' => ['en' => 'Old body', 'fr' => 'Ancien corps', 'ar' => 'المحتوى القديم'], 'sections' => []],
        ]);

        $this->getJson('/api/blog-posts')
            ->assertOk()
            ->assertJsonPath('0.title.en', 'Lisbon Guide');

        $this->getJson('/api/blog-posts/lisbon-guide')
            ->assertOk()
            ->assertJsonPath('title.en', 'Lisbon Guide');

        $this->actingAs($admin)
            ->putJson('/api/admin/blog-posts/'.$post->id, [
                'title_en' => 'Lisbon Guide Updated',
                'title_fr' => 'Guide de Lisbonne mis à jour',
                'title_ar' => 'تم تحديث دليل لشبونة',
                'excerpt_en' => 'Plan a Lisbon trip',
                'excerpt_fr' => 'Planifiez un voyage à Lisbonne',
                'excerpt_ar' => 'خطط لرحلة إلى لشبونة',
                'category_key' => 'tips',
                'category_en' => 'Travel Tips',
                'category_fr' => 'Conseils de voyage',
                'category_ar' => 'نصائح السفر',
                'date' => 'May 13, 2026',
                'content' => [
                    'body' => [
                        'en' => 'New body',
                        'fr' => 'Nouveau corps',
                        'ar' => 'المحتوى الجديد',
                    ],
                    'sections' => [],
                ],
            ])
            ->assertOk();

        $this->getJson('/api/blog-posts')
            ->assertOk()
            ->assertJsonPath('0.title.en', 'Lisbon Guide Updated')
            ->assertJsonPath('0.content.body.en', 'New body');

        $this->getJson('/api/blog-posts/lisbon-guide')
            ->assertOk()
            ->assertJsonPath('title.en', 'Lisbon Guide Updated')
            ->assertJsonPath('content.body.en', 'New body');
    }
}

