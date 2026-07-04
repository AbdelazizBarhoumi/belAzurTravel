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
import { Plus, Trash2, GripVertical, ImagePlus } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/api/http';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PageHeroSlide } from '@/api/siteSettings.api';

interface HeroImagesManagerProps {
    pageKey: string;
    slides: PageHeroSlide[];
    onSlidesChange: (slides: PageHeroSlide[]) => void;
    interval?: number;
    onIntervalChange?: (ms: number) => void;
}

function SortableSlide({
    slide,
    index,
    onChange,
    onRemove,
}: {
    slide: PageHeroSlide;
    index: number;
    onChange: (updated: PageHeroSlide) => void;
    onRemove: () => void;
}) {
    const { lang, t } = useLanguage();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `slide-${index}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'heroes');
        try {
            const data = await apiFetch<{ url: string }>(
                '/api/admin/upload',
                { method: 'POST', body: formData },
            );
            onChange({ ...slide, url: data.url });
        } catch {
            toast.error(t('admin.heroUploadFailed'));
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex gap-3 rounded-lg border border-border bg-card p-3"
        >
            <button
                type="button"
                className="flex flex-shrink-0 cursor-grab items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-shrink-0">
                {slide.url ? (
                    <div className="relative h-20 w-32 overflow-hidden rounded-lg">
                        <img
                            src={slide.url}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => onChange({ ...slide, url: '' })}
                            className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <label className="flex h-20 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary">
                        <ImagePlus className="mb-1 h-5 w-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                            {t('admin.heroUpload')}
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>
                )}
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="grid gap-1.5">
                    <Label className="text-[10px] text-muted-foreground">
                        {t('admin.heroTitle').replace('{lang}', lang.toUpperCase())}
                    </Label>
                    <Input
                        value={slide.title?.[lang] ?? ''}
                        onChange={(e) =>
                            onChange({
                                ...slide,
                                title: {
                                    ...slide.title,
                                    [lang]: e.target.value,
                                },
                            })
                        }
                        placeholder={t('admin.heroTitle').replace('{lang}', lang.toUpperCase())}
                        className="h-8 text-xs"
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-[10px] text-muted-foreground">
                        {t('admin.heroSubtitle').replace('{lang}', lang.toUpperCase())}
                    </Label>
                    <Input
                        value={slide.subtitle?.[lang] ?? ''}
                        onChange={(e) =>
                            onChange({
                                ...slide,
                                subtitle: {
                                    ...slide.subtitle,
                                    [lang]: e.target.value,
                                },
                            })
                        }
                        placeholder={t('admin.heroSubtitle').replace('{lang}', lang.toUpperCase())}
                        className="h-8 text-xs"
                    />
                </div>
            </div>

            <button
                type="button"
                onClick={onRemove}
                className="self-start text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}

export function HeroImagesManager({
    pageKey,
    slides,
    onSlidesChange,
    interval = 6000,
    onIntervalChange,
}: HeroImagesManagerProps) {
    const { t } = useLanguage();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = Number(
                String(active.id).replace('slide-', ''),
            );
            const newIndex = Number(String(over.id).replace('slide-', ''));

            onSlidesChange(arrayMove(slides, oldIndex, newIndex));
        },
        [slides, onSlidesChange],
    );

    const addSlide = () => {
        onSlidesChange([
            ...slides,
            {
                url: '',
                title: { en: '', fr: '', ar: '' },
                subtitle: { en: '', fr: '', ar: '' },
            },
        ]);
    };

    const updateSlide = (index: number, updated: PageHeroSlide) => {
        const next = [...slides];
        next[index] = updated;
        onSlidesChange(next);
    };

    const removeSlide = (index: number) => {
        onSlidesChange(slides.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {slides.length > 0
                        ? t('admin.heroImagesCount').replace('{count}', String(slides.length))
                        : t('admin.noHeroImages')}
                </p>
                {onIntervalChange && (
                    <div className="flex items-center gap-1.5">
                        <Label className="text-[10px] text-muted-foreground">
                            {t('admin.heroInterval')}
                        </Label>
                        <Input
                            type="number"
                            min={2000}
                            step={1000}
                            value={interval}
                            onChange={(e) =>
                                onIntervalChange(
                                    Number(e.target.value) || 6000,
                                )
                            }
                            className="h-7 w-20 text-xs"
                        />
                    </div>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={slides.map((_, i) => `slide-${i}`)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {slides.map((slide, i) => (
                            <SortableSlide
                                key={i}
                                slide={slide}
                                index={i}
                                onChange={(updated) => updateSlide(i, updated)}
                                onRemove={() => removeSlide(i)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Button
                variant="outline"
                size="sm"
                onClick={addSlide}
                className="w-full"
            >
                <Plus className="mr-1 h-3.5 w-3.5" /> {t('admin.heroAddImage')}
            </Button>
        </div>
    );
}
