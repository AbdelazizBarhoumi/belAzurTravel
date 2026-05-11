import { motion } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import destBali from '@/assets/dest-bali.jpg';
import destDubai from '@/assets/dest-dubai.jpg';
import destParis from '@/assets/dest-paris.jpg';
import destSantorini from '@/assets/dest-santorini.jpg';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const destinations = [
    {
        slug: 'santorini',
        name: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
        country: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
        image: destSantorini,
        rating: 4.9,
        price: '$1,299',
        tag: { fr: 'Tendance', ar: 'متوجه', en: 'Trending' },
    },
    {
        slug: 'bali',
        name: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
        country: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
        image: destBali,
        rating: 4.8,
        price: '$899',
        tag: { fr: 'Populaire', ar: 'شهير', en: 'Popular' },
    },
    {
        slug: 'paris',
        name: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
        country: { fr: 'France', ar: 'فرنسا', en: 'France' },
        image: destParis,
        rating: 4.9,
        price: '$1,499',
        tag: { fr: 'Romantique', ar: 'رومانسي', en: 'Romantic' },
    },
    {
        slug: 'dubai',
        name: { fr: 'Dubaï', ar: 'دبي', en: 'Dubai' },
        country: { fr: 'Émirats Arabes Unis', ar: 'الإمارات العربية المتحدة', en: 'UAE' },
        image: destDubai,
        rating: 4.7,
        price: '$1,199',
        tag: { fr: 'Luxe', ar: 'فاخر', en: 'Luxury' },
    },
];

export function FeaturedDestinations() {
    const { t, lang } = useLanguage();
    return (
        <section className="bg-background py-24">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <p className="mb-3 text-sm font-medium uppercase tracking-widest text-secondary">
                        {t('featured.explore')}
                    </p>
                    <h2 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                        {t('featured.title')}
                    </h2>
                    <p className="mx-auto max-w-xl text-muted-foreground">
                        {t('featured.subtitle')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {destinations.map((dest, i) => (
                        <motion.div
                            key={localize(dest.name, lang)}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link to={`/destinations/${dest.slug}`} className="group block">
                                <div className="card-elevated relative overflow-hidden rounded-2xl bg-card">
                                    <div className="aspect-[3/4] overflow-hidden">
                                        <img
                                            src={dest.image}
                                            alt={localize(dest.name, lang)}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="absolute left-4 top-4">
                                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                                            {localize(dest.tag, lang)}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-5">
                                        <div className="mb-1 flex items-center gap-1 text-secondary">
                                            <Star className="h-3.5 w-3.5 fill-current" />
                                            <span className="text-xs font-semibold">
                                                {dest.rating}
                                            </span>
                                        </div>
                                        <h3 className="font-serif text-xl font-bold text-primary-foreground">
                                            {localize(dest.name, lang)}
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-primary-foreground/70">
                                                <MapPin className="h-3 w-3" />
                                                <span className="text-xs">
                                                    {localize(dest.country, lang)}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-secondary">
                                                {t('common.from')} {dest.price}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
