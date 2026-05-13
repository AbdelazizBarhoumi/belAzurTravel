<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;

class SiteSettingsController extends Controller
{
    public function show()
    {
        // Try to read from DB first
        try {
            $row = SiteSetting::first();
            if ($row) {
                return response()->json([
                    'companyName' => $row->company_name,
                    'email' => $row->email,
                    'phone' => $row->phone,
                    'whatsapp' => $row->whatsapp,
                    'address' => $row->address,
                    'year' => $row->year,
                ]);
            }
        } catch (\Exception $e) {
            // ignore and fall back to config
        }

        // fallback to config
        return response()->json([
            'companyName' => config('site.company_name'),
            'email' => config('site.email'),
            'phone' => config('site.phone'),
            'whatsapp' => config('site.whatsapp'),
            'address' => config('site.address'),
            'year' => config('site.year'),
        ]);
    }

    public function update()
    {
        $data = request()->validate([
            'companyName' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:64'],
            'whatsapp' => ['nullable', 'string', 'max:64'],
            'address' => ['nullable', 'string', 'max:512'],
            'year' => ['nullable', 'integer'],
        ]);

        // write to DB (create or update first row)
        try {
            $row = SiteSetting::first();
            if ($row) {
                $row->update([
                    'company_name' => $data['companyName'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'whatsapp' => $data['whatsapp'] ?? null,
                    'address' => $data['address'] ?? null,
                    'year' => $data['year'] ?? date('Y'),
                ]);
            } else {
                SiteSetting::create([
                    'company_name' => $data['companyName'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'whatsapp' => $data['whatsapp'] ?? null,
                    'address' => $data['address'] ?? null,
                    'year' => $data['year'] ?? date('Y'),
                ]);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to save settings'], 500);
        }

        return response()->json(['message' => 'ok']);
    }
}
