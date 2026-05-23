<?php

$val = "/images/t1.jpg\n/images/t2.jpg";
$lines = preg_split('/\r\n|\r|\n/', $val);
print_r($lines);

function normalizeStoredMediaPath(?string $path): string
{
    if (! is_string($path)) {
        return 'not string';
    }

    $trimmed = trim($path);
    $hadLeadingSlash = str_starts_with($trimmed, '/');
    if ($trimmed === '') {
        return 'empty';
    }

    $parsedPath = parse_url($trimmed, PHP_URL_PATH);
    if (is_string($parsedPath) && $parsedPath !== '') {
        $trimmed = $parsedPath;
    }

    $noLeading = ltrim($trimmed, '/');

    if (str_starts_with($noLeading, 'storage/') || str_starts_with($noLeading, 'images/')) {
        return $hadLeadingSlash ? ('/'.$noLeading) : $noLeading;
    }

    return 'failed: '.$noLeading;
}

foreach ($lines as $line) {
    echo "Line: $line -> ".normalizeStoredMediaPath($line)."\n";
}
