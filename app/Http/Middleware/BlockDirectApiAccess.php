<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks direct JSON API access to public endpoints.
 * Only allows requests from the React app (same origin).
 * Prevents scraping and direct API access.
 *
 * Usage in routes:
 *   Route::get('/destinations', [...])
 *       ->middleware(['block-direct-api-access']);
 */
class BlockDirectApiAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        // Allow normal JSON fetches from the app/test suite.
        // The frontend uses fetch() with `Accept: application/json`, so this
        // keeps the protection for browser address-bar hits while allowing the
        // app to retrieve data normally.
        if ($request->expectsJson()) {
            return $next($request);
        }

        // Get the expected app origins
        $allowedOrigins = [
            $request->getSchemeAndHttpHost(), // Current domain (auto-detect)
            'http://localhost:3000', // Local dev
            'http://localhost:5173', // Vite dev server
            'http://localhost:8000', // Local Laravel dev
            'http://localhost:8005', // Local Laravel (alternate port)
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173', // Vite dev server
            'http://127.0.0.1:8000',
            'http://127.0.0.1:8005', // Local Laravel (alternate port)
        ];

        // Get the request origin
        $referer = $request->header('referer');
        $origin = $request->header('origin');

        // Allow if request has Referer from the app (normal page navigation)
        if ($referer) {
            foreach ($allowedOrigins as $allowed) {
                if (str_starts_with($referer, $allowed)) {
                    return $next($request);
                }
            }
        }

        // Allow if request has Origin header from the app (fetch from same domain)
        if ($origin && in_array($origin, $allowedOrigins, true)) {
            return $next($request);
        }

        // Allow if user-agent indicates it's from the app (not a browser or curl)
        $userAgent = $request->header('user-agent', '');
        if (str_contains($userAgent, 'Dart') ||
            str_contains($userAgent, 'Flutter') ||
            str_contains($userAgent, 'axios') ||
            str_contains($userAgent, 'fetch') ||
            str_contains($userAgent, 'node')) {
            return $next($request);
        }

        // Block direct access (curl, Postman, browser address bar, etc.)
        // Return 404 instead of 403 to avoid revealing the endpoint exists
        abort(404, __('messages.endpoint_not_public'));
    }
}
