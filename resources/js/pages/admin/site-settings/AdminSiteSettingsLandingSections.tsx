import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Loader2, Save, GripVertical, ChevronDown, ChevronUp, Eye, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { HeroImagesManager } from '@/components/admin/HeroImagesManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { LandingSectionConfig, PageHeroSlide } from '@/api/siteSettings.api';
import {
    LANDING_SECTION_META as SECTION_META,
    LANDING_SECTION_ORDER,
    buildLandingSectionDefaults,
    normalizeLandingSections,
} from '@/lib/landingSections';

function SortableSection({
    sectionKey,
    config,
    onToggle,
    onUpdate,
    expanded,
    onExpandToggle,
}: {
    sectionKey: string;
    config: LandingSectionConfig;
    onToggle: (key: string) => void;
    onUpdate: (key: string, patch: Partial<LandingSectionConfig>) => void;
    expanded: boolean;
    onExpandToggle: (key: string) => void;
}) {
    const { lang, t } = useLanguage();
    const meta = SECTION_META[sectionKey] ?? { labelKey: sectionKey, styles: ['grid'] };
    const sectionLabel = t(meta.labelKey);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionKey });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 p-4">
                <button type="button" className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing" {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4" />
                </button>

                <Switch checked={config.enabled} onCheckedChange={() => onToggle(sectionKey)} />

                <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground">{sectionLabel}</span>
                    {!config.enabled && (
                        <span className="ml-2 text-xs text-muted-foreground">{t('admin.settings.disabled')}</span>
                    )}
                </div>

                {config.enabled && meta.styles.length > 1 && (
                    <Select value={config.style ?? meta.styles[0]} onValueChange={(v) => onUpdate(sectionKey, { style: v })}>
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {meta.styles.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <button type="button" onClick={() => onExpandToggle(sectionKey)} className="text-muted-foreground hover:text-foreground">
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
            </div>

            {expanded && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">{t('admin.settings.titleLang').replace('{lang}', lang.toUpperCase())}</Label>
                            <Input
                                value={config.title?.[lang] ?? ''}
                                onChange={(e) => onUpdate(sectionKey, { title: { ...config.title, [lang]: e.target.value, en: config.title?.en ?? '', fr: config.title?.fr ?? '', ar: config.title?.ar ?? '' } })}
                                placeholder={`${sectionLabel} ${t('admin.settings.titleLang').replace('{lang}', '').trim()}`}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">{t('admin.settings.subtitleLang').replace('{lang}', lang.toUpperCase())}</Label>
                            <Input
                                value={config.subtitle?.[lang] ?? ''}
                                onChange={(e) => onUpdate(sectionKey, { subtitle: { ...config.subtitle, [lang]: e.target.value, en: config.subtitle?.en ?? '', fr: config.subtitle?.fr ?? '', ar: config.subtitle?.ar ?? '' } })}
                                placeholder={`${sectionLabel} ${t('admin.settings.subtitleLang').replace('{lang}', '').trim()}`}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminSiteSettingsLandingSections() {
    const { settings, loading } = useSiteSettings();
    const { t } = useLanguage();

    // Sections state
    const [order, setOrder] = useState<string[]>([...LANDING_SECTION_ORDER]);
    const [sections, setSections] = useState<Record<string, LandingSectionConfig>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    // Video state
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // Hero state
    const [heroSlides, setHeroSlides] = useState<PageHeroSlide[]>([]);
    const [heroInterval, setHeroInterval] = useState(6000);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (loading) return;

        // Load sections
        const existing = settings.content?.landing_sections;
        if (existing) {
            const normalized = normalizeLandingSections(existing);
            setOrder(normalized.order);
            setSections(normalized.sections);
        } else {
            setOrder([...LANDING_SECTION_ORDER]);
            setSections(buildLandingSectionDefaults());
        }

        // Load video
        setVideoUrl(settings.landingVideo?.url ?? null);
        setVideoFile(null);

        // Load hero
        const existingHeroConfig = settings.content?.page_heroes?.home;
        setHeroSlides(existingHeroConfig?.images ?? []);
        setHeroInterval(existingHeroConfig?.interval ?? 6000);
    }, [settings, loading]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setOrder((prev) => arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string)));
    }, []);

    const toggleSection = (key: string) => {
        setSections((prev) => ({
            ...prev,
            [key]: { ...prev[key], enabled: !(prev[key]?.enabled ?? true), style: prev[key]?.style ?? SECTION_META[key]?.styles[0] ?? 'grid' },
        }));
    };

    const updateSection = (key: string, patch: Partial<LandingSectionConfig>) => {
        setSections((prev) => ({
            ...prev,
            [key]: { ...prev[key], ...patch, enabled: prev[key]?.enabled ?? true },
        }));
    };

    const toggleExpand = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const saveAll = async () => {
        setIsSaving(true);
        try {
            // Determine the video URL to persist (may change if uploading a new file)
            let savedVideoUrl = settings.landingVideo?.url ?? null;

            // Save video
            if (videoFile) {
                const formData = new FormData();
                formData.append('video', videoFile);
                formData.append('_method', 'PUT');
                const res = await apiFetch<{ content?: { landing_video?: { url: string } | null } }>(
                    '/api/site-settings',
                    { method: 'POST', body: formData },
                );
                // Grab the URL from the response so the next save doesn't overwrite it
                savedVideoUrl = res?.content?.landing_video?.url ?? savedVideoUrl;
            } else if (!videoUrl && settings.landingVideo?.url) {
                savedVideoUrl = null;
            }

            // Build the full content to save in one shot (hero + sections + video)
            const filteredSlides = heroSlides.filter((s) => s.url);
            const normalizedLandingSections = normalizeLandingSections({ order, sections });
            const content: Record<string, any> = {
                ...(settings.content ?? {}),
                page_heroes: {
                    ...(settings.content?.page_heroes ?? {}),
                    home: {
                        images: filteredSlides,
                        interval: heroInterval,
                    },
                },
                landing_sections: normalizedLandingSections,
                landing_video: savedVideoUrl ? { url: savedVideoUrl } : null,
            };

            await apiFetch('/api/site-settings', {
                method: 'PUT',
                body: JSON.stringify({ content }),
            });

            setVideoFile(null);
            setVideoUrl(savedVideoUrl);
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
            <AdminLayout title={t('admin.settings.landingSectionsTitle')} subtitle={t('nav.settings')}>
                <Card className="p-4"><div className="h-48 animate-pulse rounded bg-muted/70" /></Card>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={t('admin.settings.landingSectionsTitle')}
            subtitle={t('admin.settings.landingSectionsSubtitle')}
            actions={
                <Button size="sm" onClick={saveAll} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} {t('admin.settings.save')}
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Landing Hero Section */}
                <Card className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                            {t('admin.settings.landingHeroTitle')}
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

                {/* Landing Video Section */}
                <Card className="space-y-4 p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                            {t('admin.settings.landingVideoTitle')}
                        </h3>
                    </div>
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

                {/* Landing Sections */}
                <Card className="p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" /> {t('admin.settings.landingSectionsHint')}
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={order} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {order.map((key) => {
                                    const config = sections[key] ?? { enabled: false };
                                    return (
                                        <SortableSection
                                            key={key}
                                            sectionKey={key}
                                            config={config}
                                            onToggle={toggleSection}
                                            onUpdate={updateSection}
                                            expanded={!!expanded[key]}
                                            onExpandToggle={toggleExpand}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </Card>
            </div>
        </AdminLayout>
    );
}
