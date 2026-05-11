import { motion } from 'framer-motion';
import { Clock, Users, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FavoriteButton } from '@/components/FavoriteButton';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const tours = [
    {
        slug: 'greek-island-hopping',
        name: { fr: 'Îles Grecques en Liberté', ar: 'جولة الجزر اليونانية', en: 'Greek Island Hopping' },
        location: { fr: 'Grèce', ar: 'اليونان', en: 'Greece' },
        duration: '7 Days',
        maxGroup: 12,
        price: 2499,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop',
        description: { fr: 'Explorez les magnifiques îles des Cyclades avec des visites guidées et du temps libre.', ar: 'استكشف الجزر السيكلادية الرائعة مع الجولات الموجهة والوقت الحر.', en: 'Explore the stunning Cycladic islands with guided tours and free time.' },
    },
    {
        slug: 'bali-cultural-immersion',
        name: { fr: 'Immersion Culturelle à Bali', ar: 'انغمس في ثقافة بالي', en: 'Bali Cultural Immersion' },
        location: { fr: 'Indonésie', ar: 'إندونيسيا', en: 'Indonesia' },
        duration: '10 Days',
        maxGroup: 8,
        price: 1899,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop',
        description: { fr: 'Temples, rizières et cérémonies traditionnelles au cœur de Bali.', ar: 'المعابد والحقول الأرزية والطقوس التقليدية في قلب بالي.', en: 'Temples, rice fields, and traditional ceremonies in the heart of Bali.' },
    },
    {
        slug: 'paris-art-gastronomy',
        name: { fr: 'Paris: Art et Gastronomie', ar: 'باريس: الفن والطعام', en: 'Parisian Art & Gastronomy' },
        location: { fr: 'France', ar: 'فرنسا', en: 'France' },
        duration: '5 Days',
        maxGroup: 10,
        price: 3200,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
        description: { fr: 'Visites privées de musées, cours de cuisine et dégustations de vin.', ar: 'جولات خاصة بالمتاحف وفصول الطبخ وتذوق النبيذ.', en: 'Private museum tours, cooking classes, and wine tastings.' },
    },
    {
        slug: 'desert-safari-adventure',
        name: { fr: 'Aventure Safari du Désert', ar: 'مغامرة السفاري في الصحراء', en: 'Desert Safari Adventure' },
        location: { fr: 'Émirats Arabes Unis', ar: 'الإمارات العربية المتحدة', en: 'UAE' },
        duration: '3 Days',
        maxGroup: 15,
        price: 899,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=600&h=400&fit=crop',
        description: { fr: 'Pilotage sur les dunes, balades à dos de chameau et camping sous les étoiles.', ar: 'القيادة في الكثبان والركوب على الإبل والتخييم تحت النجوم.', en: 'Dune bashing, camel rides, and starlit desert camping.' },
    },
    {
        slug: 'japan-heritage-trail',
        name: { fr: 'Sentier du Patrimoine Japonais', ar: 'درب التراث الياباني', en: 'Japan Heritage Trail' },
        location: { fr: 'Japon', ar: 'اليابان', en: 'Japan' },
        duration: '12 Days',
        maxGroup: 10,
        price: 4500,
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop',
        description: { fr: 'Du néon de Tokyo aux jardins zen de Kyoto et au-delà.', ar: 'من أضواء طوكيو إلى حدائق كيوتو الزن وما بعدها.', en: "From Tokyo's neon to Kyoto's zen gardens and beyond." },
    },
    {
        slug: 'northern-lights-quest',
        name: { fr: 'Quête des Aurores Boréales', ar: 'البحث عن الأضواء الشمالية', en: 'Northern Lights Quest' },
        location: { fr: 'Islande', ar: 'أيسلندا', en: 'Iceland' },
        duration: '6 Days',
        maxGroup: 8,
        price: 3800,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&h=400&fit=crop',
        description: { fr: 'Pourchassez l\'aurore boréale avec des guides experts et sources chaudes.', ar: 'اصطد الأضواء الشمالية مع أدلاء خبراء والينابيع الساخنة.', en: 'Chase the aurora borealis with expert guides and hot springs.' },
    },
];

const Tours = () => {
    const { t, lang } = useLanguage();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />

            <div className="flex-1 pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.tours'), active: true },
                            ]}
                        />
                    </motion.div>
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('tours.title')}
                        </h1>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            {t('tours.subtitle')}
                        </p>
                    </motion.div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {tours.map((tour, i) => (
                            <Link key={localize(tour.name, lang)} to={`/tours/${tour.slug}`} className="group block">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="cursor-pointer"
                            >
                                <div className="card-elevated flex flex-col overflow-hidden rounded-2xl bg-card md:flex-row">
                                    {/* Image */}
                                    <div className="relative h-48 shrink-0 overflow-hidden md:h-auto md:w-64">
                                        <img
                                            src={tour.image}
                                            alt={localize(tour.name, lang)}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        <FavoriteButton
                                            className="absolute right-3 top-3"
                                            item={{
                                                id: `tour-${localize(tour.name, lang)}`,
                                                type: 'tour',
                                                name: localize(tour.name, lang),
                                                image: tour.image,
                                                price: tour.price,
                                                location: localize(tour.location, lang),
                                            }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-1 flex-col justify-between p-6">
                                        <div>
                                            <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />{' '}
                                                    {localize(tour.location, lang)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />{' '}
                                                    {tour.duration}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />{' '}
                                                    {t('tours.max')}{' '}
                                                    {tour.maxGroup}
                                                </span>
                                            </div>

                                            <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                                {localize(tour.name, lang)}
                                            </h3>

                                            <p className="mb-4 text-sm text-muted-foreground">
                                                {localize(tour.description, lang)}
                                            </p>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="mb-1 flex items-center gap-1 text-secondary">
                                                    <Star className="h-3.5 w-3.5 fill-current" />
                                                    <span className="text-xs font-bold">
                                                        {tour.rating}
                                                    </span>
                                                </div>

                                                <span className="text-lg font-bold text-primary">
                                                    $
                                                    {tour.price.toLocaleString()}
                                                </span>

                                                <span className="ml-1 text-xs text-muted-foreground">
                                                    {t('tours.person')}
                                                </span>
                                            </div>

                                            <Button className="text-primary-foreground">
                                                {t('tours.bookTour')}
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

export default Tours;
