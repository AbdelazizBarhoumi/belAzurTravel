<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginResponseTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_response_includes_email_verified_at_for_verified_user(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('secret-pass'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'secret-pass',
            'remember' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.email_verified_at', $user->email_verified_at?->toISOString());
    }

    public function test_login_response_includes_null_email_verified_at_for_unverified_user(): void
    {
        $user = User::factory()->unverified()->create([
            'password' => bcrypt('secret-pass'),
            'role' => 'client',
        ]);

        $response = $this->postJson('/login', [
            'email' => $user->email,
            'password' => 'secret-pass',
            'remember' => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.email_verified_at', null);
    }
}
