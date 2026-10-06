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
            'email' => 'required|string|email|max:255|unique:users,email',
            'role' => ['required', Rule::in(['Manager', 'SPV', 'Staff', 'Admin'])],
            'unit_id' => 'nullable|exists:units,id',
            'name' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        $validated['email'] = strtolower(trim($validated['email']));
        $validated['name'] = !empty($validated['name']) ? $validated['name'] : explode('@', $validated['email'])[0];

        // Staff password is set to null until staff completes Sign Up
        $validated['password'] = null;

        $user = User::create($validated);
        return response()->json(['message' => 'Email staf berhasil didaftarkan ke sistem', 'data' => $user], 201);
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

        if (isset($validated['email'])) {
            $validated['email'] = strtolower(trim($validated['email']));
        }

        // Admin only manages email, name, role, status, unit; password is not editable by admin
        $user->update($validated);
        return response()->json(['message' => 'Staff berhasil diupdate', 'data' => $user]);
    }

    public function resetRegistration(User $user)
    {
        $user->password = null;
        $user->save();
        return response()->json(['message' => 'Pendaftaran akun berhasil di-reset. Staf dapat melakukan Sign Up kembali untuk membuat password baru.']);
    }

    public function destroy(User $user)
    {
        $user->delete(); // Soft deletes
        return response()->json(['message' => 'Staff berhasil dinonaktifkan']);
    }
}
