import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { LandingSectionConfig } from '@/api/siteSettings.api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
    getMapDisplayText,
    getMapEmbedSrc,
    getMapLink,
    getMapQuery,
} from '@/lib/site-map';

interface Props {
    config: LandingSectionConfig;
}

export function LocationSection({ config }: Props) {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();

    const mapQuery = getMapQuery(settings);
    if (!mapQuery) return null;

    const title = config.hideTitle
        ? ''
        : (config.title?.[lang] ?? config.title?.en ?? t('contact.locationTitle'));
    const subtitle = config.hideTitle
        ? ''
        : (config.subtitle?.[lang] ?? config.subtitle?.en ?? t('contact.locationSubtitle'));

    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                                <MapPin className="h-5 w-5" />
                            </div>
                            {(title || subtitle) && (
                                <div>
                                    {title && (
                                        <h2 className="font-serif text-2xl font-bold text-foreground">
                                            {title}
                                        </h2>
                                    )}
                                    {subtitle && (
                                        <p className="text-sm text-muted-foreground">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                            <iframe
                                title={t('contact.mapTitle')}
                                src={getMapEmbedSrc(settings)}
                                className="h-[360px] w-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                            <span>{getMapDisplayText(settings)}</span>
                            <a
                                href={getMapLink(settings)}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-primary hover:underline"
                            >
                                {t('contact.openMap')}
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
