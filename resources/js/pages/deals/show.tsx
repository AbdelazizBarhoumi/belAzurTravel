import { motion } from 'framer-motion';
import { CheckCircle2, Info, Tag } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/data';
import { useDealBySlug } from '@/hooks/usePublicData';
import type { DealItem, LocalizedText } from '@/types/public';

function normalizeLocalizedList(
    value: DealItem['highlights'] | unknown,
): LocalizedText[] {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (!item) return null;

                if (typeof item === 'string' || typeof item === 'number') {
                    const text = String(item);
                    return { en: text, fr: text, ar: text };
                }

                if (typeof item !== 'object') return null;

                const candidate = item as Record<string, unknown>;
                const localized =
                    candidate.name && typeof candidate.name === 'object'
                        ? (candidate.name as Record<string, unknown>)
                        : candidate;

                const entry = {
                    en: String(localized.en ?? ''),
                    fr: String(localized.fr ?? ''),
                    ar: String(localized.ar ?? ''),
                };

                return entry.en || entry.fr || entry.ar ? entry : null;
            })
            .filter((item): item is LocalizedText => item !== null);
    }

    if (typeof value === 'object') {
        const buckets = value as Record<string, unknown>;

        if (
            Array.isArray(buckets.en) ||
            Array.isArray(buckets.fr) ||
            Array.isArray(buckets.ar)
        ) {
            const en = (buckets.en as unknown[] | undefined) ?? [];
            const fr = (buckets.fr as unknown[] | undefined) ?? [];
            const ar = (buckets.ar as unknown[] | undefined) ?? [];
            const max = Math.max(en.length, fr.length, ar.length);

            return Array.from({ length: max }, (_, index) => {
                const entry = {
                    en: String(en[index] ?? fr[index] ?? ar[index] ?? ''),
                    fr: String(fr[index] ?? en[index] ?? ar[index] ?? ''),
                    ar: String(ar[index] ?? en[index] ?? fr[index] ?? ''),
                };

                return entry.en || entry.fr || entry.ar ? entry : null;
            }).filter((item): item is LocalizedText => item !== null);
        }
    }

    return [];
}

export default function DealDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const { data: deal, isLoading } = useDealBySlug(slug);
    const highlights = normalizeLocalizedList(deal?.highlights);
    const terms = normalizeLocalizedList(deal?.terms);

    if (isLoading) {
        return null;
    }

    if (!deal) return <Navigate to="/deals" replace />;

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.deals'), href: '/deals' },
                { label: localizeText(deal.title, lang), active: true },
            ]}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-10 lg:grid-cols-[2fr_1fr]"
            >
                <div className="space-y-8">
                    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 md:p-10">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                <Tag className="h-3.5 w-3.5" />{' '}
                                {localizeText(deal.discount, lang)}
                            </div>
                            <h1 className="mb-3 font-serif text-4xl font-bold text-foreground">
                                {localizeText(deal.title, lang)}
                            </h1>
                            <p className="max-w-2xl text-muted-foreground">
                                {localizeText(deal.description, lang)}
                            </p>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="text-sm text-muted-foreground">
                                {t('dealDetail.expires')}
                            </div>
                            <div className="mt-2 font-semibold">
                                {localizeText(deal.expires, lang)}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="text-sm text-muted-foreground">
                                {t('dealDetail.category')}
                            </div>
                            <div className="mt-2 font-semibold">
                                {localizeText(deal.category, lang)}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="text-sm text-muted-foreground">
                                {t('dealDetail.type')}
                            </div>
                            <div className="mt-2 font-semibold">
                                {t('dealDetail.specialOffer')}
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-serif text-xl font-bold">
                                {t('dealDetail.highlights')}
                            </h3>
                            <ul className="space-y-2 text-foreground">
                                {highlights.map((item) => (
                                    <li key={item.en} className="flex gap-2">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" />{' '}
                                        {localizeText(item, lang)}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-6">
                            <h3 className="mb-4 font-serif text-xl font-bold">
                                {t('dealDetail.terms')}
                            </h3>
                            <ul className="space-y-2 text-sm text-foreground">
                                {terms.map((item) => (
                                    <li key={item.en} className="flex gap-2">
                                        <Info className="mt-0.5 h-4 w-4 text-secondary" />{' '}
                                        {localizeText(item, lang)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-card p-6">
                        <h3 className="mb-5 font-serif text-xl font-bold">
                            {t('dealDetail.flow')}
                        </h3>
                        <div className="space-y-4">
                            {[
                                t('dealDetail.step1'),
                                t('dealDetail.step2'),
                                t('dealDetail.step3'),
                            ].map((step, index) => (
                                <div key={step} className="flex gap-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="font-semibold">
                                            {step}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {t('dealDetail.stepDesc').replace(
                                                '{n}',
                                                String(index + 1),
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </motion.div>
        </PageShell>
    );
}
