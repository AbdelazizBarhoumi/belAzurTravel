import type React from 'react';
import { Mail, Phone, MapPin, Clock, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notifyInteraction } from '@/api/interactions.api';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import { socialLinks as socialLinks } from '@/data';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
    FacebookIcon,
    InstagramIcon,
    TwitterIcon,
    LinkedinIcon,
    YoutubeIcon,
    TiktokIcon,
} from '@/components/ui/SocialIcons';
import { PaymentLogos } from '@/components/ui/PaymentIcons';
import { ShieldCheck } from 'lucide-react';
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
        const brandIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
            facebook: FacebookIcon,
            instagram: InstagramIcon,
            twitter: TwitterIcon,
            linkedin: LinkedinIcon,
            youtube: YoutubeIcon,
            tiktok: TiktokIcon,
        };
        return brandIcons[label.toLowerCase()] || Link2;
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
            {/* ===== ROW 1: Brand + Contact + Opening Hours ===== */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 items-start">
                <div className="lg:col-span-2">
                    <BrandLogo
                        className="mb-4 flex items-center gap-2"
                        imageClassName="h-12 w-auto"
                        textClassName="font-serif text-xl font-bold text-primary-foreground"
                    />
                    <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/60">
                        {footerTagline}
                    </p>
                </div>

                <div className="lg:col-span-2">
                    <h4 className="mb-4 font-serif font-bold">{t('footer.contact')}</h4>
                    <div className="flex flex-col gap-3 text-sm text-primary-foreground/60">
                        {settings.email && (
                            <a href={`mailto:${settings.email}`} className="flex items-center gap-3 hover:text-secondary">
                                <Mail className="h-4 w-4 shrink-0 text-secondary" /> {settings.email}
                            </a>
                        )}
                        {settings.phone && (
                            <a href={`tel:${settings.phone.replace(/\D/g, '')}`} onClick={() => notifyInteraction('call')} className="flex items-center gap-3 hover:text-secondary">
                                <Phone className="h-4 w-4 shrink-0 text-secondary" /> {settings.phone}
                            </a>
                        )}
                        {settings.phone2 && (
                            <a href={`tel:${settings.phone2.replace(/\D/g, '')}`} onClick={() => notifyInteraction('call')} className="flex items-center gap-3 hover:text-secondary">
                                <Phone className="h-4 w-4 shrink-0 text-secondary" /> {settings.phone2}
                            </a>
                        )}
                        {settings.address && (
                            <a href={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 hover:text-secondary">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                                <span>{settings.address}</span>
                            </a>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <h4 className="mb-3 flex items-center gap-2 font-serif font-bold">
                        <Clock className="h-4 w-4 text-secondary" /> {t('footer.hours')}
                    </h4>
                    <div className="space-y-1.5 text-sm text-primary-foreground/60">
                        {groupedHours.length > 0 ? (
                            groupedHours.map((group, i) => (
                                <div key={`${group.dayKeys.join('-')}-${i}`} className="flex justify-between gap-3">
                                    <span>{formatHourGroupLabel(group, getDayLabel)}</span>
                                    <span className="text-primary-foreground/80">
                                        {formatHourRanges({ dayKey: group.dayKeys[0], ranges: group.ranges, closed: group.closed }, t('footer.closed'))}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p>—</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== ROW 2: Nav Columns (justify-between) ===== */}
            <div className="mt-12 border-t border-primary-foreground/10 pt-10">
                <div className="flex flex-col sm:flex-row justify-between gap-10">
                    {navSettings.footer.map((col, idx) => (
                        <div key={idx} className="flex-1 ">
                            <h4 className="mb-4 font-serif font-bold">{resolveColTitle(col.title)}</h4>
                            <div className="flex flex-col gap-2">
                                {col.pageKeys.map((k) => {
                                    const p = getFooterPage(k);
                                    if (!p) return null;
                                    return (
                                        <Link key={k} to={p.href} className="text-sm text-primary-foreground/60 transition-colors hover:text-secondary">
                                            {idx < 2 ? t(`nav.${p.key}`) : p.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== ROW 4: Social + Secure Payment +  Copyright ===== */}
            <div className="mt-12 border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left text-sm text-primary-foreground/40">
                    © {settings.year ?? new Date().getFullYear()} {settings.companyName}. {t('footer.rights')}
                </div>
                <div className="flex flex-col items-center gap-4">
                    <PaymentLogos />
                </div>
                <div className="flex gap-3">
                    {settings.socialLinks.map((link, i) => {
                        const Icon = resolveSocialIcon(link.label);
                        return (
                            <a key={i} href={link.href} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white transition-transform hover:scale-110">
                                <Icon className="h-4 w-4" />
                            </a>
                        );
                    })}
                </div>
            </div>
        </div>
    </footer>
);
}
