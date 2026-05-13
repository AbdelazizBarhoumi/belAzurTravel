import { motion } from 'framer-motion';
import { CheckCircle2, Info, Tag } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealsData } from '@/data/deals.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

export default function DealDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const deal = dealsData.find((d) => d.slug === slug);

    if (!deal) return <Navigate to="/deals" replace />;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <Breadcrumb items={[{ label: t('common.home'), href: '/' }, { label: t('nav.deals'), href: '/deals' }, { label: localize(deal.title, lang), active: true }]} />
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-8">
                            <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 md:p-10">
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                        <Tag className="h-3.5 w-3.5" /> {localize(deal.discount, lang)}
                                    </div>
                                    <h1 className="mb-3 font-serif text-4xl font-bold text-foreground">{localize(deal.title, lang)}</h1>
                                    <p className="max-w-2xl text-muted-foreground">{localize(deal.description, lang)}</p>
                                </div>
                            </section>

                            <section className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-card p-5">
                                    <div className="text-sm text-muted-foreground">{t('dealDetail.expires')}</div>
                                    <div className="mt-2 font-semibold">{localize(deal.expires, lang)}</div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-5">
                                    <div className="text-sm text-muted-foreground">{t('dealDetail.category')}</div>
                                    <div className="mt-2 font-semibold">{localize(deal.category, lang)}</div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-5">
                                    <div className="text-sm text-muted-foreground">{t('dealDetail.type')}</div>
                                    <div className="mt-2 font-semibold">{t('dealDetail.specialOffer')}</div>
                                </div>
                            </section>

                            <section className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-border bg-card p-6">
                                    <h3 className="mb-4 font-serif text-xl font-bold">{t('dealDetail.highlights')}</h3>
                                    <ul className="space-y-2 text-foreground">
                                        {deal.highlights.map((item) => <li key={item.en} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" /> {localize(item, lang)}</li>)}
                                    </ul>
                                </div>

                                <div className="rounded-2xl border border-border bg-card p-6">
                                    <h3 className="mb-4 font-serif text-xl font-bold">{t('dealDetail.terms')}</h3>
                                    <ul className="space-y-2 text-sm text-foreground">
                                        {deal.terms.map((item) => <li key={item.en} className="flex gap-2"><Info className="mt-0.5 h-4 w-4 text-secondary" /> {localize(item, lang)}</li>)}
                                    </ul>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="mb-5 font-serif text-xl font-bold">{t('dealDetail.flow')}</h3>
                                <div className="space-y-4">
                                    {[
                                        t('dealDetail.step1'),
                                        t('dealDetail.step2'),
                                        t('dealDetail.step3'),
                                    ].map((step, index) => (
                                        <div key={step} className="flex gap-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</div>
                                            <div>
                                                <div className="font-semibold">{step}</div>
                                                <p className="text-sm text-muted-foreground">{t('dealDetail.stepDesc').replace('{n}', String(index + 1))}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <aside className="lg:pt-6">
                            <StickyBookingCard
                                minPrice={0}
                                currency=""
                                title={localize(deal.title, lang)}
                                description={localize(deal.description, lang)}
                                priceLabel={t('dealDetail.offer')}
                                priceSuffix=""
                                type={localize(deal.discount, lang)}
                                rating={4.7}
                                reviews={42}
                                primaryButtonLabel={t('dealDetail.book')}
                                onBook={() => window.alert(t('dealDetail.book'))}
                                onWhatsApp={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${t('dealDetail.inquiry')}: ${localize(deal.title, lang)}`)}`, '_blank')}
                            />
                        </aside>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
