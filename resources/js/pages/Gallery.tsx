import { motion } from 'framer-motion';
import { PageShell } from '@/components/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { galleryPhotos } from '@/data/catalog';

const Gallery = () => {
    const { t } = useLanguage();

    return (
        <PageShell
            titleKey="gallery.title"
            subtitleKey="gallery.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.gallery'), active: true },
            ]}
        >
            <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
                {galleryPhotos.map((src, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="card-elevated group cursor-pointer break-inside-avoid overflow-hidden rounded-2xl"
                    >
                        <img
                            src={src}
                            alt={`Travel ${i}`}
                            loading="lazy"
                            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </motion.div>
                ))}
            </div>
        </PageShell>
    );
};

export default Gallery;
