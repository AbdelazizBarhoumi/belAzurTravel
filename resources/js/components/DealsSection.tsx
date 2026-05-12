import { motion } from 'framer-motion';
import { Shield, Percent, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang) {
    return value[lang];
}

const deals = [
    {
        slug: 'early-bird-summer-2026',
        title: { fr: 'Early Bird Été 2026', ar: 'صيف 2026 مبكرًا', en: 'Early Bird Summer 2026' },
        description: {
            fr: "Réservez votre escapade d'été avant le 31 mars et économisez jusqu'à 35% sur certaines destinations balnéaires.",
            ar: 'احجز عطلتك الصيفية قبل 31 مارس ووفر حتى 35٪ على وجهات شاطئية مختارة.',
            en: 'Book your summer getaway before March 31st and save up to 35% on selected beach destinations.',
        },
        discount: { fr: '35% DE RÉDUCTION', ar: 'خصم 35%', en: '35% OFF' },
        icon: Percent,
        color: 'bg-secondary/10 text-secondary',
    },
    {
        slug: 'last-minute-escapes',
        title: { fr: 'Évasions Dernière Minute', ar: 'عروض اللحظة الأخيرة', en: 'Last Minute Escapes' },
        description: {
            fr: "Des prix incroyables pour des départs sous 14 jours. Parfait pour les voyageurs spontanés.",
            ar: 'أسعار مذهلة للرحلات المغادرة خلال 14 يومًا. مثالي للمسافرين العفويين.',
            en: 'Incredible prices on departures within the next 14 days. Perfect for spontaneous travelers.',
        },
        discount: { fr: 'Jusqu’à 50%', ar: 'حتى 50%', en: 'Up to 50%' },
        icon: Zap,
        color: 'bg-primary/10 text-primary',
    },
    {
        slug: 'honeymoon-packages',
        title: { fr: 'Forfaits Lune de Miel', ar: 'باقات شهر العسل', en: 'Honeymoon Packages' },
        description: {
            fr: "Escapades romantiques tout compris avec spa, restauration et excursions privées. Surclassement offert.",
            ar: 'عطلات رومانسية شاملة مع منتجع صحي، طعام وجولات خاصة. ترقية مجانية.',
            en: 'All-inclusive romantic getaways with spa, dining, and private excursions. Complimentary upgrade.',
        },
        discount: { fr: 'Surclassement Gratuit', ar: 'ترقية مجانية', en: 'Free Upgrade' },
        icon: Shield,
        color: 'bg-destructive/10 text-destructive',
    },
];

export function DealsSection() {
    const { t, lang } = useLanguage();
    return (
       <section className="bg-muted py-24">
    <div className="container mx-auto px-4">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
        >
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-secondary">
                {t('deals.save')}
            </p>

            <h2 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                {t('deals.title')}
            </h2>

            <p className="mx-auto max-w-xl text-muted-foreground">
                {t('deals.subtitle')}
            </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {deals.map((deal, i) => (
                <motion.div
                    key={deal.slug}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-2 hover:border-primary/30 hover:shadow-2xl"
                >
                    {/* Top Accent */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-secondary" />

                    <div className="flex h-full flex-col">
                        {/* Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div
                                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${deal.color}`}
                            >
                                <deal.icon className="h-7 w-7" />
                            </div>

                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                {localize(deal.discount, lang)}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="mb-3 font-serif text-2xl font-bold text-foreground transition-colors group-hover:text-primary">
                                {localize(deal.title, lang)}
                            </h3>

                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {localize(deal.description, lang)}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="mt-8">
                            <Link to={`/deals/${deal.slug}`}>
                                <Button
                                    variant="ghost"
                                    className="w-full rounded-xl border border-border bg-background transition-all group-hover:bg-primary group-hover:text-primary-foreground"
                                >
                                    {t('deals.viewDeal')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
</section>
    );
}
