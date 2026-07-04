import { motion } from 'framer-motion';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTravels } from '@/hooks/usePublicData';

interface Props { config: LandingSectionConfig; }

export function OrganizedSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { data: travels = [] } = useTravels();

    const title = config.title?.[lang] ?? config.title?.en ?? t('home.featuredOrganized');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? t('home.featuredOrganizedDesc');

    // Filter travels with "per-group" pricing type
    const groupTravels = travels.filter(
        (v) => v.category_assignments?.pricing_type === 'per-group',
    );

    const items = groupTravels.map((travel) => ({
        id: travel.slug,
        title: travel.name[lang] || travel.name.en,
        price: `${travel.price.toLocaleString()} DT`,
        meta: travel.duration[lang] || travel.duration.en,
        image: travel.image,
        href: `/travels/${travel.slug}`,
    }));

    if (items.length === 0) return null;

    return (
        <HorizontalDeals
            eyebrow={t('home.ourBest')}
            title={title}
            description={subtitle}
            ctaLabel={t('common.viewAll')}
            ctaHref="/travels"
            items={items}
            accent="secondary"
        />
    );
}
