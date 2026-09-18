<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChecklistItem extends Model
{
    protected $fillable = [
        'task_id', 'urutan', 'label', 'tipe', 'is_checked', 'catatan', 'foto_url'
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
