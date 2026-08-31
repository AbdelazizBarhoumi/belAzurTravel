<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // These are now defined as static filters in nav-static-filters.ts.
        // Set locked=false so they no longer show "Système" badge in admin.
        // They must remain in the DB because entity_category_assignments needs the FK.
        DB::table('category_types')
            ->where('entity_type', 'hotels')
            ->whereIn('key', ['pricing_type', 'features'])
            ->update(['locked' => false]);
    }

    public function down(): void
    {
        DB::table('category_types')
            ->where('entity_type', 'hotels')
            ->whereIn('key', ['pricing_type', 'features'])
            ->update(['locked' => true]);
    }
};
