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
    Loader2,
    Save,
    GripVertical,
    ArrowUp,
    ArrowDown,
    Plus,
    Trash2,
    CornerDownRight,
    FolderPlus,
    Settings,
    ChevronDown,
    ChevronRight,
    Layers,
    Link2,
    Menu,
    AlertCircle,
    Info,
    X,
    CheckCircle2,
    MoveRight,
    Eye,
    EyeOff,
    FolderOpen,
    MoreHorizontal,
    Type,
    Globe,
    Search,
    Filter,
    Tag,
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCategories, type PublicCategory } from '@/hooks/usePublicData';
import { useCategoryTypes, type CategoryType } from '@/hooks/useCategoryTypes';
import {
    AVAILABLE_PAGES,
    getPage,
    DEFAULT_NAV_SETTINGS,
    getNextGroupKey,
    getPagesInGroups,
    createGroupPageEntry,
    createGroupLink,
    getNextLinkKey,
    createNavLink,
    buildNavLinkHref,
} from '@/lib/nav-config';
import {
    createLocalizedText,
    normalizeLocalizedText,
    normalizeNavSettingsDraft,
    type LocalizedText,
} from '@/lib/siteSettingsPayload';
import {
    getStaticFiltersForPage,
    STATIC_FILTERS_BY_PAGE,
} from '@/lib/nav-static-filters';
import type {
    NavSettings,
    HeaderEntry,
    DropdownItemConfig,
    NavGroup,
    GroupPageEntry,
    NavGroupLink,
    NavLink,
} from '@/lib/nav-config';

const MAX_DEPTH = 2;

/* ───────────────────────────────────────────────
   Helper Functions (unchanged logic)
   ─────────────────────────────────────────────── */

function sanitizeNavSettings(nav: NavSettings): NavSettings {
    const allowedPageKeys = new Set(AVAILABLE_PAGES.map((p) => p.key));
    const sanitizeGroups = (groups: NavGroup[]): NavGroup[] =>
        groups.map((g) => ({
            ...g,
            pages: (g.pages ?? []).filter((p) =>
                allowedPageKeys.has(p.pageKey),
            ),
            links: (g.links ?? []).filter((l) =>
                allowedPageKeys.has(l.pageKey),
            ),
            groups: g.groups ? sanitizeGroups(g.groups) : [],
        }));
    return {
        header: nav.header.filter((e) => allowedPageKeys.has(e.pageKey)),
        footer: nav.footer.map((c) => ({
            ...c,
            pageKeys: c.pageKeys.filter((k) => allowedPageKeys.has(k)),
        })),
        groups: Array.isArray(nav.groups) ? sanitizeGroups(nav.groups) : [],
        links: Array.isArray(nav.links)
            ? nav.links.filter((l) => allowedPageKeys.has(l.targetPageKey))
            : [],
    };
}

/* ─── Tree manipulation helpers ─── */
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
            return {
                ...item,
                ...patch,
                children: patch.children ?? item.children,
            };
        }
        if (!item.children) return item;
        return {
            ...item,
            children: updateItemAtPath(item.children, rest, patch),
        };
    });
}

function removeItemAtPath(
    items: DropdownItemConfig[],
    path: number[],
): DropdownItemConfig[] {
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
        return {
            ...item,
            children: moveItemAtPath(item.children, rest, direction),
        };
    });
}

function addItemAtPath(
    items: DropdownItemConfig[],
    parentPath: number[],
    newItem: DropdownItemConfig,
): DropdownItemConfig[] {
    if (parentPath.length === 0) return [...items, newItem];
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

/* ───────────────────────────────────────────────
   ENHANCED UI COMPONENTS
   ─────────────────────────────────────────────── */

/** Visual badge showing what type of nav element this is */
function NavBadge({
    type,
}: {
    type: 'header' | 'group' | 'subgroup' | 'dropdown' | 'item';
}) {
    const { t } = useLanguage();
    const config = {
        header: {
            icon: Link2,
            label: t('admin.settings.navBadgeHeader'),
            color: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        group: {
            icon: FolderOpen,
            label: t('admin.settings.navBadgeGroup'),
            color: 'bg-amber-50 text-amber-700 border-amber-200',
        },
        subgroup: {
            icon: Layers,
            label: t('admin.settings.navBadgeSubGroup'),
            color: 'bg-orange-50 text-orange-700 border-orange-200',
        },
        dropdown: {
            icon: ChevronDown,
            label: t('admin.settings.navBadgeDropdown'),
            color: 'bg-purple-50 text-purple-700 border-purple-200',
        },
        item: {
            icon: Tag,
            label: t('admin.settings.navBadgeItem'),
            color: 'bg-slate-50 text-slate-600 border-slate-200',
        },
    };
    const { icon: Icon, label, color } = config[type];
    return (
        <Badge
            variant="outline"
            className={`${color} gap-1 text-[10px] font-medium uppercase tracking-wider`}
        >
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}

/** Empty state with helpful context */
function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <Card className="border-2 border-dashed bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 rounded-full bg-muted p-3">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                    {title}
                </h3>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    {description}
                </p>
                {action && <div className="mt-4">{action}</div>}
            </CardContent>
        </Card>
    );
}

/** Section header with clear title and optional help tooltip */
function SectionHeader({
    title,
    description,
    icon: Icon,
    action,
    badge,
}: {
    title: string;
    description?: string;
    icon: React.ElementType;
    action?: React.ReactNode;
    badge?: string;
}) {
    return (
        <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight">
                            {title}
                        </h2>
                        {badge && (
                            <Badge variant="secondary" className="text-[10px]">
                                {badge}
                            </Badge>
                        )}
                    </div>
                    {description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

/** Drag handle with better visual affordance */
function DragHandle({
    attributes,
    listeners,
    label,
}: {
    attributes: any;
    listeners: any;
    label: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    {...attributes}
                    {...listeners}
                    className="flex cursor-grab touch-none flex-col items-center gap-0.5 rounded-md p-1.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground active:cursor-grabbing"
                    aria-label={label}
                >
                    <GripVertical className="h-5 w-5" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="left">
                <p className="text-xs">{label}</p>
            </TooltipContent>
        </Tooltip>
    );
}

/* ─── Sortable Header Row (enhanced) ─── */
function SortableHeaderRow({
    entry,
    children,
    dragLabel,
}: {
    entry: HeaderEntry;
    children: React.ReactNode;
    dragLabel?: string;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `header-${entry.pageKey}`,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };
    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`overflow-hidden transition-shadow ${isDragging ? 'shadow-xl ring-2 ring-primary/40' : 'shadow-sm hover:shadow-md'}`}
        >
            <div className="flex items-start gap-1 p-5">
                <DragHandle
                    attributes={attributes}
                    listeners={listeners}
                    label={dragLabel || ''}
                />
                <div className="min-w-0 flex-1 pt-0.5">{children}</div>
            </div>
        </Card>
    );
}

/* ─── Mini Language Toggle for Dropdown Items ─── */
function MiniLangToggle({
    lang,
    onLanguageChange,
}: {
    lang: string;
    onLanguageChange: (l: 'fr' | 'en' | 'ar') => void;
}) {
    return null;
}

/* ─── Enhanced Dropdown Item Tree ─── */
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
    const [localLang, setLocalLang] = useState<'fr' | 'en' | 'ar'>(
        lang as 'fr' | 'en' | 'ar',
    );
    useEffect(() => {
        setLocalLang(lang as 'fr' | 'en' | 'ar');
    }, [lang]);

    if (items.length === 0) return null;

    return (
        <div
            className={
                depth > 0
                    ? 'ml-6 border-l-2 border-dashed border-border/50 pl-4'
                    : ''
            }
        >
            {depth === 0 && (
                <div className="mb-2 flex items-center justify-start">
                    <MiniLangToggle
                        lang={localLang}
                        onLanguageChange={setLocalLang}
                    />
                </div>
            )}
            {items.map((item, iIdx) => {
                const itemPath = [...parentPath, iIdx];
                const hasChildren = (item.children?.length ?? 0) > 0;
                const canAddChild = depth < MAX_DEPTH;
                const errorKey = `${errorPrefix}-${iIdx}`;
                const hasError = !!formErrors[errorKey];

                const modeIcons = {
                    categories: <Tag className="h-3.5 w-3.5" />,
                    filter: <Filter className="h-3.5 w-3.5" />,
                    search: <Search className="h-3.5 w-3.5" />,
                };

                return (
                    <div key={iIdx} className="py-1">
                        <div
                            className={`rounded-lg border bg-card p-3 transition-colors ${hasError ? 'border-destructive/50 bg-destructive/5' : 'border-border/60 hover:border-border'}`}
                        >
                            {/* Item Header Row */}
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <NavBadge type="item" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {depth === 0
                                            ? t('admin.settings.levelOneItem')
                                            : t('admin.settings.subItem')}
                                    </span>
                                    {hasError && (
                                        <Badge
                                            variant="destructive"
                                            className="gap-1 text-[10px]"
                                        >
                                            <AlertCircle className="h-3 w-3" />
                                            {t(
                                                'admin.settings.translationRequired',
                                            )}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {canAddChild && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() =>
                                                        onAdd(itemPath)
                                                    }
                                                >
                                                    <CornerDownRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-xs">
                                                    {t(
                                                        'admin.settings.addSubItem',
                                                    )}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                    onMove(itemPath, 'up')
                                                }
                                                disabled={iIdx === 0}
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                {t('admin.settings.moveUp')}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                    onMove(itemPath, 'down')
                                                }
                                                disabled={
                                                    iIdx === items.length - 1
                                                }
                                            >
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                {t('admin.settings.moveDown')}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() =>
                                                    onRemove(itemPath)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                {t('admin.settings.removeItem')}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Item Configuration Grid */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                {/* Mode Selector */}
                                <div className="md:col-span-3">
                                    <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                        {modeIcons[
                                            item.mode as keyof typeof modeIcons
                                        ] || <Settings className="h-3 w-3" />}
                                        {t('admin.settings.mode')}
                                    </Label>
                                    <Select
                                        value={item.mode}
                                        onValueChange={(v: any) =>
                                            onUpdate(itemPath, {
                                                mode: v,
                                                value: '',
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {page?.canHaveDropdown && (
                                                <SelectItem value="categories">
                                                    <span className="flex items-center gap-2">
                                                        <Tag className="h-3.5 w-3.5" />
                                                        {t(
                                                            'admin.settings.dynamicCategories',
                                                        )}
                                                    </span>
                                                </SelectItem>
                                            )}
                                            <SelectItem value="filter">
                                                <span className="flex items-center gap-2">
                                                    <Filter className="h-3.5 w-3.5" />
                                                    {t('admin.settings.filter')}{' '}
                                                    (
                                                    {page?.filterParam || 'cat'}
                                                    )
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="search">
                                                <span className="flex items-center gap-2">
                                                    <Search className="h-3.5 w-3.5" />
                                                    {t(
                                                        'admin.settings.searchKeyword',
                                                    )}{' '}
                                                    (q)
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Value/Label Input */}
                                <div className="md:col-span-7">
                                    {item.mode === 'categories' ? (
                                        <div>
                                            <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                <Type className="h-3 w-3" />
                                                {t(
                                                    'admin.settings.categoryType',
                                                )}
                                            </Label>
                                            <Select
                                                value={item.value}
                                                onValueChange={(v) => {
                                                    // Check if it's a static filter group
                                                    if (
                                                        v.startsWith('static:')
                                                    ) {
                                                        const groupKey =
                                                            v.replace(
                                                                'static:',
                                                                '',
                                                            );
                                                        const staticGroup =
                                                            getStaticFiltersForPage(
                                                                pageKey,
                                                            ).find(
                                                                (g) =>
                                                                    g.key ===
                                                                    groupKey,
                                                            );
                                                        if (staticGroup) {
                                                            onUpdate(itemPath, {
                                                                value: v,
                                                                label: staticGroup.label as unknown as LocalizedText,
                                                            });
                                                            return;
                                                        }
                                                    }
                                                    // Dynamic API category type
                                                    const selectedType =
                                                        categoryTypes.find(
                                                            (ct) =>
                                                                ct.key === v,
                                                        );
                                                    onUpdate(itemPath, {
                                                        value: v,
                                                        label:
                                                            selectedType?.label ??
                                                            item.label,
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue
                                                        placeholder={t(
                                                            'admin.settings.selectCategoryType',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Static filter groups from config */}
                                                    {getStaticFiltersForPage(
                                                        pageKey,
                                                    ).map((group) => (
                                                        <SelectItem
                                                            key={`static:${group.key}`}
                                                            value={`static:${group.key}`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <Filter className="h-3.5 w-3.5 text-blue-500" />
                                                                {group.label[
                                                                    localLang
                                                                ] ??
                                                                    group.label
                                                                        .en ??
                                                                    group.key}
                                                                <Badge
                                                                    variant="outline"
                                                                    className="ml-auto text-[8px]"
                                                                >
                                                                    Static
                                                                </Badge>
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                    {/* Dynamic API category types */}
                                                    {categoryTypes.map((ct) => (
                                                        <SelectItem
                                                            key={ct.key}
                                                            value={ct.key}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <Tag className="h-3.5 w-3.5" />
                                                                {ct.label[
                                                                    localLang
                                                                ] ??
                                                                    ct.label
                                                                        .en ??
                                                                    ct.key}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {item.value?.startsWith(
                                                'static:',
                                            ) && ( null
                                            )}
                                        </div>
                                    ) : item.mode === 'filter' ? (
                                        allCategoryValues.length > 0 ? (
                                            <div>
                                                <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Filter className="h-3 w-3" />
                                                    {t(
                                                        'admin.settings.category',
                                                    )}
                                                </Label>
                                                <Select
                                                    value={item.value}
                                                    onValueChange={(v) =>
                                                        onUpdate(itemPath, {
                                                            value: v,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue
                                                            placeholder={t(
                                                                'admin_settings_select_category',
                                                            )}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {allCategoryValues.map(
                                                            (cv) => (
                                                                <SelectItem
                                                                    key={
                                                                        cv.value
                                                                    }
                                                                    value={
                                                                        cv.value
                                                                    }
                                                                >
                                                                    {cv.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/30 px-3 text-xs text-muted-foreground">
                                                <Info className="mr-2 h-3.5 w-3.5" />
                                                {t(
                                                    'admin.settings.noCategoriesAvailable',
                                                )}
                                            </div>
                                        )
                                    ) : item.mode === 'search' ? (
                                        <div>
                                            <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                <Type className="h-3 w-3" />
                                                {t('admin_settings_label')}
                                            </Label>
                                            <Input
                                                value={
                                                    (item as any).label?.[
                                                        localLang
                                                    ] ?? ''
                                                }
                                                onChange={(e) => {
                                                    const current =
                                                        normalizeLocalizedText(
                                                            (item as any).label,
                                                        );
                                                    onUpdate(itemPath, {
                                                        label: {
                                                            ...current,
                                                            [localLang]:
                                                                e.target.value,
                                                        } as LocalizedText,
                                                    });
                                                }}
                                                placeholder={`${t('admin_settings_label')}`}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    ) : null}
                                    {hasError && (
                                        <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle className="h-3 w-3" />
                                            {formErrors[errorKey]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Nested Children */}
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
                                errorPrefix={errorKey}
                                onAdd={onAdd}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                                onMove={onMove}
                                lang={localLang}
                                t={t}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Group Sub-Page Link Tree ─── */
interface GroupLinkTreeProps {
    items: NavGroupLink[];
    depth: number;
    parentPath: number[];
    parentPageKey: string;
    categoryTypesByPage: Record<string, CategoryType[]>;
    getAllCategoryValuesForPage: (
        pageKey: string,
    ) => { value: string; label: string }[];
    formErrors: Record<string, string>;
    errorPrefix: string;
    onAdd: (parentPath: number[], parentPageKey: string) => void;
    onUpdate: (path: number[], patch: Partial<DropdownItemConfig>) => void;
    onRemove: (path: number[]) => void;
    onMove: (path: number[], direction: 'up' | 'down') => void;
    lang: string;
    t: (key: string) => string;
}

function GroupLinkTree({
    items,
    depth,
    parentPath,
    parentPageKey,
    categoryTypesByPage,
    getAllCategoryValuesForPage,
    formErrors,
    errorPrefix,
    onAdd,
    onUpdate,
    onRemove,
    onMove,
    lang,
    t,
}: GroupLinkTreeProps) {
    const [localLang, setLocalLang] = useState<'fr' | 'en' | 'ar'>(
        lang as 'fr' | 'en' | 'ar',
    );
    useEffect(() => {
        setLocalLang(lang as 'fr' | 'en' | 'ar');
    }, [lang]);

    if (items.length === 0) return null;

    const modeIcons = {
        categories: <Tag className="h-3.5 w-3.5" />,
        filter: <Filter className="h-3.5 w-3.5" />,
        search: <Search className="h-3.5 w-3.5" />,
    };

    return (
        <div
            className={
                depth > 0
                    ? 'ml-6 border-l-2 border-dashed border-border/50 pl-4'
                    : ''
            }
        >
            {depth === 0 && (
                <div className="mb-2 flex items-center justify-start">
                    <MiniLangToggle
                        lang={localLang}
                        onLanguageChange={setLocalLang}
                    />
                </div>
            )}
            {items.map((item, iIdx) => {
                const itemPath = [...parentPath, iIdx];
                const effectivePageKey = item.pageKey || parentPageKey;
                const page = getPage(effectivePageKey);
                const hasChildren = (item.children?.length ?? 0) > 0;
                const canAddChild = depth < MAX_DEPTH;
                const errorKey = `${errorPrefix}-${iIdx}`;
                const hasError = !!formErrors[errorKey];

                const typeOptions =
                    categoryTypesByPage[
                        effectivePageKey as keyof typeof categoryTypesByPage
                    ] ?? [];
                const valueOptions =
                    getAllCategoryValuesForPage(effectivePageKey);

                return (
                    <div key={iIdx} className="py-1">
                        <div
                            className={`rounded-lg border bg-card p-3 transition-colors ${hasError ? 'border-destructive/50 bg-destructive/5' : 'border-border/60 hover:border-border'}`}
                        >
                            {/* Item Header Row */}
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <NavBadge type="item" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {depth === 0
                                            ? t('admin.settings.subPage')
                                            : t('admin.settings.subItem')}
                                    </span>
                                    {hasError && (
                                        <Badge
                                            variant="destructive"
                                            className="gap-1 text-[10px]"
                                        >
                                            <AlertCircle className="h-3 w-3" />
                                            {t(
                                                'admin.settings.translationRequired',
                                            )}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {canAddChild && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() =>
                                                        onAdd(
                                                            itemPath,
                                                            effectivePageKey,
                                                        )
                                                    }
                                                >
                                                    <CornerDownRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="text-xs">
                                                    {t(
                                                        'admin.settings.addSubItem',
                                                    )}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                    onMove(itemPath, 'up')
                                                }
                                                disabled={iIdx === 0}
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                {t('admin.settings.moveUp')}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() =>
                                                    onMove(itemPath, 'down')
                                                }
                                                disabled={
                                                    iIdx === items.length - 1
                                                }
                                            >
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                {t('admin.settings.moveDown')}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() =>
                                                    onRemove(itemPath)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p className="text-xs">
                                                {t('admin.settings.removeItem')}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Configuration Grid */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                {/* Target Page */}
                                <div className="md:col-span-4">
                                    <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Globe className="h-3 w-3" />
                                        {t('admin.settings.targetPage')}
                                    </Label>
                                    <Select
                                        value={effectivePageKey}
                                        onValueChange={(v) => {
                                            const canDropdown =
                                                getPage(v)?.canHaveDropdown ??
                                                false;
                                            const nextMode =
                                                item.mode === 'categories' &&
                                                !canDropdown
                                                    ? 'filter'
                                                    : item.mode;
                                            onUpdate(itemPath, {
                                                pageKey: v,
                                                mode: nextMode,
                                                value: '',
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue
                                                placeholder={t(
                                                    'admin.settings.selectTargetPage',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AVAILABLE_PAGES.map((p) => (
                                                <SelectItem
                                                    key={p.key}
                                                    value={p.key}
                                                >
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span>
                                                            {t('nav.' + p.key)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {p.href}
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Mode Selector */}
                                <div className="md:col-span-4">
                                    <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                        {modeIcons[
                                            item.mode as keyof typeof modeIcons
                                        ] || <Settings className="h-3 w-3" />}
                                        {t('admin.settings.mode')}
                                    </Label>
                                    <Select
                                        value={item.mode}
                                        onValueChange={(v: any) =>
                                            onUpdate(itemPath, {
                                                mode: v,
                                                value: '',
                                            })
                                        }
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {page?.canHaveDropdown && (
                                                <SelectItem value="categories">
                                                    <span className="flex items-center gap-2">
                                                        <Tag className="h-3.5 w-3.5" />
                                                        {t(
                                                            'admin.settings.dynamicCategories',
                                                        )}
                                                    </span>
                                                </SelectItem>
                                            )}
                                            <SelectItem value="filter">
                                                <span className="flex items-center gap-2">
                                                    <Filter className="h-3.5 w-3.5" />
                                                    {t('admin.settings.filter')}{' '}
                                                    (
                                                    {page?.filterParam || 'cat'}
                                                    )
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="search">
                                                <span className="flex items-center gap-2">
                                                    <Search className="h-3.5 w-3.5" />
                                                    {t(
                                                        'admin.settings.searchKeyword',
                                                    )}{' '}
                                                    (q)
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Value / Link Target */}
                                <div className="md:col-span-4">
                                    {item.mode === 'categories' ? (
                                        <div>
                                            <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                <Type className="h-3 w-3" />
                                                {t(
                                                    'admin.settings.categoryType',
                                                )}
                                            </Label>
                                            <Select
                                                value={item.value}
                                                onValueChange={(v) => {
                                                    // Check if it's a static filter group
                                                    if (
                                                        v.startsWith('static:')
                                                    ) {
                                                        const groupKey =
                                                            v.replace(
                                                                'static:',
                                                                '',
                                                            );
                                                        const staticGroup =
                                                            getStaticFiltersForPage(
                                                                effectivePageKey,
                                                            ).find(
                                                                (g) =>
                                                                    g.key ===
                                                                    groupKey,
                                                            );
                                                        if (staticGroup) {
                                                            onUpdate(itemPath, {
                                                                value: v,
                                                                label: staticGroup.label as unknown as LocalizedText,
                                                            });
                                                            return;
                                                        }
                                                    }
                                                    // Dynamic API category type
                                                    const selectedType =
                                                        typeOptions.find(
                                                            (ct) =>
                                                                ct.key === v,
                                                        );
                                                    onUpdate(itemPath, {
                                                        value: v,
                                                        label:
                                                            selectedType?.label ??
                                                            item.label,
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue
                                                        placeholder={t(
                                                            'admin.settings.selectCategoryType',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {/* Static filter groups from config */}
                                                    {getStaticFiltersForPage(
                                                        effectivePageKey,
                                                    ).map((group) => (
                                                        <SelectItem
                                                            key={`static:${group.key}`}
                                                            value={`static:${group.key}`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <Filter className="h-3.5 w-3.5 text-blue-500" />
                                                                {group.label[
                                                                    localLang
                                                                ] ??
                                                                    group.label
                                                                        .en ??
                                                                    group.key}
                                                                <Badge
                                                                    variant="outline"
                                                                    className="ml-auto text-[8px]"
                                                                >
                                                                    Static
                                                                </Badge>
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                    {/* Dynamic API category types */}
                                                    {typeOptions.map((ct) => (
                                                        <SelectItem
                                                            key={ct.key}
                                                            value={ct.key}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <Tag className="h-3.5 w-3.5" />
                                                                {ct.label[
                                                                    localLang
                                                                ] ??
                                                                    ct.label
                                                                        .en ??
                                                                    ct.key}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : item.mode === 'filter' ? (
                                        valueOptions.length > 0 ? (
                                            <div>
                                                <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Filter className="h-3 w-3" />
                                                    {t(
                                                        'admin.settings.category',
                                                    )}
                                                </Label>
                                                <Select
                                                    value={item.value}
                                                    onValueChange={(v) =>
                                                        onUpdate(itemPath, {
                                                            value: v,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger className="h-9 text-xs">
                                                        <SelectValue
                                                            placeholder={t(
                                                                'admin_settings_select_category',
                                                            )}
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {valueOptions.map(
                                                            (cv) => (
                                                                <SelectItem
                                                                    key={
                                                                        cv.value
                                                                    }
                                                                    value={
                                                                        cv.value
                                                                    }
                                                                >
                                                                    {cv.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/30 px-3 text-xs text-muted-foreground">
                                                <Info className="mr-2 h-3.5 w-3.5" />
                                                {t(
                                                    'admin.settings.noCategoriesAvailable',
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/30 px-3 text-xs text-muted-foreground">
                                            <Info className="mr-2 h-3.5 w-3.5" />
                                            {t(
                                                'admin.settings.searchUsesLabel',
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Label Translations */}
                                <div className="rounded-md bg-muted/20 p-2 md:col-span-12">
                                    <Label className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Globe className="h-3 w-3" />
                                        {t('admin_settings_label')}
                                    </Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(['fr'] as const).map((l) => (
                                            <div key={l}>
                                                <Input
                                                    value={
                                                        item.label?.[l] ?? ''
                                                    }
                                                    onChange={(e) => {
                                                        const current =
                                                            normalizeLocalizedText(
                                                                item.label,
                                                            );
                                                        onUpdate(itemPath, {
                                                            label: {
                                                                ...current,
                                                                [l]: e.target
                                                                    .value,
                                                            } as LocalizedText,
                                                        });
                                                    }}
                                                    placeholder={`${t('admin_settings_label')}`}
                                                    className="mt-1 h-9 text-xs"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {hasError && (
                                <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    {formErrors[errorKey]}
                                </p>
                            )}
                        </div>

                        {/* Nested Children */}
                        {hasChildren && (
                            <GroupLinkTree
                                items={item.children as NavGroupLink[]}
                                depth={depth + 1}
                                parentPath={itemPath}
                                parentPageKey={effectivePageKey}
                                categoryTypesByPage={categoryTypesByPage}
                                getAllCategoryValuesForPage={
                                    getAllCategoryValuesForPage
                                }
                                formErrors={formErrors}
                                errorPrefix={errorKey}
                                onAdd={onAdd}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                                onMove={onMove}
                                lang={localLang}
                                t={t}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Enhanced Group Card ─── */
interface GroupCardProps {
    group: NavGroup;
    parentKey?: string;
    allGroups: NavGroup[];
    depth: number;
    availablePages: ReturnType<typeof getPage>[];
    onUpdate: (patch: Partial<NavGroup>) => void;
    onRemove: () => void;
    onAddPage: (pageKey: string) => void;
    onRemovePage: (pageKey: string) => void;
    onMovePage: (pageKey: string, direction: 'up' | 'down') => void;
    onUpdatePage: (pageKey: string, patch: Partial<GroupPageEntry>) => void;
    onAddSubGroup: () => void;
    onUpdateSubGroup: (
        parentKey: string,
        subGroupKey: string,
        patch: Partial<NavGroup>,
    ) => void;
    onRemoveSubGroup: (parentKey: string, subGroupKey: string) => void;
    onAddPageToSubGroup: (groupKey: string, pageKey: string) => void;
    onRemovePageFromSubGroup: (groupKey: string, pageKey: string) => void;
    onMovePageInSubGroup: (
        groupKey: string,
        pageKey: string,
        direction: 'up' | 'down',
    ) => void;
    onUpdatePageInSubGroup: (
        groupKey: string,
        pageKey: string,
        patch: Partial<GroupPageEntry>,
    ) => void;
    onAddLink: (parentPath: number[], parentPageKey: string) => void;
    onUpdateLink: (path: number[], patch: Partial<DropdownItemConfig>) => void;
    onRemoveLink: (path: number[]) => void;
    onMoveLink: (path: number[], direction: 'up' | 'down') => void;
    onAddLinkToSubGroup: (
        groupKey: string,
        parentPath: number[],
        parentPageKey: string,
    ) => void;
    onUpdateLinkInSubGroup: (
        groupKey: string,
        path: number[],
        patch: Partial<DropdownItemConfig>,
    ) => void;
    onRemoveLinkInSubGroup: (groupKey: string, path: number[]) => void;
    onMoveLinkInSubGroup: (
        groupKey: string,
        path: number[],
        direction: 'up' | 'down',
    ) => void;
    getCategoriesForPage: (pageKey: string) => PublicCategory[];
    categoryTypesByPage: Record<string, CategoryType[]>;
    getAllCategoryValuesForPage: (
        pageKey: string,
    ) => { value: string; label: string }[];
    formErrors: Record<string, string>;
    lang: string;
    t: (key: string) => string;
}

function GroupCard({
    group,
    parentKey,
    allGroups,
    depth,
    availablePages,
    onUpdate,
    onRemove,
    onAddPage,
    onRemovePage,
    onMovePage,
    onUpdatePage,
    onAddSubGroup,
    onUpdateSubGroup,
    onRemoveSubGroup,
    onAddPageToSubGroup,
    onRemovePageFromSubGroup,
    onMovePageInSubGroup,
    onUpdatePageInSubGroup,
    onAddLink,
    onUpdateLink,
    onRemoveLink,
    onMoveLink,
    onAddLinkToSubGroup,
    onUpdateLinkInSubGroup,
    onRemoveLinkInSubGroup,
    onMoveLinkInSubGroup,
    getCategoriesForPage,
    categoryTypesByPage,
    getAllCategoryValuesForPage,
    formErrors,
    lang,
    t,
}: GroupCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `group-${group.key}`,
    });
    const sortableStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative' as const,
    };
    const subGroupSensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );

    const [selectedPage, setSelectedPage] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(true);

    const groupPages = useMemo(() => {
        const pageSet = new Set(group.pages.map((p) => p.pageKey));
        return availablePages.filter((p) => !pageSet.has(p?.key ?? ''));
    }, [group.pages, availablePages]);

    const handleAddPage = () => {
        if (selectedPage) {
            onAddPage(selectedPage);
            setSelectedPage('');
        }
    };

    const placementLabels: Record<string, string> = {
        topbar: t('admin.settings.topbarPlacement'),
        top: t('admin.settings.mainNav'),
        more: t('admin.settings.plusMore'),
    };

    return (
        <Card
            ref={setNodeRef}
            style={sortableStyle}
            className={`overflow-hidden transition-shadow ${isDragging ? 'shadow-xl ring-2 ring-amber-400/40' : 'shadow-sm'} ${depth > 0 ? 'ml-4 border-l-4 border-l-amber-300' : ''}`}
        >
            {/* Group Header */}
            <div
                className={`flex items-center justify-between gap-3 p-4 ${depth > 0 ? 'bg-amber-50/50' : 'bg-muted/30'}`}
            >
                <div className="flex min-w-0 items-center gap-3">
                    <DragHandle
                        attributes={attributes}
                        listeners={listeners}
                        label={
                            depth > 0
                                ? t('admin.settings.dragToReorderSubGroup')
                                : t('admin.settings.dragToReorderGroup')
                        }
                    />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <NavBadge type={depth > 0 ? 'subgroup' : 'group'} />
                            <span className="truncate text-sm font-semibold">
                                {group.label?.[lang] ||
                                    group.label?.en ||
                                    t('admin.settings.untitledGroup')}
                            </span>
                        </div>
                        <span className="mt-0.5 text-xs text-muted-foreground">
                            {group.pages.length}{' '}
                            {group.pages.length === 1
                                ? t('admin.settings.page')
                                : t('admin.settings.pages')}
                            {group.groups &&
                                group.groups.length > 0 &&
                                ` · ${group.groups.length} ${t('admin.settings.subGroups')}`}
                        </span>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Badge
                        variant="outline"
                        className="text-[10px] font-normal"
                    >
                        {placementLabels[group.placement] || group.placement}
                    </Badge>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1">
                                <Label className="cursor-pointer text-[10px] text-muted-foreground">
                                    {t('admin.settings.enabled')}
                                </Label>
                                <Switch
                                    checked={group.enabled}
                                    onCheckedChange={(v) =>
                                        onUpdate({ enabled: v })
                                    }
                                    className="data-[state=checked]:bg-primary"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">
                                {group.enabled
                                    ? t('admin.settings.groupVisible')
                                    : t('admin.settings.groupHidden')}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                            if (parentKey)
                                onRemoveSubGroup(parentKey, group.key);
                            else onRemove();
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                        <CollapsibleTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    </Collapsible>
                </div>
            </div>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleContent>
                    <CardContent className="space-y-5 p-4 pt-0">
                        {/* Group Label Inputs */}
                        <div className="rounded-lg bg-muted/30 p-3">
                            <Label className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                <Globe className="h-3 w-3" />
                                {t('admin.settings.groupNameTranslations')}
                            </Label>
                            <div className="grid grid-cols-1 gap-2">
                                {(['fr'] as const).map((l) => (
                                    <div key={l}>
                                        <Input
                                            value={group.label?.[l] ?? ''}
                                            onChange={(e) => {
                                                const current =
                                                    normalizeLocalizedText(
                                                        group.label,
                                                    );
                                                onUpdate({
                                                    label: {
                                                        ...current,
                                                        [l]: e.target.value,
                                                    },
                                                });
                                            }}
                                            placeholder={`${t('admin.settings.groupName')}`}
                                            className="mt-1 h-9 text-xs"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Placement Selector */}
                        <div className="flex items-center gap-3">
                            <Label className="shrink-0 text-xs text-muted-foreground">
                                {t('admin.settings.placement')}
                            </Label>
                            <Select
                                value={group.placement}
                                onValueChange={(v: any) =>
                                    onUpdate({ placement: v })
                                }
                            >
                                <SelectTrigger className="h-8 w-40 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="topbar">
                                        {t('admin.settings.topbarPlacement')}
                                    </SelectItem>
                                    <SelectItem value="top">
                                        {t('admin.settings.mainNav')}
                                    </SelectItem>
                                    <SelectItem value="more">
                                        {t('admin.settings.plusMore')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Pages in Group */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <Label className="flex items-center gap-1.5 text-sm font-medium">
                                    <Link2 className="h-4 w-4 text-muted-foreground" />
                                    {t('admin.settings.pagesInGroup')}
                                </Label>
                                <Badge
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    {group.pages.length}
                                </Badge>
                            </div>

                            {group.pages.length === 0 && (
                                <EmptyState
                                    icon={Link2}
                                    title={t('admin.settings.noPagesInGroup')}
                                    description={t(
                                        'admin.settings.addPagesToGroupDescription',
                                    )}
                                />
                            )}

                            <div className="space-y-3">
                                {group.pages.map((groupPage, idx) => {
                                    const page = getPage(groupPage.pageKey);
                                    const displayName =
                                        groupPage.label?.[lang] ||
                                        groupPage.label?.en ||
                                        (page
                                            ? t('nav.' + page.key)
                                            : groupPage.pageKey);
                                    return (
                                        <Collapsible key={groupPage.pageKey}>
                                            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                                                {/* Page Row Header */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                                                            <span className="text-xs font-bold text-muted-foreground">
                                                                {idx + 1}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block truncate text-sm font-medium">
                                                                {displayName}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {page?.href}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <div className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
                                                                    <Label className="cursor-pointer text-[10px] text-muted-foreground">
                                                                        {t(
                                                                            'admin.settings.dropdown',
                                                                        )}
                                                                    </Label>
                                                                    <Switch
                                                                        checked={
                                                                            groupPage.isDropdown
                                                                        }
                                                                        onCheckedChange={(
                                                                            v,
                                                                        ) =>
                                                                            onUpdatePage(
                                                                                groupPage.pageKey,
                                                                                {
                                                                                    isDropdown:
                                                                                        v,
                                                                                },
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">
                                                                    {groupPage.isDropdown
                                                                        ? t(
                                                                              'admin.settings.hasDropdown',
                                                                          )
                                                                        : t(
                                                                              'admin.settings.noDropdown',
                                                                          )}
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        {groupPage.isDropdown && (
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <div className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1">
                                                                        <Label className="cursor-pointer text-[10px] text-muted-foreground">
                                                                            {t(
                                                                                'admin_settings_triggerLinks',
                                                                            )}
                                                                        </Label>
                                                                        <Switch
                                                                            checked={
                                                                                groupPage.linkSelf
                                                                            }
                                                                            onCheckedChange={(
                                                                                v,
                                                                            ) =>
                                                                                onUpdatePage(
                                                                                    groupPage.pageKey,
                                                                                    {
                                                                                        linkSelf:
                                                                                            v,
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-xs">
                                                                        {groupPage.linkSelf
                                                                            ? t(
                                                                                  'admin.settings.linkSelfEnabled',
                                                                              )
                                                                            : t(
                                                                                  'admin.settings.linkSelfDisabled',
                                                                              )}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7"
                                                            onClick={() =>
                                                                onMovePage(
                                                                    groupPage.pageKey,
                                                                    'up',
                                                                )
                                                            }
                                                            disabled={idx === 0}
                                                        >
                                                            <ArrowUp className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7"
                                                            onClick={() =>
                                                                onMovePage(
                                                                    groupPage.pageKey,
                                                                    'down',
                                                                )
                                                            }
                                                            disabled={
                                                                idx ===
                                                                group.pages
                                                                    .length -
                                                                    1
                                                            }
                                                        >
                                                            <ArrowDown className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() =>
                                                                onRemovePage(
                                                                    groupPage.pageKey,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Dropdown Configuration */}
                                                {groupPage.isDropdown && (
                                                    <div className="ml-2 rounded-md border border-border/40 bg-background p-3">
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <NavBadge type="dropdown" />
                                                                <Label className="text-xs font-medium">
                                                                    {t(
                                                                        'admin.settings.dropdownItems',
                                                                    )}
                                                                </Label>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs"
                                                                onClick={() => {
                                                                    const firstCategory =
                                                                        getCategoriesForPage(
                                                                            groupPage.pageKey,
                                                                        )[0];
                                                                    const newItem: DropdownItemConfig =
                                                                        {
                                                                            label: firstCategory
                                                                                ? normalizeLocalizedText(
                                                                                      firstCategory.name,
                                                                                  )
                                                                                : createLocalizedText(
                                                                                      'New item',
                                                                                  ),
                                                                            mode: 'filter',
                                                                            value:
                                                                                firstCategory?.key ??
                                                                                '',
                                                                        };
                                                                    onUpdatePage(
                                                                        groupPage.pageKey,
                                                                        {
                                                                            items: [
                                                                                ...groupPage.items,
                                                                                newItem,
                                                                            ],
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                <Plus className="mr-1 h-3 w-3" />{' '}
                                                                {t(
                                                                    'admin.settings.addItem',
                                                                )}
                                                            </Button>
                                                        </div>

                                                        {groupPage.items
                                                            .length === 0 && (
                                                            <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                                                                <Info className="h-3.5 w-3.5" />
                                                                {t(
                                                                    'admin.settings.noItemsYetDescription',
                                                                )}
                                                            </div>
                                                        )}

                                                        <DropdownItemTree
                                                            items={
                                                                groupPage.items
                                                            }
                                                            depth={0}
                                                            parentPath={[]}
                                                            pageKey={
                                                                groupPage.pageKey
                                                            }
                                                            page={page}
                                                            categoryTypes={
                                                                categoryTypesByPage[
                                                                    groupPage.pageKey as keyof typeof categoryTypesByPage
                                                                ] ?? []
                                                            }
                                                            allCategoryValues={getAllCategoryValuesForPage(
                                                                groupPage.pageKey,
                                                            )}
                                                            formErrors={
                                                                formErrors
                                                            }
                                                            errorPrefix={`group-${group.key}-${groupPage.pageKey}`}
                                                            onAdd={(
                                                                parentPath,
                                                            ) => {
                                                                const firstCategory =
                                                                    getCategoriesForPage(
                                                                        groupPage.pageKey,
                                                                    )[0];
                                                                const newItem: DropdownItemConfig =
                                                                    {
                                                                        label: firstCategory
                                                                            ? normalizeLocalizedText(
                                                                                  firstCategory.name,
                                                                              )
                                                                            : createLocalizedText(
                                                                                  'New item',
                                                                              ),
                                                                        mode: 'filter',
                                                                        value:
                                                                            firstCategory?.key ??
                                                                            '',
                                                                    };
                                                                const addAt = (
                                                                    items: DropdownItemConfig[],
                                                                    path: number[],
                                                                ): DropdownItemConfig[] => {
                                                                    if (
                                                                        path.length ===
                                                                        0
                                                                    )
                                                                        return [
                                                                            ...items,
                                                                            newItem,
                                                                        ];
                                                                    const [
                                                                        head,
                                                                        ...rest
                                                                    ] = path;
                                                                    return items.map(
                                                                        (
                                                                            item,
                                                                            i,
                                                                        ) => {
                                                                            if (
                                                                                i !==
                                                                                head
                                                                            )
                                                                                return item;
                                                                            return {
                                                                                ...item,
                                                                                children:
                                                                                    addAt(
                                                                                        item.children ??
                                                                                            [],
                                                                                        rest,
                                                                                    ),
                                                                            };
                                                                        },
                                                                    );
                                                                };
                                                                onUpdatePage(
                                                                    groupPage.pageKey,
                                                                    {
                                                                        items: addAt(
                                                                            groupPage.items,
                                                                            parentPath,
                                                                        ),
                                                                    },
                                                                );
                                                            }}
                                                            onUpdate={(
                                                                path,
                                                                patch,
                                                            ) => {
                                                                const updateAt =
                                                                    (
                                                                        items: DropdownItemConfig[],
                                                                        p: number[],
                                                                    ): DropdownItemConfig[] => {
                                                                        if (
                                                                            p.length ===
                                                                            0
                                                                        )
                                                                            return items;
                                                                        const [
                                                                            head,
                                                                            ...rest
                                                                        ] = p;
                                                                        return items.map(
                                                                            (
                                                                                item,
                                                                                i,
                                                                            ) => {
                                                                                if (
                                                                                    i !==
                                                                                    head
                                                                                )
                                                                                    return item;
                                                                                if (
                                                                                    rest.length ===
                                                                                    0
                                                                                )
                                                                                    return {
                                                                                        ...item,
                                                                                        ...patch,
                                                                                    };
                                                                                return {
                                                                                    ...item,
                                                                                    children:
                                                                                        updateAt(
                                                                                            item.children ??
                                                                                                [],
                                                                                            rest,
                                                                                        ),
                                                                                };
                                                                            },
                                                                        );
                                                                    };
                                                                onUpdatePage(
                                                                    groupPage.pageKey,
                                                                    {
                                                                        items: updateAt(
                                                                            groupPage.items,
                                                                            path,
                                                                        ),
                                                                    },
                                                                );
                                                            }}
                                                            onRemove={(
                                                                path,
                                                            ) => {
                                                                const removeAt =
                                                                    (
                                                                        items: DropdownItemConfig[],
                                                                        p: number[],
                                                                    ): DropdownItemConfig[] => {
                                                                        if (
                                                                            p.length ===
                                                                            0
                                                                        )
                                                                            return items;
                                                                        const [
                                                                            head,
                                                                            ...rest
                                                                        ] = p;
                                                                        if (
                                                                            rest.length ===
                                                                            0
                                                                        )
                                                                            return items.filter(
                                                                                (
                                                                                    _,
                                                                                    i,
                                                                                ) =>
                                                                                    i !==
                                                                                    head,
                                                                            );
                                                                        return items.map(
                                                                            (
                                                                                item,
                                                                                i,
                                                                            ) => {
                                                                                if (
                                                                                    i !==
                                                                                    head
                                                                                )
                                                                                    return item;
                                                                                return {
                                                                                    ...item,
                                                                                    children:
                                                                                        removeAt(
                                                                                            item.children ??
                                                                                                [],
                                                                                            rest,
                                                                                        ),
                                                                                };
                                                                            },
                                                                        );
                                                                    };
                                                                onUpdatePage(
                                                                    groupPage.pageKey,
                                                                    {
                                                                        items: removeAt(
                                                                            groupPage.items,
                                                                            path,
                                                                        ),
                                                                    },
                                                                );
                                                            }}
                                                            onMove={(
                                                                path,
                                                                direction,
                                                            ) => {
                                                                const moveAt = (
                                                                    items: DropdownItemConfig[],
                                                                    p: number[],
                                                                    dir:
                                                                        | 'up'
                                                                        | 'down',
                                                                ): DropdownItemConfig[] => {
                                                                    if (
                                                                        p.length ===
                                                                        0
                                                                    )
                                                                        return items;
                                                                    const [
                                                                        head,
                                                                        ...rest
                                                                    ] = p;
                                                                    if (
                                                                        rest.length ===
                                                                        0
                                                                    ) {
                                                                        const swapIdx =
                                                                            dir ===
                                                                            'up'
                                                                                ? head -
                                                                                  1
                                                                                : head +
                                                                                  1;
                                                                        if (
                                                                            swapIdx <
                                                                                0 ||
                                                                            swapIdx >=
                                                                                items.length
                                                                        )
                                                                            return items;
                                                                        const next =
                                                                            [
                                                                                ...items,
                                                                            ];
                                                                        [
                                                                            next[
                                                                                head
                                                                            ],
                                                                            next[
                                                                                swapIdx
                                                                            ],
                                                                        ] = [
                                                                            next[
                                                                                swapIdx
                                                                            ],
                                                                            next[
                                                                                head
                                                                            ],
                                                                        ];
                                                                        return next;
                                                                    }
                                                                    return items.map(
                                                                        (
                                                                            item,
                                                                            i,
                                                                        ) => {
                                                                            if (
                                                                                i !==
                                                                                head
                                                                            )
                                                                                return item;
                                                                            return {
                                                                                ...item,
                                                                                children:
                                                                                    moveAt(
                                                                                        item.children ??
                                                                                            [],
                                                                                        rest,
                                                                                        dir,
                                                                                    ),
                                                                            };
                                                                        },
                                                                    );
                                                                };
                                                                onUpdatePage(
                                                                    groupPage.pageKey,
                                                                    {
                                                                        items: moveAt(
                                                                            groupPage.items,
                                                                            path,
                                                                            direction,
                                                                        ),
                                                                    },
                                                                );
                                                            }}
                                                            lang={lang}
                                                            t={t}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </Collapsible>
                                    );
                                })}
                            </div>

                            {/* Add Page to Group */}
                            {groupPages.length > 0 && (
                                <div className="mt-3 flex items-end gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                                    <div className="flex-1">
                                        <Label className="mb-1.5 text-xs text-muted-foreground">
                                            {t('admin.settings.addPageToGroup')}
                                        </Label>
                                        <Select
                                            value={selectedPage}
                                            onValueChange={setSelectedPage}
                                        >
                                            <SelectTrigger className="h-9 bg-background text-xs">
                                                <SelectValue
                                                    placeholder={t(
                                                        'admin.settings.selectPageToAdd',
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {groupPages.map(
                                                    (p) =>
                                                        p && (
                                                            <SelectItem
                                                                key={p.key}
                                                                value={p.key}
                                                            >
                                                                <span className="flex items-center justify-between gap-2">
                                                                    <span>
                                                                        {t(
                                                                            'nav.' +
                                                                                p.key,
                                                                        )}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {p.href}
                                                                    </span>
                                                                </span>
                                                            </SelectItem>
                                                        ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-9"
                                        onClick={handleAddPage}
                                        disabled={!selectedPage}
                                    >
                                        <Plus className="mr-1 h-3.5 w-3.5" />{' '}
                                        {t('admin.settings.add')}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Sub-Pages (Mixed Links) */}
                        <div>
                            <Separator className="mb-4" />
                            <div className="mb-3 flex items-center justify-between">
                                <Label className="flex items-center gap-1.5 text-sm font-medium">
                                    <Link2 className="h-4 w-4 text-muted-foreground" />
                                    {t('admin.settings.subPages')}
                                </Label>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => onAddLink([], '')}
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" />{' '}
                                    {t('admin.settings.addSubPage')}
                                </Button>
                            </div>

                            {(group.links ?? []).length === 0 && (
                                <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                                    <Info className="h-3.5 w-3.5" />
                                    {t(
                                        'admin.settings.subPagesEmptyDescription',
                                    )}
                                </div>
                            )}

                            <GroupLinkTree
                                items={(group.links ?? []) as NavGroupLink[]}
                                depth={0}
                                parentPath={[]}
                                parentPageKey=""
                                categoryTypesByPage={categoryTypesByPage}
                                getAllCategoryValuesForPage={
                                    getAllCategoryValuesForPage
                                }
                                formErrors={formErrors}
                                errorPrefix={`group-${group.key}-links`}
                                onAdd={(parentPath, parentPageKey) =>
                                    onAddLink(parentPath, parentPageKey)
                                }
                                onUpdate={(path, patch) =>
                                    onUpdateLink(path, patch)
                                }
                                onRemove={(path) => onRemoveLink(path)}
                                onMove={(path, dir) => onMoveLink(path, dir)}
                                lang={lang}
                                t={t}
                            />
                        </div>

                        {/* Sub-Groups */}
                        {depth < 1 && (
                            <div>
                                <Separator className="mb-4" />
                                <div className="mb-3 flex items-center justify-between">
                                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                                        <Layers className="h-4 w-4 text-muted-foreground" />
                                        {t('admin.settings.subGroups')}
                                    </Label>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                            const newSubGroup: NavGroup = {
                                                key: getNextGroupKey(allGroups),
                                                label: createLocalizedText(''),
                                                enabled: true,
                                                placement: 'top',
                                                pages: [],
                                            };
                                            onUpdate({
                                                groups: [
                                                    ...(group.groups ?? []),
                                                    newSubGroup,
                                                ],
                                            });
                                        }}
                                    >
                                        <Plus className="mr-1 h-3.5 w-3.5" />{' '}
                                        {t('admin.settings.addSubGroup')}
                                    </Button>
                                </div>

                                <DndContext
                                    sensors={subGroupSensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={(e: DragEndEvent) => {
                                        const { active, over } = e;
                                        if (!over || active.id === over.id)
                                            return;
                                        const items = group.groups ?? [];
                                        const oldIndex = items.findIndex(
                                            (sg) => sg.key === active.id,
                                        );
                                        const newIndex = items.findIndex(
                                            (sg) => sg.key === over.id,
                                        );
                                        if (oldIndex < 0 || newIndex < 0)
                                            return;
                                        onUpdate({
                                            groups: arrayMove(
                                                items,
                                                oldIndex,
                                                newIndex,
                                            ),
                                        });
                                    }}
                                >
                                    <SortableContext
                                        items={(group.groups ?? []).map(
                                            (sg) => sg.key,
                                        )}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {(group.groups ?? []).map(
                                                (subGroup) => (
                                                    <GroupCard
                                                        key={subGroup.key}
                                                        group={subGroup}
                                                        parentKey={group.key}
                                                        allGroups={allGroups}
                                                        depth={depth + 1}
                                                        availablePages={
                                                            groupPages
                                                        }
                                                        onUpdate={(patch) =>
                                                            onUpdateSubGroup(
                                                                group.key,
                                                                subGroup.key,
                                                                patch,
                                                            )
                                                        }
                                                        onRemove={() =>
                                                            onRemoveSubGroup(
                                                                group.key,
                                                                subGroup.key,
                                                            )
                                                        }
                                                        onAddPage={(pageKey) =>
                                                            onAddPageToSubGroup(
                                                                subGroup.key,
                                                                pageKey,
                                                            )
                                                        }
                                                        onRemovePage={(
                                                            pageKey,
                                                        ) =>
                                                            onRemovePageFromSubGroup(
                                                                subGroup.key,
                                                                pageKey,
                                                            )
                                                        }
                                                        onMovePage={(
                                                            pageKey,
                                                            dir,
                                                        ) =>
                                                            onMovePageInSubGroup(
                                                                subGroup.key,
                                                                pageKey,
                                                                dir,
                                                            )
                                                        }
                                                        onUpdatePage={(
                                                            pageKey,
                                                            patch,
                                                        ) =>
                                                            onUpdatePageInSubGroup(
                                                                subGroup.key,
                                                                pageKey,
                                                                patch,
                                                            )
                                                        }
                                                        onAddSubGroup={() => {}}
                                                        onUpdateSubGroup={
                                                            onUpdateSubGroup
                                                        }
                                                        onRemoveSubGroup={
                                                            onRemoveSubGroup
                                                        }
                                                        onAddPageToSubGroup={
                                                            onAddPageToSubGroup
                                                        }
                                                        onRemovePageFromSubGroup={
                                                            onRemovePageFromSubGroup
                                                        }
                                                        onMovePageInSubGroup={
                                                            onMovePageInSubGroup
                                                        }
                                                        onUpdatePageInSubGroup={
                                                            onUpdatePageInSubGroup
                                                        }
                                                        onAddLink={(
                                                            parentPath,
                                                            parentPageKey,
                                                        ) =>
                                                            onAddLinkToSubGroup(
                                                                subGroup.key,
                                                                parentPath,
                                                                parentPageKey,
                                                            )
                                                        }
                                                        onUpdateLink={(
                                                            path,
                                                            patch,
                                                        ) =>
                                                            onUpdateLinkInSubGroup(
                                                                subGroup.key,
                                                                path,
                                                                patch,
                                                            )
                                                        }
                                                        onRemoveLink={(path) =>
                                                            onRemoveLinkInSubGroup(
                                                                subGroup.key,
                                                                path,
                                                            )
                                                        }
                                                        onMoveLink={(
                                                            path,
                                                            dir,
                                                        ) =>
                                                            onMoveLinkInSubGroup(
                                                                subGroup.key,
                                                                path,
                                                                dir,
                                                            )
                                                        }
                                                        onAddLinkToSubGroup={
                                                            onAddLinkToSubGroup
                                                        }
                                                        onUpdateLinkInSubGroup={
                                                            onUpdateLinkInSubGroup
                                                        }
                                                        onRemoveLinkInSubGroup={
                                                            onRemoveLinkInSubGroup
                                                        }
                                                        onMoveLinkInSubGroup={
                                                            onMoveLinkInSubGroup
                                                        }
                                                        getCategoriesForPage={
                                                            getCategoriesForPage
                                                        }
                                                        categoryTypesByPage={
                                                            categoryTypesByPage
                                                        }
                                                        getAllCategoryValuesForPage={
                                                            getAllCategoryValuesForPage
                                                        }
                                                        formErrors={formErrors}
                                                        lang={lang}
                                                        t={t}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

/* ───────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ─────────────────────────────────────────────── */

export default function AdminSiteSettingsNav() {
    const { settings, loading } = useSiteSettings();
    const { t, lang } = useLanguage();
    const [draft, setDraft] = useState<NavSettings>({
        header: [],
        footer: DEFAULT_NAV_SETTINGS.footer,
        groups: [],
        links: [],
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [selectedPage, setSelectedPage] = useState<string>('');
    const [moveToGroupTarget, setMoveToGroupTarget] = useState<
        Record<number, string>
    >({});
    const [activeTab, setActiveTab] = useState<'header' | 'groups' | 'links'>(
        'header',
    );
    const [isSaving, setIsSaving] = useState(false);
    const [selectedLinkPage, setSelectedLinkPage] = useState<string>('');

    /* Data fetching */
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

    const { data: destinationCategoryTypes = [] } =
        useCategoryTypes('destinations');
    const { data: hotelCategoryTypes = [] } = useCategoryTypes('hotels');
    const { data: tourCategoryTypes = [] } = useCategoryTypes('tours');
    const { data: carCategoryTypes = [] } = useCategoryTypes('cars');
    const { data: eventCategoryTypes = [] } = useCategoryTypes('events');
    const { data: dealCategoryTypes = [] } = useCategoryTypes('deals');
    const { data: blogCategoryTypes = [] } = useCategoryTypes('blog');

    const categoryTypesByPage = useMemo(
        () => ({
            destinations: destinationCategoryTypes,
            hotels: hotelCategoryTypes,
            tours: tourCategoryTypes,
            cars: carCategoryTypes,
            events: eventCategoryTypes,
            deals: dealCategoryTypes,
            blog: blogCategoryTypes,
        }),
        [
            destinationCategoryTypes,
            hotelCategoryTypes,
            tourCategoryTypes,
            carCategoryTypes,
            eventCategoryTypes,
            dealCategoryTypes,
            blogCategoryTypes,
        ],
    );

    const getAllCategoryValuesForPage = useCallback(
        (pageKey: string): { value: string; label: string }[] => {
            const types =
                categoryTypesByPage[
                    pageKey as keyof typeof categoryTypesByPage
                ] ?? [];
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
        },
        [categoryTypesByPage, lang],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );

    useEffect(() => {
        const normalized = sanitizeNavSettings(
            settings.content?.nav?.settings ?? DEFAULT_NAV_SETTINGS,
        );
        setDraft(normalizeNavSettingsDraft(normalized));
    }, [settings]);

    const enabledPageKeys = useMemo(
        () => new Set(draft.header.map((h) => h.pageKey)),
        [draft.header],
    );
    const pagesInGroups = useMemo(
        () => getPagesInGroups(draft.groups ?? []),
        [draft.groups],
    );
    const availablePages = useMemo(
        () =>
            AVAILABLE_PAGES.filter(
                (p) => !enabledPageKeys.has(p.key) && !pagesInGroups.has(p.key),
            ),
        [enabledPageKeys, pagesInGroups],
    );
    const availablePagesForGroup = useMemo(
        () => AVAILABLE_PAGES.filter((p) => !pagesInGroups.has(p.key)),
        [pagesInGroups],
    );

    const setHeader = (idx: number, patch: Partial<HeaderEntry>) => {
        const nextHeader = draft.header.map((h, i) =>
            i === idx ? { ...h, ...patch } : h,
        );
        setDraft({ ...draft, header: nextHeader });
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

    const removePage = useCallback(
        (pageKey: string) => {
            setDraft({
                ...draft,
                header: draft.header.filter((h) => h.pageKey !== pageKey),
            });
        },
        [draft],
    );

    const makeNewItem = useCallback(
        (pageKey: string): DropdownItemConfig => {
            const firstCategory = getCategoriesForPage(pageKey)[0];
            return {
                label: firstCategory
                    ? normalizeLocalizedText(firstCategory.name)
                    : createLocalizedText('New item'),
                mode: 'filter',
                value: firstCategory?.key ?? '',
            };
        },
        [categoriesByPage],
    );

    const handleAddItem = useCallback(
        (headerIdx: number, parentPath: number[]) => {
            const entry = draft.header[headerIdx];
            const newItem = makeNewItem(entry.pageKey);
            setHeader(headerIdx, {
                items: addItemAtPath(entry.items, parentPath, newItem),
            });
        },
        [draft.header, makeNewItem],
    );

    const handleUpdateItem = useCallback(
        (
            headerIdx: number,
            path: number[],
            patch: Partial<DropdownItemConfig>,
        ) => {
            const entry = draft.header[headerIdx];
            setHeader(headerIdx, {
                items: updateItemAtPath(entry.items, path, patch),
            });
        },
        [draft.header],
    );

    const handleRemoveItem = useCallback(
        (headerIdx: number, path: number[]) => {
            const entry = draft.header[headerIdx];
            setHeader(headerIdx, {
                items: removeItemAtPath(entry.items, path),
            });
        },
        [draft.header],
    );

    const handleMoveItem = useCallback(
        (headerIdx: number, path: number[], direction: 'up' | 'down') => {
            const entry = draft.header[headerIdx];
            setHeader(headerIdx, {
                items: moveItemAtPath(entry.items, path, direction),
            });
        },
        [draft.header],
    );

    const addGroup = useCallback(() => {
        const newGroup: NavGroup = {
            key: getNextGroupKey(draft.groups ?? []),
            label: createLocalizedText(''),
            enabled: true,
            placement: 'top',
            pages: [],
        };
        setDraft({ ...draft, groups: [...(draft.groups ?? []), newGroup] });
    }, [draft]);

    const updateGroup = useCallback(
        (groupKey: string, patch: Partial<NavGroup>) => {
            const updateInList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey) return { ...g, ...patch };
                    if (g.groups?.length)
                        return { ...g, groups: updateInList(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: updateInList(draft.groups ?? []) });
        },
        [draft],
    );

    const updateSubGroup = useCallback(
        (parentKey: string, subGroupKey: string, patch: Partial<NavGroup>) => {
            const updateInParent = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === parentKey) {
                        return {
                            ...g,
                            groups: (g.groups ?? []).map((sg) =>
                                sg.key === subGroupKey
                                    ? { ...sg, ...patch }
                                    : sg,
                            ),
                        };
                    }
                    if (g.groups?.length)
                        return { ...g, groups: updateInParent(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: updateInParent(draft.groups ?? []) });
        },
        [draft],
    );

    const removeGroup = useCallback(
        (groupKey: string) => {
            const removeFromList = (groups: NavGroup[]): NavGroup[] =>
                groups
                    .filter((g) => g.key !== groupKey)
                    .map((g) => ({
                        ...g,
                        groups: g.groups ? removeFromList(g.groups) : [],
                    }));
            setDraft({ ...draft, groups: removeFromList(draft.groups ?? []) });
        },
        [draft],
    );

    const removeSubGroup = useCallback(
        (parentKey: string, subGroupKey: string) => {
            const removeFromParent = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === parentKey) {
                        return {
                            ...g,
                            groups: (g.groups ?? []).filter(
                                (sg) => sg.key !== subGroupKey,
                            ),
                        };
                    }
                    if (g.groups?.length)
                        return { ...g, groups: removeFromParent(g.groups) };
                    return g;
                });
            setDraft({
                ...draft,
                groups: removeFromParent(draft.groups ?? []),
            });
        },
        [draft],
    );

    const addPageToGroup = useCallback(
        (groupKey: string, pageKey: string) => {
            const newEntry = createGroupPageEntry(pageKey);
            const addToList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey)
                        return { ...g, pages: [...g.pages, newEntry] };
                    if (g.groups?.length)
                        return { ...g, groups: addToList(g.groups) };
                    return g;
                });
            setDraft({
                ...draft,
                header: draft.header.filter((h) => h.pageKey !== pageKey),
                groups: addToList(draft.groups ?? []),
            });
        },
        [draft],
    );

    const removePageFromGroup = useCallback(
        (groupKey: string, pageKey: string) => {
            const removeFromList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey)
                        return {
                            ...g,
                            pages: g.pages.filter((p) => p.pageKey !== pageKey),
                        };
                    if (g.groups?.length)
                        return { ...g, groups: removeFromList(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: removeFromList(draft.groups ?? []) });
        },
        [draft],
    );

    const movePageInGroup = useCallback(
        (groupKey: string, pageKey: string, direction: 'up' | 'down') => {
            const moveInList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey) {
                        const idx = g.pages.findIndex(
                            (p) => p.pageKey === pageKey,
                        );
                        if (idx < 0) return g;
                        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
                        if (swapIdx < 0 || swapIdx >= g.pages.length) return g;
                        const nextPages = [...g.pages];
                        [nextPages[idx], nextPages[swapIdx]] = [
                            nextPages[swapIdx],
                            nextPages[idx],
                        ];
                        return { ...g, pages: nextPages };
                    }
                    if (g.groups?.length)
                        return { ...g, groups: moveInList(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: moveInList(draft.groups ?? []) });
        },
        [draft],
    );

    const updateGroupPage = useCallback(
        (groupKey: string, pageKey: string, patch: Partial<GroupPageEntry>) => {
            const updateInList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey) {
                        return {
                            ...g,
                            pages: g.pages.map((p) =>
                                p.pageKey === pageKey ? { ...p, ...patch } : p,
                            ),
                        };
                    }
                    if (g.groups?.length)
                        return { ...g, groups: updateInList(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: updateInList(draft.groups ?? []) });
        },
        [draft],
    );

    const addLinkToGroup = useCallback(
        (groupKey: string, parentPath: number[], parentPageKey: string) => {
            const newLink = createGroupLink(parentPageKey);
            const addToList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey)
                        return {
                            ...g,
                            links: addItemAtPath(
                                g.links ?? [],
                                parentPath,
                                newLink,
                            ) as NavGroupLink[],
                        };
                    if (g.groups?.length)
                        return { ...g, groups: addToList(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: addToList(draft.groups ?? []) });
        },
        [draft],
    );

    const updateLinkInGroup = useCallback(
        (
            groupKey: string,
            path: number[],
            patch: Partial<DropdownItemConfig>,
        ) => {
            const updateInList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey)
                        return {
                            ...g,
                            links: updateItemAtPath(
                                g.links ?? [],
                                path,
                                patch,
                            ) as NavGroupLink[],
                        };
                    if (g.groups?.length)
                        return { ...g, groups: updateInList(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: updateInList(draft.groups ?? []) });
        },
        [draft],
    );

    const removeLinkFromGroup = useCallback(
        (groupKey: string, path: number[]) => {
            const removeInList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey)
                        return {
                            ...g,
                            links: removeItemAtPath(
                                g.links ?? [],
                                path,
                            ) as NavGroupLink[],
                        };
                    if (g.groups?.length)
                        return { ...g, groups: removeInList(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: removeInList(draft.groups ?? []) });
        },
        [draft],
    );

    const moveLinkInGroup = useCallback(
        (groupKey: string, path: number[], direction: 'up' | 'down') => {
            const moveInList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey)
                        return {
                            ...g,
                            links: moveItemAtPath(
                                g.links ?? [],
                                path,
                                direction,
                            ) as NavGroupLink[],
                        };
                    if (g.groups?.length)
                        return { ...g, groups: moveInList(g.groups) };
                    return g;
                });
            setDraft({ ...draft, groups: moveInList(draft.groups ?? []) });
        },
        [draft],
    );

    const moveHeaderToGroup = useCallback(
        (headerIdx: number, groupKey: string) => {
            const entry = draft.header[headerIdx];
            const newGroupPage: GroupPageEntry = {
                pageKey: entry.pageKey,
                label: entry.label,
                isDropdown: entry.isDropdown,
                linkSelf: entry.linkSelf,
                items: entry.items,
            };
            const addToList = (groups: NavGroup[]): NavGroup[] =>
                groups.map((g) => {
                    if (g.key === groupKey)
                        return { ...g, pages: [...g.pages, newGroupPage] };
                    if (g.groups?.length)
                        return { ...g, groups: addToList(g.groups) };
                    return g;
                });
            setDraft({
                header: draft.header.filter((_, i) => i !== headerIdx),
                footer: draft.footer,
                groups: addToList(draft.groups ?? []),
                links: draft.links ?? [],
            });
        },
        [draft],
    );

    /* ─── Standalone Link Handlers ─── */
    const addStandaloneLink = useCallback(() => {
        if (!selectedLinkPage) return;
        const page = getPage(selectedLinkPage);
        if (!page) return;
        const newLink: NavLink = {
            ...createNavLink(),
            key: getNextLinkKey(draft.links ?? []),
            targetPageKey: selectedLinkPage,
            label: t('nav.' + page.key),
        };
        setDraft({ ...draft, links: [...(draft.links ?? []), newLink] });
        setSelectedLinkPage('');
    }, [selectedLinkPage, draft, t]);

    const updateLink = useCallback(
        (linkKey: string, patch: Partial<NavLink>) => {
            setDraft({
                ...draft,
                links: (draft.links ?? []).map((l) =>
                    l.key === linkKey ? { ...l, ...patch } : l,
                ),
            });
        },
        [draft],
    );

    const removeLink = useCallback(
        (linkKey: string) => {
            setDraft({
                ...draft,
                links: (draft.links ?? []).filter((l) => l.key !== linkKey),
            });
        },
        [draft],
    );

    const moveLink = useCallback(
        (linkKey: string, direction: 'up' | 'down') => {
            const links = [...(draft.links ?? [])];
            const idx = links.findIndex((l) => l.key === linkKey);
            if (idx < 0) return;
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= links.length) return;
            [links[idx], links[swapIdx]] = [links[swapIdx], links[idx]];
            setDraft({ ...draft, links });
        },
        [draft],
    );

    const handleDragEnd = useCallback(
        (e: DragEndEvent) => {
            const { active, over } = e;
            if (!over || active.id === over.id) return;
            const activeId = active.id as string;
            const overId = over.id as string;

            if (activeId.startsWith('header-')) {
                const activePageKey = activeId.replace('header-', '');
                if (overId.startsWith('group-')) {
                    const targetGroupKey = overId.replace('group-', '');
                    const headerIdx = draft.header.findIndex(
                        (h) => h.pageKey === activePageKey,
                    );
                    if (headerIdx >= 0)
                        moveHeaderToGroup(headerIdx, targetGroupKey);
                    return;
                }
                if (overId.startsWith('header-')) {
                    const overPageKey = overId.replace('header-', '');
                    const oldIndex = draft.header.findIndex(
                        (h) => h.pageKey === activePageKey,
                    );
                    const newIndex = draft.header.findIndex(
                        (h) => h.pageKey === overPageKey,
                    );
                    if (oldIndex >= 0 && newIndex >= 0) {
                        setDraft({
                            ...draft,
                            header: arrayMove(draft.header, oldIndex, newIndex),
                        });
                    }
                }
            }

            if (activeId.startsWith('group-')) {
                const activeGroupKey = activeId.replace('group-', '');
                if (overId.startsWith('group-')) {
                    const overGroupKey = overId.replace('group-', '');
                    const oldIndex = (draft.groups ?? []).findIndex(
                        (g) => g.key === activeGroupKey,
                    );
                    const newIndex = (draft.groups ?? []).findIndex(
                        (g) => g.key === overGroupKey,
                    );
                    if (oldIndex >= 0 && newIndex >= 0) {
                        setDraft({
                            ...draft,
                            groups: arrayMove(
                                draft.groups ?? [],
                                oldIndex,
                                newIndex,
                            ),
                        });
                    }
                }
            }

            if (activeId.startsWith('link-')) {
                const activeLinkKey = activeId.replace('link-', '');
                if (overId.startsWith('link-')) {
                    const overLinkKey = overId.replace('link-', '');
                    const oldIndex = (draft.links ?? []).findIndex(
                        (l) => l.key === activeLinkKey,
                    );
                    const newIndex = (draft.links ?? []).findIndex(
                        (l) => l.key === overLinkKey,
                    );
                    if (oldIndex >= 0 && newIndex >= 0) {
                        setDraft({
                            ...draft,
                            links: arrayMove(
                                draft.links ?? [],
                                oldIndex,
                                newIndex,
                            ),
                        });
                    }
                }
            }
        },
        [draft, moveHeaderToGroup],
    );

    const validateItems = (
        items: DropdownItemConfig[],
        errorPrefix: string,
    ): Record<string, string> => {
        const errors: Record<string, string> = {};
        items.forEach((item, iIdx) => {
            const key = `${errorPrefix}-${iIdx}`;
            if (item.mode === 'categories') {
                if (item.children?.length)
                    Object.assign(errors, validateItems(item.children, key));
                return;
            }
            const rawLabel = (item as any).label;
            if (!rawLabel) {
                errors[key] = t('admin.settings.provideTranslations');
            } else {
                const label = normalizeLocalizedText(rawLabel);
                for (const k of ['fr'] as const) {
                    if (!label[k]?.trim()) {
                        errors[key] =
                            t('admin.settings.missingTranslation') +
                            `: ${k.toUpperCase()}`;
                        break;
                    }
                }
            }
            if (item.children?.length)
                Object.assign(errors, validateItems(item.children, key));
        });
        return errors;
    };

    const validateLinks = (
        items: DropdownItemConfig[],
        errorPrefix: string,
    ): Record<string, string> => {
        const errors: Record<string, string> = {};
        items.forEach((item, iIdx) => {
            const key = `${errorPrefix}-${iIdx}`;
            if (!item.pageKey) {
                errors[key] = t('admin.settings.selectTargetPage');
                return;
            }
            if (item.mode === 'categories') {
                if (item.children?.length)
                    Object.assign(errors, validateLinks(item.children, key));
                return;
            }
            const rawLabel = (item as any).label;
            if (!rawLabel) {
                errors[key] = t('admin.settings.provideTranslations');
            } else {
                const label = normalizeLocalizedText(rawLabel);
                for (const k of ['fr'] as const) {
                    if (!label[k]?.trim()) {
                        errors[key] =
                            t('admin.settings.missingTranslation') +
                            `: ${k.toUpperCase()}`;
                        break;
                    }
                }
            }
            if (item.children?.length)
                Object.assign(errors, validateLinks(item.children, key));
        });
        return errors;
    };

    const validateGroupLinks = (groups: NavGroup[]): Record<string, string> => {
        const errors: Record<string, string> = {};
        for (const g of groups) {
            if (g.links?.length) {
                Object.assign(
                    errors,
                    validateLinks(g.links, `group-${g.key}-links`),
                );
            }
            if (g.groups?.length) {
                Object.assign(errors, validateGroupLinks(g.groups));
            }
        }
        return errors;
    };

    const validateStandaloneLinks = (
        links: NavLink[],
    ): Record<string, string> => {
        const errors: Record<string, string> = {};
        for (const link of links) {
            if (!(link.label ?? '').trim()) {
                errors[`link-${link.key}-label`] = 'Label required';
            }
            if (!link.targetPageKey || !getPage(link.targetPageKey)) {
                errors[`link-${link.key}-page`] = 'Invalid target page';
            }
        }
        return errors;
    };

    const save = async () => {
        const errors: Record<string, string> = {};
        for (const [hIdx, entry] of draft.header.entries()) {
            if (entry.isDropdown && Array.isArray(entry.items)) {
                Object.assign(errors, validateItems(entry.items, `${hIdx}`));
            }
        }
        Object.assign(errors, validateGroupLinks(draft.groups ?? []));
        Object.assign(errors, validateStandaloneLinks(draft.links ?? []));
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error(Object.values(errors)[0]);
            return;
        }
        setFormErrors({});
        setIsSaving(true);
        try {
            const sanitizedDraft = normalizeNavSettingsDraft(
                sanitizeNavSettings(draft),
            );
            const normalizedContent = settings.content ?? {};
            const payloadContent: Record<string, unknown> = {
                ...normalizedContent,
                nav: {
                    ...(normalizedContent.nav as any),
                    settings: sanitizedDraft,
                },
            };
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({ content: payloadContent }),
            });
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout
                title={t('admin.settings.headerLinks')}
                subtitle={t('nav.settings')}
            >
                <Card className="p-4">
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-16 animate-pulse rounded bg-muted/70"
                            />
                        ))}
                    </div>
                </Card>
            </AdminLayout>
        );
    }

    return (
        <TooltipProvider delayDuration={200}>
            <AdminLayout
                title={t('admin.settings.headerLinks')}
                subtitle={t('admin.settings.reorder')}
                actions={
                    <Button
                        size="sm"
                        onClick={save}
                        className="gap-1.5"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {t('admin.settings.save')}
                    </Button>
                }
            >
                {/* Info Banner */}
                <Card className="mb-6 border-blue-200 bg-blue-50/50">
                    <CardContent className="flex items-start gap-3 py-4">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">
                                {t('admin.settings.navEditorGuide')}
                            </p>
                            <p className="text-xs leading-relaxed text-blue-700/80">
                                {t('admin.settings.navEditorDescription')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Navigation */}
                <div className="mb-6 flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
                    <button
                        onClick={() => setActiveTab('header')}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === 'header'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Link2 className="h-4 w-4" />
                        {t('admin.settings.headerLinks')}
                        <Badge variant="secondary" className="ml-1 text-[10px]">
                            {draft.header.length}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === 'groups'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <FolderOpen className="h-4 w-4" />
                        {t('admin.settings.headerGroups')}
                        <Badge variant="secondary" className="ml-1 text-[10px]">
                            {(draft.groups ?? []).length}
                        </Badge>
                    </button>
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === 'links'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Filter className="h-4 w-4" />
                        {t('admin.settings.customLinks')}
                        <Badge variant="secondary" className="ml-1 text-[10px]">
                            {(draft.links ?? []).length}
                        </Badge>
                    </button>
                </div>

                {/* ─── HEADER LINKS TAB ─── */}
                {activeTab === 'header' && (
                    <div className="space-y-6">
                        {/* Add Page Card */}
                        {availablePages.length > 0 && (
                            <Card className="border-2 border-dashed bg-muted/20">
                                <CardContent className="p-4">
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                                                <Plus className="h-4 w-4 text-primary" />
                                                {t(
                                                    'admin.settings.addPageToHeader',
                                                )}
                                            </Label>
                                            <p className="mb-2 text-xs text-muted-foreground">
                                                {t(
                                                    'admin.settings.addPageDescription',
                                                )}
                                            </p>
                                            <Select
                                                value={selectedPage}
                                                onValueChange={setSelectedPage}
                                            >
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue
                                                        placeholder={t(
                                                            'admin.settings.selectPageToAdd',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availablePages.map((p) => (
                                                        <SelectItem
                                                            key={p.key}
                                                            value={p.key}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    {t(
                                                                        'nav.' +
                                                                            p.key,
                                                                    )}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {p.href}
                                                                </span>
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            onClick={addPage}
                                            disabled={!selectedPage}
                                            className="gap-1.5"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {t('admin.settings.addPage')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {draft.header.length === 0 && (
                            <EmptyState
                                icon={Menu}
                                title={t('admin.settings.noHeaderLinks')}
                                description={t(
                                    'admin.settings.noHeaderLinksDescription',
                                )}
                                action={
                                    availablePages.length > 0 ? (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                document
                                                    .querySelector(
                                                        '[data-add-page-trigger]',
                                                    )
                                                    ?.scrollIntoView({
                                                        behavior: 'smooth',
                                                    })
                                            }
                                        >
                                            <Plus className="mr-1 h-4 w-4" />
                                            {t('admin.settings.getStarted')}
                                        </Button>
                                    ) : null
                                }
                            />
                        )}

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={[
                                    ...draft.header.map(
                                        (h) => `header-${h.pageKey}`,
                                    ),
                                    ...(draft.groups ?? []).map(
                                        (g) => `group-${g.key}`,
                                    ),
                                ]}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="grid gap-4">
                                    {draft.header.map((entry, idx) => {
                                        const page = getPage(entry.pageKey);
                                        if (!page) return null;
                                        const displayName =
                                            entry.label?.[lang] ??
                                            entry.label?.en ??
                                            t('nav.' + page.key);
                                        const isEnabled = entry.enabled;

                                        return (
                                            <SortableHeaderRow
                                                key={entry.pageKey}
                                                entry={entry}
                                                dragLabel={t(
                                                    'admin.settings.dragToReorderHeader',
                                                )}
                                            >
                                                <div className="space-y-4">
                                                    {/* Top Row: Identity + Quick Actions */}
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <NavBadge type="header" />
                                                            <div className="min-w-0">
                                                                <span
                                                                    className={`block truncate font-semibold ${!isEnabled ? 'text-muted-foreground line-through' : ''}`}
                                                                >
                                                                    {
                                                                        displayName
                                                                    }
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {page.href}
                                                                </span>
                                                            </div>
                                                            {!isEnabled && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-muted text-[10px] text-muted-foreground"
                                                                >
                                                                    <EyeOff className="mr-1 h-3 w-3" />
                                                                    {t(
                                                                        'admin.settings.hidden',
                                                                    )}
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {/* Placement */}
                                                            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1">
                                                                <Label className="text-[10px] text-muted-foreground">
                                                                    {t(
                                                                        'admin.settings.placement',
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
                                                                    <SelectTrigger className="h-7 w-28 border-0 bg-transparent text-xs focus:ring-0">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="topbar">
                                                                            {t(
                                                                                'admin.settings.topbarPlacement',
                                                                            )}
                                                                        </SelectItem>
                                                                        <SelectItem value="top">
                                                                            {t(
                                                                                'admin.settings.mainNav',
                                                                            )}
                                                                        </SelectItem>
                                                                        <SelectItem value="more">
                                                                            {t(
                                                                                'admin.settings.plusMore',
                                                                            )}
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            {/* Enabled Toggle */}
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1">
                                                                        <Label className="cursor-pointer text-[10px] text-muted-foreground">
                                                                            {isEnabled
                                                                                ? t(
                                                                                      'admin.settings.visible',
                                                                                  )
                                                                                : t(
                                                                                      'admin.settings.hidden',
                                                                                  )}
                                                                        </Label>
                                                                        <Switch
                                                                            checked={
                                                                                entry.enabled
                                                                            }
                                                                            onCheckedChange={(
                                                                                v,
                                                                            ) =>
                                                                                setHeader(
                                                                                    idx,
                                                                                    {
                                                                                        enabled:
                                                                                            v,
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-xs">
                                                                        {isEnabled
                                                                            ? t(
                                                                                  'admin.settings.linkVisible',
                                                                              )
                                                                            : t(
                                                                                  'admin.settings.linkHidden',
                                                                              )}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            {/* Dropdown Toggle */}
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1">
                                                                        <Label className="cursor-pointer text-[10px] text-muted-foreground">
                                                                            {t(
                                                                                'admin.settings.dropdown',
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
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-xs">
                                                                        {entry.isDropdown
                                                                            ? t(
                                                                                  'admin.settings.hasDropdown',
                                                                              )
                                                                            : t(
                                                                                  'admin.settings.noDropdown',
                                                                              )}
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            {entry.isDropdown && (
                                                                <Tooltip>
                                                                    <TooltipTrigger
                                                                        asChild
                                                                    >
                                                                        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1">
                                                                            <Label className="cursor-pointer text-[10px] text-muted-foreground">
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
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p className="text-xs">
                                                                            {entry.linkSelf
                                                                                ? t(
                                                                                      'admin.settings.linkSelfEnabled',
                                                                                  )
                                                                                : t(
                                                                                      'admin.settings.linkSelfDisabled',
                                                                                  )}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}

                                                            {/* Move to Group */}
                                                            {(
                                                                draft.groups ??
                                                                []
                                                            ).length > 0 && (
                                                                <Select
                                                                    value={
                                                                        moveToGroupTarget[
                                                                            idx
                                                                        ] ?? ''
                                                                    }
                                                                    onValueChange={(
                                                                        v,
                                                                    ) => {
                                                                        if (v) {
                                                                            moveHeaderToGroup(
                                                                                idx,
                                                                                v,
                                                                            );
                                                                            setMoveToGroupTarget(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const next =
                                                                                        {
                                                                                            ...prev,
                                                                                        };
                                                                                    delete next[
                                                                                        idx
                                                                                    ];
                                                                                    return next;
                                                                                },
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger
                                                                        className="h-8 w-36 text-xs"
                                                                        title={t(
                                                                            'admin.settings.moveToGroup',
                                                                        )}
                                                                    >
                                                                        <SelectValue
                                                                            placeholder={t(
                                                                                'admin.settings.moveToGroup',
                                                                            )}
                                                                        />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {(
                                                                            draft.groups ??
                                                                            []
                                                                        ).map(
                                                                            (
                                                                                g,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        g.key
                                                                                    }
                                                                                    value={
                                                                                        g.key
                                                                                    }
                                                                                >
                                                                                    <span className="flex items-center gap-2">
                                                                                        <FolderOpen className="h-3.5 w-3.5 text-amber-500" />
                                                                                        {g
                                                                                            .label?.[
                                                                                            lang
                                                                                        ] ||
                                                                                            g
                                                                                                .label
                                                                                                ?.en ||
                                                                                            g.key}
                                                                                    </span>
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}

                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() =>
                                                                    removePage(
                                                                        entry.pageKey,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Label Translations */}
                                                    <div className="rounded-lg bg-muted/30 p-3">
                                                        <Label className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                            <Globe className="h-3 w-3" />
                                                            {t(
                                                                'admin.settings.linkLabels',
                                                            )}
                                                        </Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {(
                                                                ['fr'] as const
                                                            ).map((l) => (
                                                                <div key={l}>
                                                                    <Input
                                                                        value={
                                                                            entry
                                                                                .label?.[
                                                                                l
                                                                            ] ??
                                                                            t(
                                                                                'nav.' +
                                                                                    page.key,
                                                                            )
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            const current =
                                                                                normalizeLocalizedText(
                                                                                    entry.label ??
                                                                                        t(
                                                                                            'nav.' +
                                                                                                page.key,
                                                                                        ),
                                                                                );
                                                                            setHeader(
                                                                                idx,
                                                                                {
                                                                                    label: {
                                                                                        ...current,
                                                                                        [l]: e
                                                                                            .target
                                                                                            .value,
                                                                                    },
                                                                                },
                                                                            );
                                                                        }}
                                                                        className="mt-1 h-8 text-xs"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Dropdown Items Section */}
                                                    {entry.isDropdown && (
                                                        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                                                            <div className="mb-3 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <NavBadge type="dropdown" />
                                                                    <Label className="text-sm font-medium">
                                                                        {t(
                                                                            'admin.settings.dropdownItems',
                                                                        )}
                                                                    </Label>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 gap-1 text-xs"
                                                                    onClick={() =>
                                                                        handleAddItem(
                                                                            idx,
                                                                            [],
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus className="h-3.5 w-3.5" />
                                                                    {t(
                                                                        'admin.settings.addItem',
                                                                    )}
                                                                </Button>
                                                            </div>

                                                            {entry.items
                                                                .length ===
                                                                0 && (
                                                                <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-3 text-xs text-muted-foreground">
                                                                    <Info className="h-3.5 w-3.5" />
                                                                    {t(
                                                                        'admin.settings.dropdownEmptyDescription',
                                                                    )}
                                                                </div>
                                                            )}

                                                            <DropdownItemTree
                                                                items={
                                                                    entry.items
                                                                }
                                                                depth={0}
                                                                parentPath={[]}
                                                                pageKey={
                                                                    entry.pageKey
                                                                }
                                                                page={page}
                                                                categoryTypes={
                                                                    categoryTypesByPage[
                                                                        entry.pageKey as keyof typeof categoryTypesByPage
                                                                    ] ?? []
                                                                }
                                                                allCategoryValues={getAllCategoryValuesForPage(
                                                                    entry.pageKey,
                                                                )}
                                                                formErrors={
                                                                    formErrors
                                                                }
                                                                errorPrefix={`${idx}`}
                                                                onAdd={(
                                                                    parentPath,
                                                                ) =>
                                                                    handleAddItem(
                                                                        idx,
                                                                        parentPath,
                                                                    )
                                                                }
                                                                onUpdate={(
                                                                    path,
                                                                    patch,
                                                                ) =>
                                                                    handleUpdateItem(
                                                                        idx,
                                                                        path,
                                                                        patch,
                                                                    )
                                                                }
                                                                onRemove={(
                                                                    path,
                                                                ) =>
                                                                    handleRemoveItem(
                                                                        idx,
                                                                        path,
                                                                    )
                                                                }
                                                                onMove={(
                                                                    path,
                                                                    dir,
                                                                ) =>
                                                                    handleMoveItem(
                                                                        idx,
                                                                        path,
                                                                        dir,
                                                                    )
                                                                }
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
                    </div>
                )}

                {/* ─── GROUPS TAB ─── */}
                {activeTab === 'groups' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <SectionHeader
                                title={t('admin.settings.headerGroups')}
                                description={t(
                                    'admin.settings.groupsDescription',
                                )}
                                icon={FolderOpen}
                                action={
                                    <Button
                                        size="sm"
                                        onClick={addGroup}
                                        className="gap-1.5"
                                    >
                                        <FolderPlus className="h-4 w-4" />
                                        {t('admin.settings.createGroup')}
                                    </Button>
                                }
                            />
                        </div>

                        {(!draft.groups || draft.groups.length === 0) && (
                            <EmptyState
                                icon={FolderOpen}
                                title={t('admin.settings.noGroups')}
                                description={t(
                                    'admin.settings.noGroupsDescription',
                                )}
                                action={
                                    <Button size="sm" onClick={addGroup}>
                                        <FolderPlus className="mr-1 h-4 w-4" />
                                        {t('admin.settings.createFirstGroup')}
                                    </Button>
                                }
                            />
                        )}

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={(draft.groups ?? []).map(
                                    (g) => `group-${g.key}`,
                                )}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="grid gap-4">
                                    {(draft.groups ?? []).map((group) => (
                                        <GroupCard
                                            key={group.key}
                                            group={group}
                                            allGroups={draft.groups ?? []}
                                            depth={0}
                                            availablePages={
                                                availablePagesForGroup
                                            }
                                            onUpdate={(patch) =>
                                                updateGroup(group.key, patch)
                                            }
                                            onRemove={() =>
                                                removeGroup(group.key)
                                            }
                                            onAddPage={(pageKey) =>
                                                addPageToGroup(
                                                    group.key,
                                                    pageKey,
                                                )
                                            }
                                            onRemovePage={(pageKey) =>
                                                removePageFromGroup(
                                                    group.key,
                                                    pageKey,
                                                )
                                            }
                                            onMovePage={(pageKey, dir) =>
                                                movePageInGroup(
                                                    group.key,
                                                    pageKey,
                                                    dir,
                                                )
                                            }
                                            onUpdatePage={(pageKey, patch) =>
                                                updateGroupPage(
                                                    group.key,
                                                    pageKey,
                                                    patch,
                                                )
                                            }
                                            onAddSubGroup={addGroup}
                                            onUpdateSubGroup={updateSubGroup}
                                            onRemoveSubGroup={removeSubGroup}
                                            onAddPageToSubGroup={addPageToGroup}
                                            onRemovePageFromSubGroup={
                                                removePageFromGroup
                                            }
                                            onMovePageInSubGroup={
                                                movePageInGroup
                                            }
                                            onUpdatePageInSubGroup={
                                                updateGroupPage
                                            }
                                            onAddLink={(
                                                parentPath,
                                                parentPageKey,
                                            ) =>
                                                addLinkToGroup(
                                                    group.key,
                                                    parentPath,
                                                    parentPageKey,
                                                )
                                            }
                                            onUpdateLink={(path, patch) =>
                                                updateLinkInGroup(
                                                    group.key,
                                                    path,
                                                    patch,
                                                )
                                            }
                                            onRemoveLink={(path) =>
                                                removeLinkFromGroup(
                                                    group.key,
                                                    path,
                                                )
                                            }
                                            onMoveLink={(path, dir) =>
                                                moveLinkInGroup(
                                                    group.key,
                                                    path,
                                                    dir,
                                                )
                                            }
                                            onAddLinkToSubGroup={addLinkToGroup}
                                            onUpdateLinkInSubGroup={
                                                updateLinkInGroup
                                            }
                                            onRemoveLinkInSubGroup={
                                                removeLinkFromGroup
                                            }
                                            onMoveLinkInSubGroup={
                                                moveLinkInGroup
                                            }
                                            getCategoriesForPage={
                                                getCategoriesForPage
                                            }
                                            categoryTypesByPage={
                                                categoryTypesByPage
                                            }
                                            getAllCategoryValuesForPage={
                                                getAllCategoryValuesForPage
                                            }
                                            formErrors={formErrors}
                                            lang={lang}
                                            t={t}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {/* ─── CUSTOM LINKS TAB ─── */}
                {activeTab === 'links' && (
                    <div className="space-y-6">
                        {/* Add Link Card */}
                        <Card className="border-2 border-dashed bg-muted/20">
                            <CardContent className="p-4">
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <Label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                                            <Plus className="h-4 w-4 text-primary" />
                                            {t(
                                                'admin.settings.addLinkToHeader',
                                            )}
                                        </Label>
                                        <p className="mb-2 text-xs text-muted-foreground">
                                            {t(
                                                'admin.settings.addLinkDescription',
                                            )}
                                        </p>
                                        <div className="flex gap-2">
                                            <Select
                                                value={selectedLinkPage}
                                                onValueChange={
                                                    setSelectedLinkPage
                                                }
                                            >
                                                <SelectTrigger className="bg-background">
                                                    <SelectValue
                                                        placeholder={t(
                                                            'admin.settings.selectPageForLink',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {AVAILABLE_PAGES.map(
                                                        (p) => (
                                                            <SelectItem
                                                                key={p.key}
                                                                value={p.key}
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <span className="font-medium">
                                                                        {t(
                                                                            'nav.' +
                                                                                p.key,
                                                                        )}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {p.href}
                                                                    </span>
                                                                </span>
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                onClick={addStandaloneLink}
                                                disabled={!selectedLinkPage}
                                                className="gap-1.5"
                                            >
                                                <Plus className="h-4 w-4" />
                                                {t('admin.settings.addLink')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {(draft.links ?? []).length === 0 && (
                            <EmptyState
                                icon={Filter}
                                title={t('admin.settings.noLinks')}
                                description={t(
                                    'admin.settings.noLinksDescription',
                                )}
                                action={
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            document
                                                .querySelector(
                                                    '[data-add-link-trigger]',
                                                )
                                                ?.scrollIntoView({
                                                    behavior: 'smooth',
                                                })
                                        }
                                    >
                                        <Plus className="mr-1 h-4 w-4" />
                                        {t('admin.settings.createFirstLink')}
                                    </Button>
                                }
                            />
                        )}

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={(draft.links ?? []).map(
                                    (l) => `link-${l.key}`,
                                )}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="grid gap-4">
                                    {(draft.links ?? []).map((link) => {
                                        const page = getPage(
                                            link.targetPageKey,
                                        );
                                        const previewHref = buildNavLinkHref(
                                            link,
                                            lang as 'en' | 'fr' | 'ar',
                                        );

                                        return (
                                            <Card
                                                key={link.key}
                                                className="overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                                            >
                                                <div className="flex items-start gap-1 p-5">
                                                    <div className="min-w-0 flex-1 pt-0.5">
                                                        <div className="space-y-4">
                                                            {/* Top Row: Identity + Quick Actions */}
                                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-blue-200 bg-blue-50 text-[10px] text-blue-700"
                                                                    >
                                                                        <Filter className="mr-1 h-3 w-3" />
                                                                        {t(
                                                                            'admin.settings.customLink',
                                                                        )}
                                                                    </Badge>
                                                                    <div className="min-w-0">
                                                                        <span
                                                                            className={`block truncate font-semibold ${!link.enabled ? 'text-muted-foreground line-through' : ''}`}
                                                                        >
                                                                            {link.label ||
                                                                                link.key}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {
                                                                                previewHref
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    {!link.enabled && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="border-muted text-[10px] text-muted-foreground"
                                                                        >
                                                                            <EyeOff className="mr-1 h-3 w-3" />
                                                                            {t(
                                                                                'admin.settings.hidden',
                                                                            )}
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {/* Placement */}
                                                                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1">
                                                                        <Label className="text-[10px] text-muted-foreground">
                                                                            {t(
                                                                                'admin.settings.placement',
                                                                            )}
                                                                        </Label>
                                                                        <Select
                                                                            value={
                                                                                link.placement
                                                                            }
                                                                            onValueChange={(
                                                                                v: any,
                                                                            ) =>
                                                                                updateLink(
                                                                                    link.key,
                                                                                    {
                                                                                        placement:
                                                                                            v,
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger className="h-7 w-28 border-0 bg-transparent text-xs focus:ring-0">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="topbar">
                                                                                    {t(
                                                                                        'admin.settings.topbarPlacement',
                                                                                    )}
                                                                                </SelectItem>
                                                                                <SelectItem value="top">
                                                                                    {t(
                                                                                        'admin.settings.mainNav',
                                                                                    )}
                                                                                </SelectItem>
                                                                                <SelectItem value="more">
                                                                                    {t(
                                                                                        'admin.settings.plusMore',
                                                                                    )}
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    {/* Enabled Toggle */}
                                                                    <Tooltip>
                                                                        <TooltipTrigger
                                                                            asChild
                                                                        >
                                                                            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1">
                                                                                <Label className="cursor-pointer text-[10px] text-muted-foreground">
                                                                                    {link.enabled
                                                                                        ? t(
                                                                                              'admin.settings.visible',
                                                                                          )
                                                                                        : t(
                                                                                              'admin.settings.hidden',
                                                                                          )}
                                                                                </Label>
                                                                                <Switch
                                                                                    checked={
                                                                                        link.enabled
                                                                                    }
                                                                                    onCheckedChange={(
                                                                                        v,
                                                                                    ) =>
                                                                                        updateLink(
                                                                                            link.key,
                                                                                            {
                                                                                                enabled:
                                                                                                    v,
                                                                                            },
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="text-xs">
                                                                                {link.enabled
                                                                                    ? t(
                                                                                          'admin.settings.linkVisible',
                                                                                      )
                                                                                    : t(
                                                                                          'admin.settings.linkHidden',
                                                                                      )}
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>

                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                                        onClick={() =>
                                                                            removeLink(
                                                                                link.key,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Label */}
                                                            <div className="rounded-lg bg-muted/30 p-3">
                                                                <Label className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                                    <Globe className="h-3 w-3" />
                                                                    {t(
                                                                        'admin.settings.linkLabels',
                                                                    )}
                                                                </Label>
                                                                <Input
                                                                    value={
                                                                        link.label ??
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        updateLink(
                                                                            link.key,
                                                                            {
                                                                                label: e
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                        );
                                                                    }}
                                                                    placeholder={t(
                                                                        'admin.settings.linkLabels',
                                                                    )}
                                                                    className="h-8 text-xs"
                                                                />
                                                            </div>

                                                            {/* Link Config */}
                                                            <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                                                                <div className="mb-3 flex items-center gap-2">
                                                                    <NavBadge type="item" />
                                                                    <Label className="text-sm font-medium">
                                                                        {t(
                                                                            'admin.settings.linkConfig',
                                                                        )}
                                                                    </Label>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                                    {/* Target Page */}
                                                                    <div>
                                                                        <Label className="mb-1 block text-xs text-muted-foreground">
                                                                            {t(
                                                                                'admin.settings.targetPage',
                                                                            )}
                                                                        </Label>
                                                                        <Select
                                                                            value={
                                                                                link.targetPageKey
                                                                            }
                                                                            onValueChange={(
                                                                                v,
                                                                            ) =>
                                                                                updateLink(
                                                                                    link.key,
                                                                                    {
                                                                                        targetPageKey:
                                                                                            v,
                                                                                        value: '',
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger className="h-8 bg-background text-xs">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {AVAILABLE_PAGES.map(
                                                                                    (
                                                                                        p,
                                                                                    ) => (
                                                                                        <SelectItem
                                                                                            key={
                                                                                                p.key
                                                                                            }
                                                                                            value={
                                                                                                p.key
                                                                                            }
                                                                                        >
                                                                                            {t(
                                                                                                'nav.' +
                                                                                                    p.key,
                                                                                            )}
                                                                                        </SelectItem>
                                                                                    ),
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    {/* Mode */}
                                                                    <div>
                                                                        <Label className="mb-1 block text-xs text-muted-foreground">
                                                                            {t(
                                                                                'admin.settings.linkMode',
                                                                            )}
                                                                        </Label>
                                                                        <Select
                                                                            value={
                                                                                link.mode
                                                                            }
                                                                            onValueChange={(
                                                                                v: DropdownItemConfig['mode'],
                                                                            ) =>
                                                                                updateLink(
                                                                                    link.key,
                                                                                    {
                                                                                        mode: v,
                                                                                        value: '',
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger className="h-8 bg-background text-xs">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="filter">
                                                                                    <span className="flex items-center gap-1.5">
                                                                                        <Filter className="h-3 w-3" />
                                                                                        {t(
                                                                                            'admin.settings.filterMode',
                                                                                        )}
                                                                                    </span>
                                                                                </SelectItem>
                                                                                <SelectItem value="search">
                                                                                    <span className="flex items-center gap-1.5">
                                                                                        <Search className="h-3 w-3" />
                                                                                        {t(
                                                                                            'admin.settings.searchMode',
                                                                                        )}
                                                                                    </span>
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    {/* Value */}
                                                                    <div>
                                                                        <Label className="mb-1 block text-xs text-muted-foreground">
                                                                            {t(
                                                                                'admin.settings.filterValue',
                                                                            )}
                                                                        </Label>
                                                                        {link.mode ===
                                                                        'search' ? (
                                                                            <Input
                                                                                value={
                                                                                    link.value
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    updateLink(
                                                                                        link.key,
                                                                                        {
                                                                                            value: e
                                                                                                .target
                                                                                                .value,
                                                                                        },
                                                                                    )
                                                                                }
                                                                                placeholder={t(
                                                                                    'admin.settings.searchKeyword',
                                                                                )}
                                                                                className="h-8 bg-background text-xs"
                                                                            />
                                                                        ) : (
                                                                            <Select
                                                                                value={
                                                                                    link.value
                                                                                }
                                                                                onValueChange={(
                                                                                    v,
                                                                                ) =>
                                                                                    updateLink(
                                                                                        link.key,
                                                                                        {
                                                                                            value: v,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="h-8 bg-background text-xs">
                                                                                    <SelectValue
                                                                                        placeholder={t(
                                                                                            'admin.settings.selectFilterValue',
                                                                                        )}
                                                                                    />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {getAllCategoryValuesForPage(
                                                                                        link.targetPageKey,
                                                                                    ).map(
                                                                                        (
                                                                                            opt,
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    opt.value
                                                                                                }
                                                                                                value={
                                                                                                    opt.value
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    opt.label
                                                                                                }
                                                                                            </SelectItem>
                                                                                        ),
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {/* Preview URL */}
                                                                <div className="mt-3 rounded-md bg-background px-3 py-2 text-xs text-muted-foreground">
                                                                    <span className="font-medium">
                                                                        {t(
                                                                            'admin.settings.previewUrl',
                                                                        )}
                                                                        :
                                                                    </span>{' '}
                                                                    {
                                                                        previewHref
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
            </AdminLayout>
        </TooltipProvider>
    );
}
