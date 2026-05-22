import { Link2, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notifyInteraction } from '@/api/interactions.api';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { socialLinks as socialLinks } from '@/data';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
    getFooterPage,
    DEFAULT_NAV_SETTINGS,
    type NavSettings,
} from '@/lib/nav-config';
import {
    formatHourGroupLabel,
    formatHourRanges,
    groupConsecutiveHours,
    normalizeHours,
} from '@/lib/site-hours';

type LocalizedText = Record<string, string>;

export function Footer() {
    const { lang, t } = useLanguage();
    const { settings, loading } = useSiteSettings();

    const footerTagline =
        settings.content?.footer?.tagline?.[lang] ??
        settings.content?.footer?.tagline?.en ??
        settings.content?.footer?.tagline?.fr ??
        t('footer.tagline');

    const resolveColTitle = (
        title: string | LocalizedText | null | undefined,
    ) => {
        if (!title) return '';
        if (typeof title === 'string') return title;
        return title[lang] ?? title.en ?? '';
    };

    const resolveSocialIcon = (label: string) => {
        const link = socialLinks.find(
            (c) => c.label.toLowerCase() === label.toLowerCase(),
        );
        return link?.icon || Link2;
    };

    const getDayLabel = (dayKey: string) =>
        dayKey.startsWith('footer.') ? t(dayKey) : dayKey;

    const groupedHours = groupConsecutiveHours(normalizeHours(settings.hours));

    if (loading) {
        return (
            <footer className="bg-foreground text-primary-foreground">
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-4 lg:col-span-2">
                            <div className="h-7 w-44 animate-pulse rounded" />
                            <div className="h-4 w-72 animate-pulse rounded" />
                            <div className="h-4 w-56 animate-pulse rounded" />
                        </div>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-5 w-28 animate-pulse rounded" />
                                <div className="h-4 w-24 animate-pulse rounded" />
                                <div className="h-4 w-20 animate-pulse rounded" />
                                <div className="h-4 w-24 animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 h-4 w-64 animate-pulse rounded bg-primary-foreground/20" />
                </div>
            </footer>
        );
    }

    // Use persisted nav settings from DB (defaults are only a safety fallback)
    let navSettings: NavSettings = DEFAULT_NAV_SETTINGS;
    if (settings.content?.nav?.settings) {
        navSettings = settings.content.nav.settings;
    }

    return (
        <footer className="bg-foreground text-primary-foreground">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <BrandLogo
                            className="mb-4 flex items-center gap-2"
                            imageClassName="h-7 w-auto"
                            textClassName="font-serif text-xl font-bold text-primary-foreground"
                        />
                        <p className="mb-6 max-w-sm text-sm leading-relaxed text-primary-foreground/60">
                            {footerTagline}
                        </p>
                        <div className="flex gap-3">
                            {settings.socialLinks.map((link, i) => {
                                const Icon = resolveSocialIcon(link.label);
                                return (
                                    <a
                                        key={i}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-secondary hover:text-secondary-foreground"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dynamic columns from settings */}
                    {navSettings.footer.slice(0, 2).map((col, idx) => (
                        <div key={idx}>
                            <h4 className="mb-4 font-serif font-bold">
                                {resolveColTitle(col.title)}
                            </h4>
                            <div className="flex flex-col gap-2">
                                {col.pageKeys.map((k) => {
                                    const p = getFooterPage(k);
                                    if (!p) return null;
                                    return (
                                        <Link
                                            key={k}
                                            to={p.href}
                                            className="text-sm text-primary-foreground/60 transition-colors hover:text-secondary"
                                        >
                                            {t(`nav.${p.key}`)}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Contact + Hours */}
                    <div>
                        <h4 className="mb-4 font-serif font-bold">
                            {t('footer.contact')}
                        </h4>
                        <div className="mb-6 flex flex-col gap-3 text-sm text-primary-foreground/60">
                            {settings.email && (
                                <a
                                    href={`mailto:${settings.email}`}
                                    className="flex items-center gap-3 hover:text-secondary"
                                >
                                    <Mail className="h-4 w-4 shrink-0 text-secondary" />{' '}
                                    {settings.email}
                                </a>
                            )}
                            {settings.phone && (
                                <a
                                    href={`tel:${settings.phone.replace(/\D/g, '')}`}
                                    onClick={() => notifyInteraction('call')}
                                    className="flex items-center gap-3 hover:text-secondary"
                                >
                                    <Phone className="h-4 w-4 shrink-0 text-secondary" />{' '}
                                    {settings.phone}
                                </a>
                            )}
                            {settings.address && (
                                <a
                                    href={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-start gap-3 hover:text-secondary"
                                >
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                                    <span>{settings.address}</span>
                                </a>
                            )}
                        </div>
                        <h4 className="mb-3 flex items-center gap-2 font-serif font-bold">
                            <Clock className="h-4 w-4 text-secondary" />{' '}
                            {t('footer.hours')}
                        </h4>
                        <div className="space-y-1.5 text-sm text-primary-foreground/60">
                            {groupedHours.length > 0 ? (
                                groupedHours.map((group, i) => (
                                    <div
                                        key={`${group.dayKeys.join('-')}-${i}`}
                                        className="flex justify-between gap-3"
                                    >
                                        <span>
                                            {formatHourGroupLabel(
                                                group,
                                                getDayLabel,
                                            )}
                                        </span>
                                        <span className="text-primary-foreground/80">
                                            {formatHourRanges(
                                                {
                                                    dayKey: group.dayKeys[0],
                                                    ranges: group.ranges,
                                                    closed: group.closed,
                                                },
                                                t('footer.closed'),
                                            )}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p>—</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Extra columns beyond first 2 (if admin defined more) */}
                {navSettings.footer.length > 2 && (
                    <div className="mt-10 grid gap-10 border-t border-primary-foreground/10 pt-10 md:grid-cols-3">
                        {navSettings.footer.slice(2).map((col, idx) => (
                            <div key={idx}>
                                <h4 className="mb-4 font-serif font-bold">
                                    {resolveColTitle(col.title)}
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {col.pageKeys.map((k) => {
                                        const p = getFooterPage(k);
                                        if (!p) return null;
                                        return (
                                            <Link
                                                key={k}
                                                to={p.href}
                                                className="text-sm text-primary-foreground/60 transition-colors hover:text-secondary"
                                            >
                                                {p.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-12 border-t border-primary-foreground/10 pt-8 text-center text-sm text-primary-foreground/40">
                    © {settings.year ?? new Date().getFullYear()}{' '}
                    {settings.companyName}. {t('footer.rights')}
                </div>
            </div>
        </footer>
    );
}
