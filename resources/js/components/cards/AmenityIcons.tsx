import { Wifi, Car, Coffee, Dumbbell, Utensils, Droplet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const AMENITY_ICONS: Record<string, LucideIcon> = {
    wifi: Wifi,
    parking: Car,
    breakfast: Coffee,
    gym: Dumbbell,
    restaurant: Utensils,
    pool: Droplet,
};

interface Props {
    amenities: Array<{ name: Record<string, string>; icon: string }>;
    maxVisible?: number;
    className?: string;
}

function getIconName(iconifyName: string): string {
    return iconifyName.split(':')[1] ?? iconifyName;
}

const ICONIFY_TO_LUCIDE: Record<string, LucideIcon> = {
    wifi: Wifi,
    car: Car,
    'food-fork-drink': Utensils,
    coffee: Coffee,
    dumbbell: Dumbbell,
    swim: Droplet,
    pool: Droplet,
    parking: Car,
    bed: Coffee,
    spa: Dumbbell,
    'air-conditioner': Droplet,
    shower: Droplet,
    television: Droplet,
    elevator: Car,
};

export function AmenityIcons({ amenities, maxVisible, className }: Props) {
    const items = maxVisible ? amenities.slice(0, maxVisible) : amenities;

    return (
        <div className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
            {items.map((amenity, i) => {
                const iconVal = amenity.icon;
                if (!iconVal) return null;

                // Raw SVG markup
                if (iconVal.startsWith('<svg')) {
                    return (
                        <span
                            key={i}
                            title={amenity.name?.en ?? ''}
                            className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted [&>svg]:h-3.5 [&>svg]:w-3.5"
                            dangerouslySetInnerHTML={{ __html: iconVal }}
                        />
                    );
                }

                // Iconify format (contains colon) — resolve to lucide if possible
                if (iconVal.includes(':')) {
                    const name = getIconName(iconVal);
                    const Lucide = ICONIFY_TO_LUCIDE[name];
                    if (Lucide) {
                        return (
                            <span
                                key={i}
                                title={amenity.name?.en ?? ''}
                                className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted"
                            >
                                <Lucide className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                        );
                    }
                    // Fallback: render as a small generic icon
                    return (
                        <span
                            key={i}
                            title={amenity.name?.en ?? ''}
                            className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted"
                        >
                            <span className="text-[8px] font-bold text-muted-foreground">
                                ?
                            </span>
                        </span>
                    );
                }

                // Lucide key
                const Lucide = AMENITY_ICONS[iconVal];
                if (Lucide) {
                    return (
                        <span
                            key={i}
                            title={amenity.name?.en ?? ''}
                            className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted"
                        >
                            <Lucide className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                    );
                }

                return null;
            })}
        </div>
    );
}
