<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProblemeRoutier extends Model
{
    use HasFactory;

    protected $table = 'probleme_routier';
    protected $primaryKey = 'id_probleme';
    public $timestamps = false;

    protected $fillable = [
        'titre',
        'description',
        'statut',
        'date_signalement',
        'date_debut',
        'date_fin',
        'surface_m2',
        'budget',
        'entreprise',
        'latitude',
        'longitude',
        'type_probleme',
        'type_route',
        'firebase_id'
    ];

    protected $casts = [
        'surface_m2' => 'decimal:2',
        'budget' => 'decimal:2',
        'latitude' => 'decimal:6',
        'longitude' => 'decimal:6',
        'date_signalement' => 'date',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class, 'id_probleme', 'id_probleme');
    }
}