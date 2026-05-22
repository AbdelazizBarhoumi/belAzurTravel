<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        if ($request->wantsJson()) {
            return response()->json([
                'token' => null,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
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
