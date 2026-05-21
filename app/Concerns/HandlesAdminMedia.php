<?php

namespace App\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

trait HandlesAdminMedia
{
    /**
     * Decode JSON fields that might be sent as strings in multipart/form-data.
     */
    protected function decodeJsonFields(Request $request, array $fields): void
    {
        foreach ($fields as $field) {
            $value = $request->input($field);
            if (is_string($value) && (str_starts_with($value, '[') || str_starts_with($value, '{'))) {
                try {
                    $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
                    $request->merge([$field => $decoded]);
                } catch (\JsonException $e) {
                    // Not valid JSON, leave as is
                }
            }
        }
    }

    /**
     * Handle main image upload or path.
     */
    protected function handleMainImage(Request $request, ?string $existingImage = null, string $folder = 'uploads'): string
    {
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store($folder, 'public');
            return 'storage/' . $path;
        }

        $incoming = $request->input('image');
        if (is_string($incoming)) {
            $trimmed = $this->normalizeStoredMediaPath($incoming);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        return $this->normalizeStoredMediaPath($existingImage);
    }

    /**
     * Normalize stored media paths from either relative storage paths or full URLs.
     */
    protected function normalizeStoredMediaPath(?string $path): string
    {
        if (! is_string($path)) {
            return '';
        }

        $trimmed = trim($path);
        if ($trimmed === '') {
            return '';
        }

        $parsedPath = parse_url($trimmed, PHP_URL_PATH);
        if (is_string($parsedPath) && $parsedPath !== '') {
            $trimmed = $parsedPath;
        }

        return ltrim($trimmed, '/');
    }

    /**
     * Handle gallery uploads and merge with existing paths.
     */
    protected function handleGallery(Request $request, array $existingGallery = [], string $folder = 'uploads'): array
    {
        $hasGalleryPayload = $request->has('gallery') || $request->hasFile('gallery_files');

        if (! $hasGalleryPayload) {
            return $existingGallery;
        }

        $gallery = $request->input('gallery', []);
        
        // If gallery is a string (legacy or manual input), split it
        if (is_string($gallery)) {
            $gallery = $this->splitLines($gallery);
        }

        if (!is_array($gallery)) {
            $gallery = [];
        }

        if ($request->hasFile('gallery_files')) {
            $uploads = collect($request->file('gallery_files'))
                ->filter()
                ->map(fn($file) => 'storage/' . $file->store($folder, 'public'))
                ->all();
            
            $gallery = array_merge($gallery, $uploads);
        }

        $gallery = array_map(
            fn (mixed $image): string => $this->normalizeStoredMediaPath(is_string($image) ? $image : ''),
            $gallery,
        );

        return array_values(array_unique(array_filter($gallery)));
    }

    /**
     * Helper to split newline-separated lines.
     */
    protected function splitLines(?string $value): array
    {
        if (!$value) {
            return [];
        }
        return array_values(array_filter(array_map(static fn (string $line): string => trim($line), preg_split('/\r\n|\r|\n/', $value) ?: []), static fn (string $line): bool => $line !== ''));
    }
}
