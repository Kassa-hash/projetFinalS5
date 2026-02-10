<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Créer le manager par défaut pour la correction
        User::updateOrCreate(
            ['email' => 'manager@projet.mg'],
            [
                'name' => 'Manager Correction',
                'email' => 'manager@projet.mg',
                'password' => Hash::make('Manager123!'),
                'role' => 'manager',
                'phone' => '+261340000000',
                'account_lockout' => false,
                'login_attempts' => 0,
                'locked_until' => null,
                'firebase_uid' => null,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ Manager par défaut créé : manager@projet.mg / Manager123!');
    }
}
