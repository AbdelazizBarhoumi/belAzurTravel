<?php

use App\Http\Controllers\BrowserLogController;
use App\Http\Middleware\EnforceNavSettings;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::post('/browser-log', [BrowserLogController::class, 'store']);

Route::prefix('api')->middleware('web')->group(base_path('routes/api.php'));

Route::view('/', 'app')->name('home');
require __DIR__.'/settings.php';

Route::view('/dashboard', 'app')->middleware(['auth'])->name('dashboard');
// Server-side protections: ensure guests are redirected to /login before
// the SPA shell for authenticated sections can be served.
// Protect client area (client only)
Route::view('/client', 'app')->middleware(['auth', 'role:client']);
Route::view('/client/{any}', 'app')
    ->where('any', '.*')
    ->middleware(['auth', 'role:client']);

// Assistant area disabled for now.
Route::get('/assistant', fn () => abort(404, 'This page is not currently available.'));
Route::get('/assistant/{any}', fn () => abort(404, 'This page is not currently available.'))
    ->where('any', '.*');

Route::any('/api/assistant', fn () => abort(404, 'This page is not currently available.'));
Route::any('/api/assistant/{any}', fn () => abort(404, 'This page is not currently available.'))
    ->where('any', '.*');

// Protect admin area (admin only)
Route::view('/admin', 'app')->middleware(['auth', 'role:admin']);
Route::view('/admin/{any}', 'app')
    ->where('any', '.*')
    ->middleware(['auth', 'role:admin']);

// Fallback: all other SPA routes are subject to nav enforcement (public pages)
Route::view('/{any}', 'app')
    ->where('any', '.*')
    ->middleware(EnforceNavSettings::class);

Route::get('/run-migrate', function () {

    try {
        $exitCode = Artisan::call('migrate', [
            '--seed' => true,
        ]);

        $output = Artisan::output();

        return response()->json([
            'status' => $exitCode === 0 ? 'success' : 'failed',
            'exit_code' => $exitCode,
            'output' => $output,
        ]);

    } catch (Throwable $e) {

        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ], 500);
    }
});
