import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { AmenityIcons } from "@/components/cards/AmenityIcons";
import { useLanguage } from "@/contexts/LanguageContext";

export interface HDeal {
  id: string;
  title: string;
  price: string;
  meta: string;
  image: string;
  href: string;
  amenities?: Array<{ name: Record<string, string>; icon: string }>;
}
interface Props {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  items: HDeal[];
  accent?: "primary" | "secondary";
}
export function HorizontalDeals({ eyebrow, title, description, ctaLabel, ctaHref, items, accent = "primary" }: Props) {
  const { t } = useLanguage();
  const scroller = useRef<HTMLDivElement>(null);
  const scroll = (dir: "l" | "r") => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: (dir === "l" ? -1 : 1) * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  const accentBg = accent === "primary" ? "bg-primary" : "bg-secondary";
  const accentText = accent === "primary" ? "text-primary" : "text-secondary";
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-center">
          <div>
            <p className={`italic font-serif text-2xl ${accentText} mb-1`}>{eyebrow}</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3 uppercase tracking-tight">
              {title}
            </h2>
            <div className={`w-16 h-0.5 ${accentBg} mb-4`} />
            <p className="text-sm text-muted-foreground mb-5">{description}</p>
            <Link
              to={ctaHref}
              className={`inline-block px-5 py-2.5 rounded-md ${accentBg} text-primary-foreground text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity`}
            >
              {ctaLabel}
            </Link>
          </div>
          <div className="relative min-w-0">
            <div
              ref={scroller}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((it) => (
                <Link
                  key={it.id}
                  to={it.href}
                  className="group relative shrink-0 w-[260px] md:w-[300px] aspect-[3/4] snap-start rounded-xl overflow-hidden card-elevated bg-card"
                >
                  <img
                    src={it.image}
                    alt={it.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-primary/80 to-transparent">
                    <h3 className="font-serif text-lg font-bold text-primary-foreground line-clamp-2 drop-shadow">
                      {it.title}
                    </h3>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-foreground/90 to-transparent">
                    {it.amenities?.length ? (
                      <div className="mb-1.5">
                        <AmenityIcons amenities={it.amenities} maxVisible={4} />
                      </div>
                    ) : null}
                    {it.price ? (
                      <p className="text-secondary text-2xl font-bold drop-shadow">{it.price}</p>
                    ) : null}
                    <p className="text-primary-foreground/80 text-xs">{it.meta}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold">
                      {t('common.viewDetails')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scroll("l")}
              aria-label="Previous"
              className="absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-muted"
            >
              <ChevronLeft className={`h-5 w-5 ${accentText}`} />
            </button>
            <button
              onClick={() => scroll("r")}
              aria-label="Next"
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card border border-border shadow flex items-center justify-center hover:bg-muted"
            >
              <ChevronRight className={`h-5 w-5 ${accentText}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
