<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\SiteSetting;

/**
 * Middleware to check if a page is enabled in navigation settings.
 * 
 * Usage in routes:
 *   Route::get('/destinations', [...controller...])->middleware(['check-nav-page:destinations'])
 * 
 * If the page is not enabled, returns HTTP 404 (page hidden by admin).
 * 
 * Future Enhancement: Could also validate specific dropdown items by checking
 * query parameters (e.g., cat=Beach) against enabled dropdown items.
 */
class CheckNavPageEnabled
{
    /**
     * Valid page keys that can be protected.
     */
    protected const VALID_PAGES = [
        'destinations',
        'hotels',
        'tours',
        'deals',
        'gallery',
        'events',
        'blog',
        'cars',
        'flights',
        'promos',
        'team',
        'legal',
        'favorites',
        'design-trip',
    ];

    public function handle(Request $request, Closure $next, string $pageKey): Response
    {
        // Map route type to page key (e.g., 'blog-posts' → 'blog')
        $pageKey = $pageKey === 'blog-posts' ? 'blog' : $pageKey;

        // Validate page key
        if (!in_array($pageKey, self::VALID_PAGES, true)) {
            abort(404);
        }

        // Get site settings (cached for performance, but use fresh data on each request to avoid stale cache issues)
        $siteSettings = SiteSetting::first();

        // Check if page is enabled in header navigation
        $navSettings = $siteSettings?->content['nav']['settings'] ?? null;

        if (!$navSettings) {
            // No settings defined — allow access (use defaults)
            return $next($request);
        }

        $headerEntries = $navSettings['header'] ?? [];
        $pageEnabled = false;

        // Check if page is enabled in header (must have enabled=true)
        foreach ($headerEntries as $entry) {
            if ($entry['pageKey'] === $pageKey && ($entry['enabled'] ?? false)) {
                $pageEnabled = true;
                break;
            }
        }

        if (!$pageEnabled) {
            abort(404, 'This page is not currently available.');
        }

        return $next($request);
    }
}

