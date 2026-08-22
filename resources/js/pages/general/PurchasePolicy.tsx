import type { LegalSectionBody } from '@/api/siteSettings.api';
import { PageShell } from '@/components/layout/PageShell';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { RichTextRenderer } from '@/components/ui/RichTextRenderer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { normalizeLegalBody } from '@/lib/legal';

interface StoredLegal {
    title?: Record<string, string>;
    body?: LegalSectionBody;
}

const PurchasePolicy = () => {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();
    const content = settings.content as Record<string, unknown> & {
        purchase_policy?: StoredLegal;
    };
    const stored = content?.purchase_policy;

    const title = stored?.title?.[lang] || t('nav.purchase-policy');
    const body = stored ? normalizeLegalBody(stored.body) : null;
    const bodyContent = body
        ? body.content[lang] ||
          body.content.en ||
          body.content.fr ||
          body.content.ar ||
          ''
        : '';

    return (
        <PageShell
            title={title}
            subtitle=""
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: title, active: true },
            ]}
        >
            <div className="mx-auto">
                {stored ? (
                    <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
                        <h2 className="mb-3 font-serif text-xl font-bold text-foreground md:text-2xl">
                            {title}
                        </h2>
                        {body?.format === 'richtext' ? (
                            <RichTextRenderer
                                html={bodyContent}
                                className="text-muted-foreground"
                            />
                        ) : (
                            <MarkdownRenderer
                                content={bodyContent}
                                className="text-muted-foreground"
                            />
                        )}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
                        <p className="text-muted-foreground">
                            {t('admin.settings.no_legal_sections')}
                        </p>
                    </div>
                )}
            </div>
        </PageShell>
    );
};

export default PurchasePolicy;
