import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ThemeIcons } from '@/components/cards/ThemeIcons';
import { useLanguage } from '@/contexts/LanguageContext';

export interface HDeal {
    id: string;
    title: string;
    price: string;
    meta: string;
    image: string;
    href: string;
    amenities?: Array<{ name: Record<string, string>; icon: string }>;
    tags?: string[];
}
interface Props {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    items: HDeal[];
    accent?: 'primary' | 'secondary';
}
export function HorizontalDeals({
    eyebrow,
    title,
    description,
    ctaLabel,
    ctaHref,
    items,
    accent = 'primary',
}: Props) {
    const { t } = useLanguage();
    const scroller = useRef<HTMLDivElement>(null);
    const scroll = (dir: 'l' | 'r') => {
        const el = scroller.current;
        if (!el) return;
        el.scrollBy({
            left: (dir === 'l' ? -1 : 1) * (el.clientWidth * 0.8),
            behavior: 'smooth',
        });
    };
    const accentBg = accent === 'primary' ? 'bg-primary' : 'bg-secondary';
    const accentText = accent === 'primary' ? 'text-primary' : 'text-secondary';
    return (
        <section className="bg-muted/50 py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[280px_1fr]">
                    <div>
                        <p
                            className={`font-serif text-2xl italic ${accentText} mb-1`}
                        >
                            {eyebrow}
                        </p>
                        <h2 className="mb-3 font-serif text-3xl font-bold uppercase tracking-tight text-foreground md:text-4xl">
                            {title}
                        </h2>
                        <div className={`h-0.5 w-16 ${accentBg} mb-4`} />
                        <p className="mb-5 text-sm text-muted-foreground">
                            {description}
                        </p>
                        <Link
                            to={ctaHref}
                            className={`inline-block rounded-md px-5 py-2.5 ${accentBg} text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90`}
                        >
                            {ctaLabel}
                        </Link>
                    </div>
                    <div className="relative min-w-0">
                        <div
                            ref={scroller}
                            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {items.map((it) => (
                                <Link
                                    key={it.id}
                                    to={it.href}
                                    className="card-elevated group relative aspect-[3/4] w-[260px] shrink-0 snap-start overflow-hidden rounded-xl bg-card md:w-[300px]"
                                >
                                    <img
                                        src={it.image}
                                        alt={it.title}
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-primary/80 to-transparent p-4">
                                        <h3 className="line-clamp-2 font-serif text-lg font-bold text-primary-foreground drop-shadow">
                                            {it.title}
                                        </h3>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 to-transparent p-4">
                                        {it.tags?.length ||
                                        it.amenities?.length ? (
                                            <div className="mb-1.5">
                                                <ThemeIcons
                                                    tags={it.tags}
                                                    amenities={it.amenities}
                                                    maxVisible={4}
                                                />
                                            </div>
                                        ) : null}
                                        {it.price ? (
                                            <p className="text-2xl font-bold text-secondary drop-shadow">
                                                {it.price}
                                            </p>
                                        ) : null}
                                        <p className="text-xs text-primary-foreground/80">
                                            {it.meta}
                                        </p>
                                        <span className="mt-2 inline-block rounded-md bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                                            {t('common.viewDetails')}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <button
                            onClick={() => scroll('l')}
                            aria-label="Previous"
                            className="absolute -left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow hover:bg-muted"
                        >
                            <ChevronLeft className={`h-5 w-5 ${accentText}`} />
                        </button>
                        <button
                            onClick={() => scroll('r')}
                            aria-label="Next"
                            className="absolute -right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow hover:bg-muted"
                        >
                            <ChevronRight className={`h-5 w-5 ${accentText}`} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
