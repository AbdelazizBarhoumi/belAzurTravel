import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const DESTINATION_DETAILS = [
    {
        slug: 'santorini',
        name: { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
        country: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop',
        rating: 4.9,
        price: 1299,
        description: { fr: 'Une île iconique aux maisons blanches, eaux turquoise et couchers de soleil spectaculaires.', ar: 'جزيرة أيقونية بمنازل بيضاء ومياه فيروزية وغروب شمس مذهل.', en: 'An iconic island with whitewashed homes, turquoise waters, and spectacular sunsets.' },
    },
    {
        slug: 'bali',
        name: { fr: 'Bali', ar: 'بالي', en: 'Bali' },
        country: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
        image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1600&h=900&fit=crop',
        rating: 4.8,
        price: 899,
        description: { fr: 'Temples, rizières et plages tropicales pour une escapade équilibrée.', ar: 'معابد ومدرجات أرز وشواطئ استوائية لرحلة متوازنة.', en: 'Temples, rice terraces, and tropical beaches for a balanced escape.' },
    },
    {
        slug: 'paris',
        name: { fr: 'Paris', ar: 'باريس', en: 'Paris' },
        country: { fr: 'France', ar: 'فرنسا', en: 'France' },
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&h=900&fit=crop',
        rating: 4.9,
        price: 1499,
        description: { fr: 'La ville lumière mêle art, gastronomie et élégance intemporelle.', ar: 'مدينة النور تمزج بين الفن والمطبخ والأناقة الخالدة.', en: 'The city of light blends art, cuisine, and timeless elegance.' },
    },
];

export default function DestinationDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();

    const destination = DESTINATION_DETAILS.find((item) => item.slug === slug);

    if (!destination) {
        return <Navigate to="/destinations" replace />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.destinations'), href: '/destinations' },
                                { label: localize(destination.name, lang), active: true },
                            ]}
                        />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-8">
                            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                                <img src={destination.image} alt={localize(destination.name, lang)} className="h-[420px] w-full object-cover md:h-[540px]" />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-card p-5">
                                    <div className="text-sm text-muted-foreground">{t('destinationDetail.overview')}</div>
                                    <p className="mt-2 text-foreground">{localize(destination.description, lang)}</p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-5">
                                    <div className="text-sm text-muted-foreground">{t('destinationDetail.bestTime')}</div>
                                    <p className="mt-2 text-foreground">{t('destinationDetail.spring')}</p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-5">
                                    <div className="text-sm text-muted-foreground">{t('destinationDetail.weather')}</div>
                                    <p className="mt-2 text-foreground">{t('destinationDetail.sunny')}</p>
                                </div>
                            </div>
                        </div>

                        <aside className="lg:pt-6">
                            <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-lg">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h1 className="font-serif text-3xl font-bold text-foreground">{localize(destination.name, lang)}</h1>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{localize(destination.country, lang)}</div>
                                    </div>
                                    <div className="flex items-center gap-1 text-secondary"><Star className="h-4 w-4 fill-current" />{destination.rating}</div>
                                </div>
                                <div className="mt-6 border-t border-border pt-6">
                                    <div className="text-sm text-muted-foreground">{t('destinationDetail.startingFrom')}</div>
                                    <div className="font-serif text-4xl font-bold text-secondary">${destination.price}</div>
                                </div>
                                <button className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">{t('common.bookNow')}</button>
                            </div>
                        </aside>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}