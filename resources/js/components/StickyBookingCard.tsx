import { MapPin, MessageCircle, Phone, Star, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useLanguage } from '@/contexts/LanguageContext';
import type { FavoriteItem } from '@/contexts/FavoritesContext';

interface StickyBookingCardProps {
    // Support both hotels (minPrice) and tours (price per person)
    price?: number; // per person
    minPrice?: number; // fallback for hotels
    currency?: string;
    title?: string;
    location?: string | string[];
    description?: string;
    duration?: string;
    maxGroup?: number;
    type?: string;
    rating?: number;
    reviews?: number;
    phoneNumber?: string;
    favoriteItem?: FavoriteItem;
    onBook: () => void;
    onWhatsApp?: () => void;
}

export function StickyBookingCard({
    price,
    minPrice,
    currency = '$',
    title,
    location,
    description,
    duration,
    maxGroup,
    type,
    rating,
    reviews,
    phoneNumber,
    favoriteItem,
    onBook,
    onWhatsApp,
}: StickyBookingCardProps) {
    const { t } = useLanguage();

    const handleCall = () => {
        if (phoneNumber) window.open(`tel:${phoneNumber}`);
    };

    const displayPrice = price ?? minPrice ?? 0;
    const displayLocation = Array.isArray(location) ? location.join(', ') : location;

    return (
        <div className="sticky top-24 self-start bg-card rounded-3xl p-6 card-elevated h-fit border border-border">
            {(title || displayLocation || favoriteItem) && (
                <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                        {displayLocation && (
                            <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {displayLocation}
                            </p>
                        )}
                        {title && <h1 className="font-serif text-3xl font-bold text-foreground">{title}</h1>}
                    </div>

                    {favoriteItem && <FavoriteButton item={favoriteItem} />}
                </div>
            )}

            {rating !== undefined && (
                <div className="mb-4 flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current text-secondary" />
                    <span className="font-bold text-foreground">{rating}</span>
                    {reviews !== undefined && (
                        <span className="text-sm text-muted-foreground">({reviews} {t('hotels.reviews')})</span>
                    )}
                </div>
            )}

            {description && <p className="mb-6 text-sm text-muted-foreground">{description}</p>}

            {(duration || maxGroup !== undefined) && (
                <div className="space-y-3 border-t border-border pt-4 text-sm">
                    <div className="space-y-3 pb-4 border-b border-border">
                        {duration && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    {t('tourDetail.duration') || 'Duration'}
                                </span>
                                <span className="font-medium text-foreground">{duration}</span>
                            </div>
                        )}

                        {maxGroup !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    {t('tourDetail.group') || 'Max group'}
                                </span>
                                <span className="font-medium text-foreground">{maxGroup} travelers</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="mb-5">
                <p className="mb-1 mt-4 text-xs text-muted-foreground">
                    {t('hotelDetail.startingFrom')}
                </p>

                <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold leading-none text-secondary">
                        {currency}{displayPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {t('tours.person')}
                    </span>
                </div>

                {type && (
                    <span className="mt-3 inline-block px-2 py-1 rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {type}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <Button onClick={onBook} size="lg" className="w-full">
                    {t('hotelDetail.reserveNow')}
                </Button>

                <Button onClick={onWhatsApp} variant="outline" size="lg" className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                </Button>

                <Button onClick={handleCall} variant="ghost" size="lg" className="w-full gap-2">
                    <Phone className="h-4 w-4" />
                    {t('hotelDetail.call')}
                </Button>
            </div>

        </div>
    );
}