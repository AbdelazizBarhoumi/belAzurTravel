import { useEffect, useMemo, type ChangeEvent } from 'react';
import { CardMedia } from '@/components/ui/CardMedia';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

export function EntityMediaInputs({
    values,
    setField,
    imageLabel = 'Main image',
    galleryLabel = 'Gallery',
    showImage = true,
    showGallery = true,
}: EntityMediaInputsProps) {
    const imagePath = typeof values.imagePath === 'string' ? values.imagePath : '';
    const imageFile = values.imageFile instanceof File ? values.imageFile : null;

    const galleryPaths = toStringArray(values.galleryPaths ?? values.gallery);
    const galleryFiles = toFileArray(values.galleryFiles);

    const imagePreview = useMemo(() => {
        if (imageFile) {
            return URL.createObjectURL(imageFile);
        }

        return imagePath;
    }, [imageFile, imagePath]);

    useEffect(() => {
        if (!imageFile || !imagePreview) {
            return;
        }

        return () => {
            URL.revokeObjectURL(imagePreview);
        };
    }, [imageFile, imagePreview]);

    const galleryFileUrls = useMemo(
        () => galleryFiles.map((file) => URL.createObjectURL(file)),
        [galleryFiles],
    );

    useEffect(() => {
        return () => {
            galleryFileUrls.forEach((url) => URL.revokeObjectURL(url));
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

    return (
        <div className="space-y-4 border-t border-border pt-4">
            {showImage ? (
                <div className="space-y-3">
                    <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
                        <CardMedia
                            src={imagePreview || undefined}
                            alt="Media preview"
                            wrapperClass="aspect-[16/10]"
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
                        <Label htmlFor="entity-gallery-files">{galleryLabel}</Label>
                        <span className="text-xs text-muted-foreground">
                            Add one or more images from your device.
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
                            {galleryPreview.map((src) => (
                                <div
                                    key={src}
                                    className="overflow-hidden rounded-2xl border border-border bg-muted/30"
                                >
                                    <CardMedia src={src} alt="Gallery preview" wrapperClass="aspect-square" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No gallery images yet.</p>
                    )}
                </div>
            ) : null}
        </div>
    );
}

export default EntityMediaInputs;
