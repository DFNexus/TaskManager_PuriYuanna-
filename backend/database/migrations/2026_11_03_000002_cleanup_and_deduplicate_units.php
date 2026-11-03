<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Trim names first to avoid invisible whitespace differences
        DB::table('units')->update([
            'nama' => DB::raw("TRIM(nama)"),
        ]);

        // Find duplicates grouped by nama and tipe
        $duplicates = DB::table('units')
            ->select('nama', 'tipe', DB::raw('COUNT(*) as total'))
            ->groupBy('nama', 'tipe')
            ->having(DB::raw('COUNT(*)'), '>', 1)
            ->get();

        foreach ($duplicates as $dup) {
            $units = DB::table('units')
                ->where('nama', $dup->nama)
                ->where('tipe', $dup->tipe)
                ->orderBy('id', 'asc')
                ->get();

            if ($units->count() > 1) {
                $canonicalId = $units->first()->id;
                $duplicateIds = $units->slice(1)->pluck('id')->toArray();

                // Re-link users table
                if (Schema::hasColumn('users', 'unit_id')) {
                    DB::table('users')
                        ->whereIn('unit_id', $duplicateIds)
                        ->update(['unit_id' => $canonicalId]);
                }

                // Re-link tasks table
                if (Schema::hasColumn('tasks', 'unit_id')) {
                    DB::table('tasks')
                        ->whereIn('unit_id', $duplicateIds)
                        ->update(['unit_id' => $canonicalId]);
                }

                // Delete duplicate unit records
                DB::table('units')
                    ->whereIn('id', $duplicateIds)
                    ->delete();
            }
        }

        // Add unique constraint so duplicates cannot be re-inserted
        Schema::table('units', function (Blueprint $table) {
            $table->unique(['nama', 'tipe'], 'units_nama_tipe_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropUnique('units_nama_tipe_unique');
        });
    }
};

