<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RequestItem;
use App\Models\Item;
use App\Models\Notification;
use App\Services\Sms\SemaphoreSmsService;

class RequestItemController extends Controller
{
    public function index()
    {
        return RequestItem::with(['item', 'itemUnit'])->orderBy('created_at', 'desc')->get();
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
            'mobile' => 'nullable|string|max:20',
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
        // Find an available item unit for this request
        $availableUnit = \App\Models\ItemUnit::where('item_id', $item->id)
            ->where('status', 'available')
            ->whereNotIn('id', function($query) use ($data) {
                $query->select('item_unit_id')
                    ->from('requests')
                    ->where('date', $data['date'])
                    ->where('item_unit_id', '!=', null)
                    ->where(function ($q) use ($data) {
                        $q->where('time_in', '<', $data['time_out'])
                          ->where('time_out', '>', $data['time_in']);
                    });
            })
            ->first();

        // Assign the available unit to the request
        if ($availableUnit) {
            $data['item_unit_id'] = $availableUnit->id;
            // Mark the unit as borrowed
            $availableUnit->update(['status' => 'borrowed']);
        }

        $requestItem = RequestItem::create($data);

        return response()->json($requestItem->load(['item', 'itemUnit']), 201);
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
     * Mark an item as returned
     */
    public function return($id)
    {
        try {
            $requestItem = RequestItem::with('itemUnit')->findOrFail($id);
            $requestItem->update(['returned' => true]);
            
            // Mark the item unit as available again
            if ($requestItem->itemUnit) {
                $requestItem->itemUnit->update(['status' => 'available']);
            }
            
            // Create notification for the user about item return
            if ($requestItem->email) {
                \Illuminate\Support\Facades\Log::info('Creating notification for item return', [
                    'user_email' => $requestItem->email,
                    'item_name' => $requestItem->item->name,
                    'request_id' => $requestItem->id
                ]);
                
                try {
                    $notification = Notification::createItemReturned(
                        $requestItem->email,
                        $requestItem->item->name,
                        $requestItem->id
                    );
                    \Illuminate\Support\Facades\Log::info('Notification created successfully', [
                        'notification_id' => $notification->id,
                        'user_email' => $notification->user_email
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to create notification', [
                        'error' => $e->getMessage(),
                        'user_email' => $requestItem->email
                    ]);
                }
            } else {
                \Illuminate\Support\Facades\Log::warning('No email found for request item', [
                    'request_id' => $requestItem->id,
                    'request_data' => $requestItem->toArray()
                ]);
            }
            
            // Log the update for debugging
            \Illuminate\Support\Facades\Log::info('Item marked as returned', [
                'id' => $id,
                'returned' => $requestItem->returned,
                'updated_at' => $requestItem->updated_at,
                'notification_created' => $requestItem->email ? 'yes' : 'no'
            ]);
            
            return response()->json(['message' => 'Item marked as returned', 'id' => $id, 'returned' => $requestItem->returned]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to mark item as returned', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Failed to mark item as returned', 'error' => $e->getMessage()], 500);
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

    /**
     * Send overdue notification for an item request
     */
    public function sendOverdueNotification($id, SemaphoreSmsService $sms)
    {
        try {
            $requestItem = RequestItem::with('item')->findOrFail($id);
            
            // Create overdue notification for the user
            if ($requestItem->email) {
                \Illuminate\Support\Facades\Log::info('Creating overdue notification for item', [
                    'user_email' => $requestItem->email,
                    'item_name' => $requestItem->item->name,
                    'request_id' => $requestItem->id
                ]);
                
                try {
                    $notification = Notification::createOverdueItem(
                        $requestItem->email,
                        $requestItem->item->name,
                        $requestItem->id
                    );
                    \Illuminate\Support\Facades\Log::info('Overdue notification created successfully', [
                        'notification_id' => $notification->id,
                        'user_email' => $notification->user_email
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Failed to create overdue notification', [
                        'error' => $e->getMessage(),
                        'user_email' => $requestItem->email
                    ]);
                    return response()->json(['message' => 'Failed to create overdue notification', 'error' => $e->getMessage()], 500);
                }
            } else {
                \Illuminate\Support\Facades\Log::warning('No email found for request item', [
                    'request_id' => $requestItem->id,
                    'request_data' => $requestItem->toArray()
                ]);
                // don't fail here; proceed to SMS if possible
            }
            
            // Send SMS if mobile is available and not already sent
            if ($requestItem->mobile && ! $requestItem->overdue_sms_sent_at) {
                $message = sprintf(
                    'Reminder: %s borrowed on %s from %s to %s is overdue. Please return it immediately.',
                    $requestItem->item?->name ?? 'an item',
                    optional($requestItem->date)->format('Y-m-d'),
                    $requestItem->time_in,
                    $requestItem->time_out
                );
                if ($sms->send($requestItem->mobile, $message)) {
                    $requestItem->overdue_sms_sent_at = now();
                    $requestItem->save();
                }
            }

            return response()->json([
                'message' => 'Overdue notification sent successfully',
                'id' => $id,
                'item_name' => $requestItem->item->name,
                'user_email' => $requestItem->email,
                'sms_sent' => (bool) $requestItem->overdue_sms_sent_at,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send overdue notification', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['message' => 'Failed to send overdue notification', 'error' => $e->getMessage()], 500);
        }
    }
}
