import { Save, Trash2 } from 'lucide-react';
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

    useEffect(() => {
        setVideoUrl(settings.landingVideo?.url ?? null);
        setVideoFile(null);
    }, [settings]);

    if (loading) {
        return (
            <AdminLayout title="Landing Video" subtitle={t('nav.settings')}>
                <Card className="p-4"><div className="h-48 animate-pulse rounded bg-muted/70" /></Card>
            </AdminLayout>
        );
    }

    const save = async () => {
        try {
            if (videoFile) {
                const formData = new FormData();
                formData.append('video', videoFile);
                formData.append('_method', 'PUT');
                await apiFetch('/api/site-settings', { method: 'POST', body: formData });
            } else if (!videoUrl && settings.landingVideo?.url) {
                const content = (settings.content as any) ?? {};
                await apiFetch('/api/site-settings', {
                    method: 'PUT',
                    body: JSON.stringify({ content: { ...content, landing_video: null } }),
                });
            }
            setVideoFile(null);
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        }
    };

    return (
        <AdminLayout
            title="Landing Video"
            subtitle="Video that appears as a modal when visitors open the homepage"
            actions={<Button size="sm" onClick={save}><Save className="mr-1 h-4 w-4" /> {t('admin.settings.save')}</Button>}
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
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove Video
                        </Button>
                    </div>
                )}
                {!videoUrl && (
                    <div className="space-y-2">
                        <Label htmlFor="landing-video-input">Upload Video</Label>
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
                        <p className="text-xs text-muted-foreground">Max 50MB. Formats: MP4, WebM, MOV.</p>
                    </div>
                )}
            </Card>
        </AdminLayout>
    );
}
