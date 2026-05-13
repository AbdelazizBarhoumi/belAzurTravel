import { PageShell } from '@/components/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { legalSections } from '@/data/catalog';

const Legal = () => {
    const { lang, t } = useLanguage();

    return (
        <PageShell
            titleKey="legal.title"
            subtitleKey="legal.subtitle"
            breadcrumbs={[
                {
                    label: t('common.home'),
                    href: '/',
                },
                {
                    label: t('nav.legal'),
                    active: true,
                },
            ]}
        >
            <div className="mx-auto max-w-4xl space-y-6">
                {legalSections.map((section) => (
                    <div
                        key={section.title[lang]}
                        className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
                    >
                        <h2 className="mb-3 font-serif text-xl font-bold text-foreground md:text-2xl">
                            {section.title[lang]}
                        </h2>

                        <p className="text-sm leading-7 text-muted-foreground md:text-base">
                            {section.body[lang]}
                        </p>
                    </div>
                ))}
            </div>
        </PageShell>
    );
};

export default Legal;
