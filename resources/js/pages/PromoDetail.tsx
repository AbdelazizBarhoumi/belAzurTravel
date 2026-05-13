import { motion } from 'framer-motion';
import { Calendar, Check, Copy, Tag, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { promosData } from '@/data/promos.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;
function localize(value: LocalizedText, lang: Lang): string { return value[lang]; }

export default function PromoDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const [copied, setCopied] = useState(false);
    const promo = promosData.find((item) => item.code === slug);

    if (!promo) return <Navigate to="/promos" replace />;

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(promo.code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch (error) {
            console.error('Failed to copy promo code', error);
        }
    };

    const promoTitle = localize(promo.title, lang);
    const promoDescription = localize(promo.description, lang);
    const promoDiscount = localize(promo.discount, lang);
    const promoExpires = localize(promo.expires, lang);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <Breadcrumb items={[{ label: t('common.home'), href: '/' }, { label: t('nav.promos'), href: '/promos' }, { label: promoTitle, active: true }]} />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-8">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-gradient-to-br ${promo.color} rounded-3xl p-10 text-primary-foreground mb-8 card-elevated`}>
                                <Tag className="h-10 w-10 opacity-80 mb-4" />
                                <h1 className="font-serif text-4xl font-bold mb-2">{promoTitle}</h1>
                                <p className="text-primary-foreground/80 mb-6 max-w-2xl">{promoDescription}</p>
                                <div className="flex flex-wrap items-center gap-4">
                                    <span className="px-4 py-2 rounded-full bg-card/20 backdrop-blur text-sm font-bold">{promoDiscount}</span>
                                    <button onClick={copyCode} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/20 backdrop-blur font-mono font-bold hover:bg-card/30 transition-colors">
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {promo.code}
                                    </button>
                                    <span className="text-sm flex items-center gap-1 opacity-80"><Calendar className="h-4 w-4" /> {t('promoDetail.expires')} {promoExpires}</span>
                                </div>
                            </motion.div>
                            <section className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="mb-4 font-serif text-xl font-bold">{t('promoDetail.eligibility')}</h3>
                                <ul className="space-y-2 text-sm text-foreground">
                                    {promo.eligibility.map((item) => <li key={item.en} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" /> {localize(item, lang)}</li>)}
                                </ul>
                            </section>
                            <section className="bg-card border border-border rounded-2xl p-6">
                                <h2 className="font-serif text-xl font-bold text-foreground mb-4">{t('promoDetail.termsTitle')}</h2>
                                <ul className="space-y-2">
                                    {promo.terms.map((term) => (
                                        <li key={term.en} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            {localize(term, lang)}
                                        </li>
                                    ))}
                                </ul>
                                <Button asChild className="mt-6 bg-primary text-primary-foreground">
                                    <Link to="/destinations">{t('promoDetail.startBooking')}</Link>
                                </Button>
                            </section>

                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
