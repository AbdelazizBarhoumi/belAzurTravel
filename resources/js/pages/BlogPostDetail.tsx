import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useParams, Navigate } from 'react-router-dom';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const posts = [
    {
        slug: 'southeast-asia-hidden-gems',
        title: {
            fr: "10 Joyaux Cachés d'Asie du Sud-Est à Découvrir",
            ar: '10 جواهر مخفية في جنوب شرق آسيا يجب عليك زيارتها',
            en: '10 Hidden Gems in Southeast Asia You Must Visit',
        },
        excerpt: {
            fr: 'Découvrez des destinations moins connues offrant des expériences extraordinaires loin de la foule de touristes.',
            ar: 'اكتشف الوجهات الأقل شهرة التي تقدم تجارب لا تصدق بعيدًا عن حشود السياح.',
            en: 'Discover lesser-known destinations that offer incredible experiences without the tourist crowds.',
        },
        date: 'Feb 15, 2026',
        category: { fr: 'Aventure', ar: 'مغامرة', en: 'Adventure' },
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=700&fit=crop',
        content: {
            fr: 'Contenu en français...',
            ar: 'محتوى بالعربية...',
            en: 'Full article content in English...',
        },
    },
    {
        slug: 'budget-travel-europe',
        title: {
            fr: "Guide Ultime du Voyage Économique en Europe",
            ar: 'الدليل الشامل للسفر برخص في أوروبا',
            en: 'The Ultimate Guide to Budget Travel in Europe',
        },
        excerpt: {
            fr: "Comment explorer les plus belles villes d'Europe sans dépasser votre budget. Conseils de voyageurs expérimentés.",
            ar: 'كيفية استكشاف أجمل مدن أوروبا دون تجاوز ميزانيتك. نصائح من المسافرين المتمرسين.',
            en: "How to explore Europe's most iconic cities without breaking the bank. Tips from seasoned travelers.",
        },
        date: 'Feb 10, 2026',
        category: { fr: 'Conseils', ar: 'نصائح', en: 'Tips' },
        image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&h=700&fit=crop',
        content: {
            fr: 'Contenu en français...',
            ar: 'محتوى بالعربية...',
            en: 'Full article content in English...',
        },
    },
    {
        slug: 'sustainable-travel-2026',
        title: {
            fr: 'Pourquoi le Voyage Durable est Important en 2026',
            ar: 'لماذا السفر المستدام مهم في 2026',
            en: 'Why Sustainable Travel Matters in 2026',
        },
        excerpt: {
            fr: 'Le mouvement croissant vers le tourisme écologiquement conscient et comment vous pouvez faire une différence.',
            ar: 'الحركة المتنامية نحو السياحة الواعية بيئيًا وكيف يمكنك إحداث فرق.',
            en: 'The growing movement towards eco-conscious tourism and how you can make a difference.',
        },
        date: 'Feb 5, 2026',
        category: { fr: 'Durabilité', ar: 'الاستدامة', en: 'Sustainability' },
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=700&fit=crop',
        content: {
            fr: 'Contenu en français...',
            ar: 'محتوى بالعربية...',
            en: 'Full article content in English...',
        },
    },
];

export default function BlogPostDetail() {
    const { slug } = useParams<{ slug: string }>();
    const { t, lang } = useLanguage();

    const post = posts.find((p) => p.slug === slug);

    if (!post) return <Navigate to="/blog" replace />;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <Breadcrumb
                        items={[
                            { label: t('common.home'), href: '/' },
                            { label: t('nav.blog'), href: '/blog' },
                            { label: localize(post.title, lang), active: true },
                        ]}
                    />

                    <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl border border-border bg-card p-6">
                        <img src={post.image} alt={localize(post.title, lang)} className="mb-6 w-full rounded-xl object-cover" />
                        <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{localize(post.category, lang)}</span>
                            <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{post.date}</div>
                        </div>
                        <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">{localize(post.title, lang)}</h1>
                        <div className="prose max-w-none text-foreground">{localize(post.content, lang)}</div>
                    </motion.article>
                </div>
            </main>

            <Footer />
        </div>
    );
}
