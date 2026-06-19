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
import { useState, useEffect, useMemo, useRef } from 'react';
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
import { useCategories, type PublicCategory } from '@/hooks/usePublicData';
import { Textarea } from '@/components/ui/textarea';
import { normalizeLegalBody, type LegalBodyFormat } from '@/lib/legal';
import {
    createLocalizedText,
    normalizeLocalizedText,
    normalizeNavSettingsDraft,
    normalizeSiteSettingsContentForSave,
    type LocalizedText,
} from '@/lib/siteSettingsPayload';
import {
    AVAILABLE_PAGES,
    getPage,
    DEFAULT_NAV_SETTINGS,
} from '@/lib/nav-config';
import {
    HOUR_DAY_KEYS,
    normalizeHours,
    type SiteHourEntry,
} from '@/lib/site-hours';
import type { NavSettings, HeaderEntry } from '@/lib/nav-config';

interface SocialLink {
    label: string;
    href: string;
}

interface HourRow extends SiteHourEntry {}

function sanitizeNavSettings(nav: NavSettings): NavSettings {
    const allowedPageKeys = new Set(AVAILABLE_PAGES.map((page) => page.key));

    return {
        header: nav.header.filter((entry) =>
            allowedPageKeys.has(entry.pageKey),
        ),
        footer: nav.footer.map((column) => ({
            ...column,
            pageKeys: column.pageKeys.filter((pageKey) =>
                allowedPageKeys.has(pageKey),
            ),
        })),
    };
}

function resolveCategoryLabel(
    category: PublicCategory,
    lang: 'en' | 'fr' | 'ar',
): string {
    return category.name[lang] ?? category.name.en ?? category.key;
}

function getCategoryByKey(
    categories: PublicCategory[],
    key: string,
): PublicCategory | undefined {
    return categories.find((category) => category.key === key);
}

function getLocalizedCategoryName(category: PublicCategory): LocalizedText {
    return normalizeLocalizedText(category.name);
}

function getDropdownLabelValue(
    item: HeaderEntry['items'][number],
    lang: 'en' | 'fr' | 'ar',
): string {
    return normalizeLocalizedText(
        (item as HeaderEntry['items'][number] & { label?: unknown }).label,
    )[lang];
}

function updateDropdownItemLabel(
    item: HeaderEntry['items'][number],
    lang: 'en' | 'fr' | 'ar',
    value: string,
): HeaderEntry['items'][number] {
    const current = normalizeLocalizedText(
        (item as HeaderEntry['items'][number] & { label?: unknown }).label,
    );

    return {
        ...item,
        label: {
            ...current,
            [lang]: value,
        } as LocalizedText,
    };
}

const DEFAULT_DAY_KEY = HOUR_DAY_KEYS[0];

function createHourRow(dayKey = DEFAULT_DAY_KEY): HourRow {
    return {
        dayKey,
        ranges: [{ value: '' }],
        closed: false,
    };
}

function normalizeHourRows(hours: SiteHourEntry[]): HourRow[] {
    return hours.map((entry) => ({
        dayKey: entry.dayKey,
        ranges:
            entry.ranges.length > 0
                ? entry.ranges.map((range) => ({ value: range.value }))
                : [{ value: '' }],
        closed: Boolean(entry.closed),
    }));
}

function serializeHourRows(
    hours: HourRow[],
): Array<{ dayKey: string; closed: boolean; ranges: string[] }> {
    return hours
        .map((entry) => ({
            dayKey: entry.dayKey.trim(),
            closed: Boolean(entry.closed),
            ranges: entry.closed
                ? []
                : entry.ranges
                      .map((range) => range.value.trim())
                      .filter((value) => value.length > 0),
        }))
        .filter((entry) => entry.dayKey.length > 0);
}

function updateHourRange(
    hours: HourRow[],
    hourIndex: number,
    rangeIndex: number,
    value: string,
): HourRow[] {
    return hours.map((hour, idx) => {
        if (idx !== hourIndex) {
            return hour;
        }

        return {
            ...hour,
            ranges: hour.ranges.map((range, i) =>
                i === rangeIndex ? { value } : range,
            ),
        };
    });
}

function removeHourRange(
    hours: HourRow[],
    hourIndex: number,
    rangeIndex: number,
): HourRow[] {
    return hours.map((hour, idx) => {
        if (idx !== hourIndex) {
            return hour;
        }

        const nextRanges = hour.ranges.filter((_, i) => i !== rangeIndex);
        return {
            ...hour,
            ranges: nextRanges.length > 0 ? nextRanges : [{ value: '' }],
        };
    });
}

function addHourRange(hours: HourRow[], hourIndex: number): HourRow[] {
    return hours.map((hour, idx) =>
        idx === hourIndex
            ? { ...hour, ranges: [...hour.ranges, { value: '' }] }
            : hour,
    );
}

function updateHourClosed(
    hours: HourRow[],
    hourIndex: number,
    closed: boolean,
): HourRow[] {
    return hours.map((hour, idx) =>
        idx === hourIndex
            ? {
                  ...hour,
                  closed,
                  ranges:
                      closed && hour.ranges.length === 0
                          ? [{ value: '' }]
                          : hour.ranges,
              }
            : hour,
    );
}

function updateHourDayKey(
    hours: HourRow[],
    hourIndex: number,
    dayKey: string,
): HourRow[] {
    return hours.map((hour, idx) =>
        idx === hourIndex ? { ...hour, dayKey } : hour,
    );
}

function HourRowEditor({
    hour,
    hourIndex,
    onDayKeyChange,
    onClosedChange,
    onAddRange,
    onRangeChange,
    onRemoveRange,
    onRemoveHour,
    t,
}: {
    hour: HourRow;
    hourIndex: number;
    onDayKeyChange: (dayKey: string) => void;
    onClosedChange: (closed: boolean) => void;
    onAddRange: () => void;
    onRangeChange: (rangeIndex: number, value: string) => void;
    onRemoveRange: (rangeIndex: number) => void;
    onRemoveHour: () => void;
    t: (key: string) => string;
}) {
    return (
        <Card className="space-y-3 p-3">
            <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-12">
                <div className="md:col-span-4">
                    <Label className="text-xs">{t('admin.settings.day')}</Label>
                    <Select value={hour.dayKey} onValueChange={onDayKeyChange}>
                        <SelectTrigger className="mt-1">
                            <SelectValue
                                placeholder={t('admin.settings.day')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {HOUR_DAY_KEYS.map((key) => (
                                <SelectItem key={key} value={key}>
                                    {t(key)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="md:col-span-6">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <Label className="text-xs">
                            {t('admin.settings.hours')}
                        </Label>
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Switch
                                checked={hour.closed}
                                onCheckedChange={onClosedChange}
                            />
                            {t('admin.settings.closed')}
                        </label>
                    </div>
                    {!hour.closed && (
                        <div className="space-y-2">
                            {hour.ranges.map((range, rangeIndex) => (
                                <div
                                    key={`${hour.dayKey}-${hourIndex}-${rangeIndex}`}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        value={range.value}
                                        onChange={(e) =>
                                            onRangeChange(
                                                rangeIndex,
                                                e.target.value,
                                            )
                                        }
                                        placeholder="09:00 - 12:00"
                                        className="flex-1"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() =>
                                            onRemoveRange(rangeIndex)
                                        }
                                        disabled={hour.ranges.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onAddRange}
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                {t('admin.settings.addTimeRange')}
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-end justify-end md:col-span-2">
                    <Button size="icon" variant="ghost" onClick={onRemoveHour}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>
        </Card>
    );
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
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [landingVideoFile, setLandingVideoFile] = useState<File | null>(null);
    const [landingVideoUrl, setLandingVideoUrl] = useState<string | null>(null);

    const { data: destinationCategories = [] } = useCategories('destinations');
    const { data: hotelCategories = [] } = useCategories('hotels');
    const { data: tourCategories = [] } = useCategories('tours');
    const { data: carCategories = [] } = useCategories('cars');
    const { data: eventCategories = [] } = useCategories('events');
    const { data: dealCategories = [] } = useCategories('deals');
    const { data: blogCategories = [] } = useCategories('blog');

    const categoriesByPage = useMemo(
        () => ({
            destinations: destinationCategories,
            hotels: hotelCategories,
            tours: tourCategories,
            cars: carCategories,
            events: eventCategories,
            deals: dealCategories,
            blog: blogCategories,
        }),
        [
            destinationCategories,
            hotelCategories,
            tourCategories,
            carCategories,
            eventCategories,
            dealCategories,
            blogCategories,
        ],
    );

    // Keep draft in sync when settings are loaded/changed externally
    // (e.g., after initial fetch or when reset is applied)
    useEffect(() => {
        // We ensure all AVAILABLE_PAGES have an entry in the header.
        // If a new page was added to nav-config.ts, it should appear in the admin.
        const normalizedSettings = sanitizeNavSettings(settings);
        const headerEntries = normalizedSettings.header || [];
        const currentKeys = headerEntries.map((h) => h.pageKey);
        const missingPages = AVAILABLE_PAGES.filter(
            (p) => !currentKeys.includes(p.key),
        );

        // Normalize: remove footer keys that are disabled in nav
        let footerNormalizedSettings = normalizedSettings;
        if (normalizedSettings.footer && normalizedSettings.header) {
            const enabledKeys = normalizedSettings.header
                .filter((h) => h.enabled)
                .map((h) => h.pageKey);
            footerNormalizedSettings = {
                ...normalizedSettings,
                footer: normalizedSettings.footer.map((col) => ({
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
            setDraft(
                normalizeNavSettingsDraft({
                    ...footerNormalizedSettings,
                    header: [...headerEntries, ...newEntries],
                }),
            );
        } else {
            setDraft(normalizeNavSettingsDraft(footerNormalizedSettings));
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
        setHours(normalizeHourRows(normalizeHours(siteSettings.hours || [])));
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
        setLandingVideoUrl(siteSettings.landingVideo?.url ?? null);
        setLandingVideoFile(null);
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

    const { t, lang } = useLanguage();

    const getCategoriesForPage = (pageKey: string): PublicCategory[] =>
        categoriesByPage[pageKey as keyof typeof categoriesByPage] ?? [];

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
        const firstCategory = getCategoriesForPage(entry.pageKey)[0];
        setHeader(idx, {
            items: [
                ...entry.items,
                {
                    label: firstCategory
                        ? getLocalizedCategoryName(firstCategory)
                        : createLocalizedText('New item'),
                    mode: 'filter',
                    value: firstCategory?.key ?? '',
                },
            ],
        });
    };

    const updateItem = (
        hIdx: number,
        iIdx: number,
        patch: Partial<
            HeaderEntry['items'][number] & {
                activeLang?: 'en' | 'fr' | 'ar';
            }
        >,
    ) => {
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
        setHours((prev) => [...prev, createHourRow()]);
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
                    const key = `${hIdx}-${iIdx}`;

                    // Skip label validation if mode is 'categories' (dynamic)
                    if (item.mode === 'categories') continue;

                    const rawLabel = (
                        item as HeaderEntry['items'][number] & {
                            label?: unknown;
                        }
                    ).label;
                    if (rawLabel === undefined || rawLabel === null) {
                        errors[key] = 'Provide translations for EN / FR / AR';
                        continue;
                    }

                    const label = normalizeLocalizedText(rawLabel);

                    for (const k of ['en', 'fr', 'ar'] as const) {
                        const val = label[k];
                        if (
                            val === undefined ||
                            val === null ||
                            (typeof val === 'string' && val.trim() === '')
                        ) {
                            errors[key] = t('admin.settings.missingTranslation').replace(':lang', k.toUpperCase());
                            break;
                        }
                    }
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            // show first error as toast as well
            const firstMsg = Object.values(errors)[0];
            toast.error(firstMsg);
            return;
        }
        setFormErrors({});

        try {
            const sanitizedDraft = normalizeNavSettingsDraft(
                sanitizeNavSettings(draft),
            );
            const normalizedContent = normalizeSiteSettingsContentForSave(
                siteSettings.content ?? {},
            );

            const payloadContent: Record<string, unknown> = {
                ...normalizedContent,
                nav: {
                    ...(normalizedContent.nav as
                        | Record<string, unknown>
                        | undefined),
                    settings: sanitizedDraft,
                },
            };

            // Handle landing video state
            if (landingVideoFile) {
                // New video file selected — handled via FormData below
            } else if (!landingVideoUrl && siteSettings.landingVideo?.url) {
                // Video was removed
                payloadContent.landing_video = null;
            }

            if (landingVideoFile) {
                const formData = new FormData();
                formData.append('video', landingVideoFile);
                formData.append('companyName', companyName.trim());
                formData.append('email', email.trim());
                formData.append('phone', phone.trim());
                formData.append('whatsapp', whatsapp.trim());
                formData.append('address', address.trim());
                formData.append('plusCode', plusCode.trim());
                formData.append('year', String(year));
                formData.append(
                    'socialLinks',
                    JSON.stringify(
                        socialLinks.filter(
                            (entry) =>
                                entry.label.trim().length > 0 &&
                                entry.href.trim().length > 0,
                        ),
                    ),
                );
                formData.append(
                    'hours',
                    JSON.stringify(
                        serializeHourRows(hours).filter(
                            (entry) =>
                                entry.dayKey.trim().length > 0 &&
                                (entry.closed || entry.ranges.length > 0),
                        ),
                    ),
                );
                formData.append('content', JSON.stringify(payloadContent));
                formData.append(
                    'legalSections',
                    JSON.stringify(buildLegalPayload()),
                );
                formData.append('_method', 'PUT');

                await apiFetch('/api/site-settings', {
                    method: 'POST',
                    body: formData,
                });
            } else {
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
                        hours: serializeHourRows(hours).filter(
                            (entry) =>
                                entry.dayKey.trim().length > 0 &&
                                (entry.closed || entry.ranges.length > 0),
                        ),
                        content: payloadContent,
                        legalSections: buildLegalPayload(),
                    }),
                });
            }

            setLandingVideoFile(null);
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
                                    placeholder={t(
                                        'admin.settings.placeholder.companyName',
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.address')}</Label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder={t(
                                        'admin.settings.placeholder.address',
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.plusCode')}</Label>
                                <Input
                                    value={plusCode}
                                    onChange={(e) =>
                                        setPlusCode(e.target.value)
                                    }
                                    placeholder={t(
                                        'admin.settings.placeholder.plusCode',
                                    )}
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
                                    placeholder={t(
                                        'admin.settings.placeholder.email',
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.phone')}</Label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder={t(
                                        'admin.settings.placeholder.phone',
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('admin.settings.whatsapp')}</Label>
                                <Input
                                    value={whatsapp}
                                    onChange={(e) =>
                                        setWhatsapp(e.target.value)
                                    }
                                    placeholder={t(
                                        'admin.settings.placeholder.whatsapp',
                                    )}
                                />
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
                                    <div className="text-left md:col-span-4 rtl:text-right">
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
                                    <div className="text-center md:col-span-7">
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
                                    <div className="flex items-end justify-center md:col-span-1">
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
                            <p className="text-xs text-muted-foreground">
                                {t('admin.settings.openingHoursHelp')}
                            </p>
                            {hours.length === 0 && (
                                <p className="text-center text-xs text-muted-foreground">
                                    {t('admin.settings.noHours')}
                                </p>
                            )}
                            <div className="space-y-3">
                                {hours.map((entry, idx) => (
                                    <HourRowEditor
                                        key={`hour-${idx}`}
                                        hour={entry}
                                        hourIndex={idx}
                                        onDayKeyChange={(dayKey) =>
                                            setHours((prev) =>
                                                updateHourDayKey(
                                                    prev,
                                                    idx,
                                                    dayKey,
                                                ),
                                            )
                                        }
                                        onClosedChange={(closed) =>
                                            setHours((prev) =>
                                                updateHourClosed(
                                                    prev,
                                                    idx,
                                                    closed,
                                                ),
                                            )
                                        }
                                        onAddRange={() =>
                                            setHours((prev) =>
                                                addHourRange(prev, idx),
                                            )
                                        }
                                        onRangeChange={(rangeIndex, value) =>
                                            setHours((prev) =>
                                                updateHourRange(
                                                    prev,
                                                    idx,
                                                    rangeIndex,
                                                    value,
                                                ),
                                            )
                                        }
                                        onRemoveRange={(rangeIndex) =>
                                            setHours((prev) =>
                                                removeHourRange(
                                                    prev,
                                                    idx,
                                                    rangeIndex,
                                                ),
                                            )
                                        }
                                        onRemoveHour={() => removeHour(idx)}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </Card>
                    </div>
                </section>

                <section>
                    <h2 className="mb-3 font-serif text-xl font-bold">
                        Landing Video
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Video that appears as a modal when visitors open the homepage.
                    </p>

                    <Card className="space-y-4 p-4">
                        {landingVideoUrl && (
                            <div className="space-y-2">
                                <video
                                    src={landingVideoUrl}
                                    controls
                                    className="max-h-48 w-full rounded-lg"
                                />
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                        setLandingVideoUrl(null);
                                        setLandingVideoFile(null);
                                    }}
                                >
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                    Remove Video
                                </Button>
                            </div>
                        )}
                        {!landingVideoUrl && (
                            <div className="space-y-2">
                                <Label htmlFor="landing-video-input">
                                    Upload Video
                                </Label>
                                <input
                                    id="landing-video-input"
                                    type="file"
                                    accept="video/mp4,video/webm,video/quicktime"
                                    className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        if (file) {
                                            setLandingVideoFile(file);
                                            setLandingVideoUrl(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Max 50MB. Formats: MP4, WebM, MOV.
                                </p>
                            </div>
                        )}
                    </Card>
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
                                <Plus className="mr-1 h-4 w-4" />{' '}
                                {t('admin.settings.add_section')}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {legalSectionsState.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                {t('admin.settings.no_legal_sections')}
                            </p>
                        )}

                        {legalSectionsState.map((sec, idx) => (
                            <Card key={`legal-${idx}`} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <Label className="text-xs">
                                            {t('admin.settings.title_en')}
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
                                                    {t(
                                                        'admin.settings.title_fr',
                                                    )}
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
                                                    {t(
                                                        'admin.settings.title_ar',
                                                    )}
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
                                                {t(
                                                    'admin.settings.body_format',
                                                )}
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
                                                        {t(
                                                            'admin.settings.markdown',
                                                        )}
                                                    </SelectItem>
                                                    <SelectItem value="richtext">
                                                        {t(
                                                            'admin.settings.richtext',
                                                        )}
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
                                                            {t(
                                                                'admin.settings.body',
                                                            )}{' '}
                                                            (
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
                                                                ? t(
                                                                      'admin.settings.edit',
                                                                  )
                                                                : t(
                                                                      'admin.settings.preview',
                                                                  )}
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
                                                                    {t(
                                                                        'admin_settings_placement',
                                                                    )}
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
                                                                        {t(
                                                                            'admin_settings_dropdown',
                                                                        )}
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
                                                                            {t(
                                                                                'admin_settings_triggerLinks',
                                                                            )}
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
                                                                    $
                                                                    {t(
                                                                        'admin.settings.addItem',
                                                                    )}
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
                                                                        <div className="md:col-span-3">
                                                                            <Label className="text-xs">
                                                                                {t(
                                                                                    'admin_settings_mode',
                                                                                )}
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
                                                                                    {page?.canHaveDropdown && (
                                                                                        <SelectItem value="categories">
                                                                                            Dynamic
                                                                                            Categories
                                                                                        </SelectItem>
                                                                                    )}
                                                                                    <SelectItem value="search">
                                                                                        Search
                                                                                        keyword
                                                                                        (q)
                                                                                    </SelectItem>{' '}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="md:col-span-8">
                                                                            {item.mode ===
                                                                            'categories' ? null : item.mode ===
                                                                              'filter' ? (
                                                                                getCategoriesForPage(
                                                                                    entry.pageKey,
                                                                                )
                                                                                    .length >
                                                                                0 ? (
                                                                                    <div className="space-y-1">
                                                                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                                            Category
                                                                                        </Label>
                                                                                        <Select
                                                                                            value={
                                                                                                item.value
                                                                                            }
                                                                                            onValueChange={(
                                                                                                value,
                                                                                            ) =>
                                                                                                updateItem(
                                                                                                    idx,
                                                                                                    iIdx,
                                                                                                    {
                                                                                                        value,
                                                                                                        label: getCategoryByKey(
                                                                                                            getCategoriesForPage(
                                                                                                                entry.pageKey,
                                                                                                            ),
                                                                                                            value,
                                                                                                        )
                                                                                                            ? getLocalizedCategoryName(
                                                                                                                  getCategoryByKey(
                                                                                                                      getCategoriesForPage(
                                                                                                                          entry.pageKey,
                                                                                                                      ),
                                                                                                                      value,
                                                                                                                  )!,
                                                                                                              )
                                                                                                            : item.label,
                                                                                                    },
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <SelectTrigger>
                                                                                                <SelectValue
                                                                                                    placeholder={t(
                                                                                                        'admin.settings.selectCategory',
                                                                                                    )}
                                                                                                />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {getCategoriesForPage(
                                                                                                    entry.pageKey,
                                                                                                ).map(
                                                                                                    (
                                                                                                        category,
                                                                                                    ) => (
                                                                                                        <SelectItem
                                                                                                            key={String(
                                                                                                                category.id,
                                                                                                            )}
                                                                                                            value={
                                                                                                                category.key
                                                                                                            }
                                                                                                        >
                                                                                                            {resolveCategoryLabel(
                                                                                                                category,
                                                                                                                lang,
                                                                                                            )}
                                                                                                        </SelectItem>
                                                                                                    ),
                                                                                                )}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                ) : null
                                                                            ) : item.mode ===
                                                                              'search' ? (
                                                                                <div className="space-y-2">
                                                                                    <div className="flex items-center gap-1">
                                                                                        {(
                                                                                            [
                                                                                                'en',
                                                                                                'fr',
                                                                                                'ar',
                                                                                            ] as const
                                                                                        ).map(
                                                                                            (
                                                                                                langKey,
                                                                                            ) => {
                                                                                                const activeLabelLang =
                                                                                                    (
                                                                                                        item as HeaderEntry['items'][number] & {
                                                                                                            activeLang?:
                                                                                                                | 'en'
                                                                                                                | 'fr'
                                                                                                                | 'ar';
                                                                                                        }
                                                                                                    )
                                                                                                        .activeLang ??
                                                                                                    'en';

                                                                                                return (
                                                                                                    <Button
                                                                                                        key={
                                                                                                            langKey
                                                                                                        }
                                                                                                        type="button"
                                                                                                        size="sm"
                                                                                                        variant={
                                                                                                            activeLabelLang ===
                                                                                                            langKey
                                                                                                                ? 'default'
                                                                                                                : 'ghost'
                                                                                                        }
                                                                                                        className="h-7 px-2 text-xs"
                                                                                                        onClick={() =>
                                                                                                            updateItem(
                                                                                                                idx,
                                                                                                                iIdx,
                                                                                                                {
                                                                                                                    activeLang:
                                                                                                                        langKey,
                                                                                                                },
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        {langKey.toUpperCase()}
                                                                                                    </Button>
                                                                                                );
                                                                                            },
                                                                                        )}
                                                                                    </div>
                                                                                    <Input
                                                                                        value={getDropdownLabelValue(
                                                                                            item,
                                                                                            (
                                                                                                item as HeaderEntry['items'][number] & {
                                                                                                    activeLang?:
                                                                                                        | 'en'
                                                                                                        | 'fr'
                                                                                                        | 'ar';
                                                                                                }
                                                                                            )
                                                                                                .activeLang ??
                                                                                                'en',
                                                                                        )}
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            updateItem(
                                                                                                idx,
                                                                                                iIdx,
                                                                                                updateDropdownItemLabel(
                                                                                                    item,
                                                                                                    (
                                                                                                        item as HeaderEntry['items'][number] & {
                                                                                                            activeLang?:
                                                                                                                | 'en'
                                                                                                                | 'fr'
                                                                                                                | 'ar';
                                                                                                        }
                                                                                                    )
                                                                                                        .activeLang ??
                                                                                                        'en',
                                                                                                    e
                                                                                                        .target
                                                                                                        .value,
                                                                                                ),
                                                                                            )
                                                                                        }
                                                                                        placeholder={`${t('admin_settings_label')} ${(
                                                                                            item as HeaderEntry['items'][number] & {
                                                                                                activeLang?:
                                                                                                    | 'en'
                                                                                                    | 'fr'
                                                                                                    | 'ar';
                                                                                            }
                                                                                        ).activeLang?.toUpperCase()}`}
                                                                                    />
                                                                                </div>
                                                                            ) : null}
                                                                            {formErrors[
                                                                                `${idx}-${iIdx}`
                                                                            ] && (
                                                                                <p className="mt-1 text-xs text-destructive">
                                                                                    {
                                                                                        formErrors[
                                                                                            `${idx}-${iIdx}`
                                                                                        ]
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="md:col-span-1 md:justify-self-end">
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
                                        placeholder={t(
                                            'admin.settings.placeholder.titleEN',
                                        )}
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
                                            placeholder={t(
                                                'admin.settings.placeholder.titleFR',
                                            )}
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
                                            placeholder={t(
                                                'admin.settings.placeholder.titleAR',
                                            )}
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
