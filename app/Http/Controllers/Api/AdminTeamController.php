<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminTeamController extends Controller
{
    use HandlesAdminMedia;

    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.team', now()->addMinutes(5), function () {
            return Team::all()->map(fn ($member) => $this->adminPayload($member));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Team::create($this->attributes($request));
        $this->flushAdminCache();

        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Team::query()->findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Team::query()->findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushAdminCache();

        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Team::query()->findOrFail($id);
        $item->delete();
        $this->flushAdminCache();

        return response()->json(['message' => __('messages.deleted')]);
    }

    private function attributes(Request $request, ?Team $item = null): array
    {
        $rules = [
            'name_en' => 'nullable|string',
            'name_fr' => 'required|string',
            'name_ar' => 'nullable|string',
            'role_en' => 'nullable|string',
            'role_fr' => 'required|string',
            'role_ar' => 'nullable|string',
            'bio_en' => 'nullable|string',
            'bio_fr' => 'required|string',
            'bio_ar' => 'nullable|string',
            'linkedin' => 'nullable|url',
            'twitter' => 'nullable|url',
            'email' => 'nullable|email',
        ];

        // If creating or updating without existing image, image is required
        if (! $item || ! $item->image_path) {
            $rules['image'] = ['required'];
        }

        try {
            $data = $request->validate($rules);
        } catch (ValidationException $e) {
            Log::error('Team validation failed', ['errors' => $e->errors(), 'input' => $request->all()]);
            throw $e;
        }

        $imagePath = $this->handleMainImage($request, $item?->image_path, 'uploads/teams');

        return [
            'name' => ['en' => $data['name_en'], 'fr' => $data['name_fr'], 'ar' => $data['name_ar']],
            'role' => ['en' => $data['role_en'], 'fr' => $data['role_fr'], 'ar' => $data['role_ar']],
            'bio' => ['en' => $data['bio_en'], 'fr' => $data['bio_fr'], 'ar' => $data['bio_ar']],
            'image_path' => $imagePath,
            'linkedin' => $data['linkedin'] ?? null,
            'twitter' => $data['twitter'] ?? null,
            'email' => $data['email'] ?? null,
        ];
    }

    private function adminPayload(Team $item): array
    {
        return [
            'id' => (int) $item->id,
            'name' => $item->name['en'] ?? '',
            'name_en' => $item->name['en'] ?? '',
            'name_fr' => $item->name['fr'] ?? '',
            'name_ar' => $item->name['ar'] ?? '',
            'role' => $item->role['en'] ?? '',
            'role_en' => $item->role['en'] ?? '',
            'role_fr' => $item->role['fr'] ?? '',
            'role_ar' => $item->role['ar'] ?? '',
            'bio' => $item->bio['en'] ?? '',
            'bio_en' => $item->bio['en'] ?? '',
            'bio_fr' => $item->bio['fr'] ?? '',
            'bio_ar' => $item->bio['ar'] ?? '',
            'image' => $this->normalizeApiOutputPath($item->image_path),
            'linkedin' => $item->linkedin,
            'twitter' => $item->twitter,
            'email' => $item->email,
        ];
    }

    private function flushAdminCache(): void
    {
        Cache::forget('admin.entity.team');
        Cache::forget('team'); // Public endpoint cache
    }
}
