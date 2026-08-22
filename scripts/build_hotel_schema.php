<?php

use Illuminate\Contracts\Console\Kernel;

require 'D:/projects/belAzurTravel/vendor/autoload.php';

$app = require 'D:/projects/belAzurTravel/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$path = $app->storagePath('app/os_travel_hotel_search_all.json');
$data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

$responses = [];
foreach ($data['hotels'] ?? [] as $hotel) {
    if (! empty($hotel['response'])) {
        $responses[] = $hotel['response'];
    }
}

echo 'Responses analyzed: '.count($responses)."\n";

const LIST_MARK = "\0LIST";

/**
 * Build a trie of all key paths present in any value. Each node holds:
 * - 'scalar': first-seen representative value when the path is a scalar
 * - 'children': assoc-key => node
 * - a LIST_MARK child when the path is (or contains) an array
 */
function walk(array &$node, mixed $value): void
{
    if (is_array($value) && array_is_list($value)) {
        if (! isset($node[LIST_MARK])) {
            $node[LIST_MARK] = ['scalar' => null, 'children' => []];
        }
        foreach ($value as $item) {
            walkInto($node[LIST_MARK], $item);
        }

        return;
    }

    if (is_array($value)) {
        foreach ($value as $key => $item) {
            if (! isset($node['children'][$key])) {
                $node['children'][$key] = ['scalar' => null, 'children' => []];
            }
            walkInto($node['children'][$key], $item);
        }

        return;
    }

    if ($node['scalar'] === null) {
        $node['scalar'] = $value;
    }
}

function walkInto(array &$node, mixed $value): void
{
    if (is_array($value)) {
        walk($node, $value);
    } elseif ($node['scalar'] === null) {
        $node['scalar'] = $value;
    }
}

$root = ['scalar' => null, 'children' => []];
foreach ($responses as $response) {
    walkInto($root, $response);
}

function build(array $node): mixed
{
    if (isset($node[LIST_MARK])) {
        return [build($node[LIST_MARK])];
    }

    $out = [];
    foreach ($node['children'] as $key => $child) {
        $out[$key] = build($child);
    }

    if ($out === []) {
        return $node['scalar'];
    }

    if ($node['scalar'] !== null) {
        // A key that is sometimes a scalar and sometimes an object: keep both.
        $out['__scalar__'] = $node['scalar'];
    }

    return $out;
}

$unified = build($root);

$out = $app->storagePath('app/os_travel_hotel_unified_schema.json');
file_put_contents($out, json_encode($unified, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

echo 'Written to '.$out."\n";

function flatKeys(array $node, string $prefix = ''): array
{
    $keys = [];
    foreach ($node as $key => $value) {
        $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;
        $keys[$path] = is_array($value) ? 'object/array' : gettype($value);
        if (is_array($value) && ! empty($value)) {
            $first = $value[array_key_first($value)];
            if (is_array($first)) {
                foreach (flatKeys($first, $path.'[]') as $k => $t) {
                    $keys[$k] = $t;
                }
            }
        }
    }

    return $keys;
}

$keys = flatKeys($unified);
echo 'Total distinct key paths: '.count($keys)."\n";
foreach ($keys as $k => $t) {
    echo "  {$k} => {$t}\n";
}
