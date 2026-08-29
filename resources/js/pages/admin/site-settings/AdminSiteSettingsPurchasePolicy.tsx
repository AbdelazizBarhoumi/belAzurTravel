import { Loader2, Save } from 'lucide-react';
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

interface PolicyData {
    title: Record<string, string>;
    body: { format: LegalBodyFormat; content: Record<string, string> };
}

const EMPTY: PolicyData = {
    title: {
        en: 'Purchase Policy',
        fr: "Politique d'achat",
        ar: 'سياسة الشراء',
    },
    body: { format: 'markdown', content: { en: '', fr: '', ar: '' } },
};

export default function AdminSiteSettingsPurchasePolicy() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();
    const [data, setData] = useState<PolicyData>(EMPTY);
    const [preview, setPreview] = useState<Record<string, boolean>>({});
    const [activeLang, setActiveLang] = useState<'en' | 'fr' | 'ar'>('fr');
    const [autosaveStatus, setAutosaveStatus] = useState<
        'idle' | 'saving' | 'saved' | 'error'
    >('idle');
    const [isSaving, setIsSaving] = useState(false);
    const autosaveTimerRef = useRef<number | null>(null);
    const lastSavedRef = useRef<string>('');
    const autosaveReadyRef = useRef(false);

    useEffect(() => {
        const content = settings.content as any;
        const stored = content?.purchase_policy as PolicyData | undefined;
        if (stored) {
            const body = normalizeLegalBody(stored.body);
            setData({
                title: stored.title || EMPTY.title,
                body,
            });
            lastSavedRef.current = JSON.stringify({
                title: stored.title || EMPTY.title,
                body,
            });
        }
        autosaveReadyRef.current = true;
    }, [settings]);

    useEffect(() => {
        if (!autosaveReadyRef.current) return;
        const snapshot = JSON.stringify(data);
        if (snapshot === lastSavedRef.current) return;
        setAutosaveStatus('saving');
        if (autosaveTimerRef.current)
            window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = window.setTimeout(async () => {
            try {
                const content = (settings.content as any) ?? {};
                await apiFetch('/api/site-settings', {
                    method: 'PUT',
                    body: JSON.stringify({
                        content: { ...content, purchase_policy: data },
                    }),
                });
                lastSavedRef.current = JSON.stringify(data);
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
    }, [data, settings.content]);

    const save = async () => {
        setIsSaving(true);
        try {
            const content = (settings.content as any) ?? {};
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({
                    content: { ...content, purchase_policy: data },
                }),
            });
            lastSavedRef.current = JSON.stringify(data);
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
                title={t('nav.purchase-policy')}
                subtitle={t('nav.settings')}
            >
                <Card className="p-4">
                    <div className="h-64 animate-pulse rounded bg-muted/70" />
                </Card>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={t('nav.purchase-policy')}
            subtitle="Dedicated purchase policy page content"
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
                    <Button size="sm" onClick={save} disabled={isSaving}>
                        {isSaving ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-1 h-4 w-4" />
                        )}{' '}
                        {t('admin.settings.save')}
                    </Button>
                </div>
            }
        >
            <Card className="space-y-4 p-4">
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <Label className="text-xs">
                            {t('admin.settings.title_fr')}
                        </Label>
                        <Input
                            value={data.title.fr}
                            onChange={(e) =>
                                setData((p) => ({
                                    ...p,
                                    title: { ...p.title, fr: e.target.value },
                                }))
                            }
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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

                {data.body.format === 'markdown' ? (
                    <div>
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">
                                {t('admin.settings.body')}
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
                                className="mt-2"
                                rows={20}
                                value={data.body.content[activeLang]}
                                onChange={(e) =>
                                    setData((p) => ({
                                        ...p,
                                        body: {
                                            ...p.body,
                                            content: {
                                                ...p.body.content,
                                                [activeLang]: e.target.value,
                                            },
                                        },
                                    }))
                                }
                            />
                        )}
                    </div>
                ) : (
                    <div>
                        <Label className="text-xs">
                            {t('admin.settings.body')}
                        </Label>
                        <RichTextEditor
                            value={data.body.content[activeLang]}
                            onChange={(v) =>
                                setData((p) => ({
                                    ...p,
                                    body: {
                                        ...p.body,
                                        content: {
                                            ...p.body.content,
                                            [activeLang]: v,
                                        },
                                    },
                                }))
                            }
                        />
                    </div>
                )}
            </Card>
        </AdminLayout>
    );
}
