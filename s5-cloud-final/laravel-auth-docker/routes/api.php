<?php

use App\Http\Controllers\Api\UnlockAccountController;
use App\Http\Controllers\FirebaseAuthController;
use Illuminate\Support\Facades\Route;

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
