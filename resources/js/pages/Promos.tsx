import { motion } from 'framer-motion';
import { Tag, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { promosData } from '@/data/promos.data';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const Promos = () => {
    const { t, lang } = useLanguage();
    const navigate = useNavigate();

    return (
        <PageShell
            titleKey="promos.title"
            subtitleKey="promos.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.promos'), active: true },
            ]}
        >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {promosData.map((p, i) => (
                    <motion.div
                        key={p.code}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="card-elevated overflow-hidden rounded-2xl"
                    >
                        <div className={`bg-gradient-to-br ${p.color} p-8 text-primary-foreground`}>
                            <div className="mb-4 flex items-start justify-between">
                                <Tag className="h-8 w-8 opacity-80" />
                                <span className="rounded-full bg-card/20 px-3 py-1 text-xs font-bold backdrop-blur">
                                    {localize(p.discount, lang)}
                                </span>
                            </div>
                            <h3 className="mb-2 font-serif text-2xl font-bold">{localize(p.title, lang)}</h3>
                            <p className="mb-6 text-sm text-primary-foreground/80">{localize(p.description, lang)}</p>
                            <div className="flex items-center justify-between">
                                <code className="rounded-lg bg-card/20 px-3 py-1.5 font-mono text-sm font-bold backdrop-blur">{p.code}</code>
                                <span className="flex items-center gap-1 text-xs opacity-80"><Calendar className="h-3 w-3" /> {localize(p.expires, lang)}</span>
                            </div>
                        </div>
                        <div className="flex justify-end bg-card p-4">
                            <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => navigate(`/promos/${p.code}`)}>
                                {t('promos.applyCode')}
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </PageShell>
    );
};

export default Promos;
