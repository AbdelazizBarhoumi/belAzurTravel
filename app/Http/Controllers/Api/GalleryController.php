<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index()
    {
        return response()->json(GalleryImage::latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'caption' => 'nullable|array',
            'title' => 'nullable|array',
            'category' => 'nullable|string',
            'image' => 'required|image|max:10240',
        ]);

        // Store uploaded image on the public disk and save a publicly
        // accessible URL in the `url` column (via the storage symlink).
        $path = $request->file('image')->store('uploads/gallery', 'public');
        $url = '/storage/'.$path;

        $model = GalleryImage::create([
            'url' => $url,
            'caption' => $data['caption'] ?? null,
            'title' => $data['title'] ?? null,
            'category' => $data['category'] ?? null,
        ]);

        return response()->json($model);
    }

    public function update(Request $request, GalleryImage $galleryImage)
    {
        $data = $request->validate([
            'caption' => 'nullable|array',
            'title' => 'nullable|array',
            'category' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $request->validate(['image' => 'nullable|image|max:10240']);

            // Delete old file
            $oldPath = str_replace('/storage/', '', $galleryImage->url);
            Storage::disk('public')->delete($oldPath);

            $path = $request->file('image')->store('uploads/gallery', 'public');
            $data['url'] = '/storage/'.$path;
        }

        $galleryImage->update($data);

        return response()->json($galleryImage);
    }

    public function destroy(GalleryImage $galleryImage)
    {
        $path = str_replace('/storage/', '', $galleryImage->url);
        Storage::disk('public')->delete($path);

        $galleryImage->delete();

        return response()->json(['message' => __('messages.image_deleted')]);
    }
}
