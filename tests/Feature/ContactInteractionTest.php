<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ContactInteractionNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ContactInteractionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_trigger_contact_interaction_notification(): void
    {
        Notification::fake();

        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);

        $response = $this->postJson('/api/interactions/notify', [
            'type' => 'call',
            'page' => '/hotels/bali-resort',
        ]);

        $response->assertStatus(200);

        Notification::assertSentTo(
            $admin,
            ContactInteractionNotification::class
        );
    }

    public function test_authenticated_user_includes_their_info_in_notification(): void
    {
        Notification::fake();

        $user = User::factory()->create(['role' => 'client']);
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);

        $response = $this->actingAs($user)->postJson('/api/interactions/notify', [
            'type' => 'whatsapp',
            'page' => '/tours/safari-adventure',
        ]);

        $response->assertStatus(200);

        Notification::assertSentTo(
            $admin,
            ContactInteractionNotification::class
        );
    }
}
