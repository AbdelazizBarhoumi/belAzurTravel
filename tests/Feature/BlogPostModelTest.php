<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlogPostModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_blog_post_casts_date_to_carbon_instance(): void
    {
        $post = BlogPost::create([
            'slug' => 'test-blog-post',
            'title' => ['en' => 'Title'],
            'excerpt' => ['en' => 'Excerpt'],
            'date' => '2026-05-20',
            'category_key' => 'travel',
            'category' => ['en' => 'Travel'],
            'image' => 'image.jpg',
            'content' => ['body' => 'Content'],
        ]);

        $this->assertInstanceOf(CarbonInterface::class, $post->date);
        $this->assertEquals('2026-05-20', $post->date->format('Y-m-d'));
    }
}
