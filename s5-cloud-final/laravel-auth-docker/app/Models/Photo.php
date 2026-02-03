<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Photo extends Model
{
    protected $table = 'photos';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'id_probleme',
        'nom_fichier',
        'chemin_fichier',
        'mime_type',
        'taille',
        'description',
    ];

    protected $casts = [
        'date_upload' => 'datetime',
    ];

    public function probleme(): BelongsTo
    {
        return $this->belongsTo(ProblemeRoutier::class, 'id_probleme', 'id_probleme');
    }
}
