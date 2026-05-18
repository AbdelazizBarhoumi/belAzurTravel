<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBlogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_blog_post_with_sections(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
        ]);

        $payload = [
            'title_en' => 'Spring Updates',
            'title_fr' => 'Mises à jour du printemps',
            'title_ar' => 'تحديثات الربيع',
            'excerpt_en' => 'Short summary',
            'excerpt_fr' => 'Résumé court',
            'excerpt_ar' => 'ملخص قصير',
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
            ->assertJsonPath('data.title_en', 'Spring Updates')
            ->assertJsonPath('data.content.body.en', 'Main body English')
            ->assertJsonPath('data.content.sections.0.heading.en', 'Section 1');

        $post = BlogPost::query()->firstOrFail();

        $this->assertSame('Spring Updates', $post->title['en']);
        $this->assertSame('Main body English', $post->content['body']['en']);
        $this->assertSame('Section 1', $post->content['sections'][0]['heading']['en']);
    }
}

