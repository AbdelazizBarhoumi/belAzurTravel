import type { Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Amenity {
    id: string;
    name: string;
    icon: typeof Wifi | null;
    customSvg?: string | null;
}

interface HotelInfoProps {
    description: string;
    category?: string;
    amenities: Amenity[];
}

export function HotelInfo({
    description,
    category: _category,
    amenities,
}: HotelInfoProps) {
    const { t } = useLanguage();

    return (
        <div className="mb-12 space-y-8">
            {/* Description */}
            {description && (
                <div>
                    <h2 className="mb-4 mt-8 font-serif text-2xl font-bold text-foreground">
                        {t('hotelDetail.aboutHotel')}
                    </h2>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
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
                                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                        {amenity.customSvg ? (
                                            <span
                                                className="h-5 w-5 flex-shrink-0 [&>svg]:h-5 [&>svg]:w-5"
                                                dangerouslySetInnerHTML={{
                                                    __html: amenity.customSvg,
                                                }}
                                            />
                                        ) : Icon ? (
                                            <Icon className="h-5 w-5 flex-shrink-0 text-primary" />
                                        ) : null}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {amenity.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
