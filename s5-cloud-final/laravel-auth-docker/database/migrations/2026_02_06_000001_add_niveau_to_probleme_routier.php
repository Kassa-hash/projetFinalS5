<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('probleme_routier', function (Blueprint $table) {
            $table->integer('niveau')->nullable()->after('firebase_id');
        });
        
        // Ajouter constraint pour valeurs 1-10
        DB::statement('ALTER TABLE probleme_routier ADD CONSTRAINT niveau_range CHECK (niveau >= 1 AND niveau <= 10)');
    }

    public function down(): void
    {
        Schema::table('probleme_routier', function (Blueprint $table) {
            $table->dropColumn('niveau');
        });
        
        // Supprimer la constraint (si nécessaire, selon le SGBD)
        // DB::statement('ALTER TABLE probleme_routier DROP CONSTRAINT IF EXISTS niveau_range');
    }
};