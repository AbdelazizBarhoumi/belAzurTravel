import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, GripVertical, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { AVAILABLE_PAGES, getPage, DEFAULT_NAV_SETTINGS } from '@/lib/nav-config';
import { normalizeNavSettingsDraft } from '@/lib/siteSettingsPayload';
import type { NavSettings } from '@/lib/nav-config';

function sanitizeNavSettings(nav: NavSettings): NavSettings {
    const allowedPageKeys = new Set(AVAILABLE_PAGES.map((p) => p.key));
    return {
        header: nav.header.filter((e) => allowedPageKeys.has(e.pageKey)),
        footer: nav.footer.map((c) => ({ ...c, pageKeys: c.pageKeys.filter((k) => allowedPageKeys.has(k)) })),
        groups: nav.groups ?? [],
    };
}

function SortableFooterPage({ pageKey, label, onRemove, onMove, isFirst, isLast }: {
    pageKey: string; label: string; onRemove: () => void; onMove: (dir: number) => void; isFirst: boolean; isLast: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pageKey });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between rounded-md border bg-muted/20 p-2">
            <div className="flex items-center gap-2">
                <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing" aria-label="Drag to reorder">
                    <GripVertical className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(-1)} disabled={isFirst}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onMove(1)} disabled={isLast}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onRemove}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
        </div>
    );
}

export default function AdminSiteSettingsFooter() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();
    const [draft, setDraft] = useState<NavSettings>(DEFAULT_NAV_SETTINGS);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    useEffect(() => {
        const normalized = sanitizeNavSettings(settings.content?.nav?.settings ?? DEFAULT_NAV_SETTINGS);
        setDraft(normalizeNavSettingsDraft(normalized));
    }, [settings]);

    const updateFooterTitle = (colIdx: number, patch: string | Record<string, string>) => {
        setDraft((prev) => ({
            ...prev,
            footer: prev.footer.map((c, i) => {
                if (i !== colIdx) return c;
                const existing = typeof c.title === 'object' ? c.title : { en: c.title, fr: c.title, ar: c.title };
                const updated = typeof patch === 'string' ? { ...existing, en: patch, fr: patch, ar: patch } : { ...existing, ...patch };
                return { ...c, title: updated };
            }),
        }));
    };

    const toggleFooterPage = (colIdx: number, pageKey: string) => {
        const col = draft.footer[colIdx];
        const has = col.pageKeys.includes(pageKey);
        setDraft((prev) => ({
            ...prev,
            footer: prev.footer.map((c, i) => (i === colIdx ? { ...c, pageKeys: has ? c.pageKeys.filter((k) => k !== pageKey) : [...c.pageKeys, pageKey] } : c)),
        }));
    };

    const moveFooterPage = (colIdx: number, pageIdx: number, dir: number) => {
        const col = draft.footer[colIdx];
        const nextIdx = pageIdx + dir;
        if (nextIdx < 0 || nextIdx >= col.pageKeys.length) return;
        const nextKeys = [...col.pageKeys];
        [nextKeys[pageIdx], nextKeys[nextIdx]] = [nextKeys[nextIdx], nextKeys[pageIdx]];
        setDraft((prev) => ({ ...prev, footer: prev.footer.map((c, i) => (i === colIdx ? { ...c, pageKeys: nextKeys } : c)) }));
    };

    const handleFooterDragEnd = (colIdx: number, event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const col = draft.footer[colIdx];
            const oldIndex = col.pageKeys.indexOf(active.id as string);
            const newIndex = col.pageKeys.indexOf(over.id as string);
            setDraft((prev) => ({
                ...prev,
                footer: prev.footer.map((c, i) => (i === colIdx ? { ...c, pageKeys: arrayMove(c.pageKeys, oldIndex, newIndex) } : c)),
            }));
        }
    };

    const save = async () => {
        try {
            const sanitizedDraft = normalizeNavSettingsDraft(sanitizeNavSettings(draft));
            const normalizedContent = settings.content ?? {};
            const payloadContent: Record<string, unknown> = {
                ...normalizedContent,
                nav: { ...(normalizedContent.nav as any), settings: sanitizedDraft },
            };
            await apiFetch('/api/site-settings', { method: 'PUT', body: JSON.stringify({ content: payloadContent }) });
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        }
    };

    if (loading) {
        return (
            <AdminLayout title={t('admin.settings.footerColumns')} subtitle={t('nav.settings')}>
                <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((i) => <Card key={i} className="p-4"><div className="h-48 animate-pulse rounded bg-muted/70" /></Card>)}</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={t('admin.settings.footerColumns')}
            subtitle="Configure footer columns and page links"
            actions={<Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" /> {t('admin.settings.save')}</Button>}
        >
            <div className="grid gap-4 md:grid-cols-3">
                {draft.footer.map((col, colIdx) => (
                    <Card key={colIdx} className="p-4">
                        <Label className="text-xs font-medium">{t('admin.settings.columnTitle')}</Label>
                        <div className="mb-2 grid grid-cols-1 gap-2">
                            <Input
                                value={typeof (col as any).title === 'string' ? (col as any).title : ((col as any).title?.en ?? '')}
                                onChange={(e) => updateFooterTitle(colIdx, { en: e.target.value })}
                                placeholder="Title (EN)"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    value={typeof (col as any).title === 'string' ? (col as any).title : ((col as any).title?.fr ?? '')}
                                    onChange={(e) => updateFooterTitle(colIdx, { fr: e.target.value })}
                                    placeholder="Title (FR)"
                                />
                                <Input
                                    value={typeof (col as any).title === 'string' ? (col as any).title : ((col as any).title?.ar ?? '')}
                                    onChange={(e) => updateFooterTitle(colIdx, { ar: e.target.value })}
                                    placeholder="Title (AR)"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleFooterDragEnd(colIdx, e)}>
                                <SortableContext items={col.pageKeys} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-2">
                                        {col.pageKeys.map((key, pIdx) => {
                                            const page = getPage(key);
                                            return (
                                                <SortableFooterPage
                                                    key={key} pageKey={key}
                                                    label={t('nav.' + page?.key) ?? page?.label ?? ''}
                                                    onRemove={() => toggleFooterPage(colIdx, key)}
                                                    onMove={(dir) => moveFooterPage(colIdx, pIdx, dir)}
                                                    isFirst={pIdx === 0} isLast={pIdx === col.pageKeys.length - 1}
                                                />
                                            );
                                        })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                            <Select value="" onValueChange={(val) => toggleFooterPage(colIdx, val)}>
                                <SelectTrigger className="mt-2 h-8 w-full text-xs">
                                    <div className="flex items-center gap-2"><Plus className="h-3 w-3" /> Add Page</div>
                                </SelectTrigger>
                                <SelectContent>
                                    {AVAILABLE_PAGES.filter((p) =>
                                        !draft.footer.some((c) => c.pageKeys.includes(p.key))
                                    ).map((p) => (
                                        <SelectItem key={p.key} value={p.key}>{t('nav.' + p.key) ?? p.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </Card>
                ))}
            </div>
        </AdminLayout>
    );
}
