<?php

use App\Http\Controllers\BrowserLogController;
use Illuminate\Support\Facades\Route;

Route::post('/browser-log', [BrowserLogController::class, 'store']);

Route::view('/', 'app')->name('home');
Route::view('/{any}', 'app')->where('any', '.*');

require __DIR__.'/settings.php';
