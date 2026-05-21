import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Linkedin, Twitter, Mail } from 'lucide-react';
import { getTeamMembers } from '@/api/entities.api';
import { localizeText } from '@/api/entities.api';
import { PageShell } from '@/components/layout/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';

const Team = () => {
    const { lang, t } = useLanguage();
    const { data: teamMembers = [], isLoading } = useQuery({
        queryKey: ['team'],
        queryFn: getTeamMembers,
    });

    if (isLoading) return <div>Loading...</div>;

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
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="card-elevated overflow-hidden rounded-2xl bg-card text-center"
                    >
                        <div className="aspect-square overflow-hidden">
                            <img
                                src={m.image}
                                alt={localizeText(m.name, lang)}
                                className="h-full w-full object-cover"
                                loading="lazy"
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="font-serif text-xl font-bold text-foreground">
                                {localizeText(m.name, lang)}
                            </h3>
                            <p className="mb-3 text-sm font-semibold text-secondary">
                                {localizeText(m.role, lang)}
                            </p>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {localizeText(m.bio, lang)}
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                {m.linkedin && (
                                    <a
                                        href={m.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <Linkedin className="h-4 w-4" />
                                    </a>
                                )}
                                {m.twitter && (
                                    <a
                                        href={m.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <Twitter className="h-4 w-4" />
                                    </a>
                                )}
                                {m.email && (
                                    <a
                                        href={`mailto:${m.email}`}
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <Mail className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </PageShell>
    );
};

export default Team;
