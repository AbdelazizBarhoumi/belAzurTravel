<?php

use App\Http\Controllers\BrowserLogController;
use Illuminate\Support\Facades\Route;

Route::post('/browser-log', [BrowserLogController::class, 'store']);

Route::prefix('api')->middleware('web')->group(base_path('routes/api.php'));

Route::view('/', 'app')->name('home');
require __DIR__.'/settings.php';

Route::view('/dashboard', 'app')->middleware(['auth', 'verified'])->name('dashboard');
Route::view('/{any}', 'app')
	->where('any', '.*')
	->middleware(\App\Http\Middleware\EnforceNavSettings::class);
