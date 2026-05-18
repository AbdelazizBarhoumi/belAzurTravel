<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SiteSettingsController extends Controller
{
    public function show(Request $request)
    {
        $locale = $request->query('lang') ?? app()->getLocale();

        $settings = Cache::remember("site-settings:{$locale}", now()->addMinutes(10), function () use ($locale) {
            $row = SiteSetting::first();
            
            if (!$row) {
                return [
                    'companyName' => null,
                    'email' => null,
                    'phone' => null,
                    'whatsapp' => null,
                    'address' => null,
                    'plusCode' => null,
                    'year' => null,
                    'socialLinks' => [],
                    'legalSections' => [],
                    'footerLinks' => [],
                    'hours' => [],
                    'content' => [],
                    'gallery' => [],
                ];
            }

            $result = [
                'companyName' => $row->company_name,
                'email' => $row->email,
                'phone' => $row->phone,
                'whatsapp' => $row->whatsapp,
                'address' => $row->address,
                'plusCode' => $row->plus_code,
                'year' => $row->year,
                'socialLinks' => $row->social_links,
                'legalSections' => $row->legal_sections,
                'footerLinks' => $row->footer_links,
                'hours' => $row->hours,
                'content' => $row->content,
                'gallery' => $row->content['gallery']['images'] ?? [],
            ];

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

        $settings = $this->filterDisabledContentForClient($request, $settings);

        return response()->json($settings);
    }

    protected function filterDisabledContentForClient(Request $request, array $settings): array
    {
        $user = $request->user();

        if (!$user || ($user->role ?? null) !== 'client') {
            return $settings;
        }

        $siteSettings = SiteSetting::first();
        $navSettings = $siteSettings?->content['nav']['settings'] ?? null;

        if (!$navSettings) {
            return $settings;
        }

        $headerEntries = $navSettings['header'] ?? [];
        $footerColumns = $navSettings['footer'] ?? [];

        $disabledPages = [];
        foreach ($headerEntries as $entry) {
            $pageKey = $entry['pageKey'] ?? null;
            if ($pageKey && !($entry['enabled'] ?? false)) {
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

    public function update()
    {
        $data = request()->validate([
            // Allow partial updates (e.g. admin nav settings page only sends content)
            'companyName' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:64'],
            'whatsapp' => ['nullable', 'string', 'max:64'],
            'address' => ['nullable', 'string', 'max:512'],
            'plusCode' => ['nullable', 'string', 'max:100'],
            'year' => ['nullable', 'integer'],
            'socialLinks' => ['nullable', 'array'],
            'legalSections' => ['nullable', 'array'],
            'footerLinks' => ['nullable', 'array'],
            'hours' => ['nullable', 'array'],
            'content' => ['nullable', 'array'],
        ]);

        // write to DB (create or update first row)
        try {
            $row = SiteSetting::first();
            
            // Use provided content or start with existing
            $content = $data['content'] ?? ($row?->content ?? []);

            // Validate nav dropdown sub-items have localized labels (en, fr, ar)
            if (isset($content['nav']['simpleLinks']) && is_array($content['nav']['simpleLinks'])) {
                foreach ($content['nav']['simpleLinks'] as $i => $entry) {
                    if (($entry['type'] ?? '') === 'dropdown' && isset($entry['items']) && is_array($entry['items'])) {
                        foreach ($entry['items'] as $j => $item) {
                            if (!isset($item['label'])) {
                                return response()->json(['message' => "Dropdown item at index {$i}.{$j} must include a 'label' field with translations for en, fr and ar."], 422);
                            }

                            if (!is_array($item['label'])) {
                                return response()->json(['message' => "Dropdown item at index {$i}.{$j} 'label' must be an object with 'en','fr','ar' keys."], 422);
                            }

                            foreach (['en', 'fr', 'ar'] as $langKey) {
                                if (!isset($item['label'][$langKey]) || !is_string($item['label'][$langKey]) || $item['label'][$langKey] === '') {
                                    return response()->json(['message' => "Dropdown item at index {$i}.{$j} must provide non-empty '{$langKey}' translation."], 422);
                                }
                            }
                        }
                    }
                }
            }
            
            $updateData = [
                'company_name' => $data['companyName'] ?? ($row?->company_name ?? 'BelAzurTravel'),
                'email' => $data['email'] ?? ($row?->email ?? 'hello@voyageur.com'),
                'phone' => $data['phone'] ?? ($row?->phone ?? '+1 (555) 123-4567'),
                'whatsapp' => $data['whatsapp'] ?? null,
                'address' => $data['address'] ?? null,
                'plus_code' => $data['plusCode'] ?? ($row?->plus_code ?? null),
                'year' => $data['year'] ?? date('Y'),
                'social_links' => $data['socialLinks'] ?? ($row?->social_links ?? []),
                'legal_sections' => $data['legalSections'] ?? ($row?->legal_sections ?? []),
                'footer_links' => $data['footerLinks'] ?? ($row?->footer_links ?? []),
                'hours' => $data['hours'] ?? ($row?->hours ?? []),
                'content' => $content,
            ];

            if ($row) {
                $row->update($updateData);
            } else {
                SiteSetting::create($updateData);
            }
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to save settings'], 500);
        }

        // Clear both cache keys (including per-locale caches)
        Cache::forget('site-settings');
        foreach (['en', 'fr', 'ar'] as $lc) {
            Cache::forget("site-settings:{$lc}");
        }
        Cache::forget('site_settings_nav');

        return response()->json(['message' => 'ok']);
    }
}
