import { PageShell } from '@/components/layout/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useParams, Link } from 'react-router-dom';

const LegalDetail = () => {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();
    const { id } = useParams();
    const idx = Number(id || 0);
    const section = settings.legalSections?.[idx];

    if (!section) {
        return (
            <PageShell title={t('nav.legal')} subtitle="">
                <div className="mx-auto max-w-4xl">
                    <p>{t('nav.legal')}</p>
                    <p className="mt-4">
                        <Link to="/legal" className="text-primary hover:underline">
                            ← {t('nav.legal')}
                        </Link>
                    </p>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell title={section.title[lang]} subtitle="">
            <div className="mx-auto max-w-4xl">
                <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
                    <h2 className="mb-3 font-serif text-xl font-bold text-foreground md:text-2xl">
                        {section.title[lang]}
                    </h2>
                    <p className="text-sm leading-7 text-muted-foreground md:text-base">
                        {section.body[lang]}
                    </p>
                </div>
            </div>
        </PageShell>
    );
};

export default LegalDetail;
