import type { Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Amenity {
    id: string;
    name: string;
    icon: typeof Wifi;
}

interface HotelInfoProps {
    description: string;
    amenities: Amenity[];
}

export function HotelInfo({ description, amenities }: HotelInfoProps) {
    const { t } = useLanguage();

    return (
        <div className="mb-12 space-y-8">
            {/* Description */}
            <div>
                <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                    {t('hotelDetail.aboutHotel')}
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                    {description}
                </p>
            </div>

            {/* Amenities */}
            <div>
                <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
                    {t('hotelDetail.amenities')}
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {amenities.map((amenity) => {
                        const Icon = amenity.icon;
                        return (
                            <div
                                key={amenity.id}
                                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                            >
                                <Icon className="h-5 w-5 flex-shrink-0 text-secondary" />
                                <span className="text-sm font-medium">
                                    {amenity.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
