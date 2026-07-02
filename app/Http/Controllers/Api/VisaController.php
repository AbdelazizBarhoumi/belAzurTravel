<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Visa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VisaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $lang = $request->header('Accept-Language', 'fr');
        $lang = in_array($lang, ['en', 'fr', 'ar']) ? $lang : 'fr';

        $data = Cache::remember("visas.public.{$lang}", now()->addMinutes(3), function () use ($lang) {
            return Visa::where('is_active', true)
                ->orderBy('sort_order')
                ->get()
                ->map(fn ($visa) => [
                    'id' => (int) $visa->id,
                    'code' => $visa->code,
                    'name' => $visa->name[$lang] ?? $visa->name['en'] ?? '',
                    'flag' => $visa->flag,
                    'region' => $visa->region[$lang] ?? $visa->region['en'] ?? '',
                    'processing' => $visa->processing[$lang] ?? $visa->processing['en'] ?? '',
                    'price' => $visa->price,
                ]);
        });

        return response()->json(['data' => $data]);
    }
}
