import { motion } from 'framer-motion';
import { Calendar, Check, Copy, Tag, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import type { LocalizedText } from '@/api/entities.api';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { usePromoByCode } from '@/hooks/usePublicData';
import { getPromoBackground } from '@/lib/promoColor';

export default function PromoDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const [copied, setCopied] = useState(false);
    const { data: promo, isLoading } = usePromoByCode(slug);

    if (isLoading) {
        return null;
    }

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

    const promoTitle = localizeText(promo.title, lang);
    const promoDescription = localizeText(promo.description, lang);
    const promoDiscount = localizeText(promo.discount, lang);
    const promoExpires = localizeText(promo.expires, lang);

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.promos'), href: '/promos' },
                { label: promoTitle, active: true },
            ]}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-10 lg:grid-cols-[2fr_1fr]"
            >
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`card-elevated mb-8 rounded-3xl p-10 text-primary-foreground ${getPromoBackground(promo.color).className ? `bg-gradient-to-br ${getPromoBackground(promo.color).className}` : ''}`}
                        style={getPromoBackground(promo.color).style}
                    >
                        <Tag className="mb-4 h-10 w-10 opacity-80" />
                        <h1 className="mb-2 font-serif text-4xl font-bold">
                            {promoTitle}
                        </h1>
                        <p className="mb-6 max-w-2xl text-primary-foreground/80">
                            {promoDescription}
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="rounded-full bg-card/20 px-4 py-2 text-sm font-bold backdrop-blur">
                                {promoDiscount}
                            </span>
                            <button
                                onClick={copyCode}
                                className="flex items-center gap-2 rounded-xl bg-card/20 px-4 py-2 font-mono font-bold backdrop-blur transition-colors hover:bg-card/30"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                                {promo.code}
                            </button>
                            <span className="flex items-center gap-1 text-sm opacity-80">
                                <Calendar className="h-4 w-4" />{' '}
                                {t('promoDetail.expires')} {promoExpires}
                            </span>
                        </div>
                    </motion.div>
                    {promo.howToUse && promo.howToUse.length > 0 && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-serif text-xl font-bold text-foreground">
                                {t('promoDetail.howToUseTitle')}
                            </h3>
                            <ul className="space-y-2 text-sm text-foreground">
                                {promo.howToUse.map((step: LocalizedText) => (
                                    <li
                                        key={step.en}
                                        className="flex items-start gap-2"
                                    >
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{' '}
                                        {localizeText(step, lang)}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {promo.eligibility && promo.eligibility.length > 0 && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-serif text-xl font-bold">
                                {t('promoDetail.eligibility')}
                            </h3>
                            <ul className="space-y-2 text-sm text-foreground">
                                {promo.eligibility.map((item: LocalizedText) => (
                                    <li
                                        key={item.en}
                                        className="flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="h-4 w-4 text-secondary" />{' '}
                                        {localizeText(item, lang)}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {promo.terms && promo.terms.length > 0 && (
                        <section className="rounded-2xl border border-border bg-card p-6">
                            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">
                                {t('promoDetail.termsTitle')}
                            </h2>
                            <ul className="space-y-2">
                                {promo.terms.map((term: LocalizedText) => (
                                    <li
                                        key={term.en}
                                        className="flex items-start gap-2 text-sm text-muted-foreground"
                                    >
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        {localizeText(term, lang)}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                asChild
                                className="mt-6 bg-primary text-primary-foreground"
                            >
                                <Link to="/destinations">
                                    {t('promoDetail.startBooking')}
                                </Link>
                            </Button>
                        </section>
                    )}
                </div>

                <aside className="hidden lg:sticky lg:top-24 lg:block">
                    <motion.div className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="mb-4 font-serif text-lg font-bold">
                            {t('promoDetail.quickInfo')}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t('promoDetail.code')}
                                </p>
                                <button
                                    onClick={copyCode}
                                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 font-mono font-bold text-primary transition-colors hover:bg-primary/20"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                    {promo.code}
                                </button>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t('promoDetail.discount')}
                                </p>
                                <p className="mt-1 text-lg font-bold text-primary">
                                    {promoDiscount}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t('promoDetail.expires')}
                                </p>
                                <p className="mt-1 font-semibold">
                                    {promoExpires}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </aside>
            </motion.div>
        </PageShell>
    );
}
