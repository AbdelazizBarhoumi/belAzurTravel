import type { LucideIcon } from 'lucide-react';
import { AmenityIcons } from '@/components/cards/AmenityIcons';
import { getThemeIcon } from '@/data/themeIcons';

interface Props {
    tags?: string[];
    amenities?: Array<{ name: Record<string, string>; icon: string }>;
    maxVisible?: number;
    className?: string;
}

/**
 * Hotel card icon strip: renders the theme (tag) icons from `hotel.tags`.
 * Falls back to the amenity SVG icons when no tag maps to an icon.
 */
export function ThemeIcons({
    tags = [],
    amenities = [],
    maxVisible,
    className,
}: Props) {
    const icons = tags
        .map((tag) => ({ tag, Icon: getThemeIcon(tag) }))
        .filter(
            (item): item is { tag: string; Icon: LucideIcon } =>
                item.Icon !== null,
        );

    if (icons.length === 0) {
        if (amenities.length === 0) {
            return null;
        }

        return (
            <AmenityIcons
                amenities={amenities}
                maxVisible={maxVisible}
                className={className}
            />
        );
    }

    const items = maxVisible ? icons.slice(0, maxVisible) : icons;

    return (
        <div className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
            {items.map(({ tag, Icon }, i) => (
                <span
                    key={i}
                    title={tag}
                    className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted"
                >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
            ))}
        </div>
    );
}
