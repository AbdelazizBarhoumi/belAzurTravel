<?php

namespace App\Http\Controllers\Api;

use App\Concerns\HandlesAdminMedia;
use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class SiteSettingsController extends Controller
{
    use HandlesAdminMedia;

    /** Disabled pages that should never be exposed through nav settings. */
    private const DISABLED_NAV_PAGE_KEYS = ['design-trip', 'favorites'];

    public function show(Request $request)
    {
        $locale = $request->query('lang') ?? app()->getLocale();

        $settings = Cache::remember("site-settings:{$locale}", now()->addMinutes(10), function () use ($locale) {
            $row = SiteSetting::first();

            if (! $row) {
                return [
                    'companyName' => null,
                    'email' => null,
                    'phone' => null,
                    'phone2' => null,
                    'whatsapp' => null,
                    'address' => null,
                    'plusCode' => null,
                    'mapLat' => null,
                    'mapLng' => null,
                    'mapEmbed' => null,
                    'year' => null,
                    'socialLinks' => [],
                    'legalSections' => [],
                    'footerLinks' => [],
                    'hours' => [],
                    'content' => [],
                    'gallery' => [],
                    'config' => [
                        'navigation' => config('site.navigation'),
                    ],
                ];
            }

            $result = [
                'companyName' => $row->company_name,
                'email' => $row->email,
                'phone' => $row->phone,
                'phone2' => $row->phone2,
                'whatsapp' => $row->whatsapp,
                'address' => $row->address,
                'plusCode' => $row->plus_code,
                'mapLat' => $row->map_lat,
                'mapLng' => $row->map_lng,
                'mapEmbed' => $row->map_embed,
                'year' => $row->year,
                'socialLinks' => $row->social_links,
                'legalSections' => $row->legal_sections,
                'footerLinks' => $row->footer_links,
                'hours' => $row->hours,
                'content' => $row->content,
                'gallery' => $row->content['gallery']['images'] ?? [],
                'config' => [
                    'navigation' => config('site.navigation'),
                ],
            ];

            $result['content'] = $this->sanitizeNavSettings($result['content'] ?? []);

            // Post-process localized labels for footer links and nav items
            // Footer links may use translation keys (labelKey) or localized label objects.
            $result['footerLinks'] = array_map(function ($link) use ($locale) {
                if (isset($link['labelKey']) && is_string($link['labelKey'])) {
                    $label = __($link['labelKey'], [], $locale);
                    $link['label'] = ['en' => $label, 'fr' => $label, 'ar' => $label];
                } elseif (isset($link['label']) && is_array($link['label'])) {
                    // ensure keys exist
                    $link['label'] = array_merge(['en' => '', 'fr' => '', 'ar' => ''], $link['label']);
                } elseif (isset($link['label']) && is_string($link['label'])) {
                    $link['label'] = ['en' => $link['label'], 'fr' => $link['label'], 'ar' => $link['label']];
                }

                return $link;
            }, $result['footerLinks'] ?? []);

            // Normalize nav simpleLinks labels: keep as localized objects when available
            if (isset($result['content']['nav']['simpleLinks']) && is_array($result['content']['nav']['simpleLinks'])) {
                foreach ($result['content']['nav']['simpleLinks'] as &$entry) {
                    // top-level label
                    if (isset($entry['label']) && is_string($entry['label'])) {
                        $entry['label'] = ['en' => $entry['label'], 'fr' => $entry['label'], 'ar' => $entry['label']];
                    }

                    // dropdown items
                    if (isset($entry['items']) && is_array($entry['items'])) {
                        foreach ($entry['items'] as &$item) {
                            if (isset($item['label']) && is_string($item['label'])) {
                                $item['label'] = ['en' => $item['label'], 'fr' => $item['label'], 'ar' => $item['label']];
                            }
                        }
                        unset($item);
                    }
                }
                unset($entry);
            }

            return $result;
        });

        $settings = $this->hydrateResponseDefaults($settings);
        $settings['content'] = $this->normalizeNavLabelShapes($settings['content'] ?? []);
        $settings['hours'] = $this->normalizeHoursPayload($settings['hours'] ?? []);
        $settings = $this->sanitizeNavSettings($settings);

        $settings = $this->filterDisabledContentForClient($request, $settings);

        return response()
            ->json($settings)
            ->header('Cache-Control', 'no-cache, must-revalidate');
    }

    protected function hydrateResponseDefaults(array $settings): array
    {
        $content = $settings['content'] ?? [];
        $navSettings = $content['nav']['settings'] ?? [];

        if (! isset($content['nav']['simpleLinks']) || ! is_array($content['nav']['simpleLinks'])) {
            $content['nav']['simpleLinks'] = $this->deriveSimpleLinks($navSettings);
        }

        if (! isset($settings['footerLinks']) || ! is_array($settings['footerLinks']) || count($settings['footerLinks']) === 0) {
            $settings['footerLinks'] = $this->deriveFooterLinks($navSettings);
        }

        $settings['content'] = $content;

        return $settings;
    }

    protected function deriveSimpleLinks(array $navSettings): array
    {
        $header = $navSettings['header'] ?? [];

        return array_values(array_map(function (array $entry): array {
            $pageKey = (string) ($entry['pageKey'] ?? '');
            $isDropdown = (bool) ($entry['isDropdown'] ?? false);
            $label = $entry['label'] ?? [
                'en' => $pageKey,
                'fr' => $pageKey,
                'ar' => $pageKey,
            ];
            if (is_string($label)) {
                $label = ['en' => $label, 'fr' => $label, 'ar' => $label];
            }

            return [
                'type' => $isDropdown ? 'dropdown' : 'simple',
                'label' => $label,
                'href' => '/'.ltrim($pageKey, '/'),
                'items' => $isDropdown ? ($entry['items'] ?? []) : [],
            ];
        }, array_filter($header, 'is_array')));
    }

    protected function deriveFooterLinks(array $navSettings): array
    {
        $footer = $navSettings['footer'] ?? [];
        $links = [];

        foreach ($footer as $column) {
            foreach (($column['pageKeys'] ?? []) as $pageKey) {
                if (! is_string($pageKey) || $pageKey === '') {
                    continue;
                }

                $links[] = [
                    'labelKey' => 'nav.'.$pageKey,
                    'href' => '/'.ltrim($pageKey, '/'),
                    'group' => 'quick',
                ];
            }
        }

        return $links;
    }

    protected function filterDisabledContentForClient(Request $request, array $settings): array
    {
        $user = $request->user();

        if (! $user || ($user->role ?? null) !== 'client') {
            return $settings;
        }

        $siteSettings = SiteSetting::first();
        $navSettings = $siteSettings?->content['nav']['settings'] ?? null;

        if (! $navSettings) {
            return $settings;
        }

        $headerEntries = $navSettings['header'] ?? [];
        $footerColumns = $navSettings['footer'] ?? [];

        $disabledPages = [];
        foreach ($headerEntries as $entry) {
            $pageKey = $entry['pageKey'] ?? null;
            if ($pageKey && ! ($entry['enabled'] ?? false)) {
                $disabledPages[$pageKey] = true;
            }
        }

        foreach ($footerColumns as $column) {
            foreach (($column['pageKeys'] ?? []) as $pageKey) {
                if (is_string($pageKey) && isset($disabledPages[$pageKey])) {
                    $disabledPages[$pageKey] = true;
                }
            }
        }

        foreach (array_keys($disabledPages) as $pageKey) {
            unset($settings['content'][$pageKey]);

            if ($pageKey === 'gallery') {
                unset($settings['gallery']);
            }
        }

        return $settings;
    }

    public function update(Request $request)
    {
        // Decode JSON fields that may arrive as strings in multipart/form-data requests
        if ($request->hasFile('video')) {
            $this->decodeJsonFields($request, ['content', 'socialLinks', 'legalSections', 'hours', 'navLinks']);
        }

        $data = $request->validate([
            // Allow partial updates (e.g. admin nav settings page only sends content)
            'companyName' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
            'phone2' => ['nullable', 'string', 'max:64'],
            'whatsapp' => ['nullable', 'string', 'max:64'],
            'address' => ['nullable', 'string', 'max:512'],
            'plusCode' => ['nullable', 'string', 'max:2000'],
            'year' => ['nullable', 'integer'],
            'socialLinks' => ['nullable', 'array'],
            'legalSections' => ['nullable', 'array'],
            'footerLinks' => ['nullable', 'array'],
            'hours' => ['nullable', 'array'],
            'hours.*.dayKey' => ['required_with:hours', 'string', 'max:100'],
            'hours.*.closed' => ['nullable', 'boolean'],
            'hours.*.ranges' => ['nullable', 'array'],
            'hours.*.ranges.*' => ['nullable', 'string', 'max:255'],
            'hours.*.value' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'array'],
            'navLinks' => ['nullable', 'array'],
            'video' => ['nullable', 'file', 'mimes:mp4,webm,mov', 'max:51200'],
        ]);

        // write to DB (create or update first row)
        try {
            $row = SiteSetting::first();
            $defaults = [
                'company_name' => config('site.company_name'),
                'email' => config('site.email'),
                'phone' => config('site.phone'),
                'phone2' => config('site.phone2'),
                'whatsapp' => config('site.whatsapp'),
                'address' => config('site.address'),
                'year' => (int) config('site.year'),
            ];

            // Use provided content or start with existing
            $content = $data['content'] ?? ($row?->content ?? []);
            $content = $this->sanitizeNavSettings($content);

            if (isset($data['navLinks']) && is_array($data['navLinks'])) {
                $content['nav']['simpleLinks'] = $data['navLinks'];
                $content = $this->sanitizeNavSettings($content);
            }

            $content = $this->normalizeNavLabelShapes($content);

            // Validate contact title/description translations
            if (isset($content['contact']) && is_array($content['contact'])) {
                foreach (['title', 'description'] as $contactField) {
                    if (! array_key_exists($contactField, $content['contact'])) {
                        continue;
                    }

                    $value = $content['contact'][$contactField] ?? null;
                    if (! is_array($value)) {
                        continue;
                    }

                    foreach (['en', 'fr', 'ar'] as $langKey) {
                        if (! isset($value[$langKey]) || ! is_string($value[$langKey]) || trim($value[$langKey]) === '') {
                            return response()->json(['message' => __('messages.contact_translation_required', ['field' => $contactField, 'lang' => $langKey])], 422);
                        }
                    }
                }
            }

            // Validate legalSections structure
            if (isset($data['legalSections']) && is_array($data['legalSections'])) {
                foreach ($data['legalSections'] as $i => $section) {
                    if (! isset($section['title']) || ! is_array($section['title'])) {
                        return response()->json(['message' => __('messages.legal_title_object_required', ['index' => $i])], 422);
                    }
                    foreach (['en', 'fr', 'ar'] as $langKey) {
                        if (! isset($section['title'][$langKey]) || ! is_string($section['title'][$langKey])) {
                            return response()->json(['message' => __('messages.legal_title_translation_required', ['index' => $i, 'lang' => $langKey])], 422);
                        }
                    }
                    if (! isset($section['body'])) {
                        return response()->json(['message' => __('messages.legal_body_required', ['index' => $i])], 422);
                    }
                }
            }

            // Validate nav dropdown sub-items have localized labels (en, fr, ar)
            if (isset($content['nav']['simpleLinks']) && is_array($content['nav']['simpleLinks'])) {
                foreach ($content['nav']['simpleLinks'] as $i => $entry) {
                    if (($entry['type'] ?? '') === 'dropdown' && isset($entry['items']) && is_array($entry['items'])) {
                        foreach ($entry['items'] as $j => $item) {
                            if (($item['mode'] ?? '') === 'categories') {
                                continue;
                            }

                            if (! isset($item['label'])) {
                                return response()->json(['message' => __('messages.dropdown_label_required', ['index' => "{$i}.{$j}"])], 422);
                            }

                            if (! is_array($item['label'])) {
                                return response()->json(['message' => __('messages.dropdown_label_object_required', ['index' => "{$i}.{$j}"])], 422);
                            }

                            foreach (['en', 'fr', 'ar'] as $langKey) {
                                if (! isset($item['label'][$langKey]) || ! is_string($item['label'][$langKey]) || $item['label'][$langKey] === '') {
                                    return response()->json(['message' => __('messages.dropdown_label_translation_required', ['index' => "{$i}.{$j}", 'lang' => $langKey])], 422);
                                }
                            }
                        }
                    }
                }
            }

            // Handle video upload
            if ($request->hasFile('video')) {
                $oldVideo = $content['landing_video']['url'] ?? null;
                if ($oldVideo) {
                    $oldPath = str_replace('/storage/', '', $oldVideo);
                    Storage::disk('public')->delete($oldPath);
                }
                File::ensureDirectoryExists(storage_path('app/public/uploads/site'));
                $path = $request->file('video')->store('uploads/site', 'public');
                $content['landing_video'] = ['url' => '/storage/'.$path];
            } elseif (array_key_exists('landing_video', $content) && is_null($content['landing_video'])) {
                $oldVideo = $row?->content['landing_video']['url'] ?? null;
                if ($oldVideo) {
                    $oldPath = str_replace('/storage/', '', $oldVideo);
                    Storage::disk('public')->delete($oldPath);
                }
                unset($content['landing_video']);
            }

            $hours = $this->normalizeHoursPayload($data['hours'] ?? ($row?->hours ?? []));

            $plusCodeRaw = $data['plusCode'] ?? ($row?->plus_code ?? null);
            $place = is_string($plusCodeRaw) && $plusCodeRaw !== ''
                ? $this->resolvePlace($plusCodeRaw)
                : ['embed' => null, 'coords' => null];
            $mapEmbed = $place['embed'];
            $coordinates = $place['coords'];

            $updateData = [
                'company_name' => $data['companyName'] ?? ($row?->company_name ?? $defaults['company_name']),
                'email' => $data['email'] ?? ($row?->email ?? $defaults['email']),
                'phone' => $data['phone'] ?? ($row?->phone ?? $defaults['phone']),
                'phone2' => $data['phone2'] ?? ($row?->phone2 ?? $defaults['phone2']),
                'whatsapp' => $data['whatsapp'] ?? ($row?->whatsapp ?? $defaults['whatsapp']),
                'address' => $data['address'] ?? ($row?->address ?? $defaults['address']),
                'plus_code' => $plusCodeRaw,
                'map_lat' => $coordinates ? (string) $coordinates[0] : null,
                'map_lng' => $coordinates ? (string) $coordinates[1] : null,
                'map_embed' => $mapEmbed,
                'year' => $data['year'] ?? ($row?->year ?? $defaults['year'] ?? (int) date('Y')),
                'social_links' => $data['socialLinks'] ?? ($row?->social_links ?? []),
                'legal_sections' => $data['legalSections'] ?? ($row?->legal_sections ?? []),
                'footer_links' => $data['footerLinks'] ?? ($row?->footer_links ?? []),
                'hours' => $hours,
                'content' => $content,
            ];

            if ($row) {
                $row->update($updateData);
            } else {
                SiteSetting::create($updateData);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => __('messages.failed_to_save_settings')], 500);
        }

        // Clear both cache keys (including per-locale caches)
        Cache::forget('site-settings');
        foreach (['en', 'fr', 'ar'] as $lc) {
            Cache::forget("site-settings:{$lc}");
        }
        Cache::forget('site_settings_nav');

        return response()->json([
            'message' => __('messages.ok'),
            'content' => $content,
        ]);
    }

    protected function sanitizeNavSettings(array $settings): array
    {
        if (! isset($settings['nav']) || ! is_array($settings['nav'])) {
            return $settings;
        }

        $settings['nav'] = $this->sanitizeNavContent($settings['nav']);

        return $settings;
    }

    protected function sanitizeNavContent(array $navContent): array
    {
        foreach (self::DISABLED_NAV_PAGE_KEYS as $disabledPageKey) {
            if (isset($navContent['simpleLinks']) && is_array($navContent['simpleLinks'])) {
                $navContent['simpleLinks'] = array_values(array_filter(
                    $navContent['simpleLinks'],
                    function ($entry) use ($disabledPageKey) {
                        if (! is_array($entry)) {
                            return true;
                        }

                        $href = (string) ($entry['href'] ?? '');
                        $labelKey = (string) ($entry['labelKey'] ?? '');
                        $id = (string) ($entry['id'] ?? '');
                        $pageKey = (string) ($entry['pageKey'] ?? '');

                        return ! (
                            $href === '/'.$disabledPageKey ||
                            str_contains($href, '/'.$disabledPageKey) ||
                            $labelKey === 'nav.design' ||
                            $id === 'simple-design' ||
                            $pageKey === $disabledPageKey
                        );
                    }
                ));
            }

            if (isset($navContent['settings']) && is_array($navContent['settings'])) {
                $navContent['settings']['header'] = array_values(array_filter(
                    $navContent['settings']['header'] ?? [],
                    function ($entry) use ($disabledPageKey) {
                        return is_array($entry) && (string) ($entry['pageKey'] ?? '') !== $disabledPageKey;
                    }
                ));

                $navContent['settings']['footer'] = array_values(array_map(
                    function ($column) use ($disabledPageKey) {
                        if (! is_array($column)) {
                            return $column;
                        }

                        $column['pageKeys'] = array_values(array_filter(
                            $column['pageKeys'] ?? [],
                            fn ($pageKey) => (string) $pageKey !== $disabledPageKey,
                        ));

                        return $column;
                    },
                    $navContent['settings']['footer'] ?? []
                ));
            }
        }

        return $navContent;
    }

    protected function normalizeNavItemLabels(array &$items): void
    {
        foreach ($items as &$item) {
            if (! is_array($item)) {
                continue;
            }

            if (isset($item['label']) && is_string($item['label'])) {
                $item['label'] = [
                    'en' => $item['label'],
                    'fr' => $item['label'],
                    'ar' => $item['label'],
                ];
            }

            if (isset($item['children']) && is_array($item['children'])) {
                $this->normalizeNavItemLabels($item['children']);
            }
        }
        unset($item);
    }

    protected function normalizeNavLabelShapes(array $content): array
    {
        if (isset($content['nav']) && is_array($content['nav'])) {
            if (isset($content['nav']['simpleLinks']) && is_array($content['nav']['simpleLinks'])) {
                foreach ($content['nav']['simpleLinks'] as &$entry) {
                    if (! is_array($entry)) {
                        continue;
                    }

                    if (isset($entry['label']) && is_string($entry['label'])) {
                        $entry['label'] = [
                            'en' => $entry['label'],
                            'fr' => $entry['label'],
                            'ar' => $entry['label'],
                        ];
                    }

                    if (isset($entry['items']) && is_array($entry['items'])) {
                        $this->normalizeNavItemLabels($entry['items']);
                    }
                }
                unset($entry);
            }

            if (isset($content['nav']['settings']) && is_array($content['nav']['settings'])) {
                if (isset($content['nav']['settings']['header']) && is_array($content['nav']['settings']['header'])) {
                    foreach ($content['nav']['settings']['header'] as &$entry) {
                        if (! is_array($entry)) {
                            continue;
                        }

                        if (isset($entry['label']) && is_string($entry['label'])) {
                            $entry['label'] = [
                                'en' => $entry['label'],
                                'fr' => $entry['label'],
                                'ar' => $entry['label'],
                            ];
                        }

                        if (isset($entry['items']) && is_array($entry['items'])) {
                            $this->normalizeNavItemLabels($entry['items']);
                        }
                    }
                    unset($entry);
                }
            }
        }

        return $content;
    }

    protected function normalizeHoursPayload(array $hours): array
    {
        $normalized = [];

        foreach ($hours as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $dayKey = trim((string) ($entry['dayKey'] ?? ''));
            if ($dayKey === '') {
                continue;
            }

            $ranges = [];
            if (isset($entry['ranges']) && is_array($entry['ranges'])) {
                foreach ($entry['ranges'] as $range) {
                    if (is_string($range)) {
                        $value = trim($range);
                    } elseif (is_array($range)) {
                        $value = trim((string) ($range['value'] ?? ''));
                    } else {
                        $value = '';
                    }

                    if ($value !== '') {
                        $ranges[] = ['value' => $value];
                    }
                }
            } elseif (isset($entry['value']) && is_string($entry['value'])) {
                $value = trim($entry['value']);
                if ($value !== '') {
                    $ranges[] = ['value' => $value];
                }
            }

            $closed = (bool) ($entry['closed'] ?? false);
            if (count($ranges) === 0) {
                $closed = true;
            }

            $normalized[] = [
                'dayKey' => $dayKey,
                'ranges' => $ranges,
                'closed' => $closed,
            ];
        }

        return $normalized;
    }

    /**
     * Resolve a user-supplied map value to an embed URL and coordinates.
     *
     * Accepts:
     *  1. Direct coordinates: "lat,lng"
     *  2. Google Maps embed URL or <iframe src="...pb=..."> snippet
     *  3. Full Google Maps place URL
     *  4. Bare short code: "<code>"
     *  5. Full short link: "https://maps.app.goo.gl/<code>"
     *  6. Plain address / plus code (fallback text search)
     *
     * Returns ['embed' => ?string, 'coords' => ?array].
     */
    protected function resolvePlace(string $input): array
    {
        $value = trim($input);
        if ($value === '') {
            return ['embed' => null, 'coords' => null];
        }

        // 1. Explicit coordinates
        if (preg_match('/^[-+]?\d+(?:\.\d+)?\s*,\s*[-+]?\d+(?:\.\d+)?$/', $value)) {
            [$lat, $lng] = array_map('trim', explode(',', $value));

            return ['embed' => null, 'coords' => [(float) $lat, (float) $lng]];
        }

        // 2. Direct embed URL / iframe snippet
        $embed = $this->resolveMapEmbed($value);
        if ($embed !== null) {
            return ['embed' => $embed, 'coords' => $this->parseCoordsFromUrl($embed)];
        }

        // 3. Full Google Maps URL carrying coords / place id inline
        if (str_contains($value, 'google.com/maps') || str_contains($value, 'goo.gl/maps')) {
            $embed = $this->buildEmbedFromCanonicalUrl($value);
            $coords = $this->parseCoordsFromUrl($value);
            if ($embed !== null || $coords !== null) {
                return ['embed' => $embed, 'coords' => $coords];
            }
        }

        // 4. Bare short code (letters/digits/_/- only, no '+', long enough to be a goo.gl code)
        if (preg_match('/^[A-Za-z0-9_-]{10,}$/', $value)) {
            $value = 'https://maps.app.goo.gl/'.$value;
        }

        // 5. Full short link
        if (preg_match('#^https?://maps\.app\.goo\.gl/[A-Za-z0-9_-]+$#', $value)) {
            $finalUrl = $this->followRedirects($value);

            return [
                'embed' => $this->buildEmbedFromCanonicalUrl($finalUrl),
                'coords' => $this->parseCoordsFromUrl($finalUrl),
            ];
        }

        // 6. Plain address / plus code -> text search fallback
        return ['embed' => null, 'coords' => null];
    }

    /**
     * Build an embed URL ("...maps/embed?pb=...") from a Google Maps canonical
     * place URL that carries a place id (`!1s<placeId>`) and coordinates.
     */
    protected function buildEmbedFromCanonicalUrl(string $url): ?string
    {
        if (! preg_match('/!1s([^!]+)/', $url, $placeIdMatch)) {
            return null;
        }

        $placeId = rawurldecode($placeIdMatch[1]);

        $coords = $this->parseCoordsFromUrl($url);
        if ($coords === null) {
            return null;
        }
        [$lat, $lng] = $coords;

        $label = '';
        if (preg_match('#/maps/place/([^/@]+)#', $url, $labelMatch)) {
            $label = str_replace('+', ' ', $labelMatch[1]);
        }
        $label = $label === '' ? $placeId : $label;

        return 'https://www.google.com/maps/embed?pb='
            .'!1m18!1m12!1m3!1d4000!2d'.$lng.'!3d'.$lat
            .'!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1'
            .'!3m3!1m2!1s'.rawurlencode($placeId).'!2s'.rawurlencode($label)
            .'!5e0!3m2!1sen!2stn!5m2!1sen!2stn';
    }

    /**
     * Extract latitude/longitude from a Google Maps canonical URL.
     */
    protected function parseCoordsFromUrl(string $url): ?array
    {
        if (preg_match('/@(-?[\d.]+),(-?[\d.]+)/', $url, $m)) {
            return [(float) $m[1], (float) $m[2]];
        }

        if (preg_match('/!3d(-?[\d.]+)!4d(-?[\d.]+)/', $url, $m)) {
            return [(float) $m[1], (float) $m[2]];
        }

        // Official embed (pb) format uses !2d<lng>!3d<lat>
        if (preg_match('/!2d(-?[\d.]+)!3d(-?[\d.]+)/', $url, $m)) {
            return [(float) $m[2], (float) $m[1]];
        }

        return null;
    }

    /**
     * Detect a Google Maps embed URL (either a bare URL or a pasted
     * <iframe src="..."> snippet) and normalize it to the canonical
     * "https://www.google.com/maps/embed?pb=..." form.
     */
    protected function resolveMapEmbed(string $input): ?string
    {
        $value = trim($input);
        if ($value === '') {
            return null;
        }

        // Pasted <iframe ... src="..."> snippet
        if (preg_match('/src="([^"]*maps\/embed\?pb=[^"]*)"/i', $value, $m)) {
            $value = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
        }

        // Bare embed URL with a pb parameter
        if (preg_match('#^https?://(?:www\.)?google\.[a-z]{2,}/maps/embed\?pb=#i', $value)) {
            $pbStart = strpos($value, 'pb=') + 3;
            $pb = strtok(substr($value, $pbStart), '&');
            if ($pb === false || $pb === '') {
                return null;
            }

            return 'https://www.google.com/maps/embed?pb='.$pb;
        }

        return null;
    }

    /**
     * Follow redirects and return the final effective URL.
     */
    protected function followRedirects(string $url): string
    {
        if (! function_exists('curl_init')) {
            return $url;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_NOBODY => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_USERAGENT => 'Mozilla/5.0',
        ]);
        curl_exec($ch);
        $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        curl_close($ch);

        return is_string($finalUrl) && $finalUrl !== '' ? $finalUrl : $url;
    }
}
