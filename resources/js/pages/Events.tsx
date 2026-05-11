import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/i18n/translations';

type LocalizedText = Record<Lang, string>;

function localize(value: LocalizedText, lang: Lang): string {
    return value[lang];
}

const events: Array<{
    title: LocalizedText;
    location: LocalizedText;
    date: LocalizedText;
    attendees: LocalizedText;
    image: string;
    description: LocalizedText;
}> = [
    {
        title: { fr: 'Festival des Cerisiers', ar: 'مهرجان أزهار الكرز', en: 'Cherry Blossom Festival' },
        location: { fr: 'Tokyo, Japon', ar: 'طوكيو، اليابان', en: 'Tokyo, Japan' },
        date: { fr: '5 – 12 avril 2026', ar: '5 – 12 أبريل 2026', en: 'April 5 – 12, 2026' },
        attendees: { fr: '32 participants', ar: '32 مسافرون', en: '32 travelling' },
        image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&h=500&fit=crop',
        description: {
            fr: "Rejoignez notre circuit durant le pic du hanami pour des vues inoubliables de sakura.",
            ar: 'انضم إلى جولتنا الجماعية خلال ذروة الهانامي لمشاهدة أزهار الساكورا التي لا تُنسى.',
            en: 'Join our group tour during peak hanami for unforgettable sakura views.',
        },
    },
    {
        title: { fr: 'La Tomatina', ar: 'لا توماتينا', en: 'La Tomatina' },
        location: { fr: 'Buñol, Espagne', ar: 'بنيول، إسبانيا', en: 'Buñol, Spain' },
        date: { fr: '26 août 2026', ar: '26 أغسطس 2026', en: 'August 26, 2026' },
        attendees: { fr: '18 participants', ar: '18 مسافرون', en: '18 travelling' },
        image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop',
        description: {
            fr: "La plus grande bataille alimentaire du monde — semaine complète de festivités incluse.",
            ar: 'أكبر معركة طعام في العالم — أسبوع كامل من الاحتفالات متضمن.',
            en: "The world's biggest food fight — full week of festivities included.",
        },
    },
    {
        title: { fr: 'Retraite Aurores Boréales', ar: 'منتجع الشفق القطبي', en: 'Northern Lights Retreat' },
        location: { fr: 'Tromsø, Norvège', ar: 'ترومسو، النرويج', en: 'Tromsø, Norway' },
        date: { fr: '15 – 22 fév. 2026', ar: '15 – 22 فبراير 2026', en: 'Feb 15 – 22, 2026' },
        attendees: { fr: '12 participants', ar: '12 مسافرون', en: '12 travelling' },
        image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&h=500&fit=crop',
        description: {
            fr: "Chasse aux aurores, traîneau à chiens et expériences culturelles sami.",
            ar: 'مطاردة الشفق القطبي، زلاجات الرنة وتجارب ثقافية سامي.',
            en: 'Aurora chasing, husky sledding, and Sami cultural experiences.',
        },
    },
    {
        title: { fr: 'Carnaval de Venise', ar: 'كرنفال البندقية', en: 'Carnival of Venice' },
        location: { fr: 'Venise, Italie', ar: 'البندقية، إيطاليا', en: 'Venice, Italy' },
        date: { fr: '8 – 17 fév. 2026', ar: '8 – 17 فبراير 2026', en: 'Feb 8 – 17, 2026' },
        attendees: { fr: '24 participants', ar: '24 مسافرون', en: '24 travelling' },
        image: 'https://images.unsplash.com/photo-1495904786722-d2b5a19a8535?w=800&h=500&fit=crop',
        description: {
            fr: 'Bals masqués, promenades en gondole et dîners dans des palais historiques.',
            ar: 'كرنفالات متنكرة، رحلات بقارب الجندول وعشاءات في قصور تاريخية.',
            en: 'Masquerade balls, gondola rides and historic palazzo dinners.',
        },
    },
];

const Events = () => {
    const { t, lang } = useLanguage();

    return (
        <PageShell
            titleKey="events.title"
            subtitleKey="events.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.events'), active: true },
            ]}
        >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {events.map((e, i) => (
                    <motion.div
                        key={`${localize(e.title, lang)}-${i}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card-elevated group overflow-hidden rounded-2xl bg-card"
                    >
                        <div className="h-56 overflow-hidden">
                            <img
                                src={e.image}
                                alt={localize(e.title, lang)}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                        <div className="p-6">
                            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> {localize(e.date, lang)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {localize(e.location, lang)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" /> {localize(e.attendees, lang)}
                                </span>
                            </div>
                            <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                                {localize(e.title, lang)}
                            </h3>
                            <p className="mb-5 text-sm text-muted-foreground">
                                {localize(e.description, lang)}
                            </p>
                            <Button className="bg-primary text-primary-foreground">
                                {t('events.reserve')}
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </PageShell>
    );
};

export default Events;
