<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, TwoFactorAuthenticatable;
    use Notifiable {
        notify as protected notifyUnguarded;
    }

    /**
     * Send a notification without ever failing the caller: a broken mail
     * transport must not turn a booking or support request into a 500.
     */
    public function notify($instance): void
    {
        try {
            $this->notifyUnguarded($instance);
        } catch (\Throwable $e) {
            report($e);

            // Account emails must not be reported as "sent" when they were not.
            if ($instance instanceof VerifyEmail || $instance instanceof ResetPassword) {
                throw $e;
            }
        }
    }

    /**
     * Determine if the user has verified their email address.
     *
     * @return bool
     */
    public function hasVerifiedEmail()
    {
        return $this->role === 'owner' || parent::hasVerifiedEmail();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'active',
        'preferred_language',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
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
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'active' => 'boolean',
        ];
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }
}
