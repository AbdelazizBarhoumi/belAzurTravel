import { motion } from 'framer-motion';
import { Plane, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { flightsData } from '@/data/flights.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const Flights = () => {
    const { t, dir, lang } = useLanguage();
    const navigate = useNavigate();

    return (
        <PageShell
            titleKey="flights.title"
            subtitleKey="flights.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.flights'), active: true },
            ]}
        >
            <div className="space-y-4">
                {flightsData.map((f, i) => (
                    <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="card-elevated flex flex-col items-center gap-6 rounded-2xl bg-card p-5 md:flex-row"
                    >
                        <div className="flex items-center gap-3 md:w-40">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <Plane className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{localize(f.airline, lang)}</p>
                                <p className="text-xs text-muted-foreground">{localize(f.stops, lang)}</p>
                            </div>
                        </div>

                        <div className="flex flex-1 items-center justify-center gap-6">
                            <div className="text-center">
                                <p className="font-bold text-foreground">{f.departure}</p>
                                <p className="text-xs text-muted-foreground">{f.from}</p>
                            </div>
                            <div className="flex flex-col items-center text-muted-foreground">
                                <Clock className="mb-1 h-3 w-3" />
                                <span className="text-xs">{f.duration}</span>
                                {dir === 'rtl' ? <ArrowLeft className="mt-1 h-3 w-3" /> : <ArrowRight className="mt-1 h-3 w-3" />}
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-foreground">{f.arrival}</p>
                                <p className="text-xs text-muted-foreground">{localize(f.to, lang)}</p>
                            </div>
                        </div>

                        <div className={`text-center md:${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                            <p className="text-2xl font-bold text-primary">${f.price}</p>
                            <Button
                                size="sm"
                                className="mt-2 bg-primary text-primary-foreground"
                                onClick={() => navigate(`/flights/${f.id}`)}
                            >
                                {t('flights.select')}
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </PageShell>
    );
};

export default Flights;
