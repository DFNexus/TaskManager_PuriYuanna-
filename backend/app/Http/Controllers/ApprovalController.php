<?php

namespace App\Http\Controllers;

use App\Models\TaskReport;
use App\Models\ApprovalLog;
use App\Models\User;
use App\Notifications\TaskNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
    public function index(Request $request)
    {
        $query = TaskReport::with([
            'task:id,judul,deskripsi,kategori,prioritas,deadline,assigned_to,status,unit_id',
            'task.assignedTo:id,name,role',
            'task.checklistItems',
            'task.unit:id,nama,tipe',
            'submittedBy:id,name,role',
            'approvalLogs.user:id,name,role',
        ])->whereIn('id', TaskReport::selectRaw('MAX(id)')->groupBy('task_id'));

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($outer) use ($search) {
                $outer->whereHas('task', function ($q) use ($search) {
                    $q->where('judul', 'like', "%{$search}%");
                })->orWhereHas('submittedBy', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            });
        }

        $reports = $query->orderBy('submitted_at', 'desc')->get();

        return response()->json($reports);
    }

    public function show(TaskReport $report)
    {
        return response()->json($report->load([
            'task:id,judul,deskripsi,kategori,prioritas,deadline,assigned_to,status,unit_id',
            'task.assignedTo:id,name,role',
            'task.checklistItems',
            'task.unit:id,nama,tipe',
            'submittedBy:id,name,role',
            'approvalLogs.user:id,name,role',
        ]));
    }

    public function approve(Request $request, TaskReport $report)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'catatan' => 'nullable|string',
        ]);

        $approvedReport = DB::transaction(function () use ($report, $user, $validated) {
            $wasRevised = $report->approvalLogs()->where('action', 'reject')->exists();

            $report->update(['status' => 'approved']);
            $report->task->update(['status' => 'done']);

            ApprovalLog::create([
                'report_id' => $report->id,
                'action' => 'approve',
                'by_user_id' => $user->id,
                'catatan' => $validated['catatan'] ?? ($wasRevised ? 'Revisi laporan disetujui.' : 'Laporan disetujui.'),
            ]);

            // Notify Staff who submitted the report
            $report->submittedBy->notify(new TaskNotification([
                'title' => $wasRevised ? 'Revisi Tugas Disetujui' : 'Laporan Tugas Disetujui',
                'message' => $wasRevised
                    ? "Hasil revisi tugas '{$report->task->judul}' telah disetujui oleh {$user->name} ({$user->role})."
                    : "Laporan tugas '{$report->task->judul}' telah disetujui oleh {$user->name} ({$user->role}).",
                'task_id' => $report->task_id,
                'report_id' => $report->id,
                'type' => 'report_approved',
            ]));

            // If approved by SPV, also notify Manager/Admin
            if ($user->role === 'SPV') {
                $managers = User::whereIn('role', ['Manager', 'Admin'])->get();
                foreach ($managers as $mgr) {
                    $mgr->notify(new TaskNotification([
                        'title' => $wasRevised ? 'Revisi Disetujui SPV' : 'Laporan Disetujui SPV',
                        'message' => "Supervisor {$user->name} telah menyetujui tugas '{$report->task->judul}'.",
                        'task_id' => $report->task_id,
                        'report_id' => $report->id,
                        'type' => 'report_approved',
                    ]));
                }
            }

            return $report;
        });

        return response()->json([
            'message' => 'Laporan tugas berhasil disetujui',
            'report' => $approvedReport->fresh([
                'task:id,judul,deskripsi,kategori,prioritas,deadline,assigned_to,status,unit_id',
                'task.assignedTo:id,name,role',
                'task.checklistItems',
                'task.unit:id,nama,tipe',
                'submittedBy:id,name,role',
                'approvalLogs.user:id,name,role',
            ])
        ]);
    }

    public function reject(Request $request, TaskReport $report)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'catatan' => 'required|string',
        ]);

        $rejectedReport = DB::transaction(function () use ($report, $user, $validated) {
            $report->update(['status' => 'rejected']);
            $report->task->update(['status' => 'rejected']);

            ApprovalLog::create([
                'report_id' => $report->id,
                'action' => 'reject',
                'by_user_id' => $user->id,
                'catatan' => $validated['catatan'],
            ]);

            // Notify Staff with rejection details
            $report->submittedBy->notify(new TaskNotification([
                'title' => 'Laporan Tugas Perlu Revisi',
                'message' => "Laporan '{$report->task->judul}' ditolak oleh {$user->name} ({$user->role}): {$validated['catatan']}",
                'task_id' => $report->task_id,
                'report_id' => $report->id,
                'type' => 'report_rejected',
            ]));

            return $report;
        });

        return response()->json([
            'message' => 'Laporan tugas berhasil ditolak dan diminta revisi',
            'report' => $rejectedReport->fresh([
                'task:id,judul,deskripsi,kategori,prioritas,deadline,assigned_to,status,unit_id',
                'task.assignedTo:id,name,role',
                'task.checklistItems',
                'task.unit:id,nama,tipe',
                'submittedBy:id,name,role',
                'approvalLogs.user:id,name,role',
            ])
        ]);
    }
}
