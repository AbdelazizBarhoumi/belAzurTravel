import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { HorizontalDeals } from '@/components/sections/HorizontalDeals';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVisas } from '@/hooks/usePublicData';

interface Props { config: LandingSectionConfig; }

export function VisaSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { data: response } = useVisas();
    const visas = response?.data ?? [];

    const title = config.title?.[lang] ?? config.title?.en ?? t('admin.section.visas');
    const subtitle = config.subtitle?.[lang] ?? config.subtitle?.en ?? '';

    const items = visas.map((visa) => ({
        id: visa.code,
        title: visa.name,
        price: `${visa.price} DT`,
        meta: visa.processing,
        image: visa.flag,
        href: `/visa`,
    }));

    if (items.length === 0) return null;

    const style = config.style ?? 'carousel';

    if (style === 'carousel') {
        return (
            <HorizontalDeals
                eyebrow={t('home.ourBest')}
                title={title}
                description={subtitle}
                ctaLabel={t('common.viewAll')}
                ctaHref="/visa"
                items={items}
                accent="primary"
            />
        );
    }

    const displayItems = style === 'grid' ? visas.slice(0, 6) : visas.slice(0, 3);

    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
                    {subtitle && <p className="mx-auto max-w-xl text-muted-foreground">{subtitle}</p>}
                </motion.div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {displayItems.map((visa, i) => (
                        <Link key={visa.code} to="/visa" className="group">
                            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                <div className="flex items-center gap-4 p-5">
                                    <span className="text-5xl">{visa.flag}</span>
                                    <div className="flex-1">
                                        <h3 className="font-serif text-lg font-bold">{visa.name}</h3>
                                        <p className="text-xs text-muted-foreground">{visa.processing}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-secondary">{visa.price} DT</span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
