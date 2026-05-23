<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTeamTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_crud_team_with_localized_data(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'active' => true,
        ]);

        $payload = [
            'name_en' => 'John Doe',
            'name_fr' => 'Jean Dupont',
            'name_ar' => 'جون دو',
            'role_en' => 'Developer',
            'role_fr' => 'Développeur',
            'role_ar' => 'مطور',
            'bio_en' => 'Bio EN',
            'bio_fr' => 'Bio FR',
            'bio_ar' => 'سيرة ذاتية AR',
            'email' => 'john@example.com',
            'image' => '/images/team-member.jpg',
        ];

        // Create
        $created = $this->actingAs($admin)
            ->withoutMiddleware()
            ->postJson('/api/admin/team', $payload)
            ->assertCreated()
            ->json('data');

        $this->assertEquals('John Doe', $created['name_en']);
        $this->assertEquals('Jean Dupont', $created['name_fr']);
        $this->assertEquals('جون دو', $created['name_ar']);

        // Read
        $this->actingAs($admin)
            ->getJson('/api/admin/team')
            ->assertOk()
            ->assertJsonFragment(['id' => $created['id'], 'name_en' => 'John Doe', 'name_fr' => 'Jean Dupont']);

        // Update
        $payload['name_en'] = 'John Smith';
        $this->actingAs($admin)
            ->withoutMiddleware()
            ->putJson('/api/admin/team/'.$created['id'], $payload)
            ->assertOk()
            ->assertJsonPath('data.name_en', 'John Smith');
    }
}
