<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware that enforces nav visibility on server-side for SPA routes.
 *
 * It maps known frontend paths to page keys and returns 404 for
 * guests/clients when a page is not enabled in the header AND not
 * present in any footer column. Admin users may still access disabled pages.
 */
class EnforceNavSettings
{
    /** Paths that should always behave as unpublished and never resolve. */
    protected const ALWAYS_404_PATHS = [
        'design-trip',
    ];

    /** Paths that must remain publicly accessible regardless of nav settings. */
    protected const ALWAYS_PUBLIC_PATHS = [
        'favorites',
    ];

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
        'privacy-policy' => 'privacy-policy',
        'purchase-policy' => 'purchase-policy',
        'favorites' => 'favorites',
        // 'design-trip' => 'design-trip',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $path = trim($request->path(), '/');

        foreach (self::ALWAYS_404_PATHS as $disabledPath) {
            if ($path === $disabledPath || str_starts_with($path, $disabledPath.'/')) {
                abort(404, __('messages.page_not_available'));
            }
        }

        // If this is the root or an API/auth asset route, allow through
        if ($path === '' || str_starts_with($path, 'api') || str_starts_with($path, '_next') || str_starts_with($path, 'assets')) {
            return $next($request);
        }

        // Find matching pageKey (exact match or starts with)
        $matchedKey = null;
        foreach (self::PATH_TO_PAGE as $href => $pageKey) {
            if ($path === $href || str_starts_with($path, $href.'/')) {
                $matchedKey = $pageKey;
                break;
            }
        }

        if ($matchedKey !== null && in_array($matchedKey, self::ALWAYS_PUBLIC_PATHS, true)) {
            return $next($request);
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
        if (! $navSettings) {
            return $next($request);
        }

        $user = $request->user();

        // Allow only admin to access disabled pages.
        // Everyone else (guests and clients) must have the page enabled.
        if ($user && in_array($user->role ?? null, ['admin'], true)) {
            return $next($request);
        }

        // For guests and clients, check if page is enabled in header or footer
        $headerEntries = $navSettings['header'] ?? [];
        $footerColumns = $navSettings['footer'] ?? [];

        $isInHeader = false;
        foreach ($headerEntries as $entry) {
            if (($entry['pageKey'] ?? null) === $matchedKey && ($entry['enabled'] ?? false)) {
                $isInHeader = true;
                break;
            }
        }

        $isInFooter = false;
        foreach ($footerColumns as $column) {
            if (in_array($matchedKey, $column['pageKeys'] ?? [], true)) {
                $isInFooter = true;
                break;
            }
        }

        if (! $isInHeader && ! $isInFooter) {
            abort(404, __('messages.page_not_available'));
        }

        return $next($request);
    }
}
