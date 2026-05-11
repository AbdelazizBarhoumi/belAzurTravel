import { motion } from 'framer-motion';
import { Users, Fuel, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { carsData } from '@/data/cars.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const Cars = () => {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();

    return (
        <PageShell
            titleKey="cars.title"
            subtitleKey="cars.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.cars'), active: true },
            ]}
        >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {carsData.map((c, i) => (
                    <motion.div
                        key={c.slug}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="card-elevated group overflow-hidden rounded-2xl bg-card"
                    >
                        <div className="h-44 overflow-hidden">
                            <img
                                src={c.image}
                                alt={localize(c.name, lang)}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                        <div className="p-5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                                {localize(c.category, lang)}
                            </span>
                            <h3 className="mb-3 mt-1 font-serif text-lg font-bold text-foreground">
                                {localize(c.name, lang)}
                            </h3>
                            <div className="mb-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" /> {c.seats}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Fuel className="h-3 w-3" /> {localize(c.fuel, lang)}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Settings2 className="h-3 w-3" /> {localize(c.transmission, lang)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-primary">
                                    ${c.price}
                                    <span className="text-xs font-normal text-muted-foreground">{t('cars.perDay')}</span>
                                </span>
                                <Button
                                    size="sm"
                                    className="bg-primary text-xs text-primary-foreground"
                                    onClick={() => navigate(`/cars/${c.slug}`)}
                                >
                                    {t('cars.rentNow')}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </PageShell>
    );
};

export default Cars;
