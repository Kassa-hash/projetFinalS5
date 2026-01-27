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

            // Récupérer ou créer l'utilisateur local
            $user = User::updateOrCreate(
                ['email' => $credentials['email']],
                ['firebase_uid' => $signInResult->firebaseUserId()]
            );

            return response()->json([
                'source' => 'firebase',
                'token_type' => 'Bearer',
                'id_token' => $signInResult->idToken(),
                'refresh_token' => $signInResult->refreshToken(),
                'expires_in' => $signInResult->ttl(),
                'uid' => $signInResult->firebaseUserId(),
                'user' => $user,
            ]);
        } catch (AuthException|FirebaseException|Throwable $exception) {
            $firebaseError = $exception->getMessage();
        }

        $user = User::where('email', $credentials['email'])->first();

        if ($user !== null) {
            // Vérifier si le compte est bloqué manuellement
            if ($user->account_lockout) {
                throw ValidationException::withMessages([
                    'email' => ['Ce compte est verrouillé. Veuillez contacter le support.'],
                ]);
            }

            // Vérifier si le compte est verrouillé temporairement (après 3 tentatives échouées)
            if ($user->isLocked()) {
                throw ValidationException::withMessages([
                    'email' => ['Compte bloqué après trop de tentatives. Veuillez contacter un administrateur.'],
                ]);
            }

            // Vérifier le mot de passe
            if (Hash::check($credentials['password'], $user->password)) {
                // Login réussi - réinitialiser les tentatives
                $user->resetLoginAttempts();

                return response()->json([
                    'source' => 'postgres',
                    'message' => 'Authenticated locally because Firebase could not be reached.',
                    'user' => $user,
                    'firebase_error' => $firebaseError,
                ]);
            }

            // Mot de passe incorrect - incrémenter les tentatives
            $user->incrementLoginAttempts();
        }

        throw ValidationException::withMessages([
            'email' => ['Email ou mot de passe incorrect.'],
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'in:user,manager'],
        ]);

        $firebaseError = null;

        try {
            // Créer dans Firebase
            $firebaseUser = $this->firebaseAuth->createUserWithEmailAndPassword($data['email'], $data['password']);

            // Signer et obtenir les tokens
            $signInResult = $this->firebaseAuth->signInWithEmailAndPassword($data['email'], $data['password']);

            // Créer dans PostgreSQL
            $user = User::create([
                'firebase_uid' => $firebaseUser->uid,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'role' => $data['role'],
            ]);

            return response()->json([
                'source' => 'firebase',
                'message' => 'Utilisateur créé avec succès',
                'id_token' => $signInResult->idToken(),
                'refresh_token' => $signInResult->refreshToken(),
                'expires_in' => $signInResult->ttl(),
                'uid' => $firebaseUser->uid,
                'user' => $user,
            ], 201);
        } catch (AuthException|FirebaseException|Throwable $exception) {
            $firebaseError = $exception->getMessage();
        }

        // Fallback PostgreSQL uniquement
        $existing = User::where('email', $data['email'])->first();
        if ($existing) {
            return response()->json(
                ['error' => 'Email déjà utilisé', 'firebase_error' => $firebaseError],
                409
            );
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'],
        ]);

        return response()->json([
            'source' => 'postgres',
            'message' => 'Utilisateur créé localement (Firebase indisponible)',
            'user' => $user,
            'firebase_error' => $firebaseError,
        ], 201);
    }
}
