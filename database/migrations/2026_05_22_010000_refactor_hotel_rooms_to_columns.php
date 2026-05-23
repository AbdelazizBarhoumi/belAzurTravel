<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotel_rooms', function (Blueprint $table): void {
            $table->string('name_en')->nullable()->after('hotel_id');
            $table->string('name_fr')->nullable()->after('name_en');
            $table->string('name_ar')->nullable()->after('name_fr');
            $table->text('description_en')->nullable()->after('name_ar');
            $table->text('description_fr')->nullable()->after('description_en');
            $table->text('description_ar')->nullable()->after('description_fr');
        });

        Schema::create('hotel_room_features', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hotel_room_id')->constrained('hotel_rooms')->cascadeOnDelete();
            $table->string('label');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('hotel_room_images', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hotel_room_id')->constrained('hotel_rooms')->cascadeOnDelete();
            $table->string('path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        DB::table('hotel_rooms')->chunkById(100, function ($rooms): void {
            foreach ($rooms as $room) {
                $name = $this->normalizeLocalized($room->name ?? null);
                $description = $this->normalizeLocalized($room->description ?? null);

                DB::table('hotel_rooms')
                    ->where('id', $room->id)
                    ->update([
                        'name_en' => $name['en'],
                        'name_fr' => $name['fr'],
                        'name_ar' => $name['ar'],
                        'description_en' => $description['en'],
                        'description_fr' => $description['fr'],
                        'description_ar' => $description['ar'],
                    ]);

                foreach ($this->normalizeList($room->features ?? null) as $index => $feature) {
                    DB::table('hotel_room_features')->insert([
                        'hotel_room_id' => $room->id,
                        'label' => $feature,
                        'sort_order' => $index,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                foreach ($this->normalizeList($room->images ?? null) as $index => $image) {
                    DB::table('hotel_room_images')->insert([
                        'hotel_room_id' => $room->id,
                        'path' => $image,
                        'sort_order' => $index,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });

        Schema::table('hotel_rooms', function (Blueprint $table): void {
            $table->dropColumn(['name', 'description', 'features', 'images']);
        });
    }

    public function down(): void
    {
        Schema::table('hotel_rooms', function (Blueprint $table): void {
            $table->json('name')->nullable();
            $table->json('description')->nullable();
            $table->json('features')->nullable();
            $table->json('images')->nullable();
        });

        DB::table('hotel_rooms')->chunkById(100, function ($rooms): void {
            foreach ($rooms as $room) {
                DB::table('hotel_rooms')
                    ->where('id', $room->id)
                    ->update([
                        'name' => json_encode([
                            'en' => $room->name_en ?? '',
                            'fr' => $room->name_fr ?? '',
                            'ar' => $room->name_ar ?? '',
                        ]),
                        'description' => json_encode([
                            'en' => $room->description_en ?? '',
                            'fr' => $room->description_fr ?? '',
                            'ar' => $room->description_ar ?? '',
                        ]),
                        'features' => json_encode(DB::table('hotel_room_features')->where('hotel_room_id', $room->id)->orderBy('sort_order')->pluck('label')->all()),
                        'images' => json_encode(DB::table('hotel_room_images')->where('hotel_room_id', $room->id)->orderBy('sort_order')->pluck('path')->all()),
                    ]);
            }
        });

        Schema::dropIfExists('hotel_room_images');
        Schema::dropIfExists('hotel_room_features');

        Schema::table('hotel_rooms', function (Blueprint $table): void {
            $table->dropColumn([
                'name_en',
                'name_fr',
                'name_ar',
                'description_en',
                'description_fr',
                'description_ar',
            ]);
        });
    }

    private function normalizeLocalized(mixed $value): array
    {
        if (is_array($value)) {
            return [
                'en' => (string) ($value['en'] ?? $value['fr'] ?? $value['ar'] ?? ''),
                'fr' => (string) ($value['fr'] ?? $value['en'] ?? $value['ar'] ?? ''),
                'ar' => (string) ($value['ar'] ?? $value['en'] ?? $value['fr'] ?? ''),
            ];
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return $this->normalizeLocalized($decoded);
            }

            $text = trim($value);

            return ['en' => $text, 'fr' => $text, 'ar' => $text];
        }

        return ['en' => '', 'fr' => '', 'ar' => ''];
    }

    /** @return array<int, string> */
    private function normalizeList(mixed $value): array
    {
        if (is_string($value)) {
            $value = preg_split('/\r\n|\r|\n/', $value) ?: [];
        }

        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(function (mixed $item): string {
            if (is_string($item) || is_numeric($item)) {
                return trim((string) $item);
            }

            if (is_array($item)) {
                foreach (['label', 'name', 'value', 'en', 'fr', 'ar'] as $key) {
                    if (isset($item[$key]) && (is_string($item[$key]) || is_numeric($item[$key]))) {
                        $text = trim((string) $item[$key]);
                        if ($text !== '') {
                            return $text;
                        }
                    }
                }
            }

            return '';
        }, $value), static fn (string $item): bool => $item !== ''));
    }
};
