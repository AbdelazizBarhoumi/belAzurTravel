<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Partner;

class PartnerController extends Controller
{
    use HandlesAdminMedia;

    public function index()
    {
        return Partner::all()->map(function ($partner) {
            return [
                'id' => (int) $partner->id,
                'name' => $partner->name,
                'description' => $partner->description,
                'website' => $partner->website,
                'category' => $partner->category,
                'logo' => $this->normalizeApiOutputPath($partner->logo_path),
            ];
        });
    }
}
