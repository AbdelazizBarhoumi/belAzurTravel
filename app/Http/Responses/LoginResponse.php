<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        if ($request->wantsJson()) {
            // A page that required login (e.g. an email verification link)
            // stored its URL; hand the same-site path back to the SPA.
            $intended = $request->session()->pull('url.intended');
            $redirect = null;
            if (is_string($intended) && str_starts_with($intended, rtrim((string) config('app.url'), '/').'/')) {
                $redirect = '/'.ltrim(substr($intended, strlen(rtrim((string) config('app.url'), '/'))), '/');
            }

            return response()->json([
                'token' => null,
                'redirect' => $redirect,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at?->toISOString(),
                    'preferred_language' => $user->preferred_language,
                ],
            ]);
        }

        return redirect()->intended(match ($user->role) {
            'admin' => '/admin/dashboard',
            'assistant' => '/unauthorized',
            default => '/dashboard',
        });
    }
}
