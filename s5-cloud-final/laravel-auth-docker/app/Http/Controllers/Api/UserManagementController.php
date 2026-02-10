<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    /**
     * Liste tous les utilisateurs
     */
    public function index(): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'role', 'phone', 'account_lockout', 'login_attempts', 'locked_until', 'firebase_uid')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json($users);
    }

    /**
     * Liste uniquement les utilisateurs bloqués
     */
    public function locked(): JsonResponse
    {
        $users = User::where('account_lockout', true)
            ->select('id', 'name', 'email', 'role', 'phone', 'account_lockout', 'login_attempts', 'locked_until')
            ->orderBy('locked_until', 'desc')
            ->get();
        
        return response()->json($users);
    }

    /**
     * Statistiques des utilisateurs
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total' => User::count(),
            'managers' => User::where('role', 'manager')->count(),
            'users' => User::where('role', 'user')->count(),
            'admins' => User::where('role', 'admin')->count(),
            'locked' => User::where('account_lockout', true)->count(),
            'active' => User::where('account_lockout', false)->count(),
        ];
        
        return response()->json($stats);
    }

    /**
     * Afficher un utilisateur spécifique
     */
    public function show($id): JsonResponse
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role' => 'sometimes|in:user,manager,admin',
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($validated);
        
        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $user
        ]);
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy($id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();
        
        return response()->json([
            'message' => 'Utilisateur supprimé avec succès'
        ]);
    }
}
