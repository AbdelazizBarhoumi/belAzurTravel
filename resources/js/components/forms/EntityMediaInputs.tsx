import { useEffect, useMemo, type ChangeEvent } from 'react';
import { CardMedia } from '@/components/ui/CardMedia';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface EntityMediaInputsProps {
    values: Record<string, unknown>;
    setField: (key: string, value: unknown) => void;
    imageLabel?: string;
    galleryLabel?: string;
    showImage?: boolean;
    showGallery?: boolean;
}

function toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
    }

    if (typeof value === 'string') {
        return value
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function toFileArray(value: unknown): File[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is File => item instanceof File);
}

function createObjectUrl(file: File): string {
    if (typeof URL.createObjectURL !== 'function') {
        return '';
    }

    return URL.createObjectURL(file);
}

function revokeObjectUrl(url: string) {
    if (typeof URL.revokeObjectURL !== 'function' || !url) {
        return;
    }

    URL.revokeObjectURL(url);
}

export function EntityMediaInputs({
    values,
    setField,
    imageLabel = 'Main image',
    galleryLabel = 'Gallery',
    showImage = true,
    showGallery = true,
}: EntityMediaInputsProps) {
    const { t, dir } = useLanguage();
    const imagePath =
        typeof values.imagePath === 'string' ? values.imagePath : '';
    const imageFile =
        values.imageFile instanceof File ? values.imageFile : null;

    const galleryPaths = toStringArray(values.galleryPaths ?? values.gallery);
    const galleryFiles = toFileArray(values.galleryFiles);

    const imagePreview = useMemo(() => {
        if (imageFile) {
            return createObjectUrl(imageFile);
        }

        return imagePath;
    }, [imageFile, imagePath]);

    useEffect(() => {
        if (!imageFile || !imagePreview) {
            return;
        }

        return () => {
            revokeObjectUrl(imagePreview);
        };
    }, [imageFile, imagePreview]);

    const galleryFileUrls = useMemo(
        () => galleryFiles.map((file) => createObjectUrl(file)).filter(Boolean),
        [galleryFiles],
    );

    useEffect(() => {
        return () => {
            galleryFileUrls.forEach((url) => revokeObjectUrl(url));
        };
    }, [galleryFileUrls]);

    const galleryPreview = [...galleryPaths, ...galleryFileUrls];

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setField('imageFile', file);

        if (file) {
            setField('imagePath', '');
        }
    };

    const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);

        if (files.length > 0) {
            setField('galleryFiles', [...galleryFiles, ...files]);
        }

        event.target.value = '';
    };

    const removeGalleryPath = (path: string) => {
        setField(
            'galleryPaths',
            galleryPaths.filter((p) => p !== path),
        );
        // Also update 'gallery' if it's being used as the primary source
        if (values.gallery) {
            const currentGallery = toStringArray(values.gallery);
            setField(
                'gallery',
                currentGallery.filter((p) => p !== path),
            );
        }
    };

    const removeGalleryFile = (index: number) => {
        const newFiles = [...galleryFiles];
        newFiles.splice(index, 1);
        setField('galleryFiles', newFiles);
    };

    return (
        <div className="space-y-4 border-t border-border pt-4">
            {showImage ? (
                <div className="space-y-3">
                    <div
                        className={`max-w-[220px] overflow-hidden rounded-2xl border border-border bg-muted/30 ${
                            dir === 'rtl' ? 'ml-auto' : 'mr-auto'
                        }`}
                    >
                        <CardMedia
                            src={imagePreview || undefined}
                            alt="Media preview"
                            wrapperClass="aspect-square"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="entity-image-file">{imageLabel}</Label>
                        <Input
                            id="entity-image-file"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>
            ) : null}

            {showGallery ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="entity-gallery-files">
                            {galleryLabel}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                            {t('admin.addImagesHint')}
                        </span>
                    </div>

                    <Input
                        id="entity-gallery-files"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryChange}
                    />

                    {galleryPreview.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {galleryPaths.map((src) => (
                                <div
                                    key={src}
                                    className="group relative overflow-hidden rounded-2xl border border-border bg-muted/30"
                                >
                                    <CardMedia
                                        src={src}
                                        alt="Gallery preview"
                                        wrapperClass="aspect-square"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryPath(src)}
                                        className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M18 6 6 18" />
                                            <path d="m6 6 12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            {galleryFileUrls.map((src, idx) => (
                                <div
                                    key={`file-${idx}`}
                                    className="group relative overflow-hidden rounded-2xl border border-border bg-muted/30"
                                >
                                    <CardMedia
                                        src={src}
                                        alt="New upload preview"
                                        wrapperClass="aspect-square"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryFile(idx)}
                                        className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M18 6 6 18" />
                                            <path d="m6 6 12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {t('admin.noGalleryImages')}
                        </p>
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default EntityMediaInputs;
