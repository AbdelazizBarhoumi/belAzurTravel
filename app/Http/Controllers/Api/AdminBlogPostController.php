<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\CategoryType;
use App\Models\EntityCategoryAssignment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * AdminBlogPostController
 *
 * API media conventions:
 * - Main image: send `image` as a File upload or string path.
 */
class AdminBlogPostController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.blog-posts', now()->addMinutes(5), function () {
            return BlogPost::query()
                ->with(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue'])
                ->oldest('id')
                ->get()
                ->map(fn (Model $item) => $this->adminPayload($item))
                ->all();
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = BlogPost::create($this->attributes($request));
        $this->syncCategoryAssignments($item, 'blog', $request->input('category_assignments', []));
        $this->flushAdminCache('blog-posts', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = BlogPost::query()->findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = BlogPost::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->syncCategoryAssignments($item, 'blog', $request->input('category_assignments', []));
        $this->flushAdminCache('blog-posts', $item->slug ?? null);

        return response()->json(['data' => $this->adminPayload($item->refresh()->load(['categoryAssignments.categoryType', 'categoryAssignments.categoryValue']))]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = BlogPost::query()->findOrFail($id);
        $identifier = $item->slug ?? (string) $id;
        $item->delete();
        $this->flushAdminCache('blog-posts', $identifier);

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Model $existing = null): array
    {
        $this->decodeJsonFields($request, ['content']);

        $rules = [
            'title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'excerpt' => ['sometimes', 'nullable', 'string'],
            'excerpt_en' => ['sometimes', 'nullable', 'string'],
            'excerpt_fr' => ['sometimes', 'nullable', 'string'],
            'excerpt_ar' => ['sometimes', 'nullable', 'string'],
            'date' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_en' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_fr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'image' => $request->hasFile('image') ? ['sometimes', 'nullable', 'image', 'max:10240'] : ['sometimes', 'nullable', 'string', 'max:2048'],
            'content' => ['sometimes', 'nullable', 'array'],
        ];

        $data = $request->validate($rules);
        $localized = fn (string $key, string $fallback = ''): array => $this->localized($data, $key, $fallback);
        $title = $localized('title');
        $slug = $existing->slug ?? Str::slug($title['en'] ?? 'post').'-'.Str::lower(Str::random(4));

        return [
            'slug' => $slug,
            'title' => $title,
            'category_key' => $data['category_key'] ?? $existing?->category_key,
            'excerpt' => $localized('excerpt', ''),
            'category' => $localized('category'),
            'image' => $this->handleMainImage($request, $existing?->image, 'uploads/blog_posts'),
            'content' => $this->blogContent($data, $existing, $localized('excerpt', '')),
            'date' => $data['date'] ?? now()->format('M d, Y'),
        ];
    }

    private function adminPayload(Model $item): array
    {
        $categoryAssignments = [];
        if ($item->relationLoaded('categoryAssignments')) {
            foreach ($item->categoryAssignments as $assignment) {
                $typeKey = $assignment->categoryType?->key;
                $valueKey = $assignment->categoryValue?->key;
                if ($typeKey && $valueKey) {
                    $categoryAssignments[$typeKey] = $valueKey;
                }
            }
        }

        return [
            'id' => (int) $item->id,
            'category_key' => $item->category_key,
            ...$this->flatLocalized('title', $item->title),
            ...$this->flatLocalized('excerpt', $item->excerpt),
            'date' => $item->date,
            ...$this->flatLocalized('category', $item->category),
            'category_assignments' => $categoryAssignments,
            'image' => $this->normalizeApiOutputPath($item->image),
            'content' => $this->blogContentFromItem($item),
        ];
    }

    private function blogContent(array $data, ?Model $existing, array $fallbackDescription): array
    {
        $existingContent = is_array($existing?->content) ? $existing->content : [];

        $body = data_get($data, 'content.body');
        if (! is_array($body)) {
            $body = $existingContent['body'] ?? $fallbackDescription;
        }

        $sections = data_get($data, 'content.sections');
        if (! is_array($sections)) {
            $sections = $existingContent['sections'] ?? [];
        }

        return ['body' => $this->localizedArray($body), 'sections' => array_values(array_filter(array_map(fn (mixed $section): ?array => $this->normalizeBlogSection($section), $sections)))];
    }

    private function blogContentFromItem(Model $item): array
    {
        $content = $item->content;
        if (is_string($content)) {
            return ['body' => $this->localizedArray($content), 'sections' => []];
        }

        if (! is_array($content)) {
            return ['body' => ['en' => '', 'fr' => '', 'ar' => ''], 'sections' => []];
        }

        if (array_key_exists('body', $content) || array_key_exists('sections', $content)) {
            $body = $content['body'] ?? [];
            $sections = is_array($content['sections'] ?? null) ? $content['sections'] : [];

            return ['body' => $this->localizedArray($body), 'sections' => array_values(array_filter(array_map(fn (mixed $section): ?array => $this->normalizeBlogSection($section), $sections)))];
        }

        return ['body' => $this->localizedArray($content), 'sections' => []];
    }

    private function localized(array $data, string $key, string $fallback = ''): array
    {
        $base = $data[$key] ?? $fallback;

        return ['fr' => $data[$key.'_fr'] ?? $base ?? '', 'ar' => $data[$key.'_ar'] ?? $base ?? '', 'en' => $data[$key.'_en'] ?? $base ?? ''];
    }

    private function localizedArray(array|string|null $value): array
    {
        if (is_string($value)) {
            return ['en' => $value, 'fr' => $value, 'ar' => $value];
        }
        if (! is_array($value)) {
            return ['en' => '', 'fr' => '', 'ar' => ''];
        }

        return ['en' => (string) ($value['en'] ?? ''), 'fr' => (string) ($value['fr'] ?? ''), 'ar' => (string) ($value['ar'] ?? '')];
    }

    private function flatLocalized(string $key, ?array $value): array
    {
        return [$key => $value['en'] ?? '', $key.'_fr' => $value['fr'] ?? '', $key.'_ar' => $value['ar'] ?? '', $key.'_en' => $value['en'] ?? ''];
    }

    private function normalizeBlogSection(mixed $section): ?array
    {
        if (! is_array($section)) {
            return null;
        }

        return ['id' => isset($section['id']) ? (string) $section['id'] : null, 'heading' => $this->localizedArray($section['heading'] ?? null), 'body' => $this->localizedArray($section['body'] ?? null)];
    }

    private function flushAdminCache(string $type, ?string $identifier = null): void
    {
        Cache::forget("admin.entity.{$type}");
        Cache::forget("entity.{$type}.index");
        if ($type === 'blog-posts') {
            Cache::forget('blog-posts.index');
        }
        if ($identifier !== null && $identifier !== '') {
            Cache::forget("entity.{$type}.{$identifier}");
            if ($type === 'blog-posts') {
                Cache::forget("blog-posts.{$identifier}");
            }
        }
    }

    private function syncCategoryAssignments(Model $entity, string $entityType, array $assignments): void
    {
        EntityCategoryAssignment::where('entity_type', $entityType)
            ->where('entity_id', $entity->id)
            ->delete();

        $firstValue = null;

        foreach ($assignments as $typeKey => $valueKey) {
            $type = CategoryType::where('entity_type', $entityType)->where('key', $typeKey)->first();
            if (! $type) {
                continue;
            }
            $value = $type->values()->where('key', $valueKey)->first();
            if (! $value) {
                continue;
            }

            EntityCategoryAssignment::create([
                'entity_type' => $entityType,
                'entity_id' => $entity->id,
                'category_type_id' => $type->id,
                'category_value_id' => $value->id,
            ]);

            if (! $firstValue) {
                $firstValue = $value;
            }
        }

        if ($firstValue && Schema::hasColumn('blog_posts', 'category_key')) {
            $entity->update([
                'category_key' => $firstValue->key,
                'category' => $firstValue->name,
            ]);
        }
    }
}
