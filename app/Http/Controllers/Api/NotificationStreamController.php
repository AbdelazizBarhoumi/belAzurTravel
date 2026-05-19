<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class NotificationStreamController extends Controller
{
    public function stream(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        $channel = "notifications:user:{$user->id}";

        return response()->stream(function () use ($channel) {
            // Subscribe will block and invoke the callback for each message
            Redis::subscribe([$channel], function ($message, $chan) {
                // Each published message is expected to be a JSON string
                echo "event: notification\n";
                echo "data: {$message}\n\n";
                @ob_flush();
                @flush();
            });
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
        ]);
    }
}
