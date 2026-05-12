import { motion } from 'framer-motion';
import { Wifi, Car, Coffee, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { StarRating } from '@/components/StarRating';
import { TagFilter, type Tag } from '@/components/TagFilter';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

interface Hotel {
    id: string;
    name: LocalizedText;
    location: LocalizedText;
    price: number;
    rating: number;
    stars: number;
    reviews: number;
    image: string;
    amenities: string[];
    tags: string[];
}

const HOTEL_TAGS: Tag[] = [
    { id: 'luxury', name: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' } },
    { id: 'budget', name: { fr: 'Économique', ar: 'اقتصادي', en: 'Budget' } },
    { id: 'family', name: { fr: 'Famille', ar: 'عائلي', en: 'Family' } },
    { id: 'beach', name: { fr: 'Plage', ar: 'شاطئ', en: 'Beach' } },
    { id: 'city', name: { fr: 'Ville', ar: 'مدينة', en: 'City' } },
    { id: 'adventure', name: { fr: 'Aventure', ar: 'مغامرة', en: 'Adventure' } },
    { id: 'boutique', name: { fr: 'Boutique', ar: 'بوتيك', en: 'Boutique' } },
    { id: 'resort', name: { fr: 'Complexe', ar: 'منتجع', en: 'Resort' } },
    { id: 'nature', name: { fr: 'Nature', ar: 'طبيعة', en: 'Nature' } },
];

const HOTELS: Hotel[] = [
    {
        id: 'sunset-paradise',
        name: { fr: 'Sunset Paradise Resort', ar: 'منتجع صن ست بارادايس', en: 'Sunset Paradise Resort' },
        location: { fr: 'Santorin, Grèce', ar: 'سانتوريني، اليونان', en: 'Santorini, Greece' },
        price: 320,
        rating: 4.9,
        stars: 5,
        reviews: 234,
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop',
        amenities: ['wifi', 'parking', 'breakfast'],
        tags: ['luxury', 'beach', 'resort'],
    },
    {
        id: 'ubud-jungle',
        name: { fr: 'Ubud Jungle Retreat', ar: 'منتجع أوبود للغابات', en: 'Ubud Jungle Retreat' },
        location: { fr: 'Bali, Indonésie', ar: 'بالي، إندونيسيا', en: 'Bali, Indonesia' },
        price: 180,
        rating: 4.8,
        stars: 4,
        reviews: 189,
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop',
        amenities: ['wifi', 'breakfast'],
        tags: ['adventure', 'nature', 'boutique'],
    },
    {
        id: 'grand-parisien',
        name: { fr: 'Le Grand Parisien', ar: 'لو غراند باريسيان', en: 'Le Grand Parisien' },
        location: { fr: 'Paris, France', ar: 'باريس، فرنسا', en: 'Paris, France' },
        price: 450,
        rating: 4.9,
        stars: 5,
        reviews: 312,
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
        amenities: ['wifi', 'parking', 'breakfast'],
        tags: ['luxury', 'city', 'boutique'],
    },
    {
        id: 'marina-bay',
        name: { fr: 'Marina Bay Suites', ar: 'فندق مارينا باي سويتس', en: 'Marina Bay Suites' },
        location: { fr: 'Dubaï, Émirats Arabes Unis', ar: 'دبي، الإمارات العربية المتحدة', en: 'Dubai, UAE' },
        price: 280,
        rating: 4.7,
        stars: 5,
        reviews: 156,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
        amenities: ['wifi', 'parking'],
        tags: ['luxury', 'city', 'resort'],
    },
    {
        id: 'imperial-tokyo',
        name: { fr: 'Hôtel Impérial Tokyo', ar: 'فندق إمبريال طوكيو', en: 'Imperial Tokyo Hotel' },
        location: { fr: 'Tokyo, Japon', ar: 'طوكيو، اليابان', en: 'Tokyo, Japan' },
        price: 350,
        rating: 4.8,
        stars: 4,
        reviews: 278,
        image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&h=400&fit=crop',
        amenities: ['wifi', 'breakfast'],
        tags: ['city', 'family', 'resort'],
    },
    {
        id: 'maldives-resort',
        name: { fr: 'Resort Bungalow Océan', ar: 'منتجع بنغل المحيط', en: 'Overwater Villa Resort' },
        location: { fr: 'Maldives', ar: 'جزر المالديف', en: 'Maldives' },
        price: 750,
        rating: 5.0,
        stars: 5,
        reviews: 98,
        image: 'https://images.unsplash.com/photo-1439130490301-25e322d88054?w=600&h=400&fit=crop',
        amenities: ['wifi', 'parking', 'breakfast'],
        tags: ['luxury', 'beach', 'resort'],
    },
];

const AMENITY_ICONS: Record<string, LucideIcon> = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
};

const MAX_PRICE = Math.max(...HOTELS.map(h => h.price));
const MIN_PRICE = Math.min(...HOTELS.map(h => h.price));

export default function Hotels() {
    const { t, lang, dir } = useLanguage();
    const [params] = useSearchParams();
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedStars, setSelectedStars] = useState<number[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE]);

    useEffect(() => {
        const stars = params.get('stars');
        if (stars) {
            const starsNum = parseInt(stars, 10);
            if (starsNum >= 1 && starsNum <= 5) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedStars([starsNum]);
            }
        }
    }, [params]);

    const filteredHotels =
        selectedTags.length === 0 && selectedStars.length === 0 && priceRange[0] === MIN_PRICE && priceRange[1] === MAX_PRICE
            ? HOTELS
            : HOTELS.filter((hotel) => {
                  const matchesTags =
                      selectedTags.length === 0 ||
                      selectedTags.some((tag) => hotel.tags.includes(tag));
                  const matchesStars =
                      selectedStars.length === 0 ||
                      selectedStars.includes(hotel.stars);
                  const matchesPrice =
                      hotel.price >= priceRange[0] && hotel.price <= priceRange[1];
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
        setPriceRange([MIN_PRICE, MAX_PRICE]);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

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
                    <div className={`flex gap-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Sidebar Filter Panel */}
                        <motion.aside
                            initial={{ opacity: 0, x: dir === 'rtl' ? 100 : -100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 }}
                            className="w-full md:w-72 flex-shrink-0"
                        >
                            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6">
                                <div className="mb-6 flex items-center justify-between gap-4">
                                    <h2 className="font-serif text-lg font-bold text-foreground">
                                        {t('hotels.filterByStars')}
                                    </h2>
                                    {(selectedTags.length > 0 || selectedStars.length > 0 || priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE) && (
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
                                            onClick={() => handleStarToggle(stars)}
                                            className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition-all ${
                                                selectedStars.includes(stars)
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {'★'.repeat(stars)}
                                            <span className="text-[10px]">({stars})</span>
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
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                                {t('hotels.minPrice')}
                                            </label>
                                            <input
                                                type="number"
                                                min={MIN_PRICE}
                                                max={MAX_PRICE}
                                                value={priceRange[0]}
                                                onChange={(e) => {
                                                    const newMin = Math.min(parseInt(e.target.value, 10) || MIN_PRICE, priceRange[1]);
                                                    setPriceRange([newMin, priceRange[1]]);
                                                }}
                                                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                                {t('hotels.maxPrice')}
                                            </label>
                                            <input
                                                type="number"
                                                min={MIN_PRICE}
                                                max={MAX_PRICE}
                                                value={priceRange[1]}
                                                onChange={(e) => {
                                                    const newMax = Math.max(parseInt(e.target.value, 10) || MAX_PRICE, priceRange[0]);
                                                    setPriceRange([priceRange[0], newMax]);
                                                }}
                                                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        DT {priceRange[0]} - DT {priceRange[1]}
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
                        <div className="flex-1 min-w-0">
                            {filteredHotels.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                                    {t('hotels.noResults')}
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredHotels.map((hotel, index) => (
                                        <motion.article
                                            key={hotel.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                to={`/hotels/${hotel.id}`}
                                                className="group block overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                            >
                                                <div className="relative h-56 overflow-hidden">
                                                    <img
                                                        src={hotel.image}
                                                        alt={localize(hotel.name, lang)}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />

                                                    <FavoriteButton
                                                        className="absolute left-4 top-4"
                                                        item={{
                                                            id: hotel.id,
                                                            type: 'hotel',
                                                            name: localize(hotel.name, lang),
                                                            image: hotel.image,
                                                            price: hotel.price,
                                                            location: localize(hotel.location, lang),
                                                        }}
                                                    />

                                            <div className="absolute right-4 top-4 rounded-full bg-card/95 px-3 py-1 text-xs font-bold text-foreground shadow-md backdrop-blur">
                                                {t('hotels.priceFrom')} {hotel.price} DT
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {localize(hotel.location, lang)}
                                            </div>

                                            <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                {localize(hotel.name, lang)}
                                            </h3>

                                            <div className="mb-3 flex items-center gap-3">
                                                <StarRating rating={hotel.stars} size="sm" />
                                                <span className="text-sm font-semibold text-secondary">
                                                    {hotel.rating}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({hotel.reviews} {t('hotels.reviews')})
                                                </span>
                                            </div>

                                            <div className="mb-4">
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
                                                    {hotel.tags.map((tagId) => {
                                                        const tag = HOTEL_TAGS.find((item) => item.id === tagId);
                                                        if (!tag) return null;

                                                        return (
                                                            <div
                                                                key={tagId}
                                                                className="flex items-center justify-center rounded-lg bg-muted px-2 py-1"
                                                            >
                                                                <span className="text-center text-xs font-medium text-muted-foreground">
                                                                    {tag.name[lang]}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex gap-2">
                                                    {hotel.amenities.map((amenity) => {
                                                        const Icon = AMENITY_ICONS[amenity];
                                                        if (!Icon) return null;

                                                        return (
                                                            <div key={amenity} className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <span className="text-sm font-semibold text-primary">
                                                    {t('common.viewAll')}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>
                    )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
