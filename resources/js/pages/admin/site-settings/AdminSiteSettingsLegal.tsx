import {
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { SaveActions } from '@/components/admin/PolicyPageEditor';
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

/** The site publishes legal content in French only for now. */
const CONTENT_LANG = 'fr';

export default function AdminSiteSettingsLegal() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();
    const [sections, setSections] = useState<LegalSectionDraft[]>([]);
    const [markdownPreview, setMarkdownPreview] = useState<
        Record<string, boolean>
    >({});
    const [autosaveStatus, setAutosaveStatus] = useState<
        'idle' | 'saving' | 'saved' | 'error'
    >('idle');
    const autosaveTimerRef = useRef<number | null>(null);
    const lastSavedRef = useRef<string>('');
    const autosaveReadyRef = useRef(false);

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
        autosaveReadyRef.current = !loading;
    }, [settings, loading]);

    useEffect(() => {
        if (!autosaveReadyRef.current) return;
        const snapshot = JSON.stringify(buildPayload());
        if (snapshot === lastSavedRef.current) return;
        setAutosaveStatus('saving');
        if (autosaveTimerRef.current)
            window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = window.setTimeout(async () => {
            try {
                await persist();
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

    const persist = async () => {
        const payload = buildPayload();
        await apiFetch('/api/site-settings', {
            method: 'PUT',
            body: JSON.stringify({ legalSections: payload }),
        });
        lastSavedRef.current = JSON.stringify(payload);
    };

    const save = async () => {
        if (autosaveTimerRef.current)
            window.clearTimeout(autosaveTimerRef.current);
        setAutosaveStatus('saving');
        try {
            await persist();
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            setAutosaveStatus('saved');
            window.setTimeout(() => setAutosaveStatus('idle'), 2000);
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            setAutosaveStatus('error');
            toast.error(t('admin.settings.saveError'));
        }
    };

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
                <SaveActions status={autosaveStatus} onSave={save} t={t}>
                    <Button size="sm" variant="outline" onClick={addSection}>
                        <Plus className="mr-1 h-4 w-4" />{' '}
                        {t('admin.settings.add_section')}
                    </Button>
                </SaveActions>
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
                                <div className="grid grid-cols-1 gap-2">
                                    <div>
                                        <Label className="text-xs">
                                            {t('admin.settings.title_fr')}
                                        </Label>
                                        <Input
                                            value={
                                                sec.title[CONTENT_LANG] ?? ''
                                            }
                                            onChange={(e) =>
                                                updateSection(idx, {
                                                    title: {
                                                        ...sec.title,
                                                        [CONTENT_LANG]:
                                                            e.target.value,
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

                                {sec.body.format === 'markdown' ? (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">
                                                {t('admin.settings.body')}
                                            </Label>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setMarkdownPreview((p) => ({
                                                        ...p,
                                                        [idx]: !p[idx],
                                                    }))
                                                }
                                            >
                                                {markdownPreview[idx]
                                                    ? t('admin.settings.edit')
                                                    : t(
                                                          'admin.settings.preview',
                                                      )}
                                            </Button>
                                        </div>
                                        {markdownPreview[idx] ? (
                                            <div className="rounded-md border bg-background p-3">
                                                <MarkdownRenderer
                                                    content={
                                                        sec.body.content[
                                                            CONTENT_LANG
                                                        ]
                                                    }
                                                />
                                            </div>
                                        ) : (
                                            <Textarea
                                                value={
                                                    sec.body.content[
                                                        CONTENT_LANG
                                                    ]
                                                }
                                                onChange={(e) =>
                                                    updateSection(idx, {
                                                        body: {
                                                            ...sec.body,
                                                            content: {
                                                                ...sec.body
                                                                    .content,
                                                                [CONTENT_LANG]:
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
                                            {t('admin.settings.body')}
                                        </Label>
                                        <RichTextEditor
                                            key={idx}
                                            value={
                                                sec.body.content[CONTENT_LANG]
                                            }
                                            onChange={(v) =>
                                                updateSection(idx, {
                                                    body: {
                                                        ...sec.body,
                                                        content: {
                                                            ...sec.body.content,
                                                            [CONTENT_LANG]: v,
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
