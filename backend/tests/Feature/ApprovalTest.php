<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Unit;
use App\Models\Task;
use App\Models\ChecklistItem;
use App\Models\TaskReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class ApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected $manager;
    protected $spv;
    protected $staff;
    protected $unit;
    protected $task;
    protected $report;

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

        $this->spv = User::create([
            'name' => 'SPV User',
            'email' => 'spv@puriyuanna.com',
            'password' => bcrypt('password123'),
            'role' => 'SPV',
            'unit_id' => $this->unit->id,
            'status' => 'active',
        ]);

        $this->staff = User::create([
            'name' => 'Staff User',
            'email' => 'staff@puriyuanna.com',
            'password' => bcrypt('password123'),
            'role' => 'Staff',
            'unit_id' => $this->unit->id,
            'status' => 'active',
        ]);

        $this->task = Task::create([
            'judul' => 'Pembersihan Kamar 105',
            'kategori' => 'Housekeeping',
            'prioritas' => 'high',
            'deadline' => now()->addDay(),
            'assigned_to' => $this->staff->id,
            'status' => 'waiting_approval',
            'created_by' => $this->manager->id,
        ]);

        ChecklistItem::create([
            'task_id' => $this->task->id,
            'label' => 'Sapu kamar',
            'tipe' => 'required',
            'is_checked' => true,
        ]);

        $this->report = TaskReport::create([
            'task_id' => $this->task->id,
            'submitted_by' => $this->staff->id,
            'submitted_at' => now(),
            'status' => 'pending',
            'catatan_staff' => 'Kamar sudah bersih dan rapi',
        ]);
    }

    public function test_spv_and_manager_can_list_submitted_reports()
    {
        $token = JWTAuth::fromUser($this->spv);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/reports');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.status', 'pending')
            ->assertJsonPath('0.task.judul', 'Pembersihan Kamar 105');
    }

    public function test_staff_cannot_access_reports_endpoint()
    {
        $token = JWTAuth::fromUser($this->staff);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/reports');

        $response->assertStatus(403);
    }

    public function test_spv_can_approve_report_and_status_changes_to_done_with_log_and_notification()
    {
        $token = JWTAuth::fromUser($this->spv);

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/reports/{$this->report->id}/approve", [
                'catatan' => 'Pekerjaan sangat rapi dan sesuai SOP.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('report.status', 'approved')
            ->assertJsonPath('report.task.status', 'done');

        $this->assertDatabaseHas('task_reports', [
            'id' => $this->report->id,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $this->task->id,
            'status' => 'done',
        ]);

        $this->assertDatabaseHas('approval_logs', [
            'report_id' => $this->report->id,
            'action' => 'approve',
            'by_user_id' => $this->spv->id,
            'catatan' => 'Pekerjaan sangat rapi dan sesuai SOP.',
        ]);

        // Verify notification sent to Staff
        $this->assertCount(1, $this->staff->notifications);
        $this->assertEquals('Laporan Tugas Disetujui', $this->staff->notifications->first()->data['title']);

        // Since SPV approved, manager should also receive a notification
        $this->assertCount(1, $this->manager->notifications);
    }

    public function test_spv_reject_requires_catatan_and_changes_status_to_rejected_with_notification()
    {
        $token = JWTAuth::fromUser($this->spv);

        // Reject without note should fail validation (422)
        $failResponse = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/reports/{$this->report->id}/reject", []);

        $failResponse->assertStatus(422)
            ->assertJsonValidationErrors(['catatan']);

        // Reject with note should succeed
        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson("/api/reports/{$this->report->id}/reject", [
                'catatan' => 'Kamar mandi belum disikat, tolong dibersihkan ulang.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('report.status', 'rejected')
            ->assertJsonPath('report.task.status', 'rejected');

        $this->assertDatabaseHas('task_reports', [
            'id' => $this->report->id,
            'status' => 'rejected',
        ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $this->task->id,
            'status' => 'rejected',
        ]);

        $this->assertDatabaseHas('approval_logs', [
            'report_id' => $this->report->id,
            'action' => 'reject',
            'by_user_id' => $this->spv->id,
            'catatan' => 'Kamar mandi belum disikat, tolong dibersihkan ulang.',
        ]);

        // Staff should receive rejection notification
        $this->assertCount(1, $this->staff->notifications);
        $this->assertEquals('Laporan Tugas Perlu Revisi', $this->staff->notifications->first()->data['title']);
    }

    public function test_user_can_view_and_mark_notifications_as_read()
    {
        // Give staff a notification
        $this->staff->notify(new \App\Notifications\TaskNotification([
            'title' => 'Test Notif',
            'message' => 'Pesan uji coba',
            'task_id' => $this->task->id,
            'type' => 'task_assigned',
        ]));

        $token = JWTAuth::fromUser($this->staff);

        // 1. Get notifications
        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonPath('unread_count', 1);

        $notifId = $response->json('notifications.0.id');

        // 2. Mark as read
        $markResponse = $this->withHeader('Authorization', "Bearer $token")
            ->patchJson("/api/notifications/{$notifId}/read");

        $markResponse->assertStatus(200);

        // 3. Verify unread count is now 0
        $finalResponse = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/notifications');

        $finalResponse->assertStatus(200)
            ->assertJsonPath('unread_count', 0);
    }
}
