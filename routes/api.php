<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\BookingController;

// Public (browsing) endpoints — guests may view booking details (read-only)
use App\Http\Controllers\Api\SiteSettingsController;

Route::get('/site-settings', [SiteSettingsController::class, 'show']);
Route::middleware(['auth:sanctum', 'can:admin'])->put('/site-settings', [SiteSettingsController::class, 'update']);

Route::get('/bookings/{id}', [BookingController::class, 'show']);

// Authenticated endpoints (booking creation, cancellation for owner)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

    // Admin endpoints
    Route::middleware('can:admin')->group(function () {
        Route::get('/admin/bookings', [BookingController::class, 'index']);
        Route::post('/admin/bookings/{id}/confirm', [BookingController::class, 'confirm']);
    });
});
