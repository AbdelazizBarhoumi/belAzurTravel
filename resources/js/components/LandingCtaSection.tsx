import { motion } from 'framer-motion';
import { ArrowRight, MessageSquareMore, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

type Assurance = {
    icon: typeof ShieldCheck;
    textKey: string;
};

const ASSURANCES: Assurance[] = [
    { icon: ShieldCheck, textKey: 'home.cta.assurance1' },
    { icon: Sparkles, textKey: 'home.cta.assurance2' },
    { icon: MessageSquareMore, textKey: 'home.cta.assurance3' },
];

export function LandingCtaSection() {
    const { t } = useLanguage();

    return (
        <section className="bg-muted/40 py-24">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    className="overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground shadow-xl md:p-12"
                >
                    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                        <div>
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-secondary/90">
                                {t('home.cta.eyebrow')}
                            </p>
                            <h2 className="font-serif text-3xl font-bold md:text-5xl">
                                {t('home.cta.title')}
                            </h2>
                            <p className="mt-4 max-w-2xl text-primary-foreground/80 md:text-lg">
                                {t('home.cta.subtitle')}
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button asChild size="lg" className="rounded-full bg-background text-foreground hover:bg-background/90">
                                    <Link to="/design-trip">
                                        {t('home.cta.primary')}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                                    <Link to="/contact">{t('home.cta.secondary')}</Link>
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-4 rounded-[1.5rem] border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur-sm">
                            {ASSURANCES.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div key={item.textKey} className="flex items-center gap-4 rounded-2xl border border-primary-foreground/10 bg-background/5 p-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm leading-relaxed text-primary-foreground/85">
                                            {t(item.textKey)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
