<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\RequestItem;
use App\Services\Sms\SemaphoreSmsService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class SendOverdueSms extends Command
{
    protected $signature = 'requests:send-overdue-sms';
    protected $description = 'Send SMS to borrowers whose borrowed items are overdue';

    public function handle(SemaphoreSmsService $sms): int
    {
        $now = now();

        $overdue = RequestItem::with('item')
            ->where('returned', false)
            ->whereNull('overdue_sms_sent_at')
            ->where(function ($q) use ($now) {
                $q->whereDate('date', '<', $now->toDateString())
                  ->orWhere(function ($q2) use ($now) {
                      $q2->whereDate('date', $now->toDateString())
                         ->where('time_out', '<=', $now->format('H:i:s'));
                  });
            })
            ->get();

        $count = 0;
        foreach ($overdue as $request) {
            if (! $request->mobile) {
                Log::warning('Skipping SMS, no mobile number', ['request_id' => $request->id]);
                continue;
            }

            $message = sprintf(
                'Reminder: %s borrowed on %s from %s to %s is overdue. Please return it immediately.',
                $request->item?->name ?? 'an item',
                optional($request->date)->format('Y-m-d'),
                $request->time_in,
                $request->time_out
            );

            if ($sms->send($request->mobile, $message)) {
                $request->overdue_sms_sent_at = now();
                $request->save();
                $count++;
            }
        }

        $this->info("Overdue SMS sent: {$count}");
        return self::SUCCESS;
    }
}


