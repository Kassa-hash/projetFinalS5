<?php

use App\Http\Controllers\Api\UnlockAccountController;
use App\Http\Controllers\FirebaseAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/firebase/login', [FirebaseAuthController::class, 'login']);
Route::post('/firebase/register', [FirebaseAuthController::class, 'register']);

// Account management endpoints
Route::post('/unlock-account', [UnlockAccountController::class, 'unlock']);
Route::get('/account-status/{email}', [UnlockAccountController::class, 'status']);
