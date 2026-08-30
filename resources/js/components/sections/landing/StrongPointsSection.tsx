import { motion } from 'framer-motion';
import {
    Award,
    Tag,
    Compass,
    Briefcase,
    Headphones,
    Heart,
    Shield,
    Star,
    Users,
    Zap,
    Clock,
    Globe,
    type LucideIcon,
} from 'lucide-react';
import type { LandingSectionConfig, LandingSectionItem } from '@/api/siteSettings.api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
    config: LandingSectionConfig;
}

const ICON_MAP: Record<string, LucideIcon> = {
    award: Award,
    tag: Tag,
    compass: Compass,
    briefcase: Briefcase,
    headphones: Headphones,
    heart: Heart,
    shield: Shield,
    star: Star,
    users: Users,
    zap: Zap,
    clock: Clock,
    globe: Globe,
};

const DEFAULT_ITEMS: LandingSectionItem[] = [
    {
        icon: 'award',
        title: { fr: 'Expertise', en: 'Expertise', ar: 'الخبرة' },
        description: {
            fr: 'Une équipe expérimentée pour vous conseiller dans tous vos projets de voyage.',
            en: 'An experienced team to advise you on all your travel projects.',
            ar: 'فريق ذو خبرة لاستشارتك في جميع مشاريع سفرك.',
        },
    },
    {
        icon: 'tag',
        title: { fr: 'Prix compétitifs', en: 'Competitive Prices', ar: 'أسعار تنافسية' },
        description: {
            fr: 'Des offres avantageuses adaptées à votre budget.',
            en: 'Advantageous offers adapted to your budget.',
            ar: 'عروض مميزة مصممة وفقا لميزانيتك.',
        },
    },
    {
        icon: 'compass',
        title: { fr: 'Voyages sur mesure', en: 'Tailor-Made Trips', ar: 'رحلات مصممة خصيصاً' },
        description: {
            fr: 'Des séjours personnalisés selon vos envies et vos besoins.',
            en: 'Personalized stays according to your wishes and needs.',
            ar: 'إقامات مخصصة وفقا لأمنياتك واحتياجاتك.',
        },
    },
    {
        icon: 'briefcase',
        title: { fr: 'Service professionnel', en: 'Professional Service', ar: 'خدمة احترافية' },
        description: {
            fr: 'Un service sérieux, efficace et attentif à la satisfaction de chaque client.',
            en: 'A serious, efficient service attentive to every customer satisfaction.',
            ar: 'خدمة جادة وفعالة تهتم برضا كل عميل.',
        },
    },
    {
        icon: 'headphones',
        title: { fr: 'Assistance & Réactivité', en: 'Support & Responsiveness', ar: 'مساعدة واستجابة' },
        description: {
            fr: 'Une équipe disponible pour répondre rapidement à vos demandes.',
            en: 'A team available to respond quickly to your requests.',
            ar: 'فريق متاح للرد بسرعة على طلباتك.',
        },
    },
    {
        icon: 'heart',
        title: { fr: 'Accompagnement personnalisé', en: 'Personalized Follow-Up', ar: 'مرافقة مخصصة' },
        description: {
            fr: 'Un conseiller à votre écoute à chaque étape de votre voyage.',
            en: 'A consultant listening to you at every stage of your trip.',
            ar: 'مستشار يستمع إليك في كل مرحلة من رحلتك.',
        },
    },
];

function getIcon(iconName?: string): LucideIcon {
    return ICON_MAP[iconName ?? ''] ?? Award;
}

export function StrongPointsSection({ config }: Props) {
    const { lang, t } = useLanguage();

    const title =
        config.title?.[lang] ??
        config.title?.en ??
        t('home.strongPoints.title');
    const subtitle =
        config.subtitle?.[lang] ??
        config.subtitle?.en ??
        t('home.strongPoints.subtitle');

    const items =
        config.items && config.items.length > 0
            ? config.items
            : DEFAULT_ITEMS;

    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    className="mb-10 text-center"
                >
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-secondary">
                        {t('home.trust.eyebrow')}
                    </p>
                    <h2 className="mb-3 font-serif text-3xl font-bold text-foreground md:text-4xl">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, index) => {
                        const Icon = getIcon(item.icon);
                        const itemTitle =
                            item.title?.[lang] ?? item.title?.en ?? '';
                        const itemDescription =
                            item.description?.[lang] ?? item.description?.en ?? '';

                        return (
                            <motion.article
                                key={index}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ delay: index * 0.07 }}
                                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 font-serif text-lg font-bold text-foreground">
                                    {itemTitle}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {itemDescription}
                                </p>
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
