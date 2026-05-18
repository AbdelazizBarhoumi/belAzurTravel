<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SiteSetting;

/**
 * Middleware that enforces nav visibility on server-side for SPA routes.
 *
 * It maps known frontend paths to page keys and returns 404 only for
 * authenticated client users when a page has been disabled in site settings.
 * Admin and assistant users may still access disabled pages.
 */
class EnforceNavSettings
{
    /** Map known frontend href (without leading slash) to pageKey */
    protected const PATH_TO_PAGE = [
        'destinations' => 'destinations',
        'hotels' => 'hotels',
        'tours' => 'tours',
        'deals' => 'deals',
        'gallery' => 'gallery',
        'events' => 'events',
        'blog' => 'blog',
        'cars' => 'cars',
        'flights' => 'flights',
        'promos' => 'promos',
        'team' => 'team',
        'contact' => 'contact',
        'legal' => 'legal',
        'favorites' => 'favorites',
        'design-trip' => 'design-trip',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $path = trim($request->path(), '/');

        // If this is the root or an API/auth asset route, allow through
        if ($path === '' || str_starts_with($path, 'api') || str_starts_with($path, '_next') || str_starts_with($path, 'assets')) {
            return $next($request);
        }

        // Find matching pageKey (exact match or starts with)
        $matchedKey = null;
        foreach (self::PATH_TO_PAGE as $href => $pageKey) {
            if ($path === $href || str_starts_with($path, $href . '/')) {
                $matchedKey = $pageKey;
                break;
            }
        }

        // If no mapped page, allow.
        if ($matchedKey === null) {
            return $next($request);
        }

        $siteSettings = cache()->remember('site_settings_nav', now()->addHours(6), function () {
            return SiteSetting::first();
        });

        $navSettings = $siteSettings?->content['nav']['settings'] ?? null;

        // If no nav settings defined, allow (use defaults on frontend)
        if (!$navSettings) {
            return $next($request);
        }

        $user = $request->user();

        // Allow only admin and assistant to access disabled pages.
        // Everyone else (guests and clients) must have the page enabled.
        if ($user && in_array($user->role ?? null, ['admin', 'assistant'], true)) {
            return $next($request);
        }

        // For guests and clients, check if page is enabled in header (visibility control)
        $headerEntries = $navSettings['header'] ?? [];

        $isEnabled = false;
        foreach ($headerEntries as $entry) {
            if (($entry['pageKey'] ?? null) === $matchedKey && ($entry['enabled'] ?? false)) {
                $isEnabled = true;
                break;
            }
        }

        if (!$isEnabled) {
            abort(404, 'This page is not currently available.');
        }

        return $next($request);
    }
}

