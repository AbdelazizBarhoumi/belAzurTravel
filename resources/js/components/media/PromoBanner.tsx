import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
interface Slide {
    id: string;
    title: string;
    subtitle: string;
    price: string;
    priceLabel: string;
    includes: string;
    cta: string;
    href: string;
    image: string;
    badge: string;
}
const SLIDES: Slide[] = [
    {
        id: 's1',
        title: 'Séjour à Djerba & Zarzis',
        subtitle: "L'île des rêves",
        price: '645 DT',
        priceLabel: 'par personne',
        includes: 'Transport + Hébergement + Excursions',
        cta: 'Réservez',
        href: '/deals',
        image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1600&h=600&fit=crop',
        badge: '3 nuits · 4 jours',
    },
    {
        id: 's2',
        title: 'Escapade à Istanbul',
        subtitle: 'Entre Orient et Occident',
        price: '1 890 DT',
        priceLabel: 'par personne',
        includes: 'Vol + Hôtel 4★ + Visites guidées',
        cta: 'Réservez',
        href: '/tours',
        image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600&h=600&fit=crop',
        badge: '5 nuits · 6 jours',
    },
    {
        id: 's3',
        title: 'Umrah Premium',
        subtitle: 'Un voyage spirituel inoubliable',
        price: '4 200 DT',
        priceLabel: 'par personne',
        includes: 'Vol direct + Hôtels 5★ + Guide',
        cta: 'Réservez',
        href: '/tours',
        image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1600&h=600&fit=crop',
        badge: '10 nuits · 11 jours',
    },
];
export function PromoBanner() {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        const t = setInterval(
            () => setIdx((i) => (i + 1) % SLIDES.length),
            6000,
        );
        return () => clearInterval(t);
    }, []);
    const prev = () => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length);
    const next = () => setIdx((i) => (i + 1) % SLIDES.length);
    const s = SLIDES[idx];
    return (
        <section className="pt-16">
            <div className="container mx-auto px-4">
                <div className="relative overflow-hidden rounded-2xl">
                    <div className="relative aspect-[1024/280] min-h-[220px] md:min-h-[280px]">
                        {SLIDES.map((slide, i) => (
                            <img
                                key={slide.id}
                                src={slide.image}
                                alt={slide.title}
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
                            />
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
                        <div className="absolute inset-0 flex items-center">
                            <div className="grid w-full grid-cols-1 items-center gap-4 px-6 md:grid-cols-2 md:px-10">
                                <div className="text-primary-foreground">
                                    <span className="mb-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                                        {s.badge}
                                    </span>
                                    <p className="text-xs uppercase tracking-widest opacity-90 md:text-sm">
                                        Il partir de
                                    </p>
                                    <div className="mb-1 flex items-baseline gap-2">
                                        <span className="font-serif text-5xl font-black text-secondary drop-shadow md:text-6xl">
                                            {s.price}
                                        </span>
                                    </div>
                                    <p className="mb-2 text-xs opacity-90 md:text-sm">
                                        {s.priceLabel}
                                    </p>
                                    <p className="text-sm font-medium md:text-base">
                                        {s.includes}
                                    </p>
                                </div>
                                <div className="hidden text-right md:block">
                                    <h3 className="font-serif text-3xl font-bold leading-tight text-primary-foreground drop-shadow-lg md:text-5xl">
                                        {s.title}
                                    </h3>
                                    <p className="mt-1 text-lg italic text-secondary drop-shadow md:text-2xl">
                                        {s.subtitle}
                                    </p>
                                    <Link
                                        to={s.href}
                                        className="mt-4 inline-block rounded-full bg-secondary px-6 py-2.5 font-semibold text-secondary-foreground shadow-lg transition-colors hover:bg-secondary/90"
                                    >
                                        {s.cta}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={prev}
                            aria-label="Previous"
                            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 backdrop-blur hover:bg-card"
                        >
                            <ChevronLeft className="h-5 w-5 text-foreground" />
                        </button>
                        <button
                            onClick={next}
                            aria-label="Next"
                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 backdrop-blur hover:bg-card"
                        >
                            <ChevronRight className="h-5 w-5 text-foreground" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                            {SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIdx(i)}
                                    className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-secondary' : 'w-1.5 bg-card/60'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
