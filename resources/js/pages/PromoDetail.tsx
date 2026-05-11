import { motion } from 'framer-motion';
import { Tag, CheckCircle2, ClipboardCopy } from 'lucide-react';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { StickyBookingCard } from '@/components/StickyBookingCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { promosData } from '@/data/promos.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;
function localize(value: LocalizedText, lang: Lang): string { return value[lang]; }

export default function PromoDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const promo = promosData.find((item) => item.code === slug);

    if (!promo) return <Navigate to="/promos" replace />;

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(promo.code);
        } catch (error) {
            console.error('Failed to copy promo code', error);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <div className="mb-8"><Breadcrumb items={[{ label: t('common.home'), href: '/' }, { label: t('nav.promos'), href: '/promos' }, { label: promo.code, active: true }]} /></div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-10 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-8">
                            <section className={`overflow-hidden rounded-3xl bg-gradient-to-br ${promo.color} p-8 text-primary-foreground shadow-sm`}>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card/20 px-3 py-1 text-xs font-semibold backdrop-blur"><Tag className="h-3.5 w-3.5" /> {localize(promo.discount, lang)}</div>
                                <h1 className="font-serif text-4xl font-bold">{localize(promo.title, lang)}</h1>
                                <p className="mt-4 max-w-2xl text-primary-foreground/85">{localize(promo.description, lang)}</p>
                            </section>

                            <section className="grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Promo code</div><div className="mt-2 font-mono text-lg font-bold">{promo.code}</div></div>
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Expires</div><div className="mt-2 font-semibold">{localize(promo.expires, lang)}</div></div>
                                <div className="rounded-2xl border border-border bg-card p-5"><div className="text-sm text-muted-foreground">Action</div><button onClick={copyCode} className="mt-2 inline-flex items-center gap-2 font-semibold text-primary"><ClipboardCopy className="h-4 w-4" /> Copy code</button></div>
                            </section>

                            <section className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="mb-4 font-serif text-xl font-bold">Eligibility</h3>
                                <ul className="space-y-2 text-sm text-foreground">
                                    {promo.eligibility.map((item) => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-secondary" /> {item}</li>)}
                                </ul>
                            </section>

                            <section className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="mb-4 font-serif text-xl font-bold">How to use</h3>
                                <ol className="list-inside list-decimal space-y-2 text-foreground">
                                    {promo.howToUse.map((item) => <li key={item}>{item}</li>)}
                                </ol>
                            </section>
                        </div>

                        <aside className="lg:pt-6">
                            <StickyBookingCard
                                minPrice={0}
                                currency=""
                                type={promo.discount[lang]}
                                rating={4.8}
                                reviews={24}
                                onBook={() => window.alert('Proceed to promo checkout flow')}
                                onWhatsApp={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Promo code: ${promo.code}`)}`, '_blank')}
                            />
                        </aside>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
