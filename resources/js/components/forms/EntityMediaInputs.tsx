import { useId } from 'react';
import { ImagePicker } from '@/components/ui/ImagePicker';
import { useLanguage } from '@/contexts/LanguageContext';

function normalizePreviewSrc(src: string): string {
    const trimmed = src.trim();

    if (trimmed === '') return '';
    if (/^(?:https?:|blob:|data:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;

    return `/${trimmed.replace(/^\/+/, '')}`;
}

interface EntityMediaInputsProps {
    values?: Record<string, unknown>;
    setField?: (key: string, value: unknown) => void;
    imageLabel?: string;
    galleryLabel?: string;
    showImage?: boolean;
    showGallery?: boolean;
    // Alternate / legacy props
    imagePath?: string;
    imageFile?: File | null;
    galleryPaths?: string[];
    galleryFiles?: File[];
    onImageChange?: (path: string, file: File | null) => void;
    onGalleryChange?: (paths: string[], files: File[]) => void;
}

export function EntityMediaInputs({
    values,
    setField,
    imageLabel = 'Main image',
    galleryLabel = 'Gallery',
    showImage = true,
    showGallery = true,
    // legacy/alternate props
    imagePath: propImagePath,
    imageFile: propImageFile,
    galleryPaths: propGalleryPaths,
    galleryFiles: propGalleryFiles,
    onImageChange,
    onGalleryChange,
}: EntityMediaInputsProps) {
    const { t } = useLanguage();
    const imageInputId = useId();
    const galleryInputId = useId();
    // normalize path strings for previewing images
    // values may be undefined when the form is initializing in some usages — guard with optional chaining
    const imagePath =
        typeof values?.imagePath === 'string'
            ? normalizePreviewSrc(values.imagePath as string)
            : normalizePreviewSrc(propImagePath ?? '');

    const imageFile =
        values?.imageFile instanceof File
            ? (values.imageFile as File)
            : (propImageFile ?? null);

    const galleryFiles = Array.isArray(values?.galleryFiles)
        ? (values.galleryFiles as unknown as File[])
        : Array.isArray(propGalleryFiles)
          ? propGalleryFiles
          : [];

    const galleryPathsFromValue = (
        currentValues?: Record<string, unknown>,
        fallbackPaths: string[] = [],
    ): string[] => {
        const current = Array.isArray(currentValues?.galleryPaths)
            ? (currentValues.galleryPaths as unknown[])
            : Array.isArray(currentValues?.gallery)
              ? (currentValues.gallery as unknown[])
              : Array.isArray(currentValues?.images)
                ? (currentValues.images as unknown[])
                : Array.isArray(fallbackPaths)
                  ? fallbackPaths
                  : [];

        return current
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean)
            .map(normalizePreviewSrc);
    };

    const setGalleryPaths = (nextPaths: string[]) => {
        if (typeof setField === 'function') {
            setField('galleryPaths', nextPaths);
            return;
        }

        if (typeof onGalleryChange === 'function') {
            onGalleryChange(nextPaths, galleryFiles);
        }
    };

    const setGalleryFiles = (nextFiles: File[]) => {
        if (typeof setField === 'function') {
            setField('galleryFiles', nextFiles);
            return;
        }

        if (typeof onGalleryChange === 'function') {
            onGalleryChange(
                galleryPathsFromValue(values, propGalleryPaths),
                nextFiles,
            );
        }
    };

    // doSetField: prefer setField if provided; otherwise call alternate onImageChange/onGalleryChange handlers when available
    const doSetField = (key: string, val: unknown) => {
        if (typeof setField === 'function') {
            setField(key, val);
            return;
        }

        if (key === 'imageFile' && typeof onImageChange === 'function') {
            onImageChange('', val as File | null);
            return;
        }

        if (key === 'imagePath' && typeof onImageChange === 'function') {
            onImageChange(String(val ?? ''), null);
            return;
        }

        if (key === 'galleryFiles' && typeof onGalleryChange === 'function') {
            onGalleryChange([], Array.isArray(val) ? (val as File[]) : []);
            return;
        }

        if (key === 'galleryPaths' && typeof onGalleryChange === 'function') {
            onGalleryChange(Array.isArray(val) ? (val as string[]) : [], []);
            return;
        }
    };

    const handleImageChange = (file: File | File[] | null) => {
        if (typeof setField === 'function') {
            doSetField('imageFile', file);
            doSetField('imagePath', '');
            return;
        }

        if (typeof onImageChange === 'function') {
            onImageChange('', Array.isArray(file) ? null : file);
        }
    };

    const handleGalleryChange = (files: File | File[] | null) => {
        if (!Array.isArray(files)) return;

        if (typeof setField === 'function') {
            doSetField('galleryFiles', [...galleryFiles, ...files]);
            return;
        }

        if (typeof onGalleryChange === 'function') {
            onGalleryChange(galleryPathsFromValue(values, propGalleryPaths), [
                ...galleryFiles,
                ...files,
            ]);
        }
    };

    return (
        <div className="space-y-4 border-t border-border pt-4">
            {showImage && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <label
                            htmlFor={imageInputId}
                            className="text-xs font-semibold text-muted-foreground"
                        >
                            {imageLabel}
                        </label>
                    </div>

                    <ImagePicker
                        id={imageInputId}
                        value={imageFile ?? imagePath}
                        onChange={handleImageChange}
                    />
                </div>
            )}

            {showGallery && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <label
                            htmlFor={galleryInputId}
                            className="text-xs font-semibold text-muted-foreground"
                        >
                            {galleryLabel}
                        </label>
                        <span className="text-xs text-muted-foreground">
                            {t('admin.addImagesHint')}
                        </span>
                    </div>

                    <ImagePicker
                        id={galleryInputId}
                        multiple
                        showPreview={false}
                        onChange={handleGalleryChange}
                    />

                    {/* Gallery preview: show accumulated gallery files and existing paths */}
                    {(galleryFiles.length > 0 ||
                        galleryPathsFromValue(values, propGalleryPaths).length >
                            0) && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                                {t('admin.selectedImages')} (
                                {galleryFiles.length +
                                    galleryPathsFromValue(
                                        values,
                                        propGalleryPaths,
                                    ).length}
                                )
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {galleryPathsFromValue(
                                    values,
                                    propGalleryPaths,
                                ).map((path, i) => (
                                    <div
                                        key={`existing-${i}`}
                                        className="relative h-20 w-20 flex-shrink-0"
                                    >
                                        <img
                                            src={path}
                                            alt="Gallery"
                                            className="h-full w-full rounded-lg border border-border object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-xs font-semibold text-white opacity-0 transition-opacity hover:opacity-100">
                                            <button
                                                type="button"
                                                aria-label={`Remove gallery image ${i + 1}`}
                                                onClick={() => {
                                                    const nextPaths =
                                                        galleryPathsFromValue(
                                                            values,
                                                            propGalleryPaths,
                                                        ).filter(
                                                            (_, index) =>
                                                                index !== i,
                                                        );
                                                    setGalleryPaths(nextPaths);
                                                }}
                                                className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-black"
                                            >
                                                ×
                                            </button>
                                            Existing
                                        </div>
                                    </div>
                                ))}

                                {galleryFiles.map((file, i) => (
                                    <div
                                        key={`new-${i}`}
                                        className="relative h-20 w-20 flex-shrink-0"
                                    >
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="Gallery"
                                            className="h-full w-full rounded-lg border border-border border-green-500 object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-xs font-semibold text-white opacity-0 transition-opacity hover:opacity-100">
                                            <button
                                                type="button"
                                                aria-label={`Remove new gallery image ${i + 1}`}
                                                onClick={() => {
                                                    const nextFiles =
                                                        galleryFiles.filter(
                                                            (_, index) =>
                                                                index !== i,
                                                        );
                                                    setGalleryFiles(nextFiles);
                                                }}
                                                className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-black"
                                            >
                                                ×
                                            </button>
                                            New
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default EntityMediaInputs;
