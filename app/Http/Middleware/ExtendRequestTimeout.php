<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Extends PHP's per-request execution limit for OS-TRAVEL admin routes that
 * make synchronous provider HTTP calls (live price probes, per-hotel approve,
 * bulk refresh). A slow provider or a multi-chunk probe can otherwise blow
 * past the default 30s `max_execution_time` mid-curl and abort the request.
 *
 * Usage in routes:
 *   Route::post('/admin/os-travel/...', [...])->middleware('extend-timeout');
 */
class ExtendRequestTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        set_time_limit(300);

        return $next($request);
    }
}
