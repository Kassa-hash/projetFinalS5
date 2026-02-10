<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Kreait\Firebase\Contract\Auth as FirebaseAuthContract;
use Kreait\Firebase\Exception\AuthException;
use Kreait\Firebase\Exception\FirebaseException;
use Throwable;

class FirebaseAuthController extends Controller
{
    public function __construct(private readonly FirebaseAuthContract $firebaseAuth) {}

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $firebaseError = null;

        try {
            $signInResult = $this->firebaseAuth->signInWithEmailAndPassword(
                $credentials['email'],
                $credentials['password'],
            );

            return response()->json([
                'source' => 'firebase',
                'token_type' => 'Bearer',
                'id_token' => $signInResult->idToken(),
                'refresh_token' => $signInResult->refreshToken(),
                'expires_in' => $signInResult->ttl(),
                'uid' => $signInResult->firebaseUserId(),
            ]);
        } catch (AuthException|FirebaseException|Throwable $exception) {
            $firebaseError = $exception->getMessage();
        }

        $user = User::where('email', $credentials['email'])->first();

        if ($user !== null && Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'source' => 'postgres',
                'message' => 'Authenticated locally because Firebase could not be reached.',
                'user' => [
                    'id' => $user->getKey(),
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'firebase_error' => $firebaseError,
            ]);
        }

        throw ValidationException::withMessages([
            'email' => [__('auth.failed')],
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $firebaseError = null;

        try {
            // Try to create user in Firebase
            $this->firebaseAuth->createUserWithEmailAndPassword($data['email'], $data['password']);

            // Sign in to obtain tokens
            $signInResult = $this->firebaseAuth->signInWithEmailAndPassword($data['email'], $data['password']);

            return response()->json([
                'source' => 'firebase',
                'id_token' => $signInResult->idToken(),
                'refresh_token' => $signInResult->refreshToken(),
                'expires_in' => $signInResult->ttl(),
                'uid' => $signInResult->firebaseUserId(),
            ], 201);
        } catch (AuthException|FirebaseException|Throwable $exception) {
            $firebaseError = $exception->getMessage();
        }

        // Fallback: create user locally in Postgres
        $existing = User::where('email', $data['email'])->first();
        if ($existing) {
            return response()->json(['error' => 'User already exists locally', 'firebase_error' => $firebaseError], 409);
        }

        $user = User::create([
            'name' => $data['name'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        return response()->json([
            'source' => 'postgres',
            'message' => 'User created locally because Firebase could not be reached.',
            'user' => [
                'id' => $user->getKey(),
                'name' => $user->name,
                'email' => $user->email,
            ],
            'firebase_error' => $firebaseError,
        ], 201);
    }
}
