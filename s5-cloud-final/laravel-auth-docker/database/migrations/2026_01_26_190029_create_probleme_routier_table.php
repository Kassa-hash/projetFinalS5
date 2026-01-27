<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('probleme_routier', function (Blueprint $table) {
            $table->id('id_probleme'); // SERIAL PRIMARY KEY
            
            $table->string('titre', 150)->nullable();
            $table->text('description')->nullable();
            
            $table->enum('statut', ['nouveau', 'en_cours', 'termine'])->default('nouveau');
            
            $table->date('date_signalement')->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            
            $table->decimal('surface_m2', 10, 2)->nullable();
            $table->decimal('budget', 14, 2)->nullable();
            
            $table->string('entreprise', 150)->nullable();
            
            $table->decimal('latitude', 10, 6)->nullable();
            $table->decimal('longitude', 10, 6)->nullable();
            
            $table->enum('type_probleme', ['nid_de_poule', 'fissure', 'affaissement', 'autre'])->nullable();
            $table->enum('type_route', ['pont', 'trottoir', 'route', 'piste_cyclable', 'autre'])->nullable();
            
            // Pas de timestamps() car ta table PostgreSQL n'a pas created_at/updated_at
            
            // Index pour optimiser les requêtes géographiques
            $table->index(['latitude', 'longitude'], 'idx_probleme_routier_coords');
            $table->index('statut', 'idx_probleme_routier_statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('probleme_routier');
    }
};