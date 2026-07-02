import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, GripVertical, ArrowUp, ArrowDown, Plus, Trash2, CornerDownRight } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useCategoryTypes, type CategoryType } from '@/hooks/useCategoryTypes';
import { AVAILABLE_PAGES, getPage, DEFAULT_NAV_SETTINGS } from '@/lib/nav-config';
import {
    createLocalizedText,
    normalizeLocalizedText,
    normalizeNavSettingsDraft,
    type LocalizedText,
} from '@/lib/siteSettingsPayload';
import type { NavSettings, HeaderEntry, DropdownItemConfig } from '@/lib/nav-config';

const MAX_DEPTH = 2;

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

function updateItemAtPath(
    items: DropdownItemConfig[],
    path: number[],
    patch: Partial<DropdownItemConfig>,
): DropdownItemConfig[] {
    if (path.length === 0) return items;
    const [head, ...rest] = path;
    return items.map((item, i) => {
        if (i !== head) return item;
        if (rest.length === 0) {
            return { ...item, ...patch, children: patch.children ?? item.children };
        }
        if (!item.children) return item;
        return {
            ...item,
            children: updateItemAtPath(item.children, rest, patch),
        };
    });
}

function removeItemAtPath(items: DropdownItemConfig[], path: number[]): DropdownItemConfig[] {
    if (path.length === 0) return items;
    const [head, ...rest] = path;
    if (rest.length === 0) {
        return items.filter((_, i) => i !== head);
    }
    return items.map((item, i) => {
        if (i !== head || !item.children) return item;
        return { ...item, children: removeItemAtPath(item.children, rest) };
    });
}

function moveItemAtPath(
    items: DropdownItemConfig[],
    path: number[],
    direction: 'up' | 'down',
): DropdownItemConfig[] {
    if (path.length === 0) return items;
    const [head, ...rest] = path;
    if (rest.length === 0) {
        const swapIdx = direction === 'up' ? head - 1 : head + 1;
        if (swapIdx < 0 || swapIdx >= items.length) return items;
        const next = [...items];
        [next[head], next[swapIdx]] = [next[swapIdx], next[head]];
        return next;
    }
    return items.map((item, i) => {
        if (i !== head || !item.children) return item;
        return { ...item, children: moveItemAtPath(item.children, rest, direction) };
    });
}

function addItemAtPath(
    items: DropdownItemConfig[],
    parentPath: number[],
    newItem: DropdownItemConfig,
): DropdownItemConfig[] {
    if (parentPath.length === 0) {
        return [...items, newItem];
    }
    const [head, ...rest] = parentPath;
    return items.map((item, i) => {
        if (i !== head) return item;
        const children = item.children ?? [];
        if (rest.length === 0) {
            return { ...item, children: [...children, newItem] };
        }
        return { ...item, children: addItemAtPath(children, rest, newItem) };
    });
}

interface DropdownItemTreeProps {
    items: DropdownItemConfig[];
    depth: number;
    parentPath: number[];
    pageKey: string;
    page: ReturnType<typeof getPage>;
    categoryTypes: CategoryType[];
    allCategoryValues: { value: string; label: string }[];
    formErrors: Record<string, string>;
    errorPrefix: string;
    onAdd: (parentPath: number[]) => void;
    onUpdate: (path: number[], patch: Partial<DropdownItemConfig>) => void;
    onRemove: (path: number[]) => void;
    onMove: (path: number[], direction: 'up' | 'down') => void;
    lang: string;
    t: (key: string) => string;
}

function DropdownItemTree({
    items,
    depth,
    parentPath,
    pageKey,
    page,
    categoryTypes,
    allCategoryValues,
    formErrors,
    errorPrefix,
    onAdd,
    onUpdate,
    onRemove,
    onMove,
    lang,
    t,
}: DropdownItemTreeProps) {
    return (
        <div className={depth > 0 ? 'ml-4 border-l border-border/60 pl-3' : ''}>
            {items.map((item, iIdx) => {
                const itemPath = [...parentPath, iIdx];
                const hasChildren = (item.children?.length ?? 0) > 0;
                const canAddChild = depth < MAX_DEPTH;

                return (
                    <div key={iIdx} className="space-y-2 py-1">
                        <div className="grid grid-cols-1 items-end gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-12">
                            <div className="md:col-span-3">
                                <Label className="text-xs">{t('admin.settings.mode')}</Label>
                                <Select value={item.mode} onValueChange={(v: any) => onUpdate(itemPath, { mode: v, value: '' })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {page?.canHaveDropdown && <SelectItem value="categories">{t('admin.settings.dynamicCategories')}</SelectItem>}
                                        <SelectItem value="filter">{t('admin.settings.filter')} ({page?.filterParam || 'cat'})</SelectItem>
                                        <SelectItem value="search">{t('admin.settings.searchKeyword')} (q)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-7">
                                {item.mode === 'categories' ? (
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t('admin.settings.categoryType')}</Label>
                                        <Select
                                            value={item.value}
                                            onValueChange={(v) => {
                                                const selectedType = categoryTypes.find((ct) => ct.key === v);
                                                onUpdate(itemPath, {
                                                    value: v,
                                                    label: selectedType?.label ?? item.label,
                                                });
                                            }}
                                        >
                                            <SelectTrigger><SelectValue placeholder={t('admin.settings.selectCategoryType')} /></SelectTrigger>
                                            <SelectContent>
                                                {categoryTypes.map((ct) => (
                                                    <SelectItem key={ct.key} value={ct.key}>{ct.label[lang] ?? ct.label.en ?? ct.key}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : item.mode === 'filter' ? (
                                    allCategoryValues.length > 0 ? (
                                        <div className="space-y-1">
                                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">{t('admin.settings.category')}</Label>
                                            <Select value={item.value} onValueChange={(v) => onUpdate(itemPath, { value: v })}>
                                                <SelectTrigger><SelectValue placeholder={t('admin_settings_select_category')} /></SelectTrigger>
                                                <SelectContent>
                                                    {allCategoryValues.map((cv) => (
                                                        <SelectItem key={cv.value} value={cv.value}>{cv.label}</SelectItem>
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
                                            onUpdate(itemPath, { label: { ...current, [lang]: e.target.value } as LocalizedText });
                                        }}
                                        placeholder={`${t('admin_settings_label')} ${lang.toUpperCase()}`}
                                    />
                                ) : null}
                                {formErrors[errorPrefix] && (
                                    <p className="mt-1 text-xs text-destructive">{formErrors[errorPrefix]}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 md:col-span-2 md:justify-self-end">
                                {canAddChild && (
                                    <Button size="icon" variant="ghost" onClick={() => onAdd(itemPath)} title={t('admin.settings.addSubItem')}>
                                        <CornerDownRight className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button size="icon" variant="ghost" onClick={() => onMove(itemPath, 'up')} disabled={iIdx === 0} aria-label="Move up">
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => onMove(itemPath, 'down')} disabled={iIdx === items.length - 1} aria-label="Move down">
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => onRemove(itemPath)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                        {hasChildren && (
                            <DropdownItemTree
                                items={item.children!}
                                depth={depth + 1}
                                parentPath={itemPath}
                                pageKey={pageKey}
                                page={page}
                                categoryTypes={categoryTypes}
                                allCategoryValues={allCategoryValues}
                                formErrors={formErrors}
                                errorPrefix={errorPrefix}
                                onAdd={onAdd}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                                onMove={onMove}
                                lang={lang}
                                t={t}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function AdminSiteSettingsNav() {
    const { settings, loading } = useSiteSettings();
    const { t, lang } = useLanguage();
    const [draft, setDraft] = useState<NavSettings>({ header: [], footer: DEFAULT_NAV_SETTINGS.footer });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [selectedPage, setSelectedPage] = useState<string>('');

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

    const { data: destinationCategoryTypes = [] } = useCategoryTypes('destinations');
    const { data: hotelCategoryTypes = [] } = useCategoryTypes('hotels');
    const { data: tourCategoryTypes = [] } = useCategoryTypes('tours');
    const { data: carCategoryTypes = [] } = useCategoryTypes('cars');
    const { data: eventCategoryTypes = [] } = useCategoryTypes('events');
    const { data: dealCategoryTypes = [] } = useCategoryTypes('deals');
    const { data: blogCategoryTypes = [] } = useCategoryTypes('blog');

    const categoryTypesByPage = useMemo(() => ({
        destinations: destinationCategoryTypes, hotels: hotelCategoryTypes, tours: tourCategoryTypes,
        cars: carCategoryTypes, events: eventCategoryTypes, deals: dealCategoryTypes, blog: blogCategoryTypes,
    }), [destinationCategoryTypes, hotelCategoryTypes, tourCategoryTypes, carCategoryTypes, eventCategoryTypes, dealCategoryTypes, blogCategoryTypes]);

    // Build a flat list of all category values across all types for a given page
    // Used by the filter mode to show all values in one dropdown
    const getAllCategoryValuesForPage = useCallback((pageKey: string): { value: string; label: string }[] => {
        const types = categoryTypesByPage[pageKey as keyof typeof categoryTypesByPage] ?? [];
        const result: { value: string; label: string }[] = [];
        for (const ct of types) {
            for (const val of ct.values ?? []) {
                result.push({
                    value: `${ct.key}:${val.key}`,
                    label: `${ct.label[lang] ?? ct.label.en ?? ct.key} > ${val.name[lang] ?? val.name.en ?? val.key}`,
                });
            }
        }
        return result;
    }, [categoryTypesByPage, lang]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    useEffect(() => {
        const normalized = sanitizeNavSettings(settings.content?.nav?.settings ?? DEFAULT_NAV_SETTINGS);
        setDraft(normalizeNavSettingsDraft(normalized));
    }, [settings]);

    const enabledPageKeys = useMemo(
        () => new Set(draft.header.map((h) => h.pageKey)),
        [draft.header],
    );

    const availablePages = useMemo(
        () => AVAILABLE_PAGES.filter((p) => !enabledPageKeys.has(p.key)),
        [enabledPageKeys],
    );

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

    const addPage = useCallback(() => {
        if (!selectedPage) return;
        const page = getPage(selectedPage);
        if (!page) return;

        const newEntry: HeaderEntry = {
            pageKey: selectedPage,
            enabled: true,
            isDropdown: false,
            linkSelf: true,
            placement: 'more',
            items: [],
            label: createLocalizedText(t('nav.' + page.key)),
        };
        setDraft({ ...draft, header: [...draft.header, newEntry] });
        setSelectedPage('');
    }, [selectedPage, draft, t]);

    const removePage = useCallback((pageKey: string) => {
        setDraft({ ...draft, header: draft.header.filter((h) => h.pageKey !== pageKey) });
    }, [draft]);

    const makeNewItem = useCallback((pageKey: string): DropdownItemConfig => {
        const firstCategory = getCategoriesForPage(pageKey)[0];
        return {
            label: firstCategory ? normalizeLocalizedText(firstCategory.name) : createLocalizedText('New item'),
            mode: 'filter', value: firstCategory?.key ?? '',
        };
    }, [categoriesByPage]);

    const handleAddItem = useCallback((headerIdx: number, parentPath: number[]) => {
        const entry = draft.header[headerIdx];
        const newItem = makeNewItem(entry.pageKey);
        setHeader(headerIdx, {
            items: addItemAtPath(entry.items, parentPath, newItem),
        });
    }, [draft.header, makeNewItem]);

    const handleUpdateItem = useCallback((headerIdx: number, path: number[], patch: Partial<DropdownItemConfig>) => {
        const entry = draft.header[headerIdx];
        setHeader(headerIdx, {
            items: updateItemAtPath(entry.items, path, patch),
        });
    }, [draft.header]);

    const handleRemoveItem = useCallback((headerIdx: number, path: number[]) => {
        const entry = draft.header[headerIdx];
        setHeader(headerIdx, {
            items: removeItemAtPath(entry.items, path),
        });
    }, [draft.header]);

    const handleMoveItem = useCallback((headerIdx: number, path: number[], direction: 'up' | 'down') => {
        const entry = draft.header[headerIdx];
        setHeader(headerIdx, {
            items: moveItemAtPath(entry.items, path, direction),
        });
    }, [draft.header]);

    const validateItems = (items: DropdownItemConfig[], errorPrefix: string): Record<string, string> => {
        const errors: Record<string, string> = {};
        items.forEach((item, iIdx) => {
            const key = `${errorPrefix}-${iIdx}`;
            if (item.mode === 'categories') {
                if (item.children?.length) {
                    Object.assign(errors, validateItems(item.children, key));
                }
                return;
            }
            const rawLabel = (item as any).label;
            if (!rawLabel) {
                errors[key] = t('admin.settings.provideTranslations');
            } else {
                const label = normalizeLocalizedText(rawLabel);
                for (const k of ['en', 'fr', 'ar'] as const) {
                    if (!label[k]?.trim()) {
                        errors[key] = t('admin.settings.missingTranslation') + `: ${k.toUpperCase()}`;
                        break;
                    }
                }
            }
            if (item.children?.length) {
                Object.assign(errors, validateItems(item.children, key));
            }
        });
        return errors;
    };

    const save = async () => {
        const errors: Record<string, string> = {};
        for (const [hIdx, entry] of draft.header.entries()) {
            if (entry.isDropdown && Array.isArray(entry.items)) {
                Object.assign(errors, validateItems(entry.items, `${hIdx}`));
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
            {availablePages.length > 0 && (
                <Card className="mb-4 p-4">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <Label className="text-sm font-medium">{t('admin.settings.addPage')}</Label>
                            <Select value={selectedPage} onValueChange={setSelectedPage}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder={t('admin.settings.selectPageToAdd')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePages.map((p) => (
                                        <SelectItem key={p.key} value={p.key}>
                                            {t('nav.' + p.key)} <span className="ml-2 text-xs text-muted-foreground">{p.href}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={addPage} disabled={!selectedPage}>
                            <Plus className="mr-1 h-4 w-4" /> {t('admin.settings.addPage')}
                        </Button>
                    </div>
                </Card>
            )}

            {draft.header.length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                    {t('admin.settings.noPagesAdded')}
                </Card>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={draft.header.map((h) => h.pageKey)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-3">
                        {draft.header.map((entry, idx) => {
                            const page = getPage(entry.pageKey);
                            if (!page) return null;
                            const displayName = entry.label?.[lang] ?? entry.label?.en ?? t('nav.' + page.key);
                            return (
                                <SortableHeaderRow key={entry.pageKey} entry={entry}>
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="whitespace-nowrap font-semibold">{displayName}</span>
                                                <span className="truncate text-xs text-muted-foreground">{page.href}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs text-muted-foreground">{t('admin.settings.placement')}</Label>
                                                    <Select value={entry.placement} onValueChange={(v: any) => setHeader(idx, { placement: v })}>
                                                        <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="topbar">{t('admin.settings.topbarPlacement')}</SelectItem>
                                                            <SelectItem value="top">{t('admin.settings.mainNav')}</SelectItem>
                                                            <SelectItem value="more">{t('admin.settings.plusMore')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs">{t('admin.settings.dropdown')}</Label>
                                                    <Switch checked={entry.isDropdown} onCheckedChange={(v) => setHeader(idx, { isDropdown: v })} />
                                                </div>
                                                {entry.isDropdown && (
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs">{t('admin_settings_triggerLinks')}</Label>
                                                        <Switch checked={entry.linkSelf} onCheckedChange={(v) => setHeader(idx, { linkSelf: v })} />
                                                    </div>
                                                )}
                                                <Button size="icon" variant="ghost" onClick={() => removePage(entry.pageKey)} title={t('admin.settings.removePage')}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            {(['en', 'fr', 'ar'] as const).map((l) => (
                                                <div key={l}>
                                                    <Label className="text-xs uppercase text-muted-foreground">{l}</Label>
                                                    <Input
                                                        value={entry.label?.[l] ?? t('nav.' + page.key)}
                                                        onChange={(e) => {
                                                            const current = normalizeLocalizedText(entry.label ?? t('nav.' + page.key));
                                                            setHeader(idx, { label: { ...current, [l]: e.target.value } });
                                                        }}
                                                        className="mt-1"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {entry.isDropdown && (
                                            <div className="space-y-2 border-t pt-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">{t('admin.settings.dropdownItems')}</Label>
                                                    <Button size="sm" variant="outline" onClick={() => handleAddItem(idx, [])}>
                                                        <Plus className="mr-1 h-3.5 w-3.5" /> {t('admin.settings.addItem')}
                                                    </Button>
                                                </div>
                                                {entry.items.length === 0 && <p className="text-xs text-muted-foreground">{t('admin.settings.noItemsYet')}</p>}
                                                <DropdownItemTree
                                                    items={entry.items}
                                                    depth={0}
                                                    parentPath={[]}
                                                    pageKey={entry.pageKey}
                                                    page={page}
                                                    categoryTypes={categoryTypesByPage[entry.pageKey as keyof typeof categoryTypesByPage] ?? []}
                                                    allCategoryValues={getAllCategoryValuesForPage(entry.pageKey)}
                                                    formErrors={formErrors}
                                                    errorPrefix={`${idx}`}
                                                    onAdd={(parentPath) => handleAddItem(idx, parentPath)}
                                                    onUpdate={(path, patch) => handleUpdateItem(idx, path, patch)}
                                                    onRemove={(path) => handleRemoveItem(idx, path)}
                                                    onMove={(path, dir) => handleMoveItem(idx, path, dir)}
                                                    lang={lang}
                                                    t={t}
                                                />
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
