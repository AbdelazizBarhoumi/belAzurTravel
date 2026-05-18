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
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { AVAILABLE_PAGES, getPage, DEFAULT_NAV_SETTINGS } from '@/lib/nav-config';
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
    const [invalidLabels, setInvalidLabels] = useState<Record<string, string>>(
        {},
    );

    // Keep draft in sync when settings are loaded/changed externally
    // (e.g., after initial fetch or when reset is applied)
    useEffect(() => {
        setDraft(settings);
    }, [settings]);

    useEffect(() => {
        setCompanyName(siteSettings.companyName || '');
        setAddress(siteSettings.address || '');
        setPlusCode(siteSettings.plusCode || '');
        setYear(siteSettings.year || new Date().getFullYear());
        setEmail(siteSettings.email || '');
        setPhone(siteSettings.phone || '');
        setWhatsapp(siteSettings.whatsapp || '');
        setHours(siteSettings.hours || []);
        setSocialLinks(siteSettings.socialLinks || []);
    }, [siteSettings]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );

    const { t } = useLanguage();

    const setHeader = (idx: number, patch: Partial<HeaderEntry>) => {
        setDraft({
            ...draft,
            header: draft.header.map((h, i) =>
                i === idx ? { ...h, ...patch } : h,
            ),
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

    const save = async () => {
        // Client-side validation: ensure dropdown items have en/fr/ar labels
        const errors: Record<string, string> = {};
        for (const [hIdx, entry] of draft.header.entries()) {
            if (entry.isDropdown && Array.isArray(entry.items)) {
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
                    },
                }),
            });
            try {
                window.dispatchEvent(new CustomEvent('site-settings-updated'));
            } catch {}

            toast.success('Site settings saved');
        } catch {
            toast.error('Failed to save site settings');
        }
    };

    const handleReset = async () => {
        try {
            await reset();
            setDraft(DEFAULT_NAV_SETTINGS);
            toast.info('Reset navigation to defaults');
        } catch {
            toast.error('Failed to reset navigation settings');
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
            title="Site Settings"
            subtitle="Manage navigation, footer, and company contact details."
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="mr-1 h-4 w-4" /> Reset
                    </Button>
                    <Button size="sm" onClick={save}>
                        <Save className="mr-1 h-4 w-4" /> Save
                    </Button>
                </div>
            }
        >
            <div className="space-y-8">
                <section>
                    <h2 className="mb-3 font-serif text-xl font-bold">
                        Company & contact
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Keep your brand identity and customer contact info
                        aligned with the active navigation config.
                    </p>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="space-y-3 p-4">
                            <h3 className="font-medium">Company info</h3>
                            <div className="space-y-2">
                                <Label>Company name</Label>
                                <Input
                                    value={companyName}
                                    onChange={(e) =>
                                        setCompanyName(e.target.value)
                                    }
                                    placeholder="BelAzur Travel"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="City, country"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Plus Code for map</Label>
                                <Input
                                    value={plusCode}
                                    onChange={(e) =>
                                        setPlusCode(e.target.value)
                                    }
                                    placeholder="8FVC9G8F+5V"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Add the Google Maps Plus Code here so the
                                    contact map points to the exact location.
                                    You can copy it from Google Maps.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Year</Label>
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
                            <h3 className="font-medium">Contact details</h3>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="hello@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp</Label>
                                <Input
                                    value={whatsapp}
                                    onChange={(e) =>
                                        setWhatsapp(e.target.value)
                                    }
                                    placeholder="15551234567"
                                />
                            </div>
                        </Card>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <Card className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">Social media</h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={addSocial}
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add
                                    link
                                </Button>
                            </div>
                            {socialLinks.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No social links yet. Add Facebook,
                                    Instagram, X, or any channel.
                                </p>
                            )}
                            {socialLinks.map((entry, idx) => (
                                <div
                                    key={`social-${idx}`}
                                    className="grid grid-cols-1 items-end gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-12"
                                >
                                    <div className="md:col-span-4">
                                        <Label className="text-xs">Label</Label>
                                        <Input
                                            value={entry.label}
                                            onChange={(e) =>
                                                updateSocial(idx, {
                                                    label: e.target.value,
                                                })
                                            }
                                            placeholder="Instagram"
                                        />
                                    </div>
                                    <div className="md:col-span-7">
                                        <Label className="text-xs">URL</Label>
                                        <Input
                                            value={entry.href}
                                            onChange={(e) =>
                                                updateSocial(idx, {
                                                    href: e.target.value,
                                                })
                                            }
                                            placeholder="https://instagram.com/belazurtravel"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
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
                                <h3 className="font-medium">Business hours</h3>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={addHour}
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add
                                    row
                                </Button>
                            </div>
                            {hours.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No hours set. Add entries like Mon-Fri /
                                    9:00 - 18:00.
                                </p>
                            )}
                            {hours.map((entry, idx) => (
                                <div
                                    key={`hour-${idx}`}
                                    className="grid grid-cols-1 items-end gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-12"
                                >
                                    <div className="md:col-span-4">
                                        <Label className="text-xs">Day</Label>
                                        <Input
                                            value={entry.dayKey}
                                            onChange={(e) =>
                                                updateHour(idx, {
                                                    dayKey: e.target.value,
                                                })
                                            }
                                            placeholder="mon-fri"
                                        />
                                    </div>
                                    <div className="md:col-span-7">
                                        <Label className="text-xs">Hours</Label>
                                        <Input
                                            value={entry.value}
                                            onChange={(e) =>
                                                updateHour(idx, {
                                                    value: e.target.value,
                                                })
                                            }
                                            placeholder="9:00 - 18:00"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
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
                    <h2 className="mb-2 font-serif text-xl font-bold">
                        Header links
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Drag rows to reorder. Use placement to send items into
                        the global <strong>"+ More"</strong> dropdown instead of
                        showing them as standalone buttons. For dropdowns,
                        choose whether clicking the trigger itself navigates to
                        the page, or only opens the menu on hover.
                    </p>

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
                                                            {entry.isDropdown && (
                                                                <div className="flex items-center gap-2">
                                                                    <Label className="text-xs">
                                                                        Trigger
                                                                        links to
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
                                                    entry.isDropdown && (
                                                        <div className="space-y-2 border-t pt-4">
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
                                                                                    <SelectItem value="search">
                                                                                        Search
                                                                                        keyword
                                                                                        (q)
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="md:col-span-4">
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
                        Footer columns
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">
                        For each footer column, check which pages appear under
                        it.
                    </p>
                    <div className="grid gap-4 md:grid-cols-3">
                        {draft.footer.map((col, colIdx) => (
                            <Card key={colIdx} className="p-4">
                                <Label className="text-xs font-medium">
                                    Column title
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
                                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                    {AVAILABLE_PAGES.map((p) => (
                                        <label
                                            key={p.key}
                                            className="flex cursor-pointer items-center gap-2 text-sm transition-colors hover:text-primary"
                                        >
                                            <Checkbox
                                                checked={col.pageKeys.includes(
                                                    p.key,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleFooterPage(
                                                        colIdx,
                                                        p.key,
                                                    )
                                                }
                                            />
                                            <span>{p.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

