<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RoomRequest;
use App\Models\Room;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoomRequestController extends Controller
{
    public function index()
    {
        return RoomRequest::with('room')->orderByDesc('created_at')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'borrower_id' => 'required|string|max:255',
            'year'        => 'required|string|max:50',
            'department'  => ['required','string', Rule::in(['CEIT','COT','CTE','CAS'])],
            'course'      => 'required|string|max:100',
            'date'        => 'required|date',
            'email'       => 'nullable|email|max:255',
            'mobile'      => 'nullable|string|max:20',
            'time_in'     => 'required|date_format:H:i',
            'time_out'    => 'required|date_format:H:i|after:time_in',
            'room_id'     => 'required|exists:rooms,id',
        ]);

        // Check overlapping bookings (pending/approved) for the same room + date
        $overlaps = RoomRequest::where('room_id', $data['room_id'])
            ->where('date', $data['date'])
            ->whereIn('status', ['pending','approved'])
            ->where(function ($q) use ($data) {
                $q->whereBetween('time_in', [$data['time_in'], $data['time_out']])
                  ->orWhereBetween('time_out', [$data['time_in'], $data['time_out']])
                  ->orWhere(function ($qq) use ($data) {
                      $qq->where('time_in', '<=', $data['time_in'])
                         ->where('time_out', '>=', $data['time_out']);
                  });
            })
            ->count();

        $room = Room::findOrFail($data['room_id']);
        if ($overlaps >= $room->quantity) {
            return response()->json([
                'message' => 'Room is fully booked for the selected time range.'
            ], 422);
        }
        // Prefer authenticated user's email if available
        if (auth()->check() && auth()->user()->email) {
            $data['email'] = auth()->user()->email;
        }

        $req = RoomRequest::create($data);
        return $req->load('room');
    }

    public function update(Request $request, RoomRequest $roomRequest)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending','approved','rejected','cancelled'])],
        ]);
        $roomRequest->update($data);
        return $roomRequest->load('room');
    }

    public function destroy(RoomRequest $roomRequest)
    {
   $roomRequest->delete();
    return response()->json(['message' => 'Room request deleted successfully']);
}

    /**
     * Mark a room request as returned
     */
    public function return($id)
    {
        try {
            $roomRequest = RoomRequest::findOrFail($id);
            $roomRequest->update(['returned' => true]);
            
            // Create notification for the user about room return
            if ($roomRequest->email) {
                \Illuminate\Support\Facades\Log::info('Creating notification for room return', [
                    'user_email' => $roomRequest->email,
                    'room_name' => $roomRequest->room->name,
                    'request_id' => $roomRequest->id
                ]);
                
                try {
                    $notification = Notification::createRoomReturned(
                        $roomRequest->email,
                        $roomRequest->room->name,
                        $roomRequest->id
                    );
                    \Illuminate\Support\Facades\Log::info('Notification created successfully', [
                        'notification_id' => $notification->id,
                        'user_email' => $notification->user_email
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to create notification', [
                        'error' => $e->getMessage(),
                        'user_email' => $roomRequest->email
                    ]);
                }
            } else {
                \Illuminate\Support\Facades\Log::warning('No email found for room request', [
                    'request_id' => $roomRequest->id,
                    'request_data' => $roomRequest->toArray()
                ]);
            }
            
            // Log the update for debugging
            \Illuminate\Support\Facades\Log::info('Room marked as returned', [
                'id' => $id,
                'returned' => $roomRequest->returned,
                'updated_at' => $roomRequest->updated_at,
                'notification_created' => $roomRequest->email ? 'yes' : 'no'
            ]);
            
            return response()->json(['message' => 'Room marked as returned', 'id' => $id, 'returned' => $roomRequest->returned]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to mark room as returned', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Failed to mark room as returned', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Send overdue notification for a room request
     */
    public function sendOverdueNotification($id)
    {
        try {
            $roomRequest = RoomRequest::with('room')->findOrFail($id);
            
            // Create overdue notification for the user
            if ($roomRequest->email) {
                \Illuminate\Support\Facades\Log::info('Creating overdue notification for room', [
                    'user_email' => $roomRequest->email,
                    'room_name' => $roomRequest->room->name,
                    'request_id' => $roomRequest->id
                ]);
                
                try {
                    $notification = Notification::createOverdueRoom(
                        $roomRequest->email,
                        $roomRequest->room->name,
                        $roomRequest->id
                    );
                    \Illuminate\Support\Facades\Log::info('Overdue notification created successfully', [
                        'notification_id' => $notification->id,
                        'user_email' => $notification->user_email
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to create overdue notification', [
                        'error' => $e->getMessage(),
                        'user_email' => $roomRequest->email
                    ]);
                    return response()->json(['message' => 'Failed to create overdue notification', 'error' => $e->getMessage()], 500);
                }
            } else {
                \Illuminate\Support\Facades\Log::warning('No email found for room request', [
                    'request_id' => $roomRequest->id,
                    'request_data' => $roomRequest->toArray()
                ]);
                return response()->json(['message' => 'No email found for this request'], 400);
            }
            
            return response()->json([
                'message' => 'Overdue notification sent successfully',
                'id' => $id,
                'room_name' => $roomRequest->room->name,
                'user_email' => $roomRequest->email
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send overdue notification', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Failed to send overdue notification', 'error' => $e->getMessage()], 500);
        }
    }
}