<?php

use App\Http\Controllers\BrowserLogController;
use Illuminate\Support\Facades\Route;

Route::post('/browser-log', [BrowserLogController::class, 'store']);

Route::prefix('api')->middleware('web')->group(base_path('routes/api.php'));

Route::view('/', 'app')->name('home');
require __DIR__.'/settings.php';

Route::view('/dashboard', 'app')->middleware(['auth', 'verified'])->name('dashboard');
// Server-side protections: ensure guests are redirected to /login before
// the SPA shell for authenticated sections can be served.
// Protect client area (client only)
Route::view('/client', 'app')->middleware(['auth', 'role:client']);
Route::view('/client/{any}', 'app')
	->where('any', '.*')
	->middleware(['auth', 'role:client']);

// Protect assistant area (assistant and admin)
Route::view('/assistant', 'app')->middleware(['auth', 'role:assistant,admin']);
Route::view('/assistant/{any}', 'app')
	->where('any', '.*')
	->middleware(['auth', 'role:assistant,admin']);

// Protect admin area (admin only)
Route::view('/admin', 'app')->middleware(['auth', 'role:admin']);
Route::view('/admin/{any}', 'app')
	->where('any', '.*')
	->middleware(['auth', 'role:admin']);

// Fallback: all other SPA routes are subject to nav enforcement (public pages)
Route::view('/{any}', 'app')
	->where('any', '.*')
	->middleware(\App\Http\Middleware\EnforceNavSettings::class);
