<?php

use App\Http\Controllers\Api\UnlockAccountController;
use App\Http\Controllers\Api\UserManagementController;
use App\Http\Controllers\FirebaseAuthController;
use App\Http\Controllers\PhotoController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProblemeRoutierController;

Route::middleware('throttle:60,1')->group(function () {
    Route::post('/login', [FirebaseAuthController::class, 'login']);
    Route::post('/register', [FirebaseAuthController::class, 'register']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [FirebaseAuthController::class, 'logout']);
});

// Account management endpoints
Route::post('/unlock-account', [UnlockAccountController::class, 'unlock']);
Route::get('/account-status/{email}', [UnlockAccountController::class, 'status']);

// User management endpoints (pour les managers/admins)
Route::prefix('users')->group(function () {
    Route::get('/', [UserManagementController::class, 'index']);
    Route::get('/locked', [UserManagementController::class, 'locked']);
    Route::get('/stats', [UserManagementController::class, 'stats']);
    Route::get('/{id}', [UserManagementController::class, 'show']);
    Route::put('/{id}', [UserManagementController::class, 'update']);
    Route::delete('/{id}', [UserManagementController::class, 'destroy']);
});

Route::get('/problemes', [ProblemeRoutierController::class, 'index']);
Route::get('/dashboard', [ProblemeRoutierController::class, 'dashboard']);


Route::prefix('problemes')->group(function () {
    Route::get('/', [ProblemeRoutierController::class, 'index']);
    Route::post('/', [ProblemeRoutierController::class, 'store']);
    Route::get('/{id}', [ProblemeRoutierController::class, 'show']);
    Route::put('/{id}', [ProblemeRoutierController::class, 'update']);
    Route::delete('/{id}', [ProblemeRoutierController::class, 'destroy']);
    
    // Route pour vérifier l'existence par firebase_id
    Route::get('/check/{firebase_id}', [ProblemeRoutierController::class, 'checkExists']);
    
    // Routes pour les photos
    Route::get('/{id_probleme}/photos', [PhotoController::class, 'index']);
    Route::post('/{id_probleme}/photos', [PhotoController::class, 'store']);
    Route::put('/photos/{id}', [PhotoController::class, 'update']);
    Route::delete('/photos/{id}', [PhotoController::class, 'destroy']);
});