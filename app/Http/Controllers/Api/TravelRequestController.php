<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TravelRequestMail;
use App\Models\TravelRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class TravelRequestController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'committeeName' => 'required|string|max:255',
            'memberCount' => 'required|string|max:10',
            'civility' => 'required|string|max:10',
            'lastName' => 'required|string|max:255',
            'firstName' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'required|email|max:255',
            'message' => 'required|string|max:5000',
        ]);

        $travelRequest = TravelRequest::create([
            'committee_name' => $validated['committeeName'],
            'member_count' => $validated['memberCount'],
            'civility' => $validated['civility'],
            'last_name' => $validated['lastName'],
            'first_name' => $validated['firstName'],
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        // Send notification email to admin
        try {
            Mail::to(config('mail.admin_address', config('mail.from.address')))
                ->send(new TravelRequestMail($travelRequest));
        } catch (\Exception $e) {
            // Log the error but don't fail the request
            \Log::error('Failed to send travel request notification email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Your request has been submitted successfully.',
        ], 201);
    }
}
