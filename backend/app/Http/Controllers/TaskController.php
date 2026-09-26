<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\ChecklistItem;
use App\Models\TaskReport;
use App\Models\User;
use App\Notifications\TaskNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Task::with([
            'assignedTo:id,name,role,email',
            'createdBy:id,name',
            'checklistItems'
        ]);

        // Staf can only see tasks assigned to them
        if ($user && $user->role === 'Staff') {
            $query->where('assigned_to', $user->id);
        } elseif ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('prioritas') && $request->prioritas !== 'all') {
            $query->where('prioritas', $request->prioritas);
        }

        if ($request->filled('kategori') && $request->kategori !== 'all') {
            $query->where('kategori', $request->kategori);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('judul', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'kategori' => 'required|string|max:100',
            'prioritas' => 'required|in:low,medium,high',
            'deadline' => 'required|date',
            'assigned_to' => 'required|exists:users,id',
            'is_recurring' => 'nullable|boolean',
            'checklist_items' => 'nullable|array',
            'checklist_items.*.label' => 'required|string|max:255',
            'checklist_items.*.tipe' => 'required|in:required,optional',
            'checklist_items.*.urutan' => 'nullable|integer',
        ]);

        $task = DB::transaction(function () use ($validated, $request) {
            $taskData = [
                'judul' => $validated['judul'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'kategori' => $validated['kategori'],
                'prioritas' => $validated['prioritas'],
                'deadline' => $validated['deadline'],
                'assigned_to' => $validated['assigned_to'],
                'status' => 'pending',
                'is_recurring' => $validated['is_recurring'] ?? false,
                'created_by' => Auth::id(),
            ];

            $newTask = Task::create($taskData);

            if (!empty($validated['checklist_items'])) {
                foreach ($validated['checklist_items'] as $index => $item) {
                    ChecklistItem::create([
                        'task_id' => $newTask->id,
                        'label' => $item['label'],
                        'tipe' => $item['tipe'] ?? 'required',
                        'urutan' => $item['urutan'] ?? $index,
                        'is_checked' => false,
                    ]);
                }
            }

            return $newTask;
        });

        // Notify assigned staff
        $assignedUser = User::find($task->assigned_to);
        if ($assignedUser) {
            $assignedUser->notify(new TaskNotification([
                'title' => 'Tugas Baru Ditugaskan',
                'message' => "Anda ditugaskan untuk '{$task->judul}'.",
                'task_id' => $task->id,
                'type' => 'task_assigned',
            ]));
        }

        return response()->json([
            'message' => 'Task berhasil dibuat',
            'data' => $task->load(['assignedTo:id,name,role,email', 'createdBy:id,name', 'checklistItems'])
        ], 201);
    }

    public function show(Task $task)
    {
        $user = Auth::user();
        if ($user && $user->role === 'Staff' && $task->assigned_to !== $user->id) {
            return response()->json(['message' => 'Unauthorized access to task'], 403);
        }

        return response()->json($task->load([
            'assignedTo:id,name,role,email',
            'createdBy:id,name',
            'checklistItems',
            'reports.approvalLogs.user:id,name,role',
            'reports.submittedBy:id,name',
        ]));
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'judul' => 'sometimes|required|string|max:255',
            'deskripsi' => 'nullable|string',
            'kategori' => 'sometimes|required|string|max:100',
            'prioritas' => 'sometimes|required|in:low,medium,high',
            'deadline' => 'sometimes|required|date',
            'assigned_to' => 'sometimes|required|exists:users,id',
            'status' => 'sometimes|required|in:pending,in_progress,waiting_approval,done,rejected',
            'checklist_items' => 'nullable|array',
            'checklist_items.*.label' => 'required|string|max:255',
            'checklist_items.*.tipe' => 'required|in:required,optional',
            'checklist_items.*.urutan' => 'nullable|integer',
        ]);

        DB::transaction(function () use ($validated, $task) {
            $task->update($validated);

            if (isset($validated['checklist_items'])) {
                // Remove existing items and insert updated ones
                $task->checklistItems()->delete();
                foreach ($validated['checklist_items'] as $index => $item) {
                    ChecklistItem::create([
                        'task_id' => $task->id,
                        'label' => $item['label'],
                        'tipe' => $item['tipe'] ?? 'required',
                        'urutan' => $item['urutan'] ?? $index,
                        'is_checked' => false,
                    ]);
                }
            }
        });

        return response()->json([
            'message' => 'Task berhasil diupdate',
            'data' => $task->fresh(['assignedTo:id,name,role,email', 'createdBy:id,name', 'checklistItems'])
        ]);
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task berhasil dihapus']);
    }

    public function assign(Request $request, Task $task)
    {
        $validated = $request->validate([
            'assigned_to' => 'required|exists:users,id',
        ]);

        $task->update(['assigned_to' => $validated['assigned_to']]);

        // Notify new assignee
        $newAssignee = User::find($validated['assigned_to']);
        if ($newAssignee) {
            $newAssignee->notify(new TaskNotification([
                'title' => 'Tugas Baru Ditugaskan',
                'message' => "Anda ditugaskan untuk '{$task->judul}'.",
                'task_id' => $task->id,
                'type' => 'task_assigned',
            ]));
        }

        return response()->json([
            'message' => 'Penugasan staff berhasil diperbarui',
            'data' => $task->load(['assignedTo:id,name,role,email', 'createdBy:id,name', 'checklistItems'])
        ]);
    }

    public function submitReport(Request $request, Task $task)
    {
        $user = Auth::user();

        // Check permission: assigned staff, Manager, or Admin
        if ($user->role === 'Staff' && $task->assigned_to !== $user->id) {
            return response()->json(['message' => 'Anda tidak memiliki hak akses untuk melaporkan task ini.'], 403);
        }

        // Verify all required checklist items are checked
        $uncompletedRequired = $task->checklistItems()
            ->where('tipe', 'required')
            ->where('is_checked', false)
            ->count();

        if ($uncompletedRequired > 0) {
            return response()->json([
                'message' => "Seluruh item checklist wajib harus diselesaikan sebelum mengirim laporan. Masih ada {$uncompletedRequired} item wajib yang belum selesai.",
                'uncompleted_count' => $uncompletedRequired
            ], 422);
        }

        $validated = $request->validate([
            'catatan_staff' => 'nullable|string',
        ]);

        $report = DB::transaction(function () use ($task, $user, $validated) {
            $newReport = TaskReport::create([
                'task_id' => $task->id,
                'submitted_by' => $user->id,
                'submitted_at' => now(),
                'status' => 'pending',
                'catatan_staff' => $validated['catatan_staff'] ?? null,
            ]);

            $task->update(['status' => 'waiting_approval']);

            // Notify SPV and Managers
            $reviewers = User::whereIn('role', ['SPV', 'Manager', 'Admin'])->get();
            foreach ($reviewers as $reviewer) {
                $reviewer->notify(new TaskNotification([
                    'title' => 'Laporan Tugas Masuk',
                    'message' => "Staff {$user->name} telah mengirim laporan untuk '{$task->judul}'.",
                    'task_id' => $task->id,
                    'report_id' => $newReport->id,
                    'type' => 'report_submitted',
                ]));
            }

            return $newReport;
        });

        return response()->json([
            'message' => 'Laporan penyelesaian tugas berhasil dikirim dan menunggu verifikasi supervisor.',
            'report' => $report,
            'task' => $task->fresh(['assignedTo:id,name,role,email', 'createdBy:id,name', 'checklistItems', 'reports'])
        ]);
    }
}
