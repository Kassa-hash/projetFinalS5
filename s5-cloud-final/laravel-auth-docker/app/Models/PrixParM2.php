<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrixParM2 extends Model
{
    use HasFactory;

    protected $table = 'prix_par_m2';
    protected $primaryKey = 'id_prix';
    public $timestamps = false;

    protected $fillable = [
        'type_probleme',
        'type_route',
        'prix',
        'date_debut',
        'date_fin',
        'actif',
        'description'
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'actif' => 'boolean'
    ];

    /**
     * Récupérer le prix actif pour un type de problème et type de route
     */
    public static function getPrixActif($typeProbleme, $typeRoute)
    {
        return self::where('type_probleme', $typeProbleme)
            ->where('type_route', $typeRoute)
            ->where('actif', true)
            ->whereNull('date_fin')
            ->first();
    }

    /**
     * Scope pour les prix actifs
     */
    public function scopeActifs($query)
    {
        return $query->where('actif', true)->whereNull('date_fin');
    }
}
