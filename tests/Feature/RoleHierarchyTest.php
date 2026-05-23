<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleHierarchyTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_access_admin_routes()
    {
        $owner = User::factory()->create([
            'role' => 'owner',
            'active' => true,
        ]);

        $response = $this->actingAs($owner)->get('/admin/dashboard');
        $response->assertStatus(200);
    }

    public function test_superadmin_can_access_admin_routes()
    {
        $superadmin = User::factory()->create([
            'role' => 'superadmin',
            'active' => true,
        ]);

        $response = $this->actingAs($superadmin)->get('/admin/dashboard');
        $response->assertStatus(200);
    }

    public function test_owner_can_access_site_settings()
    {
        $owner = User::factory()->create(['role' => 'owner', 'active' => true]);

        // SiteSettings show is public, but update is restricted
        $response = $this->actingAs($owner)->putJson('/api/site-settings', []);
        // Should not be 403. It might be 422 if data is missing, but not 403.
        $this->assertNotEquals(403, $response->status());
    }

    public function test_superadmin_can_access_site_settings()
    {
        $superadmin = User::factory()->create(['role' => 'superadmin', 'active' => true]);

        $response = $this->actingAs($superadmin)->putJson('/api/site-settings', []);
        $this->assertNotEquals(403, $response->status());
    }

    public function test_admin_cannot_access_site_settings()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);

        $response = $this->actingAs($admin)->putJson('/api/site-settings', []);
        $response->assertStatus(403);
    }

    public function test_owner_does_not_need_email_verification()
    {
        $owner = User::factory()->create([
            'role' => 'owner',
            'active' => true,
            'email_verified_at' => null,
        ]);

        $this->assertTrue($owner->hasVerifiedEmail());
    }

    public function test_admin_needs_email_verification()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
            'email_verified_at' => null,
        ]);

        $this->assertFalse($admin->hasVerifiedEmail());
    }

    public function test_owner_can_manage_superadmins()
    {
        $owner = User::factory()->create(['role' => 'owner', 'active' => true]);
        $superadmin = User::factory()->create(['role' => 'superadmin', 'active' => true]);

        $response = $this->actingAs($owner)->putJson("/api/admin/users/{$superadmin->id}", [
            'name' => 'Updated Super',
            'role' => 'admin',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('admin', $superadmin->refresh()->role);
    }

    public function test_superadmin_cannot_manage_other_superadmins()
    {
        $super1 = User::factory()->create(['role' => 'superadmin', 'active' => true]);
        $super2 = User::factory()->create(['role' => 'superadmin', 'active' => true]);

        $response = $this->actingAs($super1)->putJson("/api/admin/users/{$super2->id}", [
            'name' => 'Attempt',
        ]);

        $response->assertStatus(403);
    }

    public function test_superadmin_can_promote_client_to_admin()
    {
        $super = User::factory()->create(['role' => 'superadmin', 'active' => true]);
        $client = User::factory()->create(['role' => 'client', 'active' => true]);

        $response = $this->actingAs($super)->putJson("/api/admin/users/{$client->id}", [
            'role' => 'admin',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('admin', $client->refresh()->role);
    }

    public function test_owner_cannot_change_own_role_via_admin_users_endpoint()
    {
        $owner = User::factory()->create(['role' => 'owner', 'active' => true]);

        $response = $this->actingAs($owner)->putJson("/api/admin/users/{$owner->id}", [
            'role' => 'admin',
        ]);

        $response->assertStatus(403);
        $this->assertEquals('owner', $owner->refresh()->role);
    }

    public function test_admin_cannot_toggle_self_active_status()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$admin->id}/toggle-active");

        $response->assertStatus(403);
        $this->assertTrue($admin->refresh()->active);
    }

    public function test_superadmin_cannot_delete_self()
    {
        $superadmin = User::factory()->create(['role' => 'superadmin', 'active' => true]);

        $response = $this->actingAs($superadmin)->deleteJson("/api/admin/users/{$superadmin->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $superadmin->id]);
    }
}
