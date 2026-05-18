import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { fetchGallery, type GalleryImage } from '@/api/gallery.api';
import { PageShell } from '@/components/layout/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';

const Gallery = () => {
    const { t } = useLanguage();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGallery();
    }, []);

    async function loadGallery() {
        try {
            const data = await fetchGallery();
            setImages(data);
        } finally {
            setLoading(false);
        }
    }

    return (
        <PageShell
            title={t('gallery.title')}
            subtitle={t('gallery.subtitle')}
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.gallery'), active: true },
            ]}
        >
            {loading ? (
                <div className="py-20 text-center text-muted-foreground">
                    Loading gallery...
                </div>
            ) : images.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                    No images yet
                </div>
            ) : (
                <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                    {images.map((img: GalleryImage, i: number) => (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="card-elevated group mb-4 cursor-pointer break-inside-avoid overflow-hidden rounded-2xl"
                        >
                            <img
                                src={img.url}
                                alt={img.caption?.en || `Travel ${i}`}
                                loading="lazy"
                                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </PageShell>
    );
};

export default Gallery;
