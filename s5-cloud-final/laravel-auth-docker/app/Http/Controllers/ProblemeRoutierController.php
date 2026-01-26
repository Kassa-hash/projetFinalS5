<?php

namespace App\Http\Controllers;

use App\Models\ProblemeRoutier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProblemeRoutierController extends Controller
{
    /**
     * GET /api/problemes
     * Retourne tous les problèmes pour la carte
     */
    public function index()
    {
        $problemes = ProblemeRoutier::select([
            'id_probleme',
            'titre',
            'description',
            'statut',
            'date_signalement',
            'surface_m2',
            'budget',
            'entreprise',
            'latitude',
            'longitude',
            'type_probleme',
            'type_route'
        ])->get();

        return response()->json($problemes);
    }

    /**
     * GET /api/dashboard
     * Retourne les statistiques du tableau de récap
     */
    public function dashboard()
    {
        // Nombre total de problèmes
        $nb_points = ProblemeRoutier::count();

        // Surface totale
        $surface_totale = ProblemeRoutier::sum('surface_m2');

        // Budget total
        $budget_total = ProblemeRoutier::sum('budget');

        // Calcul du pourcentage d'avancement
        $total_problemes = ProblemeRoutier::count();
        $problemes_termines = ProblemeRoutier::where('statut', 'termine')->count();
        
        $avancement_pourcent = $total_problemes > 0 
            ? round(($problemes_termines / $total_problemes) * 100, 2) 
            : 0;

        return response()->json([
            'nb_points' => $nb_points,
            'surface_totale' => round($surface_totale, 2),
            'budget_total' => round($budget_total, 2),
            'avancement_pourcent' => $avancement_pourcent
        ]);
    }
}