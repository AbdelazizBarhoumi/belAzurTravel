<?php

namespace App\Providers;

use App\Http\Responses\LoginResponse;
use App\Security\PassportVault;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponseContract::class, LoginResponse::class);
        $this->app->singleton(PassportVault::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // model strict
        Model::shouldBeStrict();
        // Mirrors RoleMiddleware levels: superadmins and owners are admins too.
        Gate::define('admin', fn ($user): bool => in_array($user->role, ['admin', 'superadmin', 'owner'], true) && $user->active);
        Gate::define('assistant', fn ($user): bool => false);
        $this->configureDefaults();
        $this->retryFailedDeferredJobs();
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
    }

    /**
     * Emails run on the `deferred` connection (sent right after the HTTP
     * response, no worker needed). That connection cannot retry, so a failed
     * job is handed to the database queue, which the hourly cron retries.
     */
    protected function retryFailedDeferredJobs(): void
    {
        Queue::failing(function (JobFailed $event): void {
            if ($event->connectionName !== 'deferred') {
                return;
            }

            try {
                Queue::connection('database')->pushRaw($event->job->getRawBody());
            } catch (\Throwable $e) {
                report($e);
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
