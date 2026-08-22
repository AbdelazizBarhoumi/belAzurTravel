<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportInquiry;
use App\Models\User;
use App\Notifications\SupportReplyNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin management of client support inquiries.
 */
class AdminSupportInquiryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SupportInquiry::query()->latest();

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->get()->map(fn (SupportInquiry $inquiry) => $this->payload($inquiry)));
    }

    public function update(Request $request, SupportInquiry $inquiry): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:new,in-progress,resolved'],
            'priority' => ['sometimes', 'in:low,medium,high'],
        ]);

        $inquiry->update([
            ...$data,
            'assigned_to' => $request->user()->id,
            'resolved_at' => ($data['status'] ?? null) === 'resolved' ? now() : null,
        ]);

        return response()->json($this->payload($inquiry->refresh()));
    }

    public function reply(Request $request, SupportInquiry $inquiry): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $replies = $inquiry->replies ?? [];
        $replies[] = [
            'author_id' => $request->user()->id,
            'author' => $request->user()->name,
            'message' => $data['message'],
            'created_at' => now()->toJSON(),
        ];

        $inquiry->update([
            'assigned_to' => $request->user()->id,
            'status' => $inquiry->status === 'new' ? 'in-progress' : $inquiry->status,
            'replies' => $replies,
        ]);

        $client = User::query()->find($inquiry->user_id);
        if ($client) {
            $client->notify(new SupportReplyNotification($inquiry, $request->user()));
        }

        return response()->json($this->payload($inquiry->refresh()));
    }

    /** @return array<string, mixed> */
    private function payload(SupportInquiry $inquiry): array
    {
        return [
            'id' => $inquiry->id,
            'user_id' => $inquiry->user_id,
            'client' => $inquiry->client,
            'subject' => $inquiry->subject,
            'message' => $inquiry->message,
            'status' => $inquiry->status,
            'priority' => $inquiry->priority,
            'replies' => $inquiry->replies ?? [],
            'assigned_to' => $inquiry->assigned_to,
            'resolved_at' => $inquiry->resolved_at?->toJSON(),
            'created_at' => $inquiry->created_at?->toJSON(),
        ];
    }
}
