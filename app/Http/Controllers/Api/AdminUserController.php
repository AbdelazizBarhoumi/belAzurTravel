<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::query()->oldest('id')->get()->map(fn (User $user) => $this->payload($user)));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['sometimes', 'required', 'in:client,admin,assistant'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $user->update($data);

        return response()->json($this->payload($user->refresh()));
    }

    public function toggleActive(User $user): JsonResponse
    {
        $user->update(['active' => ! $user->active]);

        return response()->json($this->payload($user->refresh()));
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(['message' => 'deleted']);
    }

    /** @return array<string, mixed> */
    private function payload(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'active' => $user->active,
            'joined' => $user->created_at?->toDateString(),
        ];
    }
}

