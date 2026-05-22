<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $models = [
            \App\Models\Destination::class => ['image', 'details->gallery'],
            \App\Models\Hotel::class => ['image', 'details->gallery'],
            \App\Models\Tour::class => ['image', 'images'],
            \App\Models\Car::class => ['image', 'details->gallery'],
            \App\Models\Event::class => ['image', 'details->gallery'],
            \App\Models\BlogPost::class => ['image'],
            \App\Models\GalleryImage::class => ['url'],
            \App\Models\Team::class => ['image_path'],
        ];

        foreach ($models as $modelClass => $fields) {
            if (!class_exists($modelClass)) continue;
            
            $items = $modelClass::all();
            foreach ($items as $item) {
                $updated = false;
                foreach ($fields as $field) {
                    if (str_contains($field, '->')) {
                        [$jsonField, $key] = explode('->', $field);
                        $data = $item->{$jsonField};
                        if (isset($data[$key]) && is_array($data[$key])) {
                            $newArray = [];
                            foreach ($data[$key] as $path) {
                                $newPath = $this->normalizePath($path);
                                if ($newPath !== $path) {
                                    $newArray[] = $newPath;
                                    $updated = true;
                                } else {
                                    $newArray[] = $path;
                                }
                            }
                            if ($updated) {
                                $data[$key] = $newArray;
                                $item->{$jsonField} = $data;
                            }
                        }
                    } else {
                        $path = $item->{$field};
                        $newPath = $this->normalizePath($path);
                        if ($newPath !== $path) {
                            $item->{$field} = $newPath;
                            $updated = true;
                        }
                    }
                }
                if ($updated) {
                    $item->save();
                }
            }
        }
    }

    private function normalizePath($path)
    {
        if (!$path || !is_string($path)) return $path;
        
        $p = trim($path);
        
        // Convert /images/ to /storage/uploads/seed/
        if (str_starts_with($p, '/images/')) {
            return '/storage/uploads/seed/' . basename($p);
        }
        
        if (str_starts_with($p, 'images/')) {
            return '/storage/uploads/seed/' . basename($p);
        }

        // Ensure leading slash for storage paths
        if (str_starts_with($p, 'storage/')) {
            return '/' . $p;
        }

        // If it's a relative path without leading slash, and not a URL, add leading slash
        if ($p !== '' && !str_starts_with($p, '/') && !str_starts_with($p, 'http')) {
            return '/' . $p;
        }
        
        return $p;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reversing this accurately is complex and usually not needed for path normalization
    }
};
