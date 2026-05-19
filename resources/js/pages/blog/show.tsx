import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import type {
    BlogContentValue,
    BlogContentSection,
    LocalizedText,
} from '@/api/entities.api';
import { PageShell } from '@/components/layout/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogPostBySlug } from '@/hooks/usePublicData';
import type { Lang } from '@/i18n/translations';

type NormalizedBlogContent = {
    body: LocalizedText;
    sections: BlogContentSection[];
};

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

function emptyLocalizedText(): LocalizedText {
    return { en: '', fr: '', ar: '' };
}

function normalizeLocalizedText(value: unknown): LocalizedText {
    if (typeof value === 'string') {
        return { en: value, fr: value, ar: value };
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return {
            en: typeof record.en === 'string' ? record.en : '',
            fr: typeof record.fr === 'string' ? record.fr : '',
            ar: typeof record.ar === 'string' ? record.ar : '',
        };
    }

    return emptyLocalizedText();
}

function normalizeBlogContent(
    content: BlogContentValue,
    fallback: LocalizedText,
): NormalizedBlogContent {
    if (typeof content === 'string') {
        return {
            body: { en: content, fr: content, ar: content },
            sections: [],
        };
    }

    if (!content || typeof content !== 'object') {
        return { body: fallback, sections: [] };
    }

    const record = content as Record<string, unknown>;
    const bodySource = 'body' in record ? record.body : record;
    const body = normalizeLocalizedText(bodySource);
    const sections = Array.isArray(record.sections)
        ? record.sections
              .map((section) => {
                  if (!section || typeof section !== 'object') {
                      return null;
                  }

                  const item = section as Record<string, unknown>;
                  return {
                      id: typeof item.id === 'string' ? item.id : null,
                      heading: normalizeLocalizedText(item.heading),
                      body: normalizeLocalizedText(item.body),
                  } satisfies BlogContentSection;
              })
              .filter(
                  (
                      section,
                  ): section is {
                      id: string | null;
                      heading: LocalizedText;
                      body: LocalizedText;
                  } => Boolean(section),
              )
        : [];

    return {
        body,
        sections,
    };
}

function renderTextBlocks(text: string) {
    return text
        .split(/\n+/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part, index) => (
            <p key={`${index}-${part}`} className="mb-4 last:mb-0">
                {part}
            </p>
        ));
}

export default function BlogPostDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();
    const { data: post, isLoading } = useBlogPostBySlug(slug);

    if (isLoading) return null;
    if (!post) return <Navigate to="/blog" replace />;

    const content = normalizeBlogContent(post.content, post.excerpt);
    const formattedDate = new Intl.DateTimeFormat(
        lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US',
        {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        },
    ).format(new Date(post.date));

    return (
        <PageShell
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.blog'), href: '/blog' },
                { label: localize(post.title, lang), active: true },
            ]}
        >
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-border bg-card p-6"
            >
                <img
                    src={post.image}
                    alt={localize(post.title, lang)}
                    className="mb-6 w-full rounded-xl object-cover"
                />
                <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {localize(post.category, lang)}
                    </span>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formattedDate}
                    </div>
                </div>
                <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">
                    {localize(post.title, lang)}
                </h1>
                <div className="prose max-w-none text-foreground">
                    {renderTextBlocks(
                        localize(content.body, lang) ||
                            localize(post.excerpt, lang),
                    )}
                </div>

                {content.sections.length > 0 && (
                    <div className="mt-10 space-y-6">
                        {content.sections.map((section, index) => (
                            <section
                                key={section.id ?? `${index}`}
                                className="rounded-2xl border border-border bg-muted/20 p-5"
                            >
                                <h2 className="mb-3 font-serif text-2xl font-semibold text-foreground">
                                    {localize(section.heading, lang) ||
                                        `Section ${index + 1}`}
                                </h2>
                                <div className="prose max-w-none text-foreground">
                                    {renderTextBlocks(
                                        localize(section.body, lang),
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </motion.article>
        </PageShell>
    );
}
