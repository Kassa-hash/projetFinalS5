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
        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_probleme');
            $table->string('nom_fichier');
            $table->string('chemin_fichier'); // Chemin relatif au stockage
            $table->string('mime_type')->default('image/jpeg');
            $table->unsignedBigInteger('taille'); // En bytes
            $table->timestamp('date_upload')->useCurrent();
            $table->string('description')->nullable();
            
            // Foreign key
            $table->foreign('id_probleme')
                  ->references('id_probleme')
                  ->on('probleme_routier')
                  ->onDelete('cascade');
            
            $table->index('id_probleme');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
