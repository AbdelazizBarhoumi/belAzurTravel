<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OsTravel\OsTravelImageProxy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Throwable;

class HotelImageController extends Controller
{
    /**
     * Stream a provider image through an opaque, encrypted token so the public
     * response and markup never expose the provider host.
     */
    public function show(Request $request, string $token)
    {
        $url = OsTravelImageProxy::resolve($token);

        if ($url === null) {
            abort(404);
        }

        try {
            $response = Http::timeout(15)->get($url);
        } catch (Throwable) {
            abort(404);
        }

        if (! $response->successful()) {
            abort(404);
        }

        return response($response->body(), 200)
            ->header('Content-Type', $response->header('Content-Type') ?: 'image/jpeg')
            ->header('Content-Length', (string) strlen($response->body()))
            ->header('Cache-Control', 'public, max-age=86400');
    }
}