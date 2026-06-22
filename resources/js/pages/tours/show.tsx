import { motion } from 'framer-motion';
import { useParams, Navigate } from 'react-router-dom';
import { StickyBookingCard } from '@/components/cards/StickyBookingCard';
import { PageShell } from '@/components/layout/PageShell';
import { Gallery } from '@/components/media/Gallery';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTourDetailsBySlug } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

function localizeLocation(
    value: LocalizedText | LocalizedText[] | string | string[],
    lang: Lang,
): string {
    if (Array.isArray(value)) {
        return value
            .map((item) =>
                typeof item === 'string' ? item : localize(item, lang),
            )
            .join(', ');
    }
    return typeof value === 'string' ? value : localize(value, lang);
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M5 13l4 4L19 7"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M18 6L6 18M6 6l12 12"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

interface Tour {
    slug: string;
    name: LocalizedText | string;
    description: LocalizedText | string;
    location: LocalizedText | LocalizedText[] | string | string[];
    type: LocalizedText | string;
    durationDays: number;
    durationNights: number;
    maxGroup: number;
    rating: number;
    price: number;
    image: string;
    gallery?: string[];
    images?: string[];
    itinerary: Array<
        | {
              day: number;
              title: LocalizedText | string;
              details?: LocalizedText | string;
          }
        | string
    >;
    includes?: Array<LocalizedText | string>;
    inclusions?: Array<LocalizedText | string>;
    excludes?: Array<LocalizedText | string>;
    exclusions?: Array<LocalizedText | string>;
}

function DayByDayAndIncludes({
    tour,
    t,
    lang,
}: {
    tour: Tour;
    t: (k: string) => string;
    lang: Lang;
}) {
    const itinerary = (tour.itinerary || []).map((item, idx) => {
        if (typeof item === 'string') {
            return { day: idx + 1, title: item, details: '' };
        }
        return { ...item, day: (item as { day?: number }).day || idx + 1 };
    });

    const includes = tour.includes || tour.inclusions || [];
    const excludes = tour.excludes || tour.exclusions || [];

    const hasItinerary = itinerary.length > 0;
    const hasIncludes = includes.length > 0;
    const hasExcludes = excludes.length > 0;

    return (
        <>
            {hasItinerary && (
                <section className="mb-12">
                    <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
                        {t('tourDetail.dayByDay') || 'Day-by-day itinerary'}
                    </h2>
                    <ol
                        className={`relative max-w-3xl space-y-6 border-border ${
                            lang === 'ar' ? 'mr-3 border-r-2' : 'ml-3 border-l-2'
                        }`}
                    >
                        {' '}
                        {itinerary.map(
                            (d: {
                                day: number;
                                title: LocalizedText | string;
                                details?: LocalizedText | string;
                            }) => (
                                <li
                                    key={d.day}
                                    className={lang === 'ar' ? 'mr-6' : 'ml-6'}
                                >
                                    {' '}
                                    <div
                                        className={`absolute flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ${
                                            lang === 'ar'
                                                ? '-right-[14px]'
                                                : '-left-[14px]'
                                        }`}
                                    >
                                        {d.day}
                                    </div>
                                    <h3 className="font-serif text-lg font-bold text-foreground">
                                        {typeof d.title === 'string'
                                            ? d.title
                                            : localize(d.title, lang)}
                                    </h3>
                                    {d.details ? (
                                        <p className="text-sm text-muted-foreground">
                                            {typeof d.details === 'string'
                                                ? d.details
                                                : localize(d.details, lang)}
                                        </p>
                                    ) : null}
                                </li>
                            ),
                        )}
                    </ol>
                </section>
            )}

            {(hasIncludes || hasExcludes) && (
                <section className="grid max-w-7xl gap-6 md:grid-cols-2">
                    {hasIncludes && (
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-serif text-xl font-bold text-foreground">
                                {t('tourDetail.included') || "What's included"}
                            </h3>
                            <ul className="space-y-2">
                                {(includes || []).map((i) => (
                                    <li
                                        key={
                                            typeof i === 'string'
                                                ? i
                                                : (i as LocalizedText).en
                                        }
                                        className="flex items-start gap-2 text-sm text-foreground"
                                    >
                                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        {typeof i === 'string'
                                            ? i
                                            : typeof i === 'object' && 'name' in i
                                              ? localize(
                                                    (i as { name: LocalizedText }).name,
                                                    lang,
                                                )
                                              : localize(i as LocalizedText, lang)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {hasExcludes && (
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-serif text-xl font-bold text-foreground">
                                {t('tourDetail.notIncluded') || 'Not included'}
                            </h3>
                            <ul className="space-y-2">
                                {(excludes || []).map((i) => (
                                    <li
                                        key={
                                            typeof i === 'string'
                                                ? i
                                                : (i as LocalizedText).en
                                        }
                                        className="flex items-start gap-2 text-sm text-muted-foreground"
                                    >
                                        <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                                        {typeof i === 'string'
                                            ? i
                                            : typeof i === 'object' && 'name' in i
                                              ? localize(
                                                    (i as { name: LocalizedText }).name,
                                                    lang,
                                                )
                                              : localize(i as LocalizedText, lang)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            )}
        </>
    );
}

export default function TourDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const { data: tour, isLoading } = useTourDetailsBySlug(slug);

    if (isLoading) {
        return null;
    }

    if (!tour) {
        return <Navigate to="/tours" replace />;
    }

    const otherImages =
        Array.isArray(tour.gallery) && tour.gallery.length > 0
            ? tour.gallery
            : Array.isArray(tour.images) && tour.images.length > 0
              ? tour.images
              : [];

    // Prefer the explicit `image` as the hero/main image (like other entities).
    // Ensure it's first in the gallery list, and avoid duplicates.
    const galleryImages = tour.image
        ? [tour.image, ...otherImages.filter((i) => i !== tour.image)]
        : otherImages.length
          ? otherImages
          : [];

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.tours'), href: '/tours' },
                {
                    label:
                        typeof tour.name === 'object'
                            ? localize(tour.name, lang)
                            : tour.name,
                    active: true,
                },
            ]}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-10 lg:grid-cols-[2fr_1fr]"
            >
                <div className="space-y-8">
                    {/* Gallery + summary card (left gallery, right card) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 grid gap-8 lg:grid-cols-2"
                    >
                        <div className="lg:col-span-2">
                            <Gallery
                                images={galleryImages}
                                hotelName={
                                    typeof tour.name === 'object'
                                        ? localize(tour.name, lang)
                                        : tour.name
                                }
                                favoriteItem={{
                                    id: `tour-${tour.slug}`,
                                    type: 'tour',
                                    name:
                                        typeof tour.name === 'object'
                                            ? localize(tour.name, lang)
                                            : tour.name,
                                    image: tour.image,
                                    price: tour.price,
                                    location: localizeLocation(
                                        tour.location,
                                        lang,
                                    ),
                                }}
                            />
                        </div>
                    </motion.div>

                    <div className="lg:hidden">
                        <StickyBookingCard
                            price={tour.price}
                            currency="TND"
                            priceLabel={t('common.from')}
                            priceSuffix={t('tours.person')}
                            title={
                                typeof tour.name === 'object'
                                    ? localize(tour.name, lang)
                                    : tour.name
                            }
                            location={localizeLocation(tour.location, lang)}
                            description={
                                typeof tour.description === 'object'
                                    ? localize(tour.description, lang)
                                    : tour.description
                            }
                            entityType="tour"
                            itemSlug={tour.slug}
                            duration={`${tour.durationDays} ${t('common.days')} / ${tour.durationNights} ${t('common.nights')}`}
                            maxGroup={tour.maxGroup}
                            rating={tour.rating}
                            primaryButtonLabel={t('tours.bookTour')}
                        />
                    </div>

                    <DayByDayAndIncludes tour={tour} t={t} lang={lang} />
                </div>

                <aside className="hidden lg:block">
                    <StickyBookingCard
                        price={tour.price}
                        currency="TND"
                        priceLabel={t('common.from')}
                        priceSuffix={t('tours.person')}
                        title={
                            typeof tour.name === 'object'
                                ? localize(tour.name, lang)
                                : tour.name
                        }
                        location={localizeLocation(tour.location, lang)}
                        description={
                            typeof tour.description === 'object'
                                ? localize(tour.description, lang)
                                : tour.description
                        }
                        duration={`${tour.durationDays} ${t('common.days')} / ${tour.durationNights} ${t('common.nights')}`}
                        maxGroup={tour.maxGroup}
                        rating={tour.rating}
                        primaryButtonLabel={t('tours.bookTour')}
                        onBook={() => {
                            // simple reservation flow: scroll to booking or open modal
                            alert(t('tourDetail.bookingFlow'));
                        }}
                    />
                </aside>
            </motion.div>
        </PageShell>
    );
}
