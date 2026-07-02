import { HorizontalDeals, HDeal } from "@/components/sections/HorizontalDeals";
const ORGANIZED: HDeal[] = [
  {
    id: "o1",
    title: "Sur les Traces d'Uzak Şehir / Al Madinah Al Baida",
    price: "5 190 DT",
    meta: "8 jours · 7 nuits",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=1000&fit=crop",
    href: "/tours",
  },
  {
    id: "o2",
    title: "Antalya – Pamukkale – Fethiye",
    price: "4 290 DT",
    meta: "7 jours · 6 nuits",
    image: "https://images.unsplash.com/photo-1596395819908-2c9ea3320d7c?w=800&h=1000&fit=crop",
    href: "/tours",
  },
  {
    id: "o3",
    title: "Kuala Lumpur – Bali pack ECO",
    price: "5 990 DT",
    meta: "10 jours · 8 nuits",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=1000&fit=crop",
    href: "/tours",
  },
  {
    id: "o4",
    title: "Dubaï – Abu Dhabi Découverte",
    price: "3 890 DT",
    meta: "6 jours · 5 nuits",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=1000&fit=crop",
    href: "/tours",
  },
  {
    id: "o5",
    title: "Istanbul & Cappadoce",
    price: "3 490 DT",
    meta: "7 jours · 6 nuits",
    image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&h=1000&fit=crop",
    href: "/tours",
  },
];
const CIRCUITS: HDeal[] = [
  {
    id: "c1",
    title: "Circuit Djerba — L'Île aux Trésors",
    price: "645 DT",
    meta: "4 jours · 3 nuits",
    image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&h=1000&fit=crop",
    href: "/tours",
  },
  {
    id: "c2",
    title: "Djerba Par Vol 2026 3N/4J",
    price: "940 DT",
    meta: "4 jours · 3 nuits",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=1000&fit=crop",
    href: "/tours",
  },
  {
    id: "c3",
    title: "Circuit Djerba & Île des Flamants Roses",
    price: "630 DT",
    meta: "3 jours · 2 nuits",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=1000&fit=crop",
    href: "/tours",
  },
  {
    id: "c4",
    title: "Sahara Douz — Bivouac étoilé",
    price: "790 DT",
    meta: "4 jours · 3 nuits",
    image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&h=1000&fit=crop",
    href: "/tours",
  },
  {
    id: "c5",
    title: "Tabarka & Ain Draham Nature",
    price: "560 DT",
    meta: "3 jours · 2 nuits",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=1000&fit=crop",
    href: "/tours",
  },
];
export function OrganizedAndCircuits() {
  return (
    <>
      <HorizontalDeals
        eyebrow="Nos meilleurs"
        title="Voyages Organisés"
        description="Trouvez les meilleures destinations avec nos idées de voyage à l'étranger."
        ctaLabel="Voir liste"
        ctaHref="/tours"
        items={ORGANIZED}
        accent="secondary"
      />
      <HorizontalDeals
        eyebrow="Nos meilleurs"
        title="Circuits & Excursions"
        description="Explorez la Tunisie avec nos circuits d'exception et excursions guidées."
        ctaLabel="Voir liste"
        ctaHref="/tours"
        items={CIRCUITS}
        accent="primary"
      />
    </>
  );
}
