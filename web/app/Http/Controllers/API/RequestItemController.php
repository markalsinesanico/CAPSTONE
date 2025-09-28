<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RequestItem;
use App\Models\Item;

class RequestItemController extends Controller
{
    public function index()
    {
        return RequestItem::with('item')->orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'borrower_id' => 'required|string|max:255',
            'year' => 'required|string|max:50',
            'department' => 'required|string|max:50',
            'course' => 'required|string|max:255',
            'date' => 'required|date',
            'email' => 'nullable|email|max:255',
            'time_in' => 'required',
            'time_out' => 'required',
            'item_id' => 'required|exists:items,id',
        ]);

        // If logged in user exists, prefer their email
        if (auth()->check() && auth()->user()->email) {
            $data['email'] = auth()->user()->email;
        }

        $item = Item::findOrFail($data['item_id']);

        // 🔎 Check overlapping requests for this item on the same date
        $overlappingRequests = RequestItem::where('item_id', $item->id)
            ->where('date', $data['date'])
            ->where(function ($q) use ($data) {
                $q->where(function ($sub) use ($data) {
                    // Overlap condition: existing start < new end AND existing end > new start
                    $sub->where('time_in', '<', $data['time_out'])
                        ->where('time_out', '>', $data['time_in']);
                });
            })
            ->count();

        // ❌ If requests exceed or equal available quantity → block
        if ($overlappingRequests >= $item->qty) {
            return response()->json([
                'message' => 'This item is already fully booked during the selected time slot.'
            ], 422);
        }

        // ✅ Otherwise → create request
        $requestItem = RequestItem::create($data);

        return response()->json($requestItem->load('item'), 201);
    }

    public function show(RequestItem $requestItem)
    {
        return $requestItem->load('item');
    }

    public function update(Request $request, RequestItem $requestItem)
    {
        $data = $request->validate([
            'status' => 'required|string',
        ]);
        $requestItem->update($data);
        return response()->json($requestItem);
    }

    public function markAsReturned(RequestItem $requestItem)
    {
        $requestItem->update(['returned' => true]);
        return response()->json($requestItem->load('item'));
    }

    // Use id param instead of implicit model binding to make delete more robust
    public function destroy($id)
    {
        try {
            // Log who called and include the raw Authorization header for debugging
            \Illuminate\Support\Facades\Log::info('RequestItem destroy called', [
                'user_id' => auth()->id(),
                'route_param' => $id,
                'authorization_header' => request()->header('authorization'),
            ]);

            $requestItem = RequestItem::find($id);
            if (! $requestItem) {
                \Illuminate\Support\Facades\Log::warning('RequestItem not found for delete', ['route_param' => $id]);
                return response()->json(['message' => 'Request not found'], 404);
            }

            $requestItem->delete();

            \Illuminate\Support\Facades\Log::info('RequestItem deleted', ['request_id' => $id, 'deleted_by' => auth()->id()]);

            return response()->json(['message' => 'Request deleted', 'id' => $id]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to delete RequestItem', ['error' => $e->getMessage(), 'route_param' => $id]);
            return response()->json(['message' => 'Failed to delete request', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Optional: Check availability before requesting
     */
    public function checkAvailability(Request $request, $itemId)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'time_in' => 'required',
            'time_out' => 'required',
        ]);

        $item = Item::findOrFail($itemId);

        $overlappingRequests = RequestItem::where('item_id', $item->id)
            ->where('date', $data['date'])
            ->where(function ($q) use ($data) {
                $q->where('time_in', '<', $data['time_out'])
                    ->where('time_out', '>', $data['time_in']);
            })
            ->count();

        $available = $overlappingRequests < $item->qty;

        return response()->json([
            'available' => $available,
            'remaining' => max(0, $item->qty - $overlappingRequests),
            'total_qty' => $item->qty,
        ]);
    }
}
