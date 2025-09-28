<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\RoomRequest;
use App\Models\Room;
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
}