import { motion } from 'framer-motion';
import { SearchWidget } from '@/components/ui/SearchWidget';
export function HeroSection() {

    return (
        <section className="relative -mt-[160px] flex items-center justify-center overflow-hidden pb-8">
            {/* Content */}
            <div className="container relative z-10 mx-auto px-4 -pt-4 text-center">

                {/* Kicker 
            
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-secondary"
                >
                    {t('hero.kicker')}
                </motion.p>

                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mx-auto mb-4 max-w-3xl text-lg font-medium text-primary-foreground/90 md:text-xl"
                ></motion.p>
*/}
                {/* Heading 
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6 font-serif text-5xl font-bold leading-tight text-primary-foreground md:text-7xl lg:text-8xl"
                >
                    {t('hero.title1')}
                    <br />
                    <span className="italic text-secondary">
                        {t('hero.title2')}
                    </span>{' '}
                    {t('hero.title3')}
                </motion.h1>
*/}
                {/* Description 
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mx-auto mb-10 max-w-2xl text-base text-primary-foreground/80 md:text-xl"
                >
                    {t('hero.description')}
                </motion.p>*/}

                {/* Search Box */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mx-auto max-w-6xl"
                >
                    <SearchWidget />
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mx-auto mt-6 max-w-2xl text-sm text-primary-foreground/70"
                ></motion.p>
            </div>
        </section>
    );
}
