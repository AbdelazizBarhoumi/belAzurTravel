<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use Illuminate\Http\Request;

class GalleryController extends Controller
{
    public function index()
    {
        return response()->json(GalleryImage::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'caption' => 'nullable|array',
            'sort_order' => 'nullable|integer',
            'image' => 'required|image|max:10240',
        ]);

        // Store uploaded image on the public disk and save a publicly
        // accessible URL in the `url` column (via the storage symlink).
        $path = $request->file('image')->store('gallery', 'public');
        $url = '/storage/' . $path;

        $model = GalleryImage::create([
            'url' => $url,
            'caption' => $data['caption'] ?? null,
            'sort_order' => $data['sort_order'] ?? null,
        ]);

        return response()->json($model);
    }

    public function update(Request $request, GalleryImage $galleryImage)
    {
        $data = $request->validate([
            'caption' => 'nullable|array',
            'sort_order' => 'nullable|integer',
            'image' => 'nullable|image|max:10240',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('gallery', 'public');
            $data['url'] = '/storage/' . $path;
        }

        $galleryImage->update($data);

        return response()->json($galleryImage);
    }

    public function destroy(GalleryImage $galleryImage)
    {
        $galleryImage->delete();

        return response()->json(['message' => 'Image deleted']);
    }
}
