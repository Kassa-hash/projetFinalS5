<?php

namespace App\Http\Controllers;

use App\Models\PrixParM2;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PrixParM2Controller extends Controller
{
    /**
     * Liste tous les prix actifs
     */
    public function index()
    {
        $prix = PrixParM2::actifs()->orderBy('type_probleme')->orderBy('type_route')->get();
        return response()->json($prix);
    }

    /**
     * Récupérer le prix pour un type de problème et type de route
     */
    public function getPrix(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type_probleme' => 'required|string',
            'type_route' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Paramètres manquants',
                'messages' => $validator->errors()
            ], 422);
        }

        $prix = PrixParM2::getPrixActif(
            $request->type_probleme,
            $request->type_route
        );

        if (!$prix) {
            return response()->json([
                'error' => 'Prix non trouvé pour cette combinaison',
                'type_probleme' => $request->type_probleme,
                'type_route' => $request->type_route
            ], 404);
        }

        return response()->json($prix);
    }

    /**
     * Créer un nouveau prix
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type_probleme' => 'required|in:nid_de_poule,fissure,affaissement,autre',
            'type_route' => 'required|in:route,pont,trottoir,piste_cyclable,autre',
            'prix' => 'required|numeric|min:0',
            'date_debut' => 'nullable|date',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Désactiver l'ancien prix pour cette combinaison
        PrixParM2::where('type_probleme', $request->type_probleme)
            ->where('type_route', $request->type_route)
            ->where('actif', true)
            ->update(['actif' => false, 'date_fin' => now()]);

        // Créer le nouveau prix
        $prix = PrixParM2::create([
            'type_probleme' => $request->type_probleme,
            'type_route' => $request->type_route,
            'prix' => $request->prix,
            'date_debut' => $request->date_debut ?? now(),
            'actif' => true,
            'description' => $request->description
        ]);

        return response()->json([
            'message' => 'Prix créé avec succès',
            'data' => $prix
        ], 201);
    }

    /**
     * Mettre à jour un prix
     */
    public function update(Request $request, $id)
    {
        $prix = PrixParM2::find($id);

        if (!$prix) {
            return response()->json(['message' => 'Prix non trouvé'], 404);
        }

        $validator = Validator::make($request->all(), [
            'prix' => 'nullable|numeric|min:0',
            'actif' => 'nullable|boolean',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation échouée',
                'errors' => $validator->errors()
            ], 422);
        }

        $prix->update($request->only(['prix', 'actif', 'description']));

        return response()->json([
            'message' => 'Prix mis à jour avec succès',
            'data' => $prix
        ]);
    }

    /**
     * Supprimer (désactiver) un prix
     */
    public function destroy($id)
    {
        $prix = PrixParM2::findOrFail($id);
        $prix->update(['actif' => false, 'date_fin' => now()]);

        return response()->json([
            'message' => 'Prix désactivé avec succès'
        ]);
    }
}
