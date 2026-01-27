<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'firebase_uid',
        'name',
        'email',
        'password',
        'phone',
        'role',
        'account_lockout',
        'login_attempts',
        'locked_until',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'locked_until' => 'datetime',
            'password' => 'hashed',
            'account_lockout' => 'boolean',
        ];
    }

    /**
     * Check if account is locked
     * Retourne true si le compte a 3+ tentatives (bloqué jusqu'au déblocage manuel)
     */
    public function isLocked(): bool
    {
        return $this->login_attempts >= config('auth.max_login_attempts', 3);
    }

    /**
     * Increment login attempts
     */
    public function incrementLoginAttempts(): void
    {
        $maxAttempts = config('auth.max_login_attempts', 3);
        
        $this->increment('login_attempts');
        
        if ($this->login_attempts >= $maxAttempts) {
            $this->locked_until = now()->addMinutes(config('auth.lockout_duration', 15));
            $this->save();
        }
    }

    /**
     * Reset login attempts
     */
    public function resetLoginAttempts(): void
    {
        $this->update([
            'login_attempts' => 0,
            'locked_until' => null,
        ]);
    }
}
