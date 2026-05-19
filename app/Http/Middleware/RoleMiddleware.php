<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->active) {
            abort(response()->json(['error' => 'Unauthenticated'], 401));
        }

        // Admin can access everything
        if ($user->role === 'admin') {
            return $next($request);
        }

        if (! in_array($user->role, $roles, true)) {
            abort(response()->json(['error' => 'Forbidden'], 403));
        }

        return $next($request);
    }
}
