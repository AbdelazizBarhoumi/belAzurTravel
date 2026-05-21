import type { DragEndEvent } from '@dnd-kit/core';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus,
    Trash2,
    RotateCcw,
    Save,
    GripVertical,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavSettings } from '@/hooks/useNavSettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Textarea } from '@/components/ui/textarea';
import { normalizeLegalBody, type LegalBodyFormat } from '@/lib/legal';
import {
    AVAILABLE_PAGES,
    getPage,
    DEFAULT_NAV_SETTINGS,
} from '@/lib/nav-config';
import type {
    NavSettings,
    DropdownItemConfig,
    HeaderEntry,
} from '@/lib/nav-config';

interface SocialLink {
    label: string;
    href: string;
}

interface HourRow {
    dayKey: string;
    value: string;
}

interface LegalSectionDraft {
    title: Record<string, string>;
    body: {
        format: LegalBodyFormat;
        content: Record<string, string>;
    };
}

function SortableHeaderRow({
    entry,
    children,
}: {
    entry: HeaderEntry;
    children: React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: entry.pageKey });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };
    return (
        <Card ref={setNodeRef} style={style} className="p-4">
            <div className="flex items-start gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                >
                    <GripVertical className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </Card>
    );
}

function SortableFooterPage({
    pageKey,
    label,
    onRemove,
    onMove,
    isFirst,
    isLast,
}: {
    pageKey: string;
    label: string;
    onRemove: () => void;
    onMove: (dir: number) => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: pageKey });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between rounded-md border bg-muted/20 p-2"
        >
            <div className="flex items-center gap-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                >
                    <GripVertical className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-1">
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onMove(-1)}
                    disabled={isFirst}
                >
                    <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onMove(1)}
                    disabled={isLast}
                >
                    <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={onRemove}
                >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
            </div>
        </div>
    );
}

export default function AdminSiteSettings() {
    const { settings, loading, reset } = useNavSettings();
    const { settings: siteSettings, loading: siteSettingsLoading } =
        useSiteSettings();
    const [draft, setDraft] = useState<NavSettings>(settings);
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState('');
    const [plusCode, setPlusCode] = useState('');
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [contactTitle, setContactTitle] = useState<Record<string, string>>({
        en: '',
        fr: '',
        ar: '',
    });
    const [contactDescription, setContactDescription] = useState<
        Record<string, string>
    >({ en: '', fr: '', ar: '' });
    const [hours, setHours] = useState<HourRow[]>([]);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [legalSectionsState, setLegalSectionsState] = useState<
        LegalSectionDraft[]
    >([]);
    const [markdownPreview, setMarkdownPreview] = useState<
        Record<string, boolean>
    >({});
    const [legalLangTabs, setLegalLangTabs] = useState<
        Record<number, 'en' | 'fr' | 'ar'>
    >({});
    const [legalAutosaveStatus, setLegalAutosaveStatus] = useState<
        'idle' | 'saving' | 'saved' | 'error'
    >('idle');
    const autosaveTimerRef = useRef<number | null>(null);
    const lastSavedLegalRef = useRef<string>('');
    const autosaveReadyRef = useRef(false);
    const [invalidLabels, setInvalidLabels] = useState<Record<string, string>>(
        {},
    );

    // Keep draft in sync when settings are loaded/changed externally
    // (e.g., after initial fetch or when reset is applied)
    useEffect(() => {
        // We ensure all AVAILABLE_PAGES have an entry in the header.
        // If a new page was added to nav-config.ts, it should appear in the admin.
        const headerEntries = settings.header || [];
        const currentKeys = headerEntries.map((h) => h.pageKey);
        const missingPages = AVAILABLE_PAGES.filter(
            (p) => !currentKeys.includes(p.key),
        );

        // Normalize: remove footer keys that are disabled in nav
        let normalizedSettings = settings;
        if (settings.footer && settings.header) {
            const enabledKeys = settings.header
                .filter((h) => h.enabled)
                .map((h) => h.pageKey);
            normalizedSettings = {
                ...settings,
                footer: settings.footer.map((col) => ({
                    ...col,
                    pageKeys: col.pageKeys.filter((k) =>
                        enabledKeys.includes(k),
                    ),
                })),
            };
        }

        if (missingPages.length > 0) {
            const newEntries: HeaderEntry[] = missingPages.map((p) => ({
                pageKey: p.key,
                enabled: false,
                isDropdown: false,
                linkSelf: true,
                placement: 'more',
                items: [],
            }));
            setDraft({
                ...normalizedSettings,
                header: [...headerEntries, ...newEntries],
            });
        } else {
            setDraft(normalizedSettings);
        }
    }, [settings]);

    useEffect(() => {
        setCompanyName(siteSettings.companyName || '');
        setAddress(siteSettings.address || '');
        setPlusCode(siteSettings.plusCode || '');
        setYear(siteSettings.year || new Date().getFullYear());
        setEmail(siteSettings.email || '');
        setPhone(siteSettings.phone || '');
        setWhatsapp(siteSettings.whatsapp || '');
        setContactTitle(
            siteSettings.content?.contact?.title || { en: '', fr: '', ar: '' },
        );
        setContactDescription(
            siteSettings.content?.contact?.description || {
                en: '',
                fr: '',
                ar: '',
            },
        );
        setHours(siteSettings.hours || []);
        setSocialLinks(siteSettings.socialLinks || []);
        setLegalSectionsState(
            siteSettings.legalSections?.map((s) => {
                const body = normalizeLegalBody(s.body);
                return {
                    title: s.title || { en: '', fr: '', ar: '' },
                    body,
                };
            }) ?? [],
        );
        const snapshot = JSON.stringify(
            siteSettings.legalSections?.map((s) => ({
                title: s.title || { en: '', fr: '', ar: '' },
                body: normalizeLegalBody(s.body),
            })) ?? [],
        );
        lastSavedLegalRef.current = snapshot;
        autosaveReadyRef.current = true;
    }, [siteSettings]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );

    const { t } = useLanguage();

    const setHeader = (idx: number, patch: Partial<HeaderEntry>) => {
        const nextHeader = draft.header.map((h, i) =>
            i === idx ? { ...h, ...patch } : h,
        );

        let nextFooter = draft.footer;
        if (patch.enabled === false) {
            const pageKey = draft.header[idx].pageKey;
            nextFooter = draft.footer.map((col) => ({
                ...col,
                pageKeys: col.pageKeys.filter((k) => k !== pageKey),
            }));
        }

        setDraft({
            ...draft,
            header: nextHeader,
            footer: nextFooter,
        });
    };

    const addItem = (idx: number) => {
        const entry = draft.header[idx];
        const newLabel = {
            en: 'New item',
            fr: 'New item',
            ar: 'New item',
        } as any;
        setHeader(idx, {
            items: [
                ...entry.items,
                { label: newLabel, mode: 'filter', value: '' } as any,
            ],
        });
    };

    const updateItem = (hIdx: number, iIdx: number, patch: Partial<any>) => {
        const entry = draft.header[hIdx];
        setHeader(hIdx, {
            items: entry.items.map((it: any, i: number) =>
                i === iIdx ? { ...it, ...patch } : it,
            ),
        });
    };

    const removeItem = (hIdx: number, iIdx: number) => {
        const entry = draft.header[hIdx];
        setHeader(hIdx, { items: entry.items.filter((_, i) => i !== iIdx) });
    };

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = draft.header.findIndex((h) => h.pageKey === active.id);
        const newIndex = draft.header.findIndex((h) => h.pageKey === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        setDraft({
            ...draft,
            header: arrayMove(draft.header, oldIndex, newIndex),
        });
    };

    const handleFooterDragEnd = (colIdx: number, event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const col = draft.footer[colIdx];
            const oldIndex = col.pageKeys.indexOf(active.id as string);
            const newIndex = col.pageKeys.indexOf(over.id as string);

            setDraft((prev) => ({
                ...prev,
                footer: prev.footer.map((c, i) =>
                    i === colIdx
                        ? {
                              ...c,
                              pageKeys: arrayMove(
                                  c.pageKeys,
                                  oldIndex,
                                  newIndex,
                              ),
                          }
                        : c,
                ),
            }));
        }
    };

    const moveBy = (idx: number, delta: number) => {
        const newIdx = idx + delta;
        if (newIdx < 0 || newIdx >= draft.header.length) return;
        setDraft({ ...draft, header: arrayMove(draft.header, idx, newIdx) });
    };

    const toggleFooterPage = (colIdx: number, pageKey: string) => {
        const col = draft.footer[colIdx];
        const has = col.pageKeys.includes(pageKey);
        const pageKeys = has
            ? col.pageKeys.filter((k) => k !== pageKey)
            : [...col.pageKeys, pageKey];
        setDraft({
            ...draft,
            footer: draft.footer.map((c, i) =>
                i === colIdx ? { ...c, pageKeys } : c,
            ),
        });
    };

    const moveFooterPage = (colIdx: number, pageIdx: number, dir: number) => {
        const col = draft.footer[colIdx];
        const nextIdx = pageIdx + dir;
        if (nextIdx < 0 || nextIdx >= col.pageKeys.length) return;

        const nextKeys = [...col.pageKeys];
        [nextKeys[pageIdx], nextKeys[nextIdx]] = [
            nextKeys[nextIdx],
            nextKeys[pageIdx],
        ];

        setDraft({
            ...draft,
            footer: draft.footer.map((c, i) =>
                i === colIdx ? { ...c, pageKeys: nextKeys } : c,
            ),
        });
    };

    const updateFooterTitle = (
        colIdx: number,
        patch: string | Record<string, string>,
    ) => {
        setDraft({
            ...draft,
            footer: draft.footer.map((c, i) => {
                if (i !== colIdx) return c;
                const existing =
                    typeof c.title === 'object'
                        ? c.title
                        : { en: c.title, fr: c.title, ar: c.title };
                const updated =
                    typeof patch === 'string'
                        ? { ...existing, en: patch, fr: patch, ar: patch }
                        : { ...existing, ...patch };
                return { ...c, title: updated };
            }),
        });
    };

    const updateSocial = (idx: number, patch: Partial<SocialLink>) => {
        setSocialLinks((prev) =>
            prev.map((entry, i) =>
                i === idx ? { ...entry, ...patch } : entry,
            ),
        );
    };

    const removeSocial = (idx: number) => {
        setSocialLinks((prev) => prev.filter((_, i) => i !== idx));
    };

    const addSocial = () => {
        setSocialLinks((prev) => [...prev, { label: '', href: '' }]);
    };

    const updateHour = (idx: number, patch: Partial<HourRow>) => {
        setHours((prev) =>
            prev.map((entry, i) =>
                i === idx ? { ...entry, ...patch } : entry,
            ),
        );
    };

    const removeHour = (idx: number) => {
        setHours((prev) => prev.filter((_, i) => i !== idx));
    };

    const addHour = () => {
        setHours((prev) => [...prev, { dayKey: '', value: '' }]);
    };

    const addLegalSection = () => {
        setLegalSectionsState((prev) => [
            ...prev,
            {
                title: { en: 'New', fr: 'Nouveau', ar: 'جديد' },
                body: {
                    format: 'markdown',
                    content: { en: '', fr: '', ar: '' },
                },
            },
        ]);
    };

    const updateLegalSection = (
        idx: number,
        patch: Partial<LegalSectionDraft>,
    ) => {
        setLegalSectionsState((prev) =>
            prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
        );
    };

    const removeLegalSection = (idx: number) => {
        setLegalSectionsState((prev) => prev.filter((_, i) => i !== idx));
    };

    const toggleMarkdownPreview = (idx: number, langKey: string) => {
        const key = `${idx}-${langKey}`;
        setMarkdownPreview((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const getActiveLang = (idx: number) => legalLangTabs[idx] ?? 'en';

    const setActiveLang = (idx: number, lang: 'en' | 'fr' | 'ar') => {
        setLegalLangTabs((prev) => ({ ...prev, [idx]: lang }));
    };

    const buildLegalPayload = () =>
        legalSectionsState.map((s) => ({
            title: s.title,
            body: { format: s.body.format, content: s.body.content },
        }));

    useEffect(() => {
        if (!autosaveReadyRef.current) return;

        const snapshot = JSON.stringify(buildLegalPayload());
        if (snapshot === lastSavedLegalRef.current) return;

        setLegalAutosaveStatus('saving');
        if (autosaveTimerRef.current) {
            window.clearTimeout(autosaveTimerRef.current);
        }

        autosaveTimerRef.current = window.setTimeout(async () => {
            try {
                await apiFetch('/api/site-settings', {
                    method: 'PUT',
                    body: JSON.stringify({
                        legalSections: buildLegalPayload(),
                    }),
                });
                lastSavedLegalRef.current = JSON.stringify(buildLegalPayload());
                setLegalAutosaveStatus('saved');
                window.setTimeout(() => {
                    setLegalAutosaveStatus('idle');
                }, 2000);
            } catch {
                setLegalAutosaveStatus('error');
            }
        }, 1200);

        return () => {
            if (autosaveTimerRef.current) {
                window.clearTimeout(autosaveTimerRef.current);
            }
        };
    }, [legalSectionsState]);

    const save = async () => {
        // Client-side validation: ensure dropdown items have en/fr/ar labels
        const errors: Record<string, string> = {};
        for (const [hIdx, entry] of draft.header.entries()) {
            const isCodeEnabled =
                siteSettings?.config?.navigation?.enabled_dropdowns?.includes(
                    entry.pageKey,
                );
            if (
                isCodeEnabled &&
                entry.isDropdown &&
                Array.isArray(entry.items)
            ) {
                for (const [iIdx, item] of entry.items.entries()) {
                    const label = (item as any).label;
                    const key = `${hIdx}-${iIdx}`;
                    if (!label || typeof label !== 'object') {
                        errors[key] = 'Provide translations for EN / FR / AR';
                        continue;
                    }
                    for (const k of ['en', 'fr', 'ar']) {
                        if (
                            !label[k] ||
                            typeof label[k] !== 'string' ||
                            label[k].trim() === ''
                        ) {
                            errors[key] =
                                `Missing ${k.toUpperCase()} translation`;
                            break;
                        }
                    }
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setInvalidLabels(errors);
            // show first error as toast as well
            const firstMsg = Object.values(errors)[0];
            toast.error(firstMsg);
            return;
        }
        setInvalidLabels({});

        try {
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({
                    companyName: companyName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    whatsapp: whatsapp.trim(),
                    address: address.trim(),
                    plusCode: plusCode.trim(),
                    year,
                    socialLinks: socialLinks.filter(
                        (entry) =>
                            entry.label.trim().length > 0 &&
                            entry.href.trim().length > 0,
                    ),
                    hours: hours.filter(
                        (entry) =>
                            entry.dayKey.trim().length > 0 ||
                            entry.value.trim().length > 0,
                    ),
                    content: {
                        ...(siteSettings.content ?? {}),
                        nav: {
                            ...(siteSettings.content?.nav ?? {}),
                            settings: draft,
                        },
                        contact: {
                            ...(siteSettings.content?.contact ?? {}),
                            title: contactTitle,
                            description: contactDescription,
                        },
                    },
                    legalSections: buildLegalPayload(),
                }),
            });
            try {
                window.dispatchEvent(new CustomEvent('site-settings-updated'));
            } catch {}

            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        }
    };

    const handleReset = async () => {
        try {
            await reset();
            setDraft(DEFAULT_NAV_SETTINGS);
            toast.info('Reset navigation to defaults');
        } catch {
            toast.error(t('admin.settings.resetNavError'));
        }
    };

    if (loading || siteSettingsLoading) {
        return (
            <AdminLayout
                title="Site Settings"
                subtitle="Loading saved site configuration..."
            >
                <div className="space-y-6">
                    <Card className="p-4">
                        <div className="mb-4 h-6 w-44 animate-pulse rounded bg-muted" />
                        <div className="space-y-3">
                            <div className="h-16 animate-pulse rounded bg-muted/70" />
                            <div className="h-16 animate-pulse rounded bg-muted/70" />
                            <div className="h-16 animate-pulse rounded bg-muted/70" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="h-48 animate-pulse rounded bg-muted/70" />
                            <div className="h-48 animate-pulse rounded bg-muted/70" />
                            <div className="h-48 animate-pulse rounded bg-muted/70" />
                        </div>
                    </Card>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={t('admin.siteSettings')}
            subtitle={t('nav.settings')}
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="mr-1 h-4 w-4" />{' '}
                        {t('admin.settings.reset')}
                    </Button>
                    <Button size="sm" onClick={save}>
                        <Save className="mr-1 h-4 w-4" />{' '}
                        {t('admin.settings.save')}
                    </Button>
                </div>
            }
        >
            <div className="space-y-8">
                <section>
                    <h2 className="mb-3 font-serif text-xl font-bold">
                        {t('admin.settings.companyContact')}
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        {t('admin.settings.brandIdentity')}
                    </p>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="space-y-3 p-4">
                            <h3 className="font-medium">
                                {t('admin.settings.companyInfo')}
                            </h3>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.companyName')}</Label>
                                <Input
                                    value={companyName}
                                    onChange={(e) =>
                                        setCompanyName(e.target.value)
                                    }
                                    placeholder="BelAzur Travel"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.address')}</Label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="City, country"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.plusCode')}</Label>
                                <Input
                                    value={plusCode}
                                    onChange={(e) =>
                                        setPlusCode(e.target.value)
                                    }
                                    placeholder="8FVC9G8F+5V"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('admin.destinationForm.imageHelper')}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.year')}</Label>
                                <Input
                                    type="number"
                                    value={year}
                                    onChange={(e) =>
                                        setYear(Number(e.target.value) || year)
                                    }
                                    min={2000}
                                    max={2100}
                                />
                            </div>
                        </Card>

                        <Card className="space-y-3 p-4">
                            <h3 className="font-medium">
                                {t('admin.settings.contactDetails')}
                            </h3>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.email')}</Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="hello@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.phone')}</Label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.whatsapp')}</Label>
                                <Input
                                    value={whatsapp}
                                    onChange={(e) =>
                                        setWhatsapp(e.target.value)
                                    }
                                    placeholder="15551234567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.contactPageTitle')}</Label>
                                {['en', 'fr', 'ar'].map((lang) => (
                                    <Input
                                        key={`title-${lang}`}
                                        value={contactTitle[lang]}
                                        onChange={(e) =>
                                            setContactTitle((prev) => ({
                                                ...prev,
                                                [lang]: e.target.value,
                                            }))
                                        }
                                        placeholder={`${t('admin.settings.contactPageTitle')} (${lang.toUpperCase()})`}
                                    />
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    {t('admin.settings.contactPageDescription')}
                                </Label>
                                {['en', 'fr', 'ar'].map((lang) => (
                                    <Input
                                        key={`desc-${lang}`}
                                        value={contactDescription[lang]}
                                        onChange={(e) =>
                                            setContactDescription((prev) => ({
                                                ...prev,
                                                [lang]: e.target.value,
                                            }))
                                        }
                                        placeholder={`${t('admin.settings.contactPageDescription')} (${lang.toUpperCase()})`}
                                    />
                                ))}
                            </div>
                        </Card>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <Card className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">
                                    {t('admin.settings.socialMedia')}
                                </h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={addSocial}
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" />{' '}
                                    {t('admin.settings.addLink')}
                                </Button>
                            </div>
                            {socialLinks.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {t('admin.settings.noSocialLinks')}
                                </p>
                            )}
                            {socialLinks.map((entry, idx) => (
                                <div
                                    key={`social-${idx}`}
                                    className="grid grid-cols-1 items-end gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-12"
                                >
                                    <div className="md:col-span-4 text-left rtl:text-right">
                                        <Label className="text-xs">Label</Label>
                                        <Input
                                            value={entry.label}
                                            className="text-left rtl:text-right"
                                            onChange={(e) =>
                                                updateSocial(idx, {
                                                    label: e.target.value,
                                                })
                                            }
                                            placeholder="Instagram"
                                        />
                                    </div>
                                    <div className="md:col-span-7 text-center">
                                        <Label className="text-xs">URL</Label>
                                        <Input
                                            value={entry.href}
                                            className="text-center"
                                            onChange={(e) =>
                                                updateSocial(idx, {
                                                    href: e.target.value,
                                                })
                                            }
                                            placeholder="https://instagram.com/belazurtravel"
                                        />
                                    </div>
                                    <div className="md:col-span-1 flex justify-center items-end">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeSocial(idx)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </Card>

                        <Card className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">
                                    {t('admin.settings.businessHours')}
                                </h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={addHour}
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" />{' '}
                                    {t('admin.settings.addRow')}
                                </Button>
                            </div>
                            {hours.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center">
                                    {t('admin.settings.noHours')}
                                </p>
                            )}
                            {hours.map((entry, idx) => (
                                <div
                                    key={`hour-${idx}`}
                                    className="grid grid-cols-1 items-end gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-12"
                                >
                                    <div className="md:col-span-4 text-left rtl:text-right">
                                        <Label className="text-xs">
                                            {t('admin.settings.day')}
                                        </Label>
                                        <Input
                                            value={entry.dayKey}
                                            className="text-left rtl:text-right"
                                            onChange={(e) =>
                                                updateHour(idx, {
                                                    dayKey: e.target.value,
                                                })
                                            }
                                            placeholder="mon-fri"
                                        />
                                    </div>
                                    <div className="md:col-span-7 text-center">
                                        <Label className="text-xs">
                                            {t('admin.settings.hours')}
                                        </Label>
                                        <Input
                                            value={entry.value}
                                            className="text-center"
                                            onChange={(e) =>
                                                updateHour(idx, {
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="9:00 - 18:00"
                                        />
                                    </div>
                                    <div className="md:col-span-1 flex justify-center items-end">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeHour(idx)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-xl font-bold">
                                {t('admin.settings.legalSectionsTitle')}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t('admin.settings.legalSectionsDescription')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {legalAutosaveStatus !== 'idle' && (
                                <span className="text-xs text-muted-foreground">
                                    {legalAutosaveStatus === 'saving'
                                        ? 'Autosaving...'
                                        : legalAutosaveStatus === 'saved'
                                          ? 'Saved'
                                          : 'Autosave failed'}
                                </span>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={addLegalSection}
                            >
                                <Plus className="mr-1 h-4 w-4" /> Add Section
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {legalSectionsState.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No legal sections yet. Add Privacy Policy or
                                Terms of Use.
                            </p>
                        )}

                        {legalSectionsState.map((sec, idx) => (
                            <Card key={`legal-${idx}`} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <Label className="text-xs">
                                            Title (EN)
                                        </Label>
                                        <Input
                                            value={sec.title.en}
                                            onChange={(e) =>
                                                updateLegalSection(idx, {
                                                    title: {
                                                        ...sec.title,
                                                        en: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">
                                                    Title (FR)
                                                </Label>
                                                <Input
                                                    value={sec.title.fr}
                                                    onChange={(e) =>
                                                        updateLegalSection(
                                                            idx,
                                                            {
                                                                title: {
                                                                    ...sec.title,
                                                                    fr: e.target
                                                                        .value,
                                                                },
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">
                                                    Title (AR)
                                                </Label>
                                                <Input
                                                    value={sec.title.ar}
                                                    onChange={(e) =>
                                                        updateLegalSection(
                                                            idx,
                                                            {
                                                                title: {
                                                                    ...sec.title,
                                                                    ar: e.target
                                                                        .value,
                                                                },
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-3">
                                            <Label className="text-xs">
                                                Body format
                                            </Label>
                                            <Select
                                                value={sec.body.format}
                                                onValueChange={(v) =>
                                                    updateLegalSection(idx, {
                                                        body: {
                                                            ...sec.body,
                                                            format: v as LegalBodyFormat,
                                                        },
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="h-8 w-40">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="markdown">
                                                        Markdown
                                                    </SelectItem>
                                                    <SelectItem value="richtext">
                                                        Rich text
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center gap-2">
                                            {(['en', 'fr', 'ar'] as const).map(
                                                (langKey) => (
                                                    <Button
                                                        key={langKey}
                                                        size="sm"
                                                        variant={
                                                            getActiveLang(
                                                                idx,
                                                            ) === langKey
                                                                ? 'default'
                                                                : 'ghost'
                                                        }
                                                        onClick={() =>
                                                            setActiveLang(
                                                                idx,
                                                                langKey,
                                                            )
                                                        }
                                                    >
                                                        {langKey.toUpperCase()}
                                                    </Button>
                                                ),
                                            )}
                                        </div>

                                        {sec.body.format === 'markdown' ? (
                                            <>
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs">
                                                            Body (
                                                            {getActiveLang(
                                                                idx,
                                                            ).toUpperCase()}
                                                            )
                                                        </Label>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                toggleMarkdownPreview(
                                                                    idx,
                                                                    getActiveLang(
                                                                        idx,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            {markdownPreview[
                                                                `${idx}-${getActiveLang(idx)}`
                                                            ]
                                                                ? 'Edit'
                                                                : 'Preview'}
                                                        </Button>
                                                    </div>
                                                    {markdownPreview[
                                                        `${idx}-${getActiveLang(idx)}`
                                                    ] ? (
                                                        <div className="rounded-md border bg-background p-3">
                                                            <MarkdownRenderer
                                                                content={
                                                                    sec.body
                                                                        .content[
                                                                        getActiveLang(
                                                                            idx,
                                                                        )
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Textarea
                                                            value={
                                                                sec.body
                                                                    .content[
                                                                    getActiveLang(
                                                                        idx,
                                                                    )
                                                                ]
                                                            }
                                                            onChange={(e) =>
                                                                updateLegalSection(
                                                                    idx,
                                                                    {
                                                                        body: {
                                                                            ...sec.body,
                                                                            content:
                                                                                {
                                                                                    ...sec
                                                                                        .body
                                                                                        .content,
                                                                                    [getActiveLang(
                                                                                        idx,
                                                                                    )]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                },
                                                                        },
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="mt-3 space-y-3">
                                                <div>
                                                    <Label className="text-xs">
                                                        Body (
                                                        {getActiveLang(
                                                            idx,
                                                        ).toUpperCase()}
                                                        )
                                                    </Label>
                                                    <RichTextEditor
                                                        value={
                                                            sec.body.content[
                                                                getActiveLang(
                                                                    idx,
                                                                )
                                                            ]
                                                        }
                                                        onChange={(value) =>
                                                            updateLegalSection(
                                                                idx,
                                                                {
                                                                    body: {
                                                                        ...sec.body,
                                                                        content:
                                                                            {
                                                                                ...sec
                                                                                    .body
                                                                                    .content,
                                                                                [getActiveLang(
                                                                                    idx,
                                                                                )]:
                                                                                    value,
                                                                            },
                                                                    },
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (idx === 0) return;
                                                    const copy = [
                                                        ...legalSectionsState,
                                                    ];
                                                    [copy[idx - 1], copy[idx]] =
                                                        [
                                                            copy[idx],
                                                            copy[idx - 1],
                                                        ];
                                                    setLegalSectionsState(copy);
                                                }}
                                                disabled={idx === 0}
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    if (
                                                        idx ===
                                                        legalSectionsState.length -
                                                            1
                                                    )
                                                        return;
                                                    const copy = [
                                                        ...legalSectionsState,
                                                    ];
                                                    [copy[idx + 1], copy[idx]] =
                                                        [
                                                            copy[idx],
                                                            copy[idx + 1],
                                                        ];
                                                    setLegalSectionsState(copy);
                                                }}
                                                disabled={
                                                    idx ===
                                                    legalSectionsState.length -
                                                        1
                                                }
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() =>
                                                removeLegalSection(idx)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-xl font-bold">
                                {t('admin.settings.headerLinks')}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t('admin.settings.reorder')}
                            </p>
                        </div>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={draft.header.map((h) => h.pageKey)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid gap-3">
                                {draft.header.map((entry, idx) => {
                                    const page = getPage(entry.pageKey);
                                    if (!page) return null;

                                    const isCodeEnabled =
                                        siteSettings?.config?.navigation?.enabled_dropdowns?.includes(
                                            entry.pageKey,
                                        );

                                    return (
                                        <SortableHeaderRow
                                            key={entry.pageKey}
                                            entry={entry}
                                        >
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Checkbox
                                                            checked={
                                                                entry.enabled
                                                            }
                                                            onCheckedChange={(
                                                                v,
                                                            ) =>
                                                                setHeader(idx, {
                                                                    enabled:
                                                                        !!v,
                                                                })
                                                            }
                                                            id={`en-${entry.pageKey}`}
                                                        />
                                                        <Label
                                                            htmlFor={`en-${entry.pageKey}`}
                                                            className="cursor-pointer whitespace-nowrap font-semibold"
                                                        >
                                                            {t(
                                                                'nav.' +
                                                                    page.key,
                                                            ) ?? page.label}
                                                        </Label>
                                                        <span className="truncate text-xs text-muted-foreground">
                                                            {page.href}
                                                        </span>
                                                    </div>

                                                    {entry.enabled && (
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-xs text-muted-foreground">
                                                                    Placement
                                                                </Label>
                                                                <Select
                                                                    value={
                                                                        entry.placement
                                                                    }
                                                                    onValueChange={(
                                                                        v: any,
                                                                    ) =>
                                                                        setHeader(
                                                                            idx,
                                                                            {
                                                                                placement:
                                                                                    v,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-8 w-28">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="top">
                                                                            Top
                                                                            bar
                                                                        </SelectItem>
                                                                        <SelectItem value="more">
                                                                            +
                                                                            More
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            {isCodeEnabled && (
                                                                <div className="flex items-center gap-2">
                                                                    <Label className="text-xs">
                                                                        Dropdown
                                                                    </Label>
                                                                    <Switch
                                                                        checked={
                                                                            entry.isDropdown
                                                                        }
                                                                        onCheckedChange={(
                                                                            v,
                                                                        ) =>
                                                                            setHeader(
                                                                                idx,
                                                                                {
                                                                                    isDropdown:
                                                                                        v,
                                                                                },
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            )}
                                                            {isCodeEnabled &&
                                                                entry.isDropdown && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Label className="text-xs">
                                                                            Trigger
                                                                            links
                                                                            to
                                                                            page
                                                                        </Label>
                                                                        <Switch
                                                                            checked={
                                                                                entry.linkSelf
                                                                            }
                                                                            onCheckedChange={(
                                                                                v,
                                                                            ) =>
                                                                                setHeader(
                                                                                    idx,
                                                                                    {
                                                                                        linkSelf:
                                                                                            v,
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                )}
                                                            <div className="flex">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() =>
                                                                        moveBy(
                                                                            idx,
                                                                            -1,
                                                                        )
                                                                    }
                                                                    aria-label="Move up"
                                                                >
                                                                    <ArrowUp className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() =>
                                                                        moveBy(
                                                                            idx,
                                                                            1,
                                                                        )
                                                                    }
                                                                    aria-label="Move down"
                                                                >
                                                                    <ArrowDown className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {entry.enabled &&
                                                    isCodeEnabled &&
                                                    entry.isDropdown && (
                                                        <div className="space-y-2 border-t pt-4">
                                                            {' '}
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-medium">
                                                                    Dropdown
                                                                    items
                                                                </Label>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        addItem(
                                                                            idx,
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus className="mr-1 h-3.5 w-3.5" />{' '}
                                                                    Add item
                                                                </Button>
                                                            </div>
                                                            {entry.items
                                                                .length ===
                                                                0 && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    No items yet
                                                                    — add one.
                                                                </p>
                                                            )}
                                                            {entry.items.map(
                                                                (
                                                                    item,
                                                                    iIdx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            iIdx
                                                                        }
                                                                        className="grid grid-cols-1 items-end gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-12"
                                                                    >
                                                                        <div className="md:col-span-4">
                                                                            <Label className="text-xs">
                                                                                Label
                                                                                (EN)
                                                                            </Label>
                                                                            <Input
                                                                                value={
                                                                                    typeof (
                                                                                        item as any
                                                                                    )
                                                                                        .label ===
                                                                                    'string'
                                                                                        ? (
                                                                                              item as any
                                                                                          )
                                                                                              .label
                                                                                        : ((
                                                                                              item as any
                                                                                          )
                                                                                              .label
                                                                                              ?.en ??
                                                                                          '')
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateItem(
                                                                                        idx,
                                                                                        iIdx,
                                                                                        {
                                                                                            label: {
                                                                                                ...(typeof item.label ===
                                                                                                'object'
                                                                                                    ? item.label
                                                                                                    : {
                                                                                                          en:
                                                                                                              item.label ??
                                                                                                              '',
                                                                                                          fr:
                                                                                                              item.label ??
                                                                                                              '',
                                                                                                          ar:
                                                                                                              item.label ??
                                                                                                              '',
                                                                                                      }),
                                                                                                en: e
                                                                                                    .target
                                                                                                    .value,
                                                                                            },
                                                                                        },
                                                                                    )
                                                                                }
                                                                            />
                                                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                                                <div>
                                                                                    <Label className="text-xs">
                                                                                        Label
                                                                                        (FR)
                                                                                    </Label>
                                                                                    <Input
                                                                                        value={
                                                                                            typeof (
                                                                                                item as any
                                                                                            )
                                                                                                .label ===
                                                                                            'string'
                                                                                                ? (
                                                                                                      item as any
                                                                                                  )
                                                                                                      .label
                                                                                                : ((
                                                                                                      item as any
                                                                                                  )
                                                                                                      .label
                                                                                                      ?.fr ??
                                                                                                  '')
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateItem(
                                                                                                idx,
                                                                                                iIdx,
                                                                                                {
                                                                                                    label: {
                                                                                                        ...(typeof item.label ===
                                                                                                        'object'
                                                                                                            ? item.label
                                                                                                            : {
                                                                                                                  en:
                                                                                                                      item.label ??
                                                                                                                      '',
                                                                                                                  fr:
                                                                                                                      item.label ??
                                                                                                                      '',
                                                                                                                  ar:
                                                                                                                      item.label ??
                                                                                                                      '',
                                                                                                              }),
                                                                                                        fr: e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    },
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label className="text-xs">
                                                                                        Label
                                                                                        (AR)
                                                                                    </Label>
                                                                                    <Input
                                                                                        value={
                                                                                            typeof (
                                                                                                item as any
                                                                                            )
                                                                                                .label ===
                                                                                            'string'
                                                                                                ? (
                                                                                                      item as any
                                                                                                  )
                                                                                                      .label
                                                                                                : ((
                                                                                                      item as any
                                                                                                  )
                                                                                                      .label
                                                                                                      ?.ar ??
                                                                                                  '')
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateItem(
                                                                                                idx,
                                                                                                iIdx,
                                                                                                {
                                                                                                    label: {
                                                                                                        ...(typeof item.label ===
                                                                                                        'object'
                                                                                                            ? item.label
                                                                                                            : {
                                                                                                                  en:
                                                                                                                      item.label ??
                                                                                                                      '',
                                                                                                                  fr:
                                                                                                                      item.label ??
                                                                                                                      '',
                                                                                                                  ar:
                                                                                                                      item.label ??
                                                                                                                      '',
                                                                                                              }),
                                                                                                        ar: e
                                                                                                            .target
                                                                                                            .value,
                                                                                                    },
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            {invalidLabels[
                                                                                `${idx}-${iIdx}`
                                                                            ] && (
                                                                                <p className="mt-1 text-xs text-destructive">
                                                                                    {
                                                                                        invalidLabels[
                                                                                            `${idx}-${iIdx}`
                                                                                        ]
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="md:col-span-3">
                                                                            <Label className="text-xs">
                                                                                Mode
                                                                            </Label>
                                                                            <Select
                                                                                value={
                                                                                    item.mode
                                                                                }
                                                                                onValueChange={(
                                                                                    v: any,
                                                                                ) =>
                                                                                    updateItem(
                                                                                        idx,
                                                                                        iIdx,
                                                                                        {
                                                                                            mode: v,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger>
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="filter">
                                                                                        Filter
                                                                                        (
                                                                                        {page?.filterParam ||
                                                                                            'cat'}

                                                                                        )
                                                                                    </SelectItem>
                                                                                    <SelectItem value="categories">
                                                                                        Dynamic
                                                                                        Categories
                                                                                    </SelectItem>
                                                                                    <SelectItem value="search">
                                                                                        Search
                                                                                        keyword
                                                                                        (q)
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="md:col-span-4">
                                                                            {item.mode !==
                                                                                'categories' && (
                                                                                <>
                                                                                    <Label className="text-xs">
                                                                                        {item.mode ===
                                                                                        'filter'
                                                                                            ? 'Filter value'
                                                                                            : 'Search word'}
                                                                                    </Label>
                                                                                    <Input
                                                                                        value={
                                                                                            item.value
                                                                                        }
                                                                                        placeholder={
                                                                                            item.mode ===
                                                                                            'filter'
                                                                                                ? 'e.g. Beach'
                                                                                                : 'e.g. paradise'
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateItem(
                                                                                                idx,
                                                                                                iIdx,
                                                                                                {
                                                                                                    value: e
                                                                                                        .target
                                                                                                        .value,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                    />
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <div className="md:col-span-1">
                                                                            <Button
                                                                                size="icon"
                                                                                variant="ghost"
                                                                                onClick={() =>
                                                                                    removeItem(
                                                                                        idx,
                                                                                        iIdx,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </SortableHeaderRow>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </section>

                <section>
                    <h2 className="mb-3 font-serif text-xl font-bold">
                        {t('admin.settings.footerColumns')}
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        For each footer column, check which pages appear under
                        it.
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                        {draft.footer.map((col, colIdx) => (
                            <Card key={colIdx} className="p-4">
                                <Label className="text-xs font-medium">
                                    {t('admin.settings.columnTitle')}
                                </Label>
                                <div className="mb-2 grid grid-cols-1 gap-2">
                                    <Input
                                        value={
                                            typeof (col as any).title ===
                                            'string'
                                                ? (col as any).title
                                                : ((col as any).title?.en ?? '')
                                        }
                                        onChange={(e) =>
                                            updateFooterTitle(colIdx, {
                                                en: e.target.value,
                                            })
                                        }
                                        placeholder="Title (EN)"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={
                                                typeof (col as any).title ===
                                                'string'
                                                    ? (col as any).title
                                                    : ((col as any).title?.fr ??
                                                      '')
                                            }
                                            onChange={(e) =>
                                                updateFooterTitle(colIdx, {
                                                    fr: e.target.value,
                                                })
                                            }
                                            placeholder="Title (FR)"
                                        />
                                        <Input
                                            value={
                                                typeof (col as any).title ===
                                                'string'
                                                    ? (col as any).title
                                                    : ((col as any).title?.ar ??
                                                      '')
                                            }
                                            onChange={(e) =>
                                                updateFooterTitle(colIdx, {
                                                    ar: e.target.value,
                                                })
                                            }
                                            placeholder="Title (AR)"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={(e) =>
                                            handleFooterDragEnd(colIdx, e)
                                        }
                                    >
                                        <SortableContext
                                            items={col.pageKeys}
                                            strategy={
                                                verticalListSortingStrategy
                                            }
                                        >
                                            <div className="space-y-2">
                                                {col.pageKeys.map(
                                                    (key, pIdx) => {
                                                        const page =
                                                            getPage(key);
                                                        return (
                                                            <SortableFooterPage
                                                                key={key}
                                                                pageKey={key}
                                                                label={
                                                                    t(
                                                                        'nav.' +
                                                                            page?.key,
                                                                    ) ??
                                                                    page?.label ??
                                                                    ''
                                                                }
                                                                onRemove={() =>
                                                                    toggleFooterPage(
                                                                        colIdx,
                                                                        key,
                                                                    )
                                                                }
                                                                onMove={(dir) =>
                                                                    moveFooterPage(
                                                                        colIdx,
                                                                        pIdx,
                                                                        dir,
                                                                    )
                                                                }
                                                                isFirst={
                                                                    pIdx === 0
                                                                }
                                                                isLast={
                                                                    pIdx ===
                                                                    col.pageKeys
                                                                        .length -
                                                                        1
                                                                }
                                                            />
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </SortableContext>
                                    </DndContext>

                                    <Select
                                        value=""
                                        onValueChange={(val) =>
                                            toggleFooterPage(colIdx, val)
                                        }
                                    >
                                        <SelectTrigger className="mt-2 h-8 w-full text-xs">
                                            <div className="flex items-center gap-2">
                                                <Plus className="h-3 w-3" />
                                                Add Page
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AVAILABLE_PAGES.filter((p) => {
                                                // 1. Must be enabled in nav
                                                const navEntry =
                                                    draft.header.find(
                                                        (h) =>
                                                            h.pageKey === p.key,
                                                    );
                                                if (!navEntry?.enabled)
                                                    return false;

                                                // 2. Must not be in any column
                                                const inAnyCol =
                                                    draft.footer.some((c) =>
                                                        c.pageKeys.includes(
                                                            p.key,
                                                        ),
                                                    );
                                                return !inAnyCol;
                                            }).map((p) => (
                                                <SelectItem
                                                    key={p.key}
                                                    value={p.key}
                                                >
                                                    {t('nav.' + p.key) ??
                                                        p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
