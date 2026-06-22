import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, GripVertical, ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCategories, type PublicCategory } from '@/hooks/usePublicData';
import { AVAILABLE_PAGES, getPage, DEFAULT_NAV_SETTINGS } from '@/lib/nav-config';
import {
    createLocalizedText,
    normalizeLocalizedText,
    normalizeNavSettingsDraft,
    type LocalizedText,
} from '@/lib/siteSettingsPayload';
import type { NavSettings, HeaderEntry } from '@/lib/nav-config';

function sanitizeNavSettings(nav: NavSettings): NavSettings {
    const allowedPageKeys = new Set(AVAILABLE_PAGES.map((p) => p.key));
    return {
        header: nav.header.filter((e) => allowedPageKeys.has(e.pageKey)),
        footer: nav.footer.map((c) => ({
            ...c,
            pageKeys: c.pageKeys.filter((k) => allowedPageKeys.has(k)),
        })),
    };
}

function SortableHeaderRow({ entry, children }: { entry: HeaderEntry; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.pageKey });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
    return (
        <Card ref={setNodeRef} style={style} className="p-4">
            <div className="flex items-start gap-2">
                <button {...attributes} {...listeners} className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" aria-label="Drag to reorder">
                    <GripVertical className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </Card>
    );
}

export default function AdminSiteSettingsNav() {
    const { settings, loading } = useSiteSettings();
    const { t, lang } = useLanguage();
    const [draft, setDraft] = useState<NavSettings>(DEFAULT_NAV_SETTINGS);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const { data: destinationCategories = [] } = useCategories('destinations');
    const { data: hotelCategories = [] } = useCategories('hotels');
    const { data: tourCategories = [] } = useCategories('tours');
    const { data: carCategories = [] } = useCategories('cars');
    const { data: eventCategories = [] } = useCategories('events');
    const { data: dealCategories = [] } = useCategories('deals');
    const { data: blogCategories = [] } = useCategories('blog');

    const categoriesByPage = useMemo(() => ({
        destinations: destinationCategories, hotels: hotelCategories, tours: tourCategories,
        cars: carCategories, events: eventCategories, deals: dealCategories, blog: blogCategories,
    }), [destinationCategories, hotelCategories, tourCategories, carCategories, eventCategories, dealCategories, blogCategories]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    useEffect(() => {
        const normalized = sanitizeNavSettings(settings.content?.nav?.settings ?? DEFAULT_NAV_SETTINGS);
        const headerEntries = normalized.header || [];
        const currentKeys = headerEntries.map((h) => h.pageKey);
        const missingPages = AVAILABLE_PAGES.filter((p) => !currentKeys.includes(p.key));

        if (missingPages.length > 0) {
            const newEntries: HeaderEntry[] = missingPages.map((p) => ({
                pageKey: p.key, enabled: false, isDropdown: false, linkSelf: true, placement: 'more', items: [],
            }));
            setDraft(normalizeNavSettingsDraft({ ...normalized, header: [...headerEntries, ...newEntries] }));
        } else {
            setDraft(normalizeNavSettingsDraft(normalized));
        }
    }, [settings]);

    const setHeader = (idx: number, patch: Partial<HeaderEntry>) => {
        const nextHeader = draft.header.map((h, i) => (i === idx ? { ...h, ...patch } : h));
        setDraft({ ...draft, header: nextHeader });
    };

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;
        const oldIndex = draft.header.findIndex((h) => h.pageKey === active.id);
        const newIndex = draft.header.findIndex((h) => h.pageKey === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        setDraft({ ...draft, header: arrayMove(draft.header, oldIndex, newIndex) });
    };

    const getCategoriesForPage = (pageKey: string): PublicCategory[] =>
        categoriesByPage[pageKey as keyof typeof categoriesByPage] ?? [];

    const addItem = (idx: number) => {
        const entry = draft.header[idx];
        const firstCategory = getCategoriesForPage(entry.pageKey)[0];
        setHeader(idx, {
            items: [...entry.items, {
                label: firstCategory ? normalizeLocalizedText(firstCategory.name) : createLocalizedText('New item'),
                mode: 'filter', value: firstCategory?.key ?? '',
            }],
        });
    };

    const updateItem = (hIdx: number, iIdx: number, patch: Partial<HeaderEntry['items'][number]>) => {
        const entry = draft.header[hIdx];
        setHeader(hIdx, { items: entry.items.map((it, i) => (i === iIdx ? { ...it, ...patch } : it)) });
    };

    const removeItem = (hIdx: number, iIdx: number) => {
        const entry = draft.header[hIdx];
        setHeader(hIdx, { items: entry.items.filter((_, i) => i !== iIdx) });
    };

    const save = async () => {
        const errors: Record<string, string> = {};
        for (const [hIdx, entry] of draft.header.entries()) {
            const isCodeEnabled = settings?.config?.navigation?.enabled_dropdowns?.includes(entry.pageKey);
            if (isCodeEnabled && entry.isDropdown && Array.isArray(entry.items)) {
                for (const [iIdx, item] of entry.items.entries()) {
                    if (item.mode === 'categories') continue;
                    const rawLabel = (item as any).label;
                    if (!rawLabel) { errors[`${hIdx}-${iIdx}`] = 'Provide translations'; continue; }
                    const label = normalizeLocalizedText(rawLabel);
                    for (const k of ['en', 'fr', 'ar'] as const) {
                        if (!label[k]?.trim()) { errors[`${hIdx}-${iIdx}`] = `Missing ${k.toUpperCase()} translation`; break; }
                    }
                }
            }
        }
        if (Object.keys(errors).length > 0) { setFormErrors(errors); toast.error(Object.values(errors)[0]); return; }
        setFormErrors({});

        try {
            const sanitizedDraft = normalizeNavSettingsDraft(sanitizeNavSettings(draft));
            const normalizedContent = settings.content ?? {};
            const payloadContent: Record<string, unknown> = {
                ...normalizedContent,
                nav: { ...(normalizedContent.nav as any), settings: sanitizedDraft },
            };
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({ content: payloadContent }),
            });
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        }
    };

    if (loading) {
        return (
            <AdminLayout title={t('admin.settings.headerLinks')} subtitle={t('nav.settings')}>
                <Card className="p-4"><div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-muted/70" />)}</div></Card>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={t('admin.settings.headerLinks')}
            subtitle={t('admin.settings.reorder')}
            actions={<Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" /> {t('admin.settings.save')}</Button>}
        >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={draft.header.map((h) => h.pageKey)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                        {draft.header.map((entry, idx) => {
                            const page = getPage(entry.pageKey);
                            if (!page) return null;
                            const isCodeEnabled = settings?.config?.navigation?.enabled_dropdowns?.includes(entry.pageKey);
                            return (
                                <SortableHeaderRow key={entry.pageKey} entry={entry}>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <Checkbox checked={entry.enabled} onCheckedChange={(v) => setHeader(idx, { enabled: !!v })} id={`en-${entry.pageKey}`} />
                                                <Label htmlFor={`en-${entry.pageKey}`} className="cursor-pointer whitespace-nowrap font-semibold">
                                                    {t('nav.' + page.key) ?? page.label}
                                                </Label>
                                                <span className="truncate text-xs text-muted-foreground">{page.href}</span>
                                            </div>
                                            {entry.enabled && (
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs text-muted-foreground">Placement</Label>
                                                        <Select value={entry.placement} onValueChange={(v: any) => setHeader(idx, { placement: v })}>
                                                            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="top">Top bar</SelectItem>
                                                                <SelectItem value="more">+ More</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    {isCodeEnabled && (
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs">Dropdown</Label>
                                                            <Switch checked={entry.isDropdown} onCheckedChange={(v) => setHeader(idx, { isDropdown: v })} />
                                                        </div>
                                                    )}
                                                    {isCodeEnabled && entry.isDropdown && (
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs">Trigger links</Label>
                                                            <Switch checked={entry.linkSelf} onCheckedChange={(v) => setHeader(idx, { linkSelf: v })} />
                                                        </div>
                                                    )}
                                                    <div className="flex">
                                                        <Button size="icon" variant="ghost" onClick={() => setHeader(idx, { items: entry.items })} aria-label="Move up">
                                                            <ArrowUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => {}} aria-label="Move down">
                                                            <ArrowDown className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {entry.enabled && isCodeEnabled && entry.isDropdown && (
                                            <div className="space-y-2 border-t pt-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">Dropdown items</Label>
                                                    <Button size="sm" variant="outline" onClick={() => addItem(idx)}>
                                                        <Plus className="mr-1 h-3.5 w-3.5" /> {t('admin.settings.addItem')}
                                                    </Button>
                                                </div>
                                                {entry.items.length === 0 && <p className="text-xs text-muted-foreground">No items yet</p>}
                                                {entry.items.map((item, iIdx) => (
                                                    <div key={iIdx} className="grid grid-cols-1 items-end gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-12">
                                                        <div className="md:col-span-3">
                                                            <Label className="text-xs">Mode</Label>
                                                            <Select value={item.mode} onValueChange={(v: any) => updateItem(idx, iIdx, { mode: v })}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="filter">Filter ({page?.filterParam || 'cat'})</SelectItem>
                                                                    {page?.canHaveDropdown && <SelectItem value="categories">Dynamic Categories</SelectItem>}
                                                                    <SelectItem value="search">Search keyword (q)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="md:col-span-8">
                                                            {item.mode === 'categories' ? null : item.mode === 'filter' ? (
                                                                getCategoriesForPage(entry.pageKey).length > 0 ? (
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
                                                                        <Select value={item.value} onValueChange={(v) => updateItem(idx, iIdx, { value: v })}>
                                                                            <SelectTrigger><SelectValue placeholder={t('admin.settings.selectCategory')} /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {getCategoriesForPage(entry.pageKey).map((cat) => (
                                                                                    <SelectItem key={String(cat.id)} value={cat.key}>{cat.name[lang] ?? cat.name.en ?? cat.key}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                ) : null
                                                            ) : item.mode === 'search' ? (
                                                                <Input
                                                                    value={(item as any).label?.[lang] ?? ''}
                                                                    onChange={(e) => {
                                                                        const current = normalizeLocalizedText((item as any).label);
                                                                        updateItem(idx, iIdx, { label: { ...current, [lang]: e.target.value } as LocalizedText });
                                                                    }}
                                                                    placeholder={`Label ${lang.toUpperCase()}`}
                                                                />
                                                            ) : null}
                                                            {formErrors[`${idx}-${iIdx}`] && (
                                                                <p className="mt-1 text-xs text-destructive">{formErrors[`${idx}-${iIdx}`]}</p>
                                                            )}
                                                        </div>
                                                        <div className="md:col-span-1 md:justify-self-end">
                                                            <Button size="icon" variant="ghost" onClick={() => removeItem(idx, iIdx)}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </SortableHeaderRow>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
        </AdminLayout>
    );
}
