import { motion } from 'framer-motion';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeKnown, teamBioLabels, teamRoleLabels } from '@/lib/adminI18n';

const team = [
    {
        name: 'Amélie Laurent',
        role: 'Founder & CEO',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        bio: '20+ years curating luxury journeys across 80 countries.',
    },
    {
        name: 'Karim Benali',
        role: 'Head of Operations',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
        bio: 'Logistics wizard turning dreams into seamless reality.',
    },
    {
        name: 'Sofia Marquez',
        role: 'Lead Travel Designer',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
        bio: 'Crafting unforgettable cultural and adventure itineraries.',
    },
    {
        name: 'Hiroshi Tanaka',
        role: 'Asia-Pacific Director',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
        bio: 'Local expertise from Tokyo to Bali.',
    },
    {
        name: "Emma O'Connor",
        role: 'Customer Experience',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
        bio: 'Your dedicated point of contact, every step of the way.',
    },
    {
        name: 'Ethan Wright',
        role: 'Sustainability Lead',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
        bio: 'Pioneering eco-conscious travel programs worldwide.',
    },
];

const Team = () => {
    const { lang } = useLanguage();
    const { t } = useLanguage();

    return (
        <PageShell
            titleKey="team.title"
            subtitleKey="team.subtitle"
            breadcrumbs={[
                { label: t('common.home'), href: '/' },
                { label: t('nav.team'), active: true },
            ]}
        >
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((m, i) => (
                    <motion.div
                        key={m.name}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="card-elevated overflow-hidden rounded-2xl bg-card text-center"
                    >
                        <div className="aspect-square overflow-hidden">
                            <img
                                src={m.image}
                                alt={m.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="font-serif text-xl font-bold text-foreground">
                                {m.name}
                            </h3>
                            <p className="mb-3 text-sm font-semibold text-secondary">
                                {localizeKnown(m.role, teamRoleLabels, lang)}
                            </p>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {localizeKnown(m.bio, teamBioLabels, lang)}
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                {[Linkedin, Twitter, Mail].map((Icon, idx) => (
                                    <a
                                        key={idx}
                                        href="#"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </PageShell>
    );
};

export default Team;
