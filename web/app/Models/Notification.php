<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_email',
        'type',
        'title',
        'message',
        'action_type',
        'related_id',
        'is_read',
        'read_at'
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    /**
     * Scope to get unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope to get notifications for a specific user
     */
    public function scopeForUser($query, $email)
    {
        return $query->where('user_email', $email);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now()
        ]);
    }

    /**
     * Create a notification for successful item request
     */
    public static function createItemRequestSuccess($userEmail, $itemName, $requestId = null)
    {
        return self::create([
            'user_email' => $userEmail,
            'type' => 'success',
            'title' => 'Item Request Submitted!',
            'message' => "Your request for {$itemName} has been submitted successfully.",
            'action_type' => 'item_request',
            'related_id' => $requestId
        ]);
    }

    /**
     * Create a notification for successful room request
     */
    public static function createRoomRequestSuccess($userEmail, $roomName, $requestId = null)
    {
        return self::create([
            'user_email' => $userEmail,
            'type' => 'success',
            'title' => 'Room Request Submitted!',
            'message' => "Your booking for {$roomName} has been submitted successfully.",
            'action_type' => 'room_request',
            'related_id' => $requestId
        ]);
    }

    /**
     * Create a notification for successful cancellation
     */
    public static function createCancellationSuccess($userEmail, $type, $name, $requestId = null)
    {
        $actionType = $type === 'item' ? 'cancel_item' : 'cancel_room';
        $itemType = $type === 'item' ? 'item' : 'room';
        
        return self::create([
            'user_email' => $userEmail,
            'type' => 'success',
            'title' => 'Request Cancelled!',
            'message' => "Your {$itemType} request for {$name} has been cancelled successfully.",
            'action_type' => $actionType,
            'related_id' => $requestId
        ]);
    }

    /**
     * Create a notification for booking conflicts
     */
    public static function createBookingConflict($userEmail, $roomName, $requestId = null)
    {
        return self::create([
            'user_email' => $userEmail,
            'type' => 'warning',
            'title' => 'Room Fully Booked',
            'message' => "{$roomName} is fully booked for the selected time range. Please choose a different time or room.",
            'action_type' => 'room_request',
            'related_id' => $requestId
        ]);
    }

    /**
     * Create a notification for item return
     */
    public static function createItemReturned($userEmail, $itemName, $requestId = null)
    {
        return self::create([
            'user_email' => $userEmail,
            'type' => 'success',
            'title' => 'Request Returned',
            'message' => "The item is returned thank you",
            'action_type' => 'item_returned',
            'related_id' => $requestId
        ]);
    }

    /**
     * Create a notification for room returned
     */
    public static function createRoomReturned($userEmail, $roomName, $requestId = null)
    {
        return self::create([
            'user_email' => $userEmail,
            'type' => 'success',
            'title' => 'Request Returned',
            'message' => "The item is returned thank you",
            'action_type' => 'room_returned',
            'related_id' => $requestId
        ]);
    }
}
