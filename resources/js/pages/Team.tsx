import { motion } from 'framer-motion';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { teamMembers } from '@/data/catalog';
import { localizeKnown, teamBioLabels, teamRoleLabels } from '@/lib/adminI18n';

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
                {teamMembers.map((m, i) => (
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
