<?php

namespace Tests\Feature;

use App\Models\ChecklistItem;
use App\Models\Task;
use App\Models\TaskReport;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class TaskRevisionAndChecklistDescriptionTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(User $user): array
    {
        $this->app['auth']->forgetGuards();
        foreach (['tymon.jwt', 'tymon.jwt.auth', 'tymon.jwt.parser'] as $binding) {
            if ($this->app->bound($binding)) {
                $this->app->forgetInstance($binding);
            }
        }
        $token = JWTAuth::fromUser($user);
        $this->actingAs($user, 'api');

        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

    public function test_spv_can_create_and_update_per_item_checklist_deskripsi(): void
    {
        $unit = Unit::create([
            'nama' => 'Puri Yuanna Guest House',
            'tipe' => 'GH',
            'alamat' => 'Jl. Contoh No. 1',
        ]);

        $spv = User::create([
            'name' => 'Budi Supervisor',
            'email' => 'spv@puriyuanna.com',
            'password' => 'password123',
            'role' => 'SPV',
            'unit_id' => $unit->id,
            'status' => 'active',
        ]);

        $staff = User::create([
            'name' => 'Siti Staff',
            'email' => 'staff@puriyuanna.com',
            'password' => 'password123',
            'role' => 'Staff',
            'unit_id' => $unit->id,
            'status' => 'active',
        ]);

        $createRes = $this->withHeaders($this->authHeaders($spv))->postJson('/api/tasks', [
            'judul' => 'Pembersihan Kamar 201',
            'deskripsi' => 'Persiapan check-in tamu VIP',
            'kategori' => 'Housekeeping',
            'prioritas' => 'high',
            'deadline' => now()->addDay()->toIso8601String(),
            'assigned_to' => $staff->id,
            'unit_id' => $unit->id,
            'checklist_items' => [
                [
                    'label' => 'Ganti Sprei Kasur',
                    'deskripsi' => 'Gunakan sprei putih bersih ukuran King dan rapikan sudut lipatan.',
                    'tipe' => 'required',
                ],
                [
                    'label' => 'Cek Amenities Kamar Mandi',
                    'deskripsi' => 'Pastikan sabun, sampo, dan 2 handuk bersih tersedia.',
                    'tipe' => 'optional',
                ],
            ],
        ]);

        $createRes->assertCreated();
        $taskId = $createRes->json('data.id');
        $firstItemId = $createRes->json('data.checklist_items.0.id');

        $this->assertEquals(
            'Gunakan sprei putih bersih ukuran King dan rapikan sudut lipatan.',
            $createRes->json('data.checklist_items.0.deskripsi')
        );
        $this->assertDatabaseHas('checklist_items', [
            'id' => $firstItemId,
            'label' => 'Ganti Sprei Kasur',
            'deskripsi' => 'Gunakan sprei putih bersih ukuran King dan rapikan sudut lipatan.',
        ]);

        // Update existing item deskripsi & add a new item
        $updateRes = $this->withHeaders($this->authHeaders($spv))->putJson("/api/tasks/{$taskId}", [
            'checklist_items' => [
                [
                    'id' => $firstItemId,
                    'label' => 'Ganti Sprei Kasur',
                    'deskripsi' => 'Gunakan sprei putih bersih ukuran King + sarung bantal baru.',
                    'tipe' => 'required',
                ],
                [
                    'label' => 'Semprot Pengharum Ruangan',
                    'deskripsi' => 'Gunakan aroma lemongrass 2 semprotan.',
                    'tipe' => 'optional',
                ],
            ],
        ]);

        $updateRes->assertOk();

        // Staff reads task detail and sees updated per-item deskripsi
        $staffShowRes = $this->withHeaders($this->authHeaders($staff))->getJson("/api/tasks/{$taskId}");
        $staffShowRes->assertOk();
        $this->assertEquals(
            'Gunakan sprei putih bersih ukuran King + sarung bantal baru.',
            $staffShowRes->json('checklist_items.0.deskripsi')
        );
        $this->assertEquals(
            'Gunakan aroma lemongrass 2 semprotan.',
            $staffShowRes->json('checklist_items.1.deskripsi')
        );
    }

    public function test_resubmitted_revised_task_leaves_rejected_tab_and_preserves_approval_logs(): void
    {
        $spv = User::create([
            'name' => 'Rina SPV',
            'email' => 'rina.spv@puriyuanna.com',
            'password' => 'password123',
            'role' => 'SPV',
            'status' => 'active',
        ]);

        $manager = User::create([
            'name' => 'Andi Manager',
            'email' => 'andi.mgr@puriyuanna.com',
            'password' => 'password123',
            'role' => 'Manager',
            'status' => 'active',
        ]);

        $staff = User::create([
            'name' => 'Doni Staff',
            'email' => 'doni.staff@puriyuanna.com',
            'password' => 'password123',
            'role' => 'Staff',
            'status' => 'active',
        ]);

        $task = Task::create([
            'judul' => 'Pembersihan Area Lobby',
            'deskripsi' => 'Bersihkan lantai dan kaca lobby utama',
            'kategori' => 'Housekeeping',
            'prioritas' => 'medium',
            'deadline' => now()->addDay(),
            'assigned_to' => $staff->id,
            'created_by' => $spv->id,
            'status' => 'pending',
        ]);

        $item = ChecklistItem::create([
            'task_id' => $task->id,
            'label' => 'Pel lantai lobby',
            'deskripsi' => 'Gunakan cairan pembersih lantai anti-slip',
            'tipe' => 'required',
            'is_checked' => false,
            'urutan' => 0,
        ]);

        // 1. Staff checks item and submits report #1
        $this->withHeaders($this->authHeaders($staff))
            ->patchJson("/api/checklist-items/{$item->id}", ['is_checked' => true])
            ->assertOk();

        $submit1 = $this->withHeaders($this->authHeaders($staff))
            ->postJson("/api/tasks/{$task->id}/submit-report", ['catatan_staff' => 'Sudah dipel']);
        $submit1->assertOk();
        $reportId = $submit1->json('report.id');

        // 2. SPV rejects report (Revision #1)
        $this->withHeaders($this->authHeaders($spv))
            ->postJson("/api/reports/{$reportId}/reject", ['catatan' => 'Lantai sudut dekat pintu masih basah'])
            ->assertOk();

        $rejectedList1 = $this->withHeaders($this->authHeaders($spv))
            ->getJson('/api/reports?status=rejected');
        $rejectedList1->assertOk()->assertJsonCount(1);

        // 3. Staff fixes issue and re-submits report
        $submit2 = $this->withHeaders($this->authHeaders($staff))
            ->postJson("/api/tasks/{$task->id}/submit-report", ['catatan_staff' => 'Sudah dikeringkan']);
        $submit2->assertOk();
        $this->assertEquals($reportId, $submit2->json('report.id'));
        $this->assertEquals(1, TaskReport::where('task_id', $task->id)->count());

        // CRITICAL: Must NO LONGER appear in "Perlu Revisi" (status=rejected)
        $rejectedAfterResubmit = $this->withHeaders($this->authHeaders($spv))
            ->getJson('/api/reports?status=rejected');
        $rejectedAfterResubmit->assertOk()->assertJsonCount(0);

        // Appears in "Menunggu Review" (status=pending) with 1 prior reject log preserved
        $pendingAfterResubmit = $this->withHeaders($this->authHeaders($spv))
            ->getJson('/api/reports?status=pending');
        $pendingAfterResubmit->assertOk()->assertJsonCount(1);
        $this->assertCount(1, $pendingAfterResubmit->json('0.approval_logs'));
        $this->assertEquals('reject', $pendingAfterResubmit->json('0.approval_logs.0.action'));
        $this->assertEquals('Rina SPV', $pendingAfterResubmit->json('0.approval_logs.0.user.name'));

        // 4. Manager requests a 2nd revision, Staff resubmits, then Manager approves
        $this->withHeaders($this->authHeaders($manager))
            ->postJson("/api/reports/{$reportId}/reject", ['catatan' => 'Kaca pintu belum dilap'])
            ->assertOk();

        $this->withHeaders($this->authHeaders($staff))
            ->postJson("/api/tasks/{$task->id}/submit-report", ['catatan_staff' => 'Kaca sudah dilap bersih'])
            ->assertOk();

        $this->withHeaders($this->authHeaders($manager))
            ->postJson("/api/reports/{$reportId}/approve", ['catatan' => 'Revisi rapi, disetujui'])
            ->assertOk();

        // Rejected tab is empty, Approved tab has the 1 report with 2 reject logs + 1 approve log
        $this->withHeaders($this->authHeaders($spv))
            ->getJson('/api/reports?status=rejected')
            ->assertOk()
            ->assertJsonCount(0);

        $approvedList = $this->withHeaders($this->authHeaders($spv))
            ->getJson('/api/reports?status=approved');
        $approvedList->assertOk()->assertJsonCount(1);
        $logs = $approvedList->json('0.approval_logs');
        $this->assertCount(3, $logs);
        $this->assertEquals('reject', $logs[0]['action']);
        $this->assertEquals('Rina SPV', $logs[0]['user']['name']);
        $this->assertEquals('reject', $logs[1]['action']);
        $this->assertEquals('Andi Manager', $logs[1]['user']['name']);
        $this->assertEquals('approve', $logs[2]['action']);
        $this->assertEquals('Andi Manager', $logs[2]['user']['name']);
        $this->assertEquals('Manager', $logs[2]['user']['role']);

        // Tasks endpoint also includes reports.approval_logs for card display
        $tasksRes = $this->withHeaders($this->authHeaders($spv))->getJson('/api/tasks');
        $tasksRes->assertOk();
        $this->assertCount(3, $tasksRes->json('0.reports.0.approval_logs'));
    }
}
