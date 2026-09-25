<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;

use App\Http\Controllers\TaskController;

Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:api')->group(function () {
    // Read tasks (Staff views their own, Manager/Admin/SPV views all)
    Route::get('tasks', [TaskController::class, 'index']);
    Route::get('tasks/{task}', [TaskController::class, 'show']);

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
