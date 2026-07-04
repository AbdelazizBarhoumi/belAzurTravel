import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTours } from '@/hooks/usePublicData';

interface Props { config: LandingSectionConfig; }

export function ToursSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { data: tours = [] } = useTours();

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredTours');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredToursDesc');

    const items = tours.map((tour) => ({
        id: tour.slug,
        title: tour.name[lang] || tour.name.en,
        price: `${tour.price.toLocaleString()} DT`,
        meta: tour.duration[lang] || tour.duration.en,
        image: tour.image,
        href: `/tours/${tour.slug}`,
    }));

    if (items.length === 0) return null;

    return (
        <HorizontalDeals
            eyebrow={t('home.ourBest')}
            title={title}
            description={subtitle}
            ctaLabel={t('common.viewAll')}
            ctaHref="/tours"
            items={items}
            accent="primary"
        />
    );
}
