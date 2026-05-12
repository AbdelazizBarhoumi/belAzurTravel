import { motion } from 'framer-motion';
import { ChevronDown, Search, MapPin, Star } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import destBali from '@/assets/dest-bali.jpg';
import destDubai from '@/assets/dest-dubai.jpg';
import destParis from '@/assets/dest-paris.jpg';
import destSantorini from '@/assets/dest-santorini.jpg';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from '@/components/ui/navigation-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const allDestinations = [
    {
        slug: 'santorini',
        name: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
        country: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
        image: destSantorini,
        rating: 4.9,
        price: 1299,
        category: 'beach',
        description: {
            fr: 'Bâtiments blanchis à la chaux emblématiques surplombant la mer Égée',
            ar: 'مبانٍ بيضاء أيقونية تطل على بحر إيجه',
            en: 'Iconic white-washed buildings overlooking the Aegean Sea',
        },
    },
    {
        slug: 'bali',
        name: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
        country: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
        image: destBali,
        rating: 4.8,
        price: 899,
        category: 'nature',
        description: {
            fr: 'Rizières luxuriantes, temples et paradis tropical',
            ar: 'مدرجات أرز خضراء ومعابد وجنة استوائية',
            en: 'Lush rice terraces, temples, and tropical paradise',
        },
    },
    {
        slug: 'paris',
        name: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
        country: { fr: 'France', ar: 'فرنسا', en: 'France' },
        image: destParis,
        rating: 4.9,
        price: 1499,
        category: 'city',
        description: {
            fr: 'La Ville Lumière avec de l’art, de la gastronomie et de la culture de classe mondiale',
            ar: 'مدينة النور مع فن وطعام وثقافة عالمية المستوى',
            en: 'The City of Light with world-class art, food, and culture',
        },
    },
    {
        slug: 'dubai',
        name: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
        country: { fr: 'Émirats Arabes Unis', ar: 'الإمارات العربية المتحدة', en: 'UAE' },
        image: destDubai,
        rating: 4.7,
        price: 1199,
        category: 'luxury',
        description: {
            fr: 'Une silhouette futuriste rencontre des aventures dans le désert',
            ar: 'أفق مستقبلي يلتقي بمغامرات الصحراء',
            en: 'Futuristic skyline meets desert adventures',
        },
    },
    {
        slug: 'tokyo',
        name: { fr: 'Tokyo', ar: 'طوكيو', en: 'Tokyo' },
        country: { fr: 'Japon', ar: 'اليابان', en: 'Japan' },
        price: 1599,
        rating: 4.9,
        category: 'city',
        description: {
            fr: 'Les traditions ancestrales se mêlent à la modernité de pointe',
            ar: 'تختلط التقاليد العريقة مع الحداثة المتقدمة',
            en: 'Ancient traditions blend with cutting-edge modernity',
        },
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
    },
    {
        slug: 'maldives',
        name: { fr: 'Maldives', ar: 'جزر المالديف', en: 'Maldives' },
        country: { fr: 'Océan Indien', ar: 'المحيط الهندي', en: 'Indian Ocean' },
        price: 3499,
        rating: 5.0,
        category: 'beach',
        description: {
            fr: 'Eaux cristallines et villas sur pilotis',
            ar: 'مياه صافية تمامًا وفيلات فوق الماء',
            en: 'Crystal-clear waters and overwater villas',
        },
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop',
    },
];

const categories = [
    { value: 'all', labelKey: 'common.all' },
    { value: 'beach', labelKey: 'cat.beach' },
    { value: 'city', labelKey: 'cat.city' },
    { value: 'nature', labelKey: 'cat.nature' },
    { value: 'luxury', labelKey: 'cat.luxury' },
    { value: 'adventure', labelKey: 'cat.adventure' },
] as const;

const SORT_OPTIONS = [
    { value: 'featured', labelKey: 'dest.sort.featured' },
    { value: 'price-asc', labelKey: 'dest.sort.priceAsc' },
    { value: 'price-desc', labelKey: 'dest.sort.priceDesc' },
    { value: 'rating', labelKey: 'dest.sort.rating' },
] as const;

const Destinations = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
    const { t, lang } = useLanguage();

    useEffect(() => {
        const cat = params.get('cat');
        if (cat) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedCategory(cat.toLowerCase());
        }
    }, [params]);

    const filtered = useMemo(() => {
        const base = allDestinations.filter((d) => {
            const matchesSearch =
                localize(d.name, lang).toLowerCase().includes(searchQuery.toLowerCase()) ||
                localize(d.country, lang).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        if (sortBy === 'price-asc') return [...base].sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') return [...base].sort((a, b) => b.price - a.price);
        if (sortBy === 'rating') return [...base].sort((a, b) => b.rating - a.rating);
        return base;
    }, [lang, searchQuery, selectedCategory, sortBy]);

    const handleProceed = (slug: string) => {
        navigate(`/destinations/${slug}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.destinations'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('dest.title')}
                        </h1>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            {t('dest.subtitle')}
                        </p>
                    </motion.div>

                    {/* Filters */}
                    <div className="mb-10 flex flex-col items-center gap-4 md:flex-row">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('dest.searchPlaceholder')}
                                className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div className="flex gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setSelectedCategory(cat.value)}
                                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                                        selectedCategory === cat.value
                                            ? 'bg-primary text-primary-foreground'
                                            : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {t(cat.labelKey)}
                                </button>
                            ))}
                        </div>
                        <NavigationMenu className="relative z-10 w-full md:w-auto">
                            <NavigationMenuList className="gap-0">
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger 
                                        onClick={(e) => e.preventDefault()}
                                        className="h-11 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:bg-muted data-[state=open]:bg-muted">
                                        <span className="flex items-center gap-2">
                                            {t('dest.sortBy')}: {t(SORT_OPTIONS.find((opt) => opt.value === sortBy)?.labelKey ?? 'dest.sort.featured')}
                                        </span>
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-64 gap-1 bg-card p-2 shadow-xl">
                                            {SORT_OPTIONS.map((option) => {
                                                const isActive = sortBy === option.value;

                                                return (
                                                    <li key={option.value}>
                                                        <NavigationMenuLink asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSortBy(option.value)}
                                                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                                            >
                                                                <span>{t(option.labelKey)}</span>
                                                                {isActive && <span className="text-xs font-semibold">✓</span>}
                                                            </button>
                                                        </NavigationMenuLink>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                            <NavigationMenuViewport />
                        </NavigationMenu>
                    </div>

                    <div className="mb-4 text-sm text-muted-foreground">
                        {filtered.length} results
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((dest, i) => (
                            <Link key={localize(dest.name, lang)} to={`/destinations/${dest.slug}`} className="group block">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="cursor-pointer"
                            >
                                <div className="card-elevated overflow-hidden rounded-2xl bg-card">
                                    <div className="relative h-56 overflow-hidden">
                                        <img
                                            src={dest.image}
                                            alt={localize(dest.name, lang)}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        <FavoriteButton
                                            className="absolute right-3 top-3"
                                            item={{
                                                id: `dest-${localize(dest.name, lang)}`,
                                                type: 'destination',
                                                name: localize(dest.name, lang),
                                                image: dest.image,
                                                price: dest.price,
                                                location: localize(dest.country, lang),
                                            }}
                                        />
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />{' '}
                                                {localize(dest.country, lang)}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-bold text-secondary">
                                                <Star className="h-3 w-3 fill-current" />{' '}
                                                {dest.rating}
                                            </div>
                                        </div>
                                        <h3 className="mb-1 font-serif text-xl font-bold text-foreground">
                                            {localize(dest.name, lang)}
                                        </h3>
                                        <p className="mb-4 text-sm text-muted-foreground">
                                            {localize(dest.description, lang)}
                                        </p>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-primary">
                                                From $
                                                {dest.price.toLocaleString()}
                                            </span>
                                            <Button
                                                size="sm"
                                                className="bg-primary text-xs text-primary-foreground"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleProceed(dest.slug);
                                                }}
                                            >
                                                {t('common.bookNow')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Destinations;
