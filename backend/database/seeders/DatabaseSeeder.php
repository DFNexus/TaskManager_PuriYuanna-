<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $unitGH = Unit::firstOrCreate(
            ['nama' => 'Puri Yuanna Guest House'],
            ['tipe' => 'GH', 'alamat' => 'Lantai 1']
        );

        $unitKost = Unit::firstOrCreate(
            ['nama' => 'Puri Yuanna Kost'],
            ['tipe' => 'Kost', 'alamat' => 'Lantai Atas']
        );

        User::firstOrCreate(
            ['email' => 'admin@puriyuanna.com'],
            [
                'name' => 'Admin Utama',
                'password' => Hash::make('password'),
                'role' => 'Admin',
                'unit_id' => $unitGH->id
            ]
        );

        User::firstOrCreate(
            ['email' => 'manager@puriyuanna.com'],
            [
                'name' => 'Manager Operasional',
                'password' => Hash::make('password'),
                'role' => 'Manager',
                'unit_id' => $unitGH->id
            ]
        );

        User::firstOrCreate(
            ['email' => 'spv@puriyuanna.com'],
            [
                'name' => 'Supervisor Kost',
                'password' => Hash::make('password'),
                'role' => 'SPV',
                'unit_id' => $unitKost->id
            ]
        );

        User::firstOrCreate(
            ['email' => 'staff@puriyuanna.com'],
            [
                'name' => 'Staff GH',
                'password' => Hash::make('password'),
                'role' => 'Staff',
                'unit_id' => $unitGH->id
            ]
        );
    }
}
