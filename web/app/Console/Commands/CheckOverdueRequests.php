<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RequestItem;
use App\Models\RoomRequest;
use App\Models\Notification;
use Carbon\Carbon;

class CheckOverdueRequests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-overdue-requests';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for overdue requests and send notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for overdue requests...');
        
        $now = Carbon::now();
        $overdueCount = 0;
        
        // Check overdue item requests
        $overdueItems = RequestItem::where('returned', false)
            ->where('date', '<=', $now->toDateString())
            ->whereHas('item')
            ->get()
            ->filter(function ($request) use ($now) {
                // Check if the end time has passed
                $endDateTime = Carbon::createFromFormat('Y-m-d H:i', $request->date . ' ' . $request->time_out);
                return $now->greaterThan($endDateTime);
            });

        foreach ($overdueItems as $request) {
            // Check if we already sent a notification for this request
            $existingNotification = Notification::where('user_email', $request->email)
                ->where('action_type', 'overdue_item')
                ->where('related_id', $request->id)
                ->first();

            if (!$existingNotification && $request->email) {
                try {
                    Notification::createOverdueItem(
                        $request->email,
                        $request->item->name,
                        $request->id
                    );
                    $overdueCount++;
                    $this->info("Sent overdue notification for item: {$request->item->name} to {$request->email}");
                } catch (\Exception $e) {
                    $this->error("Failed to send notification for item {$request->id}: " . $e->getMessage());
                }
            }
        }

        // Check overdue room requests
        $overdueRooms = RoomRequest::where('returned', false)
            ->where('date', '<=', $now->toDateString())
            ->whereHas('room')
            ->get()
            ->filter(function ($request) use ($now) {
                // Check if the end time has passed
                $endDateTime = Carbon::createFromFormat('Y-m-d H:i', $request->date . ' ' . $request->time_out);
                return $now->greaterThan($endDateTime);
            });

        foreach ($overdueRooms as $request) {
            // Check if we already sent a notification for this request
            $existingNotification = Notification::where('user_email', $request->email)
                ->where('action_type', 'overdue_room')
                ->where('related_id', $request->id)
                ->first();

            if (!$existingNotification && $request->email) {
                try {
                    Notification::createOverdueRoom(
                        $request->email,
                        $request->room->name,
                        $request->id
                    );
                    $overdueCount++;
                    $this->info("Sent overdue notification for room: {$request->room->name} to {$request->email}");
                } catch (\Exception $e) {
                    $this->error("Failed to send notification for room {$request->id}: " . $e->getMessage());
                }
            }
        }

        $this->info("Process completed. Sent {$overdueCount} overdue notifications.");
        
        return Command::SUCCESS;
    }
}
