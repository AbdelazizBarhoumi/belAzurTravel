<?php

namespace Tests\Feature\Api;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TeamControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_public_team_members_can_be_retrieved(): void
    {
        Team::create([
            'name' => ['en' => 'Test Member'],
            'role' => ['en' => 'Developer'],
            'bio' => ['en' => 'Test bio'],
            'image_path' => '/storage/uploads/teams/test-member.jpg',
        ]);

        $response = $this->getJson('/api/team');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.name.en', 'Test Member')
            ->assertJsonPath('0.image', '/storage/uploads/teams/test-member.jpg');
    }

    public function test_admin_can_list_team_members(): void
    {
        Team::factory()->create();

        $response = $this->actingAs($this->admin)->getJson('/api/admin/team');

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'name', 'role', 'bio', 'image']]]);
    }

    public function test_admin_can_create_team_member(): void
    {
        Storage::fake('public');
        // Use a text file with .jpg extension to pass validation as "image"
        $file = UploadedFile::fake()->create('member.jpg', 100);

        $response = $this->actingAs($this->admin)->postJson('/api/admin/team', [
            'name_en' => 'New', 'name_fr' => 'Nouveau', 'name_ar' => 'جديد',
            'role_en' => 'Dev', 'role_fr' => 'Dev', 'role_ar' => 'مطور',
            'bio_en' => 'Bio', 'bio_fr' => 'Bio', 'bio_ar' => 'سيرة',
            'image' => $file,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('teams', ['image_path' => '/storage/uploads/teams/'.$file->hashName()]);
        $this->assertTrue(Storage::disk('public')->exists('uploads/teams/'.$file->hashName()));
    }

    public function test_admin_can_update_team_member_without_new_image(): void
    {
        Storage::fake('public');
        $team = Team::factory()->create();

        $response = $this->actingAs($this->admin)->putJson('/api/admin/team/'.$team->id, [
            'name_en' => 'Updated', 'name_fr' => 'Mis à jour', 'name_ar' => 'محدث',
            'role_en' => 'Lead', 'role_fr' => 'Lead', 'role_ar' => 'قائد',
            'bio_en' => 'Bio', 'bio_fr' => 'Bio', 'bio_ar' => 'سيرة',
            'image_path' => $team->image_path,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('teams', [
            'id' => $team->id,
            'image_path' => $team->image_path,
        ]);
    }

    public function test_admin_can_update_team_member_with_new_image(): void
    {
        Storage::fake('public');
        $team = Team::factory()->create();
        // Use raw file with .jpg extension to pass image validation without GD
        $newFile = UploadedFile::fake()->create('new.jpg', 100);

        $response = $this->actingAs($this->admin)->postJson('/api/admin/team/'.$team->id, [
            '_method' => 'PUT',
            'name_en' => 'Updated', 'name_fr' => 'Mis à jour', 'name_ar' => 'محدث',
            'role_en' => 'Lead', 'role_fr' => 'Lead', 'role_ar' => 'قائد',
            'bio_en' => 'Bio', 'bio_fr' => 'Bio', 'bio_ar' => 'سيرة',
            'image' => $newFile,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('teams', ['id' => $team->id, 'image_path' => '/storage/uploads/teams/'.$newFile->hashName()]);
        $this->assertTrue(Storage::disk('public')->exists('uploads/teams/'.$newFile->hashName()));
    }
}
