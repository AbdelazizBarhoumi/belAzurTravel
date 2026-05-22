<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    use HandlesAdminMedia;

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Team::all()->map(function ($member) {
            return [
                'name' => $member->name,
                'role' => $member->role,
                'bio' => $member->bio,
                'image' => $this->normalizeApiOutputPath($member->image_path),
                'linkedin' => $member->linkedin,
                'twitter' => $member->twitter,
                'email' => $member->email,
            ];
        });
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
