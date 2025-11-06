<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SemaphoreSmsService
{
    public function send(string $number, string $message): bool
    {
        $apikey = config('services.semaphore.apikey');
        $sender = config('services.semaphore.sender');
        $endpoint = config('services.semaphore.endpoint');

        if (! $apikey || ! $sender) {
            Log::error('Semaphore SMS config missing');
            return false;
        }

        try {
            $response = Http::asForm()->post($endpoint, [
                'apikey' => $apikey,
                'number' => $number,
                'message' => $message,
                'sendername' => $sender,
            ]);

            if ($response->successful()) {
                Log::info('Semaphore SMS sent', ['number' => $number]);
                return true;
            }

            Log::error('Semaphore SMS failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Semaphore SMS exception', ['error' => $e->getMessage()]);
        }

        return false;
    }
}


