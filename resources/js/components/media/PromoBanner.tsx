import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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
    id: "s1",
    title: "Séjour à Djerba & Zarzis",
    subtitle: "L'île des rêves",
    price: "645 DT",
    priceLabel: "par personne",
    includes: "Transport + Hébergement + Excursions",
    cta: "Réservez",
    href: "/deals",
    image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1600&h=600&fit=crop",
    badge: "3 nuits · 4 jours",
  },
  {
    id: "s2",
    title: "Escapade à Istanbul",
    subtitle: "Entre Orient et Occident",
    price: "1 890 DT",
    priceLabel: "par personne",
    includes: "Vol + Hôtel 4★ + Visites guidées",
    cta: "Réservez",
    href: "/tours",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600&h=600&fit=crop",
    badge: "5 nuits · 6 jours",
  },
  {
    id: "s3",
    title: "Umrah Premium",
    subtitle: "Un voyage spirituel inoubliable",
    price: "4 200 DT",
    priceLabel: "par personne",
    includes: "Vol direct + Hôtels 5★ + Guide",
    cta: "Réservez",
    href: "/tours",
    image: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1600&h=600&fit=crop",
    badge: "10 nuits · 11 jours",
  },
];
export function PromoBanner() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
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
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-6 md:px-10 items-center">
                <div className="text-primary-foreground">
                  <span className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold mb-3">
                    {s.badge}
                  </span>
                  <p className="text-xs md:text-sm uppercase tracking-widest opacity-90">Il partir de</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-serif text-5xl md:text-6xl font-black text-secondary drop-shadow">{s.price}</span>
                  </div>
                  <p className="text-xs md:text-sm opacity-90 mb-2">{s.priceLabel}</p>
                  <p className="text-sm md:text-base font-medium">{s.includes}</p>
                </div>
                <div className="text-right hidden md:block">
                  <h3 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground leading-tight drop-shadow-lg">
                    {s.title}
                  </h3>
                  <p className="text-secondary text-lg md:text-2xl italic mt-1 drop-shadow">{s.subtitle}</p>
                  <Link
                    to={s.href}
                    className="inline-block mt-4 px-6 py-2.5 rounded-full bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/90 transition-colors shadow-lg"
                  >
                    {s.cta}
                  </Link>
                </div>
              </div>
            </div>
            <button
              onClick={prev}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={next}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-secondary" : "w-1.5 bg-card/60"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
