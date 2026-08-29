<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetApplicationLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = ['fr'];

        $locale = $request->getPreferredLanguage($supportedLocales)
            ?? config('app.fallback_locale', config('app.locale', 'en'));

        if (! in_array($locale, $supportedLocales, true)) {
            $locale = config('app.fallback_locale', config('app.locale', 'en'));
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
