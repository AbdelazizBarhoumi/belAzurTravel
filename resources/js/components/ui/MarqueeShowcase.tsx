import { useQuery } from '@tanstack/react-query';
import { fetchGallery, type GalleryImage } from '@/api/gallery.api';
import { fetchPartners, type PartnerItem } from '@/api/partners.api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { isPageExposed } from '@/lib/pageVisibility';

const FALLBACK_GALLERY = [
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop",
];

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

    if (!showGallery && !showPartners) return null;

    const galleryImages =
        galleryData && galleryData.length > 0
            ? galleryData.map((g) => g.url)
            : FALLBACK_GALLERY;

    const partners = partnersData && partnersData.length > 0 ? partnersData : [];

    const images = galleryImages;
const partnerList = partners;

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
                    <div
                        className="relative w-full overflow-hidden mb-16"
                        style={{
                            maskImage:
                                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                            WebkitMaskImage:
                                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                        }}
                    >
                        <div className="flex w-max gap-6 animate-marquee-left hover:[animation-play-state:paused]">
                            {images.map((src, i) => (
                                <div
                                    key={`img-${i}`}
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
                        </div>
                    </div>
                </>
            )}
            {showPartners && partnerList.length > 0 && (
                <>
                    <div className="container mx-auto px-4 mb-8 text-center">
                        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-muted-foreground">
                            {t('home.showcase.partners')}
                        </h3>
                    </div>
                    <div
                        className="relative w-full overflow-hidden"
                        style={{
                            maskImage:
                                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                            WebkitMaskImage:
                                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                        }}
                    >
                        <div className="flex w-max gap-6 animate-marquee-right hover:[animation-play-state:paused]">
                            {partnerList.map((p, i) => (
                                <div
                                    key={`p-${i}`}
                                    className=" h-56 w-80  shrink-0 flex items-center justify-center transition-all"
                                >
                                    <img
                                        src={p.logo}
                                        alt={typeof p.name === 'string' ? p.name : p.name?.en ?? ''}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};
