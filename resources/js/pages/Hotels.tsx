import { motion } from 'framer-motion';
import { Wifi, Car, Coffee, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { StarRating } from '@/components/ui/StarRating';
import { TagFilter, type Tag } from '@/components/ui/TagFilter';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useHotels } from '@/hooks/usePublicData';

const HOTEL_TAGS: Tag[] = [
    { id: 'luxury', name: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' } },
    { id: 'budget', name: { fr: 'Économique', ar: 'اقتصادي', en: 'Budget' } },
    { id: 'family', name: { fr: 'Famille', ar: 'عائلي', en: 'Family' } },
    { id: 'beach', name: { fr: 'Plage', ar: 'شاطئ', en: 'Beach' } },
    { id: 'city', name: { fr: 'Ville', ar: 'مدينة', en: 'City' } },
    {
        id: 'adventure',
        name: { fr: 'Aventure', ar: 'مغامرة', en: 'Adventure' },
    },
    { id: 'boutique', name: { fr: 'Boutique', ar: 'بوتيك', en: 'Boutique' } },
    { id: 'resort', name: { fr: 'Complexe', ar: 'منتجع', en: 'Resort' } },
    { id: 'nature', name: { fr: 'Nature', ar: 'طبيعة', en: 'Nature' } },
];

const AMENITY_ICONS: Record<string, LucideIcon> = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
};

export default function Hotels() {
    const { t, lang, dir } = useLanguage();
    const [params] = useSearchParams();
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Initialize star filter from URL parameter
    const initialStars: number[] = (() => {
        const stars = params.get('stars');
        if (stars) {
            const starsNum = parseInt(stars, 10);
            if (starsNum >= 1 && starsNum <= 5) {
                return [starsNum];
            }
        }
        return [];
    })();

    const [selectedStars, setSelectedStars] = useState<number[]>(initialStars);
    const { data: hotels = [] } = useHotels();
    const maxPrice =
        hotels.length > 0 ? Math.max(...hotels.map((hotel) => hotel.price)) : 0;
    const minPrice =
        hotels.length > 0 ? Math.min(...hotels.map((hotel) => hotel.price)) : 0;
    const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
    const activePriceRange = priceRange ?? [minPrice, maxPrice];

    const filteredHotels =
        selectedTags.length === 0 &&
        selectedStars.length === 0 &&
        activePriceRange[0] === minPrice &&
        activePriceRange[1] === maxPrice
            ? hotels
            : hotels.filter((hotel) => {
                  const matchesTags =
                      selectedTags.length === 0 ||
                      selectedTags.some((tag) => hotel.tags.includes(tag));
                  const matchesStars =
                      selectedStars.length === 0 ||
                      selectedStars.includes(hotel.stars);
                  const matchesPrice =
                      hotel.price >= activePriceRange[0] &&
                      hotel.price <= activePriceRange[1];
                  return matchesTags && matchesStars && matchesPrice;
              });

    const handleTagToggle = (tagId: string) => {
        setSelectedTags((current) =>
            current.includes(tagId)
                ? current.filter((id) => id !== tagId)
                : [...current, tagId],
        );
    };

    const handleStarToggle = (stars: number) => {
        setSelectedStars((current) =>
            current.includes(stars)
                ? current.filter((s) => s !== stars)
                : [...current, stars],
        );
    };

    const handleClearAll = () => {
        setSelectedTags([]);
        setSelectedStars([]);
        setPriceRange(null);
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.hotels'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.header
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('hotels.title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('hotels.subtitle')}
                        </p>
                    </motion.header>

                    {/* Main Layout: Sidebar + Content */}
                    <div
                        className={`flex gap-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Sidebar Filter Panel - Hidden on mobile, shown on md+ */}
                        <motion.aside
                            initial={{
                                opacity: 0,
                                x: dir === 'rtl' ? 100 : -100,
                            }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                            className="hidden flex-shrink-0 md:block md:w-72"
                        >
                            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6">
                                <div className="mb-6 flex items-center justify-between gap-4">
                                    <h2 className="font-serif text-lg font-bold text-foreground">
                                        {t('hotels.filterByStars')}
                                    </h2>
                                    {(selectedTags.length > 0 ||
                                        selectedStars.length > 0 ||
                                        activePriceRange[0] !== minPrice ||
                                        activePriceRange[1] !== maxPrice) && (
                                        <button
                                            type="button"
                                            onClick={handleClearAll}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            {t('common.viewAll')}
                                        </button>
                                    )}
                                </div>

                                <div className="mb-6 flex flex-wrap gap-2">
                                    {[5, 4, 3, 2, 1].map((stars) => (
                                        <button
                                            key={stars}
                                            onClick={() =>
                                                handleStarToggle(stars)
                                            }
                                            className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition-all ${
                                                selectedStars.includes(stars)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {'★'.repeat(stars)}
                                            <span className="text-[10px]">
                                                ({stars})
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="border-t border-border py-6">
                                    <div className="mb-4">
                                        <h3 className="font-serif text-base font-bold text-foreground">
                                            {t('hotels.filterByPrice')}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                {t('hotels.minPrice')}
                                            </label>
                                            <input
                                                type="number"
                                                min={minPrice}
                                                max={maxPrice}
                                                value={activePriceRange[0]}
                                                onChange={(e) => {
                                                    const newMin = Math.min(
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || minPrice,
                                                        activePriceRange[1],
                                                    );
                                                    setPriceRange([
                                                        newMin,
                                                        activePriceRange[1],
                                                    ]);
                                                }}
                                                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                {t('hotels.maxPrice')}
                                            </label>
                                            <input
                                                type="number"
                                                min={minPrice}
                                                max={maxPrice}
                                                value={activePriceRange[1]}
                                                onChange={(e) => {
                                                    const newMax = Math.max(
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || maxPrice,
                                                        activePriceRange[0],
                                                    );
                                                    setPriceRange([
                                                        activePriceRange[0],
                                                        newMax,
                                                    ]);
                                                }}
                                                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        DT {activePriceRange[0]} - DT{' '}
                                        {activePriceRange[1]}
                                    </div>
                                </div>

                                <div className="border-t border-border pt-6">
                                    <div className="mb-4">
                                        <h3 className="font-serif text-base font-bold text-foreground">
                                            {t('hotels.filterByTags')}
                                        </h3>
                                    </div>

                                    <TagFilter
                                        tags={HOTEL_TAGS}
                                        selectedTags={selectedTags}
                                        onTagToggle={handleTagToggle}
                                        onClearAll={handleClearAll}
                                        locale={lang}
                                    />
                                </div>
                            </div>
                        </motion.aside>

                        {/* Main Content */}
                        <div className="min-w-0 flex-1">
                            {/* Mobile Filter Toggle */}
                            <div className="mb-6 flex items-center gap-2 md:hidden">
                                <button
                                    onClick={() =>
                                        setShowMobileFilter(!showMobileFilter)
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card/80"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                    </svg>
                                    {t('common.filter')}
                                </button>
                            </div>

                            {/* Mobile Filter Modal */}
                            {showMobileFilter && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur md:hidden"
                                    onClick={() => setShowMobileFilter(false)}
                                >
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: dir === 'rtl' ? 100 : 100,
                                        }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="scrollbar-modal fixed bottom-4 left-4 right-4 z-50 max-h-[80vh] overflow-y-auto rounded-3xl border border-border bg-background"
                                        style={{
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none',
                                        }}
                                    >
                                        <style>{`.scrollbar-modal::-webkit-scrollbar { display: none; }`}</style>
                                        <div className="sticky top-0 border-b border-border bg-background px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="font-serif text-lg font-bold text-foreground">
                                                    {t('common.filter')}
                                                </h2>
                                                <button
                                                    onClick={() =>
                                                        setShowMobileFilter(
                                                            false,
                                                        )
                                                    }
                                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <line
                                                            x1="18"
                                                            y1="6"
                                                            x2="6"
                                                            y2="18"
                                                        />
                                                        <line
                                                            x1="6"
                                                            y1="6"
                                                            x2="18"
                                                            y2="18"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-6 p-6">
                                            {/* Stars Filter */}
                                            <div>
                                                <h3 className="mb-3 font-serif text-base font-bold text-foreground">
                                                    {t('hotels.filterByStars')}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {[5, 4, 3, 2, 1].map(
                                                        (stars) => (
                                                            <button
                                                                key={stars}
                                                                onClick={() =>
                                                                    handleStarToggle(
                                                                        stars,
                                                                    )
                                                                }
                                                                className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition-all ${
                                                                    selectedStars.includes(
                                                                        stars,
                                                                    )
                                                                        ? 'bg-primary text-primary-foreground'
                                                                        : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                                                }`}
                                                            >
                                                                {'★'.repeat(
                                                                    stars,
                                                                )}
                                                                <span className="text-[10px]">
                                                                    ({stars})
                                                                </span>
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            {/* Price Filter */}
                                            <div className="border-t border-border pt-4">
                                                <h3 className="mb-3 font-serif text-base font-bold text-foreground">
                                                    {t('hotels.filterByPrice')}
                                                </h3>
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                            {t(
                                                                'hotels.minPrice',
                                                            )}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={minPrice}
                                                            max={maxPrice}
                                                            value={
                                                                activePriceRange[0]
                                                            }
                                                            onChange={(e) => {
                                                                const newMin =
                                                                    Math.min(
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                            10,
                                                                        ) ||
                                                                            minPrice,
                                                                        activePriceRange[1],
                                                                    );
                                                                setPriceRange([
                                                                    newMin,
                                                                    activePriceRange[1],
                                                                ]);
                                                            }}
                                                            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                            {t(
                                                                'hotels.maxPrice',
                                                            )}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={minPrice}
                                                            max={maxPrice}
                                                            value={
                                                                activePriceRange[1]
                                                            }
                                                            onChange={(e) => {
                                                                const newMax =
                                                                    Math.max(
                                                                        parseInt(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                            10,
                                                                        ) ||
                                                                            maxPrice,
                                                                        activePriceRange[0],
                                                                    );
                                                                setPriceRange([
                                                                    activePriceRange[0],
                                                                    newMax,
                                                                ]);
                                                            }}
                                                            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-xs text-muted-foreground">
                                                    DT {activePriceRange[0]} -
                                                    DT {activePriceRange[1]}
                                                </div>
                                            </div>

                                            {/* Tags Filter */}
                                            <div className="border-t border-border pt-4">
                                                <h3 className="mb-3 font-serif text-base font-bold text-foreground">
                                                    {t('hotels.filterByTags')}
                                                </h3>
                                                <TagFilter
                                                    tags={HOTEL_TAGS}
                                                    selectedTags={selectedTags}
                                                    onTagToggle={
                                                        handleTagToggle
                                                    }
                                                    onClearAll={handleClearAll}
                                                    locale={lang}
                                                />
                                            </div>

                                            {/* Close Button */}
                                            <div className="border-t border-border pt-4">
                                                <button
                                                    onClick={() =>
                                                        setShowMobileFilter(
                                                            false,
                                                        )
                                                    }
                                                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                                >
                                                    {t('common.apply')}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                            {filteredHotels.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                                    {t('hotels.noResults')}
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredHotels.map((hotel, index) => (
                                        <motion.div
                                            key={hotel.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group h-full"
                                        >
                                            <div className="card-elevated flex h-full flex-col overflow-hidden rounded-2xl bg-card">
                                                <Link
                                                    to={`/hotels/${hotel.id}`}
                                                    className="relative block h-52 overflow-hidden transition-all group-hover:brightness-95"
                                                >
                                                    <img
                                                        src={hotel.image}
                                                        alt={localizeText(
                                                            hotel.name,
                                                            lang,
                                                        )}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                    <FavoriteButton
                                                        className="absolute left-4 top-4"
                                                        item={{
                                                            id: hotel.id,
                                                            type: 'hotel',
                                                            name: localizeText(
                                                                hotel.name,
                                                                lang,
                                                            ),
                                                            image: hotel.image,
                                                            price: hotel.price,
                                                            location:
                                                                localizeText(
                                                                    hotel.location,
                                                                    lang,
                                                                ),
                                                        }}
                                                    />
                                                    <span className="absolute right-4 top-4 rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-foreground shadow-md backdrop-blur">
                                                        {t('hotels.priceFrom')}{' '}
                                                        {hotel.price} DT
                                                    </span>
                                                </Link>
                                                <div className="flex flex-1 flex-col justify-between p-5">
                                                    <div>
                                                        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5" />{' '}
                                                            {localizeText(
                                                                hotel.location,
                                                                lang,
                                                            )}
                                                        </div>
                                                        <Link
                                                            to={`/hotels/${hotel.id}`}
                                                        >
                                                            <h3 className="mb-2 font-serif text-lg font-bold text-foreground transition-colors hover:text-primary">
                                                                {localizeText(
                                                                    hotel.name,
                                                                    lang,
                                                                )}
                                                            </h3>
                                                        </Link>
                                                        <div className="mb-4 flex items-center gap-3">
                                                            <div className="flex items-center gap-1 text-secondary">
                                                                <StarRating
                                                                    rating={
                                                                        hotel.stars
                                                                    }
                                                                    size="sm"
                                                                />
                                                                <span className="text-xs font-bold">
                                                                    {
                                                                        hotel.rating
                                                                    }
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
                                                                ({hotel.reviews}{' '}
                                                                {t(
                                                                    'hotels.reviews',
                                                                )}
                                                                )
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-2">
                                                            {hotel.amenities
                                                                .slice(0, 3)
                                                                .map(
                                                                    (
                                                                        amenity: string,
                                                                    ) => {
                                                                        const Icon =
                                                                            AMENITY_ICONS[
                                                                                amenity
                                                                            ];
                                                                        if (
                                                                            !Icon
                                                                        )
                                                                            return null;

                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    amenity
                                                                                }
                                                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"
                                                                            >
                                                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                        </div>
                                                        <span className="cursor-pointer text-sm font-semibold text-primary transition-colors hover:text-primary/80">
                                                            {t(
                                                                'common.viewAll',
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
