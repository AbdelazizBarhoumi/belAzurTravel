<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VisaApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VisaApplicationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'visa_id' => 'required|exists:visas,id',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'passport_number' => 'required|string|max:30',
            'birth_date' => 'required|date',
            'travel_date' => 'required|date',
            'visa_type' => 'required|string|max:50',
            'previous_visa' => 'boolean',
            'passport_copy' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'notes' => 'nullable|string|max:1000',
        ]);

        $passportCopyPath = null;
        if ($request->hasFile('passport_copy')) {
            $passportCopyPath = $request->file('passport_copy')->store('uploads/visa_passports', 'public');
        }

        $application = VisaApplication::create([
            'visa_id' => $data['visa_id'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'passport_number' => $data['passport_number'],
            'birth_date' => $data['birth_date'],
            'travel_date' => $data['travel_date'],
            'visa_type' => $data['visa_type'],
            'previous_visa' => $data['previous_visa'] ?? false,
            'passport_copy_path' => $passportCopyPath,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Votre demande de visa a été envoyée avec succès.',
            'data' => $application,
        ], 201);
    }
}
