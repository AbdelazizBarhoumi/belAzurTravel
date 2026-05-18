import { Trash2, Plus, Image as ImageIcon, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { GalleryImage } from '@/api/gallery.api';
import {
    fetchGallery,
    createGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
} from '@/api/gallery.api';
import { PageShell } from '@/components/layout/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminGallery() {
    const { t } = useLanguage();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        loadGallery();
    }, []);

    async function loadGallery() {
        setLoading(true);
        try {
            const data = await fetchGallery();
            setImages(data);
        } finally {
            setLoading(false);
        }
    }

    async function addImage() {
        try {
            // Prompt the user to select a file, then upload immediately.
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                const form = new FormData();
                form.append('image', file);
                form.append('caption[en]', '');
                form.append('caption[fr]', '');
                form.append('caption[ar]', '');
                form.append('sort_order', String(images.length));

                const newItem = await createGalleryImage(form);
                setImages((prev) => [...prev, newItem]);
            };
            input.click();
        } catch (err) {
            console.error(err);
            setMessage('Failed to add image');
        }
    }

    async function saveImage(image: GalleryImage) {
        try {
            await updateGalleryImage(image.id, image);
            setMessage('Saved');
            setTimeout(() => setMessage(null), 2000);
        } catch {
            setMessage('Failed to save');
        }
    }

    async function removeImage(id: number) {
        if (!confirm('Are you sure?')) return;
        try {
            await deleteGalleryImage(id);
            setImages(images.filter((img) => img.id !== id));
        } catch {
            setMessage('Failed to delete');
        }
    }

    const updateImageData = (id: number, data: Partial<GalleryImage>) => {
        setImages(
            images.map((img) => (img.id === id ? { ...img, ...data } : img)),
        );
    };

    const updateCaption = (id: number, l: string, val: string) => {
        setImages(
            images.map((img) => {
                if (img.id === id) {
                    return {
                        ...img,
                        caption: { ...(img.caption || {}), [l]: val },
                    };
                }
                return img;
            }),
        );
    };

    return (
        <PageShell
            titleKey="nav.gallery"
            subtitleKey="gallery.subtitle"
            breadcrumbs={[
                { label: t('admin.home'), href: '/admin' },
                { label: t('nav.gallery'), active: true },
            ]}
        >
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 flex justify-between">
                    <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
                        <ImageIcon className="h-6 w-6 text-primary" />
                        Gallery Management
                    </h2>
                    <button
                        onClick={addImage}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                    >
                        <Plus className="h-5 w-5" /> Add New Image
                    </button>
                </div>

                {message && (
                    <div className="mb-4 rounded-md bg-primary/10 p-3 text-center text-sm font-medium text-primary">
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="py-20 text-center text-muted-foreground">
                        Loading gallery...
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {images.map((img) => (
                            <div
                                key={img.id}
                                className="group relative rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                            >
                                <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-muted">
                                    {img.url ? (
                                        <img
                                            src={img.url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-muted-foreground">
                                            Image
                                        </label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="rounded-md border px-3 py-2 text-sm"
                                                onClick={() => {
                                                    const input =
                                                        document.createElement(
                                                            'input',
                                                        );
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange =
                                                        async () => {
                                                            const file =
                                                                input
                                                                    .files?.[0];
                                                            if (!file) return;
                                                            const form =
                                                                new FormData();
                                                            form.append(
                                                                'image',
                                                                file,
                                                            );
                                                            // preserve existing captions and sort order
                                                            if (img.caption) {
                                                                Object.entries(
                                                                    img.caption,
                                                                ).forEach(
                                                                    ([
                                                                        k,
                                                                        v,
                                                                    ]) => {
                                                                        form.append(
                                                                            `caption[${k}]`,
                                                                            String(
                                                                                v,
                                                                            ),
                                                                        );
                                                                    },
                                                                );
                                                            }
                                                            form.append(
                                                                'sort_order',
                                                                String(
                                                                    img.sort_order ||
                                                                        0,
                                                                ),
                                                            );

                                                            try {
                                                                const updated =
                                                                    await updateGalleryImage(
                                                                        img.id,
                                                                        form as unknown as FormData,
                                                                    );
                                                                updateImageData(
                                                                    img.id,
                                                                    updated as Partial<GalleryImage>,
                                                                );
                                                                setMessage(
                                                                    'Image uploaded',
                                                                );
                                                                setTimeout(
                                                                    () =>
                                                                        setMessage(
                                                                            null,
                                                                        ),
                                                                    2000,
                                                                );
                                                            } catch (e) {
                                                                setMessage(
                                                                    'Failed to upload image',
                                                                );
                                                            }
                                                        };
                                                    input.click();
                                                }}
                                            >
                                                Replace / Upload Image
                                            </button>
                                            <span className="text-sm text-muted-foreground">
                                                {img.url
                                                    ? 'Uploaded'
                                                    : 'No image'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {['en', 'fr', 'ar'].map((l) => (
                                            <div key={l}>
                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                                                    Caption ({l})
                                                </label>
                                                <input
                                                    className="mt-0.5 w-full rounded-md border p-1.5 text-xs"
                                                    value={
                                                        img.caption?.[l] || ''
                                                    }
                                                    onChange={(e) =>
                                                        updateCaption(
                                                            img.id,
                                                            l,
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-muted-foreground">
                                                Order:
                                            </label>
                                            <input
                                                type="number"
                                                className="w-16 rounded-md border p-1 text-xs"
                                                value={img.sort_order}
                                                onChange={(e) =>
                                                    updateImageData(img.id, {
                                                        sort_order: parseInt(
                                                            e.target.value,
                                                        ),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveImage(img)}
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90"
                                                title="Save Changes"
                                            >
                                                <Save className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    removeImage(img.id)
                                                }
                                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-white"
                                                title="Delete Image"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageShell>
    );
}
