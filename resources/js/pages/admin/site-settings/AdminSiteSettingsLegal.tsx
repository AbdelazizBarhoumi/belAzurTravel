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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { normalizeLegalBody, type LegalBodyFormat } from '@/lib/legal';

interface LegalSectionDraft {
    title: Record<string, string>;
    body: { format: LegalBodyFormat; content: Record<string, string> };
}

export default function AdminSiteSettingsLegal() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();
    const [sections, setSections] = useState<LegalSectionDraft[]>([]);
    const [markdownPreview, setMarkdownPreview] = useState<
        Record<string, boolean>
    >({});
    const [langTabs, setLangTabs] = useState<
        Record<number, 'en' | 'fr' | 'ar'>
    >({});
    const [autosaveStatus, setAutosaveStatus] = useState<
        'idle' | 'saving' | 'saved' | 'error'
    >('idle');
    const autosaveTimerRef = useRef<number | null>(null);
    const lastSavedRef = useRef<string>('');
    const autosaveReadyRef = useRef(false);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );

    useEffect(() => {
        setSections(
            settings.legalSections?.map((s) => ({
                title: s.title || { en: '', fr: '', ar: '' },
                body: normalizeLegalBody(s.body),
            })) ?? [],
        );
        const snapshot = JSON.stringify(
            settings.legalSections?.map((s) => ({
                title: s.title || { en: '', fr: '', ar: '' },
                body: normalizeLegalBody(s.body),
            })) ?? [],
        );
        lastSavedRef.current = snapshot;
        autosaveReadyRef.current = true;
    }, [settings]);

    useEffect(() => {
        if (!autosaveReadyRef.current) return;
        const snapshot = JSON.stringify(buildPayload());
        if (snapshot === lastSavedRef.current) return;
        setAutosaveStatus('saving');
        if (autosaveTimerRef.current)
            window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = window.setTimeout(async () => {
            try {
                await apiFetch('/api/site-settings', {
                    method: 'PUT',
                    body: JSON.stringify({ legalSections: buildPayload() }),
                });
                lastSavedRef.current = JSON.stringify(buildPayload());
                setAutosaveStatus('saved');
                window.setTimeout(() => setAutosaveStatus('idle'), 2000);
            } catch {
                setAutosaveStatus('error');
            }
        }, 1200);
        return () => {
            if (autosaveTimerRef.current)
                window.clearTimeout(autosaveTimerRef.current);
        };
    }, [sections]);

    const buildPayload = () =>
        sections.map((s) => ({
            title: s.title,
            body: { format: s.body.format, content: s.body.content },
        }));

    const addSection = () => {
        setSections((p) => [
            ...p,
            {
                title: { en: 'New', fr: 'Nouveau', ar: 'جديد' },
                body: {
                    format: 'markdown',
                    content: { en: '', fr: '', ar: '' },
                },
            },
        ]);
    };

    const updateSection = (idx: number, patch: Partial<LegalSectionDraft>) => {
        setSections((p) =>
            p.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
        );
    };

    const removeSection = (idx: number) =>
        setSections((p) => p.filter((_, i) => i !== idx));

    const getActiveLang = (idx: number) => langTabs[idx] ?? 'en';

    const moveSection = (idx: number, dir: number) => {
        const copy = [...sections];
        const target = idx + dir;
        if (target < 0 || target >= copy.length) return;
        [copy[idx], copy[target]] = [copy[target], copy[idx]];
        setSections(copy);
    };

    if (loading) {
        return (
            <AdminLayout
                title={t('admin.settings.legalSectionsTitle')}
                subtitle={t('nav.settings')}
            >
                <Card className="p-4">
                    <div className="h-48 animate-pulse rounded bg-muted/70" />
                </Card>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={t('admin.settings.legalSectionsTitle')}
            subtitle={t('admin.settings.legalSectionsDescription')}
            actions={
                <div className="flex items-center gap-3">
                    {autosaveStatus !== 'idle' && (
                        <span className="text-xs text-muted-foreground">
                            {autosaveStatus === 'saving'
                                ? 'Autosaving...'
                                : autosaveStatus === 'saved'
                                  ? 'Saved'
                                  : 'Autosave failed'}
                        </span>
                    )}
                    <Button size="sm" variant="outline" onClick={addSection}>
                        <Plus className="mr-1 h-4 w-4" />{' '}
                        {t('admin.settings.add_section')}
                    </Button>
                </div>
            }
        >
            <div className="grid gap-4">
                {sections.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                        {t('admin.settings.no_legal_sections')}
                    </p>
                )}
                {sections.map((sec, idx) => (
                    <Card key={idx} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                    <div>
                                        <Label className="text-xs">
                                            {t('admin.settings.title_en')}
                                        </Label>
                                        <Input
                                            value={sec.title.en}
                                            onChange={(e) =>
                                                updateSection(idx, {
                                                    title: {
                                                        ...sec.title,
                                                        en: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">
                                            {t('admin.settings.title_fr')}
                                        </Label>
                                        <Input
                                            value={sec.title.fr}
                                            onChange={(e) =>
                                                updateSection(idx, {
                                                    title: {
                                                        ...sec.title,
                                                        fr: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">
                                            {t('admin.settings.title_ar')}
                                        </Label>
                                        <Input
                                            value={sec.title.ar}
                                            onChange={(e) =>
                                                updateSection(idx, {
                                                    title: {
                                                        ...sec.title,
                                                        ar: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <Label className="text-xs">
                                        {t('admin.settings.body_format')}
                                    </Label>
                                    <Select
                                        value={sec.body.format}
                                        onValueChange={(v) =>
                                            updateSection(idx, {
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
                                                {t('admin.settings.markdown')}
                                            </SelectItem>
                                            <SelectItem value="richtext">
                                                {t('admin.settings.richtext')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {(['en', 'fr', 'ar'] as const).map((lk) => (
                                        <Button
                                            key={lk}
                                            size="sm"
                                            variant={
                                                getActiveLang(idx) === lk
                                                    ? 'default'
                                                    : 'ghost'
                                            }
                                            onClick={() =>
                                                setLangTabs((p) => ({
                                                    ...p,
                                                    [idx]: lk,
                                                }))
                                            }
                                        >
                                            {lk.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>

                                {sec.body.format === 'markdown' ? (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">
                                                {t('admin.settings.body')} (
                                                {getActiveLang(
                                                    idx,
                                                ).toUpperCase()}
                                                )
                                            </Label>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setMarkdownPreview((p) => ({
                                                        ...p,
                                                        [`${idx}-${getActiveLang(idx)}`]:
                                                            !p[
                                                                `${idx}-${getActiveLang(idx)}`
                                                            ],
                                                    }))
                                                }
                                            >
                                                {markdownPreview[
                                                    `${idx}-${getActiveLang(idx)}`
                                                ]
                                                    ? t('admin.settings.edit')
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
                                                        sec.body.content[
                                                            getActiveLang(idx)
                                                        ]
                                                    }
                                                />
                                            </div>
                                        ) : (
                                            <Textarea
                                                value={
                                                    sec.body.content[
                                                        getActiveLang(idx)
                                                    ]
                                                }
                                                onChange={(e) =>
                                                    updateSection(idx, {
                                                        body: {
                                                            ...sec.body,
                                                            content: {
                                                                ...sec.body
                                                                    .content,
                                                                [getActiveLang(
                                                                    idx,
                                                                )]:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        },
                                                    })
                                                }
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <Label className="text-xs">
                                            Body (
                                            {getActiveLang(idx).toUpperCase()})
                                        </Label>
                                        <RichTextEditor
                                            value={
                                                sec.body.content[
                                                    getActiveLang(idx)
                                                ]
                                            }
                                            onChange={(v) =>
                                                updateSection(idx, {
                                                    body: {
                                                        ...sec.body,
                                                        content: {
                                                            ...sec.body.content,
                                                            [getActiveLang(
                                                                idx,
                                                            )]: v,
                                                        },
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className="flex flex-col gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => moveSection(idx, -1)}
                                        disabled={idx === 0}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => moveSection(idx, 1)}
                                        disabled={idx === sections.length - 1}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeSection(idx)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </AdminLayout>
    );
}
