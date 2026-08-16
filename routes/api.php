<?php

use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\Api\AdminBlogPostController;
use App\Http\Controllers\Api\AdminCarController;
use App\Http\Controllers\Api\AdminCategoryController;
use App\Http\Controllers\Api\AdminCategoryTypeController;
use App\Http\Controllers\Api\AdminComplaintController;
use App\Http\Controllers\Api\AdminDealController;
use App\Http\Controllers\Api\AdminDestinationController;
use App\Http\Controllers\Api\AdminEventController;
use App\Http\Controllers\Api\AdminFlightController;
use App\Http\Controllers\Api\AdminHotelController;
use App\Http\Controllers\Api\AdminOsTravelController;
use App\Http\Controllers\Api\AdminPartnerController;
use App\Http\Controllers\Api\AdminPromoController;
use App\Http\Controllers\Api\AdminTeamController;
use App\Http\Controllers\Api\AdminTourController;
use App\Http\Controllers\Api\AdminTravelController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminVisaController;
use App\Http\Controllers\Api\AuthUserController;
use App\Http\Controllers\Api\BlogPostController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ComplaintController;
use App\Http\Controllers\Api\DealController;
use App\Http\Controllers\Api\DestinationController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FlightController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\HotelController;
use App\Http\Controllers\Api\HotelImageController;
use App\Http\Controllers\Api\HotelSearchController;
use App\Http\Controllers\Api\InteractionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PromoController;
use App\Http\Controllers\Api\SiteSettingsController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TourController;
use App\Http\Controllers\Api\TravelController;
use App\Http\Controllers\Api\VisaApplicationController;
use App\Http\Controllers\Api\VisaController;
use Illuminate\Support\Facades\Route;

Route::get('/site-settings', [SiteSettingsController::class, 'show']);
Route::middleware(['auth', 'role:superadmin'])->put('/site-settings', [SiteSettingsController::class, 'update']);
Route::get('/auth/user', [AuthUserController::class, 'show']);

Route::post('/interactions/notify', [InteractionController::class, 'notify']);

Route::get('/visas', [VisaController::class, 'index']);
Route::post('/visa-applications', [VisaApplicationController::class, 'store']);
Route::get('/categories', [AdminCategoryController::class, 'index']);
Route::get('/categories/types', [AdminCategoryController::class, 'typesByEntity']);
Route::get('/gallery', [GalleryController::class, 'index'])
    ->middleware(['check-nav-page:gallery']);

// Per-entity public pages — protected by nav settings
Route::get('destinations', [DestinationController::class, 'index'])->middleware(['check-nav-page:destinations']);
Route::get('destinations/{slug}', [DestinationController::class, 'show'])->middleware(['check-nav-page:destinations']);

Route::get('hotels', [HotelController::class, 'index'])->middleware(['check-nav-page:hotels']);
Route::get('hotels/images/{token}', [HotelImageController::class, 'show'])->middleware(['check-nav-page:hotels']);
Route::get('hotels/{slug}', [HotelController::class, 'show'])->middleware(['check-nav-page:hotels']);
Route::post('hotels/search', [HotelSearchController::class, 'store'])->middleware(['check-nav-page:hotels']);

Route::get('tours', [TourController::class, 'index'])->middleware(['check-nav-page:tours']);
Route::get('tours/{slug}', [TourController::class, 'show'])->middleware(['check-nav-page:tours']);

Route::get('travels', [TravelController::class, 'index'])->middleware(['check-nav-page:travels']);
Route::get('travels/{slug}', [TravelController::class, 'show'])->middleware(['check-nav-page:travels']);

Route::get('cars', [CarController::class, 'index'])->middleware(['check-nav-page:cars']);
Route::get('cars/{slug}', [CarController::class, 'show'])->middleware(['check-nav-page:cars']);

Route::get('flights', [FlightController::class, 'index'])->middleware(['check-nav-page:flights']);
Route::get('flights/{code}', [FlightController::class, 'show'])->middleware(['check-nav-page:flights']);

Route::get('events', [EventController::class, 'index'])->middleware(['check-nav-page:events']);
Route::get('events/{slug}', [EventController::class, 'show'])->middleware(['check-nav-page:events']);

Route::get('deals', [DealController::class, 'index'])->middleware(['check-nav-page:deals']);
Route::get('deals/{slug}', [DealController::class, 'show'])->middleware(['check-nav-page:deals']);

Route::get('promos', [PromoController::class, 'index'])->middleware(['check-nav-page:promos']);
Route::get('promos/{code}', [PromoController::class, 'show'])->middleware(['check-nav-page:promos']);

Route::get('team', [TeamController::class, 'index'])->middleware(['check-nav-page:team']);

Route::get('partners', [PartnerController::class, 'index']);

Route::get('blog-posts', [BlogPostController::class, 'index'])->middleware(['check-nav-page:blog-posts']);
Route::get('blog-posts/{slug}', [BlogPostController::class, 'show'])->middleware(['check-nav-page:blog-posts']);

// Authenticated endpoints (booking creation, cancellation for owner)
Route::middleware('auth')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::delete('/notifications/clear-all', [NotificationController::class, 'destroyAll']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
    Route::post('/bookings/{id}/pay', [PaymentController::class, 'initiate']);
    Route::post('/bookings/{id}/retry-payment', [PaymentController::class, 'retry']);
    Route::get('/payment/callback', [PaymentController::class, 'callback']);
    Route::get('/client/dashboard', [ClientController::class, 'dashboard']);
    Route::get('/client/bookings', [ClientController::class, 'bookings']);
    Route::get('/client/payments', [ClientController::class, 'payments']);
    Route::get('/client/support', [ClientController::class, 'support']);
    Route::post('/client/support', [ClientController::class, 'createSupport']);
    Route::put('/client/profile', [ClientController::class, 'updateProfile']);
    Route::patch('/user/language', [ClientController::class, 'updateLanguage']);

    // Complaints & Refunds
    Route::get('/client/complaints', [ComplaintController::class, 'index']);
    Route::get('/client/complaints/{id}', [ComplaintController::class, 'show']);
    Route::post('/client/complaints', [ComplaintController::class, 'store']);
    Route::post('/client/complaints/{id}/reply', [ComplaintController::class, 'reply']);

    // Assistant API surface disabled for now.

    // Admin endpoints
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/gallery', [GalleryController::class, 'index']);
        Route::post('/admin/gallery', [GalleryController::class, 'store']);
        Route::put('/admin/gallery/{galleryImage}', [GalleryController::class, 'update']);
        Route::delete('/admin/gallery/{galleryImage}', [GalleryController::class, 'destroy']);

        Route::post('/admin/upload', [UploadController::class, 'store']);

        // Per-entity admin controllers (per-entity admin)
        Route::get('/admin/destinations', [AdminDestinationController::class, 'index']);
        Route::post('/admin/destinations', [AdminDestinationController::class, 'store']);
        Route::get('/admin/destinations/{id}', [AdminDestinationController::class, 'show']);
        Route::put('/admin/destinations/{id}', [AdminDestinationController::class, 'update']);
        Route::delete('/admin/destinations/{id}', [AdminDestinationController::class, 'destroy']);

        Route::get('/admin/hotels', [AdminHotelController::class, 'index']);
        Route::post('/admin/hotels', [AdminHotelController::class, 'store']);
        Route::get('/admin/hotels/{id}', [AdminHotelController::class, 'show']);
        Route::put('/admin/hotels/{id}', [AdminHotelController::class, 'update']);
        Route::delete('/admin/hotels/{id}', [AdminHotelController::class, 'destroy']);

        Route::get('/admin/os-travel', [AdminOsTravelController::class, 'dashboard']);
        Route::get('/admin/os-travel/hotels', [AdminOsTravelController::class, 'index'])->middleware('extend-timeout');
        Route::get('/admin/os-travel/references', [AdminOsTravelController::class, 'references']);
        Route::post('/admin/os-travel/hotels/approve-all', [AdminOsTravelController::class, 'approveAll'])->middleware('extend-timeout');
        Route::get('/admin/os-travel/hotels/{id}', [AdminOsTravelController::class, 'show']);
        Route::put('/admin/os-travel/hotels/{id}', [AdminOsTravelController::class, 'update']);
        Route::post('/admin/os-travel/hotels/{id}/approve', [AdminOsTravelController::class, 'approve'])->middleware('extend-timeout');
        Route::post('/admin/os-travel/hotels/{id}/reject', [AdminOsTravelController::class, 'reject']);
        Route::post('/admin/os-travel/hotels/{id}/unapprove', [AdminOsTravelController::class, 'unapprove']);

        Route::get('/admin/tours', [AdminTourController::class, 'index']);
        Route::post('/admin/tours', [AdminTourController::class, 'store']);
        Route::get('/admin/tours/{id}', [AdminTourController::class, 'show']);
        Route::put('/admin/tours/{id}', [AdminTourController::class, 'update']);
        Route::delete('/admin/tours/{id}', [AdminTourController::class, 'destroy']);

        Route::get('/admin/travels', [AdminTravelController::class, 'index']);
        Route::post('/admin/travels', [AdminTravelController::class, 'store']);
        Route::get('/admin/travels/{id}', [AdminTravelController::class, 'show']);
        Route::put('/admin/travels/{id}', [AdminTravelController::class, 'update']);
        Route::delete('/admin/travels/{id}', [AdminTravelController::class, 'destroy']);

        Route::get('/admin/cars', [AdminCarController::class, 'index']);
        Route::post('/admin/cars', [AdminCarController::class, 'store']);
        Route::get('/admin/cars/{id}', [AdminCarController::class, 'show']);
        Route::put('/admin/cars/{id}', [AdminCarController::class, 'update']);
        Route::delete('/admin/cars/{id}', [AdminCarController::class, 'destroy']);

        Route::get('/admin/flights', [AdminFlightController::class, 'index']);
        Route::post('/admin/flights', [AdminFlightController::class, 'store']);
        Route::get('/admin/flights/{id}', [AdminFlightController::class, 'show']);
        Route::put('/admin/flights/{id}', [AdminFlightController::class, 'update']);
        Route::delete('/admin/flights/{id}', [AdminFlightController::class, 'destroy']);

        Route::get('/admin/events', [AdminEventController::class, 'index']);
        Route::post('/admin/events', [AdminEventController::class, 'store']);
        Route::get('/admin/events/{id}', [AdminEventController::class, 'show']);
        Route::put('/admin/events/{id}', [AdminEventController::class, 'update']);
        Route::delete('/admin/events/{id}', [AdminEventController::class, 'destroy']);

        Route::get('/admin/deals', [AdminDealController::class, 'index']);
        Route::post('/admin/deals', [AdminDealController::class, 'store']);
        Route::get('/admin/deals/{id}', [AdminDealController::class, 'show']);
        Route::put('/admin/deals/{id}', [AdminDealController::class, 'update']);
        Route::delete('/admin/deals/{id}', [AdminDealController::class, 'destroy']);

        Route::get('/admin/promos', [AdminPromoController::class, 'index']);
        Route::post('/admin/promos', [AdminPromoController::class, 'store']);
        Route::get('/admin/promos/{id}', [AdminPromoController::class, 'show']);
        Route::put('/admin/promos/{id}', [AdminPromoController::class, 'update']);
        Route::delete('/admin/promos/{id}', [AdminPromoController::class, 'destroy']);

        Route::get('/admin/blog-posts', [AdminBlogPostController::class, 'index']);
        Route::post('/admin/blog-posts', [AdminBlogPostController::class, 'store']);
        Route::get('/admin/blog-posts/{id}', [AdminBlogPostController::class, 'show']);
        Route::put('/admin/blog-posts/{id}', [AdminBlogPostController::class, 'update']);
        Route::delete('/admin/blog-posts/{id}', [AdminBlogPostController::class, 'destroy']);
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);
        Route::post('/admin/users/{user}/toggle-active', [AdminUserController::class, 'toggleActive']);
        Route::delete('/admin/users/{user}', [AdminUserController::class, 'destroy']);
        Route::get('/admin/bookings', [BookingController::class, 'index']);
        Route::post('/admin/bookings/{id}/confirm', [BookingController::class, 'confirm']);
        Route::post('/admin/bookings/{id}/cancel', [BookingController::class, 'adminCancel']);

        // Complaints & Refunds
        Route::get('/admin/complaints', [AdminComplaintController::class, 'index']);
        Route::get('/admin/complaints/{id}', [AdminComplaintController::class, 'show']);
        Route::put('/admin/complaints/{id}', [AdminComplaintController::class, 'update']);
        Route::post('/admin/complaints/{id}/reply', [AdminComplaintController::class, 'reply']);
        Route::post('/admin/complaints/{id}/resolve', [AdminComplaintController::class, 'resolve']);

        Route::get('/admin/categories', [AdminCategoryController::class, 'index']);
        Route::post('/admin/categories', [AdminCategoryController::class, 'store']);
        Route::put('/admin/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/admin/categories/{category}', [AdminCategoryController::class, 'destroy']);

        // Category Types (multi-type system)
        Route::get('/admin/category-types', [AdminCategoryTypeController::class, 'index']);
        Route::post('/admin/category-types', [AdminCategoryTypeController::class, 'store']);
        Route::post('/admin/category-types/reorder', [AdminCategoryTypeController::class, 'reorder']);
        Route::put('/admin/category-types/{categoryType}', [AdminCategoryTypeController::class, 'update']);
        Route::delete('/admin/category-types/{categoryType}', [AdminCategoryTypeController::class, 'destroy']);

        Route::get('/admin/category-types/{categoryType}/values', [AdminCategoryTypeController::class, 'values']);
        Route::post('/admin/category-types/{categoryType}/values', [AdminCategoryTypeController::class, 'storeValue']);
        Route::put('/admin/category-types/{categoryType}/values/{value}', [AdminCategoryTypeController::class, 'updateValue']);
        Route::delete('/admin/category-types/{categoryType}/values/{value}', [AdminCategoryTypeController::class, 'destroyValue']);

        Route::get('/admin/team', [AdminTeamController::class, 'index']);
        Route::post('/admin/team', [AdminTeamController::class, 'store']);
        Route::get('/admin/team/{id}', [AdminTeamController::class, 'show']);
        Route::put('/admin/team/{id}', [AdminTeamController::class, 'update']);
        Route::delete('/admin/team/{id}', [AdminTeamController::class, 'destroy']);

        Route::get('/admin/visas', [AdminVisaController::class, 'index']);
        Route::post('/admin/visas', [AdminVisaController::class, 'store']);
        Route::get('/admin/visas/{id}', [AdminVisaController::class, 'show']);
        Route::put('/admin/visas/{id}', [AdminVisaController::class, 'update']);
        Route::delete('/admin/visas/{id}', [AdminVisaController::class, 'destroy']);

        Route::get('/admin/partners', [AdminPartnerController::class, 'index']);
        Route::post('/admin/partners', [AdminPartnerController::class, 'store']);
        Route::get('/admin/partners/{id}', [AdminPartnerController::class, 'show']);
        Route::put('/admin/partners/{id}', [AdminPartnerController::class, 'update']);
        Route::delete('/admin/partners/{id}', [AdminPartnerController::class, 'destroy']);
    });
});
