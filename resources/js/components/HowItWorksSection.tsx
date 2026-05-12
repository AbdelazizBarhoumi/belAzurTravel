import { motion } from 'framer-motion';
import { CalendarCheck, MapPinned, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type Step = {
    icon: typeof MapPinned;
    titleKey: string;
    descriptionKey: string;
};

const STEPS: Step[] = [
    {
        icon: MapPinned,
        titleKey: 'home.steps.step1Title',
        descriptionKey: 'home.steps.step1Description',
    },
    {
        icon: SlidersHorizontal,
        titleKey: 'home.steps.step2Title',
        descriptionKey: 'home.steps.step2Description',
    },
    {
        icon: CalendarCheck,
        titleKey: 'home.steps.step3Title',
        descriptionKey: 'home.steps.step3Description',
    },
];

export function HowItWorksSection() {
    const { t } = useLanguage();

    return (
        <section className="bg-background py-24">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    className="mx-auto mb-12 max-w-3xl text-center"
                >
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-secondary">
                        {t('home.steps.eyebrow')}
                    </p>
                    <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                        {t('home.steps.title')}
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                        {t('home.steps.subtitle')}
                    </p>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <motion.article
                                key={step.titleKey}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ delay: index * 0.1 }}
                                className="relative rounded-3xl border border-border bg-card p-8 shadow-sm"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                                        {index + 1}
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                </div>
                                <h3 className="mb-3 font-serif text-2xl font-bold text-foreground">
                                    {t(step.titleKey)}
                                </h3>
                                <p className="leading-relaxed text-muted-foreground">
                                    {t(step.descriptionKey)}
                                </p>
                            </motion.article>
                        );
                    })}
                </div>

                <div className="mt-10 flex justify-center">
                    <Button asChild size="lg" className="rounded-full px-8">
                        <Link to="/design-trip">{t('home.steps.cta')}</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
