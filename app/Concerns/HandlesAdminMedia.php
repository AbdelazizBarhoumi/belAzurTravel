<?php

namespace App\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
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
            File::ensureDirectoryExists(storage_path("app/public/{$folder}"));
            $path = $request->file('image')->store($folder, 'public');

            // Store with a leading slash so saved values are '/storage/...'
            return '/storage/'.$path;
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
        $hadLeadingSlash = str_starts_with($trimmed, '/');
        if ($trimmed === '') {
            return '';
        }

        $parsedPath = parse_url($trimmed, PHP_URL_PATH);
        if (is_string($parsedPath) && $parsedPath !== '') {
            $trimmed = $parsedPath;
        }

        // If the path points to storage (public disk) we prefer to store it
        // without a leading slash (e.g. 'storage/uploads/...') so code that
        // expects that format continues to work when a full URL is provided.
        $noLeading = ltrim($trimmed, '/');

        if (str_starts_with($noLeading, 'storage/') || str_starts_with($noLeading, 'images/')) {
            // Preserve leading slash for values that originally included it
            // (typically uploaded files), otherwise keep storage/ without slash
            return $hadLeadingSlash ? ('/'.$noLeading) : $noLeading;
        }

        // Otherwise, do not accept legacy '/images/...' paths — only
        // storage-backed uploads are considered valid. Return empty
        // so callers will not expose legacy URLs.
        return '';
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

        if (! is_array($gallery)) {
            $gallery = [];
        }

        if ($request->hasFile('gallery_files')) {
            $uploads = collect($request->file('gallery_files'))
                ->filter()
                ->map(function ($file) use ($folder) {
                    File::ensureDirectoryExists(storage_path("app/public/{$folder}"));
                    return '/storage/'.$file->store($folder, 'public');
                })
                ->all();

            $gallery = array_merge($gallery, $uploads);
        }

        $gallery = array_map(
            function (mixed $image) {
                // Preserve numeric image IDs for galleries (referencing GalleryImage)
                if (is_int($image) || (is_string($image) && ctype_digit($image))) {
                    return is_string($image) ? (int) $image : $image;
                }

                if (is_string($image)) {
                    return $this->normalizeStoredMediaPath($image);
                }

                return '';
            },
            $gallery,
        );

        return array_values(array_unique(array_filter($gallery)));
    }

    /**
     * Helper to split newline-separated lines.
     */
    protected function splitLines(?string $value): array
    {
        if (! $value) {
            return [];
        }

        return array_values(array_filter(array_map(static fn (string $line): string => trim($line), preg_split('/\r\n|\r|\n/', $value) ?: []), static fn (string $line): bool => $line !== ''));
    }

    /**
     * Normalize stored media paths for API output.
     *
     * - If stored as "storage/<path>" or "/storage/<path>", return "/<path>"
     * - If stored as an absolute URL, return the path portion with a leading slash
     * - If stored as "images/..." or "/images/...", return with leading slash
     */
    protected function normalizeApiOutputPath(?string $path): ?string
    {
        if (! is_string($path) || trim($path) === '') {
            return null;
        }

        $p = trim($path);

        if (preg_match('#^https?://#i', $p)) {
            return $p;
        }

        // If it's a full URL, extract path
        $parsed = parse_url($p, PHP_URL_PATH);
        if (is_string($parsed) && $parsed !== '') {
            $p = $parsed;
        }

        // Normalize multiple slashes to a single slash
        $p = '/'.ltrim(preg_replace('#/+#', '/', $p), '/');

        $noLeading = ltrim($p, '/');

        // If path starts with /storage/, preserve it (tests expect stored
        // values like '/storage/uploads/...'). Keep single slashes.
        if (str_starts_with($p, '/storage/')) {
            return $p;
        }

        // If this is a simple filename (no directory separators), return it
        // without a leading slash so APIs that expect raw filenames keep them.
        if (strpos($noLeading, '/') === false) {
            return $noLeading;
        }

        return $p;
    }
}
