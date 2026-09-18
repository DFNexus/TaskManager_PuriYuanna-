<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskReport extends Model
{
    protected $fillable = [
        'task_id', 'submitted_by', 'submitted_at', 'status', 'catatan_staff'
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approvalLogs()
    {
        return $this->hasMany(ApprovalLog::class, 'report_id');
    }
}
