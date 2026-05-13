import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface Props {
    titleKey: string;
    subtitleKey: string;
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export function PageShell({
    titleKey,
    subtitleKey,
    children,
    breadcrumbs,
}: Props) {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main id="main-content" className="pb-16 pt-24">
                <div className="container mx-auto px-4">
                    {breadcrumbs && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 border-b border-border pb-6"
                        >
                            <Breadcrumb items={breadcrumbs} />
                        </motion.div>
                    )}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {t(titleKey)}
                        </h1>
                        <p className="mx-auto max-w-xl text-muted-foreground">
                            {t(subtitleKey)}
                        </p>
                    </motion.div>
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
}
