import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGallery, type GalleryImage } from '@/api/gallery.api';
import { fetchPartners, type PartnerItem } from '@/api/partners.api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageExposed } from '@/lib/pageVisibility';

const FALLBACK_GALLERY = [
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop',
];

// Pixels per second.
// Higher = faster.
// Lower = slower.
const MARQUEE_SPEED = 45;

export const MarqueeShowcase = () => {
    const { t } = useLanguage();
    const { settings } = useSiteSettings();

    const navSettings = settings.content?.nav?.settings;

    const showGallery = isPageExposed('gallery', navSettings);
    const showPartners = isPageExposed('partners', navSettings);

    const { data: galleryData } = useQuery<GalleryImage[]>({
        queryKey: ['gallery'],
        queryFn: fetchGallery,
        staleTime: 5 * 60 * 1000,
    });

    const { data: partnersData } = useQuery<PartnerItem[]>({
        queryKey: ['partners'],
        queryFn: fetchPartners,
        staleTime: 5 * 60 * 1000,
    });

    if (!showGallery && !showPartners) {
        return null;
    }

    const galleryImages =
        galleryData && galleryData.length > 0
            ? galleryData.map((g) => g.url)
            : FALLBACK_GALLERY;

    const partners =
        partnersData && partnersData.length > 0
            ? partnersData
            : [];

    return (
        <section className="py-20 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
            {showGallery && (
                <>
                    <div className="container mx-auto px-4 mb-12 text-center">
                        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3">
                            {t('home.showcase.title')}
                        </h2>

                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            {t('home.showcase.subtitle')}
                        </p>
                    </div>

                    <Marquee
                        direction="left"
                        speed={MARQUEE_SPEED}
                    >
                        {galleryImages.map((src, i) => (
                            <div
                                key={`gallery-${i}`}
                                className="relative h-56 w-80 shrink-0 overflow-hidden rounded-2xl shadow-lg group"
                            >
                                <img
                                    src={src}
                                    alt={`Gallery ${i + 1}`}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </Marquee>
                </>
            )}

            {showPartners && partners.length > 0 && (
                <>
                    <div className="container mx-auto px-4 mb-8 text-center">
                        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-muted-foreground">
                            {t('home.showcase.partners')}
                        </h3>
                    </div>

                    <Marquee
                        direction="right"
                        speed={MARQUEE_SPEED}
                    >
                        {partners.map((p, i) => (
                            <div
                                key={`partner-${i}`}
                                className="relative h-56 w-80 shrink-0 flex items-center justify-center group"
                            >
                                <img
                                    src={p.logo}
                                    alt={
                                        typeof p.name === 'string'
                                            ? p.name
                                            : p.name?.en ?? ''
                                    }
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </Marquee>
                </>
            )}
        </section>
    );
};

type MarqueeProps = {
    children: React.ReactNode;
    direction: 'left' | 'right';
    speed: number;
};

const Marquee = ({
    children,
    direction,
    speed,
}: MarqueeProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [duration, setDuration] = useState(40);

    useEffect(() => {
        const calculateDuration = () => {
            if (!trackRef.current) {
                return;
            }

            const contentWidth = trackRef.current.scrollWidth / 2;

            if (contentWidth <= 0) {
                return;
            }

            const calculatedDuration = contentWidth / speed;

            setDuration(calculatedDuration);
        };

        calculateDuration();

        const resizeObserver = new ResizeObserver(
            calculateDuration
        );

        if (trackRef.current) {
            resizeObserver.observe(trackRef.current);
        }

        window.addEventListener('resize', calculateDuration);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener(
                'resize',
                calculateDuration
            );
        };
    }, [speed, children]);

    return (
        <div
            className="relative w-full overflow-hidden mb-16"
            style={{
                maskImage:
                    'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                WebkitMaskImage:
                    'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
        >
            <div
                ref={trackRef}
                className={`
                    flex
                    w-max
                    gap-6
                    hover:[animation-play-state:paused]
                    ${
                        direction === 'left'
                            ? 'animate-marquee-left'
                            : 'animate-marquee-right'
                    }
                `}
                style={{
                    '--marquee-duration': `${duration}s`,
                } as React.CSSProperties}
            >
                {/* First copy */}
                <div className="flex w-max shrink-0 gap-6">
                    {children}
                </div>

                {/* Second identical copy */}
                <div
                    className="flex w-max shrink-0 gap-6"
                    aria-hidden="true"
                >
                    {children}
                </div>
            </div>
        </div>
    );
};