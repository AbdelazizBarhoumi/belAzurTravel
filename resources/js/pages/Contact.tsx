import { motion } from 'framer-motion';
import {
    Facebook,
    Instagram,
    Linkedin,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Twitter,
    Youtube,
} from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContactMethod {
    label: string;
    value: string;
    href: string;
    icon: typeof Phone;
}

interface SocialLink {
    label: string;
    href: string;
    icon: typeof Facebook;
}

export default function Contact() {
    const { t } = useLanguage();

    const contactMethods: ContactMethod[] = [
        {
            label: t('contact.calls'),
            value: '+1 (555) 123-4567',
            href: 'tel:+15551234567',
            icon: Phone,
        },
        {
            label: t('contact.whatsapp'),
            value: '+1 (555) 123-4567',
            href: 'https://wa.me/15551234567',
            icon: MessageCircle,
        },
        {
            label: t('contact.email'),
            value: 'hello@voyageur.com',
            href: 'mailto:hello@voyageur.com',
            icon: Mail,
        },
    ];

    const socialLinks: SocialLink[] = [
        { label: 'Facebook', href: 'https://facebook.com', icon: Facebook },
        { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
        { label: 'Twitter', href: 'https://x.com', icon: Twitter },
        { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
        { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
    ];

    return (
        <div className="min-h-screen bg-background">
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
                <section className="border-b border-border/40 bg-gradient-to-b from-primary/10 to-background pt-5">
                    <div className="container mx-auto px-4 py-16 md:py-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="mx-auto max-w-3xl text-center"
                        >
                            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                                {t('contact.kicker')}
                            </p>
                            <h1 className="font-serif text-4xl font-bold text-foreground md:text-6xl">
                                {t('contact.title')}
                            </h1>
                            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                                {t('contact.description')}
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
                                            key={method.label}
                                            href={method.href}
                                            className="group rounded-3xl border border-border/60 bg-card p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                                        >
                                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                                {method.label}
                                            </p>
                                            <p className="mt-2 text-base font-medium text-foreground">
                                                {method.value}
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
                                        <h2 className="text-2xl font-serif font-bold text-foreground">
                                            {t('contact.locationTitle')}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {t('contact.locationSubtitle')}
                                        </p>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
                                    <iframe
                                        title={t('contact.mapTitle')}
                                        src="https://www.google.com/maps?q=123%20Travel%20St%2C%20NY%2010001&output=embed"
                                        className="h-[360px] w-full"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                                    <span>123 Travel St, NY 10001</span>
                                    <a
                                        href="https://www.google.com/maps?q=123+Travel+St,+NY+10001"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium text-primary hover:underline"
                                    >
                                        {t('contact.openMap')}
                                    </a>
                                </div>
                            </motion.div>
                        </div>

                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.35, delay: 0.1 }}
                                className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
                            >
                                <h2 className="text-2xl font-serif font-bold text-foreground">
                                    {t('contact.socialTitle')}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {t('contact.socialDescription')}
                                </p>

                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    {socialLinks.map((social) => {
                                        const Icon = social.icon;
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
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.35, delay: 0.15 }}
                                className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary to-secondary p-6 text-primary-foreground shadow-lg"
                            >
                                <h2 className="text-2xl font-serif font-bold">
                                    {t('contact.ctaTitle')}
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
                                    {t('contact.ctaDescription')}
                                </p>
                                <a
                                    href="mailto:hello@voyageur.com"
                                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5"
                                >
                                    <Mail className="h-4 w-4" />
                                    hello@voyageur.com
                                </a>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
