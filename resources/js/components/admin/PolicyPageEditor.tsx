import { Loader2, Save } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import {
    ContentLangSwitch,
    type ContentLang,
} from '@/components/admin/ContentLangSwitch';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { normalizeLegalBody, type LegalBodyFormat } from '@/lib/legal';

export interface PolicyData {
    title: Record<string, string>;
    body: { format: LegalBodyFormat; content: Record<string, string> };
}

interface PolicyPageEditorProps {
    /** Key under `site_settings.content`, e.g. `privacy_policy`. */
    contentKey: 'privacy_policy' | 'purchase_policy';
    defaultTitle: Record<string, string>;
    pageTitle: string;
    subtitle: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Shared editor for the single-page policies (privacy, purchase). Saves with
 * `contentPatch` so only this page's key is written server-side.
 */
export function PolicyPageEditor({
    contentKey,
    defaultTitle,
    pageTitle,
    subtitle,
}: PolicyPageEditorProps) {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();
    const empty: PolicyData = {
        title: defaultTitle,
        body: { format: 'markdown', content: { en: '', fr: '', ar: '' } },
    };
    const [data, setData] = useState<PolicyData>(empty);
    const [preview, setPreview] = useState<Record<string, boolean>>({});
    const [activeLang, setActiveLang] = useState<ContentLang>('fr');
    const [status, setStatus] = useState<SaveStatus>('idle');
    const autosaveTimerRef = useRef<number | null>(null);
    const lastSavedRef = useRef<string>('');
    const autosaveReadyRef = useRef(false);

    useEffect(() => {
        const stored = (settings.content as Record<string, unknown> | undefined)?.[
            contentKey
        ] as PolicyData | undefined;
        const next: PolicyData = stored
            ? {
                  title: { ...defaultTitle, ...(stored.title ?? {}) },
                  body: normalizeLegalBody(stored.body),
              }
            : empty;
        setData(next);
        lastSavedRef.current = JSON.stringify(next);
        autosaveReadyRef.current = !loading;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings, loading, contentKey]);

    const persist = async (payload: PolicyData) => {
        await apiFetch('/api/site-settings', {
            method: 'PUT',
            body: JSON.stringify({ contentPatch: { [contentKey]: payload } }),
        });
        lastSavedRef.current = JSON.stringify(payload);
    };

    useEffect(() => {
        if (!autosaveReadyRef.current) return;
        if (JSON.stringify(data) === lastSavedRef.current) return;
        setStatus('saving');
        if (autosaveTimerRef.current)
            window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = window.setTimeout(async () => {
            try {
                await persist(data);
                setStatus('saved');
                window.setTimeout(() => setStatus('idle'), 2000);
            } catch {
                setStatus('error');
            }
        }, 1200);
        return () => {
            if (autosaveTimerRef.current)
                window.clearTimeout(autosaveTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const save = async () => {
        if (autosaveTimerRef.current)
            window.clearTimeout(autosaveTimerRef.current);
        setStatus('saving');
        try {
            await persist(data);
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            setStatus('saved');
            window.setTimeout(() => setStatus('idle'), 2000);
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            setStatus('error');
            toast.error(t('admin.settings.saveError'));
        }
    };

    const setBody = (lang: ContentLang, value: string) =>
        setData((p) => ({
            ...p,
            body: { ...p.body, content: { ...p.body.content, [lang]: value } },
        }));

    if (loading) {
        return (
            <AdminLayout title={pageTitle} subtitle={t('nav.settings')}>
                <Card className="p-4">
                    <div className="h-64 animate-pulse rounded bg-muted/70" />
                </Card>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={pageTitle}
            subtitle={subtitle}
            actions={
                <SaveActions status={status} onSave={save} t={t} />
            }
        >
            <Card className="space-y-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <ContentLangSwitch
                        value={activeLang}
                        onChange={setActiveLang}
                        filled={{
                            fr: Boolean(data.body.content.fr?.trim()),
                            en: Boolean(data.body.content.en?.trim()),
                        }}
                    />
                    <div className="flex items-center gap-3">
                        <Label className="text-xs">
                            {t('admin.settings.body_format')}
                        </Label>
                        <Select
                            value={data.body.format}
                            onValueChange={(v) =>
                                setData((p) => ({
                                    ...p,
                                    body: {
                                        ...p.body,
                                        format: v as LegalBodyFormat,
                                    },
                                }))
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
                </div>

                <div>
                    <Label className="text-xs">
                        {t('admin.settings.title')} ({activeLang.toUpperCase()})
                    </Label>
                    <Input
                        value={data.title[activeLang] ?? ''}
                        onChange={(e) =>
                            setData((p) => ({
                                ...p,
                                title: { ...p.title, [activeLang]: e.target.value },
                            }))
                        }
                    />
                </div>

                {data.body.format === 'markdown' ? (
                    <div>
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">
                                {t('admin.settings.body')} (
                                {activeLang.toUpperCase()})
                            </Label>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                    setPreview((p) => ({
                                        ...p,
                                        [activeLang]: !p[activeLang],
                                    }))
                                }
                            >
                                {preview[activeLang]
                                    ? t('admin.settings.edit')
                                    : t('admin.settings.preview')}
                            </Button>
                        </div>
                        {preview[activeLang] ? (
                            <div className="mt-2 rounded-md border bg-background p-3">
                                <MarkdownRenderer
                                    content={data.body.content[activeLang]}
                                />
                            </div>
                        ) : (
                            <Textarea
                                className="mt-2 font-mono text-sm"
                                rows={24}
                                value={data.body.content[activeLang] ?? ''}
                                onChange={(e) =>
                                    setBody(activeLang, e.target.value)
                                }
                            />
                        )}
                    </div>
                ) : (
                    <div>
                        <Label className="text-xs">
                            {t('admin.settings.body')} ({activeLang.toUpperCase()})
                        </Label>
                        <RichTextEditor
                            key={activeLang}
                            value={data.body.content[activeLang] ?? ''}
                            onChange={(v) => setBody(activeLang, v)}
                        />
                    </div>
                )}
            </Card>
        </AdminLayout>
    );
}

/** Autosave status + explicit Save button, shared by the legal editors. */
export function SaveActions({
    status,
    onSave,
    t,
    children,
}: {
    status: SaveStatus;
    onSave: () => void;
    t: (key: string) => string;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-center gap-3">
            {status !== 'idle' && (
                <span
                    className={
                        status === 'error'
                            ? 'text-xs text-destructive'
                            : 'text-xs text-muted-foreground'
                    }
                >
                    {status === 'saving'
                        ? t('admin.settings.autosaving')
                        : status === 'saved'
                          ? t('admin.settings.saved')
                          : t('admin.settings.saveError')}
                </span>
            )}
            {children}
            <Button size="sm" onClick={onSave} disabled={status === 'saving'}>
                {status === 'saving' ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-1 h-4 w-4" />
                )}{' '}
                {t('admin.settings.save')}
            </Button>
        </div>
    );
}
