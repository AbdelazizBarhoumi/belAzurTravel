<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackendLocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_api_request_returns_french_message(): void
    {
        $this->putJson('/api/site-settings', [], ['Accept-Language' => 'fr'])
            ->assertStatus(401)
            ->assertJsonPath('error', 'Non authentifié');
    }

    public function test_login_validation_message_is_localized_in_french(): void
    {
        $this->postJson('/login', [
            'email' => 'missing@belazurtravel.com',
            'password' => 'wrong-password',
            'remember' => true,
        ], ['Accept-Language' => 'fr'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Ces identifiants ne correspondent pas à nos enregistrements.');
    }

    public function test_booking_validation_message_is_localized_in_french(): void
    {
        $user = User::factory()->create(['role' => 'client', 'active' => true]);

        $this->actingAs($user)
            ->postJson('/api/bookings', [
                'type' => 'destination',
                'item_slug' => 'any-destination',
                'client' => [
                    'name' => 'Jean Dupont',
                    'email' => 'jean@belazurtravel.com',
                ],
                'promo_code' => 'invalid-code',
                'amount' => 100,
            ], ['Accept-Language' => 'fr'])
            ->assertStatus(422)
            ->assertJsonPath('errors.promo_code.0', 'Code promo invalide.');
    }

    public function test_admin_self_delete_message_is_localized_in_arabic(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);

        $this->actingAs($admin)
            ->deleteJson('/api/admin/users/'.$admin->id, [], ['Accept-Language' => 'ar'])
            ->assertStatus(403)
            ->assertJsonPath('message', 'Interdit : les utilisateurs ne peuvent pas se gérer eux-mêmes');
    }

    public function test_site_settings_validation_message_is_localized_in_french(): void
    {
        $superadmin = User::factory()->create(['role' => 'superadmin', 'active' => true]);

        $this->actingAs($superadmin)
            ->putJson('/api/site-settings', [
                'content' => [
                    'contact' => [
                        'title' => ['en' => 'Title EN', 'fr' => 'Title FR'],
                    ],
                ],
            ], ['Accept-Language' => 'fr'])
            ->assertStatus(422)
            ->assertJsonPath('message', "Le contact 'title' doit fournir la traduction 'ar'.");
    }
}
