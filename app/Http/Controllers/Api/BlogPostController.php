<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class BlogPostController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $result = Cache::remember(
            'blog-posts.index',
            now()->addMinutes(10),
            function () {
                return BlogPost::query()->oldest('id')->get()->map(
                    fn (BlogPost $item) => $this->payload($item)
                );
            }
        );

        return response()->json($result);
    }

    public function show(string $slug): JsonResponse
    {
        $item = BlogPost::query()->where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember(
            "blog-posts.{$slug}",
            now()->addMinutes(10),
            fn () => $this->payload($item)
        ));
    }

    /** @return array<string, mixed> */
    private function payload(BlogPost $item): array
    {
        return [
            'slug' => $item->slug,
            'title' => $item->title ?? [],
            'excerpt' => $item->excerpt ?? [],
            'date' => $item->date,
            'category_key' => $item->category_key,
            'category' => $item->category ?? [],
            'image' => $this->normalizeApiOutputPath($item->image),
            'content' => $item->content ?? null,
        ];
    }
}
