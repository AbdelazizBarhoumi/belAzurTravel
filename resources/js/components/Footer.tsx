import {
    Mail,
    Phone,
    MapPin,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import footerLogo from '@/assets/brand-logo-footer.png';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
    const { t } = useLanguage();

    const quickLinks = [
        { labelKey: 'nav.destinations', href: '/destinations' },
        { labelKey: 'nav.hotels', href: '/hotels' },
        { labelKey: 'nav.tours', href: '/tours' },
        { labelKey: 'nav.deals', href: '/deals' },
        { labelKey: 'nav.contact', href: '/contact' },
        { labelKey: 'nav.gallery', href: '/gallery' },
        { labelKey: 'nav.events', href: '/events' },
        { labelKey: 'nav.blog', href: '/blog' },
    ];

    const supportLinks = [
        { labelKey: 'nav.team', href: '/team' },
        { labelKey: 'nav.legal', href: '/legal' },
        { labelKey: 'nav.cars', href: '/cars' },
        { labelKey: 'nav.flights', href: '/flights' },
        { labelKey: 'nav.promos', href: '/promos' },
    ];
    return (
        <footer className="bg-foreground text-primary-foreground">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <BrandLogo
                            className="mb-4 flex items-center gap-2"
                            imageClassName="h-28 w-auto"
                            textClassName="font-serif text-xl font-bold text-primary-foreground"
                            showText={false}
                            src={footerLogo}
                        />
                        <p className="mb-6 max-w-sm text-sm leading-relaxed text-primary-foreground/60">
                            {t('footer.tagline')}
                        </p>
                        <div className="flex gap-3">
                            {[Facebook, Twitter, Instagram, Youtube].map(
                                (Icon, i) => (
                                    <a
                                        key={i}
                                        href="#"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-secondary hover:text-secondary-foreground"
                                    >
                                        <Icon className="h-4 w-4" />
                                    </a>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="mb-4 font-serif font-bold">
                            {t('footer.quick')}
                        </h4>
                        <div className="flex flex-col gap-2">
                            {quickLinks.map((l) => (
                                <Link
                                    key={l.href}
                                    to={l.href}
                                    className="text-sm text-primary-foreground/60 transition-colors hover:text-secondary"
                                >
                                    {t(l.labelKey)}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="mb-4 font-serif font-bold">
                            {t('footer.support')}
                        </h4>
                        <div className="flex flex-col gap-2">
                            {supportLinks.map((l) => (
                                <Link
                                    key={l.href}
                                    to={l.href}
                                    className="text-sm text-primary-foreground/60 transition-colors hover:text-secondary"
                                >
                                    {t(l.labelKey)}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Contact + Hours */}
                    <div>
                        <h4 className="mb-4 font-serif font-bold">
                            {t('footer.contact')}
                        </h4>
                        <div className="mb-6 flex flex-col gap-3 text-sm text-primary-foreground/60">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 shrink-0 text-secondary" />{' '}
                                hello@voyageur.com
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 shrink-0 text-secondary" />{' '}
                                +1 (555) 123-4567
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{' '}
                                123 Travel St, NY 10001
                            </div>
                        </div>
                        <h4 className="mb-3 flex items-center gap-2 font-serif font-bold">
                            <Clock className="h-4 w-4 text-secondary" />{' '}
                            {t('footer.hours')}
                        </h4>
                        <div className="space-y-1.5 text-sm text-primary-foreground/60">
                            <div className="flex justify-between gap-3">
                                <span>{t('footer.monfri')}</span>
                                <span className="text-primary-foreground/80">
                                    09:00 – 19:00
                                </span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span>{t('footer.sat')}</span>
                                <span className="text-primary-foreground/80">
                                    10:00 – 17:00
                                </span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span>{t('footer.sun')}</span>
                                <span className="text-primary-foreground/80">
                                    {t('footer.closed')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-primary-foreground/10 pt-8 text-center text-sm text-primary-foreground/40">
                    © 2026 BelAzurTravel. {t('footer.rights')}
                </div>
            </div>
        </footer>
    );
}
