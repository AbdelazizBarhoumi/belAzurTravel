import { motion } from 'framer-motion';
import { Link2, MapPin, Mail } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    contactMethods as contactMethodDefs,
    socialLinks as socialLinkDefs,
} from '@/data';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function Contact() {
    const { lang, t } = useLanguage();
    const { settings } = useSiteSettings();

    const resolveLocalizedText = (
        value: Record<string, string> | undefined,
        fallback: string,
    ) => value?.[lang] ?? value?.en ?? value?.fr ?? value?.ar ?? fallback;

    const contactContent = settings.content?.contact;
    const contactTitle = resolveLocalizedText(
        contactContent?.title,
        t('contact.title'),
    );
    const contactDescription = resolveLocalizedText(
        contactContent?.description,
        t('contact.description'),
    );
    const contactKicker = resolveLocalizedText(
        contactContent?.kicker,
        t('contact.kicker'),
    );
    const contactLocationTitle = resolveLocalizedText(
        contactContent?.locationTitle,
        t('contact.locationTitle'),
    );
    const contactLocationSubtitle = resolveLocalizedText(
        contactContent?.locationSubtitle,
        t('contact.locationSubtitle'),
    );
    const contactSocialTitle = resolveLocalizedText(
        contactContent?.socialTitle,
        t('contact.socialTitle'),
    );
    const contactSocialDescription = resolveLocalizedText(
        contactContent?.socialDescription,
        t('contact.socialDescription'),
    );
    const contactCtaTitle = resolveLocalizedText(
        contactContent?.ctaTitle,
        t('contact.ctaTitle'),
    );
    const contactCtaDescription = resolveLocalizedText(
        contactContent?.ctaDescription,
        t('contact.ctaDescription'),
    );
    const companyHours = settings.hours.length > 0 ? settings.hours : [];
    const companySocials = settings.socialLinks;
    const mapQuery = settings.plusCode || settings.address || '';

    // Always show all 3 contact method cards, but ONLY with data from settings
    const contactMethods = [
        {
            labelKey: 'contact.calls',
            value: settings.phone || '',
            href: settings.phone
                ? `tel:${settings.phone.replace(/\D/g, '')}`
                : '#',
            icon: contactMethodDefs.find((m) => m.labelKey === 'contact.calls')?.icon,
        },
        {
            labelKey: 'contact.email',
            value: settings.email || '',
            href: settings.email ? `mailto:${settings.email}` : '#',
            icon: contactMethodDefs.find((m) => m.labelKey === 'contact.email')?.icon,
        },
        {
            labelKey: 'contact.whatsapp',
            value: settings.whatsapp || settings.phone || '',
            href:
                settings.whatsapp || settings.phone
                    ? `https://wa.me/${(settings.whatsapp || settings.phone).replace(/\D/g, '')}`
                    : '#',
            icon: contactMethodDefs.find((m) => m.labelKey === 'contact.whatsapp')?.icon,
        },
    ];

    const getSocialIcon = (label: string) => {
        const link = socialLinkDefs.find(
            (c) => c.label.toLowerCase() === label.toLowerCase(),
        );
        return link?.icon || Link2;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
            <Navbar />
            <main className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 border-b border-border pb-6"
                    >
                        <Breadcrumb
                            items={[
                                { label: t('common.home'), href: '/' },
                                { label: t('nav.contact'), active: true },
                            ]}
                        />
                    </motion.div>
                </div>
                <section className="border-b border-border/40 pt-5">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="mx-auto max-w-3xl text-center"
                        >
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                                {contactKicker}
                            </p>
                            <h1 className="font-serif text-4xl font-bold text-foreground md:text-6xl">
                                {contactTitle}
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                                {contactDescription}
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="container mx-auto px-4 py-16">
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.35 }}
                                className="grid gap-4 md:grid-cols-3"
                            >
                                {contactMethods.map((method) => {
                                    const Icon = method.icon;
                                    return (
                                        <a
                                            key={method.labelKey}
                                            href={method.href}
                                            className="group rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                                        >
                                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                                {Icon && (
                                                    <Icon className="h-5 w-5" />
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                                {t(method.labelKey)}
                                            </p>
                                            <p className="mt-2 text-base font-medium text-foreground">
                                                {method.value || '—'}
                                            </p>
                                        </a>
                                    );
                                })}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.35, delay: 0.05 }}
                                className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-serif text-2xl font-bold text-foreground">
                                            {contactLocationTitle}
                                        </h2>
                                        {contactLocationSubtitle && (
                                            <p className="text-sm text-muted-foreground">
                                                {contactLocationSubtitle}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {mapQuery && (
                                    <>
                                        <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                                            <iframe
                                                title={t('contact.mapTitle')}
                                                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                                                className="h-[360px] w-full"
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            />
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                                            <span>
                                                {settings.plusCode ||
                                                    settings.address}
                                            </span>
                                            <a
                                                href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {t('contact.openMap')}
                                            </a>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </div>

                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.35, delay: 0.06 }}
                                className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
                            >
                                <h2 className="font-serif text-2xl font-bold text-foreground">
                                    {settings.companyName ||
                                        t('admin.siteSettings')}
                                </h2>
                                {settings.address && (
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        {settings.address}
                                    </p>
                                )}
                                {companyHours.length > 0 && (
                                    <div className="mt-5 space-y-2 text-sm text-muted-foreground">
                                        {companyHours.map((row, idx) => (
                                            <div
                                                key={idx}
                                                className="flex justify-between gap-3"
                                            >
                                                <span>{row.dayKey}</span>
                                                <span className="text-foreground">
                                                    {row.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.35, delay: 0.1 }}
                                className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
                            >
                                <h2 className="font-serif text-2xl font-bold text-foreground">
                                    {contactSocialTitle}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {contactSocialDescription}
                                </p>

                                {companySocials.length > 0 && (
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        {companySocials.map((social) => {
                                            const Icon = getSocialIcon(
                                                social.label,
                                            );
                                            return (
                                                <a
                                                    key={social.label}
                                                    href={social.href}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span>{social.label}</span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.35, delay: 0.15 }}
                                className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary to-secondary p-6 text-primary-foreground shadow-lg"
                            >
                                <h2 className="font-serif text-2xl font-bold">
                                    {contactCtaTitle}
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
                                    {contactCtaDescription}
                                </p>
                                {settings.email ? (
                                    <a
                                        href={`mailto:${settings.email}`}
                                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
                                    >
                                        <Mail className="h-4 w-4" />
                                        {settings.email}
                                    </a>
                                ) : (
                                    <p className="mt-6 text-sm text-primary-foreground/60">
                                        —
                                    </p>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

