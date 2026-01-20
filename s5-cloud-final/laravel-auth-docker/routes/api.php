<?php

use App\Http\Controllers\FirebaseAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/firebase/login', [FirebaseAuthController::class, 'login']);
Route::post('/firebase/register', [FirebaseAuthController::class, 'register']);
