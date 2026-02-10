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
        Schema::table('probleme_routier', function (Blueprint $table) {
            $table->string('firebase_id')->nullable()->unique()->after('type_route');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('probleme_routier', function (Blueprint $table) {
            $table->dropColumn('firebase_id');
        });
    }
};
