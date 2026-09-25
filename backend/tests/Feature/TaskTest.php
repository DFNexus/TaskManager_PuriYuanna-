<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Unit;
use App\Models\Task;
use App\Models\ChecklistItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    protected $manager;
    protected $staff1;
    protected $staff2;
    protected $unit;

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
    }

    public function test_manager_can_create_task_with_checklist_items()
    {
        $token = JWTAuth::fromUser($this->manager);

        $payload = [
            'judul' => 'Pembersihan Kamar 101',
            'deskripsi' => 'Bersihkan sprei dan kamar mandi',
            'kategori' => 'Housekeeping',
            'prioritas' => 'high',
            'deadline' => now()->addDays(1)->toDateTimeString(),
            'assigned_to' => $this->staff1->id,
            'checklist_items' => [
                ['label' => 'Ganti sprei dan sarung bantal', 'tipe' => 'required', 'urutan' => 0],
                ['label' => 'Sikat lantai kamar mandi', 'tipe' => 'required', 'urutan' => 1],
                ['label' => 'Semprot pengharum ruangan', 'tipe' => 'optional', 'urutan' => 2],
            ]
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/tasks', $payload);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message',
                     'data' => [
                         'id',
                         'judul',
                         'kategori',
                         'prioritas',
                         'assigned_to',
                         'created_by',
                         'checklist_items' => [
                             '*' => ['id', 'task_id', 'label', 'tipe', 'is_checked']
                         ]
                     ]
                 ]);

        $this->assertDatabaseHas('tasks', [
            'judul' => 'Pembersihan Kamar 101',
            'assigned_to' => $this->staff1->id,
            'created_by' => $this->manager->id,
            'status' => 'pending',
        ]);

        $this->assertDatabaseCount('checklist_items', 3);
    }

    public function test_staff_cannot_create_task()
    {
        $token = JWTAuth::fromUser($this->staff1);

        $payload = [
            'judul' => 'Task Ilegal oleh Staff',
            'kategori' => 'Housekeeping',
            'prioritas' => 'low',
            'deadline' => now()->addDays(1)->toDateTimeString(),
            'assigned_to' => $this->staff1->id,
        ];

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/tasks', $payload);

        $response->assertStatus(403);
    }

    public function test_staff_only_sees_assigned_tasks()
    {
        // Create 2 tasks, one for staff1 and one for staff2
        Task::create([
            'judul' => 'Tugas Staff 1',
            'kategori' => 'Housekeeping',
            'prioritas' => 'medium',
            'deadline' => now()->addDays(1),
            'assigned_to' => $this->staff1->id,
            'status' => 'pending',
            'created_by' => $this->manager->id,
        ]);

        Task::create([
            'judul' => 'Tugas Staff 2',
            'kategori' => 'Maintenance',
            'prioritas' => 'high',
            'deadline' => now()->addDays(2),
            'assigned_to' => $this->staff2->id,
            'status' => 'pending',
            'created_by' => $this->manager->id,
        ]);

        $token = JWTAuth::fromUser($this->staff1);

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->getJson('/api/tasks');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('Tugas Staff 1', $data[0]['judul']);
    }

    public function test_manager_can_reassign_task()
    {
        $task = Task::create([
            'judul' => 'Tugas Awal',
            'kategori' => 'Housekeeping',
            'prioritas' => 'medium',
            'deadline' => now()->addDays(1),
            'assigned_to' => $this->staff1->id,
            'status' => 'pending',
            'created_by' => $this->manager->id,
        ]);

        $token = JWTAuth::fromUser($this->manager);

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->patchJson("/api/tasks/{$task->id}/assign", [
                             'assigned_to' => $this->staff2->id,
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.assigned_to.id', $this->staff2->id);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'assigned_to' => $this->staff2->id,
        ]);
    }
}
