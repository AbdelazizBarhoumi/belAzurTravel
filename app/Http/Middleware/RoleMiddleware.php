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

        $levels = [
            'owner' => 4,
            'superadmin' => 3,
            'admin' => 2,
            'assistant' => 1,
            'client' => 0,
        ];

        $userLevel = $levels[$user->role] ?? -1;

        foreach ($roles as $role) {
            $requiredLevel = $levels[$role] ?? 999;
            if ($userLevel >= $requiredLevel) {
                return $next($request);
            }
        }

        abort(response()->json(['error' => 'Forbidden'], 403));
    }
}
