import { motion } from 'framer-motion';
import { PageShell } from '@/components/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';

const photos = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=1000&fit=crop',
    'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=900&fit=crop',
    'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=800&h=700&fit=crop',
];

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
                {photos.map((src, i) => (
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
