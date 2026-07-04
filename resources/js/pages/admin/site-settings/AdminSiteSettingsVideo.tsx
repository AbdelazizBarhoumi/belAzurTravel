import { Loader2, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function AdminSiteSettingsVideo() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setVideoUrl(settings.landingVideo?.url ?? null);
        setVideoFile(null);
    }, [settings]);

    if (loading) {
        return (
            <AdminLayout title={t('admin.settings.landingVideoTitle')} subtitle={t('nav.settings')}>
                <Card className="p-4"><div className="h-48 animate-pulse rounded bg-muted/70" /></Card>
            </AdminLayout>
        );
    }

    const save = async () => {
        setIsSaving(true);
        try {
            if (videoFile) {
                const formData = new FormData();
                formData.append('video', videoFile);
                formData.append('_method', 'PUT');
                const res = await apiFetch<{ content?: { landing_video?: { url: string } | null } }>(
                    '/api/site-settings',
                    { method: 'POST', body: formData },
                );
                const savedUrl = res?.content?.landing_video?.url ?? null;
                setVideoUrl(savedUrl);
            } else if (!videoUrl && settings.landingVideo?.url) {
                const content = (settings.content as any) ?? {};
                await apiFetch('/api/site-settings', {
                    method: 'PUT',
                    body: JSON.stringify({ content: { ...content, landing_video: null } }),
                });
                setVideoUrl(null);
            }
            setVideoFile(null);
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout
            title={t('admin.settings.landingVideoTitle')}
            subtitle={t('admin.settings.landingVideoSubtitle')}
            actions={<Button size="sm" onClick={save} disabled={isSaving}>{isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} {t('admin.settings.save')}</Button>}
        >
            <Card className="space-y-4 p-4">
                {videoUrl && (
                    <div className="space-y-2">
                        <video src={videoUrl} controls className="max-h-48 w-full rounded-lg" />
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { setVideoUrl(null); setVideoFile(null); }}
                        >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> {t('admin.settings.removeVideo')}
                        </Button>
                    </div>
                )}
                {!videoUrl && (
                    <div className="space-y-2">
                        <Label htmlFor="landing-video-input">{t('admin.settings.uploadVideo')}</Label>
                        <input
                            id="landing-video-input"
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                if (file) { setVideoFile(file); setVideoUrl(URL.createObjectURL(file)); }
                            }}
                        />
                        <p className="text-xs text-muted-foreground">{t('admin.settings.videoHint')}</p>
                    </div>
                )}
            </Card>
        </AdminLayout>
    );
}
