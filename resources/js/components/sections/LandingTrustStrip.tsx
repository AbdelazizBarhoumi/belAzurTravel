import { motion } from 'framer-motion';
import { BadgeCheck, Headphones, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type TrustCard = {
    icon: typeof ShieldCheck;
    titleKey: string;
    descriptionKey: string;
};

const TRUST_CARDS: TrustCard[] = [
    {
        icon: ShieldCheck,
        titleKey: 'home.trust.securityTitle',
        descriptionKey: 'home.trust.securityDescription',
    },
    {
        icon: BadgeCheck,
        titleKey: 'home.trust.curatedTitle',
        descriptionKey: 'home.trust.curatedDescription',
    },
    {
        icon: Headphones,
        titleKey: 'home.trust.supportTitle',
        descriptionKey: 'home.trust.supportDescription',
    },
];

export function LandingTrustStrip() {
    const { t } = useLanguage();

    return (
        <section className="bg-muted/35 py-16">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    className="mx-auto mb-10 max-w-3xl text-center"
                >
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-secondary">
                        {t('home.trust.eyebrow')}
                    </p>
                    <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                        {t('home.trust.title')}
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                        {t('home.trust.subtitle')}
                    </p>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-3">
                    {TRUST_CARDS.map((card, index) => {
                        const Icon = card.icon;

                        return (
                            <motion.article
                                key={card.titleKey}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ delay: index * 0.08 }}
                                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                    {t(card.titleKey)}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {t(card.descriptionKey)}
                                </p>
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
