<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Get all distinct entity_types from existing categories
        $entityTypes = DB::table('categories')
            ->select('entity_type')
            ->distinct()
            ->pluck('entity_type');

        foreach ($entityTypes as $entityType) {
            // Get or create the "Category" type for this entity type
            $existingType = DB::table('category_types')
                ->where('entity_type', $entityType)
                ->where('key', 'category')
                ->first();

            if ($existingType) {
                $typeId = $existingType->id;
            } else {
                $typeId = DB::table('category_types')->insertGetId([
                    'entity_type' => $entityType,
                    'key' => 'category',
                    'label' => json_encode([
                        'en' => 'Category',
                        'fr' => 'Catégorie',
                        'ar' => 'فئة',
                    ]),
                    'sort_order' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Migrate existing categories to category_type_values (skip if already migrated)
            $categories = DB::table('categories')
                ->where('entity_type', $entityType)
                ->get();

            $keyToValueId = [];

            foreach ($categories as $cat) {
                $existingValue = DB::table('category_type_values')
                    ->where('category_type_id', $typeId)
                    ->where('key', $cat->key)
                    ->first();

                if ($existingValue) {
                    $keyToValueId[$cat->key] = $existingValue->id;
                } else {
                    $valueId = DB::table('category_type_values')->insertGetId([
                        'category_type_id' => $typeId,
                        'key' => $cat->key,
                        'name' => $cat->name,
                        'created_at' => $cat->created_at ?? now(),
                        'updated_at' => $cat->updated_at ?? now(),
                    ]);
                    $keyToValueId[$cat->key] = $valueId;
                }
            }

            // Get the table name for this entity type
            $tableName = $this->getTableName($entityType);
            if (! $tableName || ! DB::getSchemaBuilder()->hasTable($tableName)) {
                continue;
            }

            // Migrate entity assignments from category_key column (skip if already migrated)
            $entities = DB::table($tableName)
                ->whereNotNull('category_key')
                ->where('category_key', '!=', '')
                ->get();

            foreach ($entities as $entity) {
                $valueId = $keyToValueId[$entity->category_key] ?? null;
                if (! $valueId) {
                    continue;
                }

                $alreadyAssigned = DB::table('entity_category_assignments')
                    ->where('entity_type', $entityType)
                    ->where('entity_id', $entity->id)
                    ->where('category_type_id', $typeId)
                    ->exists();

                if (! $alreadyAssigned) {
                    DB::table('entity_category_assignments')->insert([
                        'entity_type' => $entityType,
                        'entity_id' => $entity->id,
                        'category_type_id' => $typeId,
                        'category_value_id' => $valueId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        DB::table('entity_category_assignments')->delete();
        DB::table('category_type_values')->delete();
        DB::table('category_types')->delete();
    }

    private function getTableName(string $entityType): ?string
    {
        return match ($entityType) {
            'destinations' => 'destinations',
            'hotels' => 'hotels',
            'tours' => 'tours',
            'cars' => 'cars',
            'events' => 'events',
            'deals' => 'deals',
            'blog' => 'blog_posts',
            'partners' => 'partners',
            'gallery' => 'gallery',
            default => null,
        };
    }
};
