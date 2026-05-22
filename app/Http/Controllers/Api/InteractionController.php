<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ContactInteractionNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class InteractionController extends Controller
{
    public function notify(Request $request)
    {
        $request->validate([
            'type' => ['required', 'in:call,whatsapp'],
            'page' => ['nullable', 'string', 'max:255'],
        ]);

        $type = $request->input('type');
        $page = $request->input('page');
        $user = $request->user();

        $recipients = User::whereIn('role', ['admin'])->get();

        Notification::send($recipients, new ContactInteractionNotification($type, $user, $page));

        return response()->json(['message' => 'ok']);
    }
}
