import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { PageHeroSlide } from '@/api/siteSettings.api';

export default function AdminSiteSettingsHeroImages() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();

    const existingHeroConfig = settings.content?.page_heroes?.home;
    const [heroSlides, setHeroSlides] = useState<PageHeroSlide[]>([]);
    const [heroInterval, setHeroInterval] = useState(6000);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setHeroSlides(existingHeroConfig?.images ?? []);
        setHeroInterval(existingHeroConfig?.interval ?? 6000);
    }, [existingHeroConfig]);

    const saveHeroImages = useCallback(async () => {
        setIsSaving(true);
        try {
            const filteredSlides = heroSlides.filter((s) => s.url);
            const content = {
                ...(settings.content ?? {}),
                page_heroes: {
                    ...(settings.content?.page_heroes ?? {}),
                    home: {
                        images: filteredSlides,
                        interval: heroInterval,
                    },
                },
            };
            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({ content }),
            });
            window.dispatchEvent(new CustomEvent('site-settings-updated'));
            toast.success(t('admin.settings.saveSuccess'));
        } catch {
            toast.error(t('admin.settings.saveError'));
        } finally {
            setIsSaving(false);
        }
    }, [heroSlides, heroInterval, settings.content, t]);

    if (loading) {
        return (
            <AdminLayout
                title={t('admin.settings.landingHeroTitle')}
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
            title={t('admin.settings.landingHeroTitle')}
            subtitle={t('admin.settings.landingHeroSubtitle')}
            actions={
                <Button size="sm" onClick={saveHeroImages} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-1 h-4 w-4" />
                    )}{' '}
                    {t('admin.settings.save')}
                </Button>
            }
        >
            <Card className="p-5">
                <div className="mb-4 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                        {t('admin.heroImages')}
                    </h3>
                </div>
                <HeroImagesManager
                    pageKey="home"
                    slides={heroSlides}
                    onSlidesChange={setHeroSlides}
                    interval={heroInterval}
                    onIntervalChange={setHeroInterval}
                />
            </Card>
        </AdminLayout>
    );
}
