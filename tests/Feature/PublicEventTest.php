<?php

namespace Tests\Feature;

use App\Models\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_can_list_events(): void
    {
        Event::factory()->count(3)->create();

        $response = $this->getJson('/api/events');

        $response->assertOk()
            ->assertJsonCount(3);
    }

    public function test_public_can_view_event_details(): void
    {
        $event = Event::factory()->create([
            'title' => ['en' => 'Test Event', 'fr' => 'Test Event', 'ar' => 'Test Event'],
        ]);

        $response = $this->getJson('/api/events/' . $event->slug);

        $response->assertOk()
            ->assertJsonPath('slug', $event->slug)
            ->assertJsonPath('title.en', 'Test Event');
    }
}
