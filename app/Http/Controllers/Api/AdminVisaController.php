<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminVisaController extends Controller
{
    public function index(): JsonResponse
    {
        $data = Cache::remember('admin.entity.visa', now()->addMinutes(5), function () {
            return Visa::orderBy('sort_order')->get()->map(fn ($visa) => $this->adminPayload($visa));
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $item = Visa::create($this->attributes($request));
        $this->flushCache();

        return response()->json(['data' => $this->adminPayload($item)], 201);
    }

    public function show(int|string $id): JsonResponse
    {
        $item = Visa::findOrFail($id);

        return response()->json(['data' => $this->adminPayload($item)]);
    }

    public function update(Request $request, int|string $id): JsonResponse
    {
        $item = Visa::findOrFail($id);
        $item->update($this->attributes($request, $item));
        $this->flushCache();

        return response()->json(['data' => $this->adminPayload($item->refresh())]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $item = Visa::findOrFail($id);
        $item->delete();
        $this->flushCache();

        return response()->json(['message' => 'Visa deleted']);
    }

    private function attributes(Request $request, ?Visa $existing = null): array
    {
        $data = $request->validate([
            'code' => 'required|string|max:10|unique:visas,code,'.($existing?->id ?? ''),
            'name_en' => 'required|string|max:255',
            'name_fr' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'flag' => 'required|string|max:10',
            'processing_en' => 'nullable|string|max:255',
            'processing_fr' => 'nullable|string|max:255',
            'processing_ar' => 'nullable|string|max:255',
            'price' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        return [
            'code' => $data['code'],
            'name' => ['en' => $data['name_en'], 'fr' => $data['name_fr'], 'ar' => $data['name_ar']],
            'flag' => $data['flag'],
            'processing' => ['en' => $data['processing_en'] ?? '', 'fr' => $data['processing_fr'] ?? '', 'ar' => $data['processing_ar'] ?? ''],
            'price' => $data['price'],
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order'] ?? 0,
            'date_from' => $data['date_from'] ?? null,
            'date_to' => $data['date_to'] ?? null,
        ];
    }

    private function adminPayload(Visa $item): array
    {
        return [
            'id' => (int) $item->id,
            'code' => $item->code,
            'name' => $item->name['en'] ?? '',
            'name_en' => $item->name['en'] ?? '',
            'name_fr' => $item->name['fr'] ?? '',
            'name_ar' => $item->name['ar'] ?? '',
            'flag' => $item->flag,
            'processing' => $item->processing['en'] ?? '',
            'processing_en' => $item->processing['en'] ?? '',
            'processing_fr' => $item->processing['fr'] ?? '',
            'processing_ar' => $item->processing['ar'] ?? '',
            'price' => $item->price,
            'is_active' => $item->is_active,
            'sort_order' => $item->sort_order,
            'date_from' => $item->date_from,
            'date_to' => $item->date_to,
        ];
    }

    private function flushCache(): void
    {
        Cache::forget('admin.entity.visa');
        Cache::forget('visas.public');
    }
}
