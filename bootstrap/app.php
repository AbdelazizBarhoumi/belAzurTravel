<?php

use App\Http\Middleware\BlockDirectApiAccess;
use App\Http\Middleware\CheckNavPageEnabled;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RoleMiddleware;
use App\Http\Middleware\SetApplicationLocale;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        __DIR__.'/../app/Console/Commands',
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->trustProxies(at: '*');
        $middleware->web(prepend: [SetApplicationLocale::class]);
        $middleware->api(prepend: [SetApplicationLocale::class]);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'check-nav-page' => CheckNavPageEnabled::class,
            'block-direct-api' => BlockDirectApiAccess::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            '/browser-log',
            '/api/*',
            '/api/site-settings',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['error' => __('messages.unauthenticated')], 401);
            }

            return redirect()->guest(route('login'));
        });
    })->create();
