<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_redirected_to_login_for_admin_routes()
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_admin_can_access_admin_routes()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_guest_redirected_to_login_for_client_routes()
    {
        $this->get('/client/dashboard')->assertRedirect('/login');
    }

    public function test_client_can_access_client_routes()
    {
        $client = User::factory()->create([
            'role' => 'client',
            'active' => true,
        ]);

        $this->actingAs($client)->get('/client/dashboard')->assertStatus(200);
    }

    public function test_unauthorized_user_forbidden_from_admin()
    {
        $client = User::factory()->create([
            'role' => 'client',
            'active' => true,
        ]);

        $this->actingAs($client)->get('/admin/dashboard')->assertStatus(403);
    }
}
