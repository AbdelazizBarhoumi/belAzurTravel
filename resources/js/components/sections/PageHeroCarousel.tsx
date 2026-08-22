import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { cn } from '@/lib/utils';

interface PageHeroCarouselProps {
    pageKey: string;
    className?: string;
    height?: string;
}

export function PageHeroCarousel({
    pageKey,
    className,
    height = '300px',
}: PageHeroCarouselProps) {
    const { settings } = useSiteSettings();
    const { lang, dir } = useLanguage();
    const heroConfig = settings.content?.page_heroes?.[pageKey];
    const slides = heroConfig?.images ?? [];
    const interval = heroConfig?.interval ?? 6000;

    const [currentIdx, setCurrentIdx] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const next = useCallback(() => {
        setCurrentIdx((i) => (i + 1) % slides.length);
    }, [slides.length]);

    const prev = useCallback(() => {
        setCurrentIdx((i) => (i - 1 + slides.length) % slides.length);
    }, [slides.length]);

    useEffect(() => {
        if (slides.length <= 1 || isPaused) return;
        const timer = setInterval(next, interval);
        return () => clearInterval(timer);
    }, [next, interval, slides.length, isPaused]);

    if (slides.length === 0) return null;

    const slide = slides[currentIdx];
    const titleText = slide.title?.[lang] ?? slide.title?.en ?? '';
    const subtitleText = slide.subtitle?.[lang] ?? slide.subtitle?.en ?? '';

    return (
        <section
            className={cn('relative pt-24', className)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="relative w-full overflow-hidden">
                <div className="relative w-full" style={{ height }}>
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={currentIdx}
                            src={slide.url}
                            alt={titleText}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7 }}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute inset-0 flex items-end">
                        <div className="w-full px-6 pb-8 md:px-10 md:pb-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIdx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    {titleText && (
                                        <h2
                                            className={cn(
                                                'mb-2 font-serif text-3xl font-bold text-white drop-shadow-lg md:text-5xl',
                                                dir === 'rtl' && 'text-right',
                                            )}
                                        >
                                            {titleText}
                                        </h2>
                                    )}
                                    {subtitleText && (
                                        <p
                                            className={cn(
                                                'max-w-xl text-lg text-white/80 drop-shadow md:text-xl',
                                                dir === 'rtl' && 'text-right',
                                            )}
                                        >
                                            {subtitleText}
                                        </p>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {slides.length > 1 && (
                        <>
                            <button
                                onClick={dir === 'rtl' ? next : prev}
                                aria-label="Previous"
                                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 backdrop-blur transition-colors hover:bg-card"
                            >
                                <ChevronLeft className="h-5 w-5 text-foreground" />
                            </button>
                            <button
                                onClick={dir === 'rtl' ? prev : next}
                                aria-label="Next"
                                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 backdrop-blur transition-colors hover:bg-card"
                            >
                                <ChevronRight className="h-5 w-5 text-foreground" />
                            </button>

                            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                                {slides.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentIdx(i)}
                                        className={cn(
                                            'h-1.5 rounded-full transition-all',
                                            i === currentIdx
                                                ? 'w-6 bg-secondary'
                                                : 'w-1.5 bg-card/60',
                                        )}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
