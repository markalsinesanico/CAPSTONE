<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\API\ItemController;
use App\Http\Controllers\API\ItemUnitController;
use App\Http\Controllers\API\RequestItemController;
use App\Http\Controllers\API\RoomController;
use App\Http\Controllers\API\RoomRequestController;
use App\Http\Controllers\API\NotificationController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// QR Code scanning (public access)
Route::get('/scan/{code}', [ItemUnitController::class, 'scan']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user-info', [AuthController::class, 'user']);

    // Items & Requests
    Route::apiResource('items', ItemController::class);
    Route::apiResource('requests', RequestItemController::class);
    Route::get('/items', [ItemController::class, 'index']);
    Route::patch('/requests/{id}/return', [RequestItemController::class, 'return']);
    Route::post('/requests/{id}/overdue', [RequestItemController::class, 'sendOverdueNotification']);

    // Rooms
    Route::apiResource('rooms', RoomController::class);
    Route::get('/rooms', [RoomController::class, 'index']);

    // Room Requests
    Route::get('room-requests',  [RoomRequestController::class, 'index']);
    Route::post('room-requests', [RoomRequestController::class, 'store']);
    Route::patch('room-requests/{roomRequest}', [RoomRequestController::class, 'update']);
    Route::delete('room-requests/{roomRequest}', [RoomRequestController::class, 'destroy']);
    Route::patch('room-requests/{id}/return', [RoomRequestController::class, 'return']);
    Route::post('room-requests/{id}/overdue', [RoomRequestController::class, 'sendOverdueNotification']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/clear-all', [NotificationController::class, 'clearAll']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    
    // Test endpoint for overdue notifications (remove in production)
    Route::post('notifications/check-overdue', function() {
        \Illuminate\Support\Facades\Artisan::call('app:check-overdue-requests');
        $output = \Illuminate\Support\Facades\Artisan::output();
        return response()->json([
            'message' => 'Overdue check completed',
            'output' => $output
        ]);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    // Request routes
    Route::get('/requests', [RequestItemController::class, 'index']);
    Route::post('/requests', [RequestItemController::class, 'store']);
    Route::put('/requests/{requestItem}', [RequestItemController::class, 'update']);
    Route::delete('/requests/{requestItem}', [RequestItemController::class, 'destroy']);
});
