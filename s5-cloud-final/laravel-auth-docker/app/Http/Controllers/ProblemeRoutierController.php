<?php

namespace App\Http\Controllers;

use App\Models\ProblemeRoutier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProblemeRoutierController extends Controller
{
    /**
     * Liste tous les problèmes
     */
    public function index()
    {
        $problemes = ProblemeRoutier::orderBy('date_signalement', 'desc')->get();
        return response()->json($problemes);
    }

    /**
     * Créer un nouveau problème
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:150',
            'description' => 'required|string',
            'statut' => 'required|in:nouveau,en_cours,termine',
            'date_signalement' => 'required|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'surface_m2' => 'required|numeric|min:0',
            'budget' => 'required|numeric|min:0',
            'entreprise' => 'nullable|string|max:150',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'type_probleme' => 'required|in:nid_de_poule,fissure,affaissement,autre',
            'type_route' => 'required|in:pont,trottoir,route,piste_cyclable,autre',
            'firebase_id' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Vérifier si existe déjà par firebase_id
        if ($request->has('firebase_id')) {
            $existing = ProblemeRoutier::where('firebase_id', $request->firebase_id)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'Problème déjà existant',
                    'data' => $existing
                ], 200);
            }
        }

        $probleme = ProblemeRoutier::create($request->all());

        return response()->json([
            'message' => 'Problème créé avec succès',
            'data' => $probleme
        ], 201);
    }

    /**
     * Afficher un problème spécifique
     */
    public function show($id)
    {
        $probleme = ProblemeRoutier::findOrFail($id);
        return response()->json($probleme);
    }

    /**
     * Mettre à jour un problème
     */
    public function update(Request $request, $id)
    {
        $probleme = ProblemeRoutier::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'titre' => 'sometimes|string|max:150',
            'description' => 'sometimes|string',
            'statut' => 'sometimes|in:nouveau,en_cours,termine',
            'date_signalement' => 'sometimes|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'surface_m2' => 'sometimes|numeric|min:0',
            'budget' => 'sometimes|numeric|min:0',
            'entreprise' => 'nullable|string|max:150',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'type_probleme' => 'sometimes|in:nid_de_poule,fissure,affaissement,autre',
            'type_route' => 'sometimes|in:pont,trottoir,route,piste_cyclable,autre'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $probleme->update($request->all());

        return response()->json([
            'message' => 'Problème mis à jour avec succès',
            'data' => $probleme
        ]);
    }

    /**
     * Supprimer un problème
     */
    public function destroy($id)
    {
        $probleme = ProblemeRoutier::findOrFail($id);
        $probleme->delete();

        return response()->json([
            'message' => 'Problème supprimé avec succès'
        ]);
    }

    /**
     * Vérifier si un problème existe par firebase_id
     */
    public function checkExists($firebase_id)
    {
        $exists = ProblemeRoutier::where('firebase_id', $firebase_id)->exists();
        
        return response()->json([
            'exists' => $exists
        ]);
    }
}