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
        $unitGH = Unit::create([
            'nama' => 'Puri Yuanna Guest House',
            'tipe' => 'GH',
            'alamat' => 'Lantai 1'
        ]);

        $unitKost = Unit::create([
            'nama' => 'Puri Yuanna Kost',
            'tipe' => 'Kost',
            'alamat' => 'Lantai Atas'
        ]);

        User::create([
            'name' => 'Admin Utama',
            'email' => 'admin@puriyuanna.com',
            'password' => Hash::make('password'),
            'role' => 'Admin',
            'unit_id' => $unitGH->id
        ]);

        User::create([
            'name' => 'Manager Operasional',
            'email' => 'manager@puriyuanna.com',
            'password' => Hash::make('password'),
            'role' => 'Manager',
            'unit_id' => $unitGH->id
        ]);

        User::create([
            'name' => 'Supervisor Kost',
            'email' => 'spv@puriyuanna.com',
            'password' => Hash::make('password'),
            'role' => 'SPV',
            'unit_id' => $unitKost->id
        ]);

        User::create([
            'name' => 'Staff GH',
            'email' => 'staff@puriyuanna.com',
            'password' => Hash::make('password'),
            'role' => 'Staff',
            'unit_id' => $unitGH->id
        ]);
    }
}
