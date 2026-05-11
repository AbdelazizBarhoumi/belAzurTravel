import { motion } from 'framer-motion';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FeaturedTags } from '@/components/FeatureTags';
import { Footer } from '@/components/Footer';
import { Gallery } from '@/components/Gallery';
import { IncludedSection } from '@/components/IncludedSection';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { TourItineraryTimeline } from '@/components/TourItineraryTimeline';
import { TourSummary } from '@/components/TourSummary';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const TOUR_DETAILS = [
    {
        slug: 'greek-island-hopping',
        name: { fr: 'Îles Grecques en Liberté', ar: 'جولة الجزر اليونانية', en: 'Greek Island Hopping' },
        type: 'Circuit',
        location: ['Santorini', 'Mykonos', 'Naxos'],
        durationDays: 7,
        durationNights: 6,
        maxGroup: 12,
        pricePerPerson: 2499,
        rating: 4.9,
        images: [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&h=900&fit=crop',
            'https://images.unsplash.com/photo-1505765057921-4b6cf2d7fbf8?w=1200&h=800&fit=crop',
        ],
        tags: ['islands', 'beach', 'culture'],
        itinerary: [
            'Day 1: Arrival and welcome dinner in Santorini',
            'Day 2: Caldera tour and sunset',
            'Day 3: Ferry to Mykonos and beach time',
        ],
        inclusions: ['Breakfast', 'Ferry transfers', 'Local guide'],
        description: { fr: 'Explorez les Cyclades avec des traversées en ferry, des villages blancs et des plages secrètes.', ar: 'استكشف السيكلاديس عبر العبارات والقرى البيضاء والشواطئ السرية.', en: 'Explore the Cyclades with ferry crossings, white villages, and hidden beaches.' },
    },
    {
        slug: 'bali-cultural-immersion',
        name: { fr: 'Immersion Culturelle à Bali', ar: 'انغمس في ثقافة بالي', en: 'Bali Cultural Immersion' },
        type: 'Retreat',
        location: ['Ubud'],
        durationDays: 10,
        durationNights: 9,
        maxGroup: 8,
        pricePerPerson: 1899,
        rating: 4.8,
        images: [
            'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&h=900&fit=crop',
        ],
        tags: ['wellness', 'culture'],
        itinerary: ['Day 1: Arrival in Ubud', 'Day 2: Temple visits', 'Day 3: Rice terraces and cooking class'],
        inclusions: ['Breakfast', 'Airport transfer', 'Activities as listed'],
        description: { fr: 'Temples, cérémonies et paysages de rizières pour une immersion profonde.', ar: 'معابد وطقوس ومناظر أرز لرحلة غامرة.', en: 'Temples, ceremonies, and rice landscapes for deep immersion.' },
    },
    {
        slug: 'paris-art-gastronomy',
        name: { fr: 'Paris: Art et Gastronomie', ar: 'باريس: الفن والطعام', en: 'Parisian Art & Gastronomy' },
        type: 'City Break',
        location: ['Paris'],
        durationDays: 5,
        durationNights: 4,
        maxGroup: 10,
        pricePerPerson: 3200,
        rating: 4.9,
        images: [
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&h=900&fit=crop',
        ],
        tags: ['food', 'art', 'city'],
        itinerary: ['Day 1: Louvre and Seine walk', 'Day 2: Cooking class and market visit', 'Day 3: Museum tour'],
        inclusions: ['Breakfast', 'Museum entries as listed'],
        description: { fr: 'Musées, gastronomie et promenades élégantes dans la capitale.', ar: 'متاحف ومأكولات فاخرة ومشي أنيق في العاصمة.', en: 'Museums, cuisine, and elegant walks through the capital.' },
    },
];

export default function TourDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();

    const tour = TOUR_DETAILS.find((item) => item.slug === slug);

    if (!tour) {
        return <Navigate to="/tours" replace />;
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
                                { label: t('nav.tours'), href: '/tours' },
                                { label: localize(tour.name, lang), active: true },
                            ]}
                        />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-8">
                            <TourSummary
                                title={localize(tour.name, lang)}
                                type={tour.type}
                                locations={tour.location}
                                durationDays={tour.durationDays}
                                durationNights={tour.durationNights}
                                rating={tour.rating}
                            />

                            <Gallery images={tour.images} hotelName={localize(tour.name, lang)} />

                            <FeaturedTags tags={tour.tags} />

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
                                    <h3 className="mb-3 font-serif text-xl font-bold">{t('tourDetail.about')}</h3>
                                    <p className="text-foreground">{localize(tour.description, lang)}</p>
                                    <h4 className="mt-6 mb-2 font-semibold">{t('tourDetail.itinerary')}</h4>
                                    <ol className="list-inside list-decimal space-y-2 text-foreground">
                                        {tour.itinerary.map((step, i) => (
                                            <li key={i}>{step}</li>
                                        ))}
                                    </ol>
                                </div>

                                <IncludedSection inclusions={tour.inclusions} />
                            </div>
                            <TourItineraryTimeline itinerary={tour.itinerary} />
                        </div>

                        <aside className="lg:pt-6">
                            <StickyBookingCard
                                price={tour.pricePerPerson}
                                currency="$"
                                duration={`${tour.durationDays} ${t('common.days')} / ${tour.durationNights} ${t('common.nights')}`}
                                type={tour.type}
                                rating={tour.rating}
                                onBook={() => {
                                    // simple reservation flow: scroll to booking or open modal
                                    alert(t('tourDetail.bookingFlow'));
                                }}
                            />
                        </aside>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}