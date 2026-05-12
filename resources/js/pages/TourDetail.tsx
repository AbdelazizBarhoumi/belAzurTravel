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

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13l4 4L19 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function DayByDayAndIncludes({ tour, t, lang }: { tour: any; t: (k: string) => string; lang: Lang }) {
    // normalize title and description (support both localized and plain strings)
    const title = typeof tour.name === 'object' ? localize(tour.name as LocalizedText, lang) : tour.name;
    const description = typeof tour.description === 'object' ? localize(tour.description as LocalizedText, lang) : tour.description;

    // normalize itinerary to objects {day, title, details}
    const itinerary = (tour.itinerary || []).map((item: any, idx: number) => {
        if (typeof item === 'string') {
            return { day: idx + 1, title: item, details: '' };
        }
        return item;
    });

    const includes = tour.includes || tour.inclusions || tour.includes || [];
    const excludes = tour.excludes || tour.exclusions || [];

    return (
        <>
            <section className="mb-12">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">{t('tourDetail.dayByDay') || 'Day-by-day itinerary'}</h2>
                <ol className="relative border-l-2 border-border ml-3 max-w-3xl space-y-6">
                    {itinerary.map((d: any) => (
                        <li key={d.day} className="ml-6">
                            <div className="absolute -left-[14px] w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{d.day}</div>
                            <h3 className="font-serif text-lg font-bold text-foreground">{d.title}</h3>
                            {d.details ? <p className="text-sm text-muted-foreground">{d.details}</p> : null}
                        </li>
                    ))}
                </ol>
            </section>

            <section className="grid md:grid-cols-2 gap-6 max-w-4xl">
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <h3 className="font-serif text-xl font-bold text-foreground mb-4">{t('tourDetail.included') || "What's included"}</h3>
                    <ul className="space-y-2">
                        {(includes || []).map((i: string) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />{i}</li>
                        ))}
                    </ul>
                </div>
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <h3 className="font-serif text-xl font-bold text-foreground mb-4">{t('tourDetail.notIncluded') || 'Not included'}</h3>
                    <ul className="space-y-2">
                        {(excludes || []).map((i: string) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><XIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />{i}</li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    );
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
            {
                day: 1,
                title: 'Arrival and welcome dinner in Santorini',
                details: 'Settle into your hotel, meet your travel host, and enjoy a sunset welcome dinner overlooking the caldera.',
            },
            {
                day: 2,
                title: 'Caldera tour and sunset',
                details: 'Cruise the caldera by boat, visit volcanic viewpoints, and end the day with a cliffside sunset experience.',
            },
            {
                day: 3,
                title: 'Ferry to Mykonos and beach time',
                details: 'Take the ferry to Mykonos, check into your boutique stay, and spend the afternoon at a relaxed beach club.',
            },
        ],
        inclusions: ['Breakfast', 'Ferry transfers', 'Local guide'],
        excludes: ['International flights', 'Travel insurance', 'Personal expenses'],
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
        itinerary: [
            {
                day: 1,
                title: 'Arrival in Ubud',
                details: 'Arrive in the cultural heart of Bali, check in to your retreat, and enjoy a soothing welcome ceremony.',
            },
            {
                day: 2,
                title: 'Temple visits',
                details: 'Explore sacred temples, learn about Balinese Hindu traditions, and enjoy a local lunch in the village.',
            },
            {
                day: 3,
                title: 'Rice terraces and cooking class',
                details: 'Walk through emerald rice terraces in the morning before joining a hands-on Balinese cooking class.',
            },
        ],
        inclusions: ['Breakfast', 'Airport transfer', 'Activities as listed'],
        excludes: ['Visa fees', 'Lunch and dinner', 'Optional spa treatments'],
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
        itinerary: [
            {
                day: 1,
                title: 'Louvre and Seine walk',
                details: 'Begin with a private museum visit and a guided walk along the Seine to soak in Parisian atmosphere.',
            },
            {
                day: 2,
                title: 'Cooking class and market visit',
                details: 'Shop for fresh ingredients at a local market, then cook a classic French menu with a chef instructor.',
            },
            {
                day: 3,
                title: 'Museum tour',
                details: 'Enjoy a curated art itinerary with expert commentary and time to explore a favorite gallery at your own pace.',
            },
        ],
        inclusions: ['Breakfast', 'Museum entries as listed'],
        excludes: ['Airport transfers', 'Lunches and dinners', 'Gratuities'],
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
                            {/* Gallery + summary card (left gallery, right card) */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-8 mb-12">
                                <div className="lg:col-span-2">
                                    <Gallery images={tour.images || (tour as any).gallery || []} hotelName={typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name} />
                                </div>
                            </motion.div>

                            <div className="lg:hidden">
                                <StickyBookingCard
                                    price={tour.pricePerPerson}
                                    currency="$"
                                    title={typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name}
                                    location={tour.location}
                                    description={typeof tour.description === 'object' ? localize(tour.description, lang) : tour.description}
                                    duration={`${tour.durationDays} ${t('common.days')} / ${tour.durationNights} ${t('common.nights')}`}
                                    maxGroup={tour.maxGroup}
                                    type={tour.type}
                                    rating={tour.rating}
                                    favoriteItem={{
                                        id: `tour-${tour.slug}`,
                                        type: 'tour',
                                        name: typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name,
                                        image: tour.images?.[0] ?? '',
                                        price: tour.pricePerPerson,
                                        location: Array.isArray(tour.location) ? tour.location.join(', ') : tour.location,
                                    }}
                                    onBook={() => {
                                        // simple reservation flow: scroll to booking or open modal
                                        alert(t('tourDetail.bookingFlow'));
                                    }}
                                />
                            </div>

                            {/* Day-by-day itinerary, includes and excludes component */}
                            <DayByDayAndIncludes tour={tour} t={t} lang={lang} />
                        </div>

                        <aside className="hidden lg:block">
                            <StickyBookingCard
                                price={tour.pricePerPerson}
                                currency="$"
                                title={typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name}
                                location={tour.location}
                                description={typeof tour.description === 'object' ? localize(tour.description, lang) : tour.description}
                                duration={`${tour.durationDays} ${t('common.days')} / ${tour.durationNights} ${t('common.nights')}`}
                                maxGroup={tour.maxGroup}
                                type={tour.type}
                                rating={tour.rating}
                                favoriteItem={{
                                    id: `tour-${tour.slug}`,
                                    type: 'tour',
                                    name: typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name,
                                    image: tour.images?.[0] ?? '',
                                    price: tour.pricePerPerson,
                                    location: Array.isArray(tour.location) ? tour.location.join(', ') : tour.location,
                                }}
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

function MapPinIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21s-6.5-4.35-8.5-7.5A7.5 7.5 0 0112 3a7.5 7.5 0 018.5 10.5C18.5 16.65 12 21 12 21z" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.5" strokeWidth={1} />
        </svg>
    );
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 .587l3.668 7.568L24 9.423l-6 5.857L19.336 24 12 19.897 4.664 24 6 15.28 0 9.423l8.332-1.268z" />
        </svg>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
            <path d="M12 7v6l4 2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="7" r="4" strokeWidth={1.5} />
        </svg>
    );
}

function FavoriteButton({ item }: { item: any }) {
    return (
        <button type="button" aria-label="favorite" className="rounded-full bg-card p-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.8 4.6a5.5 5.5 0 00-7.78 0L12 5.6l-1.02-1a5.5 5.5 0 10-7.78 7.78L12 21.2l8.8-8.82a5.5 5.5 0 000-7.78z" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}