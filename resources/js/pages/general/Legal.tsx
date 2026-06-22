import { PageShell } from '@/components/layout/PageShell';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { RichTextRenderer } from '@/components/ui/RichTextRenderer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { normalizeLegalBody } from '@/lib/legal';

const Legal = () => {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();
    const legalSections = settings.legalSections;

    return (
        <PageShell
            title={t('legal.title')}
            subtitle={t('legal.subtitle')}
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
            <div className="mx-auto space-y-6">
                {legalSections.map((section, i) => (
                    <div
                        key={section.title[lang]}
                        className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
                    >
                        <h2 className="mb-3 font-serif text-xl font-bold text-foreground md:text-2xl">
                            {section.title[lang]}
                        </h2>

                        {(() => {
                            const body = normalizeLegalBody(section.body);
                            const content =
                                body.content[lang] ||
                                body.content.en ||
                                body.content.fr ||
                                body.content.ar ||
                                '';
                            return body.format === 'richtext' ? (
                                <RichTextRenderer
                                    html={content}
                                    className="prose-sm text-muted-foreground"
                                />
                            ) : (
                                <MarkdownRenderer
                                    content={content}
                                    className="prose-sm text-muted-foreground"
                                />
                            );
                        })()}

                        <div className="mt-4 text-right">
                            <a
                                href={`/legal/${i}`}
                                className="text-primary hover:underline"
                            >
                                {t('cookie.learnMore')}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </PageShell>
    );
};

export default Legal;
