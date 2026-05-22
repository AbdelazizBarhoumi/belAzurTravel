<?php

namespace Tests\Feature\Api;

use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\SupportInquiryNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationPollingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_poll_unread_notifications_count(): void
    {
        $user = User::factory()->create();

        // Initially zero
        $this->actingAs($user)
            ->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJson(['count' => 0]);

        // Add a notification
        $user->notify(new SupportInquiryNotification(
            SupportInquiry::create([
                'user_id' => $user->id,
                'subject' => ['en' => 'Test Subject'],
                'message' => ['en' => 'Test Message'],
                'status' => 'new',
                'priority' => 'medium',
                'client' => ['name' => $user->name, 'email' => $user->email],
            ])
        ));

        // Now it should be 1
        $this->actingAs($user)
            ->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJson(['count' => 1]);
    }

    public function test_user_can_poll_notifications_list(): void
    {
        $user = User::factory()->create();

        $user->notify(new SupportInquiryNotification(
            SupportInquiry::create([
                'user_id' => $user->id,
                'subject' => ['en' => 'Test Subject'],
                'message' => ['en' => 'Test Message'],
                'status' => 'new',
                'priority' => 'medium',
                'client' => ['name' => $user->name, 'email' => $user->email],
            ])
        ));

        $this->actingAs($user)
            ->getJson('/api/notifications?limit=10')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.data.en', 'New support message from '.$user->name);
    }

    public function test_user_can_poll_notifications_summary_with_count(): void
    {
        $user = User::factory()->create();

        $user->notify(new SupportInquiryNotification(
            SupportInquiry::create([
                'user_id' => $user->id,
                'subject' => ['en' => 'Test Subject'],
                'message' => ['en' => 'Test Message'],
                'status' => 'new',
                'priority' => 'medium',
                'client' => ['name' => $user->name, 'email' => $user->email],
            ])
        ));

        $this->actingAs($user)
            ->getJson('/api/notifications?limit=10&include_count=1')
            ->assertOk()
            ->assertJsonPath('count', 1)
            ->assertJsonPath('notifications.0.data.en', 'New support message from '.$user->name);
    }

    public function test_guest_cannot_poll_notifications(): void
    {
        $this->getJson('/api/notifications/unread-count')->assertStatus(401);
        $this->getJson('/api/notifications')->assertStatus(401);
    }
}
