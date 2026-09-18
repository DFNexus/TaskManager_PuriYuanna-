<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalLog extends Model
{
    protected $fillable = [
        'report_id', 'action', 'by_user_id', 'catatan'
    ];

    public function report()
    {
        return $this->belongsTo(TaskReport::class, 'report_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'by_user_id');
    }
}
