<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Consolidate multiple task_reports per task into the latest report
     * while preserving all historical approval_logs in chronological order.
     */
    public function up(): void
    {
        if (!Schema::hasTable('task_reports') || !Schema::hasTable('approval_logs')) {
            return;
        }

        $duplicateTaskIds = DB::table('task_reports')
            ->select('task_id')
            ->groupBy('task_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('task_id');

        foreach ($duplicateTaskIds as $taskId) {
            $reports = DB::table('task_reports')
                ->where('task_id', $taskId)
                ->orderByDesc('submitted_at')
                ->orderByDesc('id')
                ->get();

            $latestReport = $reports->first();
            if (!$latestReport) {
                continue;
            }

            $olderReportIds = $reports->slice(1)->pluck('id')->all();
            if (!empty($olderReportIds)) {
                DB::table('approval_logs')
                    ->whereIn('report_id', $olderReportIds)
                    ->update(['report_id' => $latestReport->id]);

                DB::table('task_reports')
                    ->whereIn('id', $olderReportIds)
                    ->delete();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Data consolidation is non-destructive to approval logs; nothing to revert.
    }
};

