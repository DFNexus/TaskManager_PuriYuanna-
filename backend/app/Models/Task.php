<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'judul', 'deskripsi', 'kategori', 'prioritas', 'deadline', 
        'assigned_to', 'unit_id', 'status', 'is_recurring', 'created_by'
    ];

    protected function casts(): array
    {
        return [
            'is_recurring' => 'boolean',
            'deadline' => 'datetime',
        ];
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function checklistItems()
    {
        return $this->hasMany(ChecklistItem::class)->orderBy('urutan', 'asc');
    }

    public function reports()
    {
        return $this->hasMany(TaskReport::class)
            ->orderBy('submitted_at', 'desc')
            ->orderBy('id', 'desc');
    }
}
