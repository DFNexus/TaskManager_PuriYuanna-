<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChecklistItem extends Model
{
    protected $fillable = [
        'task_id', 'urutan', 'label', 'tipe', 'is_checked', 'catatan', 'foto_url'
    ];

    protected function casts(): array
    {
        return [
            'is_checked' => 'boolean',
            'urutan' => 'integer',
        ];
    }

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
