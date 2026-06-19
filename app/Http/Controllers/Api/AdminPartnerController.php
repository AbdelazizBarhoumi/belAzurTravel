<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminPartnerController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.partner', now()->addMinutes(5), function () {
            return Partner::all()->map(fn ($partner) => $this->adminPayload($partner));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Partner::create($this->attributes($request));
        $this->flushAdminCache();

        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Partner::query()->findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Partner::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache();

        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Partner::query()->findOrFail($id);
        $item->delete();
        $this->flushAdminCache();

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Partner $item = null): array
    {
        $rules = [
            'name_en' => 'required|string',
            'name_fr' => 'required|string',
            'name_ar' => 'required|string',
            'description_en' => 'nullable|string',
            'description_fr' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'website' => 'nullable|url',
            'category' => 'nullable|string',
        ];

        if (! $item || ! $item->logo_path) {
            $rules['image'] = ['required'];
        }

        try {
            $data = $request->validate($rules);
        } catch (ValidationException $e) {
            Log::error('Partner validation failed', ['errors' => $e->errors(), 'input' => $request->all()]);
            throw $e;
        }

        $logoPath = $this->handleMainImage($request, $item?->logo_path, 'uploads/partners');

        return [
            'name' => ['en' => $data['name_en'], 'fr' => $data['name_fr'], 'ar' => $data['name_ar']],
            'description' => [
                'en' => $data['description_en'] ?? null,
                'fr' => $data['description_fr'] ?? null,
                'ar' => $data['description_ar'] ?? null,
            ],
            'website' => $data['website'] ?? null,
            'category' => $data['category'] ?? null,
            'logo_path' => $logoPath,
        ];
    }

    private function adminPayload(Partner $item): array
    {
        return [
            'id' => (int) $item->id,
            'name' => $item->name['en'] ?? '',
            'name_en' => $item->name['en'] ?? '',
            'name_fr' => $item->name['fr'] ?? '',
            'name_ar' => $item->name['ar'] ?? '',
            'description' => $item->description['en'] ?? '',
            'description_en' => $item->description['en'] ?? '',
            'description_fr' => $item->description['fr'] ?? '',
            'description_ar' => $item->description['ar'] ?? '',
            'website' => $item->website,
            'category' => $item->category,
            'image' => $this->normalizeApiOutputPath($item->logo_path),
        ];
    }

    private function flushAdminCache(): void
    {
        Cache::forget('admin.entity.partner');
        Cache::forget('partners');
    }
}
