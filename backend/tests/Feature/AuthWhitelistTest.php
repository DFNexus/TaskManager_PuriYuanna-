<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthWhitelistTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_is_rejected_if_email_not_whitelisted(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Stranger',
            'email' => 'stranger@unknown.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Email belum terdaftar atau belum diberikan izin oleh Administrator. Silakan hubungi Admin.',
        ]);
    }

    public function test_whitelisted_user_can_register_and_create_password(): void
    {
        // Admin pre-registers user
        $user = User::create([
            'name' => 'Calon Staff',
            'email' => 'staff1@puriyuanna.com',
            'role' => 'Staff',
            'password' => null,
            'status' => 'active',
        ]);

        // Staff signs up
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Budi Santoso',
            'email' => 'staff1@puriyuanna.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure(['access_token', 'user']);

        // Check password is now hashed and saved
        $user->refresh();
        $this->assertNotNull($user->password);
        $this->assertEquals('Budi Santoso', $user->name);

        // Staff can now login
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'staff1@puriyuanna.com',
            'password' => 'password123',
        ]);
        $loginRes->assertStatus(200);
        $loginRes->assertJsonStructure(['access_token']);
    }

    public function test_cannot_register_twice_with_same_email(): void
    {
        // Pre-register and register
        User::create([
            'name' => 'Existing Staff',
            'email' => 'existing@puriyuanna.com',
            'role' => 'Staff',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Duplicate Attempt',
            'email' => 'existing@puriyuanna.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(409);
        $response->assertJsonFragment([
            'message' => 'Akun dengan email ini sudah terdaftar. Silakan langsung login dengan password Anda.',
        ]);
    }

    public function test_login_rejected_if_not_activated_yet(): void
    {
        User::create([
            'name' => 'Unregistered Staff',
            'email' => 'pending@puriyuanna.com',
            'role' => 'Staff',
            'password' => null,
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'pending@puriyuanna.com',
            'password' => 'randompass',
        ]);

        $response->assertStatus(400);
        $response->assertJsonFragment([
            'message' => 'Akun Anda belum diaktivasi. Silakan lakukan Sign Up terlebih dahulu untuk membuat password.',
        ]);
    }

    public function test_inactive_account_cannot_register(): void
    {
        User::create([
            'name' => 'Inactive Staff',
            'email' => 'inactive@puriyuanna.com',
            'role' => 'Staff',
            'password' => null,
            'status' => 'inactive',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Inactive Staff',
            'email' => 'inactive@puriyuanna.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Akun ini dinonaktifkan oleh Administrator. Silakan hubungi Admin.',
        ]);
    }

    public function test_admin_can_reset_staff_registration(): void
    {
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@puriyuanna.com',
            'role' => 'Admin',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $staff = User::create([
            'name' => 'Registered Staff',
            'email' => 'staff_active@puriyuanna.com',
            'role' => 'Staff',
            'password' => bcrypt('oldpassword'),
            'status' => 'active',
        ]);

        $this->assertTrue($staff->is_registered);

        $token = auth()->guard('api')->login($admin);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/users/{$staff->id}/reset-registration");

        $response->assertStatus(200);

        $staff->refresh();
        $this->assertNull($staff->password);
        $this->assertFalse($staff->is_registered);

        // Staff can now sign up again with new password
        $signupRes = $this->postJson('/api/auth/register', [
            'name' => 'Updated Staff Name',
            'email' => 'staff_active@puriyuanna.com',
            'password' => 'newpassword456',
            'password_confirmation' => 'newpassword456',
        ]);

        $signupRes->assertStatus(201);
        $staff->refresh();
        $this->assertNotNull($staff->password);
        $this->assertTrue($staff->is_registered);
    }

    public function test_manager_cannot_manage_or_reset_user_accounts(): void
    {
        $manager = User::create([
            'name' => 'General Manager',
            'email' => 'gm@puriyuanna.com',
            'role' => 'Manager',
            'password' => bcrypt('password123'),
            'status' => 'active',
        ]);

        $token = auth()->guard('api')->login($manager);

        // Manager attempts to create a user account
        $createRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/users', [
                'name' => 'New User',
                'email' => 'newuser@puriyuanna.com',
                'role' => 'Staff',
                'status' => 'active',
            ]);
        $createRes->assertStatus(403);

        // Manager attempts to reset a user registration
        $targetUser = User::create([
            'name' => 'Target User',
            'email' => 'target@puriyuanna.com',
            'role' => 'Staff',
            'password' => bcrypt('secret'),
            'status' => 'active',
        ]);

        $resetRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/users/{$targetUser->id}/reset-registration");
        $resetRes->assertStatus(403);
    }
}
