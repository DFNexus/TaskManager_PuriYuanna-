<?php

namespace App\Http\Controllers;

use App\Models\ChecklistItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ChecklistItemController extends Controller
{
    public function update(Request $request, ChecklistItem $checklistItem)
    {
        $user = Auth::user();
        $task = $checklistItem->task;

        // Check permission: assigned staff, SPV, Manager, or Admin
        if (strcasecmp($user->role, 'Staff') === 0 && (int)$task->assigned_to !== (int)$user->id) {
            return response()->json(['message' => 'Anda tidak memiliki hak akses untuk mengubah checklist ini.'], 403);
        }

        $validated = $request->validate([
            'is_checked' => 'sometimes|boolean',
            'catatan' => 'nullable|string',
        ]);

        if (array_key_exists('is_checked', $validated)) {
            $checklistItem->is_checked = (bool)$validated['is_checked'];
        }

        if (array_key_exists('catatan', $validated)) {
            $checklistItem->catatan = $validated['catatan'];
        }

        $checklistItem->save();

        // Auto-update task status to in_progress if still pending
        if ($task->status === 'pending') {
            $task->update(['status' => 'in_progress']);
        }

        return response()->json([
            'message' => 'Checklist item berhasil diperbarui',
            'data' => $checklistItem->fresh()
        ]);
    }

    public function uploadPhoto(Request $request, ChecklistItem $checklistItem)
    {
        $user = Auth::user();
        $task = $checklistItem->task;

        if (strcasecmp($user->role, 'Staff') === 0 && (int)$task->assigned_to !== (int)$user->id) {
            return response()->json(['message' => 'Anda tidak memiliki hak akses untuk mengunggah foto pada checklist ini.'], 403);
        }

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        // Delete old photo if exists
        if ($checklistItem->foto_url) {
            $oldPath = str_replace('/storage/', '', $checklistItem->foto_url);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('photo')->store('checklist_photos', 'public');
        $publicUrl = '/storage/' . $path;

        $checklistItem->update(['foto_url' => $publicUrl]);

        // Auto-update task status to in_progress if still pending
        if ($task->status === 'pending') {
            $task->update(['status' => 'in_progress']);
        }

        return response()->json([
            'message' => 'Foto bukti berhasil diunggah',
            'foto_url' => $publicUrl,
            'data' => $checklistItem->fresh()
        ]);
    }
}
