<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::with('unit')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => ['required', Rule::in(['Manager', 'SPV', 'Staff', 'Admin'])],
            'unit_id' => 'nullable|exists:units,id',
            'status' => 'required|in:active,inactive',
        ]);

        // Default password for new staff
        $validated['password'] = Hash::make('dsa');

        $user = User::create($validated);
        return response()->json(['message' => 'Staff berhasil ditambahkan', 'data' => $user], 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('unit'));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['sometimes', 'required', Rule::in(['Manager', 'SPV', 'Staff', 'Admin'])],
            'unit_id' => 'nullable|exists:units,id',
            'status' => 'sometimes|required|in:active,inactive',
        ]);

        // Admin only manages email, name, role, status, unit; password is not editable by admin
        $user->update($validated);
        return response()->json(['message' => 'Staff berhasil diupdate', 'data' => $user]);
    }

    public function destroy(User $user)
    {
        $user->delete(); // Soft deletes
        return response()->json(['message' => 'Staff berhasil dinonaktifkan']);
    }
}
