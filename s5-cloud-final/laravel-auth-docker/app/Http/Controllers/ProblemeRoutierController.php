<?php

namespace App\Http\Controllers;

use App\Models\ProblemeRoutier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

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
            'firebase_id' => 'nullable|string',
            'niveau' => 'nullable|integer|min:1|max:10'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Vérifier si existe déjà par firebase_id
        if ($request->has('firebase_id') && $request->firebase_id) {
            $existing = ProblemeRoutier::where('firebase_id', $request->firebase_id)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'Problème déjà existant',
                    'data' => $existing
                ], 200);
            }
        }

        // ✅ Préparer les données avec niveau
        $data = $request->all();
        
        // S'assurer que niveau est un entier valide ou null
        if (isset($data['niveau'])) {
            $niveau = intval($data['niveau']);
            $data['niveau'] = ($niveau >= 1 && $niveau <= 10) ? $niveau : null;
        } else {
            $data['niveau'] = null;
        }

        $probleme = ProblemeRoutier::create($data);

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
        Log::info('UPDATE PROBLEME - ID reçu', ['id' => $id, 'request_data' => $request->all()]);

        $probleme = ProblemeRoutier::find($id);

        if (!$probleme) {
            Log::error('PROBLÈME NON TROUVÉ - ID inexistant', ['id' => $id]);
            return response()->json(['message' => 'Problème non trouvé'], 404);
        }

        Log::info('PROBLEME TROUVÉ', ['id_probleme' => $probleme->id_probleme, 'current_data' => $probleme->toArray()]);

        $validator = Validator::make($request->all(), [
            'titre' => 'nullable|string|max:150',
            'description' => 'nullable|string',
            'statut' => 'nullable|in:nouveau,en_cours,termine',
            'date_signalement' => 'nullable|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'surface_m2' => 'nullable|numeric|min:0',
            'budget' => 'nullable|numeric|min:0',
            'entreprise' => 'nullable|string|max:150',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'type_probleme' => 'nullable|in:nid_de_poule,fissure,affaissement,autre',
            'type_route' => 'nullable|in:pont,trottoir,route,piste_cyclable,autre',
            'niveau' => 'nullable|integer|min:1|max:10'
        ]);

        if ($validator->fails()) {
            Log::error('VALIDATION ÉCHOUÉE', ['errors' => $validator->errors()]);
            return response()->json([
                'message' => 'Validation échouée',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // ✅ Préparer les données avec niveau
            $data = $request->all();
            
            if (isset($data['niveau'])) {
                $niveau = intval($data['niveau']);
                $data['niveau'] = ($niveau >= 1 && $niveau <= 10) ? $niveau : null;
            }
            
            $probleme->update($data);
            Log::info('MISE À JOUR RÉUSSIE', ['new_data' => $probleme->fresh()->toArray()]);

            return response()->json([
                'message' => 'Problème mis à jour avec succès',
                'data' => $probleme
            ]);
        } catch (\Exception $e) {
            Log::error('ERREUR LORS DE LA MISE À JOUR', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
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

    /**
     * Retourner les statistiques du tableau de bord
     */
    public function dashboard()
    {
        $nb_points = ProblemeRoutier::count();
        $surface_totale = ProblemeRoutier::sum('surface_m2') ?? 0;
        $budget_total = ProblemeRoutier::sum('budget') ?? 0;
        
        // Calculer l'avancement en pourcentage (nombre de problèmes terminés / total)
        $termines = ProblemeRoutier::where('statut', 'termine')->count();
        $avancement_pourcent = $nb_points > 0 ? round(($termines / $nb_points) * 100) : 0;
        
        return response()->json([
            'nb_points' => $nb_points,
            'surface_totale' => $surface_totale,
            'budget_total' => $budget_total,
            'avancement_pourcent' => $avancement_pourcent
        ]);
    }
}