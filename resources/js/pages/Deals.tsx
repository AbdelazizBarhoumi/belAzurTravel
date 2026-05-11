import { motion } from 'framer-motion';
import { CalendarClock, Search, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealsData } from '@/data/deals.data';

export default function Deals() {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return dealsData;
        return dealsData.filter((deal) =>
            `${deal.title} ${deal.description} ${deal.discount}`.toLowerCase().includes(q)
        );
    }, [search]);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.deals'), active: true },
                            ]}
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t('deals.title')}
                        </h1>
                        <p className="mx-auto max-w-2xl text-muted-foreground">
                            {t('deals.subtitle')}
                        </p>
                    </motion.div>

                    <div className="mb-8 rounded-2xl border border-border bg-card p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search offers..."
                                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((deal, i) => (
                            <motion.article
                                key={deal.slug}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        <Tag className="h-3 w-3" /> {deal.discount}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <CalendarClock className="h-3.5 w-3.5" /> {deal.expires}
                                    </span>
                                </div>

                                <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                    {deal.title}
                                </h3>
                                <p className="mb-6 text-sm text-muted-foreground">
                                    {deal.description}
                                </p>

                                <div className="flex gap-2">
                                    <Link to={`/deals/${deal.slug}`} className="flex-1">
                                        <Button variant="outline" className="w-full">
                                            {t('deals.viewDeal')}
                                        </Button>
                                    </Link>
                                    <Link to={`/deals/${deal.slug}`} className="flex-1">
                                        <Button className="w-full">
                                            {t('common.bookNow')}
                                        </Button>
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
