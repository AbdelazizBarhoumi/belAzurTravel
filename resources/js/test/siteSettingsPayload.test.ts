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
});
