<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Hotel;

$withTags = Hotel::where('source', 'ostravel')
    ->whereNotNull('details')
    ->where('details', '!=', '{}')
    ->where('details', 'LIKE', '%amenity_tags%')
    ->count();

$withDetail = Hotel::where('source', 'ostravel')
    ->whereNotNull('details')
    ->where('details', '!=', '{}')
    ->count();

$total = Hotel::where('source', 'ostravel')->count();

echo "Total ostravel hotels: {$total}\n";
echo "With non-empty details: {$withDetail}\n";
echo "With amenity_tags in details: {$withTags}\n\n";

// Check a sample
$sample = Hotel::where('source', 'ostravel')
    ->whereNotNull('details')
    ->where('details', '!=', '{}')
    ->limit(3)
    ->get();

foreach ($sample as $h) {
    $tags = $h->details['amenity_tags'] ?? [];
    echo "{$h->slug}: " . count($tags) . " tags\n";
    foreach (array_slice($tags, 0, 3) as $t) {
        echo "  - {$t['title']}\n";
    }
}
