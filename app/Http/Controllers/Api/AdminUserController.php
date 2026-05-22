<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role') && $request->get('role') !== 'all') {
            $query->where('role', $request->get('role'));
        }

        $users = $query->oldest('id')->paginate($request->get('per_page', 10));

        return response()->json([
            'data' => collect($users->items())->map(fn (User $user) => $this->payload($user)),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
            ],
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'Forbidden: Users cannot manage themselves'], 403);
        }

        $levels = [
            'owner' => 4,
            'superadmin' => 3,
            'admin' => 2,
            'assistant' => 1,
            'client' => 0,
        ];

        $currentLevel = $levels[$currentUser->role] ?? -1;
        $targetLevel = $levels[$user->role] ?? -1;

        // Cannot edit someone of higher or equal rank unless you are the owner (who can't edit themselves here but can edit others)
        // Actually, owner should be able to edit anyone except maybe other owners if they existed.
        if ($currentLevel <= $targetLevel && $currentUser->id !== $user->id && $currentUser->role !== 'owner') {
            return response()->json(['message' => 'Forbidden: Cannot edit users with higher or equal rank'], 403);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['sometimes', 'required', 'in:client,assistant,admin,superadmin,owner'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['role'])) {
            $newRoleLevel = $levels[$data['role']] ?? -1;

            // Only owner can create/remove superadmins
            if (($data['role'] === 'superadmin' || $user->role === 'superadmin') && $currentUser->role !== 'owner') {
                return response()->json(['message' => 'Forbidden: Only owner can manage superadmins'], 403);
            }

            // Only superadmin and owner can promote to admin
            if ($newRoleLevel >= 2 && $currentLevel < 3) {
                return response()->json(['message' => 'Forbidden: Only superadmin or owner can promote to admin'], 403);
            }
            
            // Cannot promote someone to a level equal or higher than yourself (unless owner)
            if ($newRoleLevel >= $currentLevel && $currentUser->role !== 'owner') {
                return response()->json(['message' => 'Forbidden: Cannot promote user to your rank or higher'], 403);
            }
        }

        $user->update($data);

        return response()->json($this->payload($user->refresh()));
    }

    public function toggleActive(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'Forbidden: Users cannot manage themselves'], 403);
        }

        $levels = [
            'owner' => 4,
            'superadmin' => 3,
            'admin' => 2,
            'assistant' => 1,
            'client' => 0,
        ];

        if (($levels[$currentUser->role] ?? -1) <= ($levels[$user->role] ?? -1) && $currentUser->role !== 'owner') {
            return response()->json(['message' => 'Forbidden: Cannot toggle users with higher or equal rank'], 403);
        }

        $user->update(['active' => ! $user->active]);

        return response()->json($this->payload($user->refresh()));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser->id === $user->id) {
            return response()->json(['message' => 'Forbidden: Users cannot manage themselves'], 403);
        }

        $levels = [
            'owner' => 4,
            'superadmin' => 3,
            'admin' => 2,
            'assistant' => 1,
            'client' => 0,
        ];

        if (($levels[$currentUser->role] ?? -1) <= ($levels[$user->role] ?? -1) && $currentUser->role !== 'owner') {
            return response()->json(['message' => 'Forbidden: Cannot delete users with higher or equal rank'], 403);
        }

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
