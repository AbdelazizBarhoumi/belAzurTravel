import { describe, expect, it } from 'vitest';
import {
    normalizeLocalizedText,
    normalizeSiteSettingsContentForSave,
} from '@/lib/siteSettingsPayload';

describe('site settings payload helpers', () => {
    it('expands string labels into localized text objects', () => {
        expect(normalizeLocalizedText('Services')).toEqual({
            en: 'Services',
            fr: 'Services',
            ar: 'Services',
        });
    });

    it('normalizes nav labels and strips editor-only fields before save', () => {
        const content = normalizeSiteSettingsContentForSave({
            nav: {
                simpleLinks: [
                    {
                        type: 'dropdown',
                        label: 'Services',
                        activeLang: 'fr',
                        items: [
                            {
                                label: 'Tours',
                                activeLang: 'en',
                                mode: 'filter',
                                value: 'tours',
                                href: '/tours',
                            },
                            {
                                mode: 'categories',
                                value: '',
                                href: '/destinations',
                            },
                        ],
                    },
                ],
                settings: {
                    header: [
                        {
                            pageKey: 'destinations',
                            enabled: true,
                            isDropdown: true,
                            linkSelf: true,
                            placement: 'top',
                            items: [
                                {
                                    label: 'Hotels',
                                    activeLang: 'ar',
                                    mode: 'filter',
                                    value: 'hotels',
                                },
                            ],
                        },
                    ],
                    footer: [],
                },
            },
        });

        expect(content).toMatchObject({
            nav: {
                simpleLinks: [
                    {
                        label: {
                            en: 'Services',
                            fr: 'Services',
                            ar: 'Services',
                        },
                        items: [
                            {
                                label: {
                                    en: 'Tours',
                                    fr: 'Tours',
                                    ar: 'Tours',
                                },
                                mode: 'filter',
                                value: 'tours',
                                href: '/tours',
                            },
                            {
                                mode: 'categories',
                                value: '',
                                href: '/destinations',
                            },
                        ],
                    },
                ],
                settings: {
                    header: [
                        {
                            items: [
                                {
                                    label: {
                                        en: 'Hotels',
                                        fr: 'Hotels',
                                        ar: 'Hotels',
                                    },
                                    mode: 'filter',
                                    value: 'hotels',
                                },
                            ],
                        },
                    ],
                },
            },
        });

        expect(JSON.stringify(content).includes('activeLang')).toBe(false);
    });

    it('normalizes group sub-page links (each with its own pageKey) before save', () => {
        const content = normalizeSiteSettingsContentForSave({
            nav: {
                settings: {
                    header: [],
                    footer: [],
                    groups: [
                        {
                            key: 'group-1',
                            label: { en: 'Explore', fr: 'Explorer', ar: 'استكشف' },
                            enabled: true,
                            placement: 'top',
                            pages: [],
                            links: [
                                {
                                    pageKey: 'destinations',
                                    label: 'Beach',
                                    activeLang: 'en',
                                    mode: 'filter',
                                    value: 'beach',
                                },
                                {
                                    pageKey: 'hotels',
                                    label: { en: 'Luxury', fr: 'Luxe', ar: 'فاخر' },
                                    mode: 'filter',
                                    value: 'hotels:luxury',
                                    children: [
                                        {
                                            label: { en: 'Family', fr: 'Famille', ar: 'عائلة' },
                                            mode: 'filter',
                                            value: 'hotels:family',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        });

        const groups = (
            content.nav as { settings?: { groups?: Array<Record<string, unknown>> } }
        ).settings?.groups ?? [];
        const links = groups[0].links as Array<Record<string, unknown>>;

        expect(links[0]).toMatchObject({
            pageKey: 'destinations',
            mode: 'filter',
            value: 'beach',
            label: { en: 'Beach', fr: 'Beach', ar: 'Beach' },
        });
        expect(links[1]).toMatchObject({
            pageKey: 'hotels',
            mode: 'filter',
            value: 'hotels:luxury',
        });
        expect(
            (links[1].children as Array<Record<string, unknown>>)[0].label,
        ).toEqual({
            en: 'Family',
            fr: 'Famille',
            ar: 'عائلة',
        });
        expect(JSON.stringify(content).includes('activeLang')).toBe(false);
    });
});
