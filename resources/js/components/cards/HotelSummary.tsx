import { MapPin } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { useLanguage } from '@/contexts/LanguageContext';

interface HotelSummaryProps {
    name: string;
    stars: number;
    rating: number;
    reviews: number;
    location: string;
    city: string;
    country: string;
}

export function HotelSummary({
    name,
    stars,
    rating,
    reviews,
    location,
    city,
    country,
}: HotelSummaryProps) {
    const { t } = useLanguage();

    return (
        <div className="mb-8">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h1 className="mb-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                        {name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <StarRating rating={stars} size="md" />
                        <span className="text-sm font-bold text-secondary">
                            {rating}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            ({reviews} {t('hotels.reviews')})
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                    <MapPin className="mt-1 h-4 w-4 flex-shrink-0" />
                    <div>
                        <div className="text-foreground">{location}</div>
                        <div className="text-sm">
                            {city}, {country}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
