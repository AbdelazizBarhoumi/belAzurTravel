import { motion } from 'framer-motion';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Gallery } from '@/components/Gallery';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
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

interface Tour {
  name: LocalizedText | string;
  description: LocalizedText | string;
    itinerary: Array<{day: number; title: LocalizedText | string; details?: LocalizedText | string;} | string>;
    includes?: Array<LocalizedText | string>;
    inclusions?: Array<LocalizedText | string>;
    excludes?: Array<LocalizedText | string>;
    exclusions?: Array<LocalizedText | string>;
}

function DayByDayAndIncludes({ tour, t, lang }: { tour: Tour; t: (k: string) => string; lang: Lang; }) {
    // normalize title and description (support both localized and plain strings)
    // (kept for component setup, but not used in render)

    // normalize itinerary to objects {day, title, details}
    const itinerary = (tour.itinerary || []).map((item, idx) => {
        if (typeof item === 'string') {
            return { day: idx + 1, title: item, details: '' };
        }
        return item;
    });

    const includes = tour.includes || tour.inclusions || [];
    const excludes = tour.excludes || tour.exclusions || [];

    return (
        <>
            <section className="mb-12">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">{t('tourDetail.dayByDay') || 'Day-by-day itinerary'}</h2>
                <ol className="relative border-l-2 border-border ml-3 max-w-3xl space-y-6">
                    {itinerary.map((d: {day: number; title: LocalizedText | string; details?: LocalizedText | string;}) => (
                        <li key={d.day} className="ml-6">
                            <div className="absolute -left-[14px] w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{d.day}</div>
                            <h3 className="font-serif text-lg font-bold text-foreground">{typeof d.title === 'string' ? d.title : localize(d.title, lang)}</h3>
                            {d.details ? <p className="text-sm text-muted-foreground">{typeof d.details === 'string' ? d.details : localize(d.details, lang)}</p> : null}
                        </li>
                    ))}
                </ol>
            </section>

            <section className="grid md:grid-cols-2 gap-6 max-w-4xl">
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <h3 className="font-serif text-xl font-bold text-foreground mb-4">{t('tourDetail.included') || "What's included"}</h3>
                    <ul className="space-y-2">
                        {(includes || []).map((i) => (
                            <li key={typeof i === 'string' ? i : i.en} className="flex items-start gap-2 text-sm text-foreground"><CheckIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />{typeof i === 'string' ? i : localize(i, lang)}</li>
                        ))}
                    </ul>
                </div>
                <div className="bg-card rounded-2xl p-6 border border-border">
                    <h3 className="font-serif text-xl font-bold text-foreground mb-4">{t('tourDetail.notIncluded') || 'Not included'}</h3>
                    <ul className="space-y-2">
                        {(excludes || []).map((i) => (
                            <li key={typeof i === 'string' ? i : i.en} className="flex items-start gap-2 text-sm text-muted-foreground"><XIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />{typeof i === 'string' ? i : localize(i, lang)}</li>
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
        type: { fr: 'Circuit', ar: 'جولة', en: 'Circuit' },
        location: [
            { fr: 'Santorin', ar: 'سانتوريني', en: 'Santorini' },
            { fr: 'Mykonos', ar: 'ميكونوس', en: 'Mykonos' },
            { fr: 'Naxos', ar: 'ناكسوس', en: 'Naxos' },
        ],
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
                title: { fr: 'Arrivée et dîner de bienvenue à Santorin', ar: 'الوصول وعشاء ترحيبي في سانتوريني', en: 'Arrival and welcome dinner in Santorini' },
                details: { fr: 'Installez-vous à l’hôtel, rencontrez votre accompagnateur et savourez un dîner de bienvenue face au coucher du soleil sur la caldeira.', ar: 'استقر في الفندق، تعرّف على مضيف الرحلة، واستمتع بعشاء ترحيبي عند الغروب مطل على الكالديرا.', en: 'Settle into your hotel, meet your travel host, and enjoy a sunset welcome dinner overlooking the caldera.' },
            },
            {
                day: 2,
                title: { fr: 'Visite de la caldeira et coucher du soleil', ar: 'جولة الكالديرا والغروب', en: 'Caldera tour and sunset' },
                details: { fr: 'Naviguez dans la caldeira, visitez les belvédères volcaniques et terminez la journée par une vue au coucher du soleil depuis la falaise.', ar: 'أبحر في الكالديرا، زر نقاط المشاهدة البركانية، وأنهِ اليوم بتجربة غروب من على المنحدر.', en: 'Cruise the caldera by boat, visit volcanic viewpoints, and end the day with a cliffside sunset experience.' },
            },
            {
                day: 3,
                title: { fr: 'Traversée vers Mykonos et plage', ar: 'العبّارة إلى ميكونوس ووقت الشاطئ', en: 'Ferry to Mykonos and beach time' },
                details: { fr: 'Prenez le ferry pour Mykonos, installez-vous dans votre boutique-hôtel et passez l’après-midi dans un beach club détendu.', ar: 'استقل العبّارة إلى ميكونوس، استقر في إقامتك البوتيكية، واقضِ بعد الظهر في نادٍ شاطئي هادئ.', en: 'Take the ferry to Mykonos, check into your boutique stay, and spend the afternoon at a relaxed beach club.' },
            },
        ],
        inclusions: [
            { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast' },
            { fr: 'Transferts en ferry', ar: 'نقل بالعبّارة', en: 'Ferry transfers' },
            { fr: 'Guide local', ar: 'مرشد محلي', en: 'Local guide' },
        ],
        excludes: [
            { fr: 'Vols internationaux', ar: 'الرحلات الدولية', en: 'International flights' },
            { fr: 'Assurance voyage', ar: 'تأمين السفر', en: 'Travel insurance' },
            { fr: 'Dépenses personnelles', ar: 'المصاريف الشخصية', en: 'Personal expenses' },
        ],
        description: { fr: 'Explorez les Cyclades avec des traversées en ferry, des villages blancs et des plages secrètes.', ar: 'استكشف السيكلاديس عبر العبارات والقرى البيضاء والشواطئ السرية.', en: 'Explore the Cyclades with ferry crossings, white villages, and hidden beaches.' },
    },
    {
        slug: 'bali-cultural-immersion',
        name: { fr: 'Immersion Culturelle à Bali', ar: 'انغمس في ثقافة بالي', en: 'Bali Cultural Immersion' },
        type: { fr: 'Retraite', ar: 'منتجع', en: 'Retreat' },
        location: [
            { fr: 'Ubud', ar: 'أوبود', en: 'Ubud' },
        ],
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
                title: { fr: 'Arrivée à Ubud', ar: 'الوصول إلى أوبود', en: 'Arrival in Ubud' },
                details: { fr: 'Arrivez au cœur culturel de Bali, installez-vous à votre retraite et profitez d’une cérémonie de bienvenue apaisante.', ar: 'صل إلى القلب الثقافي لبالي، استقر في المنتجع، واستمتع بحفل ترحيبي هادئ.', en: 'Arrive in the cultural heart of Bali, check in to your retreat, and enjoy a soothing welcome ceremony.' },
            },
            {
                day: 2,
                title: { fr: 'Visites de temples', ar: 'زيارات المعابد', en: 'Temple visits' },
                details: { fr: 'Explorez des temples sacrés, découvrez les traditions hindoues balinaises et savourez un déjeuner local au village.', ar: 'استكشف المعابد المقدسة، وتعرّف إلى التقاليد الهندوسية البالية، واستمتع بغداء محلي في القرية.', en: 'Explore sacred temples, learn about Balinese Hindu traditions, and enjoy a local lunch in the village.' },
            },
            {
                day: 3,
                title: { fr: 'Rizières et cours de cuisine', ar: 'مدرجات الأرز وورشة طبخ', en: 'Rice terraces and cooking class' },
                details: { fr: 'Marchez parmi les rizières émeraude le matin avant de participer à un cours de cuisine balinaise pratique.', ar: 'تجوّل بين مدرجات الأرز الخضراء صباحًا قبل الانضمام إلى درس طبخ بالي عملي.', en: 'Walk through emerald rice terraces in the morning before joining a hands-on Balinese cooking class.' },
            },
        ],
        inclusions: [
            { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast' },
            { fr: 'Transfert aéroport', ar: 'نقل من المطار', en: 'Airport transfer' },
            { fr: 'Activités mentionnées', ar: 'الأنشطة المذكورة', en: 'Activities as listed' },
        ],
        excludes: [
            { fr: 'Frais de visa', ar: 'رسوم التأشيرة', en: 'Visa fees' },
            { fr: 'Déjeuner et dîner', ar: 'الغداء والعشاء', en: 'Lunch and dinner' },
            { fr: 'Soins spa optionnels', ar: 'علاجات سبا اختيارية', en: 'Optional spa treatments' },
        ],
        description: { fr: 'Temples, cérémonies et paysages de rizières pour une immersion profonde.', ar: 'معابد وطقوس ومناظر أرز لرحلة غامرة.', en: 'Temples, ceremonies, and rice landscapes for deep immersion.' },
    },
    {
        slug: 'paris-art-gastronomy',
        name: { fr: 'Paris: Art et Gastronomie', ar: 'باريس: الفن والطعام', en: 'Parisian Art & Gastronomy' },
        type: { fr: 'Séjour urbain', ar: 'عطلة مدينة', en: 'City Break' },
        location: [
            { fr: 'Paris', ar: 'باريس', en: 'Paris' },
        ],
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
                title: { fr: 'Louvre et promenade sur la Seine', ar: 'اللوفر ونزهة على السين', en: 'Louvre and Seine walk' },
                details: { fr: 'Commencez par une visite privée du musée puis une balade guidée le long de la Seine pour profiter de l’atmosphère parisienne.', ar: 'ابدأ بزيارة خاصة للمتحف ثم نزهة بصحبة مرشد على ضفاف السين للاستمتاع بأجواء باريس.', en: 'Begin with a private museum visit and a guided walk along the Seine to soak in Parisian atmosphere.' },
            },
            {
                day: 2,
                title: { fr: 'Cours de cuisine et marché', ar: 'درس طبخ وزيارة سوق', en: 'Cooking class and market visit' },
                details: { fr: 'Faites vos achats au marché local puis cuisinez un menu français classique avec un chef instructeur.', ar: 'تسوّق في السوق المحلي ثم اطبخ قائمة فرنسية كلاسيكية مع طاهٍ مدرّب.', en: 'Shop for fresh ingredients at a local market, then cook a classic French menu with a chef instructor.' },
            },
            {
                day: 3,
                title: { fr: 'Visite de musée', ar: 'جولة متحفية', en: 'Museum tour' },
                details: { fr: 'Profitez d’un programme artistique sélectionné avec commentaires d’experts et du temps libre pour explorer une galerie préférée à votre rythme.', ar: 'استمتع ببرنامج فني منسّق مع تعليق من خبراء ووقت لاستكشاف معرض مفضل على وتيرتك.', en: 'Enjoy a curated art itinerary with expert commentary and time to explore a favorite gallery at your own pace.' },
            },
        ],
        inclusions: [
            { fr: 'Petit-déjeuner', ar: 'الإفطار', en: 'Breakfast' },
            { fr: 'Entrées des musées mentionnées', ar: 'دخول المتاحف المذكور', en: 'Museum entries as listed' },
        ],
        excludes: [
            { fr: 'Transferts aéroport', ar: 'نقل من المطار', en: 'Airport transfers' },
            { fr: 'Déjeuners et dîners', ar: 'الغداء والعشاء', en: 'Lunches and dinners' },
            { fr: 'Pourboires', ar: 'الإكراميات', en: 'Gratuities' },
        ],
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
                                    <Gallery images={tour.images || []} hotelName={typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name} />
                                </div>
                            </motion.div>

                            <div className="lg:hidden">
                                <StickyBookingCard
                                    price={tour.pricePerPerson}
                                    currency="$"
                                    priceLabel={t('common.from')}
                                    priceSuffix={t('tours.person')}
                                    title={typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name}
                                    location={Array.isArray(tour.location) ? tour.location.map((item) => (typeof item === 'string' ? item : localize(item, lang))).join(', ') : tour.location}
                                    description={typeof tour.description === 'object' ? localize(tour.description, lang) : tour.description}
                                    duration={`${tour.durationDays} ${t('common.days')} / ${tour.durationNights} ${t('common.nights')}`}
                                    maxGroup={tour.maxGroup}
                                    rating={tour.rating}
                                    favoriteItem={{
                                        id: `tour-${tour.slug}`,
                                        type: 'tour',
                                        name: typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name,
                                        image: tour.images?.[0] ?? '',
                                        price: tour.pricePerPerson,
                                        location: Array.isArray(tour.location) ? tour.location.map((item) => (typeof item === 'string' ? item : localize(item, lang))).join(', ') : tour.location,
                                    }}
                                    primaryButtonLabel={t('tours.bookTour')}
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
                                priceLabel={t('common.from')}
                                priceSuffix={t('tours.person')}
                                title={typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name}
                                location={Array.isArray(tour.location) ? tour.location.map((item) => (typeof item === 'string' ? item : localize(item, lang))).join(', ') : tour.location}
                                description={typeof tour.description === 'object' ? localize(tour.description, lang) : tour.description}
                                duration={`${tour.durationDays} ${t('common.days')} / ${tour.durationNights} ${t('common.nights')}`}
                                maxGroup={tour.maxGroup}
                                rating={tour.rating}
                                favoriteItem={{
                                    id: `tour-${tour.slug}`,
                                    type: 'tour',
                                    name: typeof tour.name === 'object' ? localize(tour.name, lang) : tour.name,
                                    image: tour.images?.[0] ?? '',
                                    price: tour.pricePerPerson,
                                        location: Array.isArray(tour.location) ? tour.location.map((item) => (typeof item === 'string' ? item : localize(item, lang))).join(', ') : tour.location,
                                }}
                                primaryButtonLabel={t('tours.bookTour')}
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