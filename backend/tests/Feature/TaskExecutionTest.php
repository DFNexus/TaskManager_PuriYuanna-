<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Unit;
use App\Models\Task;
use App\Models\ChecklistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class TaskExecutionTest extends TestCase
{
    use RefreshDatabase;

    protected $manager;
    protected $staff1;
    protected $staff2;
    protected $unit;
    protected $task;
    protected $requiredItem1;
    protected $requiredItem2;
    protected $optionalItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->unit = Unit::create([
            'nama' => 'Puri Yuanna 1',
            'tipe' => 'GH',
            'alamat' => 'Jl. Kaliurang No. 12',
        ]);

        $this->manager = User::create([
            'name' => 'Manager User',
            'email' => 'manager@puriyuanna.com',
            'password' => bcrypt('password123'),
            'role' => 'Manager',
            'unit_id' => $this->unit->id,
            'status' => 'active',
        ]);

        $this->staff1 = User::create([
            'name' => 'Staff Satu',
            'email' => 'staff1@puriyuanna.com',
            'password' => bcrypt('password123'),
            'role' => 'Staff',
            'unit_id' => $this->unit->id,
            'status' => 'active',
        ]);

        $this->staff2 = User::create([
            'name' => 'Staff Dua',
            'email' => 'staff2@puriyuanna.com',
            'password' => bcrypt('password123'),
            'role' => 'Staff',
            'unit_id' => $this->unit->id,
            'status' => 'active',
        ]);

        $this->task = Task::create([
            'judul' => 'Pembersihan Kamar 201',
            'deskripsi' => 'Ganti sprei dan bersihkan toilet',
            'kategori' => 'Housekeeping',
            'prioritas' => 'high',
            'deadline' => now()->addDay(),
            'assigned_to' => $this->staff1->id,
            'status' => 'pending',
            'created_by' => $this->manager->id,
        ]);

        $this->requiredItem1 = ChecklistItem::create([
            'task_id' => $this->task->id,
            'label' => 'Ganti sprei',
            'tipe' => 'required',
            'urutan' => 0,
            'is_checked' => false,
        ]);

        $this->requiredItem2 = ChecklistItem::create([
            'task_id' => $this->task->id,
            'label' => 'Bersihkan toilet',
            'tipe' => 'required',
            'urutan' => 1,
            'is_checked' => false,
        ]);

        $this->optionalItem = ChecklistItem::create([
            'task_id' => $this->task->id,
            'label' => 'Semprot wewangian',
            'tipe' => 'optional',
            'urutan' => 2,
            'is_checked' => false,
        ]);
    }

    public function test_staff_can_check_checklist_item_and_task_transitions_to_in_progress()
    {
        $token = JWTAuth::fromUser($this->staff1);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->patchJson("/api/checklist-items/{$this->requiredItem1->id}", [
                'is_checked' => true,
                'catatan' => 'Sprei sudah diganti baru',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.is_checked', true)
            ->assertJsonPath('data.catatan', 'Sprei sudah diganti baru');

        $this->assertDatabaseHas('checklist_items', [
            'id' => $this->requiredItem1->id,
            'is_checked' => true,
        ]);

        // Task status should automatically transition to in_progress
        $this->assertDatabaseHas('tasks', [
            'id' => $this->task->id,
            'status' => 'in_progress',
        ]);
    }

    public function test_staff_cannot_update_checklist_item_of_another_staff()
    {
        $token = JWTAuth::fromUser($this->staff2);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->patchJson("/api/checklist-items/{$this->requiredItem1->id}", [
                'is_checked' => true,
            ]);

        $response->assertStatus(403);
    }

    public function test_staff_can_upload_photo_for_checklist_item()
    {
        Storage::fake('public');
        $token = JWTAuth::fromUser($this->staff1);

        $jpegContent = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');
        $file = UploadedFile::fake()->createWithContent('bukti_sprei.jpg', $jpegContent);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/checklist-items/{$this->requiredItem1->id}/photo", [
                'photo' => $file,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'foto_url', 'data']);

        $fotoUrl = $response->json('foto_url');
        $this->assertNotEmpty($fotoUrl);

        $storedPath = str_replace('/storage/', '', $fotoUrl);
        Storage::disk('public')->assertExists($storedPath);
    }

    public function test_staff_cannot_submit_report_if_required_checklist_is_uncompleted()
    {
        $token = JWTAuth::fromUser($this->staff1);

        // Only complete requiredItem1, leaving requiredItem2 false
        $this->requiredItem1->update(['is_checked' => true]);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/tasks/{$this->task->id}/submit-report", [
                'catatan_staff' => 'Sudah selesai sebagian',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('uncompleted_count', 1);

        $this->assertDatabaseMissing('task_reports', [
            'task_id' => $this->task->id,
        ]);
    }

    public function test_staff_can_submit_report_when_required_checklists_are_completed()
    {
        $token = JWTAuth::fromUser($this->staff1);

        // Complete all required items; optional item can be false
        $this->requiredItem1->update(['is_checked' => true]);
        $this->requiredItem2->update(['is_checked' => true]);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/tasks/{$this->task->id}/submit-report", [
                'catatan_staff' => 'Kamar 201 siap diinspeksi supervisor.',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'report', 'task'])
            ->assertJsonPath('task.status', 'waiting_approval');

        $this->assertDatabaseHas('task_reports', [
            'task_id' => $this->task->id,
            'submitted_by' => $this->staff1->id,
            'status' => 'pending',
            'catatan_staff' => 'Kamar 201 siap diinspeksi supervisor.',
        ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $this->task->id,
            'status' => 'waiting_approval',
        ]);
    }
}
