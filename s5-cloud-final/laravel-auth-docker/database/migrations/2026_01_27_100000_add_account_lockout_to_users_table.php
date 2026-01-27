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
        Schema::table('users', function (Blueprint $table) {
            // Ajouter les colonnes de blocage si elles n'existent pas
            if (!Schema::hasColumn('users', 'login_attempts')) {
                $table->integer('login_attempts')->default(0)->after('password');
            }
            
            if (!Schema::hasColumn('users', 'locked_until')) {
                $table->timestamp('locked_until')->nullable()->after('login_attempts');
            }
            
            if (!Schema::hasColumn('users', 'account_lockout')) {
                $table->boolean('account_lockout')->default(false)->after('locked_until');
            }

            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('user')->after('account_lockout');
            }

            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('role');
            }

            if (!Schema::hasColumn('users', 'firebase_uid')) {
                $table->string('firebase_uid')->nullable()->unique()->after('phone');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumnIfExists('login_attempts');
            $table->dropColumnIfExists('locked_until');
            $table->dropColumnIfExists('account_lockout');
            $table->dropColumnIfExists('role');
            $table->dropColumnIfExists('phone');
            $table->dropColumnIfExists('firebase_uid');
        });
    }
};
