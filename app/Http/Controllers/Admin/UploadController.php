<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'image'  => 'required|image|max:10240',
            'folder' => 'nullable|string|max:50',
        ]);

        $folder = $data['folder'] ?? 'general';
        File::ensureDirectoryExists(storage_path("app/public/uploads/{$folder}"));
        $path = $request->file('image')->store("uploads/{$folder}", 'public');

        return response()->json([
            'url' => '/storage/'.$path,
        ]);
    }
}
