<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'required|string|max:255',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $email = strtolower(trim($validated['email']));

        // Check if email has been whitelisted/pre-registered by Admin
        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'Email belum terdaftar atau belum diberikan izin oleh Administrator. Silakan hubungi Admin.',
            ], 403);
        }

        // Check if user already completed registration
        if (! empty($user->password)) {
            return response()->json([
                'message' => 'Akun dengan email ini sudah terdaftar. Silakan langsung login dengan password Anda.',
            ], 409);
        }

        // Check if account was marked inactive
        if ($user->status === 'inactive') {
            return response()->json([
                'message' => 'Akun ini dinonaktifkan oleh Administrator. Silakan hubungi Admin.',
            ], 403);
        }

        // Set user name and hashed password
        $user->name = $validated['name'];
        $user->password = Hash::make($validated['password']);
        $user->status = 'active';
        $user->save();

        // Automatically log in the user
        $token = auth()->guard('api')->login($user);

        return response()->json([
            'message' => 'Pendaftaran berhasil! Akun Anda telah aktif.',
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->guard('api')->factory()->getTTL() * 60,
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $email = strtolower(trim($credentials['email']));

        $user = User::where('email', $email)->first();

        if ($user && empty($user->password)) {
            return response()->json([
                'message' => 'Akun Anda belum diaktivasi. Silakan lakukan Sign Up terlebih dahulu untuk membuat password.'
            ], 400);
        }

        if ($user && $user->status === 'inactive') {
            return response()->json([
                'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.'
            ], 403);
        }

        if (! $token = auth()->guard('api')->attempt(['email' => $email, 'password' => $credentials['password']])) {
            return response()->json(['error' => 'Unauthorized', 'message' => 'Email atau password salah.'], 401);
        }

        return $this->respondWithToken($token);
    }

    public function me()
    {
        return response()->json(auth()->guard('api')->user());
    }

    public function logout()
    {
        auth()->guard('api')->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh()
    {
        return $this->respondWithToken(auth()->guard('api')->refresh());
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->guard('api')->factory()->getTTL() * 60,
            'user' => auth()->guard('api')->user()
        ]);
    }
}
