<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;

use App\Http\Controllers\TaskController;
use App\Http\Controllers\ChecklistItemController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\NotificationController;

Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:api')->group(function () {
    // In-App Notifications (All authenticated users)
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Read tasks (Staff views their own, Manager/Admin/SPV views all)
    Route::get('tasks', [TaskController::class, 'index']);
    Route::get('tasks/{task}', [TaskController::class, 'show']);

    // Task Execution & Reporting (Staff & Manager)
    Route::patch('checklist-items/{checklistItem}', [ChecklistItemController::class, 'update']);
    Route::post('checklist-items/{checklistItem}/photo', [ChecklistItemController::class, 'uploadPhoto']);
    Route::post('tasks/{task}/submit-report', [TaskController::class, 'submitReport']);

    // Approvals & Report Reviews (Manager, Admin, SPV)
    Route::middleware('role:Manager,Admin,SPV')->group(function () {
        Route::get('reports', [ApprovalController::class, 'index']);
        Route::get('reports/{report}', [ApprovalController::class, 'show']);
        Route::post('reports/{report}/approve', [ApprovalController::class, 'approve']);
        Route::post('reports/{report}/reject', [ApprovalController::class, 'reject']);
    });

    // Master data & Task management for Manager/Admin
    Route::middleware('role:Manager,Admin')->group(function () {
        Route::apiResource('units', UnitController::class);
        Route::apiResource('users', UserController::class);
        Route::post('tasks', [TaskController::class, 'store']);
        Route::match(['put', 'patch'], 'tasks/{task}', [TaskController::class, 'update']);
        Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
        Route::patch('tasks/{task}/assign', [TaskController::class, 'assign']);
    });
});
