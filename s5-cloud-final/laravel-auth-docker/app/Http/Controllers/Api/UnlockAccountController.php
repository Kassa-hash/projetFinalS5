<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Info(
 *     title="API d'authentification Laravel",
 *     version="1.0.0",
 *     description="API REST pour la gestion des comptes utilisateurs et du déblocage"
 * )
 * @OA\Server(
 *     url="/api",
 *     description="Serveur API"
 * )
 */
class UnlockAccountController extends Controller
{
    /**
     * @OA\Post(
     *     path="/unlock-account",
     *     summary="Débloquer un compte utilisateur",
     *     description="Réinitialise les tentatives de connexion et débloque le compte d'un utilisateur",
     *     tags={"Authentification"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email"},
     *             @OA\Property(property="email", type="string", format="email", example="user@example.com", description="Adresse email de l'utilisateur à débloquer")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Compte débloqué avec succès",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Compte débloqué avec succès"),
     *             @OA\Property(
     *                 property="user",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="John Doe"),
     *                 @OA\Property(property="email", type="string", example="user@example.com"),
     *                 @OA\Property(property="login_attempts", type="integer", example=0),
     *                 @OA\Property(property="locked_until", type="string", nullable=true, example=null)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Utilisateur non trouvé",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Utilisateur non trouvé")
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation échouée",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Le champ email est obligatoire."),
     *             @OA\Property(
     *                 property="errors",
     *                 type="object",
     *                 @OA\Property(
     *                     property="email",
     *                     type="array",
     *                     @OA\Items(type="string", example="Le champ email est obligatoire.")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function unlock(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email'
        ], [
            'email.required' => 'Le champ email est obligatoire.',
            'email.email' => 'L\'adresse email doit être valide.',
            'email.exists' => 'Aucun utilisateur trouvé avec cette adresse email.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        $user->resetLoginAttempts();

        return response()->json([
            'success' => true,
            'message' => 'Compte débloqué avec succès',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'login_attempts' => $user->login_attempts,
                'locked_until' => $user->locked_until
            ]
        ], 200);
    }

    /**
     * @OA\Get(
     *     path="/account-status/{email}",
     *     summary="Vérifier le statut d'un compte",
     *     description="Récupère les informations sur l'état de blocage d'un compte utilisateur",
     *     tags={"Authentification"},
     *     @OA\Parameter(
     *         name="email",
     *         in="path",
     *         description="Adresse email de l'utilisateur",
     *         required=true,
     *         @OA\Schema(type="string", format="email")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Statut du compte récupéré",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="is_locked", type="boolean", example=false),
     *             @OA\Property(property="login_attempts", type="integer", example=2),
     *             @OA\Property(property="locked_until", type="string", nullable=true, example=null),
     *             @OA\Property(property="max_attempts", type="integer", example=3)
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Utilisateur non trouvé",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Utilisateur non trouvé")
     *         )
     *     )
     * )
     */
    public function status(string $email): JsonResponse
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'is_locked' => $user->isLocked(),
            'login_attempts' => $user->login_attempts,
            'locked_until' => $user->locked_until,
            'max_attempts' => config('auth.max_login_attempts', 3)
        ], 200);
    }
}
